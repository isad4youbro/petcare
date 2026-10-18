import React, { useEffect, useRef, useState, useId } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, CircleHelp, Download, HeartPulse, Menu, PawPrint, Plus, Search, Settings, Utensils, X, LogOut, Pencil, Bell, MoreHorizontal, Send } from './components/pixel-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { healthTypes, eventTypes, defaultAvatar } from './pets'
import { Auth } from './components/auth'
import { Brand } from './components/brand'
import { Pet } from './components/pet'
import { PublicTag } from './components/public-tag'
import { TagSettings } from './components/tag-settings'
import { AvatarEditor } from './components/avatar-editor'
import { ThemeToggle } from './components/theme-toggle'
import { RemindersPopover } from './components/reminders-popover'
import { Guide } from './components/guide'
import { PetNotices } from './components/pet-notices'
import { speciesName } from './avatar'
import { CareWidget } from './components/care-widget'
import { CareFields } from './components/care-fields'
import { CalendarTransfer } from './components/calendar-transfer'
import { FoodAutocomplete } from './components/food-autocomplete'
import { ErrorPage } from './components/error-page'
import { PetWalkway } from './components/pet-walkway'
import { reactions } from './care'
import { api, localToday, formatDate, age, events, recentRecords, recordCount, latestWeight } from './data'

import { portfolioMode, homeUrl } from './portfolio/config'

const widgetMode = new URLSearchParams(location.search).has('widget')
const navigation = [
  ['pets', 'Питомцы', PawPrint], ['health', 'Медкарта', HeartPulse], ['food', 'Питание', Utensils],
  ['calendar', 'Календарь', CalendarDays], ['search', 'Поиск по записям', Search],
]
const typeName = speciesName
const newPet = () => ({ name: '', species: 'cat', breed: '', birthday: '', weight: '', photo: '', avatar: defaultAvatar('cat') })

function Field({ label, children, hint, className = '' }) {
  const id = useId(), hintId = id + '-hint'
  const [invalid, setInvalid] = useState('')
  function attach(child) {
    if (!React.isValidElement(child)) return child
    if ([Input, Textarea, NativeSelect, Select, FoodAutocomplete, 'input', 'textarea', 'select'].includes(child.type)) return React.cloneElement(child, {
      id, 'aria-describedby': invalid ? id + '-error' : hint ? hintId : undefined, 'aria-invalid': !!invalid,
      onInvalid: event => { event.preventDefault(); setInvalid(event.target.validity.valueMissing ? 'Заполните поле «' + label + '»' : event.target.validity.typeMismatch ? 'Проверьте формат поля «' + label + '»' : 'Проверьте значение: «' + label + '»'); event.target.form?.querySelector(':invalid')?.focus() },
      onInput: event => { setInvalid(''); child.props.onInput?.(event); if (['date', 'time'].includes(child.props.type)) child.props.onChange?.(event) },
      onChange: event => { setInvalid(''); child.props.onChange?.(event) },
    })
    if (child.type === 'div') return React.cloneElement(child, {}, React.Children.map(child.props.children, attach))
    return child
  }
  return <div className={'field ' + className}><Label className="field-label" htmlFor={id}>{label}</Label>{React.Children.map(children, attach)}{invalid && <span className="field-error" role="alert" id={id + '-error'}>{invalid}</span>}{hint && <span className="field-hint" id={hintId}>{hint}</span>}</div>
}
function Select({ options, ...props }) {
  return <NativeSelect {...props}>{Object.entries(options).map(([value, label]) => <NativeSelectOption value={value} key={value}>{label}</NativeSelectOption>)}</NativeSelect>
}
function PageTitle({ title, children, description }) {
  const art = ({ 'Медкарта': 'health', 'Питание': 'food', 'Календарь': 'calendar' })[title]
  return <div className="page-title"><div><div className="page-title-name">{art && <img className="section-art" src={homeUrl + 'assets/illustrations/' + art + '-small.png'} alt="" />}<h1>{title}</h1></div>{description && <p>{description}</p>}</div>{children}</div>
}
function Empty({ title, description, action, children }) {
  return <div className="empty"><h3>{title}</h3>{description && <p>{description}</p>}{action}{children}</div>
}
function FormError({ error }) { return error ? <div className="form-error" role="alert">{error}</div> : null }
function RecordList({ records, open, empty = 'Записей пока нет.' }) {
  if (!records.length) return <p className="empty-line">{empty}</p>
  return <div className="record-list">{records.map(record => <button className="record-list-row" key={record.id} onClick={() => open(record.kind, record, record.pet.id)}>
    <span><strong>{record.title || `${record.brand} · ${record.flavor}`}</strong><small>{record.pet.name} · {record.kind === 'food' ? 'Питание' : healthTypes[record.type]}</small></span>
    <time>{formatDate(record.date)}</time><ChevronRight size={15} />
  </button>)}</div>
}
function EventList({ records, open, today }) {
  if (!records.length) return <p className="empty-line">Нет запланированных дел.</p>
  return <div className="event-list">{records.map(record => <button className="event-row" key={record.id} onClick={() => open('reminder', record, record.pet.id)}>
    <span className="event-date"><strong>{Number(record.date.slice(8))}</strong><span>{new Date(record.date + 'T12:00').toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}</span></span>
    <span className="event-name"><strong>{record.title}</strong><small>{record.pet.name} · {record.time}{record.date < today && !record.done ? ' · Просрочено' : ''}{record.done ? ' · Выполнено' : ''}</small></span>
    {record.date < today && !record.done && <span className="overdue-label">Просрочено</span>}<ChevronRight size={16} />
  </button>)}</div>
}

export default function Root() {
  const token = new URLSearchParams(location.search).get('tag') || location.pathname.match(/^\/tag\/([A-Za-z0-9_-]{20,64})$/)?.[1]
  if (token) return <PublicTag token={token} />
  if (location.pathname === '/403') return <ErrorPage status={403} />
  if (location.pathname === '/404' || ![homeUrl, homeUrl + 'index.html', '/', '/index.html'].includes(location.pathname)) return <ErrorPage status={404} />
  return <App />
}

