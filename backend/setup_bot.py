"""Apply the PetCare public bot profile. Credentials stay in backend/.env."""
import json
from pathlib import Path
import secrets
from urllib.request import Request, urlopen
import server

COMMANDS = [
    {'command': 'start', 'description': 'Подключение и начало работы'},
    {'command': 'pets', 'description': 'Мои питомцы'},
    {'command': 'upcoming', 'description': 'Ближайшие напоминания'},
    {'command': 'help', 'description': 'Как пользоваться PetCare'},
]


def setup(photo):
    server.telegram('setMyName', {'name': 'PetCare | Дневник питомца'})
    server.telegram('setMyDescription', {'description': 'Забота о питомце без забытых мелочей.\n\nЯ напомню о приёме у ветеринара, прививке и обработке от паразитов, поздравлю с днём рождения и помогу найти информацию в записях.\n\nДля начала подключите Telegram в настройках PetCare.'})
    server.telegram('setMyShortDescription', {'short_description': 'Напоминания от имени питомца. Здоровье, питание и важные даты — вместе с PetCare.'})
    server.telegram('setMyCommands', {'commands': COMMANDS})
    boundary = secrets.token_hex(16)
    content = (f'--{boundary}\r\nContent-Disposition: form-data; name="photo"\r\n\r\n' + json.dumps({'type': 'static', 'photo': 'attach://avatar'}) + f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="petcare.jpg"\r\nContent-Type: image/jpeg\r\n\r\n').encode() + Path(photo).read_bytes() + f'\r\n--{boundary}--\r\n'.encode()
    request = Request(f'https://api.telegram.org/bot{server.BOT_TOKEN}/setMyProfilePhoto', content, {'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urlopen(request, timeout=30) as response:
        result = json.load(response)
    if not result.get('ok'):
        raise RuntimeError('Bot profile photo was not accepted')
    return {'name': server.telegram('getMyName', {}), 'description': server.telegram('getMyDescription', {}), 'short': server.telegram('getMyShortDescription', {}), 'commands': server.telegram('getMyCommands', {}), 'photo': True}


if __name__ == '__main__':
    import sys
    try:
        result = setup(sys.argv[1])
        print(json.dumps(result, ensure_ascii=True))
    except Exception:
        print('Bot profile setup failed. No credentials have been logged.')
        sys.exit(1)
