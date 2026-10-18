import test from 'node:test'
import assert from 'node:assert/strict'
import { nextDate, courseSummary } from './care.js'

test('procedure preview clamps month end and leap day like the API', () => {
  assert.equal(nextDate('2026-01-31', 1, 'months'), '2026-02-28')
  assert.equal(nextDate('2024-02-29', 1, 'years'), '2025-02-28')
  assert.equal(nextDate('2026-10-17', 14, 'days'), '2026-10-31')
  assert.equal(nextDate('2026-10-17', 0, 'days'), '')
})
test('course preview uses inclusive duration and unique times', () => {
  assert.deepEqual(courseSummary('2026-10-17', 5, 2, '08:00,20:00,08:00'), { end: '2026-10-21', count: 6 })
  assert.deepEqual(courseSummary('2026-10-17', 1, 1, '08:00'), { end: '2026-10-17', count: 1 })
  assert.equal(courseSummary('2026-10-17', 2, 1, '25:00'), null)
})
