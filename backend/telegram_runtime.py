"""Telegram transport: immediate long polling, independent notification scheduler."""
import hashlib
import secrets
import threading
import time


def home(service, chat_id, connected=False):
    site = service.os.environ.get('PETCARE_PUBLIC_URL', '').rstrip('/')
    buttons = [[{'text': 'Открыть демо', 'callback_data': 'demo'}]]
    if site.startswith('https://'):
        buttons.insert(0, [{'text': 'Войти в свой аккаунт', 'url': site + '/?telegram=connect'}])
    if connected:
        buttons.append([{'text': 'Мои питомцы', 'callback_data': 'pets'}, {'text': 'Ближайшие дела', 'callback_data': 'upcoming'}])
    service.telegram('sendMessage', {'chat_id': chat_id,
        'text': 'PetCare — дневник питомцев. Выберите свой аккаунт или отдельное демо. Пароль вводите только на сайте, никогда в чате. После входа нажмите «Подключить Telegram» в настройках.',
        'reply_markup': {'inline_keyboard': buttons}})


def link(service, db, chat_id, code):
    user = db.execute('SELECT * FROM users WHERE link_code=? AND link_until>? AND (demo=0 OR id IN (SELECT user_id FROM sessions WHERE expires>?))', (code, time.time(), time.time())).fetchone()
    if not user:
        service.telegram('sendMessage', {'chat_id': chat_id, 'text': 'Ссылка истекла. Создайте новую в настройках PetCare.'})
        return
    db.execute('UPDATE users SET chat_id=NULL WHERE chat_id=?', (chat_id,))
    changed = db.execute('UPDATE users SET chat_id=?,link_code=NULL,link_until=NULL WHERE id=? AND link_code=? AND link_until>?',
                         (chat_id, user['id'], code, time.time())).rowcount
    db.commit()
    if changed:
        caption = 'Демо подключено на 24 часа.' if user['demo'] else 'Аккаунт подключён.'
        service.telegram('sendMessage', {'chat_id': chat_id, 'text': caption + ' Питомцы будут напоминать о делах здесь. /pets — питомцы, /upcoming — ближайшие дела, /disconnect — отключить.'})


def create_demo(service, db, chat_id):
    db.execute('UPDATE users SET chat_id=NULL WHERE chat_id=? AND demo=1 AND id NOT IN (SELECT user_id FROM sessions WHERE expires>?)', (chat_id, time.time()))
    existing = db.execute('SELECT * FROM users WHERE chat_id=?', (chat_id,)).fetchone()
    if existing:
        service.telegram('sendMessage', {'chat_id': chat_id, 'text': 'Уже подключён аккаунт. Для переключения сначала /disconnect. Данные личного аккаунта сохранятся.'})
        return
    user_id = service.uid()
    db.execute('INSERT INTO users(id,name,demo,onboarded,chat_id,created) VALUES (?,?,1,1,?,?)',
               (user_id, 'Гость Telegram', chat_id, service.now().isoformat()))
    service.Handler.seed_demo(db, user_id)
    token = secrets.token_urlsafe(32)
    # A hashed, unexposed lease keeps this isolated demo alive for 24 hours.
    db.execute('INSERT INTO sessions VALUES (?,?,?)', (hashlib.sha256(token.encode()).hexdigest(), user_id, time.time() + 86400))
    db.commit()
    service.telegram('sendMessage', {'chat_id': chat_id, 'text': 'Готово: отдельное демо на 24 часа, 6 питомцев, включая Торпедку. /pets — список, /upcoming — дела. Спросите: «Какой корм лучше переносила Торпедка?» Для связи с демо сайта подключите Telegram именно из настроек открытого демо.'})


