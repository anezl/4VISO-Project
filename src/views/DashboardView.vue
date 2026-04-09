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
import { riskToTone, validationToTone, type RiskLevel } from '@/types/domain'

const route = useRoute()
const authStore = useAuthStore()
const shipmentsStore = useShipmentsStore()
const editorOpen = ref(false)
const selectedNodeId = ref<string | null>(null)

const shipment = computed(() => shipmentsStore.activeShipment)
const activeAlerts = computed(() => shipment.value?.alerts.filter((alert) => alert.isActive) ?? [])
const validatedNodes = computed(
  () => shipment.value?.routeNodes.filter((node) => node.validationStatus === 'Validated').length ?? 0,
)
const pendingCertificates = computed(
  () => shipment.value?.certifications.filter((certificate) => certificate.status !== 'Valid').length ?? 0,
)

const riskWeight: Record<RiskLevel, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
}

const selectedNode = computed(() => {
  if (!shipment.value) {
    return null
  }

  return (
    shipment.value.routeNodes.find((node) => node.id === selectedNodeId.value) ??
    shipment.value.routeNodes[0] ??
    null
  )
})

const selectedNodeAlerts = computed(() => {
  if (!selectedNode.value) {
    return []
  }

  return activeAlerts.value.filter((alert) => alert.nodeId === selectedNode.value?.id)
})

const routeLegs = computed(() => {
  const nodes = shipment.value?.routeNodes ?? []

  return nodes.slice(0, -1).map((node, index) => {
    const nextNode = nodes[index + 1]
    const legRisk = riskWeight[node.riskScore] >= riskWeight[nextNode.riskScore]
      ? node.riskScore
      : nextNode.riskScore
    const legAlerts = activeAlerts.value.filter(
      (alert) => alert.nodeId === node.id || alert.nodeId === nextNode.id,
    ).length

    return {
      id: `${node.id}-${nextNode.id}`,
      from: node,
      to: nextNode,
      mode: node.transportMode,
      risk: legRisk,
      alerts: legAlerts,
    }
  })
})

async function loadShipmentFromRoute() {
  const shipmentId = typeof route.params.shipmentId === 'string' ? route.params.shipmentId : ''
  if (!shipmentId) {
    return
  }

  await shipmentsStore.loadShipmentById(shipmentId)
  editorOpen.value = route.query.edit === '1' && authStore.canEditRoutes
}

function syncSelectedNode() {
  if (!shipment.value?.routeNodes.length) {
    selectedNodeId.value = null
    return
  }

  const hasCurrentNode = shipment.value.routeNodes.some((node) => node.id === selectedNodeId.value)

  if (!hasCurrentNode) {
    selectedNodeId.value = shipment.value.routeNodes[0]?.id ?? null
  }
}

function selectNode(nodeId: string) {
  selectedNodeId.value = nodeId
}

onMounted(loadShipmentFromRoute)
watch(() => route.params.shipmentId, loadShipmentFromRoute)
watch(shipment, syncSelectedNode, { immediate: true })

async function handleSave(updatedShipment: NonNullable<typeof shipment.value>) {
  await shipmentsStore.updateShipment(updatedShipment)
  syncSelectedNode()
  editorOpen.value = false
}
</script>

