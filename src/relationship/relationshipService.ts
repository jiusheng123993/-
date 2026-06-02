import type { RelationshipSpace, SpaceActivity, SpaceMember, SpaceType } from './relationshipTypes'
import { relationshipStore } from './relationshipStore'
import type { IRealtimeProvider } from './realtimeProvider'
import { realtimeProvider } from './realtimeProvider'
import { calculateIntimacyScore, calculateSynergyScore } from './intimacyCalculator'

export type RelationshipService = {
  createSpace: (type: SpaceType, name: string, ownerId: string) => RelationshipSpace
  getSpaces: (userId: string) => RelationshipSpace[]
  getSpaceById: (id: string, userId: string) => RelationshipSpace | undefined
  updateSpace: (id: string, userId: string, patch: Partial<Pick<RelationshipSpace, 'name' | 'settings'>>) => RelationshipSpace | undefined
  deleteSpace: (id: string, userId: string) => boolean
  inviteMember: (spaceId: string, inviterId: string) => { code: string; expiresAt: string } | null
  joinSpace: (code: string, userId: string) => RelationshipSpace | null
  removeMember: (spaceId: string, requesterId: string, targetUserId: string) => RelationshipSpace | null | undefined
  updateMemberRole: (spaceId: string, requesterId: string, targetUserId: string, role: SpaceMember['role']) => RelationshipSpace | null
  pushTask: (spaceId: string, senderId: string, targetUserId: string, taskId: string, taskTitle: string) => SpaceActivity | null
  acceptTask: (spaceId: string, userId: string, activityId: string) => SpaceActivity | null
  rejectTask: (spaceId: string, userId: string, activityId: string) => SpaceActivity | null
  completeSharedTask: (spaceId: string, userId: string, taskId: string) => SpaceActivity | null
  checkHabit: (spaceId: string, userId: string, habitId: string, habitName: string) => SpaceActivity | null
  startFocus: (spaceId: string, userId: string, durationMinutes: number) => SpaceActivity | null
  endFocus: (spaceId: string, userId: string, actualMinutes: number) => SpaceActivity | null
  startFocusPK: (spaceId: string, challengerId: string, targetUserId: string, durationMinutes: number) => SpaceActivity | null
  acceptFocusPK: (spaceId: string, userId: string, activityId: string) => SpaceActivity | null
  completeFocusPK: (spaceId: string, userId: string, activityId: string, actualMinutes: number) => SpaceActivity | null
  getActivities: (spaceId: string, userId: string, limit?: number) => SpaceActivity[]
  getRanking: (spaceId: string, userId: string, period: 'week' | 'month') => Array<{ userId: string; score: number; focusMinutes: number; tasksCompleted: number }>
  recalculateScores: (spaceId: string) => RelationshipSpace | undefined
  addAnniversary: (spaceId: string, userId: string, name: string, date: string, repeat: 'yearly' | 'monthly' | 'once', remindDays: number) => RelationshipSpace | null
  addSharedGoal: (spaceId: string, userId: string, name: string, targetDate: string, contributors: string[]) => RelationshipSpace | null
  updateGoalProgress: (spaceId: string, userId: string, goalId: string, progress: number) => RelationshipSpace | null
  canUseFeature: (userId: string, feature: 'space' | 'ranking' | 'anniversary') => boolean
}

function isMember(space: RelationshipSpace, userId: string): boolean {
  return space.members.some(m => m.userId === userId)
}

function isOwnerOrAdmin(space: RelationshipSpace, userId: string): boolean {
  const member = space.members.find(m => m.userId === userId)
  return member?.role === 'owner' || member?.role === 'admin'
}

function isOwner(space: RelationshipSpace, userId: string): boolean {
  return space.ownerId === userId
}

function getEntitlementLimit(_userId: string, entitlement: string): number {
  try {
    const raw = localStorage.getItem('xinghuanhai_entitlements')
    if (!raw) return entitlement === 'space_member_limit' ? 2 : 0
    const entitlements = JSON.parse(raw) as Record<string, unknown>
    if (entitlement === 'space_member_limit') {
      return typeof entitlements[entitlement] === 'number' ? entitlements[entitlement] as number : 2
    }
    return entitlements[entitlement] ? 1 : 0
  } catch {
    return entitlement === 'space_member_limit' ? 2 : 0
  }
}