function App() {
  const [state, setState] = useState(null), [loading, setLoading] = useState(true), [startupError, setStartupError] = useState(''), [startupStatus, setStartupStatus] = useState(0)
  const [page, setPage] = useState('pets'), [activeId, setActiveId] = useState(null), [drawer, setDrawer] = useState(false), [compact, setCompact] = useState(false)
  const [mobile, setMobile] = useState(() => matchMedia('(max-width:759px)').matches)
  useEffect(() => { const media = matchMedia('(max-width:759px)'); const change = () => setMobile(media.matches); media.addEventListener('change', change); return () => media.removeEventListener('change', change) }, [])
  const [calendarScope, setCalendarScope] = useState('all')
  const [companion, setCompanion] = useState(() => (sessionStorage.getItem('petcare.demo') ? sessionStorage : localStorage).getItem('petcare.companion') !== 'off')
  function toggleCompanion() { setCompanion(old => { (sessionStorage.getItem('petcare.demo') ? sessionStorage : localStorage).setItem('petcare.companion', old ? 'off' : 'on'); return !old }) }
  const [walking, setWalking] = useState(() => (sessionStorage.getItem('petcare.demo') ? sessionStorage : localStorage).getItem('petcare.walking') !== 'off')
  function toggleWalking() { setWalking(old => { (sessionStorage.getItem('petcare.demo') ? sessionStorage : localStorage).setItem('petcare.walking', old ? 'off' : 'on'); return !old }) }
  const [modal, setModal] = useState(null), [message, setMessage] = useState(''), [guide, setGuide] = useState(-1)
  useEffect(() => { const fallback = event => { setDrawer(false); setModal({ type: 'widget', petId: event.detail }) }; window.addEventListener('petcare-widget-fallback', fallback); return () => window.removeEventListener('petcare-widget-fallback', fallback) }, [])
  const dialogRef = useRef(null)
  const today = state?.today || localToday(), pets = state?.pets || [], pet = pets.find(p => p.id === activeId) || pets[0]
  const records = kind => pet?.records.filter(r => r.kind === kind) || []
  async function reload() {
    const next = await api('state'); setState(next)
    setActiveId(current => next.pets.some(p => p.id === current) ? current : next.pets[0]?.id || null)
    if (widgetMode && window.opener && !window.opener.closed) window.opener.postMessage({ type: 'petcare-updated' }, location.origin)
    return next
  }
  useEffect(() => { api('state').then(next => { setState(next); setActiveId(next.pets[0]?.id || null); if (!next.user.onboarded) setGuide(0) }).catch(error => { if (error.status !== 401 && error.message !== 'Войдите в аккаунт') { setStartupError(error.message); setStartupStatus(error.status || 0) } }).finally(() => setLoading(false)) }, [])
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 4500); return () => clearTimeout(timer) }, [message])
  useEffect(() => { const expired = () => { setState(null); setModal(null); setPage('pets'); setActiveId(null); setStartupError(''); setStartupStatus(0) }; window.addEventListener('petcare-demo-expired', expired); return () => window.removeEventListener('petcare-demo-expired', expired) }, [])
  function selectPet(id) { setActiveId(id); setCalendarScope(id) }
  useEffect(() => { if (!widgetMode || !state) return; const timer = setInterval(() => reload().catch(() => setMessage('Нет связи с сервером')), 30000); return () => clearInterval(timer) }, [!!state])
  function go(next, id, scope) {
    if (id) selectPet(id)
    if (next === 'calendar') setCalendarScope(scope || id || pet?.id || 'all')
    setPage(next); setDrawer(false); window.scrollTo(0, 0)
  }
  function openRecord(kind, record = null, petId = pet?.id, afterStage) {
    if (!pets.length) { setMessage('Сначала добавьте питомца'); setModal({ type: 'pet' }); return }
    setModal({ type: 'record', kind, record, petId: petId || pets[0].id, afterStage, returnToWidget: modal?.type === 'widget' ? { type: 'widget', petId: petId || pets[0].id } : null })
  }
  useEffect(() => {
    if (!state || widgetMode) return
    const sync = event => {
      if (event.origin !== location.origin || !event.source) return
      if (event.data?.type === 'petcare-updated') reload().catch(() => {})
      if (event.data?.type === 'petcare-navigate' && pets.some(animal => animal.id === event.data.petId)) go('profile', event.data.petId)
    }
    window.addEventListener('message', sync)
    return () => window.removeEventListener('message', sync)
  }, [state])
  async function savedPet(id, editing) { await reload(); setActiveId(id); go('profile', id); setModal(editing ? null : { type: 'optional', stage: 0, petId: id }); setMessage('Питомец сохранён') }
  async function savedRecord(afterStage, returnToWidget) { await reload(); setModal(afterStage === 0 ? { type: 'optional', stage: 1 } : returnToWidget || null); setMessage('Запись сохранена') }
  function confirmDelete(title, callback, previous) { setModal({ type: 'confirm', title, callback, previous }) }
  async function finishGuide() {
    try { await api('onboard', {}); setGuide(-1); setState(current => ({ ...current, user: { ...current.user, onboarded: 1 } })); if (!pets.length) setModal({ type: 'pet' }) }
    catch (error) { setMessage(error.message) }
  }
  async function logout() { await api('logout', {}); setState(null); setModal(null); setPage('pets'); setActiveId(null); setDrawer(false) }
  const addPet = () => setModal({ type: 'pet' })
  const showCareWindow = (petId = pet?.id) => { setDrawer(false); setModal({ type: 'widget', petId }) }

  if (loading) return <div className="app-loading">PetCare<span>Загрузка…</span></div>
  if (!state && startupStatus === 403) return <ErrorPage status={403} />
  if (!state) return <><Auth Field={Field} Pet={Pet} onSuccess={async () => { const next = await reload(); go('pets'); if (!next.user.onboarded) setGuide(0) }} startupError={startupError} />{message && <div className="toast" role="status">{message}</div>}</>

  async function completeReminder(record) { const { pet: ownerPet, ...value } = record; await api('records/save', { ...value, petId: ownerPet.id, done: true }); await reload() }

  const dialogs = <Dialog open={!!modal} onOpenChange={open => { if (!open) setModal(modal?.returnToWidget || null) }}><DialogContent ref={dialogRef} onOpenAutoFocus={event => { event.preventDefault(); dialogRef.current?.focus({ preventScroll: true }) }} className={modal?.type === 'pet' ? 'pet-dialog' : modal?.type === 'widget' ? 'widget-dialog' : 'app-dialog'}>
      {modal?.type === 'widget' && <><DialogHeader><DialogTitle>Окно питомца</DialogTitle><DialogDescription className="sr-only">Питомец, ближайшие дела и быстрые записи.</DialogDescription></DialogHeader><CareWidget key={modal.petId || 'all'} pets={pets} today={today} Pet={Pet} error={message} openRecord={openRecord} complete={completeReminder} embedded initialPetId={modal.petId} /></>}
      {modal?.type === 'tag' && <TagSettings pet={modal.pet} demo={state.user.demo} />}
      {modal?.type === 'pet' && <PetForm key={modal.pet?.id || 'new'} pet={modal.pet} today={today} saved={savedPet} cancel={() => setModal(null)} remove={() => confirmDelete('Удалить питомца и все его записи?', async () => { await api('pets/delete', { petId: modal.pet.id }); await reload(); go('pets'); setModal(null); setMessage('Питомец удалён') }, modal)} />}
      {modal?.type === 'record' && <RecordForm key={`${modal.kind}-${modal.record?.id || 'new'}-${modal.petId}`} {...modal} pets={pets} today={today} telegram={state.telegram} openRecord={openRecord} saved={() => savedRecord(modal.afterStage, modal.returnToWidget)} cancel={() => setModal(modal.returnToWidget || null)} remove={() => confirmDelete('Удалить запись?', async () => { await api('records/delete', { petId: modal.petId, id: modal.record.id }); await reload(); setModal(null); setMessage('Запись удалена') }, modal)} />}
      {modal?.type === 'optional' && <OptionalStep stage={modal.stage} pet={pet} add={() => openRecord(modal.stage === 0 ? 'health' : 'food', null, pet.id, modal.stage)} skip={() => setModal(modal.stage === 0 ? { type: 'optional', stage: 1 } : null)} />}
      {modal?.type === 'settings' && <SettingsPage state={state} reload={reload} message={setMessage} logout={logout} companion={companion} toggleCompanion={toggleCompanion} walking={walking} toggleWalking={toggleWalking} openCompanion={showCareWindow} />}
      {modal?.type === 'confirm' && <ConfirmDelete modal={modal} cancel={() => setModal(modal.previous || null)} error={setMessage} />}
    </DialogContent></Dialog>

  if (widgetMode) return <><CareWidget pets={pets} today={today} Pet={Pet} error={message} openRecord={openRecord} complete={completeReminder} />{dialogs}{message && <div className="toast" role="status">{message}</div>}</>

  const sidebar = <>
    <button className="wordmark" onClick={() => go('pets')}><Brand /></button>
    <nav className="main-nav" aria-label="Основная навигация">{navigation.map(([key, title, Icon]) => <button key={key} data-guide={key} className={(page === key || (page === 'profile' && key === 'pets')) ? 'selected' : ''} onClick={() => go(key)}><Icon size={18} strokeWidth={1.7} />{title}</button>)}</nav>
    <div className="sidebar-pet"><span className="sidebar-caption">Питомец</span>{pets.length ? <NativeSelect aria-label="Текущий питомец" value={pet?.id || ''} onChange={e => selectPet(e.target.value)}>{pets.map(p => <NativeSelectOption key={p.id} value={p.id}>{p.name}</NativeSelectOption>)}</NativeSelect> : <Button variant="outline" onClick={addPet}><Plus size={16} /> Добавить питомца</Button>}</div>
    <div className="sidebar-bottom"><button onClick={() => showCareWindow()}><PawPrint size={17} /> Окно питомца</button><button onClick={() => { go('pets'); setGuide(0) }}><CircleHelp size={17} /> Как пользоваться</button><button onClick={() => { setModal({ type: 'settings' }); setDrawer(false) }}><Settings size={17} /> Настройки</button><div className="account"><span className="account-initial">{state.user.demo ? 'Г' : state.user.name[0]}</span><span><strong>{state.user.demo ? 'Гость' : state.user.name}</strong><small title={state.user.demo ? 'Пробный режим · эта вкладка' : undefined}>{state.user.demo ? (portfolioMode ? 'Локальное демо' : 'Пробный режим') : state.user.email}</small></span><button onClick={logout} aria-label={state.user.demo ? 'Завершить просмотр' : 'Выйти'}><LogOut size={16} /></button></div></div>
  </>

  return <div className={'app-layout ' + (compact ? 'compact-sidebar' : '')}>
    <aside className="sidebar">{sidebar}</aside>
    <Sheet open={drawer} onOpenChange={setDrawer}><SheetContent side="left" className="mobile-sidebar" onCloseAutoFocus={event => { if (guide >= 0) event.preventDefault() }}><SheetTitle className="sr-only">Меню PetCare</SheetTitle><SheetDescription className="sr-only">Разделы приложения, выбор питомца и настройки.</SheetDescription>{sidebar}</SheetContent></Sheet>
    <div className="main-layout"><header className="toolbar"><div><Button variant="ghost" size="icon" className="menu-button" aria-label={compact ? "Показать меню" : "Открыть меню"} aria-expanded={mobile ? drawer : !compact} onClick={() => window.innerWidth < 760 ? setDrawer(true) : setCompact(!compact)}><Menu size={19} /></Button><span className="toolbar-section">{page === 'profile' ? pet?.name : navigation.find(n => n[0] === page)?.[1] || 'Питомцы'}</span></div><div><ThemeToggle /><RemindersPopover pets={pets} today={today} openRecord={openRecord} complete={completeReminder} calendar={() => go('calendar', null, 'all')} /></div></header>
      <main className="page-content">{portfolioMode && <p className="portfolio-note">Портфолио-демо · изменения остаются в вашем браузере</p>}
        {page === 'pets' && <Home pets={pets} user={state.user} today={today} go={go} openRecord={openRecord} addPet={addPet} />}
        {page !== 'pets' && !pet && <Empty title="Добавьте первого питомца" description="Имя и вид можно указать сейчас, остальные данные — позже." action={<Button onClick={addPet}><Plus size={16} /> Добавить питомца</Button>} />}
        {pet && page === 'profile' && <Profile pet={pet} today={today} go={go} openRecord={openRecord} edit={() => setModal({ type: 'pet', pet })} tag={() => setModal({ type: 'tag', pet })} />}
        {pet && page === 'health' && <Health key={pet.id} pet={pet} pets={pets} selectPet={selectPet} today={today} openRecord={openRecord} />}
        {pet && page === 'food' && <Food key={pet.id} pet={pet} pets={pets} selectPet={selectPet} openRecord={openRecord} />}
        {pet && page === 'calendar' && <Calendar pets={pets} pet={pet} scope={calendarScope} setScope={setCalendarScope} today={today} openRecord={openRecord} settings={() => setModal({ type: 'settings' })} />}
        {pet && page === 'search' && <SearchPage key={pet.id} pet={pet} pets={pets} selectPet={selectPet} ai={state.ai} openRecord={openRecord} />}
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Разделы">{navigation.map(([key, title, Icon]) => <button aria-label={title} data-guide-mobile={key} className={page === key || (key === 'pets' && page === 'profile') ? 'selected' : ''} key={key} onClick={() => go(key)}><Icon size={20} /><span>{({ pets: 'Питомцы', health: 'Карта', food: 'Питание', calendar: 'Планы', search: 'Поиск' })[key]}</span></button>)}</nav>
    {dialogs}
    {pet && page !== 'pets' && <PetNotices key={pet.id} pet={pet} page={page} blocked={!!modal || drawer || guide >= 0} enabled={companion} openRecord={openRecord} go={go} />}
    {walking && pet && <PetWalkway pet={pet} />}
    {guide >= 0 && <Guide step={guide} back={() => setGuide(current => Math.max(0, current - 1))} next={() => guide < 4 ? setGuide(guide + 1) : finishGuide()} finish={finishGuide} hasPets={!!pets.length} />}
    {message && <div className="toast" role="status">{message}</div>}
  </div>
}


