<template>
  <div class="view">
    <div class="view-header">
      <h2>Nutrición</h2>
      <button class="btn-primary" @click="showAddForm = true">+ Registrar</button>
    </div>

    <!-- Daily progress ring -->
    <div v-if="profileStore.activeProfile" class="calorie-ring-card" :class="{ 'ring-celebrate': celebrate }">
      <div class="calorie-ring">
        <svg viewBox="0 0 120 120">
          <circle class="ring-track" cx="60" cy="60" :r="R" :stroke-width="STROKE" />
          <circle
            class="ring-fill" :class="{ over: progress > 100 }"
            cx="60" cy="60" :r="R" :stroke-width="STROKE"
            :stroke-dasharray="CIRC" :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="ring-center">
          <span class="ring-value"><AnimatedNumber :value="todayCalories" :format="intFmt" /></span>
          <span class="ring-unit">kcal</span>
        </div>
      </div>
      <div class="calorie-meta">
        <span class="calorie-meta-date">{{ todayLabel }}</span>
        <div class="calorie-meta-row">
          <span class="calorie-meta-big">{{ Math.round(progress) }}%</span>
          <span class="calorie-meta-goal">de {{ goal }} kcal</span>
        </div>
        <span class="calorie-pill" :class="pillClass">
          <AppIcon v-if="pillClass === 'met'" name="check" :size="12" />
          {{ pillText }}
        </span>
      </div>
    </div>

    <!-- Meal list -->
    <div v-if="!todayMeals.length" class="empty-state">
      <AppIcon name="heart" :size="48" color="var(--border)" />
      <p>Sin comidas registradas hoy.<br>Tocá + Registrar para agregar.</p>
    </div>

    <TransitionGroup v-else name="list" tag="div" class="meal-list">
      <div v-for="meal in todayMeals" :key="meal.id" class="meal-card">
        <div class="meal-time-col">{{ meal.time }}</div>
        <div class="meal-info">
          <div class="meal-desc">{{ meal.description }}</div>
        </div>
        <div class="meal-cal">{{ meal.calories }} kcal</div>
        <button class="delete-btn" @click="deleteMeal(meal)">
          <AppIcon name="x" :size="15" />
        </button>
      </div>
    </TransitionGroup>

    <!-- Add modal -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showAddForm" class="modal-overlay" @click.self="showAddForm = false">
          <div class="modal">
            <div class="modal-handle" />
            <h3>Registrar comida</h3>
            <label class="field-label">Descripción</label>
            <input v-model="form.description" placeholder="Ej: Almuerzo — arroz con pollo" class="input" />
            <label class="field-label">Calorías</label>
            <input v-model.number="form.calories" type="number" placeholder="Ej: 450" class="input" />
            <label class="field-label">Hora</label>
            <input v-model="form.time" type="time" class="input" />
            <div class="modal-actions">
              <button class="btn-secondary" @click="showAddForm = false">Cancelar</button>
              <button class="btn-primary" @click="addMeal">Registrar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { db } from '../db/index'
import { useProfileStore } from '../stores/profileStore'
import { useToast }        from '../composables/useToast'
import { useHaptics }      from '../composables/useHaptics'
import AppIcon        from '../components/AppIcon.vue'
import AnimatedNumber from '../components/AnimatedNumber.vue'

const profileStore = useProfileStore()
const toast        = useToast()
const haptics      = useHaptics()
const meals        = ref([])
const showAddForm  = ref(false)
const celebrate    = ref(false)

// Calorie ring geometry
const R = 52, STROKE = 12
const CIRC = 2 * Math.PI * R
const intFmt = (n) => Math.round(n).toString()

const today    = new Date().toISOString().split('T')[0]
const todayLabel = new Date().toLocaleDateString('es',{ weekday:'long', day:'numeric', month:'long' })
const now      = new Date()
const defTime  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
const form     = ref({ description:'', calories:'', time:defTime })

const todayMeals    = computed(() => meals.value.filter(m=>m.date===today).sort((a,b)=>a.time.localeCompare(b.time)))
const todayCalories = computed(() => todayMeals.value.reduce((s,m)=>s+(m.calories||0),0))
const goal          = computed(() => profileStore.activeProfile?.dailyCalorieGoal || 2000)
const progress      = computed(() => (todayCalories.value / goal.value) * 100)
const remaining     = computed(() => goal.value - todayCalories.value)

const dashOffset = computed(() => CIRC * (1 - Math.min(progress.value, 100) / 100))
const pillClass  = computed(() => {
  if (remaining.value > 0) return 'under'
  return progress.value <= 105 ? 'met' : 'over'   // 5% grace band counts as "reached"
})
const pillText = computed(() => {
  if (remaining.value > 0)    return `${remaining.value} kcal restantes`
  if (progress.value <= 105)  return '¡Meta alcanzada!'
  return `${Math.abs(remaining.value)} kcal de más`
})

// Celebrate the moment the daily goal is reached
watch(progress, (now, prev) => {
  if (prev != null && prev < 100 && now >= 100) {
    celebrate.value = true
    haptics.medium()
    setTimeout(() => { celebrate.value = false }, 700)
  }
})

onMounted(loadMeals); onActivated(loadMeals)
watch(() => profileStore.activeProfileId, loadMeals)

async function loadMeals() {
  if (!profileStore.activeProfileId) return
  meals.value = await db.meals.where('profileId').equals(profileStore.activeProfileId).toArray()
}

async function addMeal() {
  if (!form.value.description.trim() || !form.value.calories) return
  haptics.light()
  await db.meals.add({
    profileId:   profileStore.activeProfileId,
    date:        today,
    time:        form.value.time,
    description: form.value.description.trim(),
    calories:    form.value.calories,
  })
  toast.success(`${form.value.calories} kcal registradas`)
  form.value    = { description:'', calories:'', time:defTime }
  showAddForm.value = false
  await loadMeals()
}

async function deleteMeal(meal) {
  haptics.light()
  await db.meals.delete(meal.id)
  await loadMeals()
}
</script>
