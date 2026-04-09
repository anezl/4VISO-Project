import { createSeedDatabase } from '@/mocks/seed'
import { mockApi } from '@/services/mockApi'
import { readDatabase, resetDatabase } from '@/services/storage'

describe('mockApi', () => {
  beforeEach(() => {
    resetDatabase()
  })

  it('logs in demo users and restores seeded data', async () => {
    const user = await mockApi.login({
      email: 'admin@4viso.com',
      password: 'demo123',
    })

    expect(user.email).toBe('admin@4viso.com')
    expect(user.role).toBe('admin')
    expect(readDatabase().shipments).toHaveLength(createSeedDatabase().shipments.length)
  })

  it('registers, verifies, and creates a new shipment', async () => {
    const createdUser = await mockApi.registerUser({
      role: 'logistics_provider',
      fullName: 'New Operator',
      email: 'new.operator@example.com',
      password: 'demo123',
      companyName: 'Fresh Chain',
      country: 'Belgium',
      phone: '+32 123',
    })

    expect(createdUser.emailVerified).toBe(false)

    const verifiedUser = await mockApi.verifyUserEmail(createdUser.email)
    expect(verifiedUser.emailVerified).toBe(true)

    const shipment = await mockApi.createShipment({
      ownerCompany: 'Fresh Chain',
      createdBy: createdUser.email,
    })

    const persisted = await mockApi.getShipmentById(shipment.id)
    expect(persisted?.title).toContain('Fresh Chain')
    expect(readDatabase().notifications[0]?.shipmentId).toBe(shipment.id)
  })
})
