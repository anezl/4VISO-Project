<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import MetricCard from '@/components/shared/MetricCard.vue'
import ShipmentCard from '@/components/shipments/ShipmentCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useShipmentsStore } from '@/stores/shipments'

const authStore = useAuthStore()
const shipmentsStore = useShipmentsStore()
const router = useRouter()

const searchQuery = ref('')
const isCreating = ref(false)

onMounted(async () => {
  await shipmentsStore.loadShipments()
})

const filteredShipments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return shipmentsStore.shipments
  }

  return shipmentsStore.shipments.filter((shipment) =>
    [shipment.reference, shipment.title, shipment.originCity, shipment.destinationCity, shipment.ownerCompany]
      .join(' ')
      .toLowerCase()
      .includes(query),
  )
})

const highRiskCount = computed(
  () =>
    shipmentsStore.shipments.filter(
      (shipment) => shipment.overallRisk === 'High' || shipment.overallRisk === 'Critical',
    ).length,
)

async function createLane() {
  if (!authStore.currentUser) {
    return
  }

  isCreating.value = true

  try {
    const shipment = await shipmentsStore.createShipment({
      ownerCompany: authStore.currentUser.companyName ?? authStore.currentUser.fullName,
      createdBy: authStore.currentUser.email,
    })

    await router.push({
      name: 'dashboard',
      params: {
        shipmentId: shipment.id,
      },
      query: {
        edit: '1',
      },
    })
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="page-section">
    <section class="hero-card">
      <div>
        <p class="section-heading__eyebrow">Operational overview</p>
        <h1>Shipment lanes and route risk visibility</h1>
        <p class="hero-card__copy">
          Lane list for cold-chain routes, route risks, and compliance checkpoints.
        </p>
      </div>

      <div class="hero-card__actions">
        <input
          v-model="searchQuery"
          class="input hero-card__search"
          placeholder="Search by route, company, city, or reference"
        />

        <button
          v-if="authStore.canEditRoutes"
          type="button"
          class="button"
          :disabled="isCreating"
          @click="createLane"
        >
          {{ isCreating ? 'Creating lane...' : 'Create new lane' }}
        </button>
      </div>
    </section>

    <section class="metrics-grid">
      <MetricCard
        label="Total lanes"
        :value="shipmentsStore.shipments.length"
        helper="Realistic mock shipments seeded into localStorage"
        tone="brand"
      />
      <MetricCard
        label="Elevated risk lanes"
        :value="highRiskCount"
        helper="High or critical route score"
      />
      <MetricCard
        label="Editable role"
        :value="authStore.canEditRoutes ? 'Yes' : 'Read-only'"
        helper="Creation and editing limited to logistics providers and admins"
      />
      <MetricCard
        label="Average nodes"
        :value="shipmentsStore.shipments.length ? Math.round(shipmentsStore.shipments.reduce((sum, shipment) => sum + shipment.routeNodes.length, 0) / shipmentsStore.shipments.length) : 0"
        helper="Stops and handovers per lane"
      />
    </section>

    <section class="page-grid page-grid--single">
      <div class="page-grid__main">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Lane list</p>
            <h2>Choose a shipment to inspect</h2>
          </div>

          <p class="section-heading__copy">{{ filteredShipments.length }} result(s)</p>
        </div>

        <div class="shipments-grid">
          <ShipmentCard
            v-for="shipment in filteredShipments"
            :key="shipment.id"
            :shipment="shipment"
            :can-edit="authStore.canEditRoutes"
          />
        </div>
      </div>
    </section>
  </div>
</template>
