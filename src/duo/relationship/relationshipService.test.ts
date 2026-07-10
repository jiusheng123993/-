import { describe, it, expect, beforeEach } from 'vitest'
import { createRelationshipStore } from './relationshipStore'
import { createRelationshipService } from './relationshipService'
import type { IRealtimeProvider } from './realtimeProvider'
import type { RealtimeMessage, PresenceState, RealtimeConnectionState } from './realtimeTypes'

function createMockRealtimeProvider(): IRealtimeProvider {
  const sent: RealtimeMessage[] = []
  return {
    connect: () => {},
    disconnect: () => {},
    send: (msg) => {
      sent.push({ ...msg, id: `mock_${sent.length}`, timestamp: new Date().toISOString() })
      return true
    },
    getConnectionState: () => 'connected' as RealtimeConnectionState,
    getPresence: () => [] as PresenceState[],
    on: () => {},
    off: () => {},
    updatePresence: () => {}
  }
}

describe('relationshipService', () => {
  let store: ReturnType<typeof createRelationshipStore>
  let service: ReturnType<typeof createRelationshipService>

  beforeEach(() => {
    localStorage.clear()
    store = createRelationshipStore()
    service = createRelationshipService(store, createMockRealtimeProvider())
  })

  describe('createSpace', () => {
    it('should create space when user has entitlement', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true }))
      const space = service.createSpace('couple', 'Test Space', 'user1')
      expect(space.type).toBe('couple')
      expect(space.name).toBe('Test Space')
      expect(space.ownerId).toBe('user1')
      expect(space.members).toHaveLength(1)
      expect(space.members[0].role).toBe('owner')
    })

    it('should throw when user has no entitlement', () => {
      expect(() => service.createSpace('couple', 'Test', 'user1')).toThrow()
    })
  })

  describe('getSpaces', () => {
    it('should return only spaces where user is member', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true }))
      const space1 = service.createSpace('couple', 'Space 1', 'user1')
      service.createSpace('study_buddy', 'Space 2', 'user2')
      const user1Spaces = service.getSpaces('user1')
      expect(user1Spaces).toHaveLength(1)
      expect(user1Spaces[0].id).toBe(space1.id)
    })
  })

  describe('getSpaceById', () => {
    it('should return space if user is member', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true }))
      const space = service.createSpace('couple', 'Test', 'user1')
      const result = service.getSpaceById(space.id, 'user1')
      expect(result).toBeDefined()
      expect(result!.id).toBe(space.id)
    })

    it('should return undefined if user is not member', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true }))
      const space = service.createSpace('couple', 'Test', 'user1')
      const result = service.getSpaceById(space.id, 'user2')
      expect(result).toBeUndefined()
    })
  })

  describe('updateSpace', () => {
    it('should update space if user is owner or admin', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true }))
      const space = service.createSpace('couple', 'Test', 'user1')
      const updated = service.updateSpace(space.id, 'user1', { name: 'Updated' })
      expect(updated).toBeDefined()
      expect(updated!.name).toBe('Updated')
    })

    it('should not update space if user is regular member', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.addMember(space.id, { userId: 'user2', role: 'member', joinedAt: new Date().toISOString() })
      const result = service.updateSpace(space.id, 'user2', { name: 'Hacked' })
      expect(result).toBeUndefined()
    })
  })

  describe('deleteSpace', () => {
    it('should delete space if user is owner', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true }))
      const space = service.createSpace('couple', 'Test', 'user1')
      const result = service.deleteSpace(space.id, 'user1')
      expect(result).toBe(true)
      expect(service.getSpaceById(space.id, 'user1')).toBeUndefined()
    })

    it('should not delete space if user is not owner', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.addMember(space.id, { userId: 'user2', role: 'admin', joinedAt: new Date().toISOString() })
      const result = service.deleteSpace(space.id, 'user2')
      expect(result).toBe(false)
    })
  })

  describe('inviteMember', () => {
    it('should create invitation if user is owner/admin', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      const result = service.inviteMember(space.id, 'user1')
      expect(result).not.toBeNull()
      expect(result!.code).toBeDefined()
      expect(result!.expiresAt).toBeDefined()
    })

    it('should return null if member limit reached', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 1 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      const result = service.inviteMember(space.id, 'user1')
      expect(result).toBeNull()
    })

    it('should return null if user is not owner/admin', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.addMember(space.id, { userId: 'user2', role: 'member', joinedAt: new Date().toISOString() })
      const result = service.inviteMember(space.id, 'user2')
      expect(result).toBeNull()
    })
  })

  describe('joinSpace', () => {
    it('should join space with valid invitation code', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      const invitation = service.inviteMember(space.id, 'user1')
      const result = service.joinSpace(invitation!.code, 'user2')
      expect(result).not.toBeNull()
      expect(result!.members.some(m => m.userId === 'user2')).toBe(true)
    })

    it('should return null with invalid code', () => {
      const result = service.joinSpace('INVALID', 'user1')
      expect(result).toBeNull()
    })
  })

  describe('pushTask', () => {
    it('should push task to another member', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.addMember(space.id, { userId: 'user2', role: 'member', joinedAt: new Date().toISOString() })
      const activity = service.pushTask(space.id, 'user1', 'user2', 'task1', 'Do something')
      expect(activity).not.toBeNull()
      expect(activity!.type).toBe('task_push')
      expect(activity!.payload.taskId).toBe('task1')
    })

    it('should return null if task push is disabled', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.addMember(space.id, { userId: 'user2', role: 'member', joinedAt: new Date().toISOString() })
      store.updateSpace(space.id, { settings: { ...space.settings, allowTaskPush: false } })
      const result = service.pushTask(space.id, 'user1', 'user2', 'task1', 'Test')
      expect(result).toBeNull()
    })
  })

  describe('acceptTask / rejectTask', () => {
    it('should accept pushed task', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.addMember(space.id, { userId: 'user2', role: 'member', joinedAt: new Date().toISOString() })
      const pushed = service.pushTask(space.id, 'user1', 'user2', 'task1', 'Do something')
      const accepted = service.acceptTask(space.id, 'user2', pushed!.id)
      expect(accepted).not.toBeNull()
      expect(accepted!.type).toBe('task_accept')
    })

    it('should reject pushed task', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.addMember(space.id, { userId: 'user2', role: 'member', joinedAt: new Date().toISOString() })
      const pushed = service.pushTask(space.id, 'user1', 'user2', 'task1', 'Do something')
      const rejected = service.rejectTask(space.id, 'user2', pushed!.id)
      expect(rejected).not.toBeNull()
      expect(rejected!.type).toBe('task_reject')
    })

    it('should not accept task not targeted to user', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.addMember(space.id, { userId: 'user2', role: 'member', joinedAt: new Date().toISOString() })
      const pushed = service.pushTask(space.id, 'user1', 'user2', 'task1', 'Do something')
      const result = service.acceptTask(space.id, 'user1', pushed!.id)
      expect(result).toBeNull()
    })
  })

  describe('focus operations', () => {
    it('should start and end focus session', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      const started = service.startFocus(space.id, 'user1', 25)
      expect(started).not.toBeNull()
      expect(started!.type).toBe('focus_start')
      const ended = service.endFocus(space.id, 'user1', 25)
      expect(ended).not.toBeNull()
      expect(ended!.type).toBe('focus_end')
    })

    it('should start focus PK', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.addMember(space.id, { userId: 'user2', role: 'member', joinedAt: new Date().toISOString() })
      const pk = service.startFocusPK(space.id, 'user1', 'user2', 25)
      expect(pk).not.toBeNull()
      expect(pk!.type).toBe('focus_pk_invite')
    })
  })

  describe('getRanking', () => {
    it('should return ranking for space members', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.addMember(space.id, { userId: 'user2', role: 'member', joinedAt: new Date().toISOString() })
      service.completeSharedTask(space.id, 'user1', 'task1')
      const ranking = service.getRanking(space.id, 'user1', 'week')
      expect(ranking).toHaveLength(2)
      expect(ranking[0].userId).toBe('user1')
    })

    it('should return empty if ranking is disabled', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.updateSpace(space.id, { settings: { ...space.settings, allowRanking: false } })
      const ranking = service.getRanking(space.id, 'user1', 'week')
      expect(ranking).toEqual([])
    })
  })

  describe('recalculateScores', () => {
    it('should recalculate intimacy for couple space', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.updateStats(space.id, { streakDays: 5, totalSharedFocus: 120 })
      const updated = service.recalculateScores(space.id)
      expect(updated).toBeDefined()
      expect(updated!.stats.intimacyScore).toBeGreaterThanOrEqual(0)
    })

    it('should recalculate synergy for study_buddy space', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('study_buddy', 'Test', 'user1')
      store.updateStats(space.id, { totalSharedTasks: 10 })
      const updated = service.recalculateScores(space.id)
      expect(updated).toBeDefined()
      expect(updated!.stats.synergyScore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('anniversaries and goals', () => {
    it('should add anniversary with entitlement', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5, anniversary: true }))
      const space = service.createSpace('couple', 'Test', 'user1')
      const result = service.addAnniversary(space.id, 'user1', '纪念日', '2026-06-15', 'yearly', 3)
      expect(result).not.toBeNull()
      expect(result!.anniversaries).toHaveLength(1)
    })

    it('should not add anniversary without entitlement', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      const result = service.addAnniversary(space.id, 'user1', '纪念日', '2026-06-15', 'yearly', 3)
      expect(result).toBeNull()
    })

    it('should add shared goal', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true, space_member_limit: 5 }))
      const space = service.createSpace('couple', 'Test', 'user1')
      store.addMember(space.id, { userId: 'user2', role: 'member', joinedAt: new Date().toISOString() })
      const result = service.addSharedGoal(space.id, 'user1', '共同目标', '2026-12-31', ['user1', 'user2'])
      expect(result).not.toBeNull()
      expect(result!.sharedGoals).toHaveLength(1)
    })
  })

  describe('canUseFeature', () => {
    it('should return true when user has entitlement', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({ space: true }))
      expect(service.canUseFeature('user1', 'space')).toBe(true)
    })

    it('should return false when user has no entitlement', () => {
      localStorage.setItem('xinghuanhai_entitlements', JSON.stringify({}))
      expect(service.canUseFeature('user1', 'space')).toBe(false)
    })
  })
})
