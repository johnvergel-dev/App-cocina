<template>
  <Transition :name="panelDir === 'left' ? 'slide-left' : 'slide-right'" mode="out-in">

    <!-- ══ LIST ══ -->
    <div v-if="panel === 'list'" key="list" class="view">
      <div class="view-header">
        <h2>Recetario</h2>
        <div style="display:flex;gap:.5rem;align-items:center">
          <button class="cocina-toggle-btn" :class="{ active: cocinaModeOn }" @click="cocinaModeOn = !cocinaModeOn" title="Cocina con lo que tenés">
            <AppIcon name="pantry" :size="17" />
          </button>
          <button class="filter-toggle-btn" :class="{ active: showFilters || activeFilterCount > 0 }" @click="showFilters = !showFilters">
            <AppIcon name="search" :size="17" />
            <span v-if="activeFilterCount" class="filter-badge">{{ activeFilterCount }}</span>
          </button>
        </div>
      </div>

      <!-- Search bar -->
      <div class="search-bar-wrap">
        <div class="search-bar">
          <AppIcon name="search" :size="15" color="var(--text-muted)" />
          <input v-model="searchQuery" placeholder="Buscar por título o etiqueta…" class="search-input" />
          <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
            <AppIcon name="x" :size="13" />
          </button>
        </div>
      </div>

      <!-- Advanced filters panel -->
      <Transition name="slide-down">
        <div v-if="showFilters" class="adv-filter-panel">

          <div class="filter-row-label">Dificultad</div>
          <div class="filter-chips">
            <button v-for="d in diffOptions" :key="d.val" class="filter-chip" :class="[{ active: filterDifficulty === d.val }, d.cls]" @click="filterDifficulty = d.val">{{ d.label }}</button>
          </div>

          <div class="filter-row-label">Calificación mínima</div>
          <div class="filter-chips">
            <button v-for="n in [0,1,2,3,4,5]" :key="n" class="filter-chip" :class="{ active: filterMinRating === n }" @click="filterMinRating = n">{{ n === 0 ? 'Todas' : '★'.repeat(n) }}</button>
          </div>

          <div class="filter-row-label">Tiempo máximo</div>
          <div class="filter-chips">
            <button v-for="t in timeOptions" :key="t.val" class="filter-chip" :class="{ active: filterMaxTime === t.val }" @click="filterMaxTime = t.val">{{ t.label }}</button>
          </div>

          <template v-if="allTags.length">
            <div class="filter-row-label">Etiquetas</div>
            <div class="filter-chips wrap">
              <button v-for="tag in allTags" :key="tag" class="filter-chip" :class="{ active: filterTags.includes(tag) }" @click="toggleTag(tag)">{{ tag }}</button>
            </div>
          </template>

          <div class="filter-row-label">Contiene ingrediente</div>
          <div class="filter-tag-wrap">
            <span v-for="ing in filterIngInclude" :key="ing" class="filter-tag include">{{ ing }}<button @click="removeFilter(filterIngInclude,ing)">×</button></span>
            <input v-model="filterIngInput" placeholder="Ej: pollo…" class="filter-ing-input" @keydown.enter.prevent="addFilter(filterIngInclude, filterIngInput); filterIngInput=''" @keydown.,.prevent="addFilter(filterIngInclude, filterIngInput); filterIngInput=''" />
          </div>

          <div class="filter-row-label">Excluir ingrediente</div>
          <div class="filter-tag-wrap">
            <span v-for="ing in filterIngExclude" :key="ing" class="filter-tag exclude">{{ ing }}<button @click="removeFilter(filterIngExclude,ing)">×</button></span>
            <input v-model="filterExcIngInput" placeholder="Ej: mariscos…" class="filter-ing-input" @keydown.enter.prevent="addFilter(filterIngExclude, filterExcIngInput); filterExcIngInput=''" @keydown.,.prevent="addFilter(filterIngExclude, filterExcIngInput); filterExcIngInput=''" />
          </div>

          <button v-if="activeFilterCount" class="btn-ghost" style="align-self:flex-start;padding:0" @click="clearFilters">Limpiar filtros ({{ activeFilterCount }})</button>
        </div>
      </Transition>

      <!-- Status tabs -->
      <div class="filter-tabs">
        <button v-for="f in statusFilters" :key="f.value" class="filter-tab" :class="{ active: activeFilter === f.value }" @click="activeFilter = f.value">
          {{ f.label }}<span v-if="f.count" class="filter-count">{{ f.count }}</span>
        </button>
      </div>

      <div v-if="cocinaModeOn" class="cocina-banner">
        <AppIcon name="pantry" :size="14" /> Mostrando disponibilidad según tu despensa
      </div>

      <div v-if="!filteredRecipes.length" class="empty-state">
        <AppIcon name="book" :size="52" color="var(--border)" />
        <p v-if="!recipes.length">Tu recetario está vacío.<br>Empezá agregando tu primera receta.</p>
        <p v-else>Sin recetas con estos filtros.</p>
        <button v-if="!recipes.length" class="btn-primary empty-cta" @click="openForm(null)">+ Agregar receta</button>
        <button v-if="activeFilterCount || searchQuery" class="btn-secondary btn-sm" @click="clearFilters(); searchQuery=''">Limpiar búsqueda</button>
      </div>

      <TransitionGroup v-else name="list" tag="div" class="recipe-grid">
        <div
          v-for="r in filteredRecipes" :key="r.id"
          class="recipe-card" :class="{ dimmed: cocinaModeOn && !getAvailability(r).all }"
          @click="openDetail(r)"
        >
          <div class="recipe-card-header">
            <span class="recipe-title">{{ r.title }}</span>
            <span class="recipe-status-dot" :class="statusDotClass(r.status)" />
          </div>
          <div class="recipe-card-meta">
            <div class="stars-sm"><span v-for="n in 5" :key="n" :class="{ on: r.rating >= n }">★</span></div>
            <span v-if="r.difficulty" class="difficulty-chip" :class="`diff-${r.difficulty}`">{{ diffLabel(r.difficulty) }}</span>
            <span v-if="r.prepTime" class="time-chip"><AppIcon name="clock" :size="11" />{{ r.prepTime }}min</span>
          </div>
          <div v-if="r.tags?.length" class="recipe-tags-row">
            <span v-for="tag in r.tags.slice(0,3)" :key="tag" class="tag-pill">{{ tag }}</span>
          </div>
          <div v-if="cocinaModeOn && !getAvailability(r).all" class="missing-hint">
            Faltan {{ getAvailability(r).missing.length }} ingrediente(s)
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- ══ DETAIL ══ -->
    <div v-else-if="panel === 'detail'" key="detail" class="view">
      <div class="panel-header">
        <button class="back-btn" @click="navigate('list','right')"><AppIcon name="arrow-left" :size="20" /> Recetas</button>
        <button class="icon-btn" aria-label="Editar receta" @click="openForm(selectedRecipe)"><AppIcon name="edit" :size="20" /></button>
      </div>

      <img v-if="selectedRecipe?.photo" :src="selectedRecipe.photo" class="recipe-hero" alt="" />

      <h2 class="detail-title">{{ selectedRecipe?.title }}</h2>

      <div class="detail-status-row">
        <span class="status-badge" :class="statusBadgeClass(selectedRecipe?.status)">{{ statusLabel(selectedRecipe?.status) }}</span>
        <template v-if="selectedRecipe?.status === 'por probar'">
          <button class="btn-sm success-btn" @click="setStatus('aprobada')">✓ Aprobar</button>
          <button class="btn-sm" @click="setStatus('descartada')">✗ Descartar</button>
        </template>
        <button v-if="selectedRecipe?.status !== 'por probar'" class="btn-sm" @click="setStatus('por probar')">↩ Resetear</button>
      </div>

      <div v-if="selectedRecipe?.rating" class="stars-display">
        <span v-for="n in 5" :key="n" :class="{ on: selectedRecipe.rating >= n }">★</span>
      </div>

      <div class="attr-row">
        <span v-if="selectedRecipe?.difficulty" class="attr-chip" :class="`diff-${selectedRecipe.difficulty}`">{{ diffLabel(selectedRecipe.difficulty) }}</span>
        <span v-if="selectedRecipe?.prepTime"   class="attr-chip"><AppIcon name="clock" :size="13" /> {{ selectedRecipe.prepTime }} min</span>
        <span v-if="selectedRecipe?.estimatedCalories" class="attr-chip">{{ selectedRecipe.estimatedCalories }} kcal</span>
      </div>

      <div v-if="selectedRecipe?.tags?.length" class="recipe-tags-row" style="margin-bottom:.875rem">
        <span v-for="tag in selectedRecipe.tags" :key="tag" class="tag-pill">{{ tag }}</span>
      </div>

      <!-- Missing ingredients -->
      <div v-if="cocinaModeOn && selectedRecipe && !getAvailability(selectedRecipe).all" class="missing-alert">
        <div class="missing-header"><AppIcon name="alert" :size="15" /> Faltan en la despensa:</div>
        <div class="missing-list">
          <span v-for="ing in getAvailability(selectedRecipe).missing" :key="ing.name" class="missing-item">{{ ing.name }}</span>
        </div>
        <button class="btn-outline-sm" @click="addMissingToList(getAvailability(selectedRecipe).missing)">
          <AppIcon name="cart" :size="14" /> Agregar faltantes a compras
        </button>
      </div>

      <!-- Ingredients -->
      <template v-if="selectedRecipe?.ingredients?.length">
        <div class="section-title">Ingredientes</div>
        <ul class="ingredient-list">
          <li v-for="(ing, i) in selectedRecipe.ingredients" :key="i" class="ingredient-item">
            <span v-if="cocinaModeOn" class="avail-dot" :class="{ ok: ingredientAvailable(ing.name) }" />
            <span class="ing-name">{{ ing.name }}</span>
            <span v-if="ing.quantity || ing.unit" class="ing-qty">{{ ing.quantity }} {{ ing.unit }}</span>
          </li>
        </ul>
      </template>

      <!-- Steps -->
      <template v-if="selectedRecipe?.steps?.length">
        <div class="section-title">Preparación</div>
        <ol class="steps-list">
          <li v-for="(step, i) in selectedRecipe.steps" :key="i" class="step-item">{{ step }}</li>
        </ol>
      </template>

      <!-- Notes -->
      <template v-if="selectedRecipe?.adjustmentNotes">
        <div class="section-title">Notas de ajuste</div>
        <p class="notes-text">{{ selectedRecipe.adjustmentNotes }}</p>
      </template>

      <div v-if="selectedRecipe?.source" class="source-row">
        <AppIcon name="tag" :size="13" color="var(--text-muted)" /> {{ selectedRecipe.source }}
      </div>
      <div class="usage-row">
        <AppIcon name="clock" :size="13" color="var(--text-muted)" />
        Cocinada {{ selectedRecipe?.timesCooked || 0 }} vez/veces
        <span v-if="selectedRecipe?.lastCooked">· última vez {{ formatDate(selectedRecipe.lastCooked) }}</span>
      </div>

      <div class="detail-actions">
        <div class="detail-actions-left">
          <button class="btn-primary" @click="markAsCooked"><AppIcon name="check" :size="16" /> Cocinada</button>
          <button class="btn-secondary" @click="logMeal"><AppIcon name="heart" :size="16" /> Registrar comida</button>
        </div>
        <button class="btn-danger icon-only" aria-label="Eliminar receta" @click="deleteRecipe"><AppIcon name="trash" :size="18" /></button>
      </div>
    </div>

    <!-- ══ FORM ══ -->
    <div v-else key="form" class="view recipe-form">
      <div class="panel-header">
        <button class="back-btn" @click="navigate(editingRecipe ? 'detail' : 'list','right')">
          <AppIcon name="x" :size="20" /> Cancelar
        </button>
        <span class="panel-title-sm">{{ editingRecipe ? 'Editar receta' : 'Nueva receta' }}</span>
      </div>

      <label class="field-label">Título *</label>
      <input v-model="form.title" placeholder="Nombre de la receta" class="input" />

      <label class="field-label">Origen</label>
      <input v-model="form.source" placeholder="Ej: Abuela, Libro X, @instagram" class="input" />

      <label class="field-label">Estado</label>
      <div class="segmented">
        <button class="seg-btn" :class="{ active: form.status==='por probar' }"  @click="form.status='por probar'">Por probar</button>
        <button class="seg-btn" :class="{ active: form.status==='aprobada' }"    @click="form.status='aprobada'">Aprobada</button>
        <button class="seg-btn" :class="{ active: form.status==='descartada' }"  @click="form.status='descartada'">Descartada</button>
      </div>

      <label class="field-label">Calificación</label>
      <div class="stars-input">
        <button v-for="n in 5" :key="n" class="star-btn" :class="{ on: form.rating >= n }" @click="form.rating = form.rating===n ? 0 : n">★</button>
        <span v-if="!form.rating" class="stars-hint">Sin calificar</span>
      </div>

      <div class="field-row">
        <div class="field-col">
          <label class="field-label">Dificultad</label>
          <select v-model.number="form.difficulty" class="input">
            <option :value="0">—</option><option :value="1">Fácil</option><option :value="2">Media</option><option :value="3">Difícil</option>
          </select>
        </div>
        <div class="field-col">
          <label class="field-label">Tiempo (min)</label>
          <input v-model.number="form.prepTime" type="number" placeholder="30" class="input" />
        </div>
        <div class="field-col">
          <label class="field-label">Calorías</label>
          <input v-model.number="form.estimatedCalories" type="number" placeholder="400" class="input" />
        </div>
      </div>

      <label class="field-label">Etiquetas</label>
      <div class="tag-wrap">
        <span v-for="tag in formTags" :key="tag" class="tag-pill editable">{{ tag }}<button class="tag-remove" @click="removeTag(tag)">×</button></span>
        <input v-model="tagInput" class="tag-input" placeholder="Agregar etiqueta…" @keydown.enter.prevent="addTag" @keydown.,.prevent="addTag" />
      </div>

      <label class="field-label">Ingredientes</label>
      <div class="ingredient-form-list">
        <div v-for="(ing, i) in formIngredients" :key="i" class="ingredient-row">
          <input v-model="ing.name" placeholder="Ingrediente" class="input ing-name" />
          <input v-model="ing.quantity" placeholder="Cant." class="input ing-qty" />
          <select v-model="ing.unit" class="input ing-unit">
            <option value="">—</option>
            <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
          </select>
          <button class="icon-btn" @click="formIngredients.splice(i,1)"><AppIcon name="x" :size="15" /></button>
        </div>
        <button class="btn-secondary btn-sm" @click="formIngredients.push({name:'',quantity:'',unit:''})">+ Ingrediente</button>
      </div>

      <label class="field-label">Pasos</label>
      <div class="steps-form-list">
        <div v-for="(_, i) in formSteps" :key="i" class="step-form-row">
          <span class="step-num">{{ i+1 }}</span>
          <textarea v-model="formSteps[i]" class="input step-ta" placeholder="Describí este paso…" rows="2" />
          <button class="icon-btn" @click="formSteps.splice(i,1)"><AppIcon name="x" :size="15" /></button>
        </div>
        <button class="btn-secondary btn-sm" @click="formSteps.push('')">+ Paso</button>
      </div>

      <label class="field-label">Notas de ajuste</label>
      <textarea v-model="form.adjustmentNotes" class="input" placeholder="Tips, cambios que hiciste…" rows="3" />

      <label class="field-label">Foto del resultado (opcional)</label>
      <div class="photo-field">
        <div v-if="formPhoto" class="photo-preview-wrap">
          <img :src="formPhoto" class="photo-preview" @click="capturePhoto" />
          <button class="photo-remove-btn" aria-label="Quitar foto" @click="formPhoto = ''">
            <AppIcon name="x" :size="13" />
          </button>
        </div>
        <button v-else class="photo-capture-btn" @click="capturePhoto">
          <AppIcon name="camera" :size="20" />
          <span>Agregar foto</span>
        </button>
      </div>

      <button class="btn-primary save-recipe-btn" @click="saveRecipe">
        {{ editingRecipe ? 'Guardar cambios' : 'Crear receta' }}
      </button>
    </div>
  </Transition>

  <Transition name="fab">
    <button v-if="panel === 'list'" class="fab" aria-label="Agregar receta" @click="openForm(null)">
      <AppIcon name="plus" :size="26" />
    </button>
  </Transition>

  <!-- Cooked modal -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showCookedModal" class="modal-overlay" @click.self="showCookedModal = false">
        <div class="modal">
          <div class="modal-handle" />
          <h3>¡Buen provecho! 🎉</h3>
          <p class="modal-subtitle">Encontré ingredientes en tu despensa. ¿Actualizás su estado?</p>

          <div class="deduction-list">
            <label v-for="(m, i) in cookedMatches" :key="i" class="deduction-row">
              <input type="checkbox" v-model="cookedMatches[i].selected" class="deduction-check" />
              <div class="deduction-info">
                <span class="deduction-ing">{{ m.ingredient }}</span>
                <AppIcon name="chevron-right" :size="14" color="var(--text-muted)" />
                <span class="deduction-product">{{ m.product.name }}</span>
              </div>
              <select v-if="m.selected" v-model="cookedMatches[i].newStatus" class="input input-sm">
                <option value="acabando">Acabando</option>
                <option value="acabado">Se acabó</option>
              </select>
            </label>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="showCookedModal = false">Solo guardar</button>
            <button class="btn-primary" @click="applyDeductions">Actualizar despensa</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { db } from '../db/index'
