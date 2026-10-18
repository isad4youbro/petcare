import React, { useState } from 'react'
import { Input } from './ui/input'
import { NativeSelect, NativeSelectOption } from './ui/native-select'
import { Textarea } from './ui/textarea'
import { nextDate, courseSummary } from '../care'
import { formatDate } from '../data'
import { healthTypes } from '../pets'

export function CareFields({ value, today, Field }) {
  const [type, setType] = useState(value.type || 'visit')
  const [date, setDate] = useState(value.date || today)
  const [every, setEvery] = useState(value.repeatEvery || '')
  const [unit, setUnit] = useState(value.repeatUnit || 'months')
  const [start, setStart] = useState(value.courseStart || today)
  const [days, setDays] = useState(value.courseDays || '')
  const [interval, setInterval] = useState(value.courseEveryDays || 1)
  const [times, setTimes] = useState(value.courseTimes || '')
  const calculated = ['vaccine', 'parasite'].includes(type) && every ? nextDate(date, every, unit) : ''
  const course = type === 'medicine' ? courseSummary(start, days, interval, times) : null
  return <>
    <Field label="Тип записи"><NativeSelect name="type" value={type} onChange={e => setType(e.target.value)}>{Object.entries(healthTypes).map(([key, label]) => <NativeSelectOption key={key} value={key}>{label}</NativeSelectOption>)}</NativeSelect></Field>
    <Field label={type === 'medicine' ? 'Название препарата' : 'Название'}><Input name="title" defaultValue={value.title || ''} placeholder={type === 'medicine' ? 'Как указано в назначении' : 'Например, плановый осмотр'} maxLength={200} required /></Field>
    <Field label={type === 'medicine' ? 'Дата назначения' : 'Дата записи'}><Input type="date" name="date" value={date} onChange={e => setDate(e.target.value)} max={today} required /></Field>
    {['vaccine', 'parasite'].includes(type) && <fieldset className="care-schedule"><legend>Следующая процедура</legend><p>Введите интервал из назначения или инструкции к препарату.</p><div className="form-grid"><Field label="Повторить через"><Input type="number" name="repeatEvery" value={every} onChange={e => setEvery(e.target.value)} min="1" max="3650" step="1" placeholder="Интервал" /></Field><Field label="Единица интервала"><NativeSelect name="repeatUnit" value={unit} onChange={e => setUnit(e.target.value)}><NativeSelectOption value="days">Дней</NativeSelectOption><NativeSelectOption value="months">Месяцев</NativeSelectOption><NativeSelectOption value="years">Лет</NativeSelectOption></NativeSelect></Field></div>{calculated ? <output className="schedule-result">Следующая дата: <strong>{formatDate(calculated, true)}</strong><input type="hidden" name="nextDate" value={calculated} /></output> : <Field label="Или точная дата"><Input type="date" name="nextDate" defaultValue={value.nextDate || ''} min={date} /></Field>}</fieldset>}
    {type === 'visit' && <Field label="Следующий приём" hint="Если дата назначена врачом"><Input type="date" name="nextDate" defaultValue={value.nextDate || ''} min={date} /></Field>}
    {type === 'medicine' && <fieldset className="care-schedule"><legend>Курс по назначению врача</legend><p>Перенесите схему из заключения. Сервис рассчитает даты и создаст напоминания.</p><Field label="Дозировка и способ приёма"><Input name="dose" defaultValue={value.dose || ''} placeholder="Точно по назначению врача" maxLength={200} required={!!days} /></Field><div className="form-grid"><Field label="Начало курса"><Input type="date" name="courseStart" value={start} onChange={e => setStart(e.target.value)} required={!!days} /></Field><Field label="Длительность, дней"><Input type="number" name="courseDays" value={days} onChange={e => setDays(e.target.value)} min="1" max="365" step="1" placeholder="Например, 7" /></Field></div><div className="form-grid"><Field label="Принимать каждые, дней"><Input name="courseEveryDays" type="number" value={interval} onChange={e => setInterval(e.target.value)} min="1" max="365" step="1" required={!!days} /></Field><Field label="Время приёма · Москва" hint="Через запятую: 08:00, 20:00"><Input name="courseTimes" value={times} onChange={e => setTimes(e.target.value)} placeholder="08:00, 20:00" maxLength={100} required={!!days} /></Field></div>{course && <output className="schedule-result">До {formatDate(course.end, true)} включительно · напоминаний: <strong>{course.count}</strong></output>}</fieldset>}
    {type === 'weight' && <fieldset className="care-schedule"><legend>Измерение</legend><div className="form-grid"><Field label="Параметр"><Input name="measurement" defaultValue={value.measurement || 'Вес'} maxLength={100} required /></Field><Field label="Единица"><Input name="unit" defaultValue={value.unit || 'кг'} maxLength={30} required /></Field></div><Field label="Значение"><Input name="value" type="number" min="0.001" step="any" defaultValue={value.value || ''} required /></Field></fieldset>}
    <details className="care-extra" open={value.clinic || value.doctor ? true : undefined}><summary>Клиника и врач</summary><div className="form-grid"><Field label="Клиника"><Input name="clinic" defaultValue={value.clinic || ''} maxLength={200} /></Field><Field label="Врач"><Input name="doctor" defaultValue={value.doctor || ''} maxLength={200} /></Field></div></details>
    <Field label="Заключение врача / наблюдения"><Textarea name="notes" rows={5} defaultValue={value.notes || ''} maxLength={10000} /></Field>
  </>
}
