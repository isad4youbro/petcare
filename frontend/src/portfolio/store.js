import fixture from './seed.json' with { type: 'json' }

export const STORAGE_KEY = 'petcare.portfolio.v1'
const clone = value => structuredClone(value)
const day = () => new Date().toLocaleDateString('sv-SE')
const id = () => globalThis.crypto.randomUUID()

/** Local demo only. No passwords, remote requests or shared owner accounts. */
export function createPortfolioStore(storage) {
  function fresh() {
    const value = clone(fixture)
    const delta = Math.round((new Date(day()) - new Date(value.today)) / 86400000)
    for (const pet of value.pets) for (const record of pet.records) {
      for (const key of ['date', 'nextDate']) if (record[key]) {
        const date = new Date(record[key] + 'T12:00:00Z')
        date.setUTCDate(date.getUTCDate() + delta)
        record[key] = date.toISOString().slice(0, 10)
      }
    }
    value.today = day()
    return value
  }
  function read() {
    try {
      const saved = JSON.parse(storage.getItem(STORAGE_KEY))
      if (saved?.pets && saved?.tags) return saved
    } catch { /* A corrupt or obsolete demo can always be reset. */ }
    return fresh()
  }
  function write(value) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(value)) }
    catch { throw new Error('Не удалось сохранить: память браузера заполнена или недоступна. Уменьшите фото либо сбросьте демо.') }
  }
  function petFor(state, petId) {
    const pet = state.pets.find(pet => pet.id === petId)
    if (!pet) throw new Error('Питомец не найден')
    return pet
  }
  function tagFor(state, petId) {
    petFor(state, petId)
    return state.tags[petId] ||= { token: 'portfolio-' + petId, config: {}, enabled: false, activated: false, reports: [] }
  }
  return {
    reset() { write(fresh()) },
    async request(path, data = {}) {
      const state = read()
      if (path === 'state') return { ...clone(state), today: day(), user: { id: 'portfolio', name: 'Гость', demo: true, onboarded: true }, telegram: { configured: false, connected: false }, portfolio: true }
      if (['demo', 'onboard', 'logout'].includes(path)) return { ok: true }
      if (path === 'portfolio/reset') { write(fresh()); return { ok: true } }
      if (path === 'pets/save') {
        if (!data.name?.trim()) throw new Error('Укажите имя питомца')
        const petId = data.id || id()
        const existing = data.id ? petFor(state, data.id) : null
        const pet = { ...clone(data), id: petId, records: existing?.records || [] }
        state.pets = [...state.pets.filter(p => p.id !== petId), pet]
        write(state)
        return { id: petId }
      }
      if (path === 'pets/delete') {
        petFor(state, data.petId)
        state.pets = state.pets.filter(p => p.id !== data.petId)
        delete state.tags[data.petId]
      } else if (path === 'records/save') {
        const pet = petFor(state, data.petId)
        const record = { ...clone(data), id: data.id || id(), channel: 'site' }
        pet.records = [record, ...pet.records.filter(r => r.id !== record.id)]
        write(state)
        return { id: record.id }
      } else if (path === 'records/delete') {
        const pet = petFor(state, data.petId)
        pet.records = pet.records.filter(r => r.id !== data.id)
      } else if (path.startsWith('tags/manage/')) return clone(tagFor(state, path.slice('tags/manage/'.length)))
      else if (path === 'tags/save') {
        const tag = tagFor(state, data.petId)
        if (data.enabled && !data.confirmPublish) throw new Error('Подтвердите публикацию выбранных сведений')
        tag.config = clone(data)
        tag.activated = true
        tag.enabled = !!data.enabled
        write(state)
        return clone(tag)
      } else if (path.startsWith('food/suggest')) {
        const query = new URLSearchParams(path.split('?')[1]).get('q')?.toLowerCase() || ''
        return { suggestions: [...new Set(state.pets.flatMap(p => p.records.filter(r => r.kind === 'food').map(r => r.brand)))].filter(name => name.toLowerCase().includes(query)).slice(0, 8) }
      } else if (path === 'search') {
        const pet = petFor(state, data.petId)
        const question = (data.question || '').toLowerCase()
        const food = /корм|питан|перенос|вкус|ел|ест/.test(question)
        const reminders = /план|когда|ближайш|напомин/.test(question)
        let records = pet.records.filter(r => food ? r.kind === 'food' : reminders ? r.kind === 'reminder' && !r.done : r.kind === 'health')
        records = records.sort((a, b) => reminders ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)).slice(0, 5)
        return { mode: 'local', answer: records.length ? records.map(r => `${r.date}: ${r.title || r.brand + ' · ' + r.flavor}. ${r.notes || ''}`).join('\n\n') : 'Подходящих записей пока нет. Добавьте наблюдения в дневник.', sources: records.map(r => ({ id: r.id, title: r.title || r.brand + ' · ' + r.flavor, date: r.date })) }
      } else if (path === 'push/config') return { enabled: false }
      else throw new Error('Эта функция требует собственного сервера. На GitHub Pages доступно локальное демо.')
      write(state)
      return { ok: true }
    },
    async publicRequest(token, action, data = {}) {
      const state = read()
      const entry = Object.entries(state.tags).find(([, tag]) => tag.token === token)
      if (!entry) return { status: 'unavailable' }
      const [petId, tag] = entry
      if (!tag.enabled) return { status: tag.activated ? 'disabled' : 'unactivated' }
      if (action === 'report' || action === 'scan') {
        if (action === 'report' && !data.place?.trim() && !(data.location && data.shareLocation)) throw new Error('Укажите место встречи')
        if (!data.requestId || !tag.reports.some(r => r.data.requestId === data.requestId)) {
          tag.reports.unshift({ id: id(), kind: action, created: Date.now() / 1000, data: { ...clone(data), seenAt: data.seenAt || new Date().toISOString() }, notified: false })
          tag.reports = tag.reports.slice(0, 100)
          write(state)
        }
        return { ok: true }
      }
      const info = clone(tag.config)
      if (!info.shareFullAddress) delete info.fullAddress
      return { status: 'active', example: true, pet: clone(petFor(state, petId)), info }
    },
  }
}

let store
export function portfolioStore() { return store ||= createPortfolioStore(localStorage) }

export async function portfolioCalendar(petId) {
  const state = await portfolioStore().request('state')
  const escape = value => String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PetCare//Portfolio//RU']
  for (const pet of state.pets.filter(p => petId === 'all' || p.id === petId)) for (const record of pet.records.filter(r => r.kind === 'reminder' && !r.done)) {
    lines.push('BEGIN:VEVENT', 'UID:' + record.id + '@petcare.local', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z'), 'DTSTART;TZID=Europe/Moscow:' + record.date.replaceAll('-', '') + 'T' + (record.time || '10:00').replace(':', '') + '00', 'SUMMARY:' + escape(pet.name + ': ' + record.title), 'DESCRIPTION:' + escape(record.notes), 'END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return new File([lines.join('\r\n') + '\r\n'], 'petcare.ics', { type: 'text/calendar' })
}
