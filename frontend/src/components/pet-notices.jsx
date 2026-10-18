import React, { useEffect, useState } from 'react'
import { companionNotice } from '../companion'
import { Pet } from './pet'
import { X } from './pixel-icons'

const seen = new Set()
let nextNoticeAt = Date.now() + 60000

// A quiet text notification. No roaming overlay, audio, or made-up care advice.
export function PetNotices({ pet, blocked, enabled, openRecord, go }) {
  const [notice, setNotice] = useState(null), [interacting, setInteracting] = useState(false), [editing, setEditing] = useState(false)
  useEffect(() => {
    const focused = () => setEditing(!!document.activeElement?.closest('input,textarea,select,[contenteditable=true]'))
    document.addEventListener('focusin', focused); document.addEventListener('focusout', focused)
    return () => { document.removeEventListener('focusin', focused); document.removeEventListener('focusout', focused) }
  }, [])
  useEffect(() => {
    const timer = setInterval(() => {
      if (!enabled || blocked || editing || document.hidden || Date.now() < nextNoticeAt) return
      const next = companionNotice(pet, new Date(), seen)
      if (next) { seen.add(next.key); nextNoticeAt = Date.now() + 180000; setInteracting(false); setNotice(next) }
    }, 5000)
    return () => clearInterval(timer)
  }, [pet, enabled, blocked, editing])
  useEffect(() => { if (!notice || interacting) return; const timer = setTimeout(() => setNotice(null), 16000); return () => clearTimeout(timer) }, [notice, interacting])
  function dismiss() { nextNoticeAt = Date.now() + 180000; setNotice(null) }
  if (!notice || !enabled || blocked || editing) return null
  return <aside className="companion-bubble" role="status" aria-live="polite" onMouseEnter={() => setInteracting(true)} onFocusCapture={() => setInteracting(true)}><div className="companion-says"><Pet pet={pet} paused /><strong>{pet.name}: напоминаю</strong><button aria-label="Закрыть напоминание питомца" onClick={dismiss}><X size={16} /></button></div><strong>{notice.title}</strong><p>{notice.text}</p>{(notice.record || notice.action) && <button className="companion-open" onClick={() => { if (notice.record) openRecord('reminder', notice.record, pet.id); else go(notice.action, pet.id); dismiss() }}>Открыть {notice.record ? 'напоминание' : 'медкарту'}</button>}</aside>
}
