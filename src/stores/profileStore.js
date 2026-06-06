import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '../db/index'

export const useProfileStore = defineStore('profile', () => {
  const activeProfileId     = ref(null)
  const activeProfile       = ref(null)
  const profiles            = ref([])
  const shoppingPendingCount = ref(0)

  async function loadProfiles() {
    profiles.value = await db.profiles.toArray()
    const savedId = localStorage.getItem('activeProfileId')
    if (savedId) {
      const found = profiles.value.find(p => p.id === parseInt(savedId))
      if (found) { setActiveProfile(found); await refreshShoppingCount(); return }
    }
    if (profiles.value.length > 0) {
      setActiveProfile(profiles.value[0])
      await refreshShoppingCount()
    }
  }

  function setActiveProfile(profile) {
    activeProfileId.value = profile.id
    activeProfile.value   = profile
    localStorage.setItem('activeProfileId', String(profile.id))
  }

  async function createProfile(name, dailyCalorieGoal = 2000) {
    const id      = await db.profiles.add({ name, dailyCalorieGoal })
    const profile = { id, name, dailyCalorieGoal }
    profiles.value.push(profile)
    if (profiles.value.length === 1) setActiveProfile(profile)
    return profile
  }

  async function updateProfile(id, data) {
    await db.profiles.update(id, data)
    await loadProfiles()
  }

  async function refreshShoppingCount() {
    if (!activeProfileId.value) return
    const items = await db.shoppingItems
      .where('profileId').equals(activeProfileId.value)
      .toArray()
    shoppingPendingCount.value = items.filter(i => !i.bought).length
  }

  return {
    activeProfileId, activeProfile, profiles, shoppingPendingCount,
    loadProfiles, setActiveProfile, createProfile, updateProfile, refreshShoppingCount,
  }
})
