const modes = new Set(['system', 'light', 'dark'])
const key = 'petcare.theme'
export function readThemeMode(session, local) {
  for (const store of [session, local]) {
    try { const value = store?.getItem(key); if (modes.has(value)) return value } catch {}
  }
  return 'system'
}
export function resolveTheme(mode, systemDark) {
  return mode === 'light' || mode === 'dark' ? mode : systemDark ? 'dark' : 'light'
}
export function saveThemeMode(mode, session, local) {
  if (!modes.has(mode)) return
  let demo = false
  try { demo = Boolean(session?.getItem('petcare.demo')) } catch {}
  try { (demo ? session : local)?.setItem(key, mode) } catch {}
}
export function observeSystemTheme(mode, media, apply) {
  const update = () => apply(resolveTheme(mode, Boolean(media?.matches)))
  update()
  if (mode !== 'system' || !media) return () => {}
  if (media.addEventListener) {
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }
  media.addListener?.(update)
  return () => media.removeListener?.(update)
}
