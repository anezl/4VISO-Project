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
          Start from the lane list, open a route dashboard, and inspect cold-chain compliance at each node.
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

    <section class="page-grid">
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

      <aside class="panel-card">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Role guide</p>
            <h3>Who can do what?</h3>
          </div>
        </div>

        <div class="stack-list">
          <article class="stack-item">
            <strong>Ordinary users and pharma companies</strong>
            <p>Read-only visibility into lane progress, risks, notifications, and certificates.</p>
          </article>
          <article class="stack-item">
            <strong>Logistics providers</strong>
            <p>Create and edit routes, update node metadata, and manage transport handovers.</p>
          </article>
          <article class="stack-item">
            <strong>Auditor / QA</strong>
            <p>Review validation statuses, incidents, and compliance exposure across routes.</p>
          </article>
          <article class="stack-item">
            <strong>Admins</strong>
            <p>Full access to the workspace plus user overview and validation backlog.</p>
          </article>
        </div>
      </aside>
    </section>
  </div>
</template>
