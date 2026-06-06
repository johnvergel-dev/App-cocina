<template>
  <div class="view">
    <div class="view-header">
      <h2>Perfiles</h2>
      <button class="btn-primary" @click="openAdd">+ Nuevo</button>
    </div>

    <div class="profile-list">
      <div
        v-for="profile in profileStore.profiles" :key="profile.id"
        class="profile-card" :class="{ active: profile.id === profileStore.activeProfileId }"
        @click="profileStore.setActiveProfile(profile)"
      >
        <div class="profile-info">
          <div class="profile-name">{{ profile.name }}</div>
          <div class="profile-cal">{{ profile.dailyCalorieGoal }} kcal/día</div>
        </div>
        <div class="profile-actions">
          <div v-if="profile.id === profileStore.activeProfileId" class="active-badge">✓ Activo</div>
          <button class="icon-btn" @click.stop="openEdit(profile)" title="Editar perfil">
            <AppIcon name="edit" :size="17" />
          </button>
          <button
            v-if="profileStore.profiles.length > 1"
            class="icon-btn danger-icon"
            @click.stop="confirmDelete(profile)"
            title="Eliminar perfil"
          >
            <AppIcon name="trash" :size="17" />
          </button>
        </div>
      </div>
    </div>

    <div class="profiles-hint">
      Tocá un perfil para activarlo. Cada perfil tiene su propia despensa, recetas y métricas.
    </div>
  </div>

  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
        <div class="modal">
          <div class="modal-handle" />
          <h3>{{ editingId ? 'Editar perfil' : 'Nuevo perfil' }}</h3>
          <label class="field-label">Nombre</label>
          <input v-model="form.name" placeholder="Ej: Mi Perfil" class="input" />
          <label class="field-label">Meta de calorías diaria</label>
          <input v-model.number="form.dailyCalorieGoal" type="number" placeholder="2000" class="input" />
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeForm">Cancelar</button>
            <button class="btn-primary" @click="save">{{ editingId ? 'Guardar' : 'Crear' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../db/index'
import { useProfileStore } from '../stores/profileStore'
import { useToast } from '../composables/useToast'
import AppIcon from '../components/AppIcon.vue'

const profileStore = useProfileStore()
const toast        = useToast()
const showForm     = ref(false)
const editingId    = ref(null)
const form         = ref({ name:'', dailyCalorieGoal:2000 })

onMounted(() => profileStore.loadProfiles())

function openAdd() {
  editingId.value = null
  form.value = { name:'', dailyCalorieGoal:2000 }
  showForm.value = true
}

function openEdit(profile) {
  editingId.value = profile.id
  form.value = { name:profile.name, dailyCalorieGoal:profile.dailyCalorieGoal }
  showForm.value = true
}

function closeForm() { showForm.value=false; editingId.value=null }

async function save() {
  if (!form.value.name.trim()) return
  if (editingId.value) {
    await profileStore.updateProfile(editingId.value, { name:form.value.name.trim(), dailyCalorieGoal:form.value.dailyCalorieGoal||2000 })
    toast.success('Perfil actualizado')
  } else {
    await profileStore.createProfile(form.value.name.trim(), form.value.dailyCalorieGoal||2000)
    toast.success('Perfil creado')
  }
  closeForm()
}

async function confirmDelete(profile) {
  if (profileStore.profiles.length <= 1) { toast.error('No podés eliminar el único perfil'); return }
  if (!window.confirm(`¿Eliminar el perfil "${profile.name}" y todos sus datos?`)) return
  if (profile.id === profileStore.activeProfileId) {
    const other = profileStore.profiles.find(p => p.id !== profile.id)
    if (other) profileStore.setActiveProfile(other)
  }
  // Delete all data for this profile
  await Promise.all([
    db.products.where('profileId').equals(profile.id).delete(),
    db.shoppingItems.where('profileId').equals(profile.id).delete(),
    db.recipes.where('profileId').equals(profile.id).delete(),
    db.meals.where('profileId').equals(profile.id).delete(),
    db.mealPlans.where('profileId').equals(profile.id).delete(),
    db.profiles.delete(profile.id),
  ])
  await profileStore.loadProfiles()
  toast.info(`Perfil "${profile.name}" eliminado`)
}
</script>
