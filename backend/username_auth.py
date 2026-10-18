"""Persistent username/password accounts; no passwords enter Telegram."""
import hashlib
import hmac
import re
import secrets
import sqlite3
import time

ITERATIONS = 310000


def init(db):
    columns = {row['name'] for row in db.execute('PRAGMA table_info(users)')}
    if 'username' not in columns:
        db.execute('ALTER TABLE users ADD COLUMN username TEXT')
    db.execute('CREATE UNIQUE INDEX IF NOT EXISTS users_username ON users(username) WHERE username IS NOT NULL')


def normalize(value):
    value = value.strip().lower()
    if not re.fullmatch(r'[a-z][a-z0-9_]{2,31}', value):
        raise ValueError('Логин: 3–32 символа, латинские буквы, цифры и _. Начните с буквы.')
    return value


def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), ITERATIONS).hex()
    return '$'.join(('pbkdf2_sha256', str(ITERATIONS), salt, digest))


def verify_password(password, stored):
    try:
        algorithm, iterations, salt, digest = stored.split('$')
        if algorithm != 'pbkdf2_sha256':
            return False
        actual = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), int(iterations)).hex()
        return hmac.compare_digest(actual, digest)
    except (ValueError, TypeError, AttributeError):
        return False


def authenticate(service, handler, db, data, mode):
    raw = service.text_field(data, 'username', True, 32)
    try:
        username = normalize(raw)
    except ValueError as error:
        raise service.Problem(str(error)) from None
    password = data.get('password', '')
    if not isinstance(password, str) or not 10 <= len(password) <= 128:
        raise service.Problem('Пароль должен содержать от 10 до 128 символов')
    keys = [('account-ip', handler.client_ip()), ('account-name', username)]
    with handler.server.rate_lock:
        for key in keys:
            attempts = [stamp for stamp in handler.server.attempts.get(key, []) if time.time() - stamp < 900]
            if len(attempts) >= (30 if key[0] == 'account-ip' else 12):
                raise service.Problem('Слишком много попыток. Повторите через 15 минут.', 429)
            handler.server.attempts[key] = attempts + [time.time()]
    row = db.execute('SELECT * FROM users WHERE username=?', (username,)).fetchone()
    if mode == 'register':
        if row:
            raise service.Problem('Этот логин уже занят', 409)
        user_id = service.uid()
        encoded = hash_password(password)
        try:
            db.execute('INSERT INTO users(id,name,username,password,created) VALUES (?,?,?,?,?)',
                       (user_id, username, username, encoded, service.now().isoformat()))
        except sqlite3.IntegrityError:
            raise service.Problem('Этот логин уже занят', 409) from None
    else:
        stored = row['password'] if row else 'pbkdf2_sha256$310000$' + '00' * 16 + '$' + '00' * 32
        if not verify_password(password, stored) or not row:
            raise service.Problem('Неверный логин или пароль', 401)
        user_id = row['id']
    token = secrets.token_urlsafe(32)
    db.execute('DELETE FROM sessions WHERE expires<?', (time.time(),))
    db.execute('INSERT INTO sessions VALUES (?,?,?)',
               (hashlib.sha256(token.encode()).hexdigest(), user_id, time.time() + 30 * 86400))
    db.commit()
    secure = '; Secure' if service.os.environ.get('PETCARE_SECURE_COOKIES') == '1' else ''
    handler.send_json({'ok': True}, cookie=f'petcare_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000{secure}')
