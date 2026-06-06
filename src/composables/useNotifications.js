import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

export function useNotifications() {
  async function createChannel() {
    if (!isNative) return
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.createChannel({
        id:          'expiry',
        name:        'Vencimientos',
        description: 'Alertas de productos próximos a vencer',
        importance:  4,
        vibration:   true,
      })
    } catch {}
  }

  async function requestPermission() {
    if (!isNative) return false
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const { display } = await LocalNotifications.requestPermissions()
      return display === 'granted'
    } catch { return false }
  }

  async function scheduleProductExpiry(product) {
    if (!isNative || !product?.expiryDate || !product?.id) return
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')

      // Cancel any existing notification for this product first
      await LocalNotifications.cancel({ notifications: [{ id: product.id }] })

      const expiry    = new Date(product.expiryDate)
      const notifyAt  = new Date(expiry)
      notifyAt.setDate(expiry.getDate() - 3)
      notifyAt.setHours(9, 0, 0, 0)

      if (notifyAt <= new Date()) return // already past

      const fmt = d => d.toLocaleDateString('es', { day: 'numeric', month: 'long' })

      await LocalNotifications.schedule({
        notifications: [{
          id:        product.id,
          title:     'Mi Cocina — Vencimiento próximo',
          body:      `${product.name} vence el ${fmt(expiry)}. ¡Revisá tu despensa!`,
          schedule:  { at: notifyAt },
          channelId: 'expiry',
          smallIcon: 'ic_launcher',
        }],
      })
    } catch {}
  }

  async function cancelProductNotification(productId) {
    if (!isNative || !productId) return
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.cancel({ notifications: [{ id: productId }] })
    } catch {}
  }

  return { createChannel, requestPermission, scheduleProductExpiry, cancelProductNotification }
}
