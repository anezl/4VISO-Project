import { createPinia, setActivePinia } from 'pinia'

import { resetDatabase } from '@/services/storage'
import { useAuthStore } from '@/stores/auth'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetDatabase()
  })

  it('enables editing for logistics providers', async () => {
    const authStore = useAuthStore()

    await authStore.login({
      email: 'coordinator@skylink-logistics.com',
      password: 'demo123',
    })

    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.canEditRoutes).toBe(true)
    expect(authStore.isAdmin).toBe(false)
  })

  it('keeps ordinary users in read-only mode', async () => {
    const authStore = useAuthStore()

    await authStore.login({
      email: 'viewer@northpharma.com',
      password: 'demo123',
    })

    expect(authStore.canEditRoutes).toBe(false)
    expect(authStore.canApproveCompliance).toBe(false)
  })
})
