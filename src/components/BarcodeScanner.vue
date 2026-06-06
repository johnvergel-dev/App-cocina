<template>
  <div class="scanner-shell">
    <div class="scanner-header">
      <button class="scanner-close" @click="emit('close')">
        <AppIcon name="x" :size="22" />
      </button>
      <span>Escanear código</span>
    </div>

    <div class="scanner-viewport">
      <video ref="videoEl" autoplay playsinline muted class="scanner-video" />
      <div class="scanner-guide">
        <span class="corner tl" /><span class="corner tr" />
        <span class="corner bl" /><span class="corner br" />
      </div>
    </div>

    <p class="scanner-hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppIcon from './AppIcon.vue'

const emit = defineEmits(['result', 'close'])

const videoEl = ref(null)
const hint    = ref('Apuntá al código de barras…')

let stream      = null
let animFrame   = null
let detector    = null
let zxingReader = null

onMounted(startCamera)

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 } },
    })
    videoEl.value.srcObject = stream

    if ('BarcodeDetector' in window) {
      detector = new window.BarcodeDetector({
        formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','qr_code'],
      })
      requestAnimationFrame(scanLoop)
    } else {
      hint.value = 'Cargando escáner alternativo…'
      const { BrowserMultiFormatReader } = await import('@zxing/library')
      zxingReader = new BrowserMultiFormatReader()
      zxingReader.decodeFromStream(stream, videoEl.value, (result) => {
        if (result) done(result.getText())
      })
      hint.value = 'Apuntá al código de barras…'
    }
  } catch {
    hint.value = 'No se pudo acceder a la cámara.'
  }
}

async function scanLoop() {
  if (!videoEl.value || videoEl.value.readyState < 2) {
    animFrame = requestAnimationFrame(scanLoop)
    return
  }
  try {
    const results = await detector.detect(videoEl.value)
    if (results.length) { done(results[0].rawValue); return }
  } catch { /* ignore frame errors */ }
  animFrame = requestAnimationFrame(scanLoop)
}

function done(value) {
  stopCamera()
  emit('result', value)
}

function stopCamera() {
  if (animFrame)   cancelAnimationFrame(animFrame)
  if (zxingReader) zxingReader.reset()
  if (stream)      stream.getTracks().forEach(t => t.stop())
}

onUnmounted(stopCamera)
</script>
