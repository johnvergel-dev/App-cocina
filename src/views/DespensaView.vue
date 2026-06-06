<template>
  <!-- Expiry alert (outside scroll area) -->
  <Transition name="alert-slide">
    <div v-if="expiringProducts.length" class="alert-banner" @click="activeFilter = 'disponible'">
      <AppIcon name="alert" :size="15" />
      {{ expiringProducts.length }} producto(s) vencen pronto — tocá para ver
    </div>
  </Transition>

  <div class="view">
    <div class="view-header">
      <h2>Despensa</h2>
      <button class="icon-btn" @click="toggleSearch">
        <AppIcon name="search" :size="20" />
      </button>
    </div>

    <Transition name="slide-down">
      <div v-if="showSearch" class="search-bar-wrap">
        <div class="search-bar">
          <AppIcon name="search" :size="16" color="var(--text-muted)" />
          <input ref="searchInput" v-model="searchQuery" placeholder="Buscar producto…" class="search-input" />
          <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
            <AppIcon name="x" :size="14" />
          </button>
        </div>
      </div>
    </Transition>

    <div class="filter-tabs">
      <button
        v-for="f in filters" :key="f.value"
        class="filter-tab" :class="{ active: activeFilter === f.value }"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
        <span v-if="f.count" class="filter-count">{{ f.count }}</span>
      </button>
    </div>

    <div v-if="filteredProducts.length === 0" class="empty-state">
      <AppIcon name="pantry" :size="56" color="var(--border)" />
      <p v-if="!products.length">Tu despensa está vacía.<br>Empezá agregando tu primer producto.</p>
      <p v-else-if="searchQuery">Sin resultados para "{{ searchQuery }}"</p>
      <p v-else>Sin productos en esta categoría.</p>
      <button v-if="!products.length" class="btn-primary empty-cta" @click="openAddForm">+ Agregar producto</button>
    </div>

    <TransitionGroup v-else name="list" tag="div" class="product-list">
      <div
        v-for="p in filteredProducts" :key="p.id"
        class="product-card" :class="p.status"
        @click="openEditForm(p)"
      >
        <div class="product-icon-col">
          <img v-if="p.photo" :src="p.photo" class="product-thumb" />
          <AppIcon v-else :name="p.presentationType === 'paquete' ? 'package' : 'tag'" :size="18" color="var(--text-muted)" />
        </div>
        <div class="product-info">
          <div class="product-name">{{ p.name }}</div>
          <div v-if="productDetail(p)" class="product-detail">{{ productDetail(p) }}</div>
        </div>
        <div class="product-status" :class="p.status">{{ statusLabel(p.status) }}</div>
      </div>
    </TransitionGroup>
  </div>

  <!-- FAB -->
  <Transition name="fab">
    <button v-if="!showForm && !showScanner" class="fab" @click="openAddForm">
      <AppIcon name="plus" :size="26" />
    </button>
  </Transition>

  <Teleport to="body">
    <!-- Product form -->
    <Transition name="sheet">
      <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
        <div class="modal">
          <div class="modal-handle" />
          <h3>{{ editingProduct ? 'Editar producto' : 'Nuevo producto' }}</h3>

          <label class="field-label">Nombre</label>
          <div class="input-row">
            <input v-model="form.name" placeholder="Ej: Leche, Harina…" class="input" />
            <button class="icon-btn-outlined" title="Escanear código de barras" @click="showScanner = true">
              <AppIcon name="scan" :size="20" />
            </button>
          </div>

          <template v-if="form.barcode">
            <label class="field-label">Código de barras</label>
            <div class="barcode-row">
              <span class="barcode-value">{{ form.barcode }}</span>
              <button class="link-btn" @click="form.barcode = ''">Quitar</button>
            </div>
          </template>

          <label class="field-label">Presentación</label>
          <div class="segmented">
            <button class="seg-btn" :class="{ active: form.presentationType === 'suelto' }"  @click="form.presentationType = 'suelto'">Suelto / granel</button>
            <button class="seg-btn" :class="{ active: form.presentationType === 'paquete' }" @click="form.presentationType = 'paquete'">Multi-unidad</button>
          </div>

          <!-- Suelto -->
          <template v-if="form.presentationType === 'suelto'">
            <label class="field-label">Cantidad (opcional)</label>
            <div class="input-row">
              <input v-model.number="form.quantity" type="number" placeholder="Ej: 500" class="input" />
              <select v-model="form.unit" class="input input-sm">
                <option value="">Unidad</option>
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>
            <label class="field-label">Estado</label>
            <select v-model="form.status" class="input">
              <option value="disponible">✅  Disponible</option>
              <option value="acabando">⚠️  Se está acabando</option>
              <option value="acabado">❌  Se acabó</option>
            </select>
          </template>

          <!-- Paquete -->
          <template v-if="form.presentationType === 'paquete'">
            <div class="field-row">
              <div class="field-col">
                <label class="field-label">Unidades selladas</label>
                <input v-model.number="form.sealedUnits" type="number" min="0" placeholder="0" class="input" />
              </div>
              <div class="field-col">
                <label class="field-label">Alerta "acabando" en ≤</label>
                <input v-model.number="form.acabandoThreshold" type="number" min="0" placeholder="1" class="input" />
              </div>
            </div>

            <div class="toggle-row">
              <span class="toggle-label">Hay una unidad abierta</span>
              <button class="toggle-btn" :class="{ on: form.hasOpenUnit }" @click="form.hasOpenUnit = !form.hasOpenUnit">
                <span class="toggle-knob" />
              </button>
            </div>

            <template v-if="form.hasOpenUnit">
              <div class="input-row">
                <input v-model.number="form.openUnit.remaining" type="number" min="0" placeholder="Restante" class="input" />
                <select v-model="form.openUnit.unit" class="input input-sm">
                  <option value="">Unidad</option>
                  <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
                </select>
              </div>
              <label class="field-label">Consumir antes de (abierto)</label>
              <input v-model="form.openUnit.consumeByDate" type="date" class="input" />
            </template>

            <div class="status-auto" :class="autoStatus">
              Estado calculado: <strong>{{ statusLabel(autoStatus) }}</strong>
            </div>
          </template>

          <!-- Photo -->
          <label class="field-label">Foto (opcional)</label>
          <div class="photo-field">
            <div v-if="form.photo" class="photo-preview-wrap">
              <img :src="form.photo" class="photo-preview" @click="capturePhoto" />
              <button class="photo-remove-btn" @click="form.photo = ''">
                <AppIcon name="x" :size="13" />
              </button>
            </div>
            <button v-else class="photo-capture-btn" @click="capturePhoto">
              <AppIcon name="camera" :size="20" />
              <span>Agregar foto</span>
            </button>
          </div>

          <label class="field-label">Fecha de vencimiento (opcional)</label>
          <input v-model="form.expiryDate" type="date" class="input" />

          <div class="modal-actions">
            <button v-if="editingProduct" class="btn-danger icon-only" @click="deleteProduct">
              <AppIcon name="trash" :size="18" />
            </button>
            <div class="modal-actions-right">
              <button class="btn-secondary" @click="closeForm">Cancelar</button>
              <button class="btn-primary" @click="saveProduct">{{ editingProduct ? 'Guardar' : 'Agregar' }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Barcode scanner -->
    <Transition name="fade">
      <BarcodeScanner v-if="showScanner" @result="onBarcodeResult" @close="showScanner = false" />
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch, nextTick } from 'vue'
import { Capacitor } from '@capacitor/core'
import { db } from '../db/index'
import { useProfileStore }  from '../stores/profileStore'
import { useToast }         from '../composables/useToast'
import { useHaptics }          from '../composables/useHaptics'
import { useNotifications }    from '../composables/useNotifications'
import { useImageCompressor }  from '../composables/useImageCompressor'
import AppIcon        from '../components/AppIcon.vue'
import BarcodeScanner from '../components/BarcodeScanner.vue'

