<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AlertsPanel from '@/components/dashboard/AlertsPanel.vue'
import ShipmentEditorDrawer from '@/components/dashboard/ShipmentEditorDrawer.vue'
import ShipmentFlow from '@/components/dashboard/ShipmentFlow.vue'
import MetricCard from '@/components/shared/MetricCard.vue'
import StatusPill from '@/components/shared/StatusPill.vue'
import { useAuthStore } from '@/stores/auth'
import { useShipmentsStore } from '@/stores/shipments'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { riskToTone } from '@/types/domain'

const route = useRoute()
const authStore = useAuthStore()
const shipmentsStore = useShipmentsStore()
const editorOpen = ref(false)

const shipment = computed(() => shipmentsStore.activeShipment)
const activeAlerts = computed(() => shipment.value?.alerts.filter((alert) => alert.isActive) ?? [])
const validatedNodes = computed(
  () => shipment.value?.routeNodes.filter((node) => node.validationStatus === 'Validated').length ?? 0,
)
const pendingCertificates = computed(
  () => shipment.value?.certifications.filter((certificate) => certificate.status !== 'Valid').length ?? 0,
)

async function loadShipmentFromRoute() {
  const shipmentId = typeof route.params.shipmentId === 'string' ? route.params.shipmentId : ''
  if (!shipmentId) {
    return
  }

  await shipmentsStore.loadShipmentById(shipmentId)
  editorOpen.value = route.query.edit === '1' && authStore.canEditRoutes
}

onMounted(loadShipmentFromRoute)
watch(() => route.params.shipmentId, loadShipmentFromRoute)

async function handleSave(updatedShipment: NonNullable<typeof shipment.value>) {
  await shipmentsStore.updateShipment(updatedShipment)
  editorOpen.value = false
}
</script>

<template>
  <div v-if="shipment" class="page-section">
    <section class="dashboard-hero">
      <div>
        <p class="section-heading__eyebrow">{{ shipment.reference }} • {{ shipment.ownerCompany }}</p>
        <h1>{{ shipment.title }}</h1>
        <p class="hero-card__copy">
          {{ shipment.originCity }} to {{ shipment.destinationCity }} for {{ shipment.productName }}.
        </p>
      </div>

      <div class="dashboard-hero__actions">
        <StatusPill :label="shipment.overallRisk" :tone="riskToTone(shipment.overallRisk)" />
        <button
          v-if="authStore.canEditRoutes"
          type="button"
          class="button"
          @click="editorOpen = true"
        >
          Edit lane
        </button>
      </div>
    </section>

    <ShipmentFlow :shipment="shipment" />

    <section class="metrics-grid">
      <MetricCard label="Route progress" :value="`${shipment.progress}%`" helper="Operational completion status" tone="brand" />
      <MetricCard label="Active alerts" :value="activeAlerts.length" helper="Issues requiring operator attention" />
      <MetricCard label="Validated nodes" :value="`${validatedNodes}/${shipment.routeNodes.length}`" helper="Nodes with approved validation status" />
      <MetricCard label="Certificates at risk" :value="pendingCertificates" helper="Expiring soon or expired records" tone="warning" />
    </section>

    <section class="dashboard-grid">
      <div class="dashboard-grid__main">
        <article class="panel-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Lane context</p>
              <h3>Shipment summary</h3>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-card">
              <p>Product</p>
              <strong>{{ shipment.productName }}</strong>
            </div>
            <div class="detail-card">
              <p>Package</p>
              <strong>{{ shipment.packageType }}</strong>
            </div>
            <div class="detail-card">
              <p>Required range</p>
              <strong>{{ shipment.requiredTempRange }}</strong>
            </div>
            <div class="detail-card">
              <p>Average actual</p>
              <strong>{{ shipment.actualAverageTemp }}</strong>
            </div>
            <div class="detail-card">
              <p>Consignee</p>
              <strong>{{ shipment.consignee }}</strong>
            </div>
            <div class="detail-card">
              <p>Updated</p>
              <strong>{{ formatDateTime(shipment.updatedAt) }}</strong>
            </div>
          </div>
        </article>

        <article class="panel-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Certificates</p>
              <h3>Lane compliance records</h3>
            </div>
          </div>

          <div class="stack-list">
            <article
              v-for="certificate in shipment.certifications"
              :key="certificate.id"
              class="stack-item"
            >
              <div class="stack-item__row">
                <strong>{{ certificate.name }}</strong>
                <StatusPill
                  :label="certificate.status"
                  :tone="certificate.status === 'Valid' ? 'validated' : certificate.status === 'Expired' ? 'rejected' : 'pending'"
                />
              </div>
              <p>{{ certificate.scope }} • {{ certificate.issuer }}</p>
              <p>Valid until {{ formatDate(certificate.validUntil) }}</p>
            </article>
          </div>
        </article>

        <article class="panel-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Incidents</p>
              <h3>Operational notes</h3>
            </div>
          </div>

          <div v-if="shipment.incidents.length" class="stack-list">
            <article v-for="incident in shipment.incidents" :key="incident.id" class="stack-item">
              <div class="stack-item__row">
                <strong>{{ incident.title }}</strong>
                <StatusPill :label="incident.severity" :tone="riskToTone(incident.severity)" />
              </div>
              <p>{{ incident.description }}</p>
              <p>{{ formatDateTime(incident.timestamp) }}</p>
            </article>
          </div>

          <div v-else class="empty-state empty-state--compact">
            <p>No incidents logged for this lane.</p>
          </div>
        </article>
      </div>

      <AlertsPanel :alerts="activeAlerts" />
    </section>

    <ShipmentEditorDrawer
      :open="editorOpen"
      :shipment="shipment"
      @close="editorOpen = false"
      @save="handleSave"
    />
  </div>

  <div v-else class="empty-state empty-state--page">
    <h2>Shipment not found</h2>
    <p>Select a lane from the shipment list to open its dashboard.</p>
  </div>
</template>
