<template>
  <nav class="bottom-nav">
    <RouterLink to="/despensa"  class="nav-item" active-class="active" @click="haptics.selection()">
      <span class="nav-icon-wrap"><AppIcon name="pantry" :size="22" /></span>
      <span class="nav-label">Despensa</span>
    </RouterLink>

    <RouterLink to="/compras" class="nav-item" active-class="active" @click="haptics.selection()">
      <span class="nav-icon-wrap">
        <AppIcon name="cart" :size="22" />
        <span v-if="profileStore.shoppingPendingCount" class="nav-badge">
          {{ profileStore.shoppingPendingCount > 99 ? '99+' : profileStore.shoppingPendingCount }}
        </span>
      </span>
      <span class="nav-label">Compras</span>
    </RouterLink>

    <RouterLink to="/recetas" class="nav-item" active-class="active" @click="haptics.selection()">
      <span class="nav-icon-wrap"><AppIcon name="book" :size="22" /></span>
      <span class="nav-label">Recetas</span>
    </RouterLink>

    <RouterLink to="/nutricion" class="nav-item" active-class="active" @click="haptics.selection()">
      <span class="nav-icon-wrap"><AppIcon name="heart" :size="22" /></span>
      <span class="nav-label">Nutrición</span>
    </RouterLink>

    <button class="nav-item" :class="{ active: masActive }" @click="haptics.selection(); masMenuOpen = !masMenuOpen">
      <span class="nav-icon-wrap"><AppIcon name="menu" :size="22" /></span>
      <span class="nav-label">Más</span>
    </button>

    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="masMenuOpen" class="mas-overlay" @click="masMenuOpen = false">
          <div class="mas-menu" @click.stop>
            <div class="mas-handle" />
            <RouterLink to="/metricas"     class="mas-item" @click="masMenuOpen = false">
              <AppIcon name="chart"    :size="20" /><span>Métricas</span>
            </RouterLink>
            <RouterLink to="/planificador" class="mas-item" @click="masMenuOpen = false">
              <AppIcon name="calendar" :size="20" /><span>Planificador</span>
            </RouterLink>
            <RouterLink to="/perfiles"     class="mas-item" @click="masMenuOpen = false">
              <AppIcon name="user"     :size="20" /><span>Perfiles</span>
            </RouterLink>
          </div>
        </div>
      </Transition>
    </Teleport>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProfileStore } from '../stores/profileStore'
import { useHaptics } from '../composables/useHaptics'
import AppIcon from './AppIcon.vue'

const route        = useRoute()
const profileStore = useProfileStore()
const haptics      = useHaptics()
const masMenuOpen  = ref(false)
const masActive    = computed(() =>
  ['/metricas', '/planificador', '/perfiles'].includes(route.path)
)
</script>