import { useProfileStore } from '../stores/profileStore'
import { useToast }            from '../composables/useToast'
import { useHaptics }          from '../composables/useHaptics'
import { useImageCompressor }  from '../composables/useImageCompressor'
import AppIcon from '../components/AppIcon.vue'

const profileStore = useProfileStore()
const toast        = useToast()
const haptics      = useHaptics()
const { compress } = useImageCompressor()

// Core state
const recipes          = ref([])
const despensaProducts = ref([])
const panel            = ref('list')
const panelDir         = ref('left')
const selectedRecipe   = ref(null)
const editingRecipe    = ref(null)
const cocinaModeOn     = ref(false)
const activeFilter     = ref('todas')

// Search & advanced filters
const searchQuery     = ref('')
const showFilters     = ref(false)
const filterDifficulty = ref(0)
const filterMinRating  = ref(0)
const filterMaxTime    = ref(0)
const filterTags       = ref([])
const filterIngInclude = ref([])
const filterIngExclude = ref([])
const filterIngInput   = ref('')
const filterExcIngInput = ref('')

// Cooked modal
const showCookedModal = ref(false)
const cookedMatches   = ref([])

// Form
const units       = ['g','kg','ml','L','taza/s','cdta','cda','unidades','pizca']
const defaultForm = () => ({ title:'', source:'', status:'por probar', rating:0, difficulty:0, prepTime:'', estimatedCalories:'', adjustmentNotes:'' })
const form            = ref(defaultForm())
const formIngredients = ref([{ name:'', quantity:'', unit:'' }])
const formSteps       = ref([''])
const formTags        = ref([])
const formPhoto       = ref('')
const tagInput        = ref('')

