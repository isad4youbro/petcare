"""Every demo animal must have valid, independent records for all sections."""
import unittest
from datetime import date
from demo_data import demo_records, HISTORY
from server import clean_record


class DemoHistoryTests(unittest.TestCase):
    def test_all_demo_animals_have_valid_history_food_and_reminders(self):
        today = date(2026, 10, 17)
        self.assertEqual(set(HISTORY), {'Барсик', 'Кеша', 'Шипучка', 'Луна', 'Плюша', 'Торпедка'})
        for name in HISTORY:
            with self.subTest(pet=name):
                records = list(demo_records(name, today))
                self.assertGreaterEqual(len(records), 10)
                self.assertEqual({kind for kind, _ in records}, {'health', 'food', 'reminder'})
                for kind, record in records:
                    clean_record(kind, record)
                    day = date.fromisoformat(record['date'])
                    if kind == 'reminder':
                        self.assertGreater(day, today)
                        self.assertEqual(record['channel'], 'telegram')
                    else:
                        self.assertLess(day, today)

    def test_new_demo_moves_dates_without_sharing_mutable_objects(self):
        first = list(demo_records('Кеша', date(2026, 10, 17)))
        second = list(demo_records('Кеша', date(2026, 10, 18)))
        for (_, a), (_, b) in zip(first, second):
            self.assertEqual((date.fromisoformat(b['date']) - date.fromisoformat(a['date'])).days, 1)
        first[0][1]['notes'] = 'changed by visitor'
        self.assertNotEqual(first[0][1]['notes'], second[0][1]['notes'])
