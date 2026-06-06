/**
 * Compresses a base64/dataURL image via Canvas before storing in IndexedDB.
 * Reduces typical camera photos from 1-5MB to ~15-30KB.
 */
export function useImageCompressor() {
  function compress(dataUrl, maxPx = 800, quality = 0.65) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width  * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve(dataUrl) // pass-through on error
      img.src = dataUrl
    })
  }

  return { compress }
}
