# Changelog

Todas las novedades notables de **Mi Cocina**. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[Versionado Semántico](https://semver.org/lang/es/).

## [1.1.0] — 2026-06-11

### ✨ Nuevo
- **Copia de seguridad** completa: exportar e importar todos los datos como JSON
  (modos *combinar* y *reemplazar*), desde Perfiles.
- **Foto del resultado** en las recetas, con la misma compresión a ≈ 20 KB de la despensa.
- **Registrar comida desde una receta**: un toque lleva las calorías a Nutrición.
- Rediseño visual completo ("design system v2"): paleta verde más rica, profundidad y
  sombras suaves, encabezado con logo, navegación translúcida, botón flotante y micro-interacciones.

### 🎨 Marca
- Ícono propio de **Mi Cocina** en el lanzador, ícono adaptativo, redondo y splash de Android,
  reemplazando el ícono por defecto de Capacitor.
- Íconos PWA `192/512` + **maskable** y `apple-touch-icon`; íconos generados desde `public/icon.svg`.

### 🐛 Correcciones
- Umbral "acabando" de productos multi-unidad: el valor vacío ahora vale 1 (antes 0).
- `--accent-text` se autorreferenciaba y rompía el texto de los chips ámbar en modo claro.
- Guarda contra una posible doble escritura del planificador al editar dos celdas muy rápido.

### ♿ Accesibilidad
- `aria-label` en botones de solo ícono (FAB, búsqueda, navegación, impresión, editar/eliminar).
- Ícono de impresora real en el planificador y `lang: es` en el manifiesto PWA.

### 🔧 Mantenimiento
- Vue actualizado a 3.5.37; 0 vulnerabilidades en dependencias de producción.
- README profesional con capturas claro/oscuro; este CHANGELOG.

## [1.0.0] — 2026-06

### ✨ Primer lanzamiento
- App offline-first con 7 módulos: Despensa, Compras, Recetario, Nutrición, Métricas,
  Planificador y Perfiles.
- Vue 3 + Vite 8 + Capacitor 8, Dexie/IndexedDB, escaneo de código de barras,
  notificaciones locales, hápticos, cámara y modo oscuro.

[1.1.0]: https://github.com/johnvergel-dev/App-cocina/releases/tag/v1.1.0
[1.0.0]: https://github.com/johnvergel-dev/App-cocina/releases/tag/v1.0.0
