"""Passwordless email transport. Never logs or returns verification codes."""
from email.message import EmailMessage
import os
import smtplib
import ssl


def configured():
    return bool(os.environ.get('SMTP_HOST') and os.environ.get('SMTP_FROM') and os.environ.get('SMTP_USER') and os.environ.get('SMTP_PASSWORD'))


def send_code(recipient, code):
    if not configured() or os.environ.get('PETCARE_DISABLE_EXTERNALS') == '1':
        raise RuntimeError('Mail delivery is not configured')
    message = EmailMessage()
    message['Subject'] = 'Код входа в PetCare'
    message['From'] = os.environ['SMTP_FROM']
    message['To'] = recipient
    message.set_content(f'Код для входа в PetCare: {code}\n\nОн действует 10 минут. Никому не сообщайте код.\nЕсли вы не запрашивали вход, просто проигнорируйте это письмо.')
    port = int(os.environ.get('SMTP_PORT', '465'))
    context = ssl.create_default_context()
    if port == 465:
        connection = smtplib.SMTP_SSL(os.environ['SMTP_HOST'], port, timeout=20, context=context)
    elif port == 587:
        connection = smtplib.SMTP(os.environ['SMTP_HOST'], port, timeout=20)
    else:
        raise RuntimeError('Use authenticated SMTP over TLS on port 465 or 587')
    with connection as client:
        if port == 587:
            client.ehlo(); client.starttls(context=context); client.ehlo()
        client.login(os.environ['SMTP_USER'], os.environ['SMTP_PASSWORD'])
        if client.send_message(message):
            raise RuntimeError('SMTP server did not accept the recipient')
