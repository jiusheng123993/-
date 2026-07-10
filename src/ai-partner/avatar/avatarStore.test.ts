import { describe, it, expect, beforeEach } from 'vitest'
import { createAvatarStore } from './avatarStore'

describe('avatarStore', () => {
  let store: ReturnType<typeof createAvatarStore>

  beforeEach(() => {
    localStorage.clear()
    store = createAvatarStore()
  })

  describe('createAvatar', () => {
    it('should create avatar and return it', () => {
      const avatar = store.createAvatar({
        userId: 'user1',
        name: 'Test Avatar',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 'test_thumb.png'
      })
      expect(avatar).not.toBeNull()
      expect(avatar!.name).toBe('Test Avatar')
      expect(avatar!.userId).toBe('user1')
      expect(avatar!.source).toBe('builtin')
      expect(avatar!.evolution.level).toBe(1)
    })

    it('should return null when max avatars reached', () => {
      for (let i = 0; i < 10; i++) {
        store.createAvatar({
          userId: 'user1',
          name: `Avatar ${i}`,
          source: 'builtin',
          renderMode: '2d_sticker',
          thumbnailUrl: `thumb_${i}.png`
        })
      }
      const result = store.createAvatar({
        userId: 'user1',
        name: 'Overflow',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 'overflow.png'
      })
      expect(result).toBeNull()
    })

    it('should allow different users to have separate avatars', () => {
      store.createAvatar({ userId: 'user1', name: 'A1', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't1.png' })
      store.createAvatar({ userId: 'user2', name: 'A2', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't2.png' })
      expect(store.getAvatars('user1')).toHaveLength(1)
      expect(store.getAvatars('user2')).toHaveLength(1)
    })
  })

  describe('getAvatars', () => {
    it('should return empty array for new user', () => {
      expect(store.getAvatars('user1')).toEqual([])
    })

    it('should return only user avatars', () => {
      store.createAvatar({ userId: 'user1', name: 'A1', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't1.png' })
      store.createAvatar({ userId: 'user1', name: 'A2', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't2.png' })
      store.createAvatar({ userId: 'user2', name: 'A3', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't3.png' })
      expect(store.getAvatars('user1')).toHaveLength(2)
    })
  })

  describe('getAvatarById', () => {
    it('should return avatar by id', () => {
      const avatar = store.createAvatar({ userId: 'user1', name: 'Test', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't.png' })
      const found = store.getAvatarById(avatar!.id)
      expect(found).toBeDefined()
      expect(found!.id).toBe(avatar!.id)
    })

    it('should return undefined for unknown id', () => {
      expect(store.getAvatarById('unknown')).toBeUndefined()
    })
  })

  describe('updateAvatar', () => {
    it('should update avatar fields', () => {
      const avatar = store.createAvatar({ userId: 'user1', name: 'Test', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't.png' })
      const updated = store.updateAvatar(avatar!.id, { name: 'Updated' })
      expect(updated!.name).toBe('Updated')
    })
  })

  describe('deleteAvatar', () => {
    it('should delete avatar', () => {
      const avatar = store.createAvatar({ userId: 'user1', name: 'Test', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't.png' })
      expect(store.deleteAvatar(avatar!.id)).toBe(true)
      expect(store.getAvatarById(avatar!.id)).toBeUndefined()
    })

    it('should return false for unknown id', () => {
      expect(store.deleteAvatar('unknown')).toBe(false)
    })
  })

  describe('setActiveAvatar', () => {
    it('should set active avatar for user', () => {
      const avatar = store.createAvatar({ userId: 'user1', name: 'Test', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't.png' })
      store.setActiveAvatar('user1', avatar!.id)
      expect(store.getActiveAvatar('user1')!.id).toBe(avatar!.id)
    })

    it('should return undefined for other user avatar', () => {
      const avatar = store.createAvatar({ userId: 'user1', name: 'Test', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't.png' })
      const result = store.setActiveAvatar('user2', avatar!.id)
      expect(result).toBeUndefined()
    })
  })

  describe('updateEvolution', () => {
    it('should update evolution stats', () => {
      const avatar = store.createAvatar({ userId: 'user1', name: 'Test', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't.png' })
      const updated = store.updateEvolution(avatar!.id, { totalFocusMinutes: 120, totalTasksCompleted: 5 })
      expect(updated!.evolution.totalFocusMinutes).toBe(120)
      expect(updated!.evolution.totalTasksCompleted).toBe(5)
    })
  })

  describe('animations', () => {
    it('should add animation', () => {
      const avatar = store.createAvatar({ userId: 'user1', name: 'Test', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't.png' })
      const updated = store.addAnimation(avatar!.id, { name: 'wave', loop: false, trigger: 'user_action' })
      expect(updated!.animations).toHaveLength(1)
      expect(updated!.animations[0].name).toBe('wave')
    })

    it('should not add duplicate animation', () => {
      const avatar = store.createAvatar({ userId: 'user1', name: 'Test', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't.png' })
      store.addAnimation(avatar!.id, { name: 'wave', loop: false, trigger: 'user_action' })
      const result = store.addAnimation(avatar!.id, { name: 'wave', loop: true, trigger: 'auto' })
      expect(result).toBeUndefined()
    })

    it('should remove animation', () => {
      const avatar = store.createAvatar({ userId: 'user1', name: 'Test', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't.png' })
      store.addAnimation(avatar!.id, { name: 'wave', loop: false, trigger: 'user_action' })
      const updated = store.removeAnimation(avatar!.id, 'wave')
      expect(updated!.animations).toHaveLength(0)
    })
  })

  describe('generation requests', () => {
    it('should create generation request', () => {
      const request = store.createGenerationRequest({
        userId: 'user1',
        prompt: 'A cute cat avatar',
        renderMode: '2d_sticker',
        style: 'anime'
      })
      expect(request.userId).toBe('user1')
      expect(request.status).toBe('pending')
    })

    it('should update generation status', () => {
      const request = store.createGenerationRequest({
        userId: 'user1',
        prompt: 'Test',
        renderMode: '2d_sticker'
      })
      const updated = store.updateGenerationStatus(request.id, 'processing')
      expect(updated!.status).toBe('processing')
    })

    it('should track monthly generation count', () => {
      store.createGenerationRequest({ userId: 'user1', prompt: 'Test1', renderMode: '2d_sticker' })
      store.createGenerationRequest({ userId: 'user1', prompt: 'Test2', renderMode: '2d_sticker' })
      store.createGenerationRequest({ userId: 'user2', prompt: 'Test3', renderMode: '2d_sticker' })
      expect(store.getMonthlyGenerationCount('user1')).toBe(2)
      expect(store.getMonthlyGenerationCount('user2')).toBe(1)
    })
  })

  describe('persistence', () => {
    it('should persist avatars to localStorage', () => {
      store.createAvatar({ userId: 'user1', name: 'Test', source: 'builtin', renderMode: '2d_sticker', thumbnailUrl: 't.png' })
      const raw = localStorage.getItem('xinghuanhai_avatars')
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw!)
      expect(parsed).toHaveLength(1)
    })

    it('should persist generation requests', () => {
      store.createGenerationRequest({ userId: 'user1', prompt: 'Test', renderMode: '2d_sticker' })
      const raw = localStorage.getItem('xinghuanhai_avatar_generations')
      expect(raw).not.toBeNull()
    })
  })
})
