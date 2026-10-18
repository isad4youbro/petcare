import { api } from './data'
export const pushSupported = () => window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
async function registration() { return navigator.serviceWorker.register('/sw.js') }
export async function currentSubscription() {
  if (!pushSupported()) return null
  const worker = await navigator.serviceWorker.getRegistration('/')
  return worker ? worker.pushManager.getSubscription() : null
}
export async function enablePush() {
  if (!pushSupported()) throw new Error('Push доступен в поддерживаемом браузере по HTTPS. На iPhone сначала добавьте сайт на экран «Домой».')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Разрешение не получено. Измените настройки уведомлений сайта в браузере и повторите.')
  const config = await api('push/config')
  if (!config.configured) throw new Error('Push пока не настроен на сервере')
  const worker = await registration()
  await navigator.serviceWorker.ready
  let subscription = await worker.pushManager.getSubscription()
  if (!subscription) {
    const key = config.publicKey.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(key + '='.repeat((4 - key.length % 4) % 4)), c => c.charCodeAt(0))
    subscription = await worker.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes })
  }
  await api('push/subscribe', { subscription: subscription.toJSON() })
  return subscription
}
export async function disablePush() {
  const subscription = await currentSubscription()
  if (!subscription) return
  await api('push/unsubscribe', { endpoint: subscription.endpoint })
  await subscription.unsubscribe()
}
