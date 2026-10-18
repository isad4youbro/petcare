import test from 'node:test'
import assert from 'node:assert/strict'
import { cropSquare, photoPalette, strokePoints } from './avatar-tools.js'
import { createConfig, matchPhotoColors, renderFrame, validateConfig } from '../vendor/pixel-pets/src/index.js'

test('photo crop stays in bounds in portrait, landscape and zoomed images', () => {
  for (const [width, height] of [[200, 400], [400, 200], [200, 200]]) for (const zoom of [1, 2, 4]) for (const x of [-1, .5, 2]) {
    const crop = cropSquare(width, height, zoom, x, 1 - x)
    assert.ok(crop.x >= 0 && crop.y >= 0)
    assert.ok(crop.x + crop.side <= width && crop.y + crop.side <= height)
  }
})
test('photo colors ignore transparency and normalize dominant shares', () => {
  const result = photoPalette(new Uint8ClampedArray([255,255,255,255, 255,255,255,255, 0,0,0,255, 200,0,0,0]))
  assert.equal(result.length, 2)
  assert.equal(result[0].hex, 'ffffff')
  assert.equal(result[0].share, 2 / 3)
  assert.deepEqual(photoPalette(new Uint8ClampedArray([0,0,0,0])), [])
  const candidates = matchPhotoColors('dog_corgi', result, createConfig('dog_corgi'))
  assert.ok(candidates.length)
  assert.ok(candidates.every(candidate => validateConfig(candidate.config).ok))
})
test('continuous strokes include both endpoints without skipping cells', () => {
  const points = strokePoints({ x: 2, y: 3 }, { x: 12, y: 8 })
  assert.deepEqual(points[0], { x: 2, y: 3 }); assert.deepEqual(points.at(-1), { x: 12, y: 8 })
  for (let i = 1; i < points.length; i++) assert.ok(Math.abs(points[i].x - points[i - 1].x) <= 1 && Math.abs(points[i].y - points[i - 1].y) <= 1)
  assert.equal(strokePoints({ x: 2, y: 3 }, { x: 2, y: 3 }).length, 1)
})
test('manual paint survives animation through part-local keys', () => {
  const config = createConfig('cat_domestic'), frame = renderFrame(config)
  const key = frame.keys.find(Boolean); config.paint = { [key]: 'e43b44' }
  assert.ok(validateConfig(config).ok)
  assert.ok(renderFrame(config, 'walk', 1).raw.some(hex => hex === 'e43b44'))
})
