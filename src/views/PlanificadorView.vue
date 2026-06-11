<template>
  <div class="view">
    <div class="view-header no-print">
      <h2>Planificador</h2>
      <button class="icon-btn" title="Imprimir menú" aria-label="Imprimir menú" @click="printPlan">
        <AppIcon name="printer" :size="20" />
      </button>
    </div>

    <!-- Week navigation -->
    <div class="week-nav no-print">
      <button class="icon-btn" aria-label="Semana anterior" @click="weekOffset--"><AppIcon name="arrow-left" :size="20" /></button>
      <span class="week-label">{{ weekLabel }}</span>
      <button class="icon-btn" aria-label="Semana siguiente" @click="weekOffset++"><AppIcon name="chevron-right" :size="20" /></button>
    </div>

    <!-- Print-only title -->
    <div class="print-title">Menú semanal · {{ weekLabel }}</div>

    <!-- Planner grid -->
    <div class="planner-scroll">
      <div class="planner-grid">
        <!-- Left: meal labels -->
        <div class="planner-label-col">
          <div class="planner-corner" />
          <div v-for="meal in mealTypes" :key="meal.key" class="planner-meal-label">
            {{ meal.label }}
          </div>
        </div>

        <!-- Day columns -->
        <div v-for="day in weekDays" :key="day.dateStr" class="planner-day-col">
          <div class="planner-day-header" :class="{ today: day.isToday }">
            <span class="day-name">{{ day.weekday }}</span>
            <span class="day-num">{{ day.dayNum }}</span>
          </div>
          <div
            v-for="meal in mealTypes" :key="meal.key"
            class="planner-cell"
            :class="{ filled: getPlan(day.dateStr, meal.key) }"
            @click="openCell(day, meal)"
          >
            <span v-if="getPlan(day.dateStr, meal.key)" class="cell-content">
              {{ getPlan(day.dateStr, meal.key) }}
            </span>
            <span v-else class="cell-add">+</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Assignment modal -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showCell" class="modal-overlay" @click.self="showCell = false">
        <div class="modal">
          <div class="modal-handle" />
          <h3>{{ activeDay?.weekday }} · {{ activeMeal?.label }}</h3>

          <label class="field-label">Comida</label>
          <input
            ref="cellInputEl"
            v-model="cellInput"
            placeholder="Ej: Avena con frutas"
            class="input"
            @keyup.enter="saveCell"
          />

          <template v-if="approvedRecipes.length">
            <label class="field-label">O elegí una receta aprobada</label>
            <div class="recipe-picker-list">
              <button
                v-for="r in approvedRecipes" :key="r.id"
                class="recipe-picker-item"
                :class="{ selected: cellInput === r.title }"
                @click="cellInput = r.title"
              >{{ r.title }}</button>
            </div>
          </template>

          <div class="modal-actions">
            <button
              v-if="getPlan(activeDay?.dateStr, activeMeal?.key)"
              class="btn-ghost"
              @click="clearCell"
            >Borrar</button>
            <div class="modal-actions-right">
              <button class="btn-secondary" @click="showCell = false">Cancelar</button>
              <button class="btn-primary" @click="saveCell">Guardar</button>
            </div>
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
import AppIcon from '../components/AppIcon.vue'

const profileStore = useProfileStore()
const weekOffset   = ref(0)
const planData     = ref({})
const showCell     = ref(false)
const activeDay    = ref(null)
const activeMeal   = ref(null)
const cellInput    = ref('')
const cellInputEl  = ref(null)
const approvedRecipes = ref([])
let   currentPlanId  = null

const mealTypes = [
  { key:'desayuno', label:'Desayuno' },
  { key:'almuerzo', label:'Almuerzo' },
  { key:'cena',     label:'Cena'     },
]

const weekDays = computed(() => {
  const today = new Date(); today.setHours(0,0,0,0)
  const anchor = new Date(today); anchor.setDate(today.getDate() + weekOffset.value * 7)
  const dow = anchor.getDay() || 7
  const monday = new Date(anchor); monday.setDate(anchor.getDate() - dow + 1)

  const todayStr = today.toISOString().split('T')[0]
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    return {
      date: d, dateStr,
      weekday: d.toLocaleDateString('es',{ weekday:'short' }),
      dayNum:  d.getDate(),
      isToday: dateStr === todayStr,
    }
  })
})

const weekKey = computed(() => weekDays.value[0]?.dateStr || '')

const weekLabel = computed(() => {
  if (!weekDays.value.length) return ''
  const fmt = d => d.toLocaleDateString('es',{day:'numeric',month:'short'})
  const prefix = weekOffset.value === 0 ? 'Esta semana · ' : weekOffset.value === -1 ? 'Semana pasada · ' : ''
  return `${prefix}${fmt(weekDays.value[0].date)} – ${fmt(weekDays.value[6].date)}`
})

function getPlan(dateStr, mealKey) { return planData.value[`${dateStr}-${mealKey}`] || '' }

function openCell(day, meal) {
  activeDay.value  = day
  activeMeal.value = meal
  cellInput.value  = getPlan(day.dateStr, meal.key)
  showCell.value   = true
  nextTick(() => cellInputEl.value?.focus())
}

async function saveCell() {
  if (!activeDay.value || !activeMeal.value) return
  const key = `${activeDay.value.dateStr}-${activeMeal.value.key}`
  if (cellInput.value.trim()) planData.value[key] = cellInput.value.trim()
  else delete planData.value[key]
  showCell.value = false
  await persistPlan()
}

async function clearCell() {
  if (!activeDay.value || !activeMeal.value) return
  delete planData.value[`${activeDay.value.dateStr}-${activeMeal.value.key}`]
  showCell.value = false
  await persistPlan()
}

// Serialize writes so two quick edits can't both see currentPlanId === null
// and create duplicate plan rows for the same week.
let persistChain = Promise.resolve()
function persistPlan() {
  persistChain = persistChain.then(doPersist, doPersist)
  return persistChain
}
async function doPersist() {
  if (!profileStore.activeProfileId) return
  const record = { profileId: profileStore.activeProfileId, week: weekKey.value, assignments: { ...planData.value } }
  if (currentPlanId) await db.mealPlans.update(currentPlanId, record)
  else currentPlanId = await db.mealPlans.add(record)
}

async function loadPlan() {
  if (!profileStore.activeProfileId || !weekKey.value) return
  const plans = await db.mealPlans.where('profileId').equals(profileStore.activeProfileId).toArray()
  const plan  = plans.find(p => p.week === weekKey.value)
  if (plan) { currentPlanId = plan.id; planData.value = { ...plan.assignments } }
  else       { currentPlanId = null;   planData.value = {} }
}

function printPlan() { window.print() }

onMounted(loadAll); onActivated(loadAll)
watch(() => profileStore.activeProfileId, loadAll)
watch(weekKey, loadPlan)

async function loadAll() {
  if (!profileStore.activeProfileId) return
  await loadPlan()
  approvedRecipes.value = await db.recipes
    .where('profileId').equals(profileStore.activeProfileId)
    .filter(r => r.status === 'aprobada')
    .toArray()
}
</script>
