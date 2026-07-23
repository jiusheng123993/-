import type { RelationshipSpace, SpaceInvitation, SpaceActivity, SpaceType, SpaceMember } from './relationshipTypes'
import { DEFAULT_SPACE_SETTINGS, DEFAULT_SPACE_STATS, SPACE_CONSTRAINTS } from './relationshipTypes'

function generateId(prefix = 'sp'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < SPACE_CONSTRAINTS.INVITE_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function loadSpaces(): RelationshipSpace[] {
  try {
    const raw = localStorage.getItem(SPACE_CONSTRAINTS.SPACES_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RelationshipSpace[]
  } catch {
    return []
  }
}

function saveSpaces(spaces: RelationshipSpace[]): void {
  localStorage.setItem(SPACE_CONSTRAINTS.SPACES_STORAGE_KEY, JSON.stringify(spaces))
}

function loadInvitations(): SpaceInvitation[] {
  try {
    const raw = localStorage.getItem(SPACE_CONSTRAINTS.INVITATIONS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SpaceInvitation[]
  } catch {
    return []
  }
}

function saveInvitations(invitations: SpaceInvitation[]): void {
  localStorage.setItem(SPACE_CONSTRAINTS.INVITATIONS_STORAGE_KEY, JSON.stringify(invitations))
}

function loadActivities(): SpaceActivity[] {
  try {
    const raw = localStorage.getItem(SPACE_CONSTRAINTS.ACTIVITIES_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SpaceActivity[]
  } catch {
    return []
  }
}

function saveActivities(activities: SpaceActivity[]): void {
  localStorage.setItem(SPACE_CONSTRAINTS.ACTIVITIES_STORAGE_KEY, JSON.stringify(activities))
}

export type RelationshipStore = {
  getSpaces: () => RelationshipSpace[]
  getSpaceById: (id: string) => RelationshipSpace | undefined
  createSpace: (type: SpaceType, name: string, ownerId: string) => RelationshipSpace
  updateSpace: (id: string, patch: Partial<Pick<RelationshipSpace, 'name' | 'settings'>>) => RelationshipSpace | undefined
  deleteSpace: (id: string) => boolean
  addMember: (spaceId: string, member: SpaceMember) => RelationshipSpace | undefined
  removeMember: (spaceId: string, userId: string) => RelationshipSpace | undefined
  updateMemberRole: (spaceId: string, userId: string, role: SpaceMember['role']) => RelationshipSpace | undefined
  createInvitation: (spaceId: string, inviterId: string) => SpaceInvitation
  getInvitation: (code: string) => SpaceInvitation | undefined
  acceptInvitation: (code: string, userId: string) => RelationshipSpace | undefined
  addActivity: (activity: Omit<SpaceActivity, 'id' | 'createdAt'>) => SpaceActivity
  getActivities: (spaceId: string) => SpaceActivity[]
  updateStats: (spaceId: string, patch: Partial<RelationshipSpace['stats']>) => RelationshipSpace | undefined
  addAnniversary: (spaceId: string, anniversary: Omit<RelationshipSpace['anniversaries'][0], 'id'>) => RelationshipSpace | undefined
  addSharedGoal: (spaceId: string, goal: Omit<RelationshipSpace['sharedGoals'][0], 'id'>) => RelationshipSpace | undefined
}

export function createRelationshipStore(): RelationshipStore {
  return {
    getSpaces: () => loadSpaces(),

    getSpaceById: (id) => loadSpaces().find(s => s.id === id),

    createSpace: (type, name, ownerId) => {
      const spaces = loadSpaces()
      const now = new Date().toISOString()
      const space: RelationshipSpace = {
        id: generateId(),
        type,
        name,
        ownerId,
        members: [{ userId: ownerId, role: 'owner', joinedAt: now }],
        settings: { ...DEFAULT_SPACE_SETTINGS },
        stats: { ...DEFAULT_SPACE_STATS },
        anniversaries: [],
        sharedGoals: [],
        createdAt: now,
        updatedAt: now
      }
      spaces.push(space)
      saveSpaces(spaces)
      return space
    },

    updateSpace: (id, patch) => {
      const spaces = loadSpaces()
      const idx = spaces.findIndex(s => s.id === id)
      if (idx === -1) return undefined
      spaces[idx] = { ...spaces[idx], ...patch, updatedAt: new Date().toISOString() }
      saveSpaces(spaces)
      return spaces[idx]
    },

    deleteSpace: (id) => {
      const spaces = loadSpaces()
      const filtered = spaces.filter(s => s.id !== id)
      if (filtered.length === spaces.length) return false
      saveSpaces(filtered)
      const activities = loadActivities().filter(a => a.spaceId !== id)
      saveActivities(activities)
      return true
    },

    addMember: (spaceId, member) => {
      const spaces = loadSpaces()
      const space = spaces.find(s => s.id === spaceId)
      if (!space) return undefined
      if (space.members.length >= SPACE_CONSTRAINTS.MAX_MEMBERS_PER_SPACE) return undefined
      if (space.members.some(m => m.userId === member.userId)) return undefined
      space.members.push(member)
      space.updatedAt = new Date().toISOString()
      saveSpaces(spaces)
      return space
    },

    removeMember: (spaceId, userId) => {
      const spaces = loadSpaces()
      const space = spaces.find(s => s.id === spaceId)
      if (!space) return undefined
      if (userId === space.ownerId) return undefined
      space.members = space.members.filter(m => m.userId !== userId)
      space.updatedAt = new Date().toISOString()
      saveSpaces(spaces)
      return space
    },

    updateMemberRole: (spaceId, userId, role) => {
      const spaces = loadSpaces()
      const space = spaces.find(s => s.id === spaceId)
      if (!space) return undefined
      const member = space.members.find(m => m.userId === userId)
      if (!member) return undefined
      member.role = role
      space.updatedAt = new Date().toISOString()
      saveSpaces(spaces)
      return space
    },

    createInvitation: (spaceId, inviterId) => {
      const invitations = loadInvitations()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + SPACE_CONSTRAINTS.INVITATION_EXPIRE_DAYS * 24 * 60 * 60 * 1000)
      const invitation: SpaceInvitation = {
        id: generateId('inv'),
        spaceId,
        inviterId,
        inviteCode: generateInviteCode(),
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toISOString()
      }
      invitations.push(invitation)
      saveInvitations(invitations)
      return invitation
    },

    getInvitation: (code) => {
      const invitations = loadInvitations()
      const inv = invitations.find(i => i.inviteCode === code)
      if (!inv) return undefined
      if (inv.status !== 'pending') return undefined
      if (new Date(inv.expiresAt) < new Date()) {
        inv.status = 'expired'
        saveInvitations(invitations)
        return undefined
      }
      return inv
    },

    acceptInvitation: (code, userId) => {
      const invitations = loadInvitations()
      const inv = invitations.find(i => i.inviteCode === code)
      if (!inv || inv.status !== 'pending') return undefined
      if (new Date(inv.expiresAt) < new Date()) {
        inv.status = 'expired'
        saveInvitations(invitations)
        return undefined
      }
      inv.status = 'accepted'
      inv.inviteeId = userId
      saveInvitations(invitations)
      const store = createRelationshipStore()
      return store.addMember(inv.spaceId, {
        userId,
        role: 'member',
        joinedAt: new Date().toISOString()
      })
    },

    addActivity: (activityData) => {
      const activities = loadActivities()
      const activity: SpaceActivity = {
        ...activityData,
        id: generateId('act'),
        createdAt: new Date().toISOString()
      }
      activities.push(activity)
      saveActivities(activities)
      return activity
    },

    getActivities: (spaceId) => {
      return loadActivities().filter(a => a.spaceId === spaceId)
    },

    updateStats: (spaceId, patch) => {
      const spaces = loadSpaces()
      const space = spaces.find(s => s.id === spaceId)
      if (!space) return undefined
      space.stats = { ...space.stats, ...patch }
      space.updatedAt = new Date().toISOString()
      saveSpaces(spaces)
      return space
    },

    addAnniversary: (spaceId, anniversary) => {
      const spaces = loadSpaces()
      const space = spaces.find(s => s.id === spaceId)
      if (!space) return undefined
      space.anniversaries.push({ ...anniversary, id: generateId('ann') })
      space.updatedAt = new Date().toISOString()
      saveSpaces(spaces)
      return space
    },

    addSharedGoal: (spaceId, goal) => {
      const spaces = loadSpaces()
      const space = spaces.find(s => s.id === spaceId)
      if (!space) return undefined
      space.sharedGoals.push({ ...goal, id: generateId('goal') })
      space.updatedAt = new Date().toISOString()
      saveSpaces(spaces)
      return space
    }
  }
}

export const relationshipStore = createRelationshipStore()
