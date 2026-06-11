import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    target: 'es2020',           // No legacy polyfills → smaller output
    cssMinify: true,
    rollupOptions: {
      output: {
        // Keep vendor chunks stable so browser/SW cache survives rebuilds
        manualChunks(id) {
          if (id.includes('node_modules/dexie'))      return 'vendor-dexie'
          if (id.includes('node_modules/@zxing'))     return 'vendor-zxing'
          if (id.includes('node_modules/@capacitor')) return 'vendor-cap'
        },
      },
    },
  },

  plugins: [
    vue(),
    VitePWA({
      // Manual registration — main.js skips this inside Capacitor WebView
      registerType:    'prompt',
      injectRegister: null,

      workbox: {
        globPatterns:          ['**/*.{js,css,html,svg}'],
        globIgnores:           ['**/vendor-zxing*.js'],  // ZXing (410KB) loads lazily; no need to precache
        cleanupOutdatedCaches: true,
        skipWaiting:           true,
        clientsClaim:          true,
      },

      manifest: {
        name:             'Mi Cocina',
        short_name:       'Mi Cocina',
        description:      'Asistente personal de cocina y alimentación',
        lang:             'es',
        theme_color:      '#16a34a',
        background_color: '#f9fafb',
        display:          'standalone',
        orientation:      'portrait',
        start_url:        '/',
        icons: [
          { src: 'icon.svg',        sizes: 'any',     type: 'image/svg+xml'                    },
          { src: 'pwa-192.png',      sizes: '192x192', type: 'image/png'                        },
          { src: 'pwa-512.png',      sizes: '512x512', type: 'image/png'                        },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'   },
        ],
      },
    }),
  ],
})
