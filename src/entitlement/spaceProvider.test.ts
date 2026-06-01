import { describe, it, expect, beforeEach } from 'vitest'
import { createSpaceProvider } from './spaceProvider'
import { createEntitlementService } from './entitlementService'

describe('SpaceProvider', () => {
  let spaceProvider: ReturnType<typeof createSpaceProvider>
  let entitlementService: ReturnType<typeof createEntitlementService>

  beforeEach(() => {
    entitlementService = createEntitlementService()
    spaceProvider = createSpaceProvider(entitlementService)
  })

  it('should create a space and grant entitlement', () => {
    const space = spaceProvider.createSpace('user-123', '学习搭子', 'study_buddy')

    expect(space.id).toBeDefined()
    expect(space.name).toBe('学习搭子')
    expect(space.type).toBe('study_buddy')
    expect(space.ownerId).toBe('user-123')
    expect(space.memberIds).toContain('user-123')
    expect(entitlementService.has('user-123', 'space', space.id)).toBe(true)
  })

  it('should set correct max members for each space type', () => {
    const coupleSpace = spaceProvider.createSpace('user-1', '情侣空间', 'couple')
    expect(coupleSpace.maxMembers).toBe(2)

    const familySpace = spaceProvider.createSpace('user-2', '家庭空间', 'family')
    expect(familySpace.maxMembers).toBe(6)

    const studySpace = spaceProvider.createSpace('user-3', '学习搭子', 'study_buddy')
    expect(studySpace.maxMembers).toBe(5)

    const selfSpace = spaceProvider.createSpace('user-4', '自律空间', 'self_discipline')
    expect(selfSpace.maxMembers).toBe(10)
  })

  it('should allow user to join space', () => {
    const space = spaceProvider.createSpace('user-123', '学习搭子', 'study_buddy')
    spaceProvider.joinSpace(space.id, 'user-456')

    const updated = spaceProvider.getSpace(space.id)
    expect(updated?.memberIds).toContain('user-456')
  })

  it('should not allow duplicate join', () => {
    const space = spaceProvider.createSpace('user-123', '学习搭子', 'study_buddy')

    expect(() => spaceProvider.joinSpace(space.id, 'user-123')).toThrow('Already a member')
  })

  it('should not allow join when space is full', () => {
    const space = spaceProvider.createSpace('user-123', '二人空间', 'couple')
    spaceProvider.joinSpace(space.id, 'user-456')

    expect(() => spaceProvider.joinSpace(space.id, 'user-789')).toThrow('Space is full')
  })

  it('should allow member to leave space', () => {
    const space = spaceProvider.createSpace('user-123', '学习搭子', 'study_buddy')
    spaceProvider.joinSpace(space.id, 'user-456')

    spaceProvider.leaveSpace(space.id, 'user-456')

    const updated = spaceProvider.getSpace(space.id)
    expect(updated?.memberIds).not.toContain('user-456')
  })

  it('should not allow owner to leave space', () => {
    const space = spaceProvider.createSpace('user-123', '学习搭子', 'study_buddy')

    expect(() => spaceProvider.leaveSpace(space.id, 'user-123')).toThrow('Owner cannot leave space')
  })

  it('should allow owner to remove member', () => {
    const space = spaceProvider.createSpace('user-123', '学习搭子', 'study_buddy')
    spaceProvider.joinSpace(space.id, 'user-456')

    spaceProvider.removeMember(space.id, 'user-123', 'user-456')

    const updated = spaceProvider.getSpace(space.id)
    expect(updated?.memberIds).not.toContain('user-456')
  })

  it('should not allow non-owner to remove member', () => {
    const space = spaceProvider.createSpace('user-123', '学习搭子', 'study_buddy')
    spaceProvider.joinSpace(space.id, 'user-456')

    expect(() => spaceProvider.removeMember(space.id, 'user-456', 'user-123')).toThrow('Only owner can remove members')
  })

  it('should get user owned spaces', () => {
    spaceProvider.createSpace('user-123', '空间1', 'study_buddy')
    spaceProvider.createSpace('user-123', '空间2', 'couple')

    const spaces = spaceProvider.getUserSpaces('user-123')
    expect(spaces).toHaveLength(2)
  })

  it('should get all spaces user is member of', () => {
    const space = spaceProvider.createSpace('user-123', '学习搭子', 'study_buddy')
    spaceProvider.joinSpace(space.id, 'user-456')

    const spaces = spaceProvider.getMemberSpaces('user-456')
    expect(spaces).toHaveLength(1)
  })

  it('should check if user is space member', () => {
    const space = spaceProvider.createSpace('user-123', '学习搭子', 'study_buddy')

    expect(spaceProvider.isSpaceMember('user-123', space.id)).toBe(true)
    expect(spaceProvider.isSpaceMember('user-456', space.id)).toBe(false)
  })

  it('should check if user has space entitlement', () => {
    spaceProvider.createSpace('user-123', '学习搭子', 'study_buddy')

    expect(spaceProvider.hasSpace('user-123')).toBe(true)
    expect(spaceProvider.hasSpace('user-456')).toBe(false)
  })
})
