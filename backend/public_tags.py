"""Explicitly published pet profiles, finder reports and queued Telegram notices."""
import json
import math
import re
import secrets
import time
from datetime import date, datetime, timezone

FIELDS = ('ownerName', 'ownerPhone', 'messenger', 'messengerContact', 'backupName', 'backupRelation', 'backupPhone',
          'city', 'area', 'fullAddress', 'warning', 'handling', 'foodBrand', 'foodLine', 'foodAllowed',
          'foodForbidden', 'foodAllergies', 'foodNotes', 'healthAllergies', 'healthConditions',
          'healthRestrictions', 'specialNeeds', 'clinicName', 'clinicPhone')
SITUATIONS = {'with_me': 'Питомец сейчас со мной', 'seen': 'Я видел питомца', 'tag_only': 'Я нашёл только ошейник или метку'}


def init(db):
    db.executescript('''
    CREATE TABLE IF NOT EXISTS pet_tags (
      token TEXT PRIMARY KEY, pet_id TEXT UNIQUE NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
      data TEXT NOT NULL DEFAULT '{}', activated INTEGER NOT NULL DEFAULT 0, enabled INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS tag_events (
      id TEXT PRIMARY KEY, tag_token TEXT NOT NULL REFERENCES pet_tags(token) ON DELETE CASCADE,
      kind TEXT NOT NULL, data TEXT NOT NULL, created REAL NOT NULL,
      notified INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0, next_attempt REAL NOT NULL DEFAULT 0,
      request_id TEXT, UNIQUE(tag_token,request_id));
    CREATE INDEX IF NOT EXISTS tag_events_queue ON tag_events(notified,next_attempt);
    ''')


def text(data, key, limit=1500):
    value = data.get(key, '')
    if not isinstance(value, str) or len(value.strip()) > limit:
        raise ValueError('Проверьте поле «' + key + '»')
    return value.strip()


def phone(value):
    if not value:
        return ''
    normalized = re.sub(r'[\s()\-]', '', value)
    if not re.fullmatch(r'\+?[0-9]{7,15}', normalized):
        raise ValueError('Укажите номер телефона с кодом страны')
    return normalized


def owner_tag(db, pet_id, user_id, create=False):
    pet = db.execute('SELECT * FROM pets WHERE id=? AND user_id=?', (pet_id, user_id)).fetchone()
    if not pet:
        raise LookupError('Питомец не найден')
    row = db.execute('SELECT * FROM pet_tags WHERE pet_id=?', (pet_id,)).fetchone()
    if not row and create:
        db.execute('INSERT INTO pet_tags(token,pet_id) VALUES (?,?)', (secrets.token_urlsafe(24), pet_id))
        row = db.execute('SELECT * FROM pet_tags WHERE pet_id=?', (pet_id,)).fetchone()
    if not row:
        return {'petId': pet_id, 'config': {}, 'reports': []}
    return {'token': row['token'], 'petId': pet_id, 'enabled': bool(row['enabled']), 'activated': bool(row['activated']),
            'config': json.loads(row['data']), 'reports': [dict(event) | {'data': json.loads(event['data'])}
            for event in db.execute('SELECT id,kind,data,created,notified FROM tag_events WHERE tag_token=? ORDER BY created DESC LIMIT 100', (row['token'],))]}


def save(db, pet_id, user, data):
    tag = owner_tag(db, pet_id, user['id'], create=True)
    config = {key: text(data, key, 200 if key in ('ownerName', 'backupName', 'city', 'area') else 1500) for key in FIELDS}
    for key in ('ownerPhone', 'backupPhone', 'clinicPhone'):
        config[key] = phone(config[key])
    if config['messenger'] not in ('', 'telegram', 'whatsapp', 'vk'):
        raise ValueError('Выберите мессенджер из списка')
    contact = config['messengerContact'].lstrip('@')
    if config['messenger'] in ('telegram', 'vk') and contact and not re.fullmatch(r'[a-zA-Z0-9_.]{3,64}', contact):
        raise ValueError('Укажите имя пользователя без ссылки')
    if config['messenger'] == 'whatsapp':
        contact = phone(contact)
    config['messengerContact'] = contact
    config.update({key: data.get(key) is True for key in ('lost', 'shareFullAddress')})
    config['foodPhoto'] = text(data, 'foodPhoto', 2_800_000)
    if config['foodPhoto'] and not re.fullmatch(r'data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+', config['foodPhoto']):
        raise ValueError('Проверьте фото упаковки: JPEG, PNG или WebP до 2 МБ')
    enabled = data.get('enabled') is True
    if enabled and (not config['ownerName'] or not config['ownerPhone']):
        raise ValueError('Для активной карточки укажите имя владельца и телефон')
    if enabled and data.get('confirmPublish') is not True:
        raise ValueError('Подтвердите публикацию выбранных сведений')
    db.execute('UPDATE pet_tags SET data=?,enabled=?,activated=? WHERE token=?',
               (json.dumps(config, ensure_ascii=False), enabled, tag.get('activated') or enabled, tag['token']))
    return owner_tag(db, pet_id, user['id'])


