import React, { useState } from 'react'
import { Popover } from 'radix-ui'
import { Button } from './ui/button'
import { Bell, Check, Plus, ArrowRight, X } from './pixel-icons'
import { events, formatDate } from '../data'

export function RemindersPopover({ pets, today, openRecord, complete, calendar }) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(''), [error, setError] = useState('')
  const records = events(pets), overdue = records.filter(record => record.date < today), upcoming = records.filter(record => record.date >= today)
  async function done(record) {
    if (busy) return
    setBusy(record.id); setError('')
    try { await complete(record) } catch (failure) { setError(failure.message) } finally { setBusy('') }
  }
  function row(record) { return <div className="notification-row" key={record.id}><button className="notification-open" onClick={() => { setOpen(false); openRecord('reminder', record, record.pet.id) }}><strong>{record.title}</strong><span>{record.pet.name} · {formatDate(record.date)} · {record.time}</span></button><button className="notification-done" aria-label={'Выполнить: ' + record.title} disabled={!!busy} onClick={() => done(record)}><Check size={17} /></button></div> }
  return <Popover.Root open={open} onOpenChange={setOpen}><Popover.Trigger asChild><Button variant="ghost" size="icon" className="bell-button" aria-label="Ближайшие напоминания"><Bell size={18} />{records.length > 0 && <span className="bell-count">{records.length > 9 ? '9+' : records.length}</span>}</Button></Popover.Trigger><Popover.Portal><Popover.Content className="notifications-panel" align="end" sideOffset={10} collisionPadding={12} aria-label="Ближайшие напоминания"><header><h2>Напоминания</h2><Popover.Close asChild><Button size="icon" variant="ghost" aria-label="Закрыть напоминания"><X size={17} /></Button></Popover.Close></header><div className="notifications-list">{overdue.length > 0 && <section><h3>Просрочено · {overdue.length}</h3>{overdue.slice(0, 5).map(row)}</section>}{upcoming.length > 0 && <section><h3>Ближайшие</h3>{upcoming.slice(0, 7).map(row)}</section>}{!records.length && <p className="notification-empty">Пока всё сделано.</p>}</div>{error && <p role="alert" className="field-error">{error}</p>}<footer><Button variant="outline" onClick={() => { setOpen(false); openRecord('reminder') }}><Plus size={15} /> Создать</Button><Button variant="ghost" onClick={() => { setOpen(false); calendar() }}>Календарь <ArrowRight size={15} /></Button></footer><Popover.Arrow className="notification-arrow" /></Popover.Content></Popover.Portal></Popover.Root>
}