export function createRelationshipService(
  store: typeof relationshipStore = relationshipStore,
  realtime: IRealtimeProvider = realtimeProvider
): RelationshipService {
  return {
    createSpace: (type, name, ownerId) => {
      if (!getEntitlementLimit(ownerId, 'space')) {
        throw new Error('User does not have space entitlement')
      }
      const space = store.createSpace(type, name, ownerId)
      realtime.send({
        type: 'space_update',
        spaceId: space.id,
        senderId: ownerId,
        payload: { action: 'created', spaceName: name }
      })
      return space
    },

    getSpaces: (userId) => {
      return store.getSpaces().filter(s => isMember(s, userId))
    },

    getSpaceById: (id, userId) => {
      const space = store.getSpaceById(id)
      if (!space || !isMember(space, userId)) return undefined
      return space
    },

    updateSpace: (id, userId, patch) => {
      const space = store.getSpaceById(id)
      if (!space || !isOwnerOrAdmin(space, userId)) return undefined
      const updated = store.updateSpace(id, patch)
      if (updated) {
        realtime.send({
          type: 'space_update',
          spaceId: id,
          senderId: userId,
          payload: { action: 'updated', patch }
        })
      }
      return updated
    },

    deleteSpace: (id, userId) => {
      const space = store.getSpaceById(id)
      if (!space || !isOwner(space, userId)) return false
      const result = store.deleteSpace(id)
      if (result) {
        realtime.send({
          type: 'space_update',
          spaceId: id,
          senderId: userId,
          payload: { action: 'deleted' }
        })
      }
      return result
    },

    inviteMember: (spaceId, inviterId) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isOwnerOrAdmin(space, inviterId)) return null
      const memberLimit = getEntitlementLimit(space.ownerId, 'space_member_limit')
      if (space.members.length >= memberLimit) return null
      const invitation = store.createInvitation(spaceId, inviterId)
      return { code: invitation.inviteCode, expiresAt: invitation.expiresAt }
    },

    joinSpace: (code, userId) => {
      const space = store.acceptInvitation(code, userId)
      if (!space) return null
      realtime.send({
        type: 'member_join',
        spaceId: space.id,
        senderId: userId,
        payload: { memberCount: space.members.length }
      })
      store.addActivity({
        spaceId: space.id,
        type: 'member_join',
        actorId: userId,
        payload: {}
      })
      return space
    },

    removeMember: (spaceId, requesterId, targetUserId) => {
      const space = store.getSpaceById(spaceId)
      if (!space) return null
      if (targetUserId === space.ownerId) return null
      if (!isOwnerOrAdmin(space, requesterId) && requesterId !== targetUserId) return null
      const updated = store.removeMember(spaceId, targetUserId)
      if (updated) {
        realtime.send({
          type: 'member_leave',
          spaceId,
          senderId: requesterId,
          targetId: targetUserId,
          payload: {}
        })
        store.addActivity({
          spaceId,
          type: 'member_leave',
          actorId: targetUserId,
          payload: { removedBy: requesterId }
        })
      }
      return updated
    },

    updateMemberRole: (spaceId, requesterId, targetUserId, role) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isOwner(space, requesterId)) return null
      if (targetUserId === space.ownerId) return null
      return store.updateMemberRole(spaceId, targetUserId, role) ?? null
    },

    pushTask: (spaceId, senderId, targetUserId, taskId, taskTitle) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isMember(space, senderId) || !isMember(space, targetUserId)) return null
      if (!space.settings.allowTaskPush) return null
      const activity = store.addActivity({
        spaceId,
        type: 'task_push',
        actorId: senderId,
        targetId: targetUserId,
        payload: { taskId, taskTitle }
      })
      realtime.send({
        type: 'task_push',
        spaceId,
        senderId,
        targetId: targetUserId,
        payload: { taskId, taskTitle, activityId: activity.id }
      })
      return activity
    },

    acceptTask: (spaceId, userId, activityId) => {
      const activities = store.getActivities(spaceId)
      const activity = activities.find(a => a.id === activityId)
      if (!activity || activity.type !== 'task_push' || activity.targetId !== userId) return null
      const result = store.addActivity({
        spaceId,
        type: 'task_accept',
        actorId: userId,
        targetId: activity.payload.taskId as string,
        payload: { originalActivityId: activityId }
      })
      realtime.send({
        type: 'task_accept',
        spaceId,
        senderId: userId,
        targetId: activity.actorId,
        payload: { taskId: activity.payload.taskId }
      })
      return result
    },

    rejectTask: (spaceId, userId, activityId) => {
      const activities = store.getActivities(spaceId)
      const activity = activities.find(a => a.id === activityId)
      if (!activity || activity.type !== 'task_push' || activity.targetId !== userId) return null
      const result = store.addActivity({
        spaceId,
        type: 'task_reject',
        actorId: userId,
        targetId: activity.payload.taskId as string,
        payload: { originalActivityId: activityId }
      })
      realtime.send({
        type: 'task_reject',
        spaceId,
        senderId: userId,
        targetId: activity.actorId,
        payload: { taskId: activity.payload.taskId }
      })
      return result
    },

    completeSharedTask: (spaceId, userId, taskId) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isMember(space, userId)) return null
      const activity = store.addActivity({
        spaceId,
        type: 'task_complete',
        actorId: userId,
        targetId: taskId,
        payload: {}
      })
      store.updateStats(spaceId, {
        totalSharedTasks: space.stats.totalSharedTasks + 1
      })
      realtime.send({
        type: 'task_complete',
        spaceId,
        senderId: userId,
        payload: { taskId }
      })
      return activity
    },

    checkHabit: (spaceId, userId, habitId, habitName) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isMember(space, userId)) return null
      if (!space.settings.allowSharedHabits) return null
      const activity = store.addActivity({
        spaceId,
        type: 'habit_check',
        actorId: userId,
        targetId: habitId,
        payload: { habitName }
      })
      realtime.send({
        type: 'habit_check',
        spaceId,
        senderId: userId,
        payload: { habitId, habitName }
      })
      return activity
    },

    startFocus: (spaceId, userId, durationMinutes) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isMember(space, userId)) return null
      if (!space.settings.allowSharedFocus) return null
      const activity = store.addActivity({
        spaceId,
        type: 'focus_start',
        actorId: userId,
        payload: { durationMinutes }
      })
      realtime.send({
        type: 'focus_start',
        spaceId,
        senderId: userId,
        payload: { durationMinutes }
      })
      return activity
    },

    endFocus: (spaceId, userId, actualMinutes) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isMember(space, userId)) return null
      const activity = store.addActivity({
        spaceId,
        type: 'focus_end',
        actorId: userId,
        payload: { actualMinutes }
      })
      store.updateStats(spaceId, {
        totalSharedFocus: space.stats.totalSharedFocus + actualMinutes
      })
      realtime.send({
        type: 'focus_end',
        spaceId,
        senderId: userId,
        payload: { actualMinutes }
      })
      return activity
    },

    startFocusPK: (spaceId, challengerId, targetUserId, durationMinutes) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isMember(space, challengerId) || !isMember(space, targetUserId)) return null
      if (!space.settings.allowRanking) return null
      const activity = store.addActivity({
        spaceId,
        type: 'focus_pk_invite',
        actorId: challengerId,
        targetId: targetUserId,
        payload: { durationMinutes }
      })
      realtime.send({
        type: 'focus_pk_invite',
        spaceId,
        senderId: challengerId,
        targetId: targetUserId,
        payload: { durationMinutes, activityId: activity.id }
      })
      return activity
    },

    acceptFocusPK: (spaceId, userId, activityId) => {
      const activities = store.getActivities(spaceId)
      const activity = activities.find(a => a.id === activityId)
      if (!activity || activity.type !== 'focus_pk_invite' || activity.targetId !== userId) return null
      const result = store.addActivity({
        spaceId,
        type: 'focus_pk_accept',
        actorId: userId,
        targetId: activityId,
        payload: { durationMinutes: activity.payload.durationMinutes }
      })
      realtime.send({
        type: 'focus_pk_accept',
        spaceId,
        senderId: userId,
        targetId: activity.actorId,
        payload: { activityId }
      })
      return result
    },

    completeFocusPK: (spaceId, userId, activityId, actualMinutes) => {
      const activities = store.getActivities(spaceId)
      const activity = activities.find(a => a.id === activityId)
      if (!activity) return null
      const result = store.addActivity({
        spaceId,
        type: 'focus_pk_complete',
        actorId: userId,
        targetId: activityId,
        payload: { actualMinutes }
      })
      realtime.send({
        type: 'focus_pk_complete',
        spaceId,
        senderId: userId,
        payload: { activityId, actualMinutes }
      })
      return result
    },

    getActivities: (spaceId, userId, limit = 50) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isMember(space, userId)) return []
      return store.getActivities(spaceId).slice(-limit)
    },

    getRanking: (spaceId, userId, period) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isMember(space, userId)) return []
      if (!space.settings.allowRanking) return []
      const activities = store.getActivities(spaceId)
      const now = new Date()
      const periodStart = new Date(now.getTime() - (period === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000)
      const relevantActivities = activities.filter(a => new Date(a.createdAt) >= periodStart)
      const stats = new Map<string, { focusMinutes: number; tasksCompleted: number }>()
      space.members.forEach(m => {
        stats.set(m.userId, { focusMinutes: 0, tasksCompleted: 0 })
      })
      relevantActivities.forEach(a => {
        const userStats = stats.get(a.actorId)
        if (!userStats) return
        if (a.type === 'focus_end') {
          userStats.focusMinutes += (a.payload.actualMinutes as number) || 0
        }
        if (a.type === 'task_complete') {
          userStats.tasksCompleted += 1
        }
      })
      return Array.from(stats.entries())
        .map(([uid, s]) => ({
          userId: uid,
          score: s.focusMinutes + s.tasksCompleted * 30,
          focusMinutes: s.focusMinutes,
          tasksCompleted: s.tasksCompleted
        }))
        .sort((a, b) => b.score - a.score)
    },

    recalculateScores: (spaceId) => {
      const space = store.getSpaceById(spaceId)
      if (!space) return undefined
      const activities = store.getActivities(spaceId)
      const intimacyScore = space.type === 'couple'
        ? calculateIntimacyScore(space, activities)
        : 0
      const synergyScore = space.type !== 'couple'
        ? calculateSynergyScore(space, activities)
        : 0
      return store.updateStats(spaceId, { intimacyScore, synergyScore })
    },

    addAnniversary: (spaceId, userId, name, date, repeat, remindDays) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isOwnerOrAdmin(space, userId)) return null
      if (!getEntitlementLimit(userId, 'anniversary')) return null
      return store.addAnniversary(spaceId, { name, date, repeat, remindDays }) ?? null
    },

    addSharedGoal: (spaceId, userId, name, targetDate, contributors) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isOwnerOrAdmin(space, userId)) return null
      const validContributors = contributors.filter(c => isMember(space, c))
      if (validContributors.length === 0) return null
      return store.addSharedGoal(spaceId, { name, targetDate, progress: 0, contributors: validContributors }) ?? null
    },

    updateGoalProgress: (spaceId, userId, goalId, progress) => {
      const space = store.getSpaceById(spaceId)
      if (!space || !isMember(space, userId)) return null
      const goal = space.sharedGoals.find(g => g.id === goalId)
      if (!goal || !goal.contributors.includes(userId)) return null
      const updatedGoals = space.sharedGoals.map(g =>
        g.id === goalId ? { ...g, progress: Math.min(100, Math.max(0, progress)) } : g
      )
      const updated = store.updateSpace(spaceId, { sharedGoals: updatedGoals } as Partial<Pick<RelationshipSpace, 'name' | 'settings'>>)
      if (updated) {
        store.addActivity({
          spaceId,
          type: 'goal_progress',
          actorId: userId,
          targetId: goalId,
          payload: { progress }
        })
      }
      return updated ?? null
    },

    canUseFeature: (userId, feature) => {
      switch (feature) {
        case 'space':
          return getEntitlementLimit(userId, 'space') > 0
        case 'ranking':
          return getEntitlementLimit(userId, 'ranking') > 0
        case 'anniversary':
          return getEntitlementLimit(userId, 'anniversary') > 0
        default:
          return false
      }
    }
  }
}

export const relationshipService = createRelationshipService()
