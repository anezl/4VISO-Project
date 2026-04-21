<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import ShipmentEditorDrawer from '@/components/dashboard/ShipmentEditorDrawer.vue'
import ShipmentFlow from '@/components/dashboard/ShipmentFlow.vue'
import StatusPill from '@/components/shared/StatusPill.vue'
import { mockApi } from '@/services/mockApi'
import { useAuthStore } from '@/stores/auth'
import { useShipmentsStore } from '@/stores/shipments'
import { useWorkspaceStore } from '@/stores/workspace'
import { formatDate, formatDateTime } from '@/utils/formatters'
import {
  canApprove,
  riskToTone,
  type CertificationStatus,
  type LocationType,
  type RiskLevel,
  type RouteNode,
  type Shipment,
  type TransportMode,
} from '@/types/domain'

type LaneStep = 'parties' | 'product' | 'routes' | 'report'

interface SuggestedRouteNode {
  city: string
  country: string
  locationName: string
  locationType: LocationType
  nextMode: TransportMode
  risk: RiskLevel
  validationStatus: RouteNode['validationStatus']
}

interface SuggestedRouteCard {
  id: string
  title: string
  summary: string
  eta: string
  risk: RiskLevel
  rationale: string
  tags: string[]
  nodes: SuggestedRouteNode[]
}

const route = useRoute()
const authStore = useAuthStore()
const shipmentsStore = useShipmentsStore()
const workspaceStore = useWorkspaceStore()

const stepOrder: LaneStep[] = ['parties', 'product', 'routes', 'report']
const laneDraft = ref<Shipment | null>(null)
const activeStep = ref<LaneStep>('parties')
const showAdvancedEditor = ref(false)
const isLoadingLane = ref(true)
const loadError = ref<string | null>(null)
const selectedNodeId = ref<string | null>(null)
const specialHandlingInput = ref('')
const reportRecipientsInput = ref('')

const europeanCountries = new Set([
  'Belgium',
  'Netherlands',
  'Germany',
  'France',
  'United Kingdom',
  'Switzerland',
  'Luxembourg',
  'Spain',
  'Italy',
])
const northAmericanCountries = new Set(['United States', 'Canada'])

const shipment = computed(() => shipmentsStore.activeShipment)
const activeLane = computed(() => laneDraft.value)
const routeNodes = computed(() => activeLane.value?.routeNodes ?? [])
const selectedNode = computed(() => {
  return routeNodes.value.find((node) => node.id === selectedNodeId.value) ?? routeNodes.value[0] ?? null
})
const activeAlerts = computed(() => activeLane.value?.alerts.filter((alert) => alert.isActive) ?? [])
const pendingCertificates = computed(
  () => activeLane.value?.certifications.filter((certificate) => certificate.status !== 'Valid').length ?? 0,
)
const validatedNodes = computed(
  () => routeNodes.value.filter((node) => node.validationStatus === 'Validated').length,
)
const companyLaneCount = computed(() => {
  if (!activeLane.value) {
    return 0
  }

  return shipmentsStore.shipments.filter(
    (candidate) => candidate.ownerCompany === activeLane.value?.ownerCompany,
  ).length
})
const laneInputScore = computed(() => {
  const lane = activeLane.value

  if (!lane) {
    return 0
  }

  return [
    lane.ownerCompany,
    lane.shipperName,
    lane.originFacility,
    lane.originCity,
    lane.consignee,
    lane.receiverName,
    lane.destinationFacility,
    lane.destinationCity,
    lane.productName,
    lane.productType,
    lane.dimensions !== 'TBD' ? lane.dimensions : '',
    lane.quantity !== 'TBD' ? lane.quantity : '',
    lane.weight !== 'TBD' ? lane.weight : '',
    lane.packageType,
    lane.packagingDetails,
    lane.requiredTempRange,
    lane.specialHandling.length ? 'handling' : '',
    lane.reportRecipients.length ? 'recipients' : '',
  ].filter(Boolean).length
})
const hasUnsavedLaneChanges = computed(() => {
  if (!shipment.value || !laneDraft.value) {
    return false
  }

  return JSON.stringify(shipment.value) !== JSON.stringify(laneDraft.value)
})

const partiesChecklist = computed(() => {
  const lane = activeLane.value

  return [
    { label: 'Company', complete: Boolean(lane?.ownerCompany.trim()) },
    { label: 'Shipper', complete: Boolean(lane?.shipperName.trim()) },
    { label: 'Origin facility', complete: Boolean(lane?.originFacility.trim()) },
    { label: 'Origin city', complete: Boolean(lane?.originCity.trim()) },
    { label: 'Consignee', complete: Boolean(lane?.consignee.trim()) },
    { label: 'Receiver', complete: Boolean(lane?.receiverName.trim()) },
    { label: 'Destination facility', complete: Boolean(lane?.destinationFacility.trim()) },
    { label: 'Destination city', complete: Boolean(lane?.destinationCity.trim()) },
  ]
})

const productChecklist = computed(() => {
  const lane = activeLane.value

  return [
    { label: 'Product name', complete: Boolean(lane?.productName.trim()) },
    { label: 'Product type', complete: Boolean(lane?.productType.trim()) },
    { label: 'Dimensions', complete: Boolean(lane?.dimensions.trim() && lane.dimensions !== 'TBD') },
    { label: 'Quantity', complete: Boolean(lane?.quantity.trim() && lane.quantity !== 'TBD') },
    { label: 'Weight', complete: Boolean(lane?.weight.trim() && lane.weight !== 'TBD') },
    { label: 'Packaging', complete: Boolean(lane?.packageType.trim()) },
    { label: 'Package details', complete: Boolean(lane?.packagingDetails.trim()) },
    { label: 'Temperature', complete: Boolean(lane?.requiredTempRange.trim()) },
  ]
})

const routeChecklist = computed(() => {
  const firstNode = routeNodes.value[0]
  const lastNode = routeNodes.value[routeNodes.value.length - 1]

  return [
    {
      label: 'Origin route point',
      complete: Boolean(firstNode?.city.trim() || firstNode?.locationName.trim()),
    },
    {
      label: 'Destination route point',
      complete: Boolean(lastNode?.city.trim() || lastNode?.locationName.trim()),
    },
  ]
})

const stepCompletion = computed(() => ({
  parties: partiesChecklist.value.every((item) => item.complete),
  product: productChecklist.value.every((item) => item.complete),
  routes: routeChecklist.value.every((item) => item.complete),
  report: (activeLane.value?.reportRecipients.length ?? 0) > 0,
}))

