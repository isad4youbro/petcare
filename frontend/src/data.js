import { portfolioMode } from './portfolio/config.js'
import { portfolioStore, portfolioCalendar } from './portfolio/store.js'

let duplicateDemo = false, demoFingerprint = ''
const demoChannel = (() => { try { return typeof BroadcastChannel === 'function' && !new URLSearchParams(location.search).has('widget') ? new BroadcastChannel('petcare-demo-tabs') : null } catch { return null } })()
async function fingerprint(token) {
  if (!token || !globalThis.crypto?.subtle) return ''
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('')
}
const demoReady = (async () => {
  demoFingerprint = await fingerprint(sessionStorage.getItem('petcare.demo'))
  if (!demoChannel) return
  const probe = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
  demoChannel.onmessage = event => {
    const msg = event.data
    if (msg?.kind === 'probe' && demoFingerprint && msg.fingerprint === demoFingerprint) demoChannel.postMessage({ kind:'claimed', probe:msg.probe })
    if (msg?.kind === 'claimed' && msg.probe === probe) duplicateDemo = true
  }
  if (demoFingerprint) {
    demoChannel.postMessage({ kind:'probe', probe, fingerprint:demoFingerprint })
    await new Promise(resolve => setTimeout(resolve, 200))
  }
})().catch(() => { demoFingerprint = '' })

export async function api(path, data) {
  if (portfolioMode) return portfolioStore().request(path, data)
  await demoReady
  if (duplicateDemo && path !== 'demo') { duplicateDemo = false; await api('demo', {}) }
  let response
  const demoToken = sessionStorage.getItem('petcare.demo')
  const headers = { ...(demoToken ? { 'X-PetCare-Demo': demoToken } : {}) }
  try {
    response = await fetch('/api/' + path, data === undefined ? { headers } : {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
  } catch { throw new Error('Нет связи с сервером. Проверьте подключение и повторите — введённые данные сохранены в форме.') }
  let result
  try { result = await response.json() } catch { throw new Error('Сервер вернул неожиданный ответ. Повторите позже.') }
  if (!response.ok) {
    if (response.status === 401 && demoToken) {
      // Keep the failed demo credential: never silently fall back to a real account cookie.
      if (path === 'logout') { sessionStorage.removeItem('petcare.demo'); demoFingerprint = ''; return { ok:true } }
      window.dispatchEvent(new Event('petcare-demo-expired'))
    }
    const error = new Error(result.error || 'Не удалось выполнить запрос')
    error.status = response.status
    throw error
  }
  if (path === 'demo' && result.demoToken) { sessionStorage.setItem('petcare.demo', result.demoToken); demoFingerprint = await fingerprint(result.demoToken); duplicateDemo = false }
  if (path === 'logout' || path === 'auth/verify-code' || path === 'register' || path === 'login') { sessionStorage.removeItem('petcare.demo'); demoFingerprint = '' }
  return result
}

export async function fetchCalendarFile(petId = 'all') {
  if (portfolioMode) return portfolioCalendar(petId)
  const demo = sessionStorage.getItem('petcare.demo')
  const query = petId === 'all' ? '' : '?petId=' + encodeURIComponent(petId)
  const response = await fetch('/api/calendar.ics' + query, { headers: demo ? { 'X-PetCare-Demo': demo } : {} })
  if (!response.ok) throw new Error('Не удалось выгрузить календарь')
  return new File([await response.blob()], 'petcare.ics', { type: 'text/calendar' })
}

export function saveCalendarFile(file) {
  const url = URL.createObjectURL(file), link = document.createElement('a')
  link.href = url; link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 30000)
}

export const localToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow' }).format(new Date())
export function formatDate(value, year = false) {
  if (!value) return '—'
  return new Date(value + 'T12:00').toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}),
  })
}
export function age(pet, today = localToday()) {
  if (!pet.birthday) return ''
  const years = (new Date(today + 'T12:00') - new Date(pet.birthday + 'T12:00')) / 31557600000
  return years < 1 ? Math.max(0, Math.floor(years * 12)) + ' мес.' : Math.floor(years) + ' г.'
}
export function events(pets, completed = false) {
  return pets.flatMap(pet => pet.records.filter(r => r.kind === 'reminder' && r.done === completed).map(r => ({ ...r, pet })))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
}
export function recentRecords(pets, limit = 5) {
  return pets.flatMap(pet => pet.records.filter(r => r.kind !== 'reminder').map(r => ({ ...r, pet })))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
}

export function recordCount(count) {
  const mod100 = count % 100, mod10 = count % 10
  return `${count} ${mod100 >= 11 && mod100 <= 14 ? "записей" : mod10 === 1 ? "запись" : mod10 >= 2 && mod10 <= 4 ? "записи" : "записей"}`
}

export function latestWeight(pet) {
  const values = pet.records?.filter(r => r.kind === 'health' && r.type === 'weight' && r.measurement?.toLowerCase() === 'вес' && r.unit === 'кг' && r.value).sort((a,b) => b.date.localeCompare(a.date))
  return values?.[0]?.value || pet.weight
}
