"""Web Push transport. Credentials stay in the private data directory."""
import base64
import json
import os
from pathlib import Path
import re
import threading
from urllib.parse import urlparse

try:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from pywebpush import webpush
    AVAILABLE = True
except ImportError:
    AVAILABLE = False

LOCK = threading.Lock()


def public_key(data_dir):
    if not AVAILABLE:
        raise ValueError('Установите зависимости backend/requirements.txt')
    target = Path(data_dir) / 'vapid-private.pem'
    with LOCK:
        if not target.exists():
            key = ec.generate_private_key(ec.SECP256R1())
            with target.open('xb') as stream:
                stream.write(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
            os.chmod(target, 0o600)
        key = serialization.load_pem_private_key(target.read_bytes(), password=None)
    raw = key.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    return base64.urlsafe_b64encode(raw).rstrip(b'=').decode()


def clean_subscription(value):
    if not isinstance(value, dict) or not isinstance(value.get('endpoint'), str):
        raise ValueError('Некорректная подписка браузера')
    endpoint = value['endpoint']
    url = urlparse(endpoint)
    host = url.hostname or ''
    allowed = host in ('fcm.googleapis.com', 'updates.push.services.mozilla.com', 'push.services.mozilla.com', 'web.push.apple.com') or host.endswith('.push.apple.com') or host.endswith('.notify.windows.com')
    if len(endpoint) > 2048 or url.scheme != 'https' or not allowed or url.username or url.password or url.port not in (None, 443):
        raise ValueError('Неизвестный провайдер push-уведомлений')
    keys = value.get('keys')
    if not isinstance(keys, dict):
        raise ValueError('Не найдены ключи подписки')
    for name, length in [('p256dh', 65), ('auth', 16)]:
        text = keys.get(name, '')
        if not isinstance(text, str) or not re.fullmatch(r'[A-Za-z0-9_-]{20,100}={0,2}', text):
            raise ValueError('Некорректные ключи подписки')
        raw = base64.urlsafe_b64decode(text + '=' * (-len(text) % 4))
        if len(raw) != length or (name == 'p256dh' and raw[0] != 4):
            raise ValueError('Некорректные ключи подписки')
    return {'endpoint': endpoint, 'keys': {k: keys[k] for k in ('p256dh', 'auth')}}


def send(subscription, payload, data_dir):
    public_key(data_dir)
    return webpush(subscription_info=subscription, data=json.dumps(payload, ensure_ascii=False), vapid_private_key=str(Path(data_dir) / 'vapid-private.pem'), vapid_claims={'sub': os.environ.get('VAPID_SUBJECT', 'mailto:admin@petcare.local')}, ttl=86400, timeout=10)