function Home({ pets, user, today, go, openRecord, addPet }) {
  const track = useRef(null), drag = useRef(null), [position, setPosition] = useState({ previous: false, next: false })
  const planned = events(pets), recent = recentRecords(pets)
  function scroll(direction) { const el = track.current; if (!el) return; const first = el.children[0]; const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(el).gap || 0); el.scrollBy({ left: direction * step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }) }
  function onScroll() { const el = track.current; if (!el) return; const next = { previous: el.scrollLeft > 1, next: Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth - 1 }; setPosition(old => old.previous === next.previous && old.next === next.next ? old : next) }
  useEffect(() => { const el = track.current; if (!el) return; const observer = new ResizeObserver(onScroll); observer.observe(el); onScroll(); return () => observer.disconnect() }, [pets.length])
  if (!pets.length) return <><PageTitle title="Питомцы" /><section className="pets-section" data-guide="pet-cards"><Empty title="Пока нет питомцев" description="Добавьте имя и вид. Остальную информацию можно заполнить позже." action={<Button onClick={addPet}><Plus size={16} /> Добавить питомца</Button>} /></section></>
  return <><PageTitle title="Питомцы"><Button onClick={addPet}><Plus size={16} /> Добавить питомца</Button></PageTitle>
    <section className="pets-section" data-guide="pet-cards"><div className="section-heading"><h2>Все питомцы <span>{pets.length}</span></h2><div className="carousel-controls"><Button variant="outline" size="icon" aria-label="Предыдущий питомец" onClick={() => scroll(-1)} disabled={!position.previous}><ChevronLeft size={16} /></Button><Button variant="outline" size="icon" aria-label="Следующий питомец" onClick={() => scroll(1)} disabled={!position.next}><ChevronRight size={16} /></Button></div></div>
      {pets.length ? <div className="pet-track" ref={track} onScroll={onScroll} onPointerDown={e => { if (e.pointerType === 'mouse') drag.current = { x: e.clientX, scroll: track.current.scrollLeft, moved: false } }} onPointerMove={e => { const d = drag.current; if (d && Math.abs(e.clientX - d.x) > 7) { d.moved = true; track.current.scrollLeft = d.scroll + d.x - e.clientX } }} onPointerUp={() => { if (drag.current) setTimeout(() => { drag.current = null }, 0) }} onPointerLeave={() => { drag.current = null }} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); scroll(e.key === 'ArrowLeft' ? -1 : 1) } }}>
        {pets.map(p => { const next = events([p])[0]; return <button className="pet-card" key={p.id} onClick={e => { if (drag.current?.moved) { e.preventDefault(); return } go('profile', p.id) }}><div className="pet-card-illustration"><Pet pet={p} /></div><div className="pet-card-description"><h3><span>{p.name}</span><ArrowRight size={16} /></h3><p>{p.breed || typeName(p)}{age(p, today) && ' · ' + age(p, today)}</p><small>{next ? `${formatDate(next.date)} · ${eventTypes[next.type]}` : recordCount(p.records.length)}</small></div></button> })}
        <button className="pet-card pet-card-add" onClick={addPet}><Plus size={23} /><strong>Добавить питомца</strong><span>Можно указать любой вид</span></button>
      </div> : <Empty title="Пока нет питомцев" description="Добавьте имя и вид. Остальную информацию можно заполнить позже." action={<Button onClick={addPet}><Plus size={16} /> Добавить питомца</Button>} />}
    </section>
    <div className="home-records"><section><div className="section-heading"><h2>Напоминания <span>{planned.length}</span></h2><Button variant="ghost" size="sm" onClick={() => go('calendar', null, 'all')}>Все <ArrowRight size={14} /></Button></div><EventList records={planned.slice(0, 4)} open={openRecord} today={today} /><Button variant="outline" size="sm" className="section-action" onClick={() => openRecord('reminder')}><Plus size={15} /> Создать напоминание</Button></section><section><div className="section-heading"><h2>Последние записи</h2></div><RecordList records={recent} open={openRecord} /></section></div>
  </>
}

