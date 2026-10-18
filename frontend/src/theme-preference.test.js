import test from 'node:test'
import assert from 'node:assert/strict'
import { readThemeMode, resolveTheme, saveThemeMode, observeSystemTheme } from './theme-preference.js'
const store = (values = {}) => ({ getItem: key => values[key] ?? null, setItem: (key, value) => { values[key] = value } })

test('new visitors follow the system; explicit choices override it', () => {
  assert.equal(readThemeMode(store(), store()), 'system')
  assert.equal(resolveTheme('system', false), 'light')
  assert.equal(resolveTheme('system', true), 'dark')
  assert.equal(resolveTheme('light', true), 'light')
  assert.equal(resolveTheme('dark', false), 'dark')
})
test('stored preference is validated and unavailable storage is harmless', () => {
  const blocked = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
  assert.equal(readThemeMode(store({ 'petcare.theme': 'invalid' }), store({ 'petcare.theme': 'dark' })), 'dark')
  assert.equal(readThemeMode(blocked, blocked), 'system')
  assert.equal(readThemeMode(store({ 'petcare.theme': 'system' }), store({ 'petcare.theme': 'dark' })), 'system')
  assert.doesNotThrow(() => saveThemeMode('light', blocked, blocked))
})
test('demo choices stay in the current tab, normal choices persist', () => {
  const demo = store({ 'petcare.demo': 'yes' }), local = store()
  saveThemeMode('dark', demo, local)
  assert.equal(demo.getItem('petcare.theme'), 'dark')
  assert.equal(local.getItem('petcare.theme'), null)
  const session = store()
  saveThemeMode('system', session, local)
  assert.equal(local.getItem('petcare.theme'), 'system')
})
test('system changes update live, manual choices hold, cleanup detaches listeners', () => {
  const listeners = new Set(), results = []
  const media = { matches: false, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) }
  const stop = observeSystemTheme('system', media, theme => results.push(theme))
  media.matches = true; for (const update of listeners) update()
  assert.deepEqual(results, ['light', 'dark'])
  stop(); assert.equal(listeners.size, 0)
  observeSystemTheme('light', media, theme => results.push(theme))()
  assert.equal(listeners.size, 0); assert.equal(results.at(-1), 'light')
  observeSystemTheme('system', media, theme => results.push(theme))()
  assert.equal(results.at(-1), 'dark')
})
test('older Safari media listeners work and are removed', () => {
  let listener, removed
  const media = { matches: true, addListener: fn => { listener = fn }, removeListener: fn => { removed = fn } }
  const results = [], stop = observeSystemTheme('system', media, theme => results.push(theme))
  media.matches = false; listener(); stop()
  assert.deepEqual(results, ['dark', 'light']); assert.equal(removed, listener)
})
