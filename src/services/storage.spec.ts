import { readDatabase, writeDatabase, resetDatabase } from '@/services/storage'

describe('storage migrations', () => {
  beforeEach(() => {
    resetDatabase()
  })

  it('hydrates older route nodes with the new node-level fields', () => {
    const database = readDatabase()
    const shipment = database.shipments[0]
    const firstNode = shipment.routeNodes[0]

    writeDatabase({
      ...database,
      shipments: [
        {
          ...shipment,
          routeNodes: [
            {
              id: firstNode.id,
              city: firstNode.city,
              country: firstNode.country,
              locationName: firstNode.locationName,
              locationType: firstNode.locationType,
              transportMode: firstNode.transportMode,
              eta: firstNode.eta,
              tempRange: firstNode.tempRange,
              actualTemp: firstNode.actualTemp,
              riskScore: firstNode.riskScore,
              certifications: firstNode.certifications,
              validationStatus: firstNode.validationStatus,
            } as typeof firstNode,
          ],
        },
      ],
    })

    const migrated = readDatabase()
    const migratedNode = migrated.shipments[0]?.routeNodes[0]

    expect(migratedNode?.securityLevel).toBeTruthy()
    expect(migratedNode?.validatorName).toBeTruthy()
    expect(migratedNode?.operationalCapabilities.length).toBeGreaterThan(0)
    expect(migratedNode?.monitoringSystems.length).toBeGreaterThan(0)
  })

  it('restores top-level shipment collections required by the dashboard', () => {
    const database = readDatabase()
    const shipment = database.shipments[0]

    writeDatabase({
      ...database,
      shipments: [
        {
          ...shipment,
          alerts: undefined as never,
          incidents: undefined as never,
          certifications: undefined as never,
        },
      ],
    })

    const migrated = readDatabase()
    const migratedShipment = migrated.shipments[0]

    expect(Array.isArray(migratedShipment?.alerts)).toBe(true)
    expect(Array.isArray(migratedShipment?.incidents)).toBe(true)
    expect(Array.isArray(migratedShipment?.certifications)).toBe(true)
  })

  it('hydrates newer lane planning fields from seed data when older records are missing them', () => {
    const database = readDatabase()
    const shipment = database.shipments[0]

    writeDatabase({
      ...database,
      shipments: [
        {
          ...shipment,
          shipperName: undefined as never,
          originFacility: undefined as never,
          receiverName: undefined as never,
          destinationFacility: undefined as never,
          productType: undefined as never,
          packagingDetails: undefined as never,
          dimensions: undefined as never,
          quantity: undefined as never,
          weight: undefined as never,
          specialHandling: undefined as never,
          reportStatus: undefined as never,
          reportRecipients: undefined as never,
        },
      ],
    })

    const migrated = readDatabase()
    const migratedShipment = migrated.shipments[0]

    expect(migratedShipment?.shipperName).toBeTruthy()
    expect(migratedShipment?.originFacility).toBeTruthy()
    expect(migratedShipment?.productType).toBeTruthy()
    expect(Array.isArray(migratedShipment?.specialHandling)).toBe(true)
    expect(migratedShipment?.reportStatus).toBeTruthy()
    expect(Array.isArray(migratedShipment?.reportRecipients)).toBe(true)
  })
})
