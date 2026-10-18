"""Care dates are based on an entered prescription, never medical defaults."""
import unittest

from care_schedule import next_procedure_date, course_occurrences


class CareScheduleTests(unittest.TestCase):
    def test_calendar_months_and_leap_year(self):
        self.assertEqual(next_procedure_date('2026-01-31', 1, 'months'), '2026-02-28')
        self.assertEqual(next_procedure_date('2024-02-29', 1, 'years'), '2025-02-28')
        self.assertEqual(next_procedure_date('2026-10-17', 14, 'days'), '2026-10-31')

    def test_course_duration_interval_and_times(self):
        result = course_occurrences('2026-10-17', 5, 2, ['08:00', '20:00'])
        self.assertEqual(len(result), 6)
        self.assertEqual(result[0], ('2026-10-17', '08:00'))
        self.assertEqual(result[-1], ('2026-10-21', '20:00'))

    def test_invalid_or_unbounded_schedule(self):
        for args in [('2026-01-01', 0, 1, ['08:00']), ('2026-01-01', 3, 0, ['08:00']), ('2026-01-01', 3, 1, ['25:00']), ('2026-01-01', 365, 1, ['01:00', '02:00', '03:00'])]:
            with self.assertRaises(ValueError):
                course_occurrences(*args)
        for args in [('2026-01-01', 0, 'days'), ('2026-01-01', 1, 'hours'), ('9000-01-01', 2000, 'years')]:
            with self.assertRaises(ValueError):
                next_procedure_date(*args)

