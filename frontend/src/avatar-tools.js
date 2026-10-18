import { nearestPaletteColor } from '../vendor/pixel-pets/src/index.js'

export function cropSquare(width, height, zoom = 1, x = .5, y = .5) {
  const side = Math.min(width, height) / Math.max(1, Math.min(4, zoom))
  return { x: Math.max(0, width - side) * Math.max(0, Math.min(1, x)), y: Math.max(0, height - side) * Math.max(0, Math.min(1, y)), side }
}

// Quantize a small crop, then merge its dominant colors into the engine palette.
export function photoPalette(rgba) {
  const bins = new Map()
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue
    const key = [0, 1, 2].map(c => Math.min(255, Math.round(rgba[i + c] / 32) * 32)).join(',')
    bins.set(key, (bins.get(key) || 0) + 1)
  }
  const colors = new Map()
  for (const [key, count] of bins) {
    const hex = nearestPaletteColor(...key.split(',').map(Number))
    colors.set(hex, (colors.get(hex) || 0) + count)
  }
  const ranked = [...colors].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const total = ranked.reduce((sum, entry) => sum + entry[1], 0)
  return ranked.map(([hex, count]) => ({ hex, share: count / total }))
}

export function strokePoints(from, to) {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y))
  return Array.from({ length: steps + 1 }, (_, i) => ({ x: Math.round(from.x + (to.x - from.x) * (steps ? i / steps : 0)), y: Math.round(from.y + (to.y - from.y) * (steps ? i / steps : 0)) }))
}
