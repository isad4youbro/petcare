import React, { useEffect, useRef, useState } from 'react'
import { Pet } from './pet'
import { createPortal } from 'react-dom'

const SIZE = 72
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const viewportBottom = () => { const viewport = window.visualViewport; return (viewport?.offsetTop || 0) + (viewport?.height || innerHeight) }
const ground = () => {
  const navigation = document.querySelector('.mobile-nav')?.getBoundingClientRect()
  const bottom = navigation?.height ? Math.min(navigation.top, viewportBottom()) : viewportBottom()
  return Math.max(0, bottom - SIZE - 8)
}

/** One pointer target; movement never captures the rest of the page. */
export function PetWalkway({ pet }) {
  const element = useRef(null)
  const motion = useRef({ x: 40, y: 0, vx: 26, vy: 0, held: false, falling: false, sleeping: false, bounces: 0, elapsed: 0, last: 0 })
  const [state, setState] = useState('walk')
  const stateRef = useRef('walk')
  function show(next) {
    if (stateRef.current !== next) { stateRef.current = next; setState(next) }
  }
  function paint() {
    const m = motion.current
    if (element.current?.firstElementChild) element.current.firstElementChild.style.transform = m.vx < 0 ? 'scaleX(-1)' : ''
    if (element.current) element.current.style.transform = 'translate3d(' + m.x + 'px,' + m.y + 'px,0)'
  }

  useEffect(() => {
    if (!pet) return
    const m = motion.current
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    Object.assign(m, { y: ground(), last: 0, held: false, falling: false, sleeping: reduced, elapsed: 0 })
    m.x = clamp(m.x, 0, Math.max(0, innerWidth - SIZE))
    show(reduced ? 'sleep' : 'walk'); paint()
    let frame
    function tick(time) {
      const dt = m.last ? Math.min((time - m.last) / 1000, .04) : 0
      m.last = time
      const floor = ground(), edge = Math.max(0, innerWidth - SIZE)
      if (m.held) {
        show(time - m.pickedAt > 1200 ? 'held-sleep' : 'held')
      } else if (m.falling) {
        m.vy += 1500 * dt; m.y += m.vy * dt
        if (m.y >= floor) {
          m.y = floor
          if (!reduced && m.bounces < 2 && m.vy > 90) { m.vy *= -.38; m.bounces += 1 }
          else { m.falling = false; m.vy = 0; m.elapsed = 0; show('walk') }
        }
      } else {
        m.y = floor
        m.elapsed += dt
        if (m.sleeping || reduced) show('sleep')
        else if (m.elapsed % 20 > 16) show('sit')
        else {
          m.x += m.vx * dt
          if (m.x <= 0 || m.x >= edge) m.vx *= -1
          show('walk')
        }
      }
      m.x = clamp(m.x, 0, edge)
      if (!m.held) m.y = Math.min(m.y, floor)
      paint(); frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [pet?.id])

  if (!pet) return null
  function pick(event) {
    if (event.button !== 0 || motion.current.held) return
    event.preventDefault()
    const m = motion.current
    Object.assign(m, { wasSleeping: m.sleeping, held: true, falling: false, sleeping: false, pickedAt: performance.now(), startX: event.clientX, startY: event.clientY, offsetX: event.clientX - m.x, offsetY: event.clientY - m.y, moved: false, pointerId: event.pointerId })
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    show('held')
  }
  function move(event) {
    const m = motion.current
    if (!m.held || m.pointerId !== event.pointerId) return
    m.moved ||= Math.hypot(event.clientX - m.startX, event.clientY - m.startY) > 6
    m.x = clamp(event.clientX - m.offsetX, 0, Math.max(0, innerWidth - SIZE))
    m.y = clamp(event.clientY - m.offsetY, 0, ground())
    paint()
  }
  function release(event, cancelled = false) {
    const m = motion.current
    if (!m.held || m.pointerId !== event.pointerId) return
    m.held = false
    if (!cancelled && !m.moved && performance.now() - m.pickedAt < 300) {
      m.sleeping = !m.wasSleeping; m.y = ground(); show(m.sleeping ? 'sleep' : 'walk')
    } else { m.falling = true; m.vy = 0; m.bounces = 0; show('falling') }
    paint()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const pose = state === 'walk' ? 'walk' : state === 'sleep' || state === 'held-sleep' ? 'sleep' : state === 'falling' ? 'jump' : 'sit'
  return createPortal(<div className="pet-companion-layer"><button ref={element} type="button" className="pet-companion" data-state={state} aria-label={'Поднять питомца ' + pet.name} title="Перетащите питомца. Нажмите, чтобы он заснул." onPointerDown={pick} onPointerMove={move} onPointerUp={release} onPointerCancel={event => release(event, true)} onLostPointerCapture={event => release(event, true)} onClick={event => { if (event.detail === 0) { motion.current.sleeping = !motion.current.sleeping; show(motion.current.sleeping ? 'sleep' : 'walk') } }}><span className="pet-companion-sprite" style={{ transform: motion.current.vx < 0 ? 'scaleX(-1)' : undefined }}><Pet key={pet.id} pet={pet} pose={pose} decorative /></span>{state === 'held-sleep' && <span className="pet-companion-zzz" aria-hidden="true">z z</span>}</button></div>, document.body)
}
