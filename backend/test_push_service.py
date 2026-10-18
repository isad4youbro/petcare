import base64
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import push_service


class PushServiceTests(unittest.TestCase):
    def test_public_key_is_stable_and_private_key_stays_on_disk(self):
        with tempfile.TemporaryDirectory() as folder:
            first = push_service.public_key(folder)
            self.assertEqual(first, push_service.public_key(folder))
            raw = base64.urlsafe_b64decode(first + '=' * (-len(first) % 4))
            self.assertEqual(len(raw), 65)
            self.assertEqual(raw[0], 4)
            self.assertTrue((Path(folder) / 'vapid-private.pem').exists())
            with patch.object(push_service, 'webpush', return_value=object()) as send:
                push_service.send({'endpoint': 'https://fcm.googleapis.com/test'}, {'title': 'Тест'}, folder)
                self.assertEqual(send.call_count, 1)
                self.assertEqual(send.call_args.kwargs['ttl'], 86400)
                self.assertEqual(send.call_args.kwargs['vapid_private_key'], str(Path(folder) / 'vapid-private.pem'))

    def test_missing_library_and_invalid_subscriptions(self):
        with patch.object(push_service, 'AVAILABLE', False), self.assertRaises(ValueError):
            push_service.public_key('unused')
        for value in [None, {}, {'endpoint': 'https://fcm.googleapis.com/ok'}, {'endpoint': 'https://fcm.googleapis.com/ok', 'keys': {'p256dh': 'invalid', 'auth': 'invalid'}}, {'endpoint': 'https://localhost/x'}, {'endpoint': 'https://fcm.googleapis.com.attacker.example/x'}]:
            with self.assertRaises(ValueError):
                push_service.clean_subscription(value)
