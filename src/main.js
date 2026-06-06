import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Capacitor } from '@capacitor/core'
import { router } from './router/index'
import App from './App.vue'
import './style.css'

createApp(App).use(createPinia()).use(router).mount('#app')

// Register Service Worker only in browser/PWA context.
// Inside the Capacitor WebView all assets are already bundled in the APK —
// registering the SW would just double-cache them in Cache Storage for no benefit.
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
}