// Filter options
const diffOptions = [
  { val:0, label:'Todas', cls:'' },
  { val:1, label:'Fácil',  cls:'diff-1' },
  { val:2, label:'Media',  cls:'diff-2' },
  { val:3, label:'Difícil',cls:'diff-3' },
]
const timeOptions = [
  { val:0,   label:'Todos'   },
  { val:15,  label:'≤ 15min' },
  { val:30,  label:'≤ 30min' },
  { val:60,  label:'≤ 1h'    },
  { val:120, label:'≤ 2h'    },
]

const allTags = computed(() => {
  const s = new Set()
  recipes.value.forEach(r => r.tags?.forEach(t => s.add(t)))
  return [...s].sort()
})

const activeFilterCount = computed(() => [
  filterDifficulty.value > 0,
  filterMinRating.value > 0,
  filterMaxTime.value > 0,
  filterTags.value.length > 0,
  filterIngInclude.value.length > 0,
  filterIngExclude.value.length > 0,
].filter(Boolean).length)

const statusFilters = computed(() => [
  { value:'todas',      label:'Todas',       count:null },
  { value:'por probar', label:'Por probar',  count:recipes.value.filter(r=>r.status==='por probar').length||null },
  { value:'aprobada',   label:'Aprobadas',   count:recipes.value.filter(r=>r.status==='aprobada').length||null  },
  { value:'descartada', label:'Descartadas', count:recipes.value.filter(r=>r.status==='descartada').length||null},
])

