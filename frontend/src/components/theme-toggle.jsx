import React, { useEffect, useId, useState } from 'react'
import { Popover } from 'radix-ui'
import { Button } from './ui/button'
import { observeSystemTheme, readThemeMode, resolveTheme, saveThemeMode } from '../theme-preference'

function storage(name) { try { return window[name] } catch { return undefined } }
function savedMode() { return readThemeMode(storage('sessionStorage'), storage('localStorage')) }
function systemMedia() { return window.matchMedia?.('(prefers-color-scheme: dark)') }
export function initialTheme() { return resolveTheme(savedMode(), Boolean(systemMedia()?.matches)) }
const choices = [['system', 'Как в системе'], ['light', 'Светлая'], ['dark', 'Тёмная']]

export function ThemeToggle() {
  const [mode, setMode] = useState(savedMode)
  const [open, setOpen] = useState(false)
  const group = useId()
  useEffect(() => observeSystemTheme(mode, systemMedia(), theme => {
    document.documentElement.dataset.theme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    window.dispatchEvent(new CustomEvent('petcare-theme', { detail: { mode, theme } }))
  }), [mode])
  useEffect(() => {
    const sync = event => {
      const next = event.type === 'storage' ? savedMode() : event.detail?.mode
      if (choices.some(([value]) => value === next)) setMode(next)
    }
    window.addEventListener('storage', sync)
    window.addEventListener('petcare-theme', sync)
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('petcare-theme', sync) }
  }, [])
  function choose(value) {
    saveThemeMode(value, storage('sessionStorage'), storage('localStorage'))
    setMode(value)
    setOpen(false)
  }
  const label = choices.find(([value]) => value === mode)[1]
  return <Popover.Root open={open} onOpenChange={setOpen}>
    <Popover.Trigger asChild>
      <Button variant="ghost" size="icon" className="theme-trigger" aria-label={`Выбрать тему. Сейчас: ${label}`} title={`Тема: ${label}`}>
        <svg className="pixel-sun" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
          <path d="M9 6h6v3h3v6h-3v3H9v-3H6V9h3z" />
          <path d="M11 0h2v4h-2zM11 20h2v4h-2zM0 11h4v2H0zM20 11h4v2h-4zM3 3h3v3H3zM18 3h3v3h-3zM3 18h3v3H3zM18 18h3v3h-3z" />
        </svg>
      </Button>
    </Popover.Trigger>
    <Popover.Portal><Popover.Content className="theme-menu" aria-label="Тема оформления" align="end" sideOffset={8} collisionPadding={12}>
      <fieldset><legend>Тема оформления</legend>{choices.map(([value, text]) => <label key={value} className="theme-option">
        <input type="radio" name={group} value={value} checked={mode === value} onChange={() => choose(value)} />
        <span>{text}</span>
      </label>)}</fieldset>
    </Popover.Content></Popover.Portal>
  </Popover.Root>
}
