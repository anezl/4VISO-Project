import { mount } from '@vue/test-utils'

import { createSeedDatabase } from '@/mocks/seed'
import ShipmentFlow from '@/components/dashboard/ShipmentFlow.vue'

describe('ShipmentFlow', () => {
  it('renders node cities and transport connectors for a lane', () => {
    const shipment = createSeedDatabase().shipments[0]

    const wrapper = mount(ShipmentFlow, {
      props: {
        shipment,
      },
    })

    expect(wrapper.text()).toContain('Brussels')
    expect(wrapper.text()).toContain('London')
    expect(wrapper.text()).toContain('Washington')
    expect(wrapper.text()).toContain('Road')
    expect(wrapper.text()).toContain('Air')
    expect(wrapper.find('[data-testid="connector-0"]').exists()).toBe(true)
  })

  it('emits the selected node when a route card is clicked', async () => {
    const shipment = createSeedDatabase().shipments[0]

    const wrapper = mount(ShipmentFlow, {
      props: {
        shipment,
        selectedNodeId: shipment.routeNodes[0]?.id,
      },
    })

    const nodeCards = wrapper.findAll('.flow-node')
    await nodeCards[1].trigger('click')

    expect(wrapper.emitted('selectNode')?.[0]).toEqual([shipment.routeNodes[1]?.id])
  })
})
