<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-brand">
        <img src="/icon.svg" class="app-logo" alt="" />
        <div class="app-brand-text">
          <span class="app-kicker">{{ greeting }}</span>
          <h1 class="app-title">Mi Cocina</h1>
        </div>
      </div>
      <div class="header-actions">
        <button
          class="theme-toggle"
          :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
          @click="toggleTheme"
        >
          <AppIcon :name="isDark ? 'sun' : 'moon'" :size="18" />
        </button>
        <button
          v-if="profileStore.activeProfile"
          class="profile-chip"
          @click="router.push('/perfiles')"
        >{{ profileStore.activeProfile.name }}</button>
      </div>
    </header>

    <main class="app-content">
      <RouterView v-slot="{ Component, route }">
        <Transition name="fade">
          <div :key="route.path" class="view-wrapper">
            <component :is="Component" />
          </div>
        </Transition>
      </RouterView>
    </main>

    <BottomNav />
    <ToastContainer />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { useProfileStore }    from './stores/profileStore'
import { useNotifications }   from './composables/useNotifications'
import { useTheme }           from './composables/useTheme'
import { useHaptics }         from './composables/useHaptics'
import { db }                 from './db/index'
import AppIcon        from './components/AppIcon.vue'
import BottomNav      from './components/BottomNav.vue'
import ToastContainer from './components/ToastContainer.vue'

const router        = useRouter()
const route         = useRoute()
const profileStore  = useProfileStore()
const notifications = useNotifications()
const haptics       = useHaptics()
const { isDark, toggle } = useTheme()

function toggleTheme() { haptics.selection(); toggle() }

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6)  return 'Buenas noches'
  if (h < 13) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
})


onMounted(async () => {
  await profileStore.loadProfiles()
  if (profileStore.profiles.length === 0) {
    await profileStore.createProfile('Mi Perfil', 2000)
  }

  if (Capacitor.isNativePlatform()) {
    // Status bar icon colour: Style.Dark = white/light icons (readable on our green header).
    // We do NOT call setOverlaysWebView — the green status bar is set natively in
    // styles.xml so there is no overlap and no "safe area inset" race condition.
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar')
      await StatusBar.setStyle({ style: Style.Dark })
    } catch {}

    // Delay permission request to avoid triggering the onPause/onResume cycle
    // before the Capacitor bridge has fully settled.
    setTimeout(async () => {
      await notifications.createChannel()
      await notifications.requestPermission()
    }, 1500)
  }

  // Purge meal records older than 180 days — prevents unbounded IndexedDB growth
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 180)
    await db.meals.where('date').below(cutoff.toISOString().split('T')[0]).delete()
  } catch {}
})
</script>
