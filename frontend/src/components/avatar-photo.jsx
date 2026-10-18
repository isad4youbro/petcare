import React, { useEffect, useRef, useState } from 'react'
import { matchPhotoColors, matchPhotoKind, kindOfSpecies } from '../../vendor/pixel-pets/src/index.js'
import { cropSquare, photoPalette } from '../avatar-tools'
import { Button } from './ui/button'
import { Pet } from './pet'

export function AvatarPhoto({ pet, config, apply }) {
  const [source, setSource] = useState(pet.photo || ''), [image, setImage] = useState(null), [zoom, setZoom] = useState(1), [x, setX] = useState(.5), [y, setY] = useState(.5), [results, setResults] = useState([]), [error, setError] = useState(''), [allBreeds, setAllBreeds] = useState(false)
  const canvas = useRef(null), input = useRef(null), drag = useRef(null)
  useEffect(() => { if (!source) return; let live = true; const img = new Image(); img.onload = () => { if (live) setImage(img) }; img.onerror = () => setError('Не удалось открыть фото'); img.src = source; return () => { live = false } }, [source])
  useEffect(() => {
    if (!image || !canvas.current) return
    const context = canvas.current.getContext('2d'), crop = cropSquare(image.naturalWidth, image.naturalHeight, zoom, x, y)
    context.clearRect(0, 0, 192, 192); context.drawImage(image, crop.x, crop.y, crop.side, crop.side, 0, 0, 192, 192)
    setResults([])
  }, [image, zoom, x, y, config.species, allBreeds])
  function file(event) {
    const selected = event.target.files?.[0]; if (!selected) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || selected.size > 10000000) { setError('Нужно фото JPEG, PNG или WebP до 10 МБ'); return }
    const reader = new FileReader(); reader.onload = () => { setSource(reader.result); setZoom(1); setX(.5); setY(.5); setError('') }; reader.onerror = () => setError('Не удалось прочитать файл'); reader.readAsDataURL(selected); event.target.value = ''
  }
  function match() {
    if (!canvas.current) return
    const colors = photoPalette(canvas.current.getContext('2d').getImageData(0, 0, 192, 192).data)
    if (!colors.length) { setError('На фото нет видимых цветов'); return }
    const base = { ...config, paint: {}, paintBase: 'constructor' }
    setResults((allBreeds ? matchPhotoKind(kindOfSpecies(config.species), colors, base, { preferSpecies: config.species }) : matchPhotoColors(config.species, colors, base)).slice(0, 6)); setError('')
  }
  return <section className="avatar-photo"><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={file} /><Button type="button" variant="outline" onClick={() => input.current?.click()}>{source ? 'Другое фото' : 'Выбрать фото'}</Button>
    {!source && <p className="field-hint">Крупный план питомца при дневном свете.</p>}
    {image && <><canvas ref={canvas} width="192" height="192" className="photo-crop" aria-label="Область фото для подбора окраса" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { px: e.clientX, py: e.clientY, x, y } }} onPointerMove={e => { if (!drag.current) return; const size = e.currentTarget.getBoundingClientRect().width; setX(Math.max(0, Math.min(1, drag.current.x - (e.clientX - drag.current.px) / size))); setY(Math.max(0, Math.min(1, drag.current.y - (e.clientY - drag.current.py) / size))) }} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} />
      <label className="crop-slider">Масштаб<input type="range" min="1" max="4" step=".05" value={zoom} onChange={e => setZoom(+e.target.value)} /></label>
      <details><summary>Положение кадра</summary><label className="crop-slider">По горизонтали<input aria-label="По горизонтали" type="range" min="0" max="1" step=".01" value={x} onChange={e => setX(+e.target.value)} /></label><label className="crop-slider">По вертикали<input aria-label="По вертикали" type="range" min="0" max="1" step=".01" value={y} onChange={e => setY(+e.target.value)} /></label></details>
      <label className="photo-breeds"><input type="checkbox" checked={allBreeds} onChange={e => setAllBreeds(e.target.checked)} /> Показать другие породы этого вида</label><Button type="button" onClick={match}>Подобрать окрас</Button><p className="field-hint">Выделите питомца в кадре. Подбор по цветам, фото остаётся на устройстве.</p></>}
    {error && <p role="alert" className="field-error">{error}</p>}
    {!!results.length && <div className="photo-variants" aria-label="Варианты по фото">{results.map((result, i) => <button type="button" key={result.speciesId + result.presetIndex} onClick={() => apply(result.config)}><Pet decorative pet={{ ...pet, species: result.speciesId, pixelPhoto: '', avatar: { sprite: result.config } }} /><span>{allBreeds ? result.speciesName : result.presetName}</span><small>Выбрать {i + 1}</small></button>)}</div>}
  </section>
}
