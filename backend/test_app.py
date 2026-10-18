"""Integration tests use a temporary SQLite DB and a real local HTTP server."""
import http.cookiejar
import http.client
import base64
import struct
import zlib
import json
from pathlib import Path
import tempfile
import threading
import unittest
from datetime import datetime, timedelta
from urllib.error import HTTPError
from urllib.request import build_opener, HTTPCookieProcessor, Request, ProxyHandler
from urllib.parse import quote
from unittest.mock import patch

import server


class AppTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.original_db = server.DB
        server.DB = Path(cls.tmp.name) / 'test.sqlite3'
        server.init_db()
        cls.http = server.ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
        cls.http.attempts, cls.http.rate_lock = {}, threading.Lock()
        cls.url = f'http://127.0.0.1:{cls.http.server_port}'
        threading.Thread(target=cls.http.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        server.DB = cls.original_db
        cls.tmp.cleanup()

    def setUp(self):
        self.client = build_opener(ProxyHandler({}), HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.demo_tokens = {}
        with self.http.rate_lock:
            self.http.attempts.clear()
        self.call('demo', {})

    def call(self, path, data=None, client=None, headers=None):
        request = Request(self.url + '/api/' + path,
                          json.dumps(data).encode() if data is not None else None,
                          {'Content-Type': 'application/json', **({'X-PetCare-Demo': self.demo_tokens.get(id(client or self.client))} if id(client or self.client) in self.demo_tokens else {}), **(headers or {})})
        try:
            response = (client or self.client).open(request)
            raw = response.read()
            result = json.loads(raw) if 'json' in response.headers.get('Content-Type', '') else raw
            if path == 'demo':
                self.demo_tokens[id(client or self.client)] = result['demoToken']
            elif path in ('logout', 'auth/verify-code', 'register', 'login'):
                self.demo_tokens.pop(id(client or self.client), None)
            return response.status, result
        except HTTPError as e:
            with e:
                return e.code, json.load(e)

    def test_crud_persistence_avatar_and_search(self):
        pet = {'name': 'Кеша', 'species': 'bird', 'avatar': {'shape':'bird','color':'#45ad62','pattern':'patches','eyes':'#202020','secondary':'#ffee22','collar':'#dd5533'}}
        status, saved = self.call('pets/save', pet)
        self.assertEqual(status, 200)

        pid = saved['id']
        status, result = self.call('records/save', {'kind':'food','petId':pid,'brand':'Тест','flavor':'Зерно','amount':'10 г','date':server.now().date().isoformat(),'liked':'yes','tolerance':'good','rating':5})
        self.assertEqual(status, 200)
        status, state = self.call('state')
        p = next(p for p in state['pets'] if p['id']==pid)
        self.assertEqual(p['avatar']['color'], '#45ad62')
        self.assertEqual(p['avatar']['shape'], 'bird')
        self.assertEqual(len(p['records']), 1)
        status, answer = self.call('search', {'petId':pid,'question':'Какой корм любит Кеша?'})
        self.assertIn('Зерно', answer['answer'])
        self.assertNotIn('Monge', answer['answer'])
        self.assertEqual(answer['sources'][0]['id'], result['id'])
        status, _ = self.call('records/delete', {'petId':pid,'id':result['id']})
        self.assertEqual(status, 200)
        status, _ = self.call('pets/delete', {'petId':pid})
        self.assertEqual(status, 200)

    def test_public_tag_without_login_report_and_owner_access(self):
        _, state = self.call('state')
        pet = state['pets'][0]
        _, tag = self.call('tags/manage/' + pet['id'])
        anonymous = build_opener()
        status, profile = self.call('tags/public/' + tag['token'], client=anonymous)
        self.assertEqual(status, 200)
        self.assertEqual(profile['status'], 'active')
        self.assertNotIn('records', profile['pet'])
        path = 'tags/public/' + tag['token']
        self.assertEqual(self.call(path + '/scan', {}, client=anonymous)[0], 200)
        self.assertEqual(self.call(path + '/scan', {}, client=anonymous)[0], 200)
        report = {'situation':'seen','place':'Парк','requestId':'request-123'}
        self.assertEqual(self.call(path + '/report', {**report,'location':{'lat':55,'lon':37}}, client=anonymous)[0],400)
        self.assertEqual(self.call(path + '/report', report, client=anonymous)[0],200)
        self.assertEqual(self.call(path + '/report', report, client=anonymous)[0],200)
        _, result = self.call('tags/manage/' + pet['id'])
        self.assertEqual(len(result['reports']),2)
        self.assertEqual(self.call('tags/manage/' + pet['id'], client=anonymous)[0],401)

    def test_supplied_sprite_catalog_roundtrip_and_validation(self):
        from avatar_config import CATALOG
        for species, rig in CATALOG['species'].items():
            sprite = {'engineVersion':1, 'species':species, 'parts':{}, 'colors':{k:CATALOG['palette'][4] for k in ('base','sec','pat','eye','ext','feet','acc')}, 'pattern':CATALOG['patterns'][rig][0], 'neck':'collar'}
            status, saved = self.call('pets/save', {'name':'Питомец', 'species':species, 'avatar':{'sprite':sprite}})
            self.assertEqual(status, 200, (species,saved))
        _, state = self.call('state')
        self.assertEqual(len([p for p in state['pets'] if p['avatar'].get('sprite')]), 167)
        invalid = {'engineVersion':1, 'species':'python', 'colors':sprite['colors'], 'pattern':'tabby'}
        self.assertEqual(self.call('pets/save', {'name':'Тест','species':'python','avatar':{'sprite':invalid}})[0], 400)
        invalid.update(pattern='solid', parts={'ears':'cat'})
        self.assertEqual(self.call('pets/save', {'name':'Тест','species':'python','avatar':{'sprite':invalid}})[0], 400)

    def test_every_species_and_custom_species(self):
        for species in ['cat','dog','rabbit','bird','snake','lizard','turtle','fish','hamster','ferret','horse','hedgehog','spider','snail','frog','chicken','squirrel','Аксолотль','Улитка']:
            shape = species if species in ['cat','dog','rabbit','bird','snake','lizard','turtle','fish','hamster','ferret','horse','hedgehog','spider','snail','frog','chicken','squirrel'] else 'other'
            status, result = self.call('pets/save', {'name':'Тест '+species,'species':species,'avatar':{'shape':shape,'pattern':'spots','color':'#12ab34'}})
            self.assertEqual(status, 200, result)
        _, state = self.call('state')
        self.assertTrue(any(p['species']=='Аксолотль' for p in state['pets']))

    def test_demo_tabs_are_isolated_and_logout_discards_changes(self):
        _, first = self.call('state')
        original = first['pets'][0]
        self.call('pets/save', {**original, 'name':'Изменено в первой вкладке'})
        first_token = self.demo_tokens[id(self.client)]
        # The same browser cookie jar represents both tabs. Only the per-tab header differs.
        _, fresh = self.call('demo', {})
        second_token = fresh['demoToken']
        _, second = self.call('state')
        self.assertNotEqual(first['user']['id'], second['user']['id'])
        self.assertNotIn('Изменено в первой вкладке', [p['name'] for p in second['pets']])
        _, first_again = self.call('state', headers={'X-PetCare-Demo':first_token})
        self.assertEqual(first_again['pets'][0]['name'], 'Изменено в первой вкладке')
        self.call('logout', {})
        self.assertEqual(self.call('state', headers={'X-PetCare-Demo':second_token})[0], 401)
        self.assertEqual(self.call('state', headers={'X-PetCare-Demo':first_token})[0], 200)
        self.assertEqual(self.call('state')[0], 401)

    def test_long_telegram_descriptions_are_not_truncated(self):
        message = 'Барсик: напоминаю\n' + ('Полное описание\n' * 300) + ('\U0001f43e' * 200)
        chunks = server.message_chunks(message)
        self.assertEqual(''.join(chunks), message)
        self.assertTrue(all(len(c.encode('utf-16-le')) // 2 <= 4096 for c in chunks))
        self.assertEqual(server.message_chunks(''), [])

    def test_procedure_schedule_updates_without_duplicate_reminders(self):
        _, state = self.call('state')
        pid = self.call('pets/save', {'name': state['pets'][1]['name'] + ' (тест)', 'species': 'bird'})[1]['id']
        payload = {'kind': 'health', 'petId': pid, 'type': 'vaccine', 'title': 'Назначенная прививка', 'date': '2026-01-31', 'repeatEvery': 1, 'repeatUnit': 'months'}
        status, saved = self.call('records/save', payload)
        self.assertEqual(status, 200, saved)
        def records():
            return next(p['records'] for p in self.call('state')[1]['pets'] if p['id'] == pid)
        reminders = [r for r in records() if r['kind'] == 'reminder']
        self.assertEqual(len(reminders), 1)
        self.assertEqual(reminders[0]['date'], '2026-02-28')
        self.call('records/save', {**payload, 'id': saved['id']})
        self.assertEqual(len([r for r in records() if r['kind'] == 'reminder']), 1)
        self.call('records/save', {**payload, 'id': saved['id'], 'repeatEvery': 2})
        reminders = [r for r in records() if r['kind'] == 'reminder']
        self.assertEqual([r['date'] for r in reminders], ['2026-03-31'])
        self.call('records/delete', {'petId': pid, 'id': saved['id']})
        self.assertEqual(records(), [])

    def test_prescription_course_and_structured_reactions(self):
        _, state = self.call('state')
        pid = self.call('pets/save', {'name': state['pets'][1]['name'] + ' (тест)', 'species': 'bird'})[1]['id']
        payload = {'kind': 'health', 'petId': pid, 'type': 'medicine', 'title': 'Препарат из заключения', 'date': state['today'], 'courseStart': state['today'], 'courseDays': 3, 'courseEveryDays': 1, 'courseTimes': '08:00, 20:00', 'dose': 'По назначению врача', 'notes': 'Исходный текст заключения'}
        status, saved = self.call('records/save', payload)
        self.assertEqual(status, 200, saved)
        status, current = self.call('state')
        records = next(p['records'] for p in current['pets'] if p['id'] == pid)
        reminders = [r for r in records if r['kind'] == 'reminder']
        self.assertEqual(len(reminders), 6)
        self.assertTrue(all(r['type'] == 'medicine' and 'По назначению' in r['notes'] for r in reminders))
        first = reminders[0]
        self.call('records/save', {**first, 'petId': pid, 'done': True})
        self.call('records/save', {**payload, 'id': saved['id']})
        records = next(p['records'] for p in self.call('state')[1]['pets'] if p['id'] == pid)
        self.assertEqual(sum(r.get('done', False) for r in records), 1)
        self.assertEqual(sum(r['kind'] == 'reminder' for r in records), 6)
        food = {'kind': 'food', 'petId': pid, 'brand': 'Тест', 'flavor': 'Кролик', 'amount': '20 г', 'date': state['today'], 'liked': 'yes', 'tolerance': 'bad', 'reaction': 'gi', 'rating': 5}
        self.assertEqual(self.call('records/save', food)[0], 200)
        self.assertEqual(self.call('records/save', {**food, 'tolerance': 'good'})[0], 400)
        self.assertEqual(self.call('records/save', {**payload, 'courseTimes': '99:00'})[0], 400)

    @patch.object(server, 'PUSH_ENABLED', True)
    def test_push_subscription_isolation_and_background_schedule(self):
        _, state = self.call('state')
        pid, user_id = state['pets'][1]['id'], state['user']['id']
        key = lambda raw: base64.urlsafe_b64encode(raw).rstrip(b'=').decode()
        subscription = {'endpoint': 'https://fcm.googleapis.com/fcm/send/test-' + server.uid(), 'keys': {'p256dh': key(b'\x04' + b'x' * 64), 'auth': key(b'y' * 16)}}
        self.assertEqual(self.call('push/subscribe', {'subscription': {**subscription, 'endpoint': 'http://127.0.0.1/private'}})[0], 400)
        self.assertEqual(self.call('push/subscribe', {'subscription': subscription})[0], 200)
        self.assertEqual(self.call('push/subscribe', {'subscription': subscription})[0], 200)
        with server.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM push_subscriptions WHERE user_id=?', (user_id,)).fetchone()[0], 1)
            server.save_record(db, pid, 'reminder', {'title': 'Приём препарата', 'date': '2026-10-17', 'time': '08:00', 'type': 'medicine', 'channel': 'site', 'done': False, 'notes': 'Из назначения'})
            db.commit()
            with patch.object(server.push_service, 'send') as mocked:
                server.run_push_reminders(db, datetime(2026, 10, 17, 8, 10, tzinfo=server.TZ))
                self.assertEqual(mocked.call_count, 1)
                self.assertIn('Приём препарата', mocked.call_args.args[1]['body'])
                server.run_push_reminders(db, datetime(2026, 10, 17, 8, 10, tzinfo=server.TZ))
                self.assertEqual(mocked.call_count, 1)
        other = build_opener(ProxyHandler({}), HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.call('demo', {}, other)
        self.assertEqual(self.call('push/test', {}, other)[0], 400)
        self.call('push/unsubscribe', {'endpoint': subscription['endpoint']}, other)
        with server.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM push_subscriptions WHERE user_id=?', (user_id,)).fetchone()[0], 1)
        self.call('push/unsubscribe', {'endpoint': subscription['endpoint']})
        self.assertEqual(self.call('push/test', {})[0], 400)

    def test_invalid_schedule_does_not_write_partial_records(self):
        _, state = self.call('state')
        pid = self.call('pets/save', {'name': state['pets'][1]['name'] + ' (тест)', 'species': 'bird'})[1]['id']
        payload = {'petId': pid, 'kind': 'health', 'title': 'Проверка назначения', 'date': state['today'], 'type': 'vaccine'}
        for changes in [{'repeatEvery': -1}, {'repeatEvery': True}, {'repeatEvery': []}, {'repeatEvery': 1.5}, {'repeatEvery': 1, 'repeatUnit': 'hours'}, {'nextDate': 'invalid'}, {'nextDate': state['today']}, {'type': 'medicine', 'courseDays': 2, 'courseStart': state['today'], 'dose': '', 'courseTimes': '08:00'}, {'type': 'medicine', 'courseDays': 365, 'courseStart': state['today'], 'dose': 'По назначению', 'courseTimes': '08:00,12:00,20:00'}]:
            self.assertEqual(self.call('records/save', {**payload, **changes})[0], 400, changes)
        self.assertEqual(next(p['records'] for p in self.call('state')[1]['pets'] if p['id'] == pid), [])

    def test_measurements_and_pixel_photo_persist(self):
        _, state = self.call('state')
        pid = self.call('pets/save', {'name': state['pets'][1]['name'] + ' (тест)', 'species': 'bird'})[1]['id']
        payload = {'kind': 'health', 'petId': pid, 'type': 'weight', 'title': 'Контроль веса', 'date': state['today'], 'measurement': 'Вес', 'value': '0.089', 'unit': 'кг'}
        self.assertEqual(self.call('records/save', payload)[0], 200)
        self.assertEqual(self.call('records/save', {**payload, 'value': 'NaN'})[0], 400)
        self.assertEqual(self.call('records/save', {**payload, 'courseDays': []})[0], 400)
        self.assertEqual(self.call('pets/save', {'name': 'Фото', 'species': 'bird', 'pixelPhoto': 'data:image/png;base64,aGVsbG8='})[0], 400)
        def chunk(name, data):
            return struct.pack('>I', len(data)) + name + data + struct.pack('>I', zlib.crc32(name + data))
        image = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 32, 32, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress((b'\x00' + b'\x80' * 96) * 32)) + chunk(b'IEND', b'')
        pixel = 'data:image/png;base64,' + base64.b64encode(image).decode()
        status, saved = self.call('pets/save', {'name': 'Фото', 'species': 'bird', 'pixelPhoto': pixel})
        self.assertEqual(status, 200)
        actual = next(p for p in self.call('state')[1]['pets'] if p['id'] == saved['id'])
        self.assertEqual(actual['pixelPhoto'], pixel)

    def test_user_isolation(self):
        _, a = self.call('state')
        pid = a['pets'][0]['id']
        other = build_opener(ProxyHandler({}), HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.call('demo', {}, other)
        for path, data in [('pets/save',{'id':pid,'name':'Hijack','species':'cat'}),('pets/delete',{'petId':pid}),('search',{'petId':pid,'question':'корм'}),('records/save',{'petId':pid,'kind':'health','title':'x'})]:
            status, _ = self.call(path, data, other)
            self.assertEqual(status, 404)
        _, b = self.call('state', client=other)
        self.assertNotIn(pid, [p['id'] for p in b['pets']])

    def test_sql_injection_payloads_remain_data(self):
        payload = "Барсик'); DROP TABLE users; --"
        status, saved = self.call('pets/save', {'name': payload, 'species': 'cat'})
        self.assertEqual(status, 200)
        pet_id = saved['id']
        self.assertEqual(self.call('records/save', {
            'kind': 'food', 'petId': pet_id, 'brand': "Вискас' OR 1=1 --",
            'flavor': 'Курица', 'amount': '50 г', 'date': server.now().date().isoformat(),
            'liked': 'yes', 'tolerance': 'good', 'rating': 4,
        })[0], 200)
        self.assertEqual(self.call('pets/delete', {'petId': "' OR 1=1 --"})[0], 404)
        self.assertEqual(self.call('food/suggest?q=' + quote("' OR 1=1 --"))[1]['suggestions'], ["Вискас' OR 1=1 --"])
        _, state = self.call('state')
        self.assertIn(payload, [pet['name'] for pet in state['pets']])
        with server.connect() as db:
            self.assertGreater(db.execute('SELECT COUNT(*) FROM users').fetchone()[0], 0)

    def test_rejects_cross_origin_and_invalid_body_length(self):
        self.assertEqual(self.call('onboard', {}, headers={'Origin': self.url})[0], 200)
        self.assertEqual(self.call('onboard', {}, headers={'Origin': self.url.replace('http:', 'https:')})[0], 403)
        self.assertEqual(self.call('onboard', {}, headers={'Sec-Fetch-Site': 'cross-site'})[0], 403)
        connection = http.client.HTTPConnection('127.0.0.1', self.http.server_port)
        connection.putrequest('POST', '/api/onboard')
        connection.putheader('Content-Type', 'application/json')
        connection.putheader('Content-Length', 'invalid')
        connection.endheaders()
        response = connection.getresponse()
        self.assertEqual(response.status, 400)
        self.assertEqual(json.load(response)['error'], 'Некорректная длина запроса')
        connection.close()

    def test_proxy_ip_header_only_when_enabled(self):
        forged = '198.51.100.23'
        self.call('demo', {}, headers={'X-PetCare-Client-IP': forged})
        self.assertNotIn(forged, self.http.attempts)
        with patch.dict(server.os.environ, {'PETCARE_TRUST_PROXY': '1'}):
            self.call('demo', {}, headers={'X-PetCare-Client-IP': forged})
            self.assertIn(forged, self.http.attempts)

    def test_email_code_registration_login_and_session(self):
        email = 'code-' + server.uid() + '@example.test'
        client = build_opener(ProxyHandler({}), HTTPCookieProcessor(http.cookiejar.CookieJar()))
        with patch.object(server.email_auth, 'configured', return_value=True), patch.object(server.email_auth, 'send_code') as sender:
            status, challenge = self.call('auth/request-code', {'name':'Тест', 'email':email, 'mode':'register'}, client)
            self.assertEqual(status, 200, challenge)
            code = sender.call_args.args[1]
            self.assertNotIn(code, json.dumps(challenge))
            self.assertEqual(self.call('auth/request-code', {'name':'Тест','email':email,'mode':'register'}, client)[0], 429)
            self.assertEqual(self.call('auth/verify-code', {'challengeId':challenge['challengeId'], 'code':code}, client)[0], 200)
            self.assertEqual(self.call('auth/verify-code', {'challengeId':challenge['challengeId'], 'code':code}, client)[0], 400)
            _, state = self.call('state', client=client)
            self.assertEqual(state['user']['email'], email)
            self.assertEqual(state['pets'], [])
            self.call('logout', {}, client)
            self.assertEqual(self.call('state', client=client)[0], 401)
            _, challenge = self.call('auth/request-code', {'email':email,'mode':'login'}, client)
            code = sender.call_args.args[1]
            self.assertEqual(self.call('auth/verify-code', {'challengeId':challenge['challengeId'],'code':code}, client)[0], 200)
            with server.connect() as db:
                self.assertIsNone(db.execute('SELECT password FROM users WHERE email=?', (email,)).fetchone()['password'])
        self.assertEqual(self.call('register', {'name':'Тест','email':email,'password':'bypass'}, client)[0], 400)
        self.assertEqual(self.call('login', {'email':email,'password':'bypass'}, client)[0], 400)

    def test_email_code_limits_expiry_and_delivery_failure(self):
        email = 'limits-' + server.uid() + '@example.test'
        with patch.object(server.email_auth, 'configured', return_value=False):
            self.assertEqual(self.call('auth/request-code', {'email':email,'mode':'login'})[0], 503)
        with patch.object(server.email_auth, 'configured', return_value=True), patch.object(server.email_auth, 'send_code') as sender:
            _, challenge = self.call('auth/request-code', {'name':'Тест','email':email,'mode':'register'})
            code = sender.call_args.args[1]
            wrong = '999999' if code != '999999' else '000000'
            for _ in range(5):
                self.assertEqual(self.call('auth/verify-code', {'challengeId':challenge['challengeId'],'code':wrong})[0], 400)
            self.assertEqual(self.call('auth/verify-code', {'challengeId':challenge['challengeId'],'code':code})[0], 400)
            with server.connect() as db:
                db.execute('UPDATE email_codes SET created=0 WHERE email=?', (email,))
            _, challenge = self.call('auth/request-code', {'name':'Тест','email':email,'mode':'register'})
            with server.connect() as db:
                db.execute('UPDATE email_codes SET expires=0 WHERE id=?', (challenge['challengeId'],))
            self.assertEqual(self.call('auth/verify-code', {'challengeId':challenge['challengeId'],'code':sender.call_args.args[1]})[0], 400)
            sender.side_effect = RuntimeError('transport failed')
            self.assertEqual(self.call('auth/request-code', {'email':'fail-'+email,'mode':'login'})[0], 502)
            with server.connect() as db:
                self.assertIsNone(db.execute('SELECT id FROM email_codes WHERE email=?', ('fail-'+email,)).fetchone())

    def test_validation_origin_and_calendar_export(self):
        _, state = self.call('state')
        pid = state['pets'][0]['id']
        self.assertEqual(self.call('pets/save',{'name':'','species':'snake'})[0],400)
        self.assertEqual(self.call('pets/save',{'name':'test','species':'snake','weight':-2})[0],400)
        self.assertEqual(self.call('onboard',{},headers={'Origin':'https://evil.example'})[0],403)
        self.assertEqual(self.call('records/save',{'kind':'reminder','petId':pid,'title':'x','date':'2026-13-01','time':'12:00'})[0],400)
        status, calendar = self.call('calendar.ics')
        self.assertEqual(status,200)
        self.assertIn(b'BEGIN:VEVENT',calendar)
        self.assertTrue(all(len(line)<=75 for line in calendar.split(b'\r\n')))

    def test_calendar_export_respects_selected_pet(self):
        _, state = self.call('state')
        first = state['pets'][0]['id']
        _, second = self.call('pets/save', {'name':'Второй питомец','species':'cat'})
        for pet_id, title in ((first, 'Визит первого'), (second['id'], 'Визит второго')):
            self.assertEqual(self.call('records/save', {
                'kind':'reminder', 'petId':pet_id, 'title':title,
                'date':'2026-11-15', 'time':'10:00', 'type':'visit', 'channel':'site'
            })[0], 200)
        status, calendar = self.call('calendar.ics?petId=' + second['id'])
        self.assertEqual(status, 200)
        self.assertIn('Визит второго'.encode(), calendar)
        self.assertNotIn('Визит первого'.encode(), calendar)
        self.assertEqual(self.call('calendar.ics?petId=unknown')[0], 404)

    def test_food_suggestions_include_whiskas_and_only_users_history(self):
        _, pet = self.call('pets/save', {'name':'Кот','species':'cat'})
        self.call('records/save', {'kind':'food','petId':pet['id'],'brand':'Корм семьи','flavor':'Курица','amount':'50 г','date':server.now().date().isoformat(),'liked':'yes','tolerance':'good','rating':4})
        status, result = self.call('food/suggest?q=' + quote('вис'))
        self.assertEqual(status, 200)
        self.assertIn('Вискас', result['suggestions'])
        status, result = self.call('food/suggest?q=' + quote('корм'))
        self.assertEqual(status, 200)
        self.assertIn('Корм семьи', result['suggestions'])
        anonymous = build_opener()
        self.assertEqual(self.call('food/suggest?q=' + quote('вис'), client=anonymous)[0], 401)

    def test_unknown_pages_load_pixel_error_page_app(self):
        with tempfile.TemporaryDirectory() as directory:
            frontend = Path(directory) / 'frontend' / 'dist'
            frontend.mkdir(parents=True)
            (frontend / 'index.html').write_text('<div id="root"></div>', encoding='utf-8')
            with patch.object(server, 'ROOT', Path(directory) / 'backend'):
                for path, status in (('/missing-section', 404), ('/404', 404), ('/403', 403)):
                    with self.assertRaises(HTTPError) as error:
                        self.client.open(self.url + path)
                    with error.exception as response:
                        self.assertEqual(response.code, status)
                        self.assertIn('text/html', response.headers.get('Content-Type', ''))
                        self.assertIn(b'<div id="root">', response.read())
                with self.assertRaises(HTTPError) as error:
                    self.client.open(self.url + '/api/missing')
                with error.exception as response:
                    self.assertEqual(response.code, 404)
                    self.assertEqual(json.load(response), {'error': 'Маршрут не найден'})

    def test_public_documentation_has_shareable_routes(self):
        with tempfile.TemporaryDirectory() as directory:
            frontend = Path(directory) / 'frontend' / 'dist'
            frontend.mkdir(parents=True)
            for name in ('swagger.html', 'rfc.html', 'swagger-init.js'):
                (frontend / name).write_bytes((server.ROOT.parent / 'frontend' / 'public' / name).read_bytes())
            (frontend / 'openapi.json').write_bytes((server.ROOT.parent / 'docs' / 'openapi.json').read_bytes())
            with patch.object(server, 'ROOT', Path(directory) / 'backend'):
                anonymous = build_opener()
                for path, marker in (('/swagger', b'swagger-ui'), ('/rfc', 'RFC 001'.encode()), ('/swagger-init.js', b'SwaggerUIBundle')):
                    with anonymous.open(self.url + path) as response:
                        self.assertEqual(response.status, 200)
                        self.assertIn(marker, response.read())
                with anonymous.open(self.url + '/openapi.json') as response:
                    self.assertIn('application/json', response.headers.get('Content-Type', ''))
                    schema = json.load(response)
                    self.assertEqual(schema['openapi'], '3.0.3')
                    self.assertIn('/api/pets/save', schema['paths'])

    def test_scheduler_deduplicates_and_sends_followup_and_birthday(self):
        _, state = self.call('state')
        user_id, pid = state['user']['id'], state['pets'][0]['id']
        current = datetime(2026,10,16,20,15,tzinfo=server.TZ)
        with server.connect() as db:
            p = json.loads(db.execute('SELECT data FROM pets WHERE id=?',(pid,)).fetchone()['data'])
            p['birthday']='2022-10-16'
            db.execute('UPDATE pets SET data=? WHERE id=?',(json.dumps(p),pid))
            db.execute('UPDATE users SET chat_id=?, demo=0 WHERE id=?',('test-chat',user_id))
            rid = server.save_record(db,pid,'reminder',{'title':'Тестовый приём','date':'2026-10-16','time':'12:00','type':'visit','notes':'Тест','channel':'telegram','done':False})
            db.commit()
            with patch.object(server,'telegram',return_value={}) as mock:
                server.run_reminders(db,current)
                messages = [c.args[1]['text'] for c in mock.call_args_list]
                self.assertTrue(any('Тестовый приём' in text for text in messages))
                self.assertTrue(any('как прошёл приём' in text for text in messages))
                self.assertTrue(any('день рождения' in text for text in messages))
                count=mock.call_count
                server.run_reminders(db,current)
                self.assertEqual(mock.call_count,count)
                # Rescheduling the same reminder must create a new delivery occurrence.
                row = db.execute('SELECT data FROM records WHERE id=?',(rid,)).fetchone()
                record = json.loads(row['data'])
                record['time']='13:00'
                server.save_record(db,pid,'reminder',record,rid)
                db.commit()
                server.run_reminders(db,current)
                self.assertEqual(mock.call_count,count+2)
                # A recorded visit suppresses the evening request for its conclusion.
                server.save_record(db,pid,'health',{'type':'visit','title':'Приём','date':'2026-10-16','notes':'Заполнено'})
                record['time']='14:00'
                server.save_record(db,pid,'reminder',record,rid)
                db.commit()
                server.run_reminders(db,current)
                self.assertEqual(mock.call_count,count+3)


    def test_username_accounts_persist_and_remain_private(self):
        username = 'owner_' + server.uid()
        password = 'Independent-password-2026'
        owner = build_opener(ProxyHandler({}), HTTPCookieProcessor(http.cookiejar.CookieJar()))
        outsider = build_opener(ProxyHandler({}), HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.assertEqual(self.call('register', {'username': username.upper(), 'password': password}, owner)[0], 200)
        self.assertEqual(self.call('register', {'username': username, 'password': password}, outsider)[0], 409)
        status, state = self.call('state', client=owner)
        self.assertEqual(state['user']['username'], username)
        self.assertNotIn('password', state['user'])
        self.assertFalse(state['user']['demo'])
        self.assertEqual(state['pets'], [])
        pid = self.call('pets/save', {'name':'Постоянный питомец','species':'cat'}, owner)[1]['id']
        rid = self.call('records/save', {'petId':pid,'kind':'food','brand':'Свой корм','flavor':'Индейка','amount':'30 г','date':server.now().date().isoformat(),'liked':'yes','tolerance':'good','rating':4}, owner)[1]['id']
        with server.connect() as db:
            row = db.execute('SELECT * FROM users WHERE username=?', (username,)).fetchone()
            self.assertNotEqual(row['password'], password)
            self.assertTrue(server.username_auth.verify_password(password, row['password']))
            self.assertTrue(row['password'].startswith('pbkdf2_sha256$310000$'))
            self.assertNotIn('Independent-password', row['password'])
        self.assertEqual(self.call('logout', {}, owner)[0], 200)
        self.assertEqual(self.call('state', client=owner)[0], 401)
        self.assertEqual(self.call('login', {'username':username,'password':'incorrect-password'}, owner)[0], 401)
        self.assertEqual(self.call('login', {'username':username.upper(),'password':password}, owner)[0], 200)
        pets = self.call('state', client=owner)[1]['pets']
        self.assertEqual(pets[0]['id'], pid)
        self.assertEqual(pets[0]['records'][0]['id'], rid)
        self.assertEqual(self.call('register', {'username':'other_'+server.uid(),'password':password}, outsider)[0], 200)
        for path, payload in [('pets/delete',{'petId':pid}), ('search',{'petId':pid,'question':'корм'}), ('records/delete',{'petId':pid,'id':rid})]:
            self.assertEqual(self.call(path, payload, outsider)[0], 404)

    def test_username_validation_rate_and_concurrent_reservation(self):
        from concurrent.futures import ThreadPoolExecutor
        password = 'Account-password-2026'
        for username in ['ab', '12abc', 'bad login', 'a'*33, "x';DROP TABLE users"]:
            self.assertEqual(self.call('register', {'username':username,'password':password})[0], 400)
        username = 'race_' + server.uid()
        def reserve(name):
            client = build_opener(ProxyHandler({}), HTTPCookieProcessor(http.cookiejar.CookieJar()))
            return self.call('register', {'username':name,'password':password}, client)[0]
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sorted(pool.map(reserve, [username, username.upper()])), [200,409])
        with server.connect() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM users WHERE username=?',(username,)).fetchone()[0],1)
        for _ in range(12):
            self.call('login', {'username':'missing_account','password':password})
        self.assertEqual(self.call('login', {'username':'missing_account','password':password})[0],429)

    @patch.object(server, 'BOT_TOKEN', 'test-token')
    @patch.object(server, 'BOT_NAME', 'example_bot')
    def test_demo_telegram_link_is_one_time_and_private(self):
        import telegram_runtime
        _, demo = self.call('state')
        status, linked = self.call('telegram/link', {})
        self.assertEqual(status,200)
        code = linked['url'].split('start=',1)[1]
        with patch.object(server,'telegram',return_value={}) as transport:
            telegram_runtime.process(server, {'message':{'text':'/start '+code,'chat':{'id':1234,'type':'private'}}})
            self.assertTrue(self.call('state')[1]['telegram']['connected'])
            self.assertIn('Демо подключено',transport.call_args.args[1]['text'])
            telegram_runtime.process(server, {'message':{'text':'/start '+code,'chat':{'id':5678,'type':'private'}}})
            self.assertIn('истекла',transport.call_args.args[1]['text'])
            with server.connect() as db:
                self.assertEqual(db.execute('SELECT chat_id FROM users WHERE id=?',(demo['user']['id'],)).fetchone()[0],'1234')
            telegram_runtime.process(server, {'message':{'text':'/disconnect','chat':{'id':1234,'type':'private'}}})
            self.assertFalse(self.call('state')[1]['telegram']['connected'])
            self.assertEqual(len(self.call('state')[1]['pets']),6)

    def test_telegram_welcome_buttons_and_demo_callback(self):
        import telegram_runtime
        with patch.object(server,'telegram',return_value={}) as transport, patch.dict(server.os.environ, {'PETCARE_PUBLIC_URL':'https://petcare.example'}):
            telegram_runtime.process(server, {'message':{'text':'/start','chat':{'id':8765,'type':'private'}}})
            buttons = transport.call_args.args[1]['reply_markup']['inline_keyboard']
            self.assertIn('https://petcare.example/',buttons[0][0]['url'])
            self.assertEqual(buttons[1][0]['callback_data'],'demo')
            telegram_runtime.process(server, {'callback_query':{'id':'callback-test','data':'demo','message':{'chat':{'id':8765,'type':'private'}}}})
            self.assertTrue(any(call.args[0]=='answerCallbackQuery' for call in transport.call_args_list))
            with server.connect() as db:
                user=db.execute('SELECT * FROM users WHERE chat_id=?',('8765',)).fetchone()
                self.assertEqual(user['demo'],1)
                self.assertEqual(len(server.all_pets(db,user['id'])),6)
            telegram_runtime.process(server, {'message':{'text':'/pets','chat':{'id':8765,'type':'private'}}})
            self.assertIn('Торпедка',transport.call_args.args[1]['text'])

    def test_demo_tag_notices_respect_session_lease(self):
        _, state = self.call('state')
        pet_id = state['pets'][0]['id']
        _, tag = self.call('tags/manage/' + pet_id)
        with server.connect() as db, patch.object(server, 'telegram', return_value={}) as transport:
            db.execute('UPDATE users SET chat_id=? WHERE id=?', ('lease-chat', state['user']['id']))
            server.public_tags.add_event(db, tag['token'], 'scan', {})
            server.public_tags.notify(db, transport)
            self.assertEqual(transport.call_count, 1)
            self.assertIn('отсканировали', transport.call_args.args[1]['text'])
            db.execute('UPDATE sessions SET expires=0 WHERE user_id=?', (state['user']['id'],))
            server.public_tags.add_event(db, tag['token'], 'scan', {})
            server.public_tags.notify(db, transport)
            self.assertEqual(transport.call_count, 1)

    def test_telegram_offset_is_saved_only_after_success(self):
        import telegram_runtime
        stop = threading.Event()
        offsets = []
        with server.connect() as db:
            db.execute("DELETE FROM settings WHERE key='telegram_offset'")
        def transport(method, payload):
            self.assertEqual(method, 'getUpdates')
            self.assertEqual(payload['timeout'], 25)
            offsets.append(payload['offset'])
            if len(offsets) == 3:
                stop.set()
                return []
            return [{'update_id':41,'message':{}}]
        with patch.object(server, 'BOT_NAME', 'example_bot'), patch.object(server, 'STOP', stop), patch.object(stop, 'wait', return_value=False), patch.object(server, 'telegram', side_effect=transport), patch.object(telegram_runtime.threading, 'Thread'), patch.object(telegram_runtime, 'process', side_effect=[RuntimeError('temporary failure'), None]) as process:
            telegram_runtime.run(server)
            self.assertEqual(process.call_count, 2)
        self.assertEqual(offsets, [0, 0, 42])
        with server.connect() as db:
            self.assertEqual(db.execute("SELECT value FROM settings WHERE key='telegram_offset'").fetchone()[0], '42')

    def test_expired_demo_does_not_disclose_pet_records_in_bot(self):
        import telegram_runtime
        _, state = self.call('state')
        with server.connect() as db:
            db.execute('UPDATE users SET chat_id=? WHERE id=?', ('expired-chat', state['user']['id']))
            db.execute('UPDATE sessions SET expires=0 WHERE user_id=?', (state['user']['id'],))
        with patch.object(server, 'telegram', return_value={}) as transport:
            telegram_runtime.process(server, {'message':{'text':'/pets','chat':{'id':'expired-chat','type':'private'}}})
            self.assertIn('reply_markup', transport.call_args.args[1])
            self.assertNotIn('Торпедка', transport.call_args.args[1]['text'])
        with server.connect() as db:
            self.assertIsNone(db.execute('SELECT chat_id FROM users WHERE id=?', (state['user']['id'],)).fetchone()[0])

    def test_telegram_question_sends_answer_without_extra_network_roundtrip(self):
        import telegram_runtime
        _, state = self.call('state')
        with server.connect() as db:
            db.execute('UPDATE users SET chat_id=? WHERE id=?', ('fast-chat', state['user']['id']))
        with patch.object(server, 'telegram', return_value={}) as transport, patch.object(server, 'answer_search', return_value={'answer': 'Ответ из записей'}) as search:
            telegram_runtime.process(server, {'message': {'text': 'Какой корм любит Торпедка?', 'chat': {'id': 'fast-chat', 'type': 'private'}}})
            self.assertEqual(search.call_count, 1)
            self.assertEqual([call.args[0] for call in transport.call_args_list], ['sendMessage'])
            self.assertIn('Торпедка: Ответ из записей', transport.call_args.args[1]['text'])

    def test_tag_queue_releases_sqlite_lock_between_network_attempts(self):
        _, state = self.call('state')
        _, tag = self.call('tags/manage/' + state['pets'][0]['id'])
        with server.connect() as db:
            db.execute('UPDATE users SET chat_id=? WHERE id=?', ('queue-chat', state['user']['id']))
            server.public_tags.add_event(db, tag['token'], 'scan', {})
            server.public_tags.add_event(db, tag['token'], 'report', {'situation': 'seen', 'place': 'Парк', 'seenAt': server.now().isoformat(), 'comment': '', 'finderName': '', 'finderPhone': ''})
            calls = []
            def transport(method, payload):
                self.assertFalse(db.in_transaction, 'Network call must not hold a SQLite write transaction')
                calls.append(payload['text'])
                if len(calls) == 1:
                    raise OSError('Network unavailable')
            server.public_tags.notify(db, transport)
            self.assertEqual(len(calls), 2)
            rows = db.execute('SELECT notified,attempts FROM tag_events WHERE tag_token=? ORDER BY created', (tag['token'],)).fetchall()
            self.assertEqual(sum(row['notified'] for row in rows), 1)
            self.assertEqual(sum(row['attempts'] for row in rows), 1)

    def test_linked_bot_start_has_navigation_and_callbacks(self):
        import telegram_runtime
        _, state = self.call('state')
        with server.connect() as db:
            db.execute('UPDATE users SET chat_id=? WHERE id=?', ('menu-chat', state['user']['id']))
        with patch.object(server, 'telegram', return_value={}) as transport:
            telegram_runtime.process(server, {'message': {'text': '/start', 'chat': {'id': 'menu-chat', 'type': 'private'}}})
            buttons = transport.call_args.args[1]['reply_markup']['inline_keyboard']
            self.assertTrue(any(button.get('callback_data') == 'pets' for row in buttons for button in row))
            telegram_runtime.process(server, {'callback_query': {'id': 'pets-callback', 'data': 'pets', 'message': {'chat': {'id': 'menu-chat', 'type': 'private'}}}})
            self.assertIn('Торпедка', transport.call_args.args[1]['text'])

if __name__=='__main__':
    unittest.main(verbosity=2)
