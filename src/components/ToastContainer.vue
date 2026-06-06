<template>
  <Teleport to="body">
    <div class="toast-wrap" aria-live="polite">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast"
          :class="t.type"
        >{{ t.message }}</div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../composables/useToast'
const { toasts } = useToast()
</script>
