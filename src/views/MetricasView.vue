<template>
  <div class="view">
    <div class="view-header">
      <h2>Métricas</h2>
      <div class="segmented segmented-sm">
        <button class="seg-btn" :class="{ active: period === 'semana' }" @click="period = 'semana'">Semana</button>
        <button class="seg-btn" :class="{ active: period === 'mes' }"    @click="period = 'mes'">Mes</button>
      </div>
    </div>

    <div class="metrics-summary">
      <div class="metric-card">
        <div class="metric-value" :class="{ 'metric-danger': avgCalories > goal }">
          <AnimatedNumber v-if="avgCalories > 0" :value="avgCalories" :format="intFmt" />
          <template v-else>—</template>
        </div>
        <div class="metric-label">Prom. kcal/día</div>
      </div>
      <div class="metric-card">
        <div class="metric-value metric-primary"><AnimatedNumber :value="goal" :format="intFmt" /></div>
        <div class="metric-label">Meta diaria</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" :class="{ 'metric-success': daysOnGoal > 0 }"><AnimatedNumber :value="daysOnGoal" :format="intFmt" /></div>
        <div class="metric-label">Días en meta</div>
      </div>
    </div>

    <div class="chart-card">
      <div class="chart-title">
        {{ period === 'semana' ? 'Últimos 7 días' : 'Últimas 4 semanas' }}
      </div>

      <svg
        :viewBox="`0 0 ${SVG_W} ${SVG_H}`"
        preserveAspectRatio="none"
        class="chart-svg"
      >
        <!-- Grid lines at 25/50/75/100% of goal -->
        <line
          v-for="pct in [0.25, 0.5, 0.75, 1]" :key="pct"
          :x1="PAD_L" :y1="yOf(goal * pct)"
          :x2="SVG_W - PAD_R" :y2="yOf(goal * pct)"
          stroke="var(--border)" stroke-width="1"
        />
        <!-- Goal dashed line -->
        <line
          :x1="PAD_L" :y1="yOf(goal)"
          :x2="SVG_W - PAD_R" :y2="yOf(goal)"
          stroke="var(--primary)" stroke-width="1.5" stroke-dasharray="5 3"
        />
        <!-- Bars (grow from baseline via CSS transition on y/height) -->
        <rect
          v-for="(bar, i) in bars" :key="i"
          class="bar"
          :x="barX(i)" :y="yOf(bar.val)"
          :width="barW" :height="hOf(bar.val)"
          :fill="bar.val === 0 ? 'var(--border)' : bar.val > goal ? 'var(--danger)' : 'var(--primary)'"
          rx="3" opacity=".88"
        />
        <!-- Goal label -->
        <text
          :x="SVG_W - PAD_R + 3" :y="yOf(goal) + 4"
          font-size="8" fill="var(--primary)" font-weight="600"
        >Meta</text>
      </svg>

      <!-- X-axis labels -->
      <div class="chart-labels">
        <span v-for="bar in bars" :key="bar.label" class="chart-label">{{ bar.label }}</span>
      </div>
    </div>

    <div v-if="!hasData" class="empty-state" style="padding: 1.5rem 0 0">
      <p>Sin datos. Registrá comidas en Nutrición para ver tus métricas.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { db } from '../db/index'
import { useProfileStore } from '../stores/profileStore'
import AnimatedNumber from '../components/AnimatedNumber.vue'

const profileStore = useProfileStore()
const period = ref('semana')
const meals  = ref([])
const intFmt = (n) => Math.round(n).toString()

// SVG constants
const SVG_W = 300, SVG_H = 160, PAD_L = 8, PAD_R = 40, PAD_T = 10
const chartW = computed(() => SVG_W - PAD_L - PAD_R)
const chartH = SVG_H - PAD_T

const goal = computed(() => profileStore.activeProfile?.dailyCalorieGoal || 2000)

const bars = computed(() => {
  if (period.value === 'semana') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dateStr = d.toISOString().split('T')[0]
      const val = meals.value.filter(m => m.date === dateStr).reduce((s,m) => s+(m.calories||0), 0)
      return { label: d.toLocaleDateString('es',{weekday:'short'}).slice(0,3), val }
    })
  } else {
    return Array.from({ length: 4 }, (_, w) => {
      const end = new Date(); end.setDate(end.getDate() - w * 7)
      const start = new Date(end); start.setDate(end.getDate() - 6)
      const eStr = end.toISOString().split('T')[0]
      const sStr = start.toISOString().split('T')[0]
      const val = meals.value.filter(m => m.date >= sStr && m.date <= eStr).reduce((s,m) => s+(m.calories||0), 0)
      return { label: `S${4-w}`, val }
    }).reverse()
  }
})

const maxVal   = computed(() => Math.max(...bars.value.map(b=>b.val), goal.value * 1.1, 1))
const n        = computed(() => bars.value.length)
const barGap   = 5
const barW     = computed(() => Math.max((chartW.value - (n.value-1) * barGap) / n.value, 4))
const barSlot  = computed(() => (chartW.value) / n.value)

function barX(i) { return PAD_L + i * barSlot.value + (barSlot.value - barW.value) / 2 }
function yOf(val) { return PAD_T + chartH * (1 - val / maxVal.value) }
function hOf(val) { return chartH * (val / maxVal.value) }

const avgCalories = computed(() => {
  const withData = bars.value.filter(b=>b.val>0)
  return withData.length ? withData.reduce((s,b)=>s+b.val,0)/withData.length : 0
})
const daysOnGoal = computed(() => bars.value.filter(b=>b.val>0 && b.val<=goal.value).length)
const hasData    = computed(() => bars.value.some(b=>b.val>0))

onMounted(loadMeals); onActivated(loadMeals)
watch(() => profileStore.activeProfileId, loadMeals)

async function loadMeals() {
  if (!profileStore.activeProfileId) return
  meals.value = await db.meals.where('profileId').equals(profileStore.activeProfileId).toArray()
}
</script>