const filteredRecipes = computed(() => {
  let list = activeFilter.value === 'todas'
    ? recipes.value
    : recipes.value.filter(r => r.status === activeFilter.value)

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(r => r.title.toLowerCase().includes(q) || r.tags?.some(t => t.toLowerCase().includes(q)))
  }
  if (filterDifficulty.value) list = list.filter(r => r.difficulty === filterDifficulty.value)
  if (filterMinRating.value)  list = list.filter(r => (r.rating||0) >= filterMinRating.value)
  if (filterMaxTime.value)    list = list.filter(r => !r.prepTime || r.prepTime <= filterMaxTime.value)
  if (filterTags.value.length)
    list = list.filter(r => filterTags.value.every(t => r.tags?.includes(t)))
  if (filterIngInclude.value.length)
    list = list.filter(r => filterIngInclude.value.every(ing =>
      r.ingredients?.some(i => i.name.toLowerCase().includes(ing.toLowerCase()) || ing.toLowerCase().includes(i.name.toLowerCase()))
    ))
  if (filterIngExclude.value.length)
    list = list.filter(r => filterIngExclude.value.every(ing =>
      !r.ingredients?.some(i => i.name.toLowerCase().includes(ing.toLowerCase()) || ing.toLowerCase().includes(i.name.toLowerCase()))
    ))

  const order = { 'por probar':0, 'aprobada':1, 'descartada':2 }
  return [...list].sort((a,b) => {
    if (order[a.status] !== order[b.status]) return order[a.status]-order[b.status]
    return a.title.localeCompare(b.title,'es')
  })
})

