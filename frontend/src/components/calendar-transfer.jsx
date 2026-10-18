import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { fetchCalendarFile, saveCalendarFile } from '../data'

export function CalendarTransfer({ petId, count }) {
  const [platform, setPlatform] = useState('iphone')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [sharing, setSharing] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!count) { setFile(null); setError(''); return }
    let active = true
    setFile(null)
    setError('')
    fetchCalendarFile(petId).then(value => { if (active) setFile(value) }).catch(() => {
      if (active) setError('Не удалось подготовить календарь. Проверьте подключение и попробуйте ещё раз.')
    })
    return () => { active = false }
  }, [petId, count, attempt])

  const canShare = file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
  const lastTwo = count % 100, last = count % 10
  const eventWord = lastTwo >= 11 && lastTwo <= 14 ? 'событий' : last === 1 ? 'событие' : last >= 2 && last <= 4 ? 'события' : 'событий'
  const shareAction = canShare && <Button type="button" key="share" variant={platform === 'iphone' ? 'default' : 'outline'} onClick={share} disabled={sharing}>{sharing ? 'Открываем…' : 'Поделиться файлом'}</Button>
  const downloadAction = <Button type="button" key="download" variant={platform === 'android' || !canShare ? 'default' : 'outline'} disabled={!file} onClick={() => saveCalendarFile(file)}>{file ? 'Скачать календарь' : 'Подготавливаем…'}</Button>
  async function share() {
    if (!canShare || sharing) return
    setSharing(true)
    setError('')
    try { await navigator.share({ files: [file], title: 'Календарь PetCare' }) }
    catch (reason) { if (reason?.name !== 'AbortError') setError('Не удалось открыть меню отправки. Скачайте файл ниже.') }
    finally { setSharing(false) }
  }

  return <section className="calendar-transfer" aria-label="Перенос событий в календарь">
    <div className="calendar-transfer-heading"><h2>Перенести напоминания</h2><span>{count} {eventWord}</span></div>
    <p>Выберите календарь. Перенесутся невыполненные напоминания {petId === 'all' ? 'всех питомцев' : 'выбранного питомца'}.</p>
    <div className="line-tabs calendar-transfer-tabs" role="group" aria-label="Куда перенести события">
      <button type="button" aria-pressed={platform === 'iphone'} className={platform === 'iphone' ? 'active' : ''} onClick={() => setPlatform('iphone')}>iPhone</button>
      <button type="button" aria-pressed={platform === 'android'} className={platform === 'android' ? 'active' : ''} onClick={() => setPlatform('android')}>Android / Google</button>
    </div>
    {!count ? <p role="status">Пока нет напоминаний для переноса.</p> : <>
      {platform === 'iphone' ? <p>Отправьте файл себе через Mail и откройте вложение на iPhone. В календаре подтвердите добавление событий.</p>
        : <p>Google Календарь импортирует файл на компьютере: откройте настройки → «Импорт и экспорт» → выберите скачанный файл. После импорта события появятся и на Android в той же учётной записи.</p>}
      <div className="calendar-transfer-actions">
        {platform === 'iphone' ? [shareAction, downloadAction] : [downloadAction, shareAction]}
        {platform === 'android' && <a href="https://calendar.google.com/calendar/u/0/r/settings/export" target="_blank" rel="noopener noreferrer">Открыть импорт Google Календаря ↗</a>}
      </div>
      {error && <p className="calendar-transfer-error" role="alert">{error} {!file && <button type="button" onClick={() => setAttempt(value => value + 1)}>Повторить</button>}</p>}
      <small>Это разовый перенос. Новые напоминания нужно переносить повторно.</small>
    </>}
  </section>
}
