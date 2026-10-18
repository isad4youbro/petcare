import test from 'node:test'
import assert from 'node:assert/strict'
import { companionNotice } from './companion.js'

test('reminders respect Moscow time, completion and dismissal without starving the next event', () => {
  const pet = { id:'pet', records:[{ id:'1', kind:'reminder', date:'2026-10-17', time:'10:00', title:'Приём', notes:'Взять паспорт' }, { id:'2', kind:'reminder', date:'2026-10-17', time:'11:00', title:'Обработка' }] }
  assert.equal(companionNotice(pet, new Date('2026-10-17T06:00:00Z')), null)
  assert.equal(companionNotice(pet, new Date('2026-10-17T07:00:00Z')).text, '10:00 · Взять паспорт')
  assert.equal(companionNotice(pet, new Date('2026-10-17T09:00:00Z'), new Set(['due:1:2026-10-17:10:00'])).title, 'Обработка')
  pet.records.forEach(r => { r.done = true })
  assert.equal(companionNotice(pet, new Date('2026-10-17T09:00:00Z')), null)
})
test('evening visit followup is suppressed by the saved medical conclusion', () => {
  const pet = { id:'pet', birthday:'2020-10-17', records:[{ id:'1', kind:'reminder', type:'visit', done:true, date:'2026-10-17', time:'10:00' }] }
  const current = new Date('2026-10-17T17:00:00Z')
  assert.equal(companionNotice(pet, current).action, 'health')
  pet.records.push({ kind:'health', type:'visit', date:'2026-10-17' })
  assert.equal(companionNotice(pet, current).key, 'birthday:pet:2026-10-17')
  assert.equal(companionNotice(pet, current, new Set(['birthday:pet:2026-10-17'])), null)
})
