<div align="center">

<img src="public/icon.svg" width="96" alt="Mi Cocina icon" />

# Mi Cocina

### Asistente personal de cocina y alimentación

**Offline-first · Sin cuenta · Sin suscripción · Todo en tu teléfono**

[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.x-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![PWA Ready](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Android](https://img.shields.io/badge/Android-APK-3DDC84?logo=android&logoColor=white)](https://developer.android.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ¿Qué es Mi Cocina?

**Mi Cocina** es una aplicación móvil y PWA completamente offline para gestionar tu despensa, recetas, lista de compras y nutrición diaria. Sin servidores, sin cuentas, sin costos — todo funciona directamente en tu dispositivo usando IndexedDB como base de datos local.

Construida con **Vue 3 + Vite + Capacitor 8**, corre como APK nativo en Android y como PWA instalable desde el navegador.

---

## ✨ Módulos

### 🥫 Despensa
- Registrá productos con nombre, cantidad, unidad, foto y fecha de vencimiento
- Modos **Suelto/granel** y **Multi-unidad** (paquetes sellados + unidad abierta)
- Estados automáticos: **Disponible · Acabando · Se acabó**
- Escaneo de código de barras (BarcodeDetector nativo + fallback ZXing)
- Foto del producto via cámara (comprimida a ≈ 20 KB con Canvas)
- Notificación local 3 días antes del vencimiento
- Al marcar "se acabó" → el producto aparece en la lista de compras automáticamente

### 🛒 Compras
- Ítems de la despensa añadidos automáticamente al acabarse
- Sugerencias de productos que se están acabando
- Swipe-to-delete táctil
- Marcar como comprado · limpiar comprados de un toque

### 📖 Recetario
- Fichas completas: ingredientes, pasos, etiquetas, dificultad, tiempo, calorías
- Estados: **Por probar · Aprobada · Descartada** con calificación de estrellas
- **Modo Cocina** — filtra recetas según lo que tienes en la despensa
- Filtros avanzados por dificultad, calificación, tiempo, etiquetas e ingredientes
- Al cocinar → propone actualizar el estado de los ingredientes usados

### 🥗 Nutrición
- Registro de comidas con descripción, calorías y hora
- Anillo de progreso animado con meta calórica diaria
- Celebración háptica al alcanzar la meta

### 📊 Métricas
- Gráfico de barras de los últimos 7 días o 4 semanas
- Promedio de kcal/día · días dentro de la meta

### 📅 Planificador semanal
- Grilla desayuno/almuerzo/cena × 7 días con navegación por semanas
- Autocompletado con recetas aprobadas
- Impresión del menú semanal

### 👤 Perfiles
- Múltiples perfiles independientes (nombre + meta calórica)
- Despensa, recetas y métricas separadas por perfil

### 🌗 Modo oscuro
- Toggle en el header, persistido en `localStorage`
- Respeta la preferencia del sistema en el primer arranque

---

## 🛠 Tecnologías

| Capa | Tecnología |
|------|-----------|
| UI Framework | Vue 3 · Composition API · `<script setup>` |
| Build | Vite 8 (rolldown) |
| Mobile | Capacitor 8 — Android nativo |
| PWA | vite-plugin-pwa + Workbox |
| Base de datos | Dexie.js 4 (IndexedDB) |
| Estado global | Pinia 3 |
| Routing | Vue Router 4 · Hash history |
| Escaneo | BarcodeDetector API + @zxing/library (fallback) |
| Notificaciones | @capacitor/local-notifications (sin Firebase) |
| Hápticos | @capacitor/haptics |
| Cámara | @capacitor/camera con compresión Canvas |

**Sin backend. Sin Firebase. Sin APIs externas. Costo mensual: $0.**

---

## 🚀 Primeros pasos

### Requisitos

```
Node.js ≥ 18
Android Studio (solo para el APK)
```

### Instalar y correr en el navegador

```bash
cd cocina-app
npm install
npm run dev
```

Abrí `http://localhost:5173`. La cámara y los hápticos requieren nativo; todo lo demás funciona en el navegador.

### Build web (PWA)

```bash
npm run build
```

El output queda en `dist/`. Podés subirlo a cualquier hosting estático.

### Build APK Android

```bash
# Compilar y sincronizar con Android en un paso
npm run build:android

# Abrir Android Studio para instalar
npm run open:android
```

El APK de debug queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 📁 Estructura

```
cocina-app/
├── src/
│   ├── components/         # AppIcon, BottomNav, BarcodeScanner, Toast
│   ├── composables/        # useHaptics, useNotifications, useTheme, useToast
│   ├── db/index.js         # Esquema Dexie (IndexedDB)
│   ├── router/index.js     # Rutas con lazy loading
│   ├── stores/             # Pinia — profileStore
│   ├── views/              # DespensaView, ComprasView, RecetarioView,
│   │                       # NutricionView, MetricasView, PlanificadorView, PerfilesView
│   ├── App.vue             # Shell principal
│   ├── main.js             # Bootstrap
│   └── style.css           # Design tokens + estilos globales
├── android/                # Proyecto nativo Android (Capacitor)
├── public/                 # Íconos y assets estáticos
├── capacitor.config.json
├── vite.config.js
└── package.json
```

---

## 🗺 Roadmap

- [ ] Exportar / importar datos (JSON backup)
- [ ] Widget Android en pantalla de inicio
- [ ] Compartir recetas como imagen o PDF
- [ ] Soporte iOS (requiere Mac + Xcode)

---

## 📄 Licencia

MIT — ver [LICENSE](LICENSE).

---

<div align="center">

Hecho con ❤️ por [johnvergel-dev](https://github.com/johnvergel-dev)

</div>