// Despensa availability
const availableInDespensa = computed(() =>
  despensaProducts.value.filter(p=>p.status!=='acabado').map(p=>p.name.toLowerCase())
)
function ingredientAvailable(name) {
  const n = name.toLowerCase()
  return availableInDespensa.value.some(a => a.includes(n) || n.includes(a))
}
function getAvailability(recipe) {
  if (!recipe?.ingredients?.length) return { all:true, missing:[] }
  const missing = recipe.ingredients.filter(ing => !ingredientAvailable(ing.name))
  return { all:missing.length===0, missing }
}
function findProductForIngredient(name) {
  const q = name.toLowerCase()
  return despensaProducts.value.find(p =>
    p.status !== 'acabado' &&
    (p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()))
  )
}

onMounted(loadAll); onActivated(loadAll)
watch(() => profileStore.activeProfileId, loadAll)

async function loadAll() {
  if (!profileStore.activeProfileId) return
  const [r,p] = await Promise.all([
    db.recipes.where('profileId').equals(profileStore.activeProfileId).toArray(),
    db.products.where('profileId').equals(profileStore.activeProfileId).toArray(),
  ])
  recipes.value = r; despensaProducts.value = p
}

function navigate(to, dir='left') { panelDir.value=dir; panel.value=to }
function openDetail(r) { selectedRecipe.value=r; navigate('detail') }