const stepMeta = computed(() => [
  {
    id: 'parties' as const,
    eyebrow: 'Step 1',
    title: 'Company and route parties',
    summary: 'Who is shipping, from where, and who receives where.',
    complete: stepCompletion.value.parties,
    unlocked: true,
  },
  {
    id: 'product' as const,
    eyebrow: 'Step 2',
    title: 'Product profile',
    summary: 'What is being moved, how it is packed, and what constraints apply.',
    complete: stepCompletion.value.product,
    unlocked: stepCompletion.value.parties,
  },
  {
    id: 'routes' as const,
    eyebrow: 'Step 3',
    title: 'Suggested routes',
    summary: 'Compare options or build your own custom lane.',
    complete: stepCompletion.value.routes,
    unlocked: stepCompletion.value.parties && stepCompletion.value.product,
  },
  {
    id: 'report' as const,
    eyebrow: 'Step 4',
    title: 'Report and go live',
    summary: 'Generate, send, approve, and track the lane.',
    complete: stepCompletion.value.report,
    unlocked: stepCompletion.value.parties && stepCompletion.value.product,
  },
])

const stepProgressText = computed(() => {
  const completed = stepMeta.value.filter((step) => step.complete).length
  return `${completed}/${stepMeta.value.length} steps ready`
})