def public_profile(db, token):
    row = db.execute('SELECT t.*,p.data AS pet_data,u.demo FROM pet_tags t JOIN pets p ON p.id=t.pet_id JOIN users u ON u.id=p.user_id WHERE token=?', (token,)).fetchone()
    if not row:
        return {'status': 'unavailable'}
    if not row['activated']:
        return {'status': 'unactivated'}
    if not row['enabled']:
        return {'status': 'disabled'}
    pet = json.loads(row['pet_data'])
    info = json.loads(row['data'])
    if not info.get('shareFullAddress'):
        info.pop('fullAddress', None)
    age = ''
    if pet.get('birthday'):
        birthday = date.fromisoformat(pet['birthday'])
        today = datetime.now(timezone.utc).date()
        years = today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))
        age = str(years) + ' г.' if years else 'До года'
    return {'status': 'active', 'example': bool(row['demo']), 'pet': {key: pet.get(key, '') for key in ('name', 'species', 'breed', 'photo', 'avatar', 'pixelPhoto')}, 'age': age, 'info': info}


def clean_report(data):
    situation = text(data, 'situation', 30)
    if situation not in SITUATIONS:
        raise ValueError('Выберите ситуацию')
    report = {key: text(data, key, 1500 if key == 'comment' else 500) for key in ('place', 'comment', 'finderName', 'finderPhone', 'seenAt')}
    report['finderPhone'] = phone(report['finderPhone'])
    report['situation'] = situation
    if report['seenAt']:
        try:
            seen = datetime.fromisoformat(report['seenAt'].replace('Z', '+00:00'))
            if seen.tzinfo is None or seen.timestamp() > time.time() + 300:
                raise ValueError()
        except ValueError:
            raise ValueError('Укажите время встречи без будущих дат') from None
    else:
        report['seenAt'] = datetime.now(timezone.utc).isoformat()
    location = data.get('location')
    if location is not None:
        if data.get('shareLocation') is not True or not isinstance(location, dict):
            raise ValueError('Передача местоположения требует согласия')
        lat, lon = location.get('lat'), location.get('lon')
        if any(isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) for value in (lat, lon)) or not -90 <= lat <= 90 or not -180 <= lon <= 180:
            raise ValueError('Проверьте координаты')
        report['location'] = {'lat': round(lat, 6), 'lon': round(lon, 6)}
    if not report['place'] and not report.get('location'):
        raise ValueError('Укажите адрес, ориентир или местоположение')
    photo = text(data, 'photo', 2_800_000)
    if photo and not re.fullmatch(r'data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+', photo):
        raise ValueError('Загрузите фото JPEG, PNG или WebP до 2 МБ')
    report['photo'] = photo
    return report


def add_event(db, token, kind, data, request_id=None):
    event_id = secrets.token_hex(12)
    db.execute('INSERT OR IGNORE INTO tag_events(id,tag_token,kind,data,created,request_id) VALUES (?,?,?,?,?,?)',
               (event_id, token, kind, json.dumps(data, ensure_ascii=False), time.time(), request_id))
    return event_id


def notify(db, send):
    rows = db.execute('''SELECT e.*,p.data AS pet_data,u.chat_id FROM tag_events e JOIN pet_tags t ON t.token=e.tag_token
      JOIN pets p ON p.id=t.pet_id JOIN users u ON u.id=p.user_id
      WHERE e.notified=0 AND e.next_attempt<=? AND u.chat_id IS NOT NULL AND (u.demo=0 OR u.id IN (SELECT user_id FROM sessions WHERE expires>?)) ORDER BY e.created LIMIT 10''', (time.time(), time.time())).fetchall()
    # Never hold a write transaction while waiting for the Telegram network.
    db.commit()
    for row in rows:
        name = json.loads(row['pet_data'])['name']
        if row['kind'] == 'scan':
            message = f'Метку {name} отсканировали. Это ещё не означает, что питомец найден.'
        else:
            data = json.loads(row['data'])
            message = f'О {name} поступило сообщение\n{SITUATIONS[data["situation"]]}\n{data["place"]}'
            if data.get('location'):
                point = data['location']
                message += f'\nКоординаты: {point["lat"]}, {point["lon"]}'
            message += f'\nКогда: {data["seenAt"]}\n{data["comment"]}\n{data["finderName"]} {data["finderPhone"]}'
        try:
            send('sendMessage', {'chat_id': row['chat_id'], 'text': message[:4000]})
            db.execute('UPDATE tag_events SET notified=1 WHERE id=?', (row['id'],))
        except Exception:
            db.execute('UPDATE tag_events SET attempts=attempts+1,next_attempt=? WHERE id=?',
                       (time.time() + min(3600, 30 * 2 ** min(row['attempts'], 7)), row['id']))
        db.commit()


def seed_example(db, pet_id, dog=False):
    config = {key: '' for key in FIELDS}
    config.update(ownerName='Анна' if not dog else 'Михаил', ownerPhone='+70000000000', lost=not dog,
                  city='Москва', area='Рядом с парком', shareFullAddress=False,
                  warning='Не кормить без согласования с владельцем',
                  handling='Спокойно позовите по имени. Не делайте резких движений. ' + ('На руки брать не нужно.' if dog else 'Может прятаться от незнакомых людей.'),
                  foodBrand='Monge', foodLine='Индейка', foodForbidden='Еда со стола',
                  specialNeeds='Если питомец испугался, дайте ему немного пространства.')
    db.execute('INSERT INTO pet_tags(token,pet_id,data,activated,enabled) VALUES (?,?,?,1,1)',
               (secrets.token_urlsafe(24), pet_id, json.dumps(config, ensure_ascii=False)))


def seed_torpedka(db, pet_id):
    """An explicitly fictional, complete lost-pet scenario for the jury."""
    from demo_data import TORPEDKA_TAG
    config = {key: '' for key in FIELDS}
    config.update(TORPEDKA_TAG)
    db.execute('INSERT INTO pet_tags(token,pet_id,data,activated,enabled) VALUES (?,?,?,1,1)',
               (secrets.token_urlsafe(24), pet_id, json.dumps(config, ensure_ascii=False)))
