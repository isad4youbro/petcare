// Notifications are derived from saved records; no invented feeding or treatment advice.
export function companionNotice(pet, current = new Date(), ignored = new Set()) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow' }).format(current)
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', hour12: false }).format(current)
  const records = pet.records || []
  const due = records.filter(r => r.kind === 'reminder' && !r.done && r.date === today && r.time <= time && !ignored.has(`due:${r.id}:${r.date}:${r.time}`)).sort((a, b) => a.time.localeCompare(b.time))[0]
  if (due) return { key: `due:${due.id}:${due.date}:${due.time}`, title: due.title, text: `${due.time}${due.notes ? ' · ' + due.notes : ''}`, record: due }
  const visit = records.find(r => r.kind === 'reminder' && r.type === 'visit' && r.date === today && time >= '20:00' && r.time < time && !ignored.has(`visit:${r.id}:${today}`) && !records.some(v => v.kind === 'health' && v.type === 'visit' && v.date === today))
  if (visit) return { key: `visit:${visit.id}:${today}`, title: 'Как прошёл приём?', text: 'Сохрани заключение врача в моей медкарте.', action: 'health' }
  if (pet.birthday?.slice(5) === today.slice(5) && !ignored.has(`birthday:${pet.id}:${today}`)) return { key: `birthday:${pet.id}:${today}`, title: 'Сегодня мой день рождения!', text: 'Спасибо, что заботишься обо мне.' }
  return null
}