const profileStore  = useProfileStore()
const toast         = useToast()
const haptics       = useHaptics()
const notifications = useNotifications()
const { compress }  = useImageCompressor()

const products       = ref([])
const showForm       = ref(false)
const showScanner    = ref(false)
const showSearch     = ref(false)
const editingProduct = ref(null)
const activeFilter   = ref('all')
const searchQuery    = ref('')
const searchInput    = ref(null)

const units = ['g', 'kg', 'ml', 'L', 'unidades', 'porciones', 'tazas']

const defaultForm = () => ({
  name: '', barcode: '', photo: '', presentationType: 'suelto',
  quantity: '', unit: '', status: 'disponible', expiryDate: '',
  sealedUnits: '', acabandoThreshold: 1,
  hasOpenUnit: false, openUnit: { remaining: '', unit: '', consumeByDate: '' },
})
const form = ref(defaultForm())

const filters = computed(() => [
  { value: 'all',       label: 'Todos',      count: null },
  { value: 'disponible', label: 'Disponible', count: products.value.filter(p => p.status === 'disponible').length || null },
  { value: 'acabando',  label: 'Acabando',   count: products.value.filter(p => p.status === 'acabando').length || null },
  { value: 'acabado',   label: 'Se acabó',   count: products.value.filter(p => p.status === 'acabado').length || null },
])

