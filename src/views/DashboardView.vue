<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import ShipmentEditorDrawer from '@/components/dashboard/ShipmentEditorDrawer.vue'
import ShipmentFlow from '@/components/dashboard/ShipmentFlow.vue'
import MetricCard from '@/components/shared/MetricCard.vue'
import StatusPill from '@/components/shared/StatusPill.vue'
import { useAuthStore } from '@/stores/auth'
import { useShipmentsStore } from '@/stores/shipments'
import { formatDate, formatDateTime } from '@/utils/formatters'
import {
  riskToTone,
  validationToTone,
  type CertificationStatus,
  type RiskLevel,
} from '@/types/domain'

type DashboardSection = 'route' | 'alerts' | 'compliance' | 'incidents' | 'shipment' | 'edit'
type RouteLayer = 'nodes' | 'legs'
type StatusTone =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'validated'
  | 'pending'
  | 'rejected'
  | 'brand'
  | 'muted'

const route = useRoute()
const authStore = useAuthStore()
const shipmentsStore = useShipmentsStore()

const editorOpen = ref(false)
const selectedNodeId = ref<string | null>(null)
const selectedLegId = ref<string | null>(null)
const selectedAlertId = ref<string | null>(null)
const selectedCertificateId = ref<string | null>(null)
const selectedIncidentId = ref<string | null>(null)
const activeSection = ref<DashboardSection>('route')
const activeRouteLayer = ref<RouteLayer>('nodes')
const isLoadingShipment = ref(true)
const loadError = ref<string | null>(null)

const shipment = computed(() => shipmentsStore.activeShipment)
const shouldOpenEditor = computed(() => route.query.edit === '1' && authStore.canEditRoutes)
const activeAlerts = computed(() => shipment.value?.alerts.filter((alert) => alert.isActive) ?? [])
const validatedNodes = computed(
  () => shipment.value?.routeNodes.filter((node) => node.validationStatus === 'Validated').length ?? 0,
)
const pendingCertificates = computed(
  () => shipment.value?.certifications.filter((certificate) => certificate.status !== 'Valid').length ?? 0,
)
const criticalAlerts = computed(
  () => activeAlerts.value.filter((alert) => alert.severity === 'Critical').length,
)

const riskWeight: Record<RiskLevel, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
}