function PetContext({ pet, pets, selectPet }) { return <div className="pet-context"><Pet pet={pet} /><NativeSelect aria-label="Выбрать питомца" value={pet.id} onChange={e => selectPet(e.target.value)}>{pets.map(p => <NativeSelectOption key={p.id} value={p.id}>{p.name}</NativeSelectOption>)}</NativeSelect><span>{pet.breed || typeName(pet)}</span></div> }
function Profile({ pet, today, go, openRecord, edit, tag }) {
  const planned = events([pet])
  return <><PageTitle title={pet.name}><div className="profile-actions"><Button variant="outline" onClick={tag}>QR-метка</Button><Button variant="outline" onClick={edit}><Pencil size={15} /> Редактировать</Button></div></PageTitle><section className="pet-passport"><Pet pet={pet} /><dl>{[['Вид', typeName(pet)], ...(pet.breed && pet.breed !== typeName(pet) ? [['Порода / разновидность', pet.breed]] : []), ['Дата рождения', pet.birthday ? formatDate(pet.birthday, true) : 'Не указана'], ['Вес', latestWeight(pet) ? latestWeight(pet) + ' кг' : 'Не указан']].map(([label, value]) => <div key={label} className={label === 'Порода / разновидность' ? 'passport-breed' : undefined}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{pet.photo && <img src={pet.photo} alt={'Фото ' + pet.name} />}</section><div className="profile-links">{[['health', 'Медкарта', pet.records.filter(r => r.kind === 'health').length], ['food', 'Питание', pet.records.filter(r => r.kind === 'food').length], ['calendar', 'Напоминания', planned.length]].map(([key, label, count]) => <button key={key} onClick={() => go(key)}>{label}<span>{count}</span><ChevronRight size={16} /></button>)}</div><div className="home-records"><section><div className="section-heading"><h2>Напоминания</h2><Button variant="ghost" size="sm" onClick={() => openRecord('reminder')}><Plus size={15} /> Добавить</Button></div><EventList records={planned.slice(0, 4)} today={today} open={openRecord} /><Button variant="outline" size="sm" className="section-action" onClick={() => openRecord('reminder', { type: 'visit', title: 'Приём у ветеринара' })}>Запланировать приём</Button></section><section><div className="section-heading"><h2>Последние записи</h2></div><RecordList records={recentRecords([pet])} open={openRecord} /></section></div><Button className="profile-search-link" variant="ghost" onClick={() => go('search')}><Search size={16} /> Найти информацию в записях {pet.name}<ArrowRight size={15} /></Button></>
}

function Health({ pet, pets, selectPet, today, openRecord }) {
  const [filter, setFilter] = useState('all'), [query, setQuery] = useState('')
  const all = pet.records.filter(r => r.kind === 'health').sort((a, b) => b.date.localeCompare(a.date)), visible = all.filter(r => (filter === 'all' || r.type === filter) && [r.title, r.notes, r.clinic, r.doctor].join(' ').toLowerCase().includes(query.toLowerCase()))
  return <><PageTitle title="Медкарта"><Button onClick={() => openRecord('health')}><Plus size={16} /> Добавить запись</Button></PageTitle><PetContext pet={pet} pets={pets} selectPet={selectPet} /><div className="line-tabs record-filters" role="group" aria-label="Тип записи">{[['all', 'Все записи'], ['visit', 'Визиты'], ['vaccine', 'Вакцинации'], ['parasite', 'Обработки'], ['medicine', 'Препараты'], ['weight', 'Измерения']].map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div>
    <div className="health-toolbar"><Input aria-label="Поиск по медкарте" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Название, врач или текст заключения" /><span>{recordCount(visible.length)}</span></div>
    {visible.length ? <div className="health-records">{visible.map(record => <button key={record.id} className="health-row" onClick={() => openRecord('health', record)}><time>{formatDate(record.date, true)}</time><span><strong>{record.title}</strong><small>{healthTypes[record.type]}{record.clinic && ' · ' + record.clinic}{record.doctor && ' · ' + record.doctor}</small>{record.value && <p className="measurement-value">{record.measurement}: <strong>{record.value} {record.unit}</strong></p>}{record.courseDays > 0 && <p className="course-description">{record.dose} · {record.courseDays} дн., каждые {record.courseEveryDays} дн. в {record.courseTimes}<br />{formatDate(record.courseStart)} — {formatDate(record.courseEnd, true)}</p>}{record.notes && <p>{record.notes}</p>}{record.nextDate && <small className="next-procedure">Следующая дата: {formatDate(record.nextDate, true)}</small>}</span><ChevronRight size={16} /></button>)}</div> : <Empty title="Нет записей" description={filter === 'all' ? 'Сохраните визит, прививку, обработку или назначение врача.' : 'Записей этого типа пока нет.'} action={<Button variant="outline" onClick={() => openRecord('health')}>Добавить запись</Button>} />}
    <div className="health-appointment"><span>Планируете следующий приём?</span><Button variant="outline" onClick={() => openRecord('reminder', { title: 'Приём у ветеринара', type: 'visit' })}>Запланировать приём <ArrowRight size={15} /></Button></div></>
}

function Food({ pet, pets, selectPet, openRecord }) {
  const [sort, setSort] = useState('date'), [reactionFilter, setReactionFilter] = useState('all')
  const records = pet.records.filter(r => r.kind === 'food' && (reactionFilter === 'all' || (reactionFilter === 'good' ? r.tolerance === 'good' : r.tolerance === 'bad'))).sort(sort === 'rating' ? (a, b) => b.rating - a.rating : (a, b) => b.date.localeCompare(a.date))
  const liked = record => record.liked === 'yes' ? 'Понравился' : record.liked === 'no' ? 'Не понравился' : 'Не оценён'
  const tolerance = record => record.tolerance === 'good' ? 'Подошло' : record.tolerance === 'bad' ? 'Не подошло' : 'Нет наблюдений'
  return <><PageTitle title="Питание"><Button onClick={() => openRecord('food')}><Plus size={16} /> Добавить корм</Button></PageTitle><PetContext pet={pet} pets={pets} selectPet={selectPet} /><div className="line-tabs" role="group" aria-label="Фильтр питания">{[['all', 'Все корма'], ['good', 'Подошли'], ['bad', 'С реакцией']].map(([key, label]) => <button key={key} className={reactionFilter === key ? 'active' : ''} aria-pressed={reactionFilter === key} onClick={() => setReactionFilter(key)}>{label}</button>)}</div><div className="food-toolbar"><span>{recordCount(records.length)}</span><NativeSelect aria-label="Сортировка кормов" value={sort} onChange={e => setSort(e.target.value)}><NativeSelectOption value="date">Сначала новые</NativeSelectOption><NativeSelectOption value="rating">По оценке</NativeSelectOption></NativeSelect></div>{records.length ? <><div className="food-desktop"><Table><TableHeader><TableRow><TableHead>Корм</TableHead><TableHead>Порция</TableHead><TableHead>Оценка</TableHead><TableHead>Предпочтение</TableHead><TableHead>Переносимость</TableHead><TableHead>Дата</TableHead></TableRow></TableHeader><TableBody>{records.map(record => <TableRow key={record.id}><TableCell><button className="table-record" onClick={() => openRecord('food', record)}><strong>{record.brand}</strong><span>{record.flavor}</span></button></TableCell><TableCell>{record.amount}</TableCell><TableCell><span className="food-rating" aria-label={`${record.rating} из 5`}>{record.rating ? '★'.repeat(record.rating) : '—'}</span></TableCell><TableCell>{liked(record)}</TableCell><TableCell className={record.tolerance === 'bad' ? 'negative' : ''}>{tolerance(record)}{record.reaction && record.reaction !== 'none' && <small className="food-reaction">{reactions[record.reaction]}</small>}</TableCell><TableCell className="date-cell">{formatDate(record.date)}</TableCell></TableRow>)}</TableBody></Table></div><div className="food-mobile">{records.map(record => <button key={record.id} onClick={() => openRecord('food', record)} className="food-mobile-row"><div><strong>{record.brand} · {record.flavor}</strong><time>{formatDate(record.date)}</time></div><span>{record.amount} · {record.rating ? record.rating + '/5' : 'Без оценки'}</span><span>{liked(record)} · Переносимость: {tolerance(record).toLowerCase()}</span>{record.reaction && record.reaction !== 'none' && <span className="negative">{reactions[record.reaction]}</span>}{record.notes && <p>{record.notes}</p>}</button>)}</div></> : <Empty title="Пока нет записей о питании" description="Добавьте название корма, порцию и ваши наблюдения." action={<Button variant="outline" onClick={() => openRecord('food')}>Добавить корм</Button>} />}<p className="section-note">Переносимость отражает ваши наблюдения, а не медицинскую оценку корма.</p></>
}

function Calendar({ pets, pet, scope, setScope, today, openRecord, settings }) {
  const [month, setMonth] = useState(() => new Date(today + 'T12:00')), [selectedDate, setSelectedDate] = useState(''), [completed, setCompleted] = useState(false), [calendarView, setCalendarView] = useState('month'), [limit, setLimit] = useState(14)
  const agendaRef = useRef(null)
  const [showTransfer, setShowTransfer] = useState(false)
  const scopedPets = scope === 'all' ? pets : pets.filter(p => p.id === scope), planned = events(scopedPets, completed)
  const visible = selectedDate ? planned.filter(record => record.date === selectedDate) : planned
  useEffect(() => { if (!selectedDate || calendarView !== 'month' || !matchMedia('(max-width:759px)').matches) return; requestAnimationFrame(() => agendaRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })) }, [selectedDate, calendarView])
  const year = month.getFullYear(), number = month.getMonth(), first = (new Date(year, number, 1).getDay() + 6) % 7, days = new Date(year, number + 1, 0).getDate()
  useEffect(() => { setSelectedDate(''); setLimit(14) }, [scope, completed])
  function changeMonth(offset) { setMonth(new Date(year, number + offset, 1)); setSelectedDate('') }
  return <><PageTitle title="Календарь"><Button onClick={() => openRecord('reminder', selectedDate ? { date: selectedDate } : null, scope !== 'all' ? scope : pet.id)}><Plus size={16} /> Создать напоминание</Button></PageTitle><div className="calendar-scope"><NativeSelect aria-label="Питомцы в календаре" value={scope} onChange={e => { setScope(e.target.value); setSelectedDate('') }}><NativeSelectOption value="all">Все питомцы</NativeSelectOption>{pets.map(p => <NativeSelectOption key={p.id} value={p.id}>{p.name}</NativeSelectOption>)}</NativeSelect><span>Время: Москва, UTC+3</span><Button variant="outline" size="sm" aria-expanded={showTransfer} onClick={() => setShowTransfer(!showTransfer)}><Download size={15} /> Перенести в календарь</Button></div>{showTransfer && <CalendarTransfer petId={scope} count={events(scopedPets).length} />}<div className="line-tabs calendar-view" role="group" aria-label="Вид календаря">{[['month','Месяц'],['list','Список']].map(([key,label]) => <button key={key} className={calendarView === key ? 'active' : ''} aria-pressed={calendarView === key} onClick={() => setCalendarView(key)}>{label}</button>)}</div><div className={'calendar-layout ' + (calendarView === 'list' ? 'calendar-list-view' : '')}>{calendarView === 'month' && <section className="calendar-month"><div className="section-heading"><h2>{month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(/^./u, letter => letter.toLocaleUpperCase('ru-RU'))}</h2><div><Button variant="ghost" size="sm" onClick={() => { setMonth(new Date(today + 'T12:00')); setSelectedDate(today) }}>Сегодня</Button><Button variant="ghost" size="icon" aria-label="Предыдущий месяц" onClick={() => changeMonth(-1)}><ChevronLeft size={17} /></Button><Button variant="ghost" size="icon" aria-label="Следующий месяц" onClick={() => changeMonth(1)}><ChevronRight size={17} /></Button></div></div><div className="calendar-week">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <span key={day}>{day}</span>)}</div><div className="calendar-grid">{Array.from({ length: first }, (_, i) => <span className="calendar-blank" key={'blank' + i} />)}{Array.from({ length: days }, (_, i) => {
    const date = `${year}-${String(number + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`, count = planned.filter(r => r.date === date).length
    return <button key={date} aria-label={`${formatDate(date, true)}${count ? ', напоминаний: ' + count : ''}`} aria-pressed={selectedDate === date} className={`calendar-day ${date === today ? 'today' : ''} ${date === selectedDate ? 'selected' : ''}`} onClick={() => setSelectedDate(date === selectedDate ? '' : date)}><span>{i + 1}</span>{count > 0 && <small>{count} {count === 1 ? 'дело' : 'дела'}</small>}</button>
  })}</div></section>}<section className="calendar-agenda" ref={agendaRef}><div className="section-heading"><h2>{selectedDate ? formatDate(selectedDate, true) : completed ? 'Выполненные' : 'Напоминания'}</h2>{selectedDate && <Button variant="ghost" size="sm" onClick={() => setSelectedDate('')}>Все</Button>}</div><button className="completed-toggle" aria-pressed={completed} onClick={() => setCompleted(!completed)}>{completed ? 'Показать текущие' : 'Показать выполненные'}</button><EventList records={visible.slice(0, limit)} today={today} open={openRecord} />{visible.length > limit && <Button variant="ghost" className="section-action" onClick={() => setLimit(limit + 14)}>Показать ещё ({visible.length - limit})</Button>}<Button variant="outline" size="sm" className="section-action" onClick={() => openRecord('reminder', selectedDate ? { date: selectedDate } : null, scope !== 'all' ? scope : pet.id)}><Plus size={15} /> Добавить{selectedDate ? ' на эту дату' : ' напоминание'}</Button><button className="calendar-settings-link" onClick={settings}>Настроить уведомления в Telegram <ArrowRight size={14} /></button></section></div></>
}