const filteredProducts = computed(() => {
  let list = activeFilter.value === 'all'
    ? products.value
    : products.value.filter(p => p.status === activeFilter.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q))
  }
  return list
})

const expiringProducts = computed(() => {
  const soon = new Date()
  soon.setDate(soon.getDate() + 3)
  return products.value.filter(p =>
    p.expiryDate && new Date(p.expiryDate) <= soon && p.status !== 'acabado'
  )
})

const autoStatus = computed(() => {
  if (form.value.presentationType !== 'paquete') return form.value.status
  const sealed    = Number(form.value.sealedUnits) || 0
  const threshold = Number(form.value.acabandoThreshold) ?? 1
  const openEmpty = !form.value.hasOpenUnit || !form.value.openUnit.remaining
  if (sealed === 0 && openEmpty) return 'acabado'
  if (sealed <= threshold)       return 'acabando'
  return 'disponible'
})

onMounted(loadProducts)
onActivated(loadProducts)
watch(() => profileStore.activeProfileId, loadProducts)

function toggleSearch() {
  showSearch.value = !showSearch.value
  if (showSearch.value) nextTick(() => searchInput.value?.focus())
  else searchQuery.value = ''
}

async function loadProducts() {
  if (!profileStore.activeProfileId) return
  const list = await db.products.where('profileId').equals(profileStore.activeProfileId).toArray()
  const order = { disponible: 0, acabando: 1, acabado: 2 }
  list.sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
    return a.name.localeCompare(b.name, 'es')
  })
  products.value = list
}

function openAddForm() {
  editingProduct.value = null
  form.value = defaultForm()
  showForm.value = true
}

function openEditForm(product) {
  editingProduct.value = product
  form.value = {
    name: product.name,
    barcode: product.barcode || '',
    photo: product.photo || '',
    presentationType: product.presentationType || 'suelto',
    quantity: product.quantity ?? '',
    unit: product.unit || '',
    status: product.status,
    expiryDate: product.expiryDate || '',
    sealedUnits: product.sealedUnits ?? '',
    acabandoThreshold: product.acabandoThreshold ?? 1,
    hasOpenUnit: !!product.openUnit,
    openUnit: product.openUnit
      ? { ...product.openUnit }
      : { remaining: '', unit: '', consumeByDate: '' },
  }
  showForm.value = true
}

async function capturePhoto() {
  if (!Capacitor.isNativePlatform()) { toast.info('Foto disponible solo en la app instalada'); return }
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
    const photo = await Camera.getPhoto({
      quality: 75, allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt,
      saveToGallery: false,
    })
    const raw = `data:image/jpeg;base64,${photo.base64String}`
    form.value.photo = await compress(raw, 800, 0.65) // ~20KB vs ~2MB raw
  } catch (e) {
    if (e?.message && !e.message.toLowerCase().includes('cancel')) {
      toast.error('No se pudo acceder a la cámara')
    }
  }
}

