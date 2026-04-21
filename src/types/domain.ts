export type UserRole =
  | 'ordinary_user'
  | 'pharma_company'
  | 'logistics_provider'
  | 'auditor_qa'
  | 'admin'

export type ShipmentStatus = 'In Transit' | 'Scheduled' | 'Delayed' | 'Delivered'
export type TransportMode = 'Road' | 'Air' | 'Sea'
export type LocationType = 'Warehouse' | 'Airport' | 'Hub' | 'Distribution Center' | 'Port'
export type ValidationStatus = 'Validated' | 'Pending' | 'Rejected'
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type NotificationSeverity = RiskLevel
export type CertificationStatus = 'Valid' | 'Expiring Soon' | 'Expired'
export type SecurityLevel = 'Standard' | 'Enhanced' | 'High Security'
export type ReportStatus = 'Draft' | 'Pending' | 'Live'

export interface User {
  id: string
  role: UserRole
  fullName: string
  email: string
  companyName?: string
  country?: string
  phone?: string
  emailVerified: boolean
}

export interface UserRecord extends User {
  password: string
}

export interface RegistrationPayload {
  role: UserRole
  fullName: string
  email: string
  password: string
  companyName?: string
  country?: string
  phone?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RouteNode {
  id: string
  city: string
  country: string
  locationName: string
  locationType: LocationType
  transportMode: TransportMode
  eta: string
  tempRange: string
  actualTemp: string
  securityLevel: SecurityLevel
  storageCapability: string
  dwellTime: string
  operationalCapabilities: string[]
  handlingCapabilities: string[]
  monitoringSystems: string[]
  validatorName: string
  validatedAt: string
  nodeNotes: string
  riskScore: RiskLevel
  certifications: string[]
  validationStatus: ValidationStatus
}

export interface AlertItem {
  id: string
  shipmentId: string
  nodeId?: string
  category: 'Temperature' | 'Traffic' | 'Strike' | 'Weather' | 'Compliance'
  title: string
  description: string
  severity: NotificationSeverity
  timestamp: string
  isActive: boolean
}

export interface IncidentItem {
  id: string
  shipmentId: string
  title: string
  description: string
  severity: NotificationSeverity
  timestamp: string
}

export interface CertificationRecord {
  id: string
  shipmentId: string
  nodeId?: string
  name: string
  issuer: string
  scope: string
  validUntil: string
  status: CertificationStatus
}

export interface Shipment {
  id: string
  reference: string
  title: string
  ownerCompany: string
  shipperName: string
  originFacility: string
  consignee: string
  receiverName: string
  destinationFacility: string
  productName: string
  productType: string
  packageType: string
  packagingDetails: string
  dimensions: string
  quantity: string
  weight: string
  specialHandling: string[]
  status: ShipmentStatus
  reportStatus: ReportStatus
  overallRisk: RiskLevel
  progress: number
  originCity: string
  destinationCity: string
  requiredTempRange: string
  actualAverageTemp: string
  reportRecipients: string[]
  reportGeneratedAt: string | null
  reportSentAt: string | null
  reportLiveAt: string | null
  updatedAt: string
  routeNodes: RouteNode[]
  alerts: AlertItem[]
  incidents: IncidentItem[]
  certifications: CertificationRecord[]
}

export interface NotificationItem {
  id: string
  shipmentId?: string
  title: string
  message: string
  severity: NotificationSeverity
  timestamp: string
  read: boolean
}

export interface AppDatabase {
  users: UserRecord[]
  shipments: Shipment[]
  notifications: NotificationItem[]
  lanes: Lane[]
  requirements: Requirement[]
}

export interface Requirement {
  id: string
  productType: string
  tempRangeMin: number
  tempRangeMax: number
  requiredCertifications: string[]
  requiredCapabilities: string[]
  securityLevelRequired: SecurityLevel
  estimatedDurationHours: number
}

export interface TransportationSegment {
  id: string
  fromNodeId: string
  toNodeId: string
  transportMode: TransportMode
  estimatedDurationHours: number
  logisticsCompanyName: string
  logisticsCompanyId: string
  alerts: AlertItem[]
}

export interface Lane {
  id: string
  originCity: string
  originCountry: string
  destinationCity: string
  destinationCountry: string
  nodes: RouteNode[]
  transportationSegments: TransportationSegment[]
  overallRisk: RiskLevel
  status: 'Draft' | 'Active' | 'Archived'
  createdBy: string
  createdAt: string
  updatedAt: string
  productType: string
  requiredTempRange: string
}

export interface CreateShipmentPayload {
  ownerCompany: string
  createdBy: string
}

export const roleLabels: Record<UserRole, string> = {
  ordinary_user: 'Ordinary User',
  pharma_company: 'Pharma Company',
  logistics_provider: 'Logistics Provider',
  auditor_qa: 'Auditor / QA',
  admin: 'Admin',
}

export const roleDescriptions: Record<UserRole, string> = {
  ordinary_user: 'Read-only access to lanes, risks, and alerts.',
  pharma_company: 'Visibility into owned shipments and compliance exposure.',
  logistics_provider: 'Operational control over lanes, ETAs, and route updates.',
  auditor_qa: 'Audit visibility across validations, incidents, and certificates.',
  admin: 'Full workspace access including users and validation oversight.',
}

export const editableRoles: UserRole[] = ['logistics_provider', 'admin']
export const approvalRoles: UserRole[] = ['auditor_qa', 'admin']

export function canEditRoutes(role?: UserRole | null) {
  return Boolean(role && editableRoles.includes(role))
}

export function canAccessAdmin(role?: UserRole | null) {
  return role === 'admin'
}

export function canApprove(role?: UserRole | null) {
  return Boolean(role && approvalRoles.includes(role))
}

export function riskToTone(risk: RiskLevel) {
  return risk.toLowerCase() as 'low' | 'medium' | 'high' | 'critical'
}

export function validationToTone(status: ValidationStatus) {
  if (status === 'Validated') {
    return 'validated' as const
  }

  if (status === 'Rejected') {
    return 'rejected' as const
  }

  return 'pending' as const
}

export function roleToTone(role: UserRole) {
  if (role === 'admin') {
    return 'critical' as const
  }

  if (role === 'logistics_provider') {
    return 'brand' as const
  }

  if (role === 'auditor_qa') {
    return 'validated' as const
  }

  return 'muted' as const
}