function openForm(recipe) {
  editingRecipe.value = recipe
  if (recipe) {
    form.value = { title:recipe.title, source:recipe.source||'', status:recipe.status, rating:recipe.rating||0, difficulty:recipe.difficulty||0, prepTime:recipe.prepTime||'', estimatedCalories:recipe.estimatedCalories||'', adjustmentNotes:recipe.adjustmentNotes||'' }
    formIngredients.value = recipe.ingredients?.length ? recipe.ingredients.map(i=>({...i})) : [{name:'',quantity:'',unit:''}]
    formSteps.value  = recipe.steps?.length ? [...recipe.steps] : ['']
    formTags.value   = recipe.tags ? [...recipe.tags] : []
    formPhoto.value  = recipe.photo || ''
  } else {
    form.value=defaultForm(); formIngredients.value=[{name:'',quantity:'',unit:''}]; formSteps.value=['']; formTags.value=[]; formPhoto.value=''
  }
  tagInput.value=''
  navigate('form')
}

async function saveRecipe() {
  if (!form.value.title.trim()) return
  haptics.light()
  const data = {
    profileId: profileStore.activeProfileId,
    title: form.value.title.trim(), source: form.value.source.trim()||null,
    status: form.value.status, rating: form.value.rating,
    difficulty: form.value.difficulty||null, prepTime: form.value.prepTime||null,
    estimatedCalories: form.value.estimatedCalories||null,
    ingredients: formIngredients.value.filter(i=>i.name.trim()),
    steps: formSteps.value.filter(s=>s.trim()),
    tags: [...formTags.value],
    photo: formPhoto.value || null,
    adjustmentNotes: form.value.adjustmentNotes.trim()||null,
    timesCooked: editingRecipe.value?.timesCooked||0,
    lastCooked:  editingRecipe.value?.lastCooked||null,
  }
  if (editingRecipe.value) {
    await db.recipes.update(editingRecipe.value.id, data)
    selectedRecipe.value = { ...editingRecipe.value, ...data }
    toast.success('Receta actualizada'); navigate('detail','right')
  } else {
    await db.recipes.add(data)
    toast.success(`${data.title} agregada`); navigate('list','right')
  }
  editingRecipe.value=null; await loadAll()
}

