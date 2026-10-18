self.addEventListener('push', event => {
  let payload = { title: 'PetCare', body: 'Проверьте напоминания питомца.' }
  try { payload = { ...payload, ...event.data.json() } } catch { /* Invalid payload stays readable. */ }
  event.waitUntil(self.registration.showNotification(payload.title, { body: payload.body, tag: payload.tag, icon: '/favicon.svg', data: { url: '/' } }))
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin)
    return existing ? existing.focus() : clients.openWindow('/')
  }))
})
