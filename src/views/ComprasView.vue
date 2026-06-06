<template>
  <div class="view">
    <div class="view-header">
      <h2>Lista de compras</h2>
      <button v-if="boughtItems.length" class="btn-ghost" @click="clearBought">Limpiar</button>
    </div>

    <!-- Oportunidades: acabando in despensa but not yet in list -->
    <template v-if="oportunidades.length">
      <div class="section-header">
        <AppIcon name="tag" :size="13" /> Productos que se están acabando
      </div>
      <div class="oportunidades-list">
        <div v-for="p in oportunidades" :key="p.id" class="oportunidad-card">
          <div class="oportunidad-name">{{ p.name }}</div>
          <button class="btn-outline-sm" @click="addFromDespensa(p)">
            <AppIcon name="plus" :size="14" /> Agregar
          </button>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <div v-if="!pendingItems.length && !boughtItems.length && !oportunidades.length" class="empty-state">
      <AppIcon name="cart" :size="56" color="var(--border)" />
      <p>Lista vacía. Los productos marcados como "se acabó" en la despensa aparecerán aquí automáticamente.</p>
      <button class="btn-primary empty-cta" @click="openAdd">+ Agregar a la lista</button>
    </div>

    <!-- Pending -->
    <template v-if="pendingItems.length">
      <div class="section-header">Pendiente ({{ pendingItems.length }})</div>
      <TransitionGroup name="list" tag="div" class="shopping-list">
        <div v-for="item in pendingItems" :key="item.id" class="swipe-item-wrap">
          <div class="swipe-delete-zone" :style="{ opacity: Math.min((swipeDx[item.id] || 0) / 80, 1) }">
            <AppIcon name="trash" :size="20" />
          </div>
          <div
            class="shopping-item swipe-item"
            :style="{ transform: `translateX(-${swipeDx[item.id] || 0}px)` }"
            :class="{ swiping: (swipeDx[item.id] || 0) > 0 }"
            @touchstart.passive="swipeStart($event, item.id)"
            @touchmove.prevent="swipeMove($event, item.id)"
            @touchend="swipeEnd(item)"
          >
            <button class="check-btn" @click="toggleBought(item)" />
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span v-if="item.origin === 'product'" class="item-origin">De la despensa</span>
            </div>
            <button class="delete-btn" @click="deleteItem(item)">
              <AppIcon name="x" :size="16" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </template>

    <!-- Bought -->
    <template v-if="boughtItems.length">
      <div class="section-header muted">Comprado ({{ boughtItems.length }})</div>
      <div class="shopping-list faded">
        <div v-for="item in boughtItems" :key="item.id" class="shopping-item bought">
          <button class="check-btn done" @click="toggleBought(item)">
            <AppIcon name="check" :size="14" />
          </button>
          <span class="item-name">{{ item.name }}</span>
          <button class="delete-btn" @click="deleteItem(item)">
            <AppIcon name="x" :size="16" />
          </button>
        </div>
      </div>
    </template>
  </div>

  <!-- FAB -->
  <Transition name="fab">
    <button v-if="!showAddForm" class="fab" @click="openAdd">
      <AppIcon name="plus" :size="26" />
    </button>
  </Transition>

  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showAddForm" class="modal-overlay" @click.self="showAddForm = false">
        <div class="modal">
          <div class="modal-handle" />
          <h3>Agregar a la lista</h3>
          <input
            ref="addInput"
            v-model="newItem"
            placeholder="Nombre del producto"
            class="input"
            @keyup.enter="addItem"
          />
          <div class="modal-actions">
            <button class="btn-secondary" @click="showAddForm = false">Cancelar</button>
            <button class="btn-primary" @click="addItem">Agregar</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch, nextTick } from 'vue'
import { db } from '../db/index'
import { useProfileStore } from '../stores/profileStore'
import { useToast }        from '../composables/useToast'
import { useHaptics }      from '../composables/useHaptics'
import AppIcon from '../components/AppIcon.vue'

const profileStore = useProfileStore()
const toast        = useToast()
const haptics      = useHaptics()

const items            = ref([])
const despensaAcabando = ref([])
const showAddForm      = ref(false)
const newItem          = ref('')
const addInput         = ref(null)
const swipeDx          = ref({})
const swipeStartX      = {}

const pendingItems  = computed(() => items.value.filter(i => !i.bought))
const boughtItems   = computed(() => items.value.filter(i =>  i.bought))
const oportunidades = computed(() => {
  const inList = new Set(items.value.filter(i => !i.bought && i.productId).map(i => i.productId))
  return despensaAcabando.value.filter(p => !inList.has(p.id))
})

onMounted(loadAll)
onActivated(loadAll)
watch(() => profileStore.activeProfileId, loadAll)
watch(showAddForm, v => { if (v) nextTick(() => addInput.value?.focus()) })

async function loadAll() {
  if (!profileStore.activeProfileId) return
  const [list, acabando] = await Promise.all([
    db.shoppingItems.where('profileId').equals(profileStore.activeProfileId).toArray(),
    db.products.where('profileId').equals(profileStore.activeProfileId)
      .filter(p => p.status === 'acabando').toArray(),
  ])
  items.value            = list
  despensaAcabando.value = acabando
}

function openAdd() {
  showAddForm.value = true
}

async function addItem() {
  if (!newItem.value.trim()) return
  await db.shoppingItems.add({
    profileId: profileStore.activeProfileId,
    name:      newItem.value.trim(),
    origin:    'manual',
    productId: null,
    bought:    false,
  })
  toast.success(`${newItem.value.trim()} agregado`)
  newItem.value     = ''
  showAddForm.value = false
  await afterMutation()
}

async function addFromDespensa(product) {
  await db.shoppingItems.add({
    profileId: profileStore.activeProfileId,
    name:      product.name,
    origin:    'product',
    productId: product.id,
    bought:    false,
  })
  toast.success(`${product.name} agregado`)
  await afterMutation()
}

async function toggleBought(item) {
  haptics.light()
  await db.shoppingItems.update(item.id, { bought: !item.bought })
  await afterMutation()
}

async function deleteItem(item) {
  haptics.medium()
  await db.shoppingItems.delete(item.id)
  await afterMutation()
}

async function clearBought() {
  haptics.medium()
  await db.shoppingItems.bulkDelete(boughtItems.value.map(i => i.id))
  toast.info('Comprados eliminados')
  await afterMutation()
}

async function afterMutation() {
  await loadAll()
  await profileStore.refreshShoppingCount()
}

// Swipe-to-delete
function swipeStart(e, id) {
  swipeStartX[id]   = e.touches[0].clientX
  swipeDx.value[id] = 0
}
function swipeMove(e, id) {
  const dx = swipeStartX[id] - e.touches[0].clientX
  swipeDx.value[id] = dx > 0 ? Math.min(dx, 90) : 0
}
async function swipeEnd(item) {
  if ((swipeDx.value[item.id] || 0) > 70) {
    delete swipeDx.value[item.id]
    await deleteItem(item)
  } else {
    swipeDx.value[item.id] = 0
  }
}
</script>
