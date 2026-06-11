/**
 * One-off icon generator for "Mi Cocina".
 *
 * Single source of truth for the brand mark (green tile + white pot + steam).
 * Writes the refined master `public/icon.svg` and rasterizes every asset that
 * `@capacitor/assets` and the PWA manifest need:
 *
 *   assets/icon-only.png        1024  full tile (legacy + round launcher icon)
 *   assets/icon-foreground.png  1024  white pot on transparent, in the adaptive safe zone
 *   assets/icon-background.png  1024  solid brand green
 *   assets/splash.png           2732  pot centered on green
 *   assets/splash-dark.png      2732  pot centered on dark green
 *   public/pwa-192.png          192   PWA manifest icon (any)
 *   public/pwa-512.png          512   PWA manifest icon (any)
 *   public/maskable-512.png     512   PWA maskable icon (pot inside safe zone on green)
 *   public/apple-touch-icon-180.png   iOS home-screen icon
 *
 * Run once after editing the geometry below:  node scripts/gen-icons.mjs
 * Then:  npx capacitor-assets generate --android  &&  npx cap sync android
 */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here   = dirname(fileURLToPath(import.meta.url))
const root   = join(here, '..')
const assets = join(root, 'assets')
const pub    = join(root, 'public')

const GREEN      = '#16a34a'
const GREEN_DARK = '#0f5132'

// Pot + steam in a 512 coordinate space. `fill` colours the pot; the contact
// shadow is a fixed dark green that reads as depth on both the tile and splash.
function pot(fill, sw = 11) {
  return `
    <ellipse cx="256" cy="430" rx="138" ry="15" fill="#0a4f25" opacity="0.22"/>
    <rect x="120" y="240" width="272" height="176" rx="26" fill="${fill}"/>
    <rect x="96"  y="216" width="320" height="32"  rx="14" fill="${fill}"/>
    <rect x="70"  y="218" width="38"  height="64"  rx="19" fill="${fill}"/>
    <rect x="404" y="218" width="38"  height="64"  rx="19" fill="${fill}"/>
    <path d="M196 206 Q210 176 196 146 Q182 116 196 86" stroke="${fill}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>
    <path d="M256 206 Q270 176 256 146 Q242 116 256 86" stroke="${fill}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>
    <path d="M316 206 Q330 176 316 146 Q302 116 316 86" stroke="${fill}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>
  `
}

// Full branded tile: vertical green gradient + soft top highlight + white pot.
function tile(size) {
  return Buffer.from(
`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1aa650"/>
      <stop offset="1" stop-color="#137a39"/>
    </linearGradient>
    <radialGradient id="hl" cx="0.5" cy="0.05" r="0.85">
      <stop offset="0"    stop-color="#ffffff" stop-opacity="0.20"/>
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <rect width="512" height="512" rx="112" fill="url(#hl)"/>
  ${pot('#ffffff')}
</svg>`)
}

// Pot scaled into the central `frac` of a square, optionally over a solid bg.
function potBox(size, frac, fill, bg) {
  const inner = size * frac
  const s     = inner / 512
  const off   = (size - inner) / 2
  const bgr   = bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''
  return Buffer.from(
`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bgr}
  <g transform="translate(${off} ${off}) scale(${s})">${pot(fill)}</g>
</svg>`)
}

const render = (buf, size, file) =>
  sharp(buf, { density: 384 }).resize(size, size).png().toFile(file)

const solid = (size, color, file) =>
  sharp({ create: { width: size, height: size, channels: 4, background: color } }).png().toFile(file)

await mkdir(assets, { recursive: true })

// Master SVG — keep favicon / README / PWA SVG icon in sync with the rasters.
await writeFile(join(pub, 'icon.svg'), tile(512))

await Promise.all([
  // @capacitor/assets sources
  render(tile(1024),                       1024, join(assets, 'icon-only.png')),
  render(potBox(1024, 0.58, '#ffffff', null), 1024, join(assets, 'icon-foreground.png')),
  solid(1024, GREEN,                       join(assets, 'icon-background.png')),
  render(potBox(2732, 0.34, '#ffffff', GREEN),      2732, join(assets, 'splash.png')),
  render(potBox(2732, 0.34, '#ffffff', GREEN_DARK), 2732, join(assets, 'splash-dark.png')),
  // PWA / web
  render(tile(192),                        192,  join(pub, 'pwa-192.png')),
  render(tile(512),                        512,  join(pub, 'pwa-512.png')),
  render(potBox(512, 0.62, '#ffffff', GREEN), 512, join(pub, 'maskable-512.png')),
  render(tile(180),                        180,  join(pub, 'apple-touch-icon-180.png')),
])

console.log('✓ icons generated → assets/ and public/')
