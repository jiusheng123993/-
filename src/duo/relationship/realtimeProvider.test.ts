import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRealtimeProvider } from './realtimeProvider'
import type { RealtimeMessage, PresenceState, RealtimeConnectionState } from './realtimeTypes'

describe('realtimeProvider', () => {
  const provider = createRealtimeProvider({ pollingIntervalMs: 100 })
  const messages: RealtimeMessage[] = []
  const presences: PresenceState[] = []
  const states: RealtimeConnectionState[] = []
  const errors: Error[] = []

  const handler = {
    onMessage: (m: RealtimeMessage) => messages.push(m),
    onPresenceChange: (p: PresenceState) => presences.push(p),
    onConnectionChange: (s: RealtimeConnectionState) => states.push(s),
    onError: (e: Error) => errors.push(e)
  }

  beforeEach(() => {
    localStorage.clear()
    messages.length = 0
    presences.length = 0
    states.length = 0
    errors.length = 0
    provider.disconnect()
    provider.on(handler)
  })

  afterEach(() => {
    provider.off(handler)
    provider.disconnect()
  })

  describe('connect', () => {
    it('should transition to connected state', () => {
      provider.connect('user1', ['space1'])
      expect(states).toContain('connecting')
      expect(states).toContain('connected')
    })

    it('should not reconnect if already connected', () => {
      provider.connect('user1', ['space1'])
      states.length = 0
      provider.connect('user1', ['space1'])
      expect(states).not.toContain('connecting')
    })

    it('should handle empty spaceIds', () => {
      provider.connect('user1', [])
      expect(provider.getConnectionState()).toBe('connected')
    })
  })

  describe('disconnect', () => {
    it('should transition to disconnected state', () => {
      provider.connect('user1', ['space1'])
      states.length = 0
      provider.disconnect()
      expect(states).toContain('disconnected')
    })

    it('should clear state on disconnect', () => {
      provider.connect('user1', ['space1'])
      provider.disconnect()
      expect(provider.getConnectionState()).toBe('disconnected')
      expect(provider.getPresence('space1')).toEqual([])
    })
  })

  describe('send', () => {
    it('should send message when connected', () => {
      provider.connect('user1', ['space1'])
      const result = provider.send({
        type: 'task_push',
        spaceId: 'space1',
        senderId: 'user1',
        targetId: 'user2',
        payload: { taskId: 'task1' }
      })
      expect(result).toBe(true)
    })

    it('should fail to send when disconnected', () => {
      provider.disconnect()
      const result = provider.send({
        type: 'task_push',
        spaceId: 'space1',
        senderId: 'user1',
        payload: {}
      })
      expect(result).toBe(false)
    })

    it('should generate id and timestamp', () => {
      provider.connect('user1', ['space1'])
      provider.send({
        type: 'task_push',
        spaceId: 'space1',
        senderId: 'user1',
        payload: {}
      })
      const stored = JSON.parse(localStorage.getItem('xinghuanhai_realtime_messages') || '[]')
      expect(stored[0].id).toMatch(/^rtm_/)
      expect(stored[0].timestamp).toBeDefined()
    })
  })

  describe('getConnectionState', () => {
    it('should return disconnected initially', () => {
      provider.disconnect()
      expect(provider.getConnectionState()).toBe('disconnected')
    })

    it('should return connected after connect', () => {
      provider.connect('user1', ['space1'])
      expect(provider.getConnectionState()).toBe('connected')
    })
  })

  describe('getPresence', () => {
    it('should return empty array for unknown space', () => {
      provider.connect('user1', ['space1'])
      expect(provider.getPresence('unknown')).toEqual([])
    })

    it('should return presence after updatePresence', async () => {
      provider.connect('user1', ['space1'])
      provider.updatePresence('online', 'studying')
      await new Promise(r => setTimeout(r, 50))
      const presence = provider.getPresence('space1')
      expect(presence.length).toBeGreaterThan(0)
      expect(presence[0].status).toBe('online')
      expect(presence[0].currentActivity).toBe('studying')
    })
  })

  describe('updatePresence', () => {
    it('should update presence for all subscribed spaces', async () => {
      provider.connect('user1', ['space1', 'space2'])
      provider.updatePresence('online')
      await new Promise(r => setTimeout(r, 50))
      expect(presences.length).toBeGreaterThanOrEqual(2)
      const spaceIds = presences.map(p => p.spaceId)
      expect(spaceIds).toContain('space1')
      expect(spaceIds).toContain('space2')
    })

    it('should emit presence change event', async () => {
      provider.connect('user1', ['space1'])
      provider.updatePresence('away', 'idle')
      await new Promise(r => setTimeout(r, 50))
      expect(presences.some(p => p.status === 'away')).toBe(true)
    })

    it('should do nothing when not connected', () => {
      provider.disconnect()
      provider.updatePresence('online')
      expect(presences).toEqual([])
    })
  })

  describe('on/off handlers', () => {
    it('should receive messages through handler', async () => {
      provider.connect('user1', ['space1'])
      const msg = {
        type: 'task_push' as const,
        spaceId: 'space1',
        senderId: 'user1',
        payload: { taskId: 'task1' }
      }
      provider.send(msg)
      const stored = {
        ...msg,
        id: 'test_id',
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString()
      }
      localStorage.setItem('xinghuanhai_realtime_messages', JSON.stringify([stored]))
      await new Promise(r => setTimeout(r, 150))
    })

    it('should stop receiving after off', () => {
      provider.off(handler)
      provider.connect('user1', ['space1'])
      expect(states.length).toBe(0)
    })
  })

  describe('reconnection', () => {
    it('should attempt reconnect on failure', async () => {
      const reconnectProvider = createRealtimeProvider({
        pollingIntervalMs: 50,
        reconnectMaxRetries: 2,
        reconnectBaseDelayMs: 10
      })
      reconnectProvider.on(handler)
      reconnectProvider.connect('user1', ['space1'])
      await new Promise(r => setTimeout(r, 200))
      reconnectProvider.disconnect()
    })
  })

  describe('message queue', () => {
    it('should limit queue size', () => {
      const limitedProvider = createRealtimeProvider({ messageQueueSize: 3, pollingIntervalMs: 100 })
      limitedProvider.connect('user1', ['space1'])
      for (let i = 0; i < 5; i++) {
        limitedProvider.send({
          type: 'task_push',
          spaceId: 'space1',
          senderId: 'user1',
          payload: { index: i }
        })
      }
      const stored = JSON.parse(localStorage.getItem('xinghuanhai_realtime_messages') || '[]')
      expect(stored.length).toBeLessThanOrEqual(3)
      limitedProvider.disconnect()
    })

    it('should expire old messages', async () => {
      const oldTimestamp = new Date(Date.now() - 86500000).toISOString()
      const oldMessage = {
        id: 'old_msg',
        type: 'task_push' as const,
        spaceId: 'space1',
        senderId: 'user1',
        payload: {},
        timestamp: oldTimestamp,
        receivedAt: oldTimestamp
      }
      localStorage.setItem('xinghuanhai_realtime_messages', JSON.stringify([oldMessage]))
      provider.connect('user1', ['space1'])
      await new Promise(r => setTimeout(r, 150))
      const stored = JSON.parse(localStorage.getItem('xinghuanhai_realtime_messages') || '[]')
      expect(stored.find((m: { id: string }) => m.id === 'old_msg')).toBeUndefined()
    })
  })

  describe('presence persistence', () => {
    it('should persist presence to localStorage', async () => {
      provider.connect('user1', ['space1'])
      provider.updatePresence('online', 'working')
      await new Promise(r => setTimeout(r, 50))
      const stored = JSON.parse(localStorage.getItem('xinghuanhai_presence_space1') || '[]')
      expect(stored.some((p: PresenceState) => p.userId === 'user1')).toBe(true)
    })

    it('should load presence from localStorage on connect', async () => {
      const existingPresence: PresenceState = {
        userId: 'user2',
        spaceId: 'space1',
        status: 'online',
        lastSeen: new Date().toISOString()
      }
      localStorage.setItem('xinghuanhai_presence_space1', JSON.stringify([existingPresence]))
      provider.connect('user1', ['space1'])
      await new Promise(r => setTimeout(r, 150))
      const presence = provider.getPresence('space1')
      expect(presence.some(p => p.userId === 'user2')).toBe(true)
    })
  })
})