def process(service, update):
    callback = update.get('callback_query')
    msg = callback.get('message', {}) if callback else update.get('message', {})
    chat = msg.get('chat', {})
    if chat.get('type') != 'private':
        return
    chat_id = str(chat['id'])
    if callback:
        service.telegram('answerCallbackQuery', {'callback_query_id': callback['id']})
        if callback.get('data') == 'demo':
            with service.connect() as db:
                create_demo(service, db, chat_id)
        elif callback.get('data') in ('pets', 'upcoming'):
            with service.connect() as db:
                user = db.execute('SELECT * FROM users WHERE chat_id=? AND (demo=0 OR id IN (SELECT user_id FROM sessions WHERE expires>?))', (chat_id, time.time())).fetchone()
                pets = service.all_pets(db, user['id']) if user else None
            if pets is None:
                home(service, chat_id)
            else:
                service.telegram('sendMessage', {'chat_id': chat_id, 'text': service.bot_command('/' + callback['data'], pets)})
        return
    text = msg.get('text', '').strip()[:1000]
    if not text:
        return
    command = text.split(' ', 1)[0].split('@', 1)[0]
    with service.connect() as db:
        if text.startswith('/start '):
            link(service, db, chat_id, text.split(' ', 1)[1].strip())
            return
        if command == '/disconnect':
            db.execute('UPDATE users SET chat_id=NULL,link_code=NULL,link_until=NULL WHERE chat_id=?', (chat_id,))
            db.commit()
            service.telegram('sendMessage', {'chat_id': chat_id, 'text': 'Telegram отключён. Записи на сайте сохранены.'})
            home(service, chat_id)
            return
        user = db.execute('SELECT * FROM users WHERE chat_id=? AND (demo=0 OR id IN (SELECT user_id FROM sessions WHERE expires>?))', (chat_id, time.time())).fetchone()
        if not user:
            db.execute('UPDATE users SET chat_id=NULL WHERE chat_id=? AND demo=1', (chat_id,))
            db.commit()
            home(service, chat_id)
            return
        pets = service.all_pets(db, user['id'])
    if command == '/start':
        home(service, chat_id, connected=True)
        return
    if command in ('/help', '/pets', '/upcoming'):
        service.telegram('sendMessage', {'chat_id': chat_id, 'text': service.bot_command(command, pets)})
        return
    matched = [pet for pet in pets if pet['name'].casefold() in text.casefold()]
    if matched or len(pets) == 1:
        pet = (matched or pets)[0]
        answer = service.answer_search(pet, text)
        service.telegram('sendMessage', {'chat_id': chat_id, 'text': (pet['name'] + ': ' + answer['answer'])[:4000]})
    else:
        service.telegram('sendMessage', {'chat_id': chat_id, 'text': 'Добавьте имя питомца в вопрос: ' + ', '.join(pet['name'] for pet in pets)})


def scheduler(service):
    while not service.STOP.is_set():
        try:
            with service.connect() as db:
                service.run_reminders(db)
                service.public_tags.notify(db, service.telegram)
        except Exception:
            pass  # Never expose credentials, chat IDs or medical data in logs.
        service.STOP.wait(15)


def run(service):
    threading.Thread(target=scheduler, args=(service,), daemon=True).start()
    while not service.STOP.is_set():
        try:
            if not service.BOT_NAME:
                service.BOT_NAME = service.telegram('getMe', {})['username']
            with service.connect() as db:
                row = db.execute("SELECT value FROM settings WHERE key='telegram_offset'").fetchone()
                offset = int(row['value']) if row else 0
            updates = service.telegram('getUpdates', {'offset': offset, 'timeout': 25, 'limit': 20, 'allowed_updates': ['message', 'callback_query']})
            for update in updates:
                # Acknowledge only completed updates, in order. A failure retries the same update.
                process(service, update)
                with service.connect() as db:
                    db.execute("INSERT OR REPLACE INTO settings VALUES ('telegram_offset', ?)", (str(update['update_id'] + 1),))
            service.BOT_ERROR = ''
        except Exception as error:
            code = getattr(error, 'code', None)
            if code in (401, 404):
                service.BOT_ERROR = 'Telegram отклонил токен бота. Администратору нужно проверить конфигурацию сервера.'
            elif code == 409:
                service.BOT_ERROR = 'Бот уже запущен в другом процессе. Оставьте один экземпляр Telegram worker.'
            elif code == 429:
                service.BOT_ERROR = 'Telegram временно ограничил частоту запросов. Подключение повторится автоматически.'
            else:
                service.BOT_ERROR = 'Сервер не может связаться с Telegram. Подключение повторяется автоматически; записи сохранены.'
            service.STOP.wait(3)
