import { defineStore } from 'pinia'

import { mockApi } from '@/services/mockApi'
import type { NotificationItem, User } from '@/types/domain'

interface WorkspaceState {
  notifications: NotificationItem[]
  users: User[]
  isLoaded: boolean
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceState => ({
    notifications: [],
    users: [],
    isLoaded: false,
  }),
  getters: {
    unreadNotifications: (state) => state.notifications.filter((notification) => !notification.read),
  },
  actions: {
    async loadWorkspace(force = false) {
      if (this.isLoaded && !force) {
        return
      }

      const [notifications, users] = await Promise.all([
        mockApi.listNotifications(),
        mockApi.listUsers(),
      ])

      this.notifications = notifications
      this.users = users
      this.isLoaded = true
    },

    async markNotificationRead(notificationId: string) {
      const updated = await mockApi.markNotificationRead(notificationId)
      const notificationIndex = this.notifications.findIndex(
        (notification) => notification.id === notificationId,
      )

      if (notificationIndex !== -1) {
        this.notifications[notificationIndex] = updated
      }

      return updated
    },
  },
})
