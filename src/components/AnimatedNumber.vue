<template>
  <span>{{ display }}</span>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  value:    { type: Number, default: 0 },
  duration: { type: Number, default: 650 },
  format:   { type: Function, default: (n) => Math.round(n).toLocaleString('es') },
})

const display = ref(props.format(0))
let frame = null
let from  = 0

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function tween(to) {
  cancelAnimationFrame(frame)
  if (reduceMotion) { display.value = props.format(to); from = to; return }

  const start = performance.now()
  const startVal = from
  const delta = to - startVal

  const step = (now) => {
    const t = Math.min((now - start) / props.duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)          // easeOutCubic
    display.value = props.format(startVal + delta * eased)
    if (t < 1) frame = requestAnimationFrame(step)
    else from = to
  }
  frame = requestAnimationFrame(step)
}

onMounted(() => tween(props.value))
watch(() => props.value, (v) => tween(v))
onUnmounted(() => cancelAnimationFrame(frame))
</script>
