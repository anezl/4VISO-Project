import { mount, RouterLinkStub } from '@vue/test-utils'

import { createSeedDatabase } from '@/mocks/seed'
import ShipmentCard from '@/components/shipments/ShipmentCard.vue'

describe('ShipmentCard', () => {
  it('opens the lane workspace in edit mode for editable roles', () => {
    const shipment = createSeedDatabase().shipments[0]

    const wrapper = mount(ShipmentCard, {
      props: {
        shipment,
        canEdit: true,
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    })

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({
      name: 'lane',
      params: { shipmentId: shipment.id },
      query: { edit: '1' },
    })
  })

  it('opens the read-only lane workspace for non-editable roles', () => {
    const shipment = createSeedDatabase().shipments[0]

    const wrapper = mount(ShipmentCard, {
      props: {
        shipment,
        canEdit: false,
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    })

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({
      name: 'lane',
      params: { shipmentId: shipment.id },
      query: undefined,
    })
  })
})
