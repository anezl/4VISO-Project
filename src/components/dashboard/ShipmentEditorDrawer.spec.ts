import { reactive } from 'vue'
import { mount } from '@vue/test-utils'

import ShipmentEditorDrawer from '@/components/dashboard/ShipmentEditorDrawer.vue'
import { createSeedDatabase } from '@/mocks/seed'

describe('ShipmentEditorDrawer', () => {
  it('opens with a reactive shipment prop without throwing clone errors', () => {
    const shipment = reactive(createSeedDatabase().shipments[0]!)

    const wrapper = mount(ShipmentEditorDrawer, {
      props: {
        open: true,
        shipment,
      },
    })

    expect(wrapper.text()).toContain('Edit lane configuration')
    expect(wrapper.text()).toContain('Brussels -> London -> Washington')
    expect(wrapper.find('.editor-drawer').exists()).toBe(true)
  })
})