function SearchPage({ pet, pets, selectPet, ai, openRecord }) {
  const [question, setQuestion] = useState(''), [result, setResult] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const request = useRef(0)
  useEffect(() => () => { request.current++ }, [])
  async function ask(event) {
    event.preventDefault(); if (!question.trim() || busy) return
    const version = ++request.current; setBusy(true); setError(''); setResult(null)
    try { const answer = await api('search', { petId: pet.id, question }); if (request.current === version) setResult({ ...answer, question }) }
    catch (e) { if (request.current === version) setError(e.message) } finally { if (request.current === version) setBusy(false) }
  }
  return <><PageTitle title="Поиск по записям" /><PetContext pet={pet} pets={pets} selectPet={selectPet} /><section className="search-page"><form className="question-form" onSubmit={ask}><Input aria-label="Вопрос о питомце" value={question} onChange={e => setQuestion(e.target.value)} maxLength={1000} placeholder="Какой корм лучше переносился?" required /><img className="search-emblem" src={homeUrl + 'assets/illustrations/search-small.png'} alt="" /><Button type="submit" disabled={busy}>{busy ? 'Поиск…' : 'Найти'}<Search size={16} /></Button></form><FormError error={error} />{busy && <p role="status" className="search-status">Ищем в записях {pet.name}…</p>}{result && <article className="search-result" aria-live="polite"><h2>{result.question}</h2><p>{result.answer}</p>{result.mode === 'fallback' && <small>Модель недоступна, ответ найден в записях.</small>}{result.sources?.length > 0 && <details className="search-sources"><summary>Записи, на которых основан ответ · {result.sources.length}</summary>{result.sources.map(source => <button key={source.id} onClick={() => { const record = pet.records.find(r => r.id === source.id); if (record) openRecord(record.kind, record, pet.id) }}>{source.title} · {formatDate(source.date)}<ArrowRight size={13} /></button>)}</details>}</article>}{!result && !busy && !error && <div className="search-placeholder"><p>Задайте вопрос о питании, здоровье или планах {pet.name}.</p></div>}</section></>
}

