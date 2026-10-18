import React, { useState } from 'react'
import { Button } from './ui/button'
import { NativeSelect, NativeSelectOption } from './ui/native-select'
import { Bell, ArrowRight, Plus, Check, Utensils, HeartPulse } from './pixel-icons'
import { Brand } from './brand'
import { events, formatDate } from '../data'
import { eventTypes } from '../pets'

import { homeUrl } from '../portfolio/config'

let widgetContext = null, widgetTarget = ''
export function openWidget(petId = '') {
  const context = sessionStorage.getItem('petcare.demo') || 'account'
  if (context !== widgetContext) { widgetContext = context; widgetTarget = 'petcare-companion-' + (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`) }
  const opened = window.open(homeUrl + '?widget=1&pet=' + encodeURIComponent(petId), widgetTarget, 'popup,width=400,height=650,resizable=yes,scrollbars=yes')
  if (!opened) window.dispatchEvent(new CustomEvent('petcare-widget-fallback', { detail: petId }))
  return opened
}
export function CareWidget({ pets, today, Pet, error, openRecord, complete, embedded = false, initialPetId = '' }) {
  const preferences = sessionStorage.getItem('petcare.demo') ? sessionStorage : localStorage
  const [selected, setSelected] = useState(initialPetId || new URLSearchParams(location.search).get('pet') || pets[0]?.id || '')
  const [busy, setBusy] = useState(''), [failure, setFailure] = useState('')
  const [kinds, setKinds] = useState(() => { try { const saved = JSON.parse(preferences.getItem('petcare-widget-kinds')); return Array.isArray(saved) ? saved.filter(key => key in eventTypes) : Object.keys(eventTypes) } catch { return Object.keys(eventTypes) } })
  const pet = pets.find(p => p.id === selected) || pets[0], planned = pet ? events([pet]).filter(record => kinds.includes(record.type)) : []
  function changeKinds(key) { const next = kinds.includes(key) ? kinds.filter(kind => kind !== key) : [...kinds, key]; setKinds(next); preferences.setItem('petcare-widget-kinds', JSON.stringify(next)) }
  async function done(record) {
    if (busy) return
    setBusy(record.id); setFailure('')
    try { await complete(record) } catch (problem) { setFailure(problem.message) } finally { setBusy('') }
  }
  function openDiary() {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'petcare-navigate', petId: pet?.id }, location.origin)
      window.opener.focus()
    } else window.open(homeUrl, '_blank', 'noopener')
  }
  return <main className={'care-widget' + (embedded ? ' widget-embedded' : '')}>{!embedded && <header><Brand /><button onClick={openDiary} aria-label="Открыть дневник"><ArrowRight size={18} /></button></header>}{pet ? <>
    {embedded && <Button className="widget-detach" variant="ghost" onClick={() => openWidget(pet.id)}>В отдельном окне <ArrowRight size={15} /></Button>}<NativeSelect aria-label="Питомец в виджете" value={pet.id} onChange={event => setSelected(event.target.value)}>{pets.map(animal => <NativeSelectOption key={animal.id} value={animal.id}>{animal.name}</NativeSelectOption>)}</NativeSelect>
    <div className="widget-pet"><Pet pet={pet} pose="sit" /><div><h1>{pet.name}</h1><p>{pet.birthday?.slice(5) === today.slice(5) ? 'Сегодня день рождения!' : planned.length ? `В планах: ${planned.length}` : 'Все дела сделаны'}</p></div></div>
    <div className="widget-actions"><Button variant="outline" onClick={() => openRecord('food', null, pet.id)}><Utensils size={17} /> Корм</Button><Button variant="outline" onClick={() => openRecord('health', null, pet.id)}><HeartPulse size={17} /> Медкарта</Button><Button variant="outline" onClick={() => openRecord('reminder', null, pet.id)}><Plus size={17} /> Дело</Button></div>
    <section><h2>Ближайшие дела</h2>{planned.length ? planned.slice(0, 8).map(record => <article className="widget-event" key={record.id}><button className="widget-event-open" onClick={() => openRecord('reminder', record, pet.id)}><Bell size={16} /><span><strong>{record.title}</strong><span>{formatDate(record.date)} · {record.time}{record.date < today ? ' · Просрочено' : ''}</span>{record.notes && <p>{record.notes}</p>}</span></button><button className="notification-done" aria-label={'Выполнить: ' + record.title} disabled={!!busy} onClick={() => done(record)}><Check size={17} /></button></article>) : <p className="empty-line">Запланированных дел нет.</p>}</section>
    <details><summary>Фильтр событий</summary><div className="widget-filters">{Object.entries(eventTypes).map(([key, label]) => <label key={key}><input type="checkbox" checked={kinds.includes(key)} onChange={() => changeKinds(key)} />{label}</label>)}</div></details>
  </> : <p>Добавьте питомца в дневнике.</p>}{(failure || error) && <p role="alert" className="field-error">{failure || error}</p>}</main>
}
