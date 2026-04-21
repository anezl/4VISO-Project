import { createDraftShipment } from '@/mocks/seed'
import {
  clearSessionUserId,
  readDatabase,
  writeDatabase,
  writeSessionUserId,
} from '@/services/storage'
import type {
  CreateShipmentPayload,
  LoginPayload,
  NotificationItem,
  RegistrationPayload,
  Shipment,
  User,
  UserRecord,
  Lane,
  Requirement,
} from '@/types/domain'

function generateId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${random}`
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function sanitizeUser(user: UserRecord): User {
  const { password, ...safeUser } = user
  return safeUser
}

function getUserById(userId: string) {
  return readDatabase().users.find((user) => user.id === userId) ?? null
}

export const mockApi = {
  async login(payload: LoginPayload) {
    const database = readDatabase()
    const email = normalizeEmail(payload.email)
    const user = database.users.find((candidate) => candidate.email === email)

    if (!user || user.password !== payload.password) {
      throw new Error('Invalid email or password.')
    }

    if (!user.emailVerified) {
      throw new Error('Please verify your email before signing in.')
    }

    writeSessionUserId(user.id)
    return sanitizeUser(user)
  },

  async logout() {
    clearSessionUserId()
  },

  async registerUser(payload: RegistrationPayload) {
    const database = readDatabase()
    const email = normalizeEmail(payload.email)
    const existingUser = database.users.find((candidate) => candidate.email === email)

    if (existingUser) {
      throw new Error('An account with this email already exists.')
    }

    const user: UserRecord = {
      id: generateId('user'),
      role: payload.role,
      fullName: payload.fullName.trim(),
      email,
      password: payload.password,
      companyName: payload.companyName?.trim() || undefined,
      country: payload.country?.trim() || undefined,
      phone: payload.phone?.trim() || undefined,
      emailVerified: false,
    }

    database.users.unshift(user)
    writeDatabase(database)

    return sanitizeUser(user)
  },

  async verifyUserEmail(email: string) {
    const database = readDatabase()
    const user = database.users.find((candidate) => candidate.email === normalizeEmail(email))

    if (!user) {
      throw new Error('User not found for email verification.')
    }

    user.emailVerified = true
    writeDatabase(database)
    return sanitizeUser(user)
  },

  async requestPasswordReset(email: string) {
    const database = readDatabase()
    const userExists = database.users.some(
      (candidate) => candidate.email === normalizeEmail(email),
    )

    return {
      accepted: true,
      userExists,
      message: 'If an account exists, a reset link has been queued.',
    }
  },

  async findUserById(userId: string) {
    const user = getUserById(userId)
    return user ? sanitizeUser(user) : null
  },

  async listUsers() {
    return readDatabase().users.map((user) => sanitizeUser(user))
  },

  async listShipments() {
    return readDatabase().shipments.sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    )
  },

  async getShipmentById(shipmentId: string) {
    return readDatabase().shipments.find((shipment) => shipment.id === shipmentId) ?? null
  },

  async createShipment(payload: CreateShipmentPayload) {
    const database = readDatabase()
    const shipment = createDraftShipment(payload)

    database.shipments.unshift(shipment)
    database.notifications.unshift({
      id: generateId('notification'),
      shipmentId: shipment.id,
      title: 'New lane draft created',
      message: `${shipment.title} is ready for route configuration.`,
      severity: 'Low',
      timestamp: new Date().toISOString(),
      read: false,
    })

    writeDatabase(database)

    return shipment
  },

  async updateShipment(updatedShipment: Shipment) {
    const database = readDatabase()
    const shipmentIndex = database.shipments.findIndex(
      (shipment) => shipment.id === updatedShipment.id,
    )

    if (shipmentIndex === -1) {
      throw new Error('Shipment not found.')
    }

    const nextShipment: Shipment = {
      ...updatedShipment,
      updatedAt: new Date().toISOString(),
    }

    database.shipments[shipmentIndex] = nextShipment
    writeDatabase(database)

    return nextShipment
  },

  async listNotifications() {
    return readDatabase().notifications.sort((left, right) =>
      right.timestamp.localeCompare(left.timestamp),
    )
  },

  async markNotificationRead(notificationId: string) {
    const database = readDatabase()
    const notification = database.notifications.find((candidate) => candidate.id === notificationId)

    if (!notification) {
      throw new Error('Notification not found.')
    }

    notification.read = true
    writeDatabase(database)
    return notification
  },

  async createNotification(notification: NotificationItem) {
    const database = readDatabase()
    database.notifications.unshift(notification)
    writeDatabase(database)
    return notification
  },

  async getLanes() {
    return readDatabase().lanes
  },

  async getRequirements() {
    return readDatabase().requirements
  },

  async getLaneById(laneId: string) {
    const database = readDatabase()
    return database.lanes.find((lane) => lane.id === laneId) ?? null
  },

  async updateLane(updatedLane: Lane) {
    const database = readDatabase()
    const laneIndex = database.lanes.findIndex((lane) => lane.id === updatedLane.id)

    if (laneIndex === -1) {
      throw new Error('Lane not found.')
    }

    const nextLane: Lane = {
      ...updatedLane,
      updatedAt: new Date().toISOString(),
    }

    database.lanes[laneIndex] = nextLane
    writeDatabase(database)

    return nextLane
  },

  async createLane(lane: Lane) {
    const database = readDatabase()
    database.lanes.push(lane)
    writeDatabase(database)
    return lane
  }
}
