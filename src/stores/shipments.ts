import { defineStore } from 'pinia'

import { mockApi } from '@/services/mockApi'
import type { CreateShipmentPayload, Shipment } from '@/types/domain'

interface ShipmentsState {
  shipments: Shipment[]
  activeShipmentId: string | null
  isLoaded: boolean
}

export const useShipmentsStore = defineStore('shipments', {
  state: (): ShipmentsState => ({
    shipments: [],
    activeShipmentId: null,
    isLoaded: false,
  }),
  getters: {
    activeShipment(state) {
      return state.shipments.find((shipment) => shipment.id === state.activeShipmentId) ?? null
    },
    allCertificates(state) {
      return state.shipments.flatMap((shipment) => shipment.certifications)
    },
  },
  actions: {
    async loadShipments(force = false) {
      if (this.isLoaded && !force) {
        return
      }

      this.shipments = await mockApi.listShipments()
      this.isLoaded = true
    },

    async loadShipmentById(shipmentId: string) {
      if (!this.isLoaded) {
        await this.loadShipments()
      }

      const existing = this.shipments.find((shipment) => shipment.id === shipmentId)

      if (existing) {
        this.activeShipmentId = existing.id
        return existing
      }

      const shipment = await mockApi.getShipmentById(shipmentId)

      if (shipment) {
        this.shipments.unshift(shipment)
        this.activeShipmentId = shipment.id
      }

      return shipment
    },

    setActiveShipment(shipmentId: string) {
      this.activeShipmentId = shipmentId
    },

    async createShipment(payload: CreateShipmentPayload) {
      const shipment = await mockApi.createShipment(payload)
      this.shipments.unshift(shipment)
      this.activeShipmentId = shipment.id
      return shipment
    },

    async updateShipment(shipment: Shipment) {
      const updatedShipment = await mockApi.updateShipment(shipment)
      const shipmentIndex = this.shipments.findIndex((candidate) => candidate.id === shipment.id)

      if (shipmentIndex === -1) {
        this.shipments.unshift(updatedShipment)
      } else {
        this.shipments[shipmentIndex] = updatedShipment
      }

      this.activeShipmentId = updatedShipment.id
      return updatedShipment
    },
  },
})