const routeLegs = computed(() => {
  const nodes = shipment.value?.routeNodes ?? []

  return nodes.slice(0, -1).map((node, index) => {
    const nextNode = nodes[index + 1]
    const legRisk =
      riskWeight[node.riskScore] >= riskWeight[nextNode.riskScore]
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

const selectedLeg = computed(() => {
  return routeLegs.value.find((leg) => leg.id === selectedLegId.value) ?? routeLegs.value[0] ?? null
})

const selectedAlert = computed(() => {
  return activeAlerts.value.find((alert) => alert.id === selectedAlertId.value) ?? activeAlerts.value[0] ?? null
})

const selectedCertificate = computed(() => {
  const certificates = shipment.value?.certifications ?? []
  return (
    certificates.find((certificate) => certificate.id === selectedCertificateId.value) ??
    certificates[0] ??
    null
  )
})

const selectedIncident = computed(() => {
  const incidents = shipment.value?.incidents ?? []
  return incidents.find((incident) => incident.id === selectedIncidentId.value) ?? incidents[0] ?? null
})

const selectedNodeAlerts = computed(() => {
  if (!selectedNode.value) {
    return []
  }

  return activeAlerts.value.filter((alert) => alert.nodeId === selectedNode.value?.id)
})

const selectedAlertNode = computed(() => {
  if (!shipment.value || !selectedAlert.value?.nodeId) {
    return null
  }

  return shipment.value.routeNodes.find((node) => node.id === selectedAlert.value?.nodeId) ?? null
})

const selectedCertificateNode = computed(() => {
  if (!shipment.value || !selectedCertificate.value?.nodeId) {
    return null
  }

  return shipment.value.routeNodes.find((node) => node.id === selectedCertificate.value?.nodeId) ?? null
})

const dashboardSections = computed(() => {
  if (!shipment.value) {
    return []
  }

  return [
    {
      id: 'route' as const,
      eyebrow: 'Layer 1',
      title: 'Route',
      value: `${shipment.value.routeNodes.length} nodes`,
      badge: shipment.value.overallRisk,
      badgeTone: riskToTone(shipment.value.overallRisk) as StatusTone,
    },
    {
      id: 'alerts' as const,
      eyebrow: 'Layer 2',
      title: 'Alerts',
      value: `${activeAlerts.value.length} active`,
      badge: criticalAlerts.value ? `${criticalAlerts.value} critical` : 'Stable',
      badgeTone: (criticalAlerts.value ? 'critical' : 'validated') as StatusTone,
    },
    {
      id: 'compliance' as const,
      eyebrow: 'Layer 3',
      title: 'Compliance',
      value: `${validatedNodes.value}/${shipment.value.routeNodes.length} validated`,
      badge: pendingCertificates.value ? `${pendingCertificates.value} at risk` : 'In shape',
      badgeTone: (pendingCertificates.value ? 'pending' : 'validated') as StatusTone,
    },
    {
      id: 'incidents' as const,
      eyebrow: 'Layer 4',
      title: 'Incidents',
      value: `${shipment.value.incidents.length} logged`,
      badge: shipment.value.status,
      badgeTone: (shipment.value.status === 'Delayed' ? 'critical' : 'brand') as StatusTone,
    },
    {
      id: 'shipment' as const,
      eyebrow: 'Layer 5',
      title: 'Shipment',
      value: shipment.value.productName,
      badge: `${shipment.value.progress}%`,
      badgeTone: 'brand' as StatusTone,
    },
    ...(authStore.canEditRoutes
      ? [
          {
            id: 'edit' as const,
            eyebrow: 'Layer 6',
            title: 'Edit',
            value: 'Route editor',
            badge: 'Editable',
            badgeTone: 'brand' as StatusTone,
          },
        ]
      : []),
  ]
})

function ensureSelection(items: Array<{ id: string }>, currentId: string | null) {
  if (items.some((item) => item.id === currentId)) {
    return currentId
  }

  return items[0]?.id ?? null
}

function syncDashboardSelections() {
  selectedNodeId.value = ensureSelection(shipment.value?.routeNodes ?? [], selectedNodeId.value)
  selectedLegId.value = ensureSelection(routeLegs.value, selectedLegId.value)
  selectedAlertId.value = ensureSelection(activeAlerts.value, selectedAlertId.value)
  selectedCertificateId.value = ensureSelection(
    shipment.value?.certifications ?? [],
    selectedCertificateId.value,
  )
  selectedIncidentId.value = ensureSelection(shipment.value?.incidents ?? [], selectedIncidentId.value)
}

function nodeStageLabel(index: number, total: number) {
  if (index === 0) {
    return 'Origin'
  }

  if (index === total - 1) {
    return 'Destination'
  }

  return 'Transit'
}

function certificateTone(status: CertificationStatus) {
  if (status === 'Valid') {
    return 'validated' as const
  }

  if (status === 'Expired') {
    return 'rejected' as const
  }

  return 'pending' as const
}

function openSection(section: DashboardSection) {
  activeSection.value = section
  editorOpen.value = section === 'edit'
}

function openRouteLayer(layer: RouteLayer) {
  activeSection.value = 'route'
  activeRouteLayer.value = layer
}

function selectNode(nodeId: string) {
  activeSection.value = 'route'
  activeRouteLayer.value = 'nodes'
  selectedNodeId.value = nodeId
  editorOpen.value = false
}

function selectLeg(legId: string) {
  activeSection.value = 'route'
  activeRouteLayer.value = 'legs'
  selectedLegId.value = legId
  editorOpen.value = false
}

function selectAlert(alertId: string) {
  activeSection.value = 'alerts'
  selectedAlertId.value = alertId
  editorOpen.value = false
}

function selectCertificate(certificateId: string) {
  activeSection.value = 'compliance'
  selectedCertificateId.value = certificateId
  editorOpen.value = false
}

function selectIncident(incidentId: string) {
  activeSection.value = 'incidents'
  selectedIncidentId.value = incidentId
  editorOpen.value = false
}

function openLinkedNode(nodeId?: string) {
  if (!nodeId) {
    return
  }

  activeSection.value = 'route'
  activeRouteLayer.value = 'nodes'
  selectedNodeId.value = nodeId
  editorOpen.value = false
}

async function loadShipmentFromRoute() {
  const shipmentId = typeof route.params.shipmentId === 'string' ? route.params.shipmentId : ''

  if (!shipmentId) {
    loadError.value = 'Missing shipment identifier.'
    isLoadingShipment.value = false
    editorOpen.value = false
    return
  }

  isLoadingShipment.value = true
  loadError.value = null

  try {
    const loadedShipment = await shipmentsStore.loadShipmentById(shipmentId)

    if (!loadedShipment) {
      loadError.value = 'Shipment not found.'
    }
  } catch (error) {
    console.error('Failed to load dashboard shipment.', error)
    loadError.value = 'The dashboard could not be loaded from local data.'
  } finally {
    syncDashboardSelections()
    editorOpen.value = Boolean(shipment.value && shouldOpenEditor.value)
    if (shipment.value && shouldOpenEditor.value) {
      activeSection.value = 'edit'
    }
    isLoadingShipment.value = false
  }
}

onMounted(loadShipmentFromRoute)

watch(() => route.params.shipmentId, loadShipmentFromRoute)
watch(shouldOpenEditor, (nextValue) => {
  editorOpen.value = Boolean(shipment.value && nextValue)
  if (shipment.value && nextValue) {
    activeSection.value = 'edit'
  }
})
watch(
  shipment,
  () => {
    syncDashboardSelections()
  },
  { immediate: true },
)

async function handleSave(updatedShipment: NonNullable<typeof shipment.value>) {
  await shipmentsStore.updateShipment(updatedShipment)
  syncDashboardSelections()
  editorOpen.value = false
  activeSection.value = 'route'
}

function closeEditorLayer() {
  editorOpen.value = false
  activeSection.value = 'route'
}
</script>

<template>
  <div v-if="isLoadingShipment" class="empty-state empty-state--page">
    <h2>Loading lane dashboard</h2>
    <p>Preparing route nodes, alerts, compliance records, and temperature checkpoints.</p>
  </div>

  <div v-else-if="shipment" class="page-section">
    <section class="dashboard-hero">
      <div>
        <p class="section-heading__eyebrow">{{ shipment.reference }} - {{ shipment.ownerCompany }}</p>
        <h1>{{ shipment.title }}</h1>
        <p class="hero-card__copy">{{ shipment.originCity }} to {{ shipment.destinationCity }} for {{ shipment.productName }}.</p>
      </div>

      <div class="dashboard-hero__actions">
        <div class="dashboard-hero__risk-card">
          <span class="dashboard-hero__risk-label">Route risk</span>
          <StatusPill
            :label="shipment.overallRisk"
            :tone="riskToTone(shipment.overallRisk)"
            class="dashboard-hero__risk-pill"
          />
        </div>
        <button
          v-if="authStore.canEditRoutes"
          type="button"
          class="button button--secondary dashboard-hero__edit-button"
          @click="openSection('edit')"
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

    <section class="dashboard-section-grid">
      <button
        v-for="section in dashboardSections"
        :key="section.id"
        type="button"
        class="dashboard-section-card"
        :class="{ 'dashboard-section-card--active': activeSection === section.id }"
        @click="openSection(section.id)"
      >
        <div class="dashboard-section-card__header">
          <div>
            <p class="section-heading__eyebrow">{{ section.eyebrow }}</p>
            <h3>{{ section.title }}</h3>
          </div>

          <StatusPill :label="section.badge" :tone="section.badgeTone" />
        </div>

        <strong class="dashboard-section-card__value">{{ section.value }}</strong>
      </button>
    </section>

    <section v-if="activeSection === 'route'" class="dashboard-layer">
      <div class="section-heading">
        <div>
          <p class="section-heading__eyebrow">Route</p>
          <h2>Lane checkpoints</h2>
        </div>
      </div>

      <div class="dashboard-subnav">
        <button
          type="button"
          class="dashboard-subnav__button"
          :class="{ 'dashboard-subnav__button--active': activeRouteLayer === 'nodes' }"
          @click="openRouteLayer('nodes')"
        >
          Node checkpoints
        </button>
        <button
          type="button"
          class="dashboard-subnav__button"
          :class="{ 'dashboard-subnav__button--active': activeRouteLayer === 'legs' }"
          @click="openRouteLayer('legs')"
        >
          Transport handovers
        </button>
      </div>

      <div v-if="activeRouteLayer === 'nodes'" class="dashboard-layer-grid">
        <article class="panel-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Layer 2A</p>
              <h3>Route checkpoints</h3>
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
                    Node {{ index + 1 }} - {{ nodeStageLabel(index, shipment.routeNodes.length) }}
                  </p>
                  <strong>{{ node.city }}, {{ node.country }}</strong>
                </div>

                <StatusPill :label="node.riskScore" :tone="riskToTone(node.riskScore)" />
              </div>

              <p>{{ node.locationType }} | {{ node.locationName }}</p>
              <p>{{ node.transportMode }} | ETA {{ node.eta }}</p>
              <p>Required {{ node.tempRange }} | Actual {{ node.actualTemp }}</p>
            </button>
          </div>
        </article>

        <article v-if="selectedNode" class="panel-card route-focus-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Layer 3</p>
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
                <p>{{ alert.category }} | {{ formatDateTime(alert.timestamp) }}</p>
                <p>{{ alert.description }}</p>
              </article>
            </div>

            <div v-else class="empty-state empty-state--compact">
              <p>No active alerts are directly linked to this node.</p>
            </div>
          </article>
        </article>
      </div>

      <div v-else class="dashboard-layer-grid">
        <article class="panel-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Layer 2B</p>
              <h3>Transport handovers</h3>
            </div>

            <p class="section-heading__copy">{{ routeLegs.length }} leg(s)</p>
          </div>

          <div v-if="routeLegs.length" class="stack-list">
            <button
              v-for="leg in routeLegs"
              :key="leg.id"
              type="button"
              class="stack-item stack-item--clickable"
              :class="{ 'stack-item--active': selectedLegId === leg.id }"
              @click="selectLeg(leg.id)"
            >
              <div class="stack-item__row">
                <div>
                  <strong>{{ leg.from.city }} -> {{ leg.to.city }}</strong>
                  <p>{{ leg.mode }} transfer</p>
                </div>

                <StatusPill :label="leg.risk" :tone="riskToTone(leg.risk)" />
              </div>

              <p>{{ leg.from.locationName }} to {{ leg.to.locationName }}</p>
              <p>{{ leg.alerts }} linked alert(s) on this leg</p>
            </button>
          </div>

          <div v-else class="empty-state empty-state--compact">
            <p>This lane does not have enough route points to build handovers yet.</p>
          </div>
        </article>

        <article v-if="selectedLeg" class="panel-card route-focus-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Layer 3</p>
              <h3>{{ selectedLeg.from.city }} -> {{ selectedLeg.to.city }}</h3>
            </div>

            <StatusPill :label="selectedLeg.risk" :tone="riskToTone(selectedLeg.risk)" />
          </div>

          <div class="route-focus-card__meta">
            <p>{{ selectedLeg.mode }} handover</p>
            <p>{{ selectedLeg.alerts }} linked alert(s)</p>
          </div>

          <div class="detail-grid">
            <div class="detail-card">
              <p>From checkpoint</p>
              <strong>{{ selectedLeg.from.locationName }}</strong>
            </div>
            <div class="detail-card">
              <p>To checkpoint</p>
              <strong>{{ selectedLeg.to.locationName }}</strong>
            </div>
            <div class="detail-card">
              <p>Origin temperature</p>
              <strong>{{ selectedLeg.from.actualTemp }}</strong>
            </div>
            <div class="detail-card">
              <p>Destination temperature</p>
              <strong>{{ selectedLeg.to.actualTemp }}</strong>
            </div>
            <div class="detail-card">
              <p>Departure security</p>
              <strong>{{ selectedLeg.from.securityLevel }}</strong>
            </div>
            <div class="detail-card">
              <p>Arrival security</p>
              <strong>{{ selectedLeg.to.securityLevel }}</strong>
            </div>
          </div>

          <article class="route-focus-block">
            <p class="section-heading__eyebrow">Handover summary</p>
            <p class="route-focus-card__note">{{ selectedLeg.from.city }} to {{ selectedLeg.to.city }} by {{ selectedLeg.mode.toLowerCase() }}.</p>
          </article>

          <article class="route-focus-block">
            <p class="section-heading__eyebrow">Checkpoint pair</p>
            <div class="tag-list">
              <span class="tag-chip">{{ selectedLeg.from.validationStatus }}</span>
              <span class="tag-chip">{{ selectedLeg.to.validationStatus }}</span>
              <span class="tag-chip">{{ selectedLeg.from.tempRange }}</span>
              <span class="tag-chip">{{ selectedLeg.to.tempRange }}</span>
            </div>
          </article>
        </article>
      </div>
    </section>

    <section v-else-if="activeSection === 'alerts'" class="dashboard-layer">
      <div class="section-heading">
        <div>
          <p class="section-heading__eyebrow">Alerts</p>
          <h2>Lane watch</h2>
        </div>
      </div>

      <div class="dashboard-layer-grid">
        <article class="panel-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Layer 2</p>
              <h3>Active lane watch</h3>
            </div>

            <StatusPill
              :label="criticalAlerts ? `${criticalAlerts} critical` : 'Stable watch'"
              :tone="criticalAlerts ? 'critical' : 'validated'"
            />
          </div>

          <div v-if="activeAlerts.length" class="stack-list">
            <button
              v-for="alert in activeAlerts"
              :key="alert.id"
              type="button"
              class="stack-item stack-item--clickable"
              :class="{ 'stack-item--active': selectedAlertId === alert.id }"
              @click="selectAlert(alert.id)"
            >
              <div class="stack-item__row">
                <strong>{{ alert.title }}</strong>
                <StatusPill :label="alert.severity" :tone="riskToTone(alert.severity)" />
              </div>

              <p>{{ alert.category }} | {{ formatDateTime(alert.timestamp) }}</p>
              <p>{{ alert.description }}</p>
            </button>
          </div>

          <div v-else class="empty-state empty-state--compact">
            <p>No active alerts for this lane.</p>
          </div>
        </article>

        <article v-if="selectedAlert" class="panel-card route-focus-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Layer 3</p>
              <h3>{{ selectedAlert.title }}</h3>
            </div>

            <StatusPill :label="selectedAlert.severity" :tone="riskToTone(selectedAlert.severity)" />
          </div>

          <div class="route-focus-card__meta">
            <p>{{ selectedAlert.category }}</p>
            <p>{{ formatDateTime(selectedAlert.timestamp) }}</p>
          </div>

          <article class="route-focus-block">
            <p class="section-heading__eyebrow">Alert description</p>
            <p class="route-focus-card__note">{{ selectedAlert.description }}</p>
          </article>

          <div class="detail-grid">
            <div class="detail-card">
              <p>Linked node</p>
              <strong>{{ selectedAlertNode?.locationName ?? 'Lane-level signal' }}</strong>
            </div>
            <div class="detail-card">
              <p>Linked city</p>
              <strong>{{
                selectedAlertNode ? `${selectedAlertNode.city}, ${selectedAlertNode.country}` : 'N/A'
              }}</strong>
            </div>
            <div class="detail-card">
              <p>Severity</p>
              <strong>{{ selectedAlert.severity }}</strong>
            </div>
            <div class="detail-card">
              <p>Current route risk</p>
              <strong>{{ shipment.overallRisk }}</strong>
            </div>
          </div>

          <div class="stack-item__actions" v-if="selectedAlert.nodeId">
            <button type="button" class="button button--secondary" @click="openLinkedNode(selectedAlert.nodeId)">
              Linked node
            </button>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="activeSection === 'compliance'" class="dashboard-layer">
      <div class="section-heading">
        <div>
          <p class="section-heading__eyebrow">Compliance</p>
          <h2>Validation and certificates</h2>
        </div>
      </div>

      <div class="dashboard-layer-grid">
        <article class="panel-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Layer 2</p>
              <h3>Lane compliance records</h3>
            </div>

            <p class="section-heading__copy">{{ shipment.certifications.length }} certificate(s)</p>
          </div>

          <div v-if="shipment.certifications.length" class="stack-list">
            <button
              v-for="certificate in shipment.certifications"
              :key="certificate.id"
              type="button"
              class="stack-item stack-item--clickable"
              :class="{ 'stack-item--active': selectedCertificateId === certificate.id }"
              @click="selectCertificate(certificate.id)"
            >
              <div class="stack-item__row">
                <strong>{{ certificate.name }}</strong>
                <StatusPill :label="certificate.status" :tone="certificateTone(certificate.status)" />
              </div>
              <p>{{ certificate.scope }} | {{ certificate.issuer }}</p>
              <p>Valid until {{ formatDate(certificate.validUntil) }}</p>
            </button>
          </div>

          <div v-else class="empty-state empty-state--compact">
            <p>No compliance records are attached to this lane yet.</p>
          </div>
        </article>

        <article v-if="selectedCertificate" class="panel-card route-focus-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Layer 3</p>
              <h3>{{ selectedCertificate.name }}</h3>
            </div>

            <StatusPill
              :label="selectedCertificate.status"
              :tone="certificateTone(selectedCertificate.status)"
            />
          </div>

          <div class="detail-grid">
            <div class="detail-card">
              <p>Issuer</p>
              <strong>{{ selectedCertificate.issuer }}</strong>
            </div>
            <div class="detail-card">
              <p>Scope</p>
              <strong>{{ selectedCertificate.scope }}</strong>
            </div>
            <div class="detail-card">
              <p>Valid until</p>
              <strong>{{ formatDate(selectedCertificate.validUntil) }}</strong>
            </div>
            <div class="detail-card">
              <p>Linked node</p>
              <strong>{{ selectedCertificateNode?.locationName ?? 'Lane-level record' }}</strong>
            </div>
          </div>

          <article class="route-focus-block">
            <p class="section-heading__eyebrow">Validation snapshot</p>
            <div class="tag-list">
              <span
                v-for="node in shipment.routeNodes"
                :key="node.id"
                class="tag-chip"
              >
                {{ node.city }}: {{ node.validationStatus }}
              </span>
            </div>
          </article>

          <div class="stack-item__actions" v-if="selectedCertificate.nodeId">
            <button
              type="button"
              class="button button--secondary"
              @click="openLinkedNode(selectedCertificate.nodeId)"
            >
              Certified node
            </button>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="activeSection === 'incidents'" class="dashboard-layer">
      <div class="section-heading">
        <div>
          <p class="section-heading__eyebrow">Incidents</p>
          <h2>Operational notes</h2>
        </div>
      </div>

      <div class="dashboard-layer-grid">
        <article class="panel-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Layer 2</p>
              <h3>Operational notes</h3>
            </div>

            <p class="section-heading__copy">{{ shipment.incidents.length }} incident(s)</p>
          </div>

          <div v-if="shipment.incidents.length" class="stack-list">
            <button
              v-for="incident in shipment.incidents"
              :key="incident.id"
              type="button"
              class="stack-item stack-item--clickable"
              :class="{ 'stack-item--active': selectedIncidentId === incident.id }"
              @click="selectIncident(incident.id)"
            >
              <div class="stack-item__row">
                <strong>{{ incident.title }}</strong>
                <StatusPill :label="incident.severity" :tone="riskToTone(incident.severity)" />
              </div>
              <p>{{ formatDateTime(incident.timestamp) }}</p>
              <p>{{ incident.description }}</p>
            </button>
          </div>

          <div v-else class="empty-state empty-state--compact">
            <p>No incidents logged for this lane.</p>
          </div>
        </article>

        <article v-if="selectedIncident" class="panel-card route-focus-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Layer 3</p>
              <h3>{{ selectedIncident.title }}</h3>
            </div>

            <StatusPill :label="selectedIncident.severity" :tone="riskToTone(selectedIncident.severity)" />
          </div>

          <div class="route-focus-card__meta">
            <p>{{ formatDateTime(selectedIncident.timestamp) }}</p>
            <p>{{ shipment.reference }}</p>
          </div>

          <article class="route-focus-block">
            <p class="section-heading__eyebrow">Incident description</p>
            <p class="route-focus-card__note">{{ selectedIncident.description }}</p>
          </article>

          <div class="detail-grid">
            <div class="detail-card">
              <p>Severity</p>
              <strong>{{ selectedIncident.severity }}</strong>
            </div>
            <div class="detail-card">
              <p>Lane status</p>
              <strong>{{ shipment.status }}</strong>
            </div>
            <div class="detail-card">
              <p>Owner company</p>
              <strong>{{ shipment.ownerCompany }}</strong>
            </div>
            <div class="detail-card">
              <p>Consignee</p>
              <strong>{{ shipment.consignee }}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="activeSection === 'edit'" class="dashboard-layer">
      <div class="section-heading">
        <div>
          <p class="section-heading__eyebrow">Edit</p>
          <h2>Route editor</h2>
        </div>
      </div>

      <ShipmentEditorDrawer
        :open="editorOpen"
        :shipment="shipment"
        @close="closeEditorLayer"
        @save="handleSave"
      />
    </section>

    <section v-else class="dashboard-layer">
      <div class="section-heading">
        <div>
          <p class="section-heading__eyebrow">Shipment</p>
          <h2>Lane profile</h2>
        </div>
      </div>

      <div class="dashboard-layer-grid dashboard-layer-grid--wide">
        <article class="panel-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Shipment context</p>
              <h3>Core lane profile</h3>
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

        <article class="panel-card route-focus-card">
          <div class="section-heading">
            <div>
              <p class="section-heading__eyebrow">Operational ownership</p>
              <h3>Commercial frame</h3>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-card">
              <p>Owner company</p>
              <strong>{{ shipment.ownerCompany }}</strong>
            </div>
            <div class="detail-card">
              <p>Reference</p>
              <strong>{{ shipment.reference }}</strong>
            </div>
            <div class="detail-card">
              <p>Origin</p>
              <strong>{{ shipment.originCity }}</strong>
            </div>
            <div class="detail-card">
              <p>Destination</p>
              <strong>{{ shipment.destinationCity }}</strong>
            </div>
            <div class="detail-card">
              <p>Status</p>
              <strong>{{ shipment.status }}</strong>
            </div>
            <div class="detail-card">
              <p>Progress</p>
              <strong>{{ shipment.progress }}%</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>

  <div v-else class="empty-state empty-state--page">
    <h2>Dashboard unavailable</h2>
    <p>{{ loadError ?? 'The selected lane is unavailable.' }}</p>
    <RouterLink :to="{ name: 'shipments' }" class="button">Back to shipments</RouterLink>
  </div>
</template>
