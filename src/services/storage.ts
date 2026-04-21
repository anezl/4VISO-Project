import { createSeedDatabase } from '@/mocks/seed'
import type { AppDatabase, RouteNode, Shipment } from '@/types/domain'

const DB_KEY = '4viso.mock.db'
const SESSION_KEY = '4viso.session.userId'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function ensureStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : fallback
}

function ensureString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function normalizeRouteNode(node: RouteNode, seededNode?: RouteNode): RouteNode {
  const fallbackCapabilities = seededNode?.operationalCapabilities ?? ['Staging']
  const fallbackHandling = seededNode?.handlingCapabilities ?? ['Perishable goods']
  const fallbackMonitoring = seededNode?.monitoringSystems ?? ['Track & Trace']

  return {
    ...seededNode,
    ...node,
    securityLevel: node.securityLevel ?? seededNode?.securityLevel ?? 'Standard',
    storageCapability: node.storageCapability ?? seededNode?.storageCapability ?? 'General storage area',
    dwellTime: node.dwellTime ?? seededNode?.dwellTime ?? 'TBD',
    operationalCapabilities: ensureStringArray(
      node.operationalCapabilities,
      fallbackCapabilities,
    ),
    handlingCapabilities: ensureStringArray(node.handlingCapabilities, fallbackHandling),
    monitoringSystems: ensureStringArray(node.monitoringSystems, fallbackMonitoring),
    validatorName: node.validatorName ?? seededNode?.validatorName ?? 'Pending assignment',
    validatedAt: node.validatedAt ?? seededNode?.validatedAt ?? 'Awaiting approval',
    nodeNotes: node.nodeNotes ?? seededNode?.nodeNotes ?? 'No additional node notes recorded.',
    certifications: ensureStringArray(node.certifications, seededNode?.certifications ?? []),
  }
}

function normalizeShipment(shipment: Shipment, seededShipment?: Shipment): Shipment {
  const seededNodesById = new Map(
    (seededShipment?.routeNodes ?? []).map((node) => [node.id, node]),
  )
  const fallbackNodes = seededShipment?.routeNodes ?? []
  const fallbackAlerts = seededShipment?.alerts ?? []
  const fallbackIncidents = seededShipment?.incidents ?? []
  const fallbackCertifications = seededShipment?.certifications ?? []
  const routeNodes = Array.isArray(shipment.routeNodes) ? shipment.routeNodes : fallbackNodes

  return {
    ...seededShipment,
    ...shipment,
    shipperName: ensureString(shipment.shipperName, seededShipment?.shipperName ?? shipment.ownerCompany),
    originFacility: ensureString(shipment.originFacility, seededShipment?.originFacility ?? 'Origin facility'),
    receiverName: ensureString(shipment.receiverName, seededShipment?.receiverName ?? shipment.consignee),
    destinationFacility: ensureString(
      shipment.destinationFacility,
      seededShipment?.destinationFacility ?? 'Destination facility',
    ),
    productType: ensureString(shipment.productType, seededShipment?.productType ?? 'Pharma'),
    packagingDetails: ensureString(
      shipment.packagingDetails,
      seededShipment?.packagingDetails ?? seededShipment?.packageType ?? 'Validated shipper',
    ),
    dimensions: ensureString(shipment.dimensions, seededShipment?.dimensions ?? 'TBD'),
    quantity: ensureString(shipment.quantity, seededShipment?.quantity ?? 'TBD'),
    weight: ensureString(shipment.weight, seededShipment?.weight ?? 'TBD'),
    specialHandling: ensureStringArray(
      shipment.specialHandling,
      seededShipment?.specialHandling ?? [],
    ),
    reportStatus: shipment.reportStatus ?? seededShipment?.reportStatus ?? 'Draft',
    reportRecipients: ensureStringArray(
      shipment.reportRecipients,
      seededShipment?.reportRecipients ?? [],
    ),
    reportGeneratedAt:
      typeof shipment.reportGeneratedAt === 'string' || shipment.reportGeneratedAt === null
        ? shipment.reportGeneratedAt
        : (seededShipment?.reportGeneratedAt ?? null),
    reportSentAt:
      typeof shipment.reportSentAt === 'string' || shipment.reportSentAt === null
        ? shipment.reportSentAt
        : (seededShipment?.reportSentAt ?? null),
    reportLiveAt:
      typeof shipment.reportLiveAt === 'string' || shipment.reportLiveAt === null
        ? shipment.reportLiveAt
        : (seededShipment?.reportLiveAt ?? null),
    routeNodes: routeNodes.map((node) =>
      normalizeRouteNode(node, seededNodesById.get(node.id)),
    ),
    alerts: Array.isArray(shipment.alerts) ? shipment.alerts : fallbackAlerts,
    incidents: Array.isArray(shipment.incidents) ? shipment.incidents : fallbackIncidents,
    certifications: Array.isArray(shipment.certifications)
      ? shipment.certifications
      : fallbackCertifications,
  }
}

function normalizeDatabase(database: AppDatabase): AppDatabase {
  const seeded = createSeedDatabase()
  const seededShipmentsById = new Map(seeded.shipments.map((shipment) => [shipment.id, shipment]))

  return {
    users: Array.isArray(database.users) ? database.users : seeded.users,
    notifications: Array.isArray(database.notifications) ? database.notifications : seeded.notifications,
    shipments: Array.isArray(database.shipments)
      ? database.shipments.map((shipment) =>
          normalizeShipment(shipment, seededShipmentsById.get(shipment.id)),
        )
      : seeded.shipments,
  }
}

export function readDatabase(): AppDatabase {
  const raw = globalThis.localStorage?.getItem(DB_KEY)

  if (!raw) {
    const seeded = createSeedDatabase()
    writeDatabase(seeded)
    return clone(seeded)
  }

  try {
    const parsed = JSON.parse(raw) as AppDatabase
    const normalized = normalizeDatabase(parsed)
    writeDatabase(normalized)
    return clone(normalized)
  } catch (error) {
    console.warn('Failed to parse local database, reseeding mock data.', error)
    const seeded = createSeedDatabase()
    writeDatabase(seeded)
    return clone(seeded)
  }
}

export function writeDatabase(database: AppDatabase) {
  globalThis.localStorage?.setItem(DB_KEY, JSON.stringify(database))
}

export function resetDatabase() {
  const seeded = createSeedDatabase()
  writeDatabase(seeded)
  clearSessionUserId()
  return seeded
}

export function readSessionUserId() {
  return globalThis.localStorage?.getItem(SESSION_KEY) ?? null
}

export function writeSessionUserId(userId: string) {
  globalThis.localStorage?.setItem(SESSION_KEY, userId)
}

export function clearSessionUserId() {
  globalThis.localStorage?.removeItem(SESSION_KEY)
}
