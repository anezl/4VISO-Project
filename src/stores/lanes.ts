import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Lane, Requirement } from '@/types/domain'
import { mockApi } from '@/services/mockApi'

export const useLanesStore = defineStore('lanes', () => {
  const lanes = ref<Lane[]>([])
  const requirements = ref<Requirement[]>([])
  const loading = ref(false)

  const getLanesByProductType = (productType: string) =>
    computed(() => lanes.value.filter((lane) => lane.productType === productType))

  const getRequirementByProductType = (productType: string) =>
    requirements.value.find((req) => req.productType === productType)

  const loadLanes = async () => {
    loading.value = true
    try {
      lanes.value = await mockApi.getLanes()
    } finally {
      loading.value = false
    }
  }

  const loadRequirements = async () => {
    loading.value = true
    try {
      requirements.value = await mockApi.getRequirements()
    } finally {
      loading.value = false
    }
  }

  return {
    lanes,
    requirements,
    loading,
    getLanesByProductType,
    getRequirementByProductType,
    loadLanes,
    loadRequirements,
  }
})
