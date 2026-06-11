import { db } from '../db/index'

/**
 * Local JSON backup — the only safety net for an offline-only app.
 * Exports every Dexie table into one file and restores it later
 * (merge by id, or full replace). No cloud, no account, no extra plugins:
 * uses the Web Share API on mobile (native share sheet) with a plain
 * download fallback on desktop.
 */
const TABLES = ['profiles', 'products', 'shoppingItems', 'recipes', 'meals', 'mealPlans']
const APP_TAG = 'mi-cocina'

export function useBackup() {
  async function buildEnvelope() {
    const data = {}
    for (const t of TABLES) data[t] = await db[t].toArray()
    return { app: APP_TAG, schema: db.verno, exportedAt: new Date().toISOString(), data }
  }

  function filename() {
    return `mi-cocina-backup-${new Date().toISOString().split('T')[0]}.json`
  }

  function downloadJson(text, name) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function exportAll() {
    const envelope = await buildEnvelope()
    const text  = JSON.stringify(envelope, null, 2)
    const name  = filename()
    const count = TABLES.reduce((s, t) => s + envelope.data[t].length, 0)

    // Prefer the native share sheet (mobile browsers + WebView when supported);
    // fall back to a direct download otherwise.
    try {
      const file = new File([text], name, { type: 'application/json' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Copia de Mi Cocina' })
        return { count }
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return { count } // user dismissed the sheet
      // any other error → fall through to download
    }
    downloadJson(text, name)
    return { count }
  }

  async function readFile(file) {
    const parsed = JSON.parse(await file.text())
    if (!parsed || parsed.app !== APP_TAG || typeof parsed.data !== 'object') {
      throw new Error('Archivo no válido')
    }
    return parsed
  }

  /**
   * @param {File} file
   * @param {{ mode?: 'merge' | 'replace' }} opts
   */
  async function importAll(file, { mode = 'merge' } = {}) {
    const parsed  = await readFile(file)
    const present = TABLES.filter(t => Array.isArray(parsed.data[t]))

    await db.transaction('rw', present.map(t => db[t]), async () => {
      for (const t of present) {
        if (mode === 'replace') await db[t].clear()
        if (parsed.data[t].length) await db[t].bulkPut(parsed.data[t])
      }
    })

    return { count: present.reduce((s, t) => s + parsed.data[t].length, 0) }
  }

  return { exportAll, importAll }
}