function PetForm({ pet: existing, today, saved, cancel, remove }) {
  const [pet, setPet] = useState(() => existing ? structuredClone(existing) : newPet()), [step, setStep] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const avatar = pet.avatar, photoInput = useRef(null)
  const [editorMode, setEditorMode] = useState('custom')
  useEffect(() => { document.querySelector('.pet-dialog')?.scrollTo({ top: 0, behavior: 'instant' }) }, [step])
  function patch(value) { setPet(current => ({ ...current, ...value })) }
  async function submit(event) {
    event.preventDefault(); if (busy) return; setError('')
    if (step === 0 && event.nativeEvent.submitter?.value !== 'quick') { setStep(1); return }
    setBusy(true)
    try { const result = await api('pets/save', { ...pet, species: pet.species, avatar }); await saved(result.id, !!existing) }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  function photo(event) {
    const file = event.target.files[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2000000) { setError('Выберите JPEG, PNG или WebP до 2 МБ'); return }
    const reader = new FileReader(); reader.onload = () => patch({ photo: reader.result, pixelPhoto: '' }); reader.onerror = () => setError('Не удалось прочитать файл'); reader.readAsDataURL(file)
  }
  return <><DialogHeader><DialogTitle>{existing ? 'Редактировать питомца' : 'Новый питомец'}</DialogTitle><DialogDescription>{step === 0 ? 'Имя и внешний вид' : 'Данные — по желанию'}</DialogDescription></DialogHeader><div className="editor-steps"><span className={step === 0 ? 'current' : ''}>1. Внешность</span><span className={step === 1 ? 'current' : ''}>2. Данные</span></div><form onSubmit={submit} className="pet-form">
    {step === 0 ? <AvatarEditor pet={pet} patch={patch} Field={Field} initialMode={editorMode} /> : <><div className="passport-form-heading"><Pet pet={{ ...pet, avatar }} /><div><strong>{pet.name}</strong><span>{pet.breed || typeName(pet)}</span></div><Button variant="ghost" type="button" size="icon" aria-label="Изменить внешность" onClick={() => setStep(0)}><Pencil size={17} /></Button></div><div className="form-grid"><Field label="Дата рождения"><Input type="date" value={pet.birthday} max={today} onChange={e => patch({ birthday: e.target.value })} /></Field><Field label="Вес, кг"><Input type="number" value={pet.weight || ''} min="0.001" max="1999" step="0.001" onChange={e => patch({ weight: e.target.value })} /></Field></div><div className="field"><span className="field-label">Фотография</span><input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={photo} hidden /><Button type="button" variant="outline" onClick={() => photoInput.current?.click()}><Plus size={16} /> {pet.photo ? 'Заменить фото' : 'Добавить фото'}</Button><span className="field-hint">JPEG, PNG или WebP · до 2 МБ</span></div>{pet.photo && <div className="uploaded-photo"><img src={pet.photo} alt="Фото питомца" /><div><Button variant="outline" size="sm" type="button" onClick={() => { setEditorMode('photo'); setStep(0) }}>Подобрать аватар по фото</Button>{pet.pixelPhoto && <Button variant="ghost" size="sm" type="button" onClick={() => patch({ pixelPhoto: '' })}>Вернуть нарисованного питомца</Button>}<Button variant="ghost" size="sm" type="button" onClick={() => patch({ photo: '', pixelPhoto: '' })}>Убрать фото</Button></div></div>}</>}
    <FormError error={error} /><div className="dialog-actions">{step === 1 ? <Button variant={existing ? 'ghost' : 'outline'} type="button" className={existing ? 'text-destructive' : ''} onClick={existing ? remove : () => setStep(0)}>{existing ? 'Удалить питомца' : 'Назад'}</Button> : <Button variant="outline" type="button" onClick={cancel}>Отмена</Button>}{step === 0 && <Button variant="outline" type="submit" value="quick" disabled={busy}>Сохранить сейчас</Button>}<Button type="submit" disabled={busy}>{busy ? 'Сохранение…' : step === 0 ? 'Далее' : existing ? 'Сохранить изменения' : 'Сохранить питомца'}{step === 0 && <ArrowRight size={15} />}</Button></div></form></>
}

function RecordForm({ kind, record, petId, pets, today, telegram, openRecord, saved, cancel, remove }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [chosenPet, setChosenPet] = useState(petId)
  const value = record || {}, editing = !!record?.id, pet = pets.find(p => p.id === chosenPet)
  const [foodTolerance, setFoodTolerance] = useState(value.tolerance || 'unknown')
  const title = kind === 'health' ? editing ? 'Медицинская запись' : 'Новая медицинская запись' : kind === 'food' ? editing ? 'Карточка корма' : 'Добавить корм' : editing ? 'Напоминание' : 'Новое напоминание'
  async function submit(event) {
    event.preventDefault(); if (busy) return; const data = Object.fromEntries(new FormData(event.currentTarget)); setBusy(true); setError('')
    try { await api('records/save', { ...data, petId: editing ? petId : data.petChoice || petId, id: value.id || '', kind, rating: Number(data.rating || 0), done: data.done === 'on' }); await saved() }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return <><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Питомец: {pet?.name}</DialogDescription></DialogHeader><form onSubmit={submit} className="record-form">
    {kind === 'health' && <CareFields value={value} today={today} Field={Field} />}
    {kind === 'food' && <><div className="form-grid"><Field label="Фирма"><FoodAutocomplete name="brand" defaultValue={value.brand || ''} maxLength={200} required placeholder="Например, Вискас" /></Field><Field label="Вкус / название"><Input name="flavor" defaultValue={value.flavor || ''} maxLength={200} required /></Field></div><div className="form-grid"><Field label="Порция"><Input name="amount" defaultValue={value.amount || ''} maxLength={200} placeholder="45 г или половина пакетика" required /></Field><Field label="Дата кормления"><Input type="date" name="date" defaultValue={value.date || today} max={today} required /></Field></div><div className="form-grid"><Field label="Предпочтение"><Select name="liked" defaultValue={value.liked || 'unknown'} options={{ unknown: 'Пока не знаю', yes: 'Понравился', no: 'Не понравился' }} /></Field><Field label="Переносимость"><Select name="tolerance" value={foodTolerance} onChange={e => setFoodTolerance(e.target.value)} options={{ unknown: 'Нет наблюдений', good: 'Подошло', bad: 'Не подошло' }} /></Field></div>{foodTolerance === 'bad' && <Field label="Нежелательная реакция"><Select name="reaction" defaultValue={value.reaction || 'none'} options={reactions} /></Field>}<Field label="Личная оценка"><Select name="rating" defaultValue={String(value.rating || 0)} options={{ 0: 'Без оценки', 1: '★ — 1 из 5', 2: '★★ — 2 из 5', 3: '★★★ — 3 из 5', 4: '★★★★ — 4 из 5', 5: '★★★★★ — 5 из 5' }} /></Field><Field label="Наблюдения"><Textarea name="notes" rows={3} defaultValue={value.notes || ''} maxLength={4000} /></Field></>}
    {kind === 'reminder' && <><Field label="Питомец"><NativeSelect name="petChoice" value={chosenPet} onChange={e => setChosenPet(e.target.value)} disabled={editing}>{pets.map(p => <NativeSelectOption key={p.id} value={p.id}>{p.name}</NativeSelectOption>)}</NativeSelect></Field><Field label="Название напоминания"><Input name="title" defaultValue={value.title || ''} placeholder="Например, приём у ветеринара" maxLength={200} required /></Field><div className="form-grid"><Field label="Дата"><Input name="date" type="date" defaultValue={value.date || today} required /></Field><Field label="Время · Москва"><Input name="time" type="time" defaultValue={value.time || '10:00'} required /></Field></div><div className="form-grid"><Field label="Тип события"><Select name="type" defaultValue={value.type || 'other'} options={eventTypes} /></Field><input type="hidden" name="channel" value="telegram" /></div><Field label="Описание"><Textarea name="notes" rows={3} defaultValue={value.notes || ''} maxLength={4000} /></Field>{value.sourceId && <div className="linked-record"><span>Напоминание из медицинского назначения</span>{pet.records.some(r => r.id === value.sourceId) && <Button type="button" variant="ghost" onClick={() => openRecord('health', pet.records.find(r => r.id === value.sourceId), pet.id)}>Открыть назначение <ArrowRight size={14} /></Button>}</div>}{editing && <label className="checkbox-field"><input type="checkbox" name="done" defaultChecked={!!value.done} /> Дело выполнено</label>}<p className="field-hint">{portfolioMode ? 'Напоминание останется в календаре этого браузера. Его можно экспортировать в ICS.' : telegram.connected ? 'Уведомление придёт в подключённый Telegram.' : 'Для уведомлений в Telegram подключите бота в настройках.'}</p></>}
    <FormError error={error} /><div className="dialog-actions"><Button type="button" variant={editing ? 'ghost' : 'outline'} className={editing ? 'text-destructive' : ''} onClick={editing ? remove : cancel}>{editing ? 'Удалить запись' : 'Отмена'}</Button><Button type="submit" disabled={busy}>{busy ? 'Сохранение…' : editing ? 'Сохранить изменения' : 'Сохранить'}</Button></div></form></>
}

function OptionalStep({ stage, pet, add, skip }) {
  return <><DialogHeader><DialogTitle>{stage === 0 ? 'Медицинская история' : 'Питание'}</DialogTitle><DialogDescription>{pet.name} · необязательно</DialogDescription></DialogHeader><p className="optional-description">{stage === 0 ? 'Есть прививки или назначения? Добавьте их в медкарту.' : 'Добавьте корм, чтобы запомнить, что подходит питомцу.'}</p><div className="dialog-actions"><Button variant="outline" onClick={skip}>Заполнить позже</Button><Button onClick={add}><Plus size={16} />{stage === 0 ? 'Добавить запись' : 'Добавить корм'}</Button></div></>
}

function SettingsPage({ state, reload, message, logout, companion, toggleCompanion, walking, toggleWalking, openCompanion }) {
  const [link, setLink] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function action(callback) { setBusy(true); setError(''); try { await callback() } catch (e) { setError(e.message) } finally { setBusy(false) } }
  return <><DialogHeader><DialogTitle>Настройки</DialogTitle><DialogDescription>{state.user.name} · {state.user.demo ? 'Пробный просмотр' : state.user.email}</DialogDescription></DialogHeader>
    {state.user.demo && <p className="sandbox-note">{portfolioMode ? 'Портфолио-демо. Изменения сохраняются в этом браузере и не отправляются на сервер.' : 'Изменения видны только в этой вкладке. При завершении просмотра пробная копия сбрасывается.'}</p>}
    {!portfolioMode && <div className="settings-section"><h3>Telegram</h3>{state.telegram.username && <Button asChild variant="outline" className="telegram-open-bot"><a href={'https://t.me/' + state.telegram.username} target="_blank" rel="noopener noreferrer">Открыть бота <ArrowRight size={16} /></a></Button>}<p>{state.telegram.connected ? 'Подключён. Напоминания и дни рождения придут от имени питомца.' : 'Подключите бота, чтобы получать напоминания вне сайта.'}</p>{state.telegram.error && <FormError error={state.telegram.error} />}{state.telegram.configured ? state.telegram.connected ? <div className="settings-actions"><Button variant="outline" disabled={busy} onClick={() => action(async () => { await api('telegram/test', {}); message('Тестовое сообщение отправлено') })}>Тестовое сообщение</Button><Button variant="ghost" disabled={busy} onClick={() => action(async () => { await api('telegram/unlink', {}); await reload() })}>Отключить</Button></div> : <Button variant="outline" disabled={busy} onClick={() => action(async () => { const result = await api('telegram/link', {}); setLink(result.url) })}>Подключить Telegram</Button> : <p>Подключение временно недоступно.</p>}{link && <div className="telegram-link"><Button asChild><a href={link} target="_blank" rel="noopener noreferrer">Открыть бота и нажать Start</a></Button><Button variant="ghost" onClick={() => action(reload)}>Проверить подключение</Button></div>}</div>}
    <div className="settings-section"><h3>Подсказки питомца</h3><label className="checkbox-field"><input type="checkbox" checked={companion} onChange={toggleCompanion} /> Текстовые напоминания</label></div>
    <div className="settings-section"><h3>Питомец рядом</h3><label className="checkbox-field"><input type="checkbox" checked={walking} onChange={toggleWalking} /> Питомец на экране — можно перетаскивать</label></div>
    <div className="settings-section"><h3>Отдельное окно</h3><Button variant="outline" onClick={() => openCompanion(state.pets[0]?.id)}>Открыть питомца и ближайшие дела</Button></div>
    <FormError error={error} />{portfolioMode && <div className="settings-section"><Button variant="outline" onClick={() => action(async () => { await api('portfolio/reset', {}); await reload(); message('Демо восстановлено') })}>Сбросить демо</Button></div>}<div className="settings-section"><Button variant="ghost" onClick={() => action(logout)} disabled={busy}><LogOut size={16} /> {state.user.demo ? 'Завершить просмотр' : 'Выйти из аккаунта'}</Button></div></>
}

function ConfirmDelete({ modal, cancel, error }) {
  const [busy, setBusy] = useState(false), [failure, setFailure] = useState('')
  async function remove() { setBusy(true); try { await modal.callback() } catch (e) { setFailure(e.message); setBusy(false) } }
  return <><DialogHeader><DialogTitle>{modal.title}</DialogTitle><DialogDescription>Удалённые данные нельзя восстановить.</DialogDescription></DialogHeader><FormError error={failure} /><div className="dialog-actions"><Button variant="outline" onClick={cancel}>Отмена</Button><Button variant="destructive" disabled={busy} onClick={remove}>{busy ? 'Удаление…' : 'Удалить'}</Button></div></>
}
