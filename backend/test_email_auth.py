import os
import ssl
import unittest
from unittest.mock import MagicMock, patch
import email_auth


class EmailTransportTests(unittest.TestCase):
    def test_authenticated_tls_transports_and_message(self):
        for port in ('465', '587'):
            with self.subTest(port=port), patch.dict(os.environ, {'SMTP_HOST':'smtp.example.test', 'SMTP_PORT':port, 'SMTP_FROM':'PetCare <sender@example.test>', 'SMTP_USER':'smtp-user', 'SMTP_PASSWORD':'test-only-key', 'PETCARE_DISABLE_EXTERNALS':'0'}):
                factory = MagicMock()
                client = factory.return_value.__enter__.return_value
                client.send_message.return_value = {}
                with patch.object(email_auth.smtplib, 'SMTP_SSL' if port == '465' else 'SMTP', factory):
                    email_auth.send_code('owner@example.test', '123456')
                client.login.assert_called_once_with('smtp-user', 'test-only-key')
                message = client.send_message.call_args.args[0]
                self.assertEqual(message['To'], 'owner@example.test')
                self.assertIn('123456', message.get_content())
                context = factory.call_args.kwargs['context'] if port == '465' else client.starttls.call_args.kwargs['context']
                self.assertEqual(context.verify_mode, ssl.CERT_REQUIRED)
                self.assertTrue(context.check_hostname)

    def test_missing_credentials_disabled_external_and_recipient_failure(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(email_auth.configured())
            with self.assertRaises(RuntimeError):
                email_auth.send_code('owner@example.test', '123456')
        settings = {'SMTP_HOST':'smtp.example.test','SMTP_PORT':'587','SMTP_FROM':'sender@example.test','SMTP_USER':'test','SMTP_PASSWORD':'test-only','PETCARE_DISABLE_EXTERNALS':'1'}
        with patch.dict(os.environ, settings):
            with self.assertRaises(RuntimeError):
                email_auth.send_code('owner@example.test','123456')
        settings['PETCARE_DISABLE_EXTERNALS'] = '0'
        with patch.dict(os.environ, settings), patch.object(email_auth.smtplib, 'SMTP') as factory:
            factory.return_value.__enter__.return_value.send_message.return_value = {'owner@example.test': (550,b'rejected')}
            with self.assertRaises(RuntimeError):
                email_auth.send_code('owner@example.test','123456')
        settings['SMTP_PORT'] = '25'
        with patch.dict(os.environ, settings):
            with self.assertRaises(RuntimeError):
                email_auth.send_code('owner@example.test','123456')
