# Contribuir a Mi Cocina

¡Gracias por tomarte el tiempo de contribuir! 🎉

## Antes de empezar

- Revisá los [issues abiertos](https://github.com/johnvergel-dev/App-cocina/issues) para ver si alguien ya reportó lo mismo.
- Para cambios grandes, abrí un issue primero para discutir la idea antes de invertir tiempo en el código.

## Setup local

```bash
git clone https://github.com/johnvergel-dev/App-cocina.git
cd App-cocina/cocina-app
npm install
npm run dev
```

## Convenciones de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

| Prefijo | Cuándo usarlo |
|---------|--------------|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `style:` | Cambios de CSS/UI sin lógica |
| `refactor:` | Refactorización sin cambio de comportamiento |
| `docs:` | Solo documentación |
| `chore:` | Build, dependencias, config |

Ejemplo: `feat: agregar modo de escaneo continuo en despensa`

## Estilo de código

- **Vue 3** con `<script setup>` y Composition API
- Sin TypeScript (proyecto intencionalmente ligero)
- CSS global en `src/style.css` usando custom properties (`--var`)
- Sin librerías de componentes externas — los componentes son propios
- Nombres de componentes en PascalCase, composables con prefijo `use`

## Pull Requests

1. Creá una rama desde `main`: `git checkout -b fix/nombre-del-fix`
2. Hacé tus cambios y verificá que `npm run build` pase sin errores
3. Abrí el PR con una descripción clara de qué cambia y por qué
4. Las screenshots o GIFs son muy bienvenidos para cambios de UI

## Reportar bugs

Usá el template de [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md).
Incluí siempre: versión de Android, steps to reproduce y comportamiento esperado vs actual.
