import { createStorageService } from '../data/storageFactory'

export interface AppNotification {
  id: string
  type: 'schedule' | 'habit' | 'review' | 'goal' | 'system'
  title: string
  body: string
  icon?: string
  data?: Record<string, string>
  createdAt: string
  read: boolean
  dismissed: boolean
}

export interface NotificationPreferences {
  browserEnabled: boolean
  scheduleReminders: boolean
  habitReminders: boolean
  reviewReminders: boolean
  goalReminders: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

const notificationStorage = createStorageService<AppNotification[]>('xinghuanhai-notification-state', [])
const prefsStorage = createStorageService<NotificationPreferences>('xinghuanhai-notification-prefs', {
  browserEnabled: false,
  scheduleReminders: true,
  habitReminders: true,
  reviewReminders: true,
  goalReminders: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00'
})

function isInQuietHours(prefs: NotificationPreferences): boolean {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = prefs.quietHoursStart.split(':').map(Number)
  const [eh, em] = prefs.quietHoursEnd.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  }
  return currentMinutes >= startMinutes || currentMinutes < endMinutes
}

export function createNotificationService() {
  const notifications = notificationStorage.load()
  let prefs = prefsStorage.load()
  let listeners: Array<(notifications: AppNotification[]) => void> = []

  const persist = () => notificationStorage.save(notifications.slice(-200) as AppNotification[])
  const persistPrefs = () => prefsStorage.save(prefs)

  const requestBrowserPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false
    if (Notification.permission === 'granted') {
      prefs.browserEnabled = true
      persistPrefs()
      return true
    }
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    const granted = result === 'granted'
    prefs.browserEnabled = granted
    persistPrefs()
    return granted
  }

  const sendBrowserNotification = (notification: AppNotification): void => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!prefs.browserEnabled) return
    if (isInQuietHours(prefs)) return
    new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/favicon.ico',
      tag: notification.type
    })
  }

  const add = (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'dismissed'>): AppNotification => {
    const newNotification: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false,
      dismissed: false
    }
    notifications.unshift(newNotification)
    persist()
    listeners.forEach(fn => fn(notifications))
    sendBrowserNotification(newNotification)
    return newNotification
  }

  const markRead = (id: string): void => {
    const n = notifications.find(x => x.id === id)
    if (n) {
      n.read = true
      persist()
      listeners.forEach(fn => fn(notifications))
    }
  }

  const dismiss = (id: string): void => {
    const n = notifications.find(x => x.id === id)
    if (n) {
      n.dismissed = true
      persist()
      listeners.forEach(fn => fn(notifications))
    }
  }

  const dismissAll = (): void => {
    notifications.forEach(n => { n.dismissed = true })
    persist()
    listeners.forEach(fn => fn(notifications))
  }

  const getUnread = (): AppNotification[] => {
    return notifications.filter(n => !n.read && !n.dismissed)
  }

  const getActive = (): AppNotification[] => {
    return notifications.filter(n => !n.dismissed).slice(0, 50)
  }

  const getAll = (): AppNotification[] => notifications

  const getPrefs = (): NotificationPreferences => prefs

  const updatePrefs = (updates: Partial<NotificationPreferences>): void => {
    prefs = { ...prefs, ...updates }
    persistPrefs()
  }

  const subscribe = (fn: (notifications: AppNotification[]) => void): () => void => {
    listeners.push(fn)
    return () => { listeners = listeners.filter(l => l !== fn) }
  }

  const checkScheduleReminders = (getDueReminders: () => Array<{ id: string; title: string; time: string }>): void => {
    if (!prefs.scheduleReminders) return
    if (isInQuietHours(prefs)) return
    const due = getDueReminders()
    due.forEach(event => {
      const alreadyNotified = notifications.some(
        n => n.type === 'schedule' && n.data?.eventId === event.id &&
        new Date(n.createdAt).toDateString() === new Date().toDateString()
      )
      if (!alreadyNotified) {
        add({
          type: 'schedule',
          title: '日程提醒',
          body: `${event.title} - ${event.time}`,
          icon: '📅',
          data: { eventId: event.id }
        })
      }
    })
  }

  const checkHabitReminders = (getUncompletedHabits: () => Array<{ id: string; name: string }>): void => {
    if (!prefs.habitReminders) return
    if (isInQuietHours(prefs)) return
    const now = new Date()
    if (now.getHours() < 18) return
    const uncompleted = getUncompletedHabits()
    if (uncompleted.length === 0) return
    const alreadyNotified = notifications.some(
      n => n.type === 'habit' && new Date(n.createdAt).toDateString() === now.toDateString()
    )
    if (!alreadyNotified) {
      add({
        type: 'habit',
        title: '习惯提醒',
        body: `还有 ${uncompleted.length} 个习惯待完成：${uncompleted.slice(0, 3).map(h => h.name).join('、')}`,
        icon: '✅'
      })
    }
  }

  const checkReviewReminders = (getDueReviews: () => Array<{ id: string; title: string }>): void => {
    if (!prefs.reviewReminders) return
    if (isInQuietHours(prefs)) return
    const due = getDueReviews()
    due.forEach(item => {
      const alreadyNotified = notifications.some(
        n => n.type === 'review' && n.data?.itemId === item.id &&
        new Date(n.createdAt).toDateString() === new Date().toDateString()
      )
      if (!alreadyNotified) {
        add({
          type: 'review',
          title: '复习提醒',
          body: `该复习了：${item.title}`,
          icon: '🧠',
          data: { itemId: item.id }
        })
      }
    })
  }

  return {
    add, markRead, dismiss, dismissAll,
    getUnread, getActive, getAll,
    getPrefs, updatePrefs,
    requestBrowserPermission,
    subscribe,
    checkScheduleReminders,
    checkHabitReminders,
    checkReviewReminders
  }
}

export type NotificationService = ReturnType<typeof createNotificationService>
