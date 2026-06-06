import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

export function useHaptics() {
  async function light() {
    if (!isNative) return
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      await Haptics.impact({ style: ImpactStyle.Light })
    } catch {}
  }

  async function medium() {
    if (!isNative) return
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      await Haptics.impact({ style: ImpactStyle.Medium })
    } catch {}
  }

  async function heavy() {
    if (!isNative) return
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      await Haptics.impact({ style: ImpactStyle.Heavy })
    } catch {}
  }

  async function selection() {
    if (!isNative) return
    try {
      const { Haptics } = await import('@capacitor/haptics')
      await Haptics.selectionChanged()
    } catch {}
  }

  return { light, medium, heavy, selection }
}
