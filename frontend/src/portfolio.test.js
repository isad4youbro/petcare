import test from 'node:test'
import assert from 'node:assert/strict'
import { createPortfolioStore } from './portfolio/store.js'

function memory() {
  const values = new Map()
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) }
}
test('portfolio CRUD persists locally and reset restores six fictional pets', async () => {
  const storage = memory(), store = createPortfolioStore(storage)
  const original = await store.request('state')
  assert.equal(original.pets.length, 6)
  assert.ok(original.pets.every(p => p.records.length >= 10))
  const added = await store.request('pets/save', { name: 'Тест', species: 'cat' })
  await store.request('records/save', { petId: added.id, kind: 'food', brand: 'Example', date: '2026-10-18' })
  const reloaded = await createPortfolioStore(storage).request('state')
  assert.equal(reloaded.pets.find(p => p.id === added.id).records.length, 1)
  await store.request('pets/delete', { petId: added.id })
  await assert.rejects(store.request('records/save', { petId: added.id }))
  store.reset()
  assert.equal((await store.request('state')).pets.length, 6)
})
test('public fixture has no owner phone; report stays in this storage and is idempotent', async () => {
  const store = createPortfolioStore(memory())
  const token = 'portfolio-pet-6'
  const profile = await store.publicRequest(token)
  assert.equal(profile.pet.name, 'Торпедка')
  assert.equal(profile.info.ownerPhone, '')
  assert.equal(profile.info.backupPhone, '')
  assert.equal(profile.info.fullAddress, undefined)
  const report = { place: 'Демо-парк', situation: 'seen', requestId: 'one' }
  await store.publicRequest(token, 'report', report)
  await store.publicRequest(token, 'report', report)
  assert.equal((await store.request('tags/manage/pet-6')).reports.length, 1)
  assert.equal((await createPortfolioStore(memory()).request('tags/manage/pet-6')).reports.length, 0)
})
test('storage failures are reported, not silently presented as a successful save', async () => {
  const store = createPortfolioStore({ getItem: () => null, setItem: () => { throw new Error('quota') } })
  await assert.rejects(store.request('pets/save', { name: 'Test' }), /память/)
})
