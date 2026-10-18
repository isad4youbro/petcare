import React, { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { ArrowLeft, ArrowRight, X } from './pixel-icons'
import { Pet } from './pet'

const steps = [
  ['pet-cards', 'Ваши питомцы', 'Листайте карточки и выберите питомца.'],
  ['health', 'Медкарта', 'Сохраняйте прививки, назначения и заключения врача.'],
  ['food', 'Питание', 'Записывайте корм, порцию и реакцию питомца.'],
  ['calendar', 'Напоминания', 'Планируйте дела. Колокольчик покажет ближайшие.'],
  ['search', 'Поиск по записям', 'Спросите о корме или здоровье своего питомца.'],
]
const guidePet = { name: '', species: 'cat_domestic', avatar: { color: '#c89365' } }
const clamp = (value, low, high) => Math.max(low, Math.min(high, value))

export function Guide({ step, next, back, finish, hasPets }) {
  const ref = useRef(null), first = useRef(true)
  const [position, setPosition] = useState(null), [cat, setCat] = useState(null), [pose, setPose] = useState('sit')
  useEffect(() => {
    const previous = document.activeElement
    const siblings = [...(ref.current?.closest('.app-layout')?.children || [])].filter(element => !element.classList.contains('guide'))
    const states = siblings.map(element => element.inert)
    siblings.forEach(element => { element.inert = true })
    return () => { siblings.forEach((element, index) => { element.inert = states[index] }); (previous?.isConnected ? previous : document.querySelector('.menu-button'))?.focus({ preventScroll: true }) }
  }, [])
  useEffect(() => {
    const mobile = window.innerWidth < 760, target = steps[step][0]
    const element = document.querySelector(mobile && step > 0 ? `[data-guide-mobile="${target}"]` : `[data-guide="${target}"]`)
    element?.classList.add('guide-highlight')
    function place() {
      const box = element?.getBoundingClientRect(), width = document.documentElement.clientWidth, height = window.innerHeight
      const small = width < 760, panelHeight = ref.current?.offsetHeight || 240
      const mobileAnchor = document.querySelector(`[data-guide-mobile="${step === 0 ? 'pets' : target}"]`)?.getBoundingClientRect()
      const sidebarEdge = document.querySelector('.sidebar')?.getBoundingClientRect().right || 240
      const left = small ? 12 : clamp(sidebarEdge + 100, 16, width - 370)
      const top = small ? Math.max(12, (mobileAnchor?.top || height - 66) - 72 - panelHeight) : clamp((box?.top || 140) - 25, 90, height - panelHeight - 20)
      setPosition(small ? { left, bottom: height - (mobileAnchor?.top || height - 66) + 72 } : { left, top })
      const x = small ? clamp((mobileAnchor?.left || 12) + (mobileAnchor?.width || 64) / 2 - 28, 12, width - 68) : step === 0 ? left - 74 : Math.max(12, (box?.right || 240) + 10)
      const y = small ? (mobileAnchor?.top || height - 66) - 56 : clamp((box?.top || top) - 12, 65, height - 80)
      setCat(old => ({ x, y, flip: !!old && x < old.x }))
    }
    place()
    // Let a closing menu restore its focus first, then enter the tutorial.
    const focusTimer = setTimeout(() => ref.current?.focus({ preventScroll: true }), 0)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!first.current && !reduced) setPose('walk')
    first.current = false
    const timer = setTimeout(() => setPose('sit'), 850)
    window.addEventListener('resize', place)
    return () => { clearTimeout(timer); clearTimeout(focusTimer); element?.classList.remove('guide-highlight'); window.removeEventListener('resize', place) }
  }, [step])
  return <div className="guide"><div className="guide-overlay" />{cat && <div className="guide-mascot" style={{ transform: `translate(${cat.x}px,${cat.y}px)` }} aria-hidden="true"><div style={{ transform: cat.flip ? 'scaleX(-1)' : undefined }}><Pet pet={guidePet} pose={pose} /></div></div>}<section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="guide-title" className="guide-popover" style={position || { visibility: 'hidden' }} onKeyDown={event => {
    if (event.key === 'Escape') finish()
    if (event.key === 'Tab') { const controls = ref.current.querySelectorAll('button:not(:disabled)'); if (event.shiftKey && (document.activeElement === controls[0] || document.activeElement === ref.current)) { event.preventDefault(); controls[controls.length - 1].focus() } else if (!event.shiftKey && (document.activeElement === controls[controls.length - 1] || document.activeElement === ref.current)) { event.preventDefault(); controls[0].focus() } }
  }}><header><span className="guide-progress">{step + 1} / {steps.length}</span><button onClick={finish} aria-label="Закрыть обучение"><X size={17} /></button></header><h2 id="guide-title">{steps[step][1]}</h2><p>{steps[step][2]}</p><footer><Button variant="ghost" onClick={step ? back : finish}>{step ? <><ArrowLeft size={15} /> Назад</> : 'Пропустить'}</Button><Button onClick={next}>{step < 4 ? 'Далее' : hasPets ? 'Готово' : 'Создать питомца'}<ArrowRight size={15} /></Button></footer></section></div>
}
