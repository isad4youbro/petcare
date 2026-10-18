export const reactions = { none: 'Не отмечена', gi: 'Проблемы с ЖКТ', allergy: 'Аллергическая реакция', other: 'Другая реакция' }
export function nextDate(start, every, unit) {
  if (!start || !Number.isInteger(Number(every)) || Number(every) < 1 || Number(every) > 3650) return ''
  const [year, month, day] = start.split('-').map(Number), value = new Date(Date.UTC(year, month - 1, day))
  if (unit === 'days') value.setUTCDate(day + Number(every))
  else {
    const months = month - 1 + Number(every) * (unit === 'years' ? 12 : 1)
    const last = new Date(Date.UTC(year, months + 1, 0)).getUTCDate()
    value.setUTCDate(1); value.setUTCMonth(months); value.setUTCDate(Math.min(day, last))
  }
  return value.toISOString().slice(0, 10)
}
export function courseSummary(start, days, every, times) {
  const count = Number(days), interval = Number(every)
  const entries = times.split(',').map(t => t.trim()).filter(Boolean)
  if (!start || !Number.isInteger(count) || count < 1 || count > 365 || !Number.isInteger(interval) || interval < 1 || interval > 365 || !entries.length || entries.some(t => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) return null
  const end = nextDate(start, count - 1 || 1, 'days')
  return { end: count === 1 ? start : end, count: Math.ceil(count / interval) * new Set(entries).size }
}
