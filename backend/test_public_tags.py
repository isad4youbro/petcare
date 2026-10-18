import json
import sqlite3
import unittest

import public_tags


class PublicTagTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.row_factory = sqlite3.Row
        self.db.executescript('''PRAGMA foreign_keys=ON;
          CREATE TABLE users(id TEXT PRIMARY KEY,demo INTEGER,chat_id TEXT);
          CREATE TABLE sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires REAL);
          CREATE TABLE pets(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),data TEXT);
          INSERT INTO users VALUES ('owner',0,'123');
          INSERT INTO users VALUES ('other',0,NULL);''')
        self.db.execute('INSERT INTO pets VALUES (?,?,?)', ('pet', 'owner', json.dumps({'name':'Тест', 'species':'cat', 'birthday':'2020-01-01', 'weight':5, 'privateNotes':'private'})))
        public_tags.init(self.db)
        self.user = {'id':'owner','demo':0}

    def tearDown(self):
        self.db.close()

    def publish(self, **extra):
        return public_tags.save(self.db, 'pet', self.user, {'ownerName':'Владелец','ownerPhone':'+70000000000','enabled':True,'confirmPublish':True,**extra})

    def test_public_fields_are_explicit_and_address_needs_consent(self):
        tag = self.publish(fullAddress='Не публиковать', healthConditions='Только указанное')
        public = public_tags.public_profile(self.db, tag['token'])
        self.assertNotIn('fullAddress', public['info'])
        self.assertNotIn('weight', public['pet'])
        self.assertNotIn('privateNotes', public['pet'])
        self.assertNotIn('birthday', public['pet'])
        self.assertEqual(public['info']['healthConditions'], 'Только указанное')
        self.publish(fullAddress='Публикуемый адрес', shareFullAddress=True)
        self.assertEqual(public_tags.public_profile(self.db, tag['token'])['info']['fullAddress'], 'Публикуемый адрес')

    def test_ownership_publish_consent_and_states(self):
        with self.assertRaises(LookupError):
            public_tags.owner_tag(self.db, 'pet', 'other', create=True)
        tag = public_tags.owner_tag(self.db, 'pet', 'owner', create=True)
        self.assertEqual(public_tags.public_profile(self.db, tag['token'])['status'], 'unactivated')
        with self.assertRaises(ValueError):
            self.publish(confirmPublish=False)
        self.publish()
        public_tags.save(self.db, 'pet', self.user, {'enabled':False})
        disabled = public_tags.public_profile(self.db, tag['token'])
        self.assertEqual(disabled, {'status':'disabled'})
        self.assertEqual(public_tags.public_profile(self.db, 'bad'), {'status':'unavailable'})

    def test_coordinates_are_optional_and_require_explicit_consent(self):
        data = {'situation':'seen','place':'Возле парка'}
        self.assertNotIn('location', public_tags.clean_report(data))
        with self.assertRaises(ValueError):
            public_tags.clean_report({**data, 'location':{'lat':55,'lon':37}})
        report = public_tags.clean_report({**data, 'location':{'lat':55,'lon':37}, 'shareLocation':True})
        self.assertEqual(report['location'], {'lat':55,'lon':37})
        for lat in (True, float('nan'), 100):
            with self.assertRaises(ValueError):
                public_tags.clean_report({**data,'location':{'lat':lat,'lon':37},'shareLocation':True})
        with self.assertRaises(ValueError):
            public_tags.clean_report({'situation':'seen'})

    def test_report_validation_and_idempotency(self):
        for extra in ({'situation':'other'}, {'seenAt':'2099-01-01T00:00:00+00:00'}, {'photo':'data:image/svg+xml;base64,eA=='}, {'finderPhone':'not-a-phone'}):
            with self.assertRaises(ValueError):
                public_tags.clean_report({'situation':'seen','place':'Парк',**extra})
        token = self.publish()['token']
        report = public_tags.clean_report({'situation':'seen','place':'Парк'})
        public_tags.add_event(self.db, token, 'report', report, 'request-123')
        public_tags.add_event(self.db, token, 'report', report, 'request-123')
        self.assertEqual(len(public_tags.owner_tag(self.db,'pet','owner')['reports']),1)

    def test_separate_notification_types_and_retry(self):
        token = self.publish()['token']
        public_tags.add_event(self.db,token,'scan',{})
        report = public_tags.clean_report({'situation':'tag_only','place':'У входа','comment':'Только метка'})
        public_tags.add_event(self.db,token,'report',report,'request-123')
        sent=[]
        public_tags.notify(self.db,lambda method,data: sent.append(data['text']))
        self.assertIn('не означает',sent[0])
        self.assertIn('поступило сообщение',sent[1])
        self.assertIn('Только метка',sent[1])
        public_tags.notify(self.db,lambda method,data: sent.append(data['text']))
        self.assertEqual(len(sent),2)
        public_tags.add_event(self.db,token,'scan',{})
        def failed_send(method, data):
            raise RuntimeError('offline')
        public_tags.notify(self.db,failed_send)
        failed = self.db.execute('SELECT * FROM tag_events WHERE notified=0').fetchone()
        self.assertEqual(failed['attempts'],1)
        self.assertGreater(failed['next_attempt'],failed['created'])

    def test_invalid_messenger_and_phone_are_rejected(self):
        for extra in ({'messenger':'javascript'}, {'messenger':'telegram','messengerContact':'https://bad.test'}, {'ownerPhone':'abc'}):
            with self.assertRaises(ValueError):
                self.publish(**extra)


if __name__ == '__main__':
    unittest.main()