async function deleteRecipe() {
  if (!selectedRecipe.value) return
  await db.recipes.delete(selectedRecipe.value.id)
  toast.info(`${selectedRecipe.value.title} eliminada`)
  selectedRecipe.value=null; navigate('list','right'); await loadAll()
}

async function markAsCooked() {
  if (!selectedRecipe.value) return
  haptics.medium()
  const update = { timesCooked:(selectedRecipe.value.timesCooked||0)+1, lastCooked:new Date().toISOString().split('T')[0] }
  await db.recipes.update(selectedRecipe.value.id, update)
  selectedRecipe.value = { ...selectedRecipe.value, ...update }
  await loadAll()

  const matches = (selectedRecipe.value.ingredients||[])
    .filter(ing => ing.name?.trim())
    .map(ing => ({ ingredient:ing.name, product:findProductForIngredient(ing.name), newStatus:'acabando', selected:true }))
    .filter(m => m.product)

  if (matches.length) { cookedMatches.value=matches; showCookedModal.value=true }
  else toast.success('¡Buen provecho! Receta cocinada.')
}

async function applyDeductions() {
  for (const m of cookedMatches.value.filter(x=>x.selected)) {
    await db.products.update(m.product.id, { status: m.newStatus })
    if (m.newStatus === 'acabado') {
      const exists = await db.shoppingItems.where('productId').equals(m.product.id).filter(i=>!i.bought).first()
      if (!exists) await db.shoppingItems.add({ profileId:profileStore.activeProfileId, name:m.product.name, origin:'product', productId:m.product.id, bought:false })
    }
  }
  await profileStore.refreshShoppingCount(); await loadAll()
  showCookedModal.value=false; toast.success('¡Buen provecho! Despensa actualizada.')
}

