"""Pure date calculations using only the owner's entered prescription."""
import calendar
from datetime import date, timedelta
import re


def next_procedure_date(start, every, unit):
    value = date.fromisoformat(start)
    if not isinstance(every, int) or isinstance(every, bool) or not 1 <= every <= 3650:
        raise ValueError('Интервал должен быть от 1 до 3650')
    if unit == 'days':
        return (value + timedelta(days=every)).isoformat()
    if unit not in ('months', 'years'):
        raise ValueError('Выберите дни, месяцы или годы')
    month = value.year * 12 + value.month - 1 + every * (12 if unit == 'years' else 1)
    year, month = divmod(month, 12)
    if year > 9999:
        raise ValueError('Дата выходит за допустимый диапазон')
    return date(year, month + 1, min(value.day, calendar.monthrange(year, month + 1)[1])).isoformat()


def course_occurrences(start, days, every_days, times):
    value = date.fromisoformat(start)
    if not 1 <= days <= 365 or not 1 <= every_days <= 365:
        raise ValueError('Длительность и интервал курса: от 1 до 365 дней')
    if not times or len(times) > 8 or any(not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d', t) for t in times):
        raise ValueError('Укажите время приёма в формате 08:00, 20:00; до 8 приёмов в день')
    times = sorted(set(times))
    if len(range(0, days, every_days)) * len(times) > 600:
        raise ValueError('В одном курсе может быть не более 600 напоминаний')
    return [((value + timedelta(days=offset)).isoformat(), t) for offset in range(0, days, every_days) for t in times]
