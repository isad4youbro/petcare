import React, { useMemo, useRef, useState } from 'react'
import { getSpecies, getKind, kindOfSpecies, createConfig, OPTIONS, PATTERN_LABELS, PALETTE, changeSpecies, applyPreset, resolveSpec, EXT_LABEL, NECK, HEAD } from '../../vendor/pixel-pets/src/index.js'
import { avatarConfig } from '../avatar'
import { animalGroups, findAnimals, groupOf, naturalColors, naturalPatterns, colorNames } from '../animal-options'
import { Input } from './ui/input'
import { NativeSelect, NativeSelectOption } from './ui/native-select'
import { Button } from './ui/button'
import { Check, ChevronDownIcon, Search } from './pixel-icons'
import { Pet } from './pet'
import { AvatarPhoto } from './avatar-photo'
import { AvatarPainter } from './avatar-painter'

function breedName(animal) { const kind = getKind(kindOfSpecies(animal.id)); return ['cat_domestic', 'dog_mongrel'].includes(animal.id) || kind?.name === animal.name ? '' : animal.name }
function MiniPet({ species }) {
  const thumbnail = useMemo(() => ({ species, name: '', avatar: { sprite: createConfig(species) } }), [species])
  return <Pet key={species} pet={thumbnail} paused decorative />
}
export function AvatarEditor({ pet, patch, Field, initialMode = 'custom' }) {
  const selection = useRef(null), history = useRef([]), future = useRef([])
  const [mode, setMode] = useState(initialMode), [pose, setPose] = useState('stand'), [, setRevision] = useState(0)
  const config = avatarConfig(pet), entry = getSpecies(config.species), rig = entry.rig, effective = resolveSpec(config)
  const [query, setQuery] = useState(''), [group, setGroup] = useState(() => pet.id ? groupOf(entry).id : '')
  const [choosing, setChoosing] = useState(false), [limit, setLimit] = useState(6), [colorSlot, setColorSlot] = useState('base'), [customPalette, setCustomPalette] = useState(false)
  const matches = useMemo(() => findAnimals(query, group), [query, group])
  const palette = customPalette ? PALETTE : naturalColors(entry, colorSlot), wearable = ['cat', 'quad'].includes(rig)
  const customType = !getSpecies(pet.species) && !['cat', 'dog', 'bird', 'snake', 'lizard', 'turtle', 'fish', 'hamster', 'hedgehog', 'spider', 'snail', 'frog', 'rabbit', 'other'].includes(pet.species) ? pet.species : ''
  const extraLabel = rig === 'quad' ? (entry.type === 'farm' ? 'Копыта' : null) : rig === 'chameleon' ? null : EXT_LABEL[rig]
  const patterns = [...new Set([...naturalPatterns(entry), config.pattern])]
  const shapeOptions = OPTIONS[rig] || []
  function commit(value) { history.current = [...history.current.slice(-39), { species: pet.species, breed: pet.breed, pixelPhoto: pet.pixelPhoto || '', avatar: structuredClone(pet.avatar) }]; future.current = []; patch(value); setRevision(n => n + 1) }
  function update(next) { const animal = getSpecies(next.species); commit({ species: next.species === config.species ? pet.species : animal.id, breed: next.species === config.species ? pet.breed : breedName(animal), pixelPhoto: '', avatar: { ...pet.avatar, sprite: next } }) }
  function travel(back) { const from = back ? history : future, to = back ? future : history; if (!from.current.length) return; to.current.push({ species: pet.species, breed: pet.breed, pixelPhoto: pet.pixelPhoto || '', avatar: structuredClone(pet.avatar) }); patch(from.current.pop()); setRevision(n => n + 1) }
  function choose(id) {
    const animal = getSpecies(id), next = changeSpecies(config, id)
    next.colors.base = naturalColors(animal)[0]; next.colors.acc = '733e39'
    next.neck = ['cat', 'quad'].includes(animal.rig) ? 'collar' : 'none'
    commit({ species: id, breed: breedName(animal), pixelPhoto: '', avatar: { ...pet.avatar, sprite: next } })
    setGroup(groupOf(animal).id); setChoosing(false); setQuery(''); setColorSlot('base'); setCustomPalette(false)
    requestAnimationFrame(() => { selection.current?.closest('[role="dialog"]')?.scrollTo({ top: 0, behavior: 'instant' }); selection.current?.focus({ preventScroll: true }) })
  }
  function slot(key) { setColorSlot(key); setCustomPalette(false) }
  return <><Field label="Имя питомца"><Input name="petName" value={pet.name} onChange={e => patch({ name: e.target.value })} maxLength={100} placeholder="Как его зовут?" required /></Field>
    <div className="pet-editor"><div className="editor-preview"><div className={"editor-pet-emotion " + (pose === "happy" ? "is-happy" : "")} aria-label={pose === "happy" ? "Питомец радуется" : undefined}><Pet key={config.species} pet={pet} pose={pose === "happy" ? "stand" : pose} /></div><div className="preview-poses" aria-label="Настроение питомца">{[["stand", "Стоит"], ["walk", "Идёт"], ["sit", "Сидит"], ["sleep", "Спит"], ["happy", "Радуется"]].map(([id, label]) => <button key={id} type="button" aria-pressed={pose === id} onClick={() => setPose(id)}>{label}</button>)}</div><strong>{pet.name || 'Ваш питомец'}</strong><span>{customType || entry.name}</span></div><div className="editor-controls">
      <div className="animal-picker"><span className="field-label">Вид и порода</span><button ref={selection} className="animal-selection" type="button" aria-expanded={choosing} aria-controls="animal-options" onClick={() => setChoosing(value => !value)}><MiniPet key={entry.id} species={entry.id} /><span>{customType || entry.name}<small>{choosing ? "Свернуть выбор" : "Выбрать вид и породу"}</small></span><ChevronDownIcon size={16} style={{ transform: choosing ? "rotate(180deg)" : undefined }} /></button>
        {choosing && <div id="animal-options" className="animal-options"><Button type="button" variant="ghost" className="animal-collapse" onClick={() => setChoosing(false)}>Свернуть выбор <ChevronDownIcon size={16} /></Button><div className="animal-search"><Search size={17} /><Input type="search" aria-label="Поиск вида или породы" value={query} onChange={e => { setQuery(e.target.value); setLimit(6) }} placeholder="Вид или порода" /></div>
          {!query && group && <div className="animal-group-heading"><Button type="button" variant="ghost" onClick={() => setGroup('')}>Все виды</Button><span>{animalGroups.find(category => category.id === group)?.name}</span></div>}{!query && !group && <div className="animal-groups" aria-label="Виды животных">{animalGroups.map(category => <button key={category.id} type="button" aria-pressed={group === category.id} onClick={() => { setGroup(category.id); setLimit(6) }}><MiniPet species={category.pet} /><span>{category.name}</span></button>)}</div>}
          <div className="animal-results" aria-label="Подходящие животные">{matches.slice(0, limit).map(animal => <button type="button" key={animal.id} aria-pressed={entry.id === animal.id} onClick={() => choose(animal.id)}><MiniPet species={animal.id} /><span>{animal.name}</span>{entry.id === animal.id && <Check size={16} />}</button>)}</div>
          {(query || group) && !matches.length && <p className="empty-line">Не нашли. Попробуйте другое название.</p>}
          {matches.length > limit && <Button type="button" variant="ghost" className="animal-more" onClick={() => setLimit(value => value + 12)}>Показать ещё · {matches.length - limit}</Button>}
          <details className="animal-other"><summary>Другой вид</summary><Field label="Название вида"><Input value={customType} maxLength={100} placeholder="Например, сервал" onChange={e => patch({ species: e.target.value || config.species, breed: e.target.value ? '' : breedName(entry) })} /></Field>{customType && <Button type="button" variant="outline" onClick={() => setChoosing(false)}>Выбрать</Button>}</details>
        </div>}
      </div>
      {<><div className="constructor-toolbar"><div className="constructor-tabs" aria-label="Режим редактора">{[['custom', 'Настроить'], ['photo', 'По фото'], ['paint', 'Раскрасить']].map(([id, label]) => <button key={id} type="button" aria-pressed={mode === id} onClick={() => { setMode(id); setChoosing(false) }}>{label}</button>)}</div><div className="constructor-history"><Button type="button" variant="ghost" disabled={!history.current.length} aria-label="Отменить изменение аватара" onClick={() => travel(true)}>↶</Button><Button type="button" variant="ghost" disabled={!future.current.length} aria-label="Повторить изменение аватара" onClick={() => travel(false)}>↷</Button></div></div>
      {mode === 'photo' ? <AvatarPhoto pet={pet} config={config} apply={update} /> : mode === 'paint' ? <AvatarPainter config={config} update={update} /> : <><fieldset className="color-fieldset"><legend>Окрас</legend><div className="color-slots" aria-label="Что покрасить">{[['base', 'Тело'], ...(config.pattern !== 'solid' ? [['sec', 'Второй цвет'], ['pat', 'Узор']] : []), ['eye', 'Глаза'], ...((wearable && config.neck !== 'none') || config.head !== 'none' ? [['acc', 'Аксессуар']] : []), ...(extraLabel ? [['ext', extraLabel]] : [])].map(([key, label]) => <button key={key} type="button" aria-pressed={colorSlot === key} onClick={() => slot(key)}><i style={{ background: '#' + config.colors[key] }} />{label}</button>)}</div>
        <div className="swatches">{palette.map(hex => <button type="button" key={hex} style={{ backgroundColor: '#' + hex }} aria-label={(colorNames[hex] || 'Цвет') + ' #' + hex} title={colorNames[hex] || '#' + hex} aria-pressed={config.colors[colorSlot] === hex} onClick={() => update({ ...config, colors: { ...config.colors, [colorSlot]: hex } })}>{config.colors[colorSlot] === hex && <Check size={18} />}</button>)}<button className="palette-custom" type="button" aria-label={customPalette ? 'Вернуть естественную палитру' : 'Открыть полную палитру'} title={customPalette ? 'Естественная палитра' : 'Полная палитра'} aria-pressed={customPalette} onClick={() => setCustomPalette(value => !value)}><span>···</span></button></div>
      </fieldset>
      <div className="form-grid"><Field label="Рисунок"><NativeSelect value={config.pattern} onChange={e => { update({ ...config, pattern: e.target.value }); setColorSlot('base'); setCustomPalette(false) }}>{patterns.map(pattern => <NativeSelectOption key={pattern} value={pattern}>{PATTERN_LABELS[pattern]}</NativeSelectOption>)}</NativeSelect></Field>{wearable && <Field label="Ошейник"><NativeSelect value={config.neck} onChange={e => { update({ ...config, neck: e.target.value }); setColorSlot('base') }}>{NECK.map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}</NativeSelect></Field>}</div>
      <details className="avatar-options"><summary>Готовые окрасы и форма</summary><div className="preset-options">{entry.presets.map((preset, index) => <Button type="button" variant="outline" key={preset.name} onClick={() => { update(applyPreset(config, index)); setCustomPalette(false) }}>{preset.name}</Button>)}</div><div className="form-grid">{shapeOptions.map(([key, label, choices]) => <Field key={key} label={label}><NativeSelect value={config.parts[key] ?? effective.p[key] ?? choices[0][0]} onChange={e => update({ ...config, parts: { ...config.parts, [key]: e.target.value } })}>{choices.map(([id, title]) => <NativeSelectOption key={id} value={id}>{title}</NativeSelectOption>)}</NativeSelect></Field>)}</div><div className="form-grid"><Field label="На шее"><NativeSelect value={config.neck} onChange={e => update({ ...config, neck: e.target.value })}>{NECK.map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}</NativeSelect></Field><Field label="На голове"><NativeSelect value={config.head} onChange={e => update({ ...config, head: e.target.value })}>{HEAD.map(([id, label]) => <NativeSelectOption key={id} value={id}>{label}</NativeSelectOption>)}</NativeSelect></Field></div></details></>}</>}
    </div></div></>
}
