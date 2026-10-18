import React, { useEffect, useRef, useState } from 'react'
import { PALETTE, renderFrame } from '../../vendor/pixel-pets/src/index.js'
import { strokePoints } from '../avatar-tools'
import { Button } from './ui/button'

export function AvatarPainter({ config, update }) {
  const canvas = useRef(null), drawing = useRef(null)
  const [color, setColor] = useState(config.colors.base), [tool, setTool] = useState('brush'), [grid, setGrid] = useState(true), [cursor, setCursor] = useState({ x: 16, y: 16 }), [draft, setDraft] = useState(null)
  const current = draft || config, frame = renderFrame(current, 'stand', 0)
  useEffect(() => {
    const context = canvas.current.getContext('2d'); context.clearRect(0, 0, 320, 320)
    for (let i = 0; i < 1024; i++) { if (!frame.rgba[i * 4 + 3]) continue; context.fillStyle = `rgb(${frame.rgba[i * 4]},${frame.rgba[i * 4 + 1]},${frame.rgba[i * 4 + 2]})`; context.fillRect(i % 32 * 10, Math.floor(i / 32) * 10, 10, 10) }
    if (grid) { context.strokeStyle = '#8883'; context.lineWidth = 1; for (let i = 0; i <= 32; i++) { context.beginPath(); context.moveTo(i * 10, 0); context.lineTo(i * 10, 320); context.moveTo(0, i * 10); context.lineTo(320, i * 10); context.stroke() } }
    if (document.activeElement === canvas.current) { context.strokeStyle = '#ff00ff'; context.lineWidth = 2; context.strokeRect(cursor.x * 10 + 1, cursor.y * 10 + 1, 8, 8) }
  }, [frame, grid, cursor])
  function paintAt(points, base) {
    const paint = { ...base.paint }, rendered = renderFrame(base, 'stand', 0)
    for (const point of points) { const key = rendered.keys[point.y * 32 + point.x]; if (!key) continue; if (tool === 'pick') { setColor(paint[key] || rendered.raw[point.y * 32 + point.x] || color); continue } if (tool === 'erase') delete paint[key]; else paint[key] = color }
    return { ...base, paint }
  }
  function point(e) { const r = e.currentTarget.getBoundingClientRect(); return { x: Math.max(0, Math.min(31, Math.floor((e.clientX - r.left) / r.width * 32))), y: Math.max(0, Math.min(31, Math.floor((e.clientY - r.top) / r.height * 32))) } }
  function finish() { if (drawing.current) { if (tool !== 'pick') update(drawing.current.config); drawing.current = null; setDraft(null) } }
  return <section className="avatar-painter"><div className="painter-tools">{[['brush', 'Кисть'], ['erase', 'Ластик'], ['pick', 'Пипетка']].map(([id, label]) => <Button key={id} type="button" variant={tool === id ? 'default' : 'outline'} aria-pressed={tool === id} onClick={() => setTool(id)}>{label}</Button>)}</div>
    <canvas ref={canvas} width="320" height="320" tabIndex="0" className="paint-canvas" aria-label="Раскраска питомца. Стрелки — перемещение, пробел — применить инструмент" onFocus={() => setCursor(value => ({ ...value }))} onBlur={() => setCursor(value => ({ ...value }))} onKeyDown={e => { const deltas = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }; if (deltas[e.key]) { e.preventDefault(); const [dx, dy] = deltas[e.key]; setCursor({ x: Math.max(0, Math.min(31, cursor.x + dx)), y: Math.max(0, Math.min(31, cursor.y + dy)) }) } else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); const next = paintAt([cursor], config); if (tool !== 'pick') update(next) } }} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); const p = point(e), next = paintAt([p], config); drawing.current = { point: p, config: next }; setDraft(next) }} onPointerMove={e => { if (!drawing.current) return; const p = point(e), next = paintAt(strokePoints(drawing.current.point, p), drawing.current.config); drawing.current = { point: p, config: next }; setDraft(next) }} onPointerUp={finish} onPointerCancel={finish} />
    <div className="swatches painter-colors">{PALETTE.map(hex => <button type="button" key={hex} aria-label={'Кисть #' + hex} aria-pressed={color === hex} style={{ background: '#' + hex }} onClick={() => { setColor(hex); setTool('brush') }} />)}</div>
    <div className="painter-tools"><label><input type="checkbox" checked={grid} onChange={e => setGrid(e.target.checked)} /> Сетка</label><Button type="button" variant="outline" onClick={() => update({ ...config, paint: {}, paintBase: 'white' })}>Белая основа</Button><Button type="button" variant="ghost" onClick={() => update({ ...config, paint: {}, paintBase: 'constructor' })}>Сбросить раскраску</Button></div><p className="field-hint">Рисуйте по питомцу — раскраска сохраняется при движении. Изменения можно отменить.</p>
  </section>
}
