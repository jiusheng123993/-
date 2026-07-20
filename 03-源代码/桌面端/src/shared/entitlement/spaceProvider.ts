import type { EntitlementService } from './entitlementService'

export type SpaceRole = 'owner' | 'member'
export type SpaceType = 'couple' | 'family' | 'study_buddy' | 'self_discipline'

export interface Space {
  id: string
  name: string
  type: SpaceType
  ownerId: string
  memberIds: string[]
  createdAt: string
  maxMembers: number
}

export interface SpaceMember {
  userId: string
  spaceId: string
  role: SpaceRole
  joinedAt: string
}

export interface SpaceProvider {
  createSpace(ownerId: string, name: string, type: SpaceType): Space
  joinSpace(spaceId: string, userId: string): void
  leaveSpace(spaceId: string, userId: string): void
  removeMember(spaceId: string, ownerId: string, memberId: string): void
  getSpace(spaceId: string): Space | null
  getUserSpaces(userId: string): Space[]
  getMemberSpaces(userId: string): Space[]
  isSpaceMember(userId: string, spaceId: string): boolean
  hasSpace(userId: string): boolean
}

const DEFAULT_MAX_MEMBERS: Record<SpaceType, number> = {
  couple: 2,
  family: 6,
  study_buddy: 5,
  self_discipline: 10
}

function generateSpaceId(): string {
  return `space-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function createSpaceProvider(entitlementService: EntitlementService): SpaceProvider {
  const spaces = new Map<string, Space>()
  const memberships = new Map<string, SpaceMember>()

  const getMembershipKey = (userId: string, spaceId: string) => `${userId}:${spaceId}`

  return {
    createSpace(ownerId: string, name: string, type: SpaceType): Space {
      const space: Space = {
        id: generateSpaceId(),
        name,
        type,
        ownerId,
        memberIds: [ownerId],
        createdAt: new Date().toISOString(),
        maxMembers: DEFAULT_MAX_MEMBERS[type]
      }

      spaces.set(space.id, space)

      memberships.set(getMembershipKey(ownerId, space.id), {
        userId: ownerId,
        spaceId: space.id,
        role: 'owner',
        joinedAt: new Date().toISOString()
      })

      entitlementService.grant(ownerId, {
        code: 'space',
        source: 'space_monthly',
        expireAt: null,
        scope: space.id
      })

      return space
    },

    joinSpace(spaceId: string, userId: string): void {
      const space = spaces.get(spaceId)
      if (!space) throw new Error('Space not found')

      if (space.memberIds.includes(userId)) {
        throw new Error('Already a member')
      }

      if (space.memberIds.length >= space.maxMembers) {
        throw new Error('Space is full')
      }

      space.memberIds.push(userId)

      memberships.set(getMembershipKey(userId, spaceId), {
        userId,
        spaceId,
        role: 'member',
        joinedAt: new Date().toISOString()
      })
    },

    leaveSpace(spaceId: string, userId: string): void {
      const space = spaces.get(spaceId)
      if (!space) throw new Error('Space not found')

      if (space.ownerId === userId) {
        throw new Error('Owner cannot leave space. Delete the space instead.')
      }

      space.memberIds = space.memberIds.filter((id) => id !== userId)
      memberships.delete(getMembershipKey(userId, spaceId))
    },

    removeMember(spaceId: string, ownerId: string, memberId: string): void {
      const space = spaces.get(spaceId)
      if (!space) throw new Error('Space not found')

      if (space.ownerId !== ownerId) {
        throw new Error('Only owner can remove members')
      }

      if (memberId === ownerId) {
        throw new Error('Cannot remove yourself')
      }

      space.memberIds = space.memberIds.filter((id) => id !== memberId)
      memberships.delete(getMembershipKey(memberId, spaceId))
    },

    getSpace(spaceId: string): Space | null {
      return spaces.get(spaceId) ?? null
    },

    getUserSpaces(userId: string): Space[] {
      return Array.from(spaces.values()).filter((s) => s.ownerId === userId)
    },

    getMemberSpaces(userId: string): Space[] {
      return Array.from(spaces.values()).filter((s) => s.memberIds.includes(userId))
    },

    isSpaceMember(userId: string, spaceId: string): boolean {
      const membership = memberships.get(getMembershipKey(userId, spaceId))
      return !!membership
    },

    hasSpace(userId: string): boolean {
      return entitlementService.has(userId, 'space')
    }
  }
}
