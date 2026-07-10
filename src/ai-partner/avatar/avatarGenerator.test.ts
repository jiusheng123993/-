import { describe, it, expect, beforeEach } from 'vitest'
import { createAvatarGenerator } from './avatarGenerator'
import { createAvatarStore } from './avatarStore'

describe('avatarGenerator', () => {
  let store: ReturnType<typeof createAvatarStore>
  let generator: ReturnType<typeof createAvatarGenerator>

  beforeEach(() => {
    localStorage.clear()
    store = createAvatarStore()
    generator = createAvatarGenerator()
  })

  describe('createFromParts', () => {
    it('should create avatar from parts', () => {
      const result = generator.createFromParts({
        userId: 'user1',
        name: 'My Avatar',
        renderMode: '2d_sticker',
        parts: {
          face: 'face_default',
          hair: 'hair_short'
        }
      })

      expect(result.success).toBe(true)
      expect(result.avatar).toBeDefined()
      expect(result.avatar!.name).toBe('My Avatar')
      expect(result.avatar!.source).toBe('user_upload')
    })

    it('should fail when name is empty', () => {
      const result = generator.createFromParts({
        userId: 'user1',
        name: '',
        renderMode: '2d_sticker'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should fail when name exceeds max length', () => {
      const result = generator.createFromParts({
        userId: 'user1',
        name: 'a'.repeat(100),
        renderMode: '2d_sticker'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should fail when max avatars reached', () => {
      for (let i = 0; i < 10; i++) {
        store.createAvatar({
          userId: 'user1',
          name: `Avatar ${i}`,
          source: 'builtin',
          renderMode: '2d_sticker',
          thumbnailUrl: `t${i}.png`
        })
      }

      const result = generator.createFromParts({
        userId: 'user1',
        name: 'Overflow',
        renderMode: '2d_sticker'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('最大角色数量')
    })

    it('should add default idle animation', () => {
      const result = generator.createFromParts({
        userId: 'user1',
        name: 'Test Avatar',
        renderMode: '2d_sticker'
      })

      expect(result.success).toBe(true)
      expect(result.avatar!.animations).toHaveLength(1)
      expect(result.avatar!.animations[0].name).toBe('待机')
    })

    it('should add custom animations', () => {
      const result = generator.createFromParts({
        userId: 'user1',
        name: 'Test Avatar',
        renderMode: '2d_sticker',
        animations: ['anim_idle', 'anim_encourage']
      })

      expect(result.success).toBe(true)
      expect(result.avatar!.animations).toHaveLength(2)
    })
  })

  describe('customizeAvatar', () => {
    it('should update avatar name', () => {
      const avatar = store.createAvatar({
        userId: 'user1',
        name: 'Original',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 't.png'
      })

      const result = generator.customizeAvatar(avatar!.id, 'user1', { name: 'New Name' })

      expect(result.success).toBe(true)
      expect(result.avatar!.name).toBe('New Name')
    })

    it('should fail for non-existent avatar', () => {
      const result = generator.customizeAvatar('unknown', 'user1', { name: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('不存在')
    })

    it('should fail when updating name with invalid name', () => {
      const avatar = store.createAvatar({
        userId: 'user1',
        name: 'Original',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 't.png'
      })

      const result = generator.customizeAvatar(avatar!.id, 'user1', { name: '' })

      expect(result.success).toBe(false)
    })
  })

  describe('addAnimation', () => {
    it('should add animation to avatar', () => {
      const avatar = store.createAvatar({
        userId: 'user1',
        name: 'Test',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 't.png',
        animations: [{ name: 'idle', loop: true, trigger: 'auto' }]
      })

      const result = generator.addAnimation(avatar!.id, 'user1', 'anim_encourage')

      expect(result.success).toBe(true)
      expect(result.avatar!.animations).toHaveLength(2)
    })

    it('should fail for non-existent animation', () => {
      const avatar = store.createAvatar({
        userId: 'user1',
        name: 'Test',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 't.png'
      })

      const result = generator.addAnimation(avatar!.id, 'user1', 'anim_nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toContain('不存在')
    })

    it('should fail when adding duplicate animation', () => {
      const avatar = store.createAvatar({
        userId: 'user1',
        name: 'Test',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 't.png'
      })

      generator.addAnimation(avatar!.id, 'user1', 'anim_idle')
      const result = generator.addAnimation(avatar!.id, 'user1', 'anim_idle')

      expect(result.success).toBe(false)
      expect(result.error).toContain('已存在')
    })
  })

  describe('removeAnimation', () => {
    it('should remove animation from avatar', () => {
      const avatar = store.createAvatar({
        userId: 'user1',
        name: 'Test',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 't.png'
      })

      const result = generator.removeAnimation(avatar!.id, 'user1', 'anim_idle')

      expect(result.success).toBe(true)
      expect(result.avatar!.animations).toHaveLength(0)
    })
  })

  describe('addDecoration', () => {
    it('should add decoration to avatar', () => {
      const avatar = store.createAvatar({
        userId: 'user1',
        name: 'Test',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 't.png'
      })

      const result = generator.addDecoration(avatar!.id, 'user1', 'dec_star_badge')

      expect(result.success).toBe(true)
      expect(result.avatar!.evolution.unlockedDecorations).toContain('dec_star_badge')
    })

    it('should fail for non-existent decoration', () => {
      const avatar = store.createAvatar({
        userId: 'user1',
        name: 'Test',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 't.png'
      })

      const result = generator.addDecoration(avatar!.id, 'user1', 'dec_nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toContain('不存在')
    })
  })

  describe('removeDecoration', () => {
    it('should remove decoration from avatar', () => {
      const avatar = store.createAvatar({
        userId: 'user1',
        name: 'Test',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 't.png'
      })

      generator.addDecoration(avatar!.id, 'user1', 'dec_star_badge')
      const result = generator.removeDecoration(avatar!.id, 'user1', 'dec_star_badge')

      expect(result.success).toBe(true)
      expect(result.avatar!.evolution.unlockedDecorations).not.toContain('dec_star_badge')
    })
  })

  describe('addEffect', () => {
    it('should add effect to avatar', () => {
      const avatar = store.createAvatar({
        userId: 'user1',
        name: 'Test',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 't.png',
        evolution: {
          level: 2,
          unlockedDecorations: [],
          unlockedEffects: [],
          unlockedAnimations: ['idle'],
          totalFocusMinutes: 0,
          totalTasksCompleted: 0,
          streakDays: 0
        }
      })

      const result = generator.addEffect(avatar!.id, 'user1', 'eff_glow')

      expect(result.success).toBe(true)
      expect(result.avatar!.evolution.unlockedEffects).toContain('eff_glow')
    })
  })

  describe('removeEffect', () => {
    it('should remove effect from avatar', () => {
      const avatar = store.createAvatar({
        userId: 'user1',
        name: 'Test',
        source: 'builtin',
        renderMode: '2d_sticker',
        thumbnailUrl: 't.png'
      })

      generator.addEffect(avatar!.id, 'user1', 'eff_glow')
      const result = generator.removeEffect(avatar!.id, 'user1', 'eff_glow')

      expect(result.success).toBe(true)
      expect(result.avatar!.evolution.unlockedEffects).not.toContain('eff_glow')
    })
  })

  describe('getAvailableParts', () => {
    it('should return parts unlocked for level 1', () => {
      const parts = generator.getAvailableParts(1)

      expect(parts.face).toBeDefined()
      expect(parts.hair).toBeDefined()
      expect(parts.body).toBeDefined()
    })

    it('should return more parts at higher levels', () => {
      const partsLevel1 = generator.getAvailableParts(1)
      const partsLevel10 = generator.getAvailableParts(10)

      expect(partsLevel10.hair!.length).toBeGreaterThanOrEqual(partsLevel1.hair!.length)
    })
  })

  describe('getAvailableAnimations', () => {
    it('should return animations unlocked for level', () => {
      const animations = generator.getAvailableAnimations(1)

      expect(animations.length).toBeGreaterThan(0)
      expect(animations.some(a => a.id === 'anim_idle')).toBe(true)
    })

    it('should return more animations at higher levels', () => {
      const animsLevel1 = generator.getAvailableAnimations(1)
      const animsLevel10 = generator.getAvailableAnimations(10)

      expect(animsLevel10.length).toBeGreaterThanOrEqual(animsLevel1.length)
    })
  })

  describe('getAvailableDecorations', () => {
    it('should return decorations unlocked for level', () => {
      const decorations = generator.getAvailableDecorations(1)

      expect(decorations.length).toBeGreaterThan(0)
    })
  })
})
