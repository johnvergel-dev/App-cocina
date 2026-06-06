import { ref } from 'vue'

/**
 * Light/dark theme controller.
 *  - Persists an explicit choice in localStorage ('theme' = 'light' | 'dark').
 *  - Falls back to the OS preference when the user hasn't chosen.
 *  - Applies `data-theme` on <html> and keeps the PWA theme-color in sync.
 *
 * An inline script in index.html sets the initial attribute before first
 * paint (no flash); this module keeps it reactive at runtime.
 */
const STORAGE_KEY = 'theme'
const systemDark  = window.matchMedia('(prefers-color-scheme: dark)')

const stored = localStorage.getItem(STORAGE_KEY)
const isDark = ref(stored ? stored === 'dark' : systemDark.matches)

function apply() {
  const root = document.documentElement
  root.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', isDark.value ? '#0f5132' : '#16a34a')
}

// Follow the system only while the user hasn't made an explicit choice.
const onSystemChange = (e) => {
  if (!localStorage.getItem(STORAGE_KEY)) { isDark.value = e.matches; apply() }
}
systemDark.addEventListener
  ? systemDark.addEventListener('change', onSystemChange)
  : systemDark.addListener?.(onSystemChange)

apply()

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
    apply()
  }
  return { isDark, toggle }
}