async function setStatus(status) {
  if (!selectedRecipe.value) return
  haptics.selection()
  await db.recipes.update(selectedRecipe.value.id, { status })
  selectedRecipe.value = { ...selectedRecipe.value, status }
  toast.success({ aprobada:'¡Receta aprobada!', descartada:'Receta descartada', 'por probar':'Estado reseteado' }[status])
  await loadAll()
}

async function addMissingToList(missing) {
  for (const ing of missing) {
    const exists = await db.shoppingItems.where('profileId').equals(profileStore.activeProfileId).filter(i=>!i.bought&&i.name.toLowerCase()===ing.name.toLowerCase()).first()
    if (!exists) await db.shoppingItems.add({ profileId:profileStore.activeProfileId, name:ing.name, origin:'recipe', productId:null, bought:false })
  }
  await profileStore.refreshShoppingCount()
  toast.success(`${missing.length} ingrediente(s) agregados a compras`)
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
    formPhoto.value = await compress(raw, 800, 0.65) // ~20KB vs ~2MB raw
  } catch (e) {
    if (e?.message && !e.message.toLowerCase().includes('cancel')) {
      toast.error('No se pudo acceder a la cámara')
    }
  }
}

// One-tap: log this recipe's calories as a meal in Nutrición (today, now).
async function logMeal() {
  const r = selectedRecipe.value
  if (!r) return
  if (!r.estimatedCalories) { toast.info('Agregá las calorías de la receta para poder registrarla'); return }
  haptics.medium()
  const now = new Date()
  await db.meals.add({
    profileId:   profileStore.activeProfileId,
    date:        now.toISOString().split('T')[0],
    time:        `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    description: r.title,
    calories:    r.estimatedCalories,
    recipeId:    r.id,
  })
  toast.success(`${r.estimatedCalories} kcal registradas en Nutrición`)
}

// Filter helpers
function toggleTag(tag) {
  const i = filterTags.value.indexOf(tag)
  if (i>=0) filterTags.value.splice(i,1); else filterTags.value.push(tag)
}
function addFilter(list, input) {
  const v = input.trim().replace(/,$/,'')
  if (v && !list.includes(v)) list.push(v)
}
function removeFilter(list, item) {
  const i = list.indexOf(item); if (i>=0) list.splice(i,1)
}
function clearFilters() {
  filterDifficulty.value=0; filterMinRating.value=0; filterMaxTime.value=0
  filterTags.value=[]; filterIngInclude.value=[]; filterIngExclude.value=[]
  filterIngInput.value=''; filterExcIngInput.value=''
}

// Form tag helpers
function addTag() { const t=tagInput.value.trim().replace(/,$/,''); if(t&&!formTags.value.includes(t))formTags.value.push(t); tagInput.value='' }
function removeTag(t) { formTags.value=formTags.value.filter(x=>x!==t) }

// Label helpers
function statusLabel(s)     { return {'por probar':'Por probar','aprobada':'Aprobada','descartada':'Descartada'}[s]||s }
function diffLabel(d)        { return ['','Fácil','Media','Difícil'][d]||'' }
function formatDate(d)       { return new Date(d).toLocaleDateString('es',{day:'numeric',month:'long',year:'numeric'}) }
function statusDotClass(s)   { return {'por probar':'dot-probar','aprobada':'dot-aprobada','descartada':'dot-descartada'}[s]||'' }
function statusBadgeClass(s) { return {'por probar':'badge-probar','aprobada':'badge-aprobada','descartada':'badge-descartada'}[s]||'' }
</script>
