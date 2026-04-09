import { defineStore } from 'pinia'

import { mockApi } from '@/services/mockApi'
import { readSessionUserId } from '@/services/storage'
import {
  canAccessAdmin,
  canApprove,
  canEditRoutes,
  type LoginPayload,
  type RegistrationPayload,
  type User,
} from '@/types/domain'

interface AuthState {
  currentUser: User | null
  isReady: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    currentUser: null,
    isReady: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.currentUser),
    canEditRoutes: (state) => canEditRoutes(state.currentUser?.role),
    canApproveCompliance: (state) => canApprove(state.currentUser?.role),
    isAdmin: (state) => canAccessAdmin(state.currentUser?.role),
  },
  actions: {
    async initializeSession() {
      if (this.isReady) {
        return
      }

      const userId = readSessionUserId()

      if (!userId) {
        this.currentUser = null
        this.isReady = true
        return
      }

      this.currentUser = await mockApi.findUserById(userId)
      this.isReady = true
    },

    async login(payload: LoginPayload) {
      this.currentUser = await mockApi.login(payload)
      return this.currentUser
    },

    async logout() {
      await mockApi.logout()
      this.currentUser = null
    },

    async register(payload: RegistrationPayload) {
      return mockApi.registerUser(payload)
    },
  },
})
