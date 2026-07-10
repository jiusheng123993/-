import { describe, it, expect, beforeEach } from 'vitest'
import { createNotificationService } from './notificationService'

describe('notificationService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should add a notification', () => {
    const service = createNotificationService()
    const n = service.add({ type: 'system', title: 'Test', body: 'Hello' })
    expect(n.title).toBe('Test')
    expect(n.read).toBe(false)
    expect(n.dismissed).toBe(false)
  })

  it('should get unread notifications', () => {
    const service = createNotificationService()
    service.add({ type: 'system', title: 'A', body: 'a' })
    service.add({ type: 'system', title: 'B', body: 'b' })
    expect(service.getUnread()).toHaveLength(2)
  })

  it('should mark notification as read', () => {
    const service = createNotificationService()
    const n = service.add({ type: 'system', title: 'Test', body: 'Hello' })
    service.markRead(n.id)
    expect(service.getUnread()).toHaveLength(0)
  })

  it('should dismiss notification', () => {
    const service = createNotificationService()
    const n = service.add({ type: 'system', title: 'Test', body: 'Hello' })
    service.dismiss(n.id)
    expect(service.getUnread()).toHaveLength(0)
    expect(service.getActive()).toHaveLength(0)
  })

  it('should dismiss all notifications', () => {
    const service = createNotificationService()
    service.add({ type: 'system', title: 'A', body: 'a' })
    service.add({ type: 'system', title: 'B', body: 'b' })
    service.dismissAll()
    expect(service.getUnread()).toHaveLength(0)
  })

  it('should persist notifications across instances', () => {
    const s1 = createNotificationService()
    s1.add({ type: 'system', title: 'Persist', body: 'test' })
    const s2 = createNotificationService()
    expect(s2.getAll()).toHaveLength(1)
  })

  it('should respect quiet hours for schedule reminders', () => {
    const service = createNotificationService()
    service.updatePrefs({ quietHoursStart: '00:00', quietHoursEnd: '23:59' })
    service.checkScheduleReminders(() => [{ id: '1', title: 'Meeting', time: '10:00' }])
    expect(service.getUnread()).toHaveLength(0)
  })

  it('should deduplicate schedule reminders for same day', () => {
    const service = createNotificationService()
    service.updatePrefs({ quietHoursStart: '00:00', quietHoursEnd: '00:01' })
    service.checkScheduleReminders(() => [{ id: '1', title: 'Meeting', time: '10:00' }])
    service.checkScheduleReminders(() => [{ id: '1', title: 'Meeting', time: '10:00' }])
    expect(service.getUnread()).toHaveLength(1)
  })
})