const suggestedRoutes = computed(() => (activeLane.value ? buildSuggestedRoutes(activeLane.value) : []))

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function ensureSelection(items: Array<{ id: string }>, currentId: string | null) {
  if (items.some((item) => item.id === currentId)) {
    return currentId
  }

  return items[0]?.id ?? null
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

function reportTone(status: Shipment['reportStatus']) {
  if (status === 'Live') {
    return 'validated' as const
  }

  if (status === 'Pending') {
    return 'pending' as const
  }

  return 'muted' as const
}

function extractFirstNumber(value: string) {
  const match = value.match(/(\d+(?:\.\d+)?)/)
  return match ? Number(match[1]) : null
}

function isEuropean(country: string) {
  return europeanCountries.has(country)
}

function isNorthAmerican(country: string) {
  return northAmericanCountries.has(country)
}

function missingLabels(items: Array<{ label: string; complete: boolean }>) {
  return items
    .filter((item) => !item.complete)
    .map((item) => item.label)
    .join(', ')
}

function missingCount(items: Array<{ label: string; complete: boolean }>) {
  return items.filter((item) => !item.complete).length
}

function syncAuxiliaryInputs(nextLane: Shipment | null) {
  specialHandlingInput.value = nextLane?.specialHandling.join(', ') ?? ''
  reportRecipientsInput.value = nextLane?.reportRecipients.join(', ') ?? ''
}

function syncSelections() {
  selectedNodeId.value = ensureSelection(routeNodes.value, selectedNodeId.value)
}

function syncRouteEndpoints() {
  if (!laneDraft.value || laneDraft.value.routeNodes.length < 2) {
    return
  }

  const firstNode = laneDraft.value.routeNodes[0]
  const lastNode = laneDraft.value.routeNodes[laneDraft.value.routeNodes.length - 1]

  firstNode.city = laneDraft.value.originCity
  firstNode.locationName = laneDraft.value.originFacility
  lastNode.city = laneDraft.value.destinationCity
  lastNode.locationName = laneDraft.value.destinationFacility
}

function syncLaneMetadata(lane: Shipment) {
  lane.specialHandling = specialHandlingInput.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  lane.reportRecipients = reportRecipientsInput.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  lane.originCity = lane.routeNodes[0]?.city ?? lane.originCity
  lane.destinationCity = lane.routeNodes[lane.routeNodes.length - 1]?.city ?? lane.destinationCity
  lane.originFacility = lane.routeNodes[0]?.locationName ?? lane.originFacility
  lane.destinationFacility = lane.routeNodes[lane.routeNodes.length - 1]?.locationName ?? lane.destinationFacility
  lane.progress = Math.min(100, Math.max(0, lane.progress))
}

function isStepUnlocked(step: LaneStep) {
  if (step === 'parties') {
    return true
  }

  if (step === 'product') {
    return stepCompletion.value.parties
  }

  return stepCompletion.value.parties && stepCompletion.value.product
}

function activateStep(step: LaneStep) {
  if (isStepUnlocked(step)) {
    activeStep.value = step
  }
}

function goToPreviousStep() {
  const currentIndex = stepOrder.indexOf(activeStep.value)
  if (currentIndex > 0) {
    activeStep.value = stepOrder[currentIndex - 1] ?? activeStep.value
  }
}

function goToNextStep() {
  const currentIndex = stepOrder.indexOf(activeStep.value)
  const nextStep = stepOrder[currentIndex + 1]

  if (nextStep && isStepUnlocked(nextStep)) {
    activeStep.value = nextStep
  }
}

async function persistLane(nextLane: Shipment, notification?: { title: string; message: string; severity: RiskLevel }) {
  syncLaneMetadata(nextLane)
  const updatedLane = await shipmentsStore.updateShipment(nextLane)
  laneDraft.value = cloneValue(updatedLane)
  syncAuxiliaryInputs(updatedLane)
  syncSelections()

  if (notification) {
    await mockApi.createNotification({
      id: generateId('notification'),
      shipmentId: updatedLane.id,
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
      timestamp: new Date().toISOString(),
      read: false,
    })
    await workspaceStore.loadWorkspace(true)
  }
}

async function saveLaneProfile() {
  if (!laneDraft.value) {
    return
  }

  await persistLane(cloneValue(laneDraft.value))
}

function resetLaneDraft() {
  if (!shipment.value) {
    return
  }

  laneDraft.value = cloneValue(shipment.value)
  syncAuxiliaryInputs(laneDraft.value)
  syncSelections()
  activeStep.value = 'parties'
}

function defaultAirHub(originCity: string, originCountry: string) {
  if (originCity === 'Basel') {
    return {
      city: 'Paris',
      country: 'France',
      locationName: 'CDG Biofreight Hub',
      locationType: 'Airport' as const,
    }
  }

  if (originCity === 'Antwerp' || originCountry === 'Netherlands' || originCountry === 'Germany') {
    return {
      city: 'Frankfurt',
      country: 'Germany',
      locationName: 'Frankfurt Life Science Hub',
      locationType: 'Airport' as const,
    }
  }

  return {
    city: 'London',
    country: 'United Kingdom',
    locationName: 'Heathrow Cold Hub',
    locationType: 'Airport' as const,
  }
}

function defaultSeaHub(originCountry: string) {
  if (originCountry === 'Belgium' || originCountry === 'Netherlands') {
    return {
      city: 'Rotterdam',
      country: 'Netherlands',
      locationName: 'Rotterdam Reefer Port',
      locationType: 'Port' as const,
    }
  }

  return {
    city: 'Le Havre',
    country: 'France',
    locationName: 'Le Havre Pharma Port',
    locationType: 'Port' as const,
  }
}

function defaultDestinationGateway(destinationCity: string, destinationCountry: string) {
  if (destinationCity === 'Washington') {
    return {
      city: 'Washington',
      country: 'United States',
      locationName: 'Dulles Pharma Gateway',
      locationType: 'Airport' as const,
    }
  }

  if (destinationCity === 'New York') {
    return {
      city: 'New York',
      country: 'United States',
      locationName: 'JFK Pharma Gateway',
      locationType: 'Airport' as const,
    }
  }

  if (destinationCity === 'Montreal') {
    return {
      city: 'Montreal',
      country: 'Canada',
      locationName: 'Montreal Cold Chain Gateway',
      locationType: 'Distribution Center' as const,
    }
  }

  return {
    city: destinationCity,
    country: destinationCountry,
    locationName: `${destinationCity} Gateway`,
    locationType: 'Distribution Center' as const,
  }
}

function buildSuggestedRoutes(lane: Shipment) {
  const originNode = lane.routeNodes[0]
  const destinationNode = lane.routeNodes[lane.routeNodes.length - 1]
  const originCountry = originNode?.country ?? 'Belgium'
  const destinationCountry = destinationNode?.country ?? 'United States'
  const airHub = defaultAirHub(lane.originCity, originCountry)
  const seaHub = defaultSeaHub(originCountry)
  const destinationGateway = defaultDestinationGateway(lane.destinationCity, destinationCountry)
  const weight = extractFirstNumber(lane.weight)
  const handling = lane.specialHandling.map((item) => item.toLowerCase())
  const temperature = lane.requiredTempRange.toLowerCase()
  const productType = lane.productType.toLowerCase()
  const detailScore = laneInputScore.value
  const isRegionalEuropeanLane = isEuropean(originCountry) && isEuropean(destinationCountry)
  const isTransatlanticLane = isNorthAmerican(originCountry) || isNorthAmerican(destinationCountry)

  const templates: SuggestedRouteCard[] = [
    {
      id: 'premium-air',
      title: 'Premium air bridge',
      summary: `${lane.originCity} -> ${airHub.city} -> ${lane.destinationCity}`,
      eta: '24 to 36 hours',
      risk: 'Medium',
      rationale: 'Best fit for urgent, fragile, or tightly temperature-controlled pharma shipments.',
      tags: ['Fastest', 'Priority', 'Cold-chain'],
      nodes: [
        {
          city: lane.originCity,
          country: originCountry,
          locationName: lane.originFacility,
          locationType: originNode?.locationType ?? 'Warehouse',
          nextMode: 'Road',
          risk: 'Low',
          validationStatus: 'Pending',
        },
        {
          city: airHub.city,
          country: airHub.country,
          locationName: airHub.locationName,
          locationType: airHub.locationType,
          nextMode: 'Air',
          risk: 'Medium',
          validationStatus: 'Pending',
        },
        {
          city: lane.destinationCity,
          country: destinationCountry,
          locationName: destinationGateway.locationName,
          locationType: destinationGateway.locationType,
          nextMode: 'Road',
          risk: 'Medium',
          validationStatus: 'Pending',
        },
      ],
    },
    {
      id: 'balanced-air',
      title: 'Balanced cold-chain route',
      summary: `${lane.originCity} -> ${airHub.city} -> ${destinationGateway.city} -> ${lane.destinationCity}`,
      eta: '36 to 48 hours',
      risk: 'Low',
      rationale: 'The most stable option for operators who want more resilience and checkpoint control.',
      tags: ['Recommended', 'Stable', 'Validated path'],
      nodes: [
        {
          city: lane.originCity,
          country: originCountry,
          locationName: lane.originFacility,
          locationType: originNode?.locationType ?? 'Warehouse',
          nextMode: 'Road',
          risk: 'Low',
          validationStatus: 'Validated',
        },
        {
          city: airHub.city,
          country: airHub.country,
          locationName: airHub.locationName,
          locationType: airHub.locationType,
          nextMode: 'Air',
          risk: 'Low',
          validationStatus: 'Validated',
        },
        {
          city: destinationGateway.city,
          country: destinationGateway.country,
          locationName: destinationGateway.locationName,
          locationType: destinationGateway.locationType,
          nextMode: 'Road',
          risk: 'Medium',
          validationStatus: 'Pending',
        },
      ],
    },
  ]

  if (isTransatlanticLane) {
    templates.push({
      id: 'sea-economy',
      title: 'Sea-economy bridge',
      summary: `${lane.originCity} -> ${seaHub.city} -> ${lane.destinationCity}`,
      eta: '8 to 12 days',
      risk: 'High',
      rationale: 'Lower cost, but only suitable when time sensitivity and product fragility are less critical.',
      tags: ['Economy', 'Reefer', 'Long lead time'],
      nodes: [
        {
          city: lane.originCity,
          country: originCountry,
          locationName: lane.originFacility,
          locationType: originNode?.locationType ?? 'Warehouse',
          nextMode: 'Road',
          risk: 'Medium',
          validationStatus: 'Pending',
        },
        {
          city: seaHub.city,
          country: seaHub.country,
          locationName: seaHub.locationName,
          locationType: seaHub.locationType,
          nextMode: 'Sea',
          risk: 'High',
          validationStatus: 'Pending',
        },
        {
          city: lane.destinationCity,
          country: destinationCountry,
          locationName: destinationGateway.locationName,
          locationType: destinationGateway.locationType,
          nextMode: 'Road',
          risk: 'Medium',
          validationStatus: 'Pending',
        },
      ],
    })
  }

  if (isRegionalEuropeanLane) {
    templates.push({
      id: 'road-corridor',
      title: 'Validated road corridor',
      summary: `${lane.originCity} -> Cologne -> ${lane.destinationCity}`,
      eta: '16 to 28 hours',
      risk: 'Low',
      rationale: 'Simple GDP-style regional trucking corridor for dense European networks.',
      tags: ['Regional', 'Road only', 'GDP corridor'],
      nodes: [
        {
          city: lane.originCity,
          country: originCountry,
          locationName: lane.originFacility,
          locationType: originNode?.locationType ?? 'Warehouse',
          nextMode: 'Road',
          risk: 'Low',
          validationStatus: 'Validated',
        },
        {
          city: 'Cologne',
          country: 'Germany',
          locationName: 'Cologne GDP Transit Hub',
          locationType: 'Hub',
          nextMode: 'Road',
          risk: 'Low',
          validationStatus: 'Validated',
        },
        {
          city: lane.destinationCity,
          country: destinationCountry,
          locationName: lane.destinationFacility,
          locationType: destinationGateway.locationType,
          nextMode: 'Road',
          risk: 'Low',
          validationStatus: 'Pending',
        },
      ],
    })
  }

  const filtered = templates.filter((template) => {
    if (template.id === 'sea-economy') {
      if (
        handling.includes('fragile') ||
        handling.includes('not stackable') ||
        handling.includes('time critical') ||
        handling.includes('dry ice')
      ) {
        return false
      }

      if (temperature.includes('-20') || productType.includes('cell')) {
        return false
      }
    }

    if (template.id === 'premium-air' && weight && weight > 800) {
      return false
    }

    if (template.id === 'balanced-air' && temperature.includes('-20') && !lane.packageType.toLowerCase().includes('active')) {
      return false
    }

    return true
  })

  const maxVisible = detailScore >= 14 ? 2 : detailScore >= 10 ? 3 : 4
  return filtered.slice(0, maxVisible)
}

function buildRouteNodesFromSuggestion(lane: Shipment, suggestion: SuggestedRouteCard) {
  const handlingTags = lane.specialHandling.length ? lane.specialHandling : ['Perishable goods']

  return suggestion.nodes.map((node, index) => {
    const securityLevel: RouteNode['securityLevel'] = handlingTags.some((item) =>
      item.toLowerCase().includes('time'),
    )
      ? 'Enhanced'
      : 'Standard'

    return {
      id: generateId('node'),
      city: node.city,
      country: node.country,
      locationName: node.locationName,
      locationType: node.locationType,
      transportMode: node.nextMode,
      eta: index === 0 ? 'Planning release' : `Planned checkpoint ${index + 1}`,
      tempRange: lane.requiredTempRange,
      actualTemp: lane.actualAverageTemp,
      securityLevel,
      storageCapability:
        index === 0
          ? 'Origin staging and release area'
          : index === suggestion.nodes.length - 1
            ? 'Receiving and dispatch buffer'
            : 'Validated transfer area',
      dwellTime: index === 0 ? '1h 20m' : index === suggestion.nodes.length - 1 ? '1h 40m' : '3h 10m',
      operationalCapabilities:
        index === 0
          ? ['Release staging', 'Batch confirmation', 'Secure handover']
          : index === suggestion.nodes.length - 1
            ? ['Inbound release', 'Dispatch planning', 'Exception handling']
            : ['Cross-dock', 'Cold-chain transfer', 'Validation checkpoint'],
      handlingCapabilities: ['Perishable goods', ...handlingTags],
      monitoringSystems: ['Track & Trace', 'IoT Sensors', 'Manual Checkpoints'],
      validatorName: 'Pending lane approval',
      validatedAt: 'Awaiting approval',
      nodeNotes: `Suggested by ${suggestion.title} based on the current lane details.`,
      riskScore: node.risk,
      certifications: ['GDP review required'],
      validationStatus: node.validationStatus,
    } satisfies RouteNode
  })
}

async function applySuggestedRoute(suggestion: SuggestedRouteCard) {
  if (!laneDraft.value || !authStore.canEditRoutes) {
    return
  }

  laneDraft.value.routeNodes = buildRouteNodesFromSuggestion(laneDraft.value, suggestion)
  laneDraft.value.overallRisk = suggestion.risk
  laneDraft.value.reportStatus = 'Draft'
  laneDraft.value.progress = Math.min(laneDraft.value.progress, 18)
  syncRouteEndpoints()
  syncSelections()
}

async function generateReport() {
  if (!laneDraft.value) {
    return
  }

  const nextLane = cloneValue(laneDraft.value)
  const timestamp = new Date().toISOString()
  nextLane.reportStatus = 'Pending'
  nextLane.reportGeneratedAt = timestamp

  await persistLane(nextLane, {
    title: 'Lane report generated',
    message: `${nextLane.reference} is pending approval.`,
    severity: nextLane.overallRisk,
  })
}

async function sendReport() {
  if (!laneDraft.value) {
    return
  }

  const nextLane = cloneValue(laneDraft.value)
  const timestamp = new Date().toISOString()
  nextLane.reportGeneratedAt = nextLane.reportGeneratedAt ?? timestamp
  nextLane.reportSentAt = timestamp
  if (nextLane.reportStatus === 'Draft') {
    nextLane.reportStatus = 'Pending'
  }

  await persistLane(nextLane, {
    title: 'Lane report sent',
    message: `${nextLane.reference} was sent to ${nextLane.reportRecipients.join(', ') || 'the selected recipients'}.`,
    severity: nextLane.overallRisk,
  })
}

async function publishReport() {
  if (!laneDraft.value || !canApprove(authStore.currentUser?.role)) {
    return
  }

  const nextLane = cloneValue(laneDraft.value)
  const timestamp = new Date().toISOString()
  nextLane.reportGeneratedAt = nextLane.reportGeneratedAt ?? timestamp
  nextLane.reportLiveAt = timestamp
  nextLane.reportStatus = 'Live'
  nextLane.progress = Math.max(nextLane.progress, 24)

  await persistLane(nextLane, {
    title: 'Lane is now live',
    message: `${nextLane.reference} is live and trackable for ${nextLane.ownerCompany}.`,
    severity: nextLane.overallRisk,
  })
}

function downloadReport() {
  const lane = activeLane.value

  if (!lane) {
    return
  }

  const lines = [
    `Lane Reference: ${lane.reference}`,
    `Lane Title: ${lane.title}`,
    `Company: ${lane.ownerCompany}`,
    `Shipper: ${lane.shipperName} from ${lane.originFacility}, ${lane.originCity}`,
    `Receiver: ${lane.receiverName} at ${lane.destinationFacility}, ${lane.destinationCity}`,
    `Product: ${lane.productName}`,
    `Product Type: ${lane.productType}`,
    `Dimensions: ${lane.dimensions}`,
    `Quantity: ${lane.quantity}`,
    `Weight: ${lane.weight}`,
    `Packaging: ${lane.packageType} / ${lane.packagingDetails}`,
    `Temperature: ${lane.requiredTempRange}`,
    `Special Handling: ${lane.specialHandling.join(', ') || 'None listed'}`,
    `Report Status: ${lane.reportStatus}`,
    `Recipients: ${lane.reportRecipients.join(', ') || 'None listed'}`,
    `Route: ${lane.routeNodes.map((node) => node.city).join(' -> ')}`,
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${lane.reference.toLowerCase()}-lane-report.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function selectNode(nodeId: string) {
  selectedNodeId.value = nodeId
}

async function loadLaneFromRoute() {
  const shipmentId = typeof route.params.shipmentId === 'string' ? route.params.shipmentId : ''

  if (!shipmentId) {
    loadError.value = 'Missing lane identifier.'
    isLoadingLane.value = false
    return
  }

  isLoadingLane.value = true
  loadError.value = null

  try {
    const loadedLane = await shipmentsStore.loadShipmentById(shipmentId)

    if (!loadedLane) {
      loadError.value = 'Lane not found.'
    }
  } catch (error) {
    console.error('Failed to load lane.', error)
    loadError.value = 'The selected lane could not be loaded from local data.'
  } finally {
    isLoadingLane.value = false
    showAdvancedEditor.value = route.query.edit === '1' && authStore.canEditRoutes
  }
}

async function handleRouteEditorSave(updatedShipment: Shipment) {
  await persistLane(updatedShipment)
  showAdvancedEditor.value = false
}

watch(
  shipment,
  (nextLane) => {
    laneDraft.value = nextLane ? cloneValue(nextLane) : null
    syncAuxiliaryInputs(laneDraft.value)
    syncSelections()
  },
  { immediate: true },
)

watch(
  () => route.params.shipmentId,
  () => {
    loadLaneFromRoute()
  },
)

watch(
  () => route.query.edit,
  (nextValue) => {
    showAdvancedEditor.value = nextValue === '1' && authStore.canEditRoutes
  },
)

watch(specialHandlingInput, (nextValue) => {
  if (!laneDraft.value) {
    return
  }

  laneDraft.value.specialHandling = nextValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
})

watch(reportRecipientsInput, (nextValue) => {
  if (!laneDraft.value) {
    return
  }

  laneDraft.value.reportRecipients = nextValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
})

watch(
  () => [
    laneDraft.value?.originCity,
    laneDraft.value?.destinationCity,
    laneDraft.value?.originFacility,
    laneDraft.value?.destinationFacility,
  ],
  () => {
    syncRouteEndpoints()
  },
)

watch(
  routeNodes,
  () => {
    syncSelections()
  },
  { deep: true },
)

onMounted(loadLaneFromRoute)
</script>

<template>
  <div v-if="isLoadingLane" class="empty-state empty-state--page">
    <h2>Loading lane workspace</h2>
    <p>Preparing route overview, input steps, and tracking data.</p>
  </div>

  <div v-else-if="activeLane" class="page-section">
    <section class="lane-builder-shell panel-card">
      <div class="lane-builder-shell__header">
        <div class="lane-builder-shell__title">
          <p class="section-heading__eyebrow">Lane</p>
          <h1>{{ activeLane.title }}</h1>
          <p class="panel-card__copy">{{ activeLane.reference }} / {{ activeLane.ownerCompany || 'Unassigned company' }}</p>
        </div>

        <div class="lane-builder-shell__actions">
          <button v-if="authStore.canEditRoutes" type="button" class="button" @click="saveLaneProfile">
            Save lane
          </button>
          <button type="button" class="button button--ghost" @click="downloadReport">Download report</button>
        </div>
      </div>

      <div class="lane-builder-shell__status-row">
        <StatusPill :label="activeLane.overallRisk" :tone="riskToTone(activeLane.overallRisk)" />
        <StatusPill :label="`Report ${activeLane.reportStatus}`" :tone="reportTone(activeLane.reportStatus)" />
        <span class="lane-builder-shell__status-copy">{{ companyLaneCount }} tracked lane(s)</span>
        <span class="lane-builder-shell__status-copy">{{ stepProgressText }}</span>
      </div>

      <ShipmentFlow
        :shipment="activeLane"
        :selected-node-id="selectedNodeId"
        :show-quick-facts="false"
        @select-node="selectNode"
      />

      <div class="lane-builder__step-strip">
        <button
          v-for="step in stepMeta"
          :key="step.id"
          type="button"
          class="lane-builder__step-button"
          :class="{
            'lane-builder__step-button--active': activeStep === step.id,
            'lane-builder__step-button--complete': step.complete,
          }"
          :disabled="!step.unlocked"
          @click="activateStep(step.id)"
        >
          <span class="lane-builder__step-index">{{ step.eyebrow }}</span>
          <strong>{{ step.title }}</strong>
          <StatusPill
            :label="step.complete ? 'Ready' : step.unlocked ? 'Open' : 'Locked'"
            :tone="step.complete ? 'validated' : step.unlocked ? 'brand' : 'muted'"
          />
        </button>
      </div>

      <div
        class="lane-builder__workspace"
        :class="{
          'lane-builder__workspace--routes': activeStep === 'routes',
          'lane-builder__workspace--report': activeStep === 'report',
        }"
      >
        <section v-if="activeStep === 'parties'" class="lane-builder__form-panel">
          <div class="lane-builder__intro">
            <div>
              <p class="section-heading__eyebrow">Step 1</p>
              <h3>Company, shipper, and receiver</h3>
              <p class="section-heading__copy">Start with who owns the lane, where it starts, and where it ends.</p>
            </div>

            <StatusPill
              :label="stepCompletion.parties ? 'Ready for product data' : `${missingCount(partiesChecklist)} field(s) missing`"
              :tone="stepCompletion.parties ? 'validated' : 'pending'"
            />
          </div>

          <p v-if="!stepCompletion.parties" class="lane-builder__hint">Missing: {{ missingLabels(partiesChecklist) }}</p>

          <div class="lane-builder__form-grid">
            <label>
              <span>Company name</span>
              <input v-model="activeLane.ownerCompany" class="input" placeholder="Company name" />
            </label>
            <label>
              <span>Shipper name</span>
              <input v-model="activeLane.shipperName" class="input" placeholder="Shipper name" />
            </label>
            <label>
              <span>Origin facility</span>
              <input v-model="activeLane.originFacility" class="input" placeholder="Origin facility" />
            </label>
            <label>
              <span>Origin city</span>
              <input v-model="activeLane.originCity" class="input" placeholder="Origin city" />
            </label>
            <label>
              <span>Consignee</span>
              <input v-model="activeLane.consignee" class="input" placeholder="Consignee" />
            </label>
            <label>
              <span>Receiver name</span>
              <input v-model="activeLane.receiverName" class="input" placeholder="Receiver name" />
            </label>
            <label>
              <span>Destination facility</span>
              <input v-model="activeLane.destinationFacility" class="input" placeholder="Destination facility" />
            </label>
            <label>
              <span>Destination city</span>
              <input v-model="activeLane.destinationCity" class="input" placeholder="Destination city" />
            </label>
          </div>
        </section>

        <section v-else-if="activeStep === 'product'" class="lane-builder__form-panel">
          <div class="lane-builder__intro">
            <div>
              <p class="section-heading__eyebrow">Step 2</p>
              <h3>Product, packaging, and limits</h3>
              <p class="section-heading__copy">
                The more precise this step is, the narrower and better the route suggestions become.
              </p>
            </div>

            <StatusPill
              :label="stepCompletion.product ? 'Route suggestions unlocked' : `${missingCount(productChecklist)} field(s) missing`"
              :tone="stepCompletion.product ? 'validated' : 'pending'"
            />
          </div>

          <p v-if="!stepCompletion.product" class="lane-builder__hint">Missing: {{ missingLabels(productChecklist) }}</p>

          <div class="lane-builder__form-grid">
            <label>
              <span>Product</span>
              <input v-model="activeLane.productName" class="input" placeholder="Product name" />
            </label>
            <label>
              <span>Product type</span>
              <input v-model="activeLane.productType" class="input" placeholder="Product type" />
            </label>
            <label>
              <span>Dimensions</span>
              <input v-model="activeLane.dimensions" class="input" placeholder="L x W x H" />
            </label>
            <label>
              <span>Quantity</span>
              <input v-model="activeLane.quantity" class="input" placeholder="Quantity" />
            </label>
            <label>
              <span>Weight</span>
              <input v-model="activeLane.weight" class="input" placeholder="Weight" />
            </label>
            <label>
              <span>Packaging</span>
              <input v-model="activeLane.packageType" class="input" placeholder="Packaging type" />
            </label>
            <label class="lane-builder__form-grid--wide">
              <span>Package details</span>
              <input v-model="activeLane.packagingDetails" class="input" placeholder="Package details" />
            </label>
            <label>
              <span>Temperature</span>
              <input v-model="activeLane.requiredTempRange" class="input" placeholder="Temperature range" />
            </label>
            <label class="lane-builder__form-grid--wide">
              <span>Special handling</span>
              <input
                v-model="specialHandlingInput"
                class="input"
                placeholder="Fragile, Not Stackable, Time Critical"
              />
            </label>
          </div>

          <div v-if="activeLane.specialHandling.length" class="tag-list">
            <span v-for="item in activeLane.specialHandling" :key="item" class="tag-chip">
              {{ item }}
            </span>
          </div>
        </section>

        <section v-else-if="activeStep === 'routes'" class="lane-builder__form-panel">
          <div class="lane-builder__intro">
            <div>
              <p class="section-heading__eyebrow">Step 3</p>
              <h3>Suggested routes</h3>
              <p class="section-heading__copy">
                More lane detail means fewer options, but those options are closer to the final route.
              </p>
            </div>

            <StatusPill :label="`${suggestedRoutes.length} option(s)`" :tone="suggestedRoutes.length <= 2 ? 'validated' : 'brand'" />
          </div>

          <div class="lane-builder__toggle-row">
            <button
              type="button"
              class="button"
              :class="{ 'button--secondary': showAdvancedEditor }"
              @click="showAdvancedEditor = false"
            >
              Suggested routes
            </button>
            <button
              v-if="authStore.canEditRoutes"
              type="button"
              class="button button--secondary"
              :class="{ 'button--ghost': !showAdvancedEditor }"
              @click="showAdvancedEditor = true"
            >
              Custom route builder
            </button>
          </div>

          <article class="lane-builder__workspace-card">
            <p class="section-heading__eyebrow">Lane fit</p>
            <h4>What the route logic is using right now</h4>

            <div class="lane-builder__summary-grid">
              <div class="lane-builder__summary-card">
                <p>Company</p>
                <strong>{{ activeLane.ownerCompany || 'Add company' }}</strong>
              </div>
              <div class="lane-builder__summary-card">
                <p>Origin</p>
                <strong>{{ activeLane.originCity || 'Add origin' }}</strong>
              </div>
              <div class="lane-builder__summary-card">
                <p>Destination</p>
                <strong>{{ activeLane.destinationCity || 'Add destination' }}</strong>
              </div>
              <div class="lane-builder__summary-card">
                <p>Input detail</p>
                <strong>{{ laneInputScore }} field(s)</strong>
              </div>
            </div>

            <p class="panel-card__copy">
              Use a suggestion as the base lane, or open the custom route builder and create your own path from scratch.
            </p>
          </article>
        </section>

        <section v-else class="lane-builder__form-panel">
          <div class="lane-builder__intro">
            <div>
              <p class="section-heading__eyebrow">Step 4</p>
              <h3>Report, review, and go live</h3>
              <p class="section-heading__copy">
                Generate a lane report, send it for review, and move the lane into live tracking.
              </p>
            </div>

            <StatusPill :label="activeLane.reportStatus" :tone="reportTone(activeLane.reportStatus)" />
          </div>

          <div class="lane-builder__form-grid">
            <label class="lane-builder__form-grid--wide">
              <span>Report recipients</span>
              <input v-model="reportRecipientsInput" class="input" placeholder="ops@company.com, qa@company.com" />
            </label>
          </div>

          <div class="lane-report-actions">
            <button type="button" class="button" @click="generateReport">Generate report</button>
            <button type="button" class="button button--secondary" @click="sendReport">Send report</button>
            <button
              v-if="canApprove(authStore.currentUser?.role)"
              type="button"
              class="button button--secondary"
              @click="publishReport"
            >
              Confirm live
            </button>
            <button type="button" class="button button--ghost" @click="downloadReport">Download report</button>
          </div>

          <article class="lane-builder__workspace-card">
            <p class="section-heading__eyebrow">What happens next</p>
            <h4>Pending first, live after approval</h4>
            <p class="panel-card__copy">
              Once the report is generated it moves into pending review. After approval the lane becomes live and can be tracked across all checkpoints.
            </p>
          </article>
        </section>

        <aside class="lane-builder__result-panel">
          <template v-if="activeStep === 'parties'">
            <article class="lane-builder__workspace-card">
              <p class="section-heading__eyebrow">Live lane summary</p>
              <h4>Current setup</h4>

              <div class="lane-builder__summary-grid">
                <div class="lane-builder__summary-card">
                  <p>Company</p>
                  <strong>{{ activeLane.ownerCompany || 'Add company' }}</strong>
                </div>
                <div class="lane-builder__summary-card">
                  <p>Shipper</p>
                  <strong>{{ activeLane.shipperName || 'Add shipper' }}</strong>
                </div>
                <div class="lane-builder__summary-card">
                  <p>Origin</p>
                  <strong>{{ activeLane.originCity || 'Add origin' }}</strong>
                </div>
                <div class="lane-builder__summary-card">
                  <p>Destination</p>
                  <strong>{{ activeLane.destinationCity || 'Add destination' }}</strong>
                </div>
              </div>
            </article>

            <article class="lane-builder__workspace-card">
              <p class="section-heading__eyebrow">Readiness</p>
              <h4>Fields that unlock the next step</h4>

              <ul class="lane-builder__checklist">
                <li v-for="item in partiesChecklist" :key="item.label" :class="{ 'lane-builder__checklist-item--complete': item.complete }">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.complete ? 'Ready' : 'Missing' }}</strong>
                </li>
              </ul>
            </article>
          </template>

          <template v-else-if="activeStep === 'product'">
            <article class="lane-builder__workspace-card">
              <p class="section-heading__eyebrow">Shipment profile</p>
              <h4>What the engine will match against</h4>

              <div class="lane-builder__summary-grid">
                <div class="lane-builder__summary-card">
                  <p>Product</p>
                  <strong>{{ activeLane.productName || 'Add product' }}</strong>
                </div>
                <div class="lane-builder__summary-card">
                  <p>Type</p>
                  <strong>{{ activeLane.productType || 'Add type' }}</strong>
                </div>
                <div class="lane-builder__summary-card">
                  <p>Temperature</p>
                  <strong>{{ activeLane.requiredTempRange || 'Add range' }}</strong>
                </div>
                <div class="lane-builder__summary-card">
                  <p>Packaging</p>
                  <strong>{{ activeLane.packageType || 'Add packaging' }}</strong>
                </div>
                <div class="lane-builder__summary-card">
                  <p>Weight</p>
                  <strong>{{ activeLane.weight || 'Add weight' }}</strong>
                </div>
                <div class="lane-builder__summary-card">
                  <p>Quantity</p>
                  <strong>{{ activeLane.quantity || 'Add quantity' }}</strong>
                </div>
              </div>

              <div class="tag-list">
                <span v-for="item in activeLane.specialHandling" :key="item" class="tag-chip">
                  {{ item }}
                </span>
                <span v-if="!activeLane.specialHandling.length" class="tag-chip">No special handling yet</span>
              </div>
            </article>

            <article class="lane-builder__workspace-card lane-builder__workspace-card--accent">
              <p class="section-heading__eyebrow">Suggestion logic</p>
              <h4>More detail, fewer and stronger route options</h4>
              <p class="panel-card__copy">
                As this product profile becomes more precise, the next step narrows down toward the best-suited lane suggestions.
              </p>

              <div class="lane-builder__summary-grid">
                <div class="lane-builder__summary-card">
                  <p>Completed fields</p>
                  <strong>{{ laneInputScore }}</strong>
                </div>
                <div class="lane-builder__summary-card">
                  <p>Route step</p>
                  <strong>{{ stepCompletion.product ? 'Unlocked' : 'Waiting' }}</strong>
                </div>
              </div>
            </article>
          </template>

          <template v-else-if="activeStep === 'routes'">
            <article v-if="!showAdvancedEditor" class="lane-builder__workspace-card lane-builder__workspace-card--flush">
              <div class="lane-builder__results-header">
                <div>
                  <p class="section-heading__eyebrow">Suggested routes</p>
                  <h4>Live route options</h4>
                </div>
                <StatusPill :label="`${suggestedRoutes.length} option(s)`" :tone="suggestedRoutes.length <= 2 ? 'validated' : 'brand'" />
              </div>

              <div class="lane-suggestion-grid">
                <article v-for="suggestion in suggestedRoutes" :key="suggestion.id" class="lane-suggestion-card">
                  <div class="lane-suggestion-card__header">
                    <div>
                      <p class="section-heading__eyebrow">Suggested route</p>
                      <h4>{{ suggestion.title }}</h4>
                    </div>
                    <StatusPill :label="suggestion.risk" :tone="riskToTone(suggestion.risk)" />
                  </div>

                  <p class="lane-suggestion-card__summary">{{ suggestion.summary }}</p>
                  <p class="lane-suggestion-card__meta">{{ suggestion.eta }}</p>
                  <p class="lane-suggestion-card__note">{{ suggestion.rationale }}</p>

                  <div class="tag-list">
                    <span v-for="tag in suggestion.tags" :key="tag" class="tag-chip">
                      {{ tag }}
                    </span>
                  </div>

                  <div class="lane-suggestion-card__route">
                    <span
                      v-for="(node, index) in suggestion.nodes"
                      :key="`${suggestion.id}-${node.city}-${index}`"
                      class="lane-suggestion-card__route-stop"
                    >
                      <strong>{{ node.city }}</strong>
                      <span>{{ node.locationName }}</span>
                      <span v-if="index < suggestion.nodes.length - 1" class="lane-suggestion-card__route-mode">
                        {{ node.nextMode }}
                      </span>
                    </span>
                  </div>

                  <button
                    v-if="authStore.canEditRoutes"
                    type="button"
                    class="button button--secondary"
                    @click="applySuggestedRoute(suggestion)"
                  >
                    Use as base lane
                  </button>
                </article>
              </div>
            </article>

            <article v-else class="lane-builder__workspace-card lane-builder__workspace-card--flush">
              <div class="lane-builder__results-header">
                <div>
                  <p class="section-heading__eyebrow">Custom route builder</p>
                  <h4>Build your own lane</h4>
                </div>
                <button type="button" class="button button--ghost" @click="showAdvancedEditor = false">
                  Back to suggestions
                </button>
              </div>

              <div class="lane-builder__editor-stage">
                <ShipmentEditorDrawer
                  :open="showAdvancedEditor"
                  :shipment="activeLane"
                  @close="showAdvancedEditor = false"
                  @save="handleRouteEditorSave"
                />
              </div>
            </article>
          </template>

          <template v-else>
            <article class="lane-builder__workspace-card">
              <p class="section-heading__eyebrow">Report status</p>
              <h4>Lifecycle</h4>

              <div class="lane-report-timeline">
                <article class="lane-report-stage" :class="{ 'lane-report-stage--complete': true }">
                  <p class="section-heading__eyebrow">Draft</p>
                  <strong>{{ formatDateTime(activeLane.updatedAt) }}</strong>
                </article>
                <article
                  class="lane-report-stage"
                  :class="{ 'lane-report-stage--complete': Boolean(activeLane.reportGeneratedAt), 'lane-report-stage--active': activeLane.reportStatus === 'Pending' }"
                >
                  <p class="section-heading__eyebrow">Pending</p>
                  <strong>{{ activeLane.reportGeneratedAt ? formatDateTime(activeLane.reportGeneratedAt) : 'Waiting' }}</strong>
                </article>
                <article
                  class="lane-report-stage"
                  :class="{ 'lane-report-stage--complete': Boolean(activeLane.reportLiveAt), 'lane-report-stage--active': activeLane.reportStatus === 'Live' }"
                >
                  <p class="section-heading__eyebrow">Live</p>
                  <strong>{{ activeLane.reportLiveAt ? formatDateTime(activeLane.reportLiveAt) : 'Waiting' }}</strong>
                </article>
              </div>
            </article>

            <article class="lane-builder__workspace-card">
              <p class="section-heading__eyebrow">Tracking snapshot</p>
              <h4>Live lane monitoring</h4>

              <div class="detail-grid">
                <div class="detail-card">
                  <p>Progress</p>
                  <strong>{{ activeLane.progress }}%</strong>
                </div>
                <div class="detail-card">
                  <p>Tracked lanes</p>
                  <strong>{{ companyLaneCount }}</strong>
                </div>
                <div class="detail-card">
                  <p>Active alerts</p>
                  <strong>{{ activeAlerts.length }}</strong>
                </div>
                <div class="detail-card">
                  <p>Validated nodes</p>
                  <strong>{{ validatedNodes }}/{{ activeLane.routeNodes.length }}</strong>
                </div>
              </div>

              <details class="lane-monitor-card lane-monitor-card--embedded">
                <summary>Open tracking and compliance</summary>

                <div v-if="selectedNode" class="detail-grid">
                  <div class="detail-card">
                    <p>Selected checkpoint</p>
                    <strong>{{ selectedNode.locationName || 'Checkpoint' }}</strong>
                  </div>
                  <div class="detail-card">
                    <p>Validation</p>
                    <strong>{{ selectedNode.validationStatus }}</strong>
                  </div>
                  <div class="detail-card">
                    <p>ETA</p>
                    <strong>{{ selectedNode.eta || 'Waiting' }}</strong>
                  </div>
                  <div class="detail-card">
                    <p>Temperature</p>
                    <strong>{{ selectedNode.actualTemp || 'Waiting' }}</strong>
                  </div>
                </div>

                <div v-if="activeAlerts.length" class="stack-list stack-list--compact">
                  <article v-for="alert in activeAlerts" :key="alert.id" class="stack-item">
                    <div class="stack-item__row">
                      <strong>{{ alert.title }}</strong>
                      <StatusPill :label="alert.severity" :tone="riskToTone(alert.severity)" />
                    </div>
                    <p>{{ alert.category }} / {{ formatDateTime(alert.timestamp) }}</p>
                    <p>{{ alert.description }}</p>
                  </article>
                </div>

                <div class="detail-grid">
                  <div class="detail-card">
                    <p>Certificates at risk</p>
                    <strong>{{ pendingCertificates }}</strong>
                  </div>
                  <div class="detail-card">
                    <p>Recipients</p>
                    <strong>{{ activeLane.reportRecipients.length }}</strong>
                  </div>
                </div>

                <div class="stack-list stack-list--compact">
                  <article v-for="certificate in activeLane.certifications" :key="certificate.id" class="stack-item">
                    <div class="stack-item__row">
                      <strong>{{ certificate.name }}</strong>
                      <StatusPill :label="certificate.status" :tone="certificateTone(certificate.status)" />
                    </div>
                    <p>{{ certificate.issuer }} / {{ certificate.scope }}</p>
                    <p>Valid until {{ formatDate(certificate.validUntil) }}</p>
                  </article>
                </div>
              </details>
            </article>
          </template>
        </aside>
      </div>

      <div class="lane-builder__footer">
        <div class="lane-builder__footer-nav">
          <button type="button" class="button button--ghost" :disabled="activeStep === 'parties'" @click="goToPreviousStep">
            Previous step
          </button>
          <button
            type="button"
            class="button button--secondary"
            :disabled="activeStep === 'report' || !isStepUnlocked(stepOrder[stepOrder.indexOf(activeStep) + 1] ?? 'report')"
            @click="goToNextStep"
          >
            Next step
          </button>
        </div>

        <div class="lane-builder__footer-actions">
          <button
            v-if="authStore.canEditRoutes && hasUnsavedLaneChanges"
            type="button"
            class="button button--ghost"
            @click="resetLaneDraft"
          >
            Reset changes
          </button>
          <button
            v-if="authStore.canEditRoutes && hasUnsavedLaneChanges"
            type="button"
            class="button"
            @click="saveLaneProfile"
          >
            Save current step
          </button>
        </div>
      </div>
    </section>
  </div>

  <div v-else class="empty-state empty-state--page">
    <h2>Lane unavailable</h2>
    <p>{{ loadError ?? 'The selected lane is unavailable.' }}</p>
    <RouterLink :to="{ name: 'shipments' }" class="button">Back to lanes</RouterLink>
  </div>
</template>