function closeForm() { showForm.value = false; editingProduct.value = null }

async function onBarcodeResult(barcode) {
  showScanner.value  = false
  form.value.barcode = barcode
  const existing = await db.products
    .where('barcode').equals(barcode)
    .filter(p => p.profileId === profileStore.activeProfileId)
    .first()
  if (existing) {
    form.value.name             = existing.name
    form.value.presentationType = existing.presentationType || 'suelto'
    form.value.unit             = existing.unit || ''
    toast.success(`Reconocido: ${existing.name}`)
  } else {
    toast.info('Código escaneado — ingresá el nombre')
  }
}

async function saveProduct() {
  if (!form.value.name.trim()) return
  haptics.light()
  const status     = form.value.presentationType === 'paquete' ? autoStatus.value : form.value.status
  const prevStatus = editingProduct.value?.status

  const data = {
    profileId: profileStore.activeProfileId,
    name:      form.value.name.trim(),
    barcode:   form.value.barcode || null,
    photo:     form.value.photo   || null,
    presentationType: form.value.presentationType,
    expiryDate: form.value.expiryDate || null,
    status,
    quantity:    form.value.presentationType === 'suelto' ? (form.value.quantity || null) : null,
    unit:        form.value.presentationType === 'suelto' ? (form.value.unit || null) : null,
    sealedUnits: form.value.presentationType === 'paquete' ? (Number(form.value.sealedUnits) || 0) : null,
    acabandoThreshold: form.value.presentationType === 'paquete' ? (Number(form.value.acabandoThreshold) ?? 1) : null,
    openUnit: form.value.presentationType === 'paquete' && form.value.hasOpenUnit
      ? { ...form.value.openUnit }
      : null,
  }

  if (editingProduct.value) {
    await db.products.update(editingProduct.value.id, data)
    if (status === 'acabado' && prevStatus !== 'acabado') {
      await addToShoppingList(editingProduct.value.id, data.name)
      await notifications.cancelProductNotification(editingProduct.value.id)
    } else {
      await notifications.scheduleProductExpiry({ id: editingProduct.value.id, ...data })
    }
    toast.success('Producto actualizado')
  } else {
    const id = await db.products.add(data)
    if (status === 'acabado') await addToShoppingList(id, data.name)
    else await notifications.scheduleProductExpiry({ id, ...data })
    toast.success(`${data.name} agregado`)
  }

  await profileStore.refreshShoppingCount()
  closeForm()
  await loadProducts()
}

async function addToShoppingList(productId, name) {
  const existing = await db.shoppingItems
    .where('productId').equals(productId)
    .filter(i => !i.bought)
    .first()
  if (!existing) {
    await db.shoppingItems.add({
      profileId: profileStore.activeProfileId,
      name, origin: 'product', productId, bought: false,
    })
  }
}

async function deleteProduct() {
  if (!editingProduct.value) return
  haptics.heavy()
  const { id, name } = editingProduct.value
  await notifications.cancelProductNotification(id)
  await db.products.delete(id)
  await db.shoppingItems.where('productId').equals(id).delete()
  await profileStore.refreshShoppingCount()
  toast.info(`${name} eliminado`)
  closeForm()
  await loadProducts()
}

function productDetail(p) {
  const parts = []
  if (p.presentationType === 'paquete') {
    if (p.sealedUnits !== null && p.sealedUnits !== undefined) parts.push(`${p.sealedUnits} selladas`)
    if (p.openUnit) parts.push('1 abierta')
  } else if (p.quantity && p.unit) {
    parts.push(`${p.quantity} ${p.unit}`)
  }
  if (p.expiryDate) parts.push(`Vence ${new Date(p.expiryDate).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`)
  return parts.join(' · ')
}

function statusLabel(s) {
  return { disponible: 'Disponible', acabando: 'Acabando', acabado: 'Se acabó' }[s] || s
}
</script>