<template>
  <div v-if="shipment" class="page-section">
    <section class="dashboard-hero">
      <div>
        <p class="section-heading__eyebrow">{{ shipment.reference }} - {{ shipment.ownerCompany }}</p>
        <h1>{{ shipment.title }}</h1>
        <p class="hero-card__copy">
          {{ shipment.originCity }} to {{ shipment.destinationCity }} for {{ shipment.productName }}.
          Open any node below to inspect the route in full detail.
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

    <ShipmentFlow
      :shipment="shipment"
      :selected-node-id="selectedNodeId"
      @select-node="selectNode"
    />

    <section class="metrics-grid">
      <MetricCard
        label="Route progress"
        :value="`${shipment.progress}%`"
        helper="Operational completion status"
        tone="brand"
      />
      <MetricCard
        label="Active alerts"
        :value="activeAlerts.length"
        helper="Issues requiring operator attention"
      />
      <MetricCard
        label="Validated nodes"
        :value="`${validatedNodes}/${shipment.routeNodes.length}`"
        helper="Nodes with approved validation status"
      />
      <MetricCard
        label="Certificates at risk"
        :value="pendingCertificates"
        helper="Expiring soon or expired records"
        tone="warning"
      />
    </section>

    <section class="route-detail-grid">
      <article v-if="selectedNode" class="panel-card route-focus-card">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Selected node</p>
            <h3>{{ selectedNode.locationName }}</h3>
          </div>

          <StatusPill :label="selectedNode.riskScore" :tone="riskToTone(selectedNode.riskScore)" />
        </div>

        <div class="route-focus-card__meta">
          <StatusPill
            :label="selectedNode.validationStatus"
            :tone="validationToTone(selectedNode.validationStatus)"
          />
          <p>{{ selectedNode.city }}, {{ selectedNode.country }}</p>
        </div>

        <div class="detail-grid">
          <div class="detail-card">
            <p>Point type</p>
            <strong>{{ selectedNode.locationType }}</strong>
          </div>
          <div class="detail-card">
            <p>Transport mode</p>
            <strong>{{ selectedNode.transportMode }}</strong>
          </div>
          <div class="detail-card">
            <p>Security level</p>
            <strong>{{ selectedNode.securityLevel }}</strong>
          </div>
          <div class="detail-card">
            <p>ETA</p>
            <strong>{{ selectedNode.eta }}</strong>
          </div>
          <div class="detail-card">
            <p>Dwell time</p>
            <strong>{{ selectedNode.dwellTime }}</strong>
          </div>
          <div class="detail-card">
            <p>Required temperature</p>
            <strong>{{ selectedNode.tempRange }}</strong>
          </div>
          <div class="detail-card">
            <p>Actual temperature</p>
            <strong>{{ selectedNode.actualTemp }}</strong>
          </div>
          <div class="detail-card">
            <p>Storage capability</p>
            <strong>{{ selectedNode.storageCapability }}</strong>
          </div>
          <div class="detail-card">
            <p>Certifications</p>
            <strong>{{ selectedNode.certifications.join(' | ') }}</strong>
          </div>
          <div class="detail-card">
            <p>Validator</p>
            <strong>{{ selectedNode.validatorName }}</strong>
          </div>
          <div class="detail-card">
            <p>Last validation</p>
            <strong>{{ selectedNode.validatedAt }}</strong>
          </div>
        </div>

        <div class="route-focus-card__blocks">
          <article class="route-focus-block">
            <p class="section-heading__eyebrow">Operational capabilities</p>
            <div class="tag-list">
              <span v-for="item in selectedNode.operationalCapabilities" :key="item" class="tag-chip">
                {{ item }}
              </span>
            </div>
          </article>

          <article class="route-focus-block">
            <p class="section-heading__eyebrow">Handling capabilities</p>
            <div class="tag-list">
              <span v-for="item in selectedNode.handlingCapabilities" :key="item" class="tag-chip">
                {{ item }}
              </span>
            </div>
          </article>

          <article class="route-focus-block">
            <p class="section-heading__eyebrow">Monitoring systems</p>
            <div class="tag-list">
              <span v-for="item in selectedNode.monitoringSystems" :key="item" class="tag-chip">
                {{ item }}
              </span>
            </div>
          </article>
        </div>

        <article class="route-focus-block">
          <p class="section-heading__eyebrow">Node notes</p>
          <p class="route-focus-card__note">{{ selectedNode.nodeNotes }}</p>
        </article>

        <article class="route-focus-block">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Node alerts</p>
              <h4>Signals for this checkpoint</h4>
            </div>
          </div>

          <div v-if="selectedNodeAlerts.length" class="stack-list stack-list--compact">
            <article v-for="alert in selectedNodeAlerts" :key="alert.id" class="stack-item">
              <div class="stack-item__row">
                <strong>{{ alert.title }}</strong>
                <StatusPill :label="alert.severity" :tone="riskToTone(alert.severity)" />
              </div>
              <p>{{ alert.category }} | {{ alert.timestamp }}</p>
              <p>{{ alert.description }}</p>
            </article>
          </div>

          <div v-else class="empty-state empty-state--compact">
            <p>No active alerts are directly linked to this node.</p>
          </div>
        </article>
      </article>

      <article class="panel-card">
        <div class="section-heading">
          <div>
            <p class="section-heading__eyebrow">Full route breakdown</p>
            <h3>All nodes in one large view</h3>
          </div>

          <p class="section-heading__copy">{{ shipment.routeNodes.length }} route points</p>
        </div>

        <div class="stack-list">
          <button
            v-for="(node, index) in shipment.routeNodes"
            :key="node.id"
            type="button"
            class="stack-item stack-item--clickable"
            :class="{ 'stack-item--active': selectedNodeId === node.id }"
            @click="selectNode(node.id)"
          >
            <div class="stack-item__row">
              <div>
                <p class="section-heading__eyebrow">
                  Node {{ index + 1 }}
                  {{
                    index === 0
                      ? '- Origin'
                      : index === shipment.routeNodes.length - 1
                        ? '- Destination'
                        : '- Transit'
                  }}
                </p>
                <strong>{{ node.city }}, {{ node.country }}</strong>
              </div>

              <StatusPill :label="node.riskScore" :tone="riskToTone(node.riskScore)" />
            </div>

            <p>{{ node.locationType }} | {{ node.locationName }}</p>
            <p>{{ node.transportMode }} | ETA {{ node.eta }}</p>
            <p>Required {{ node.tempRange }} | Actual {{ node.actualTemp }}</p>
            <p>{{ node.securityLevel }} | {{ node.validatorName }}</p>
          </button>
        </div>
      </article>
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
              <p class="section-heading__eyebrow">Transport legs</p>
              <h3>Inter-node handovers</h3>
            </div>
          </div>

          <div class="stack-list">
            <article v-for="leg in routeLegs" :key="leg.id" class="stack-item">
              <div class="stack-item__row">
                <div>
                  <strong>{{ leg.from.city }} -> {{ leg.to.city }}</strong>
                  <p>{{ leg.mode }} transfer</p>
                </div>

                <StatusPill :label="leg.risk" :tone="riskToTone(leg.risk)" />
              </div>

              <p>{{ leg.from.locationName }} to {{ leg.to.locationName }}</p>
              <p>{{ leg.alerts }} linked alert(s) on this leg</p>
            </article>
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
                  :tone="
                    certificate.status === 'Valid'
                      ? 'validated'
                      : certificate.status === 'Expired'
                        ? 'rejected'
                        : 'pending'
                  "
                />
              </div>
              <p>{{ certificate.scope }} | {{ certificate.issuer }}</p>
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

      <div class="dashboard-grid__aside">
        <AlertsPanel :alerts="activeAlerts" />
      </div>
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
