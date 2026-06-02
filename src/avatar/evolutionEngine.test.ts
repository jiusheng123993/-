import { describe, it, expect } from 'vitest'
import {
  checkEvolutionRules,
  applyEvolutionRewards,
  updateEvolutionStats,
  getEvolutionProgress
} from './evolutionEngine'
import type { AvatarDefinition } from './avatarTypes'
import { DEFAULT_AVATAR_EVOLUTION } from './avatarTypes'

function createMockAvatar(overrides: Partial<AvatarDefinition> = {}): AvatarDefinition {
  return {
    id: 'av_test',
    userId: 'user1',
    name: 'Test Avatar',
    source: 'builtin',
    renderMode: '2d_sticker',
    thumbnailUrl: 'test.png',
    evolution: { ...DEFAULT_AVATAR_EVOLUTION },
    animations: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides
  }
}

describe('evolutionEngine', () => {
  describe('checkEvolutionRules', () => {
    it('should return empty for new avatar', () => {
      const avatar = createMockAvatar()
      const result = checkEvolutionRules(avatar)
      expect(result.newlyUnlocked).toEqual([])
      expect(result.newLevel).toBe(1)
    })

    it('should detect unlocked focus rule', () => {
      const avatar = createMockAvatar({
        evolution: { ...DEFAULT_AVATAR_EVOLUTION, totalFocusMinutes: 60 }
      })
      const result = checkEvolutionRules(avatar)
      expect(result.newlyUnlocked.some(r => r.id === 'evo_1')).toBe(true)
    })

    it('should detect unlocked task rule', () => {
      const avatar = createMockAvatar({
        evolution: { ...DEFAULT_AVATAR_EVOLUTION, totalTasksCompleted: 10 }
      })
      const result = checkEvolutionRules(avatar)
      expect(result.newlyUnlocked.some(r => r.id === 'evo_3')).toBe(true)
    })

    it('should detect unlocked streak rule', () => {
      const avatar = createMockAvatar({
        evolution: { ...DEFAULT_AVATAR_EVOLUTION, streakDays: 7 }
      })
      const result = checkEvolutionRules(avatar)
      expect(result.newlyUnlocked.some(r => r.id === 'evo_5')).toBe(true)
    })

    it('should not return already claimed rules', () => {
      const avatar = createMockAvatar({
        evolution: {
          ...DEFAULT_AVATAR_EVOLUTION,
          totalFocusMinutes: 60,
          unlockedDecorations: ['dec_star_badge']
        }
      })
      const result = checkEvolutionRules(avatar)
      expect(result.newlyUnlocked.some(r => r.id === 'evo_1')).toBe(false)
    })

    it('should detect multiple unlocked rules', () => {
      const avatar = createMockAvatar({
        evolution: {
          ...DEFAULT_AVATAR_EVOLUTION,
          totalFocusMinutes: 300,
          totalTasksCompleted: 10,
          streakDays: 7
        }
      })
      const result = checkEvolutionRules(avatar)
      expect(result.newlyUnlocked.length).toBeGreaterThanOrEqual(3)
    })

    it('should calculate level based on stats', () => {
      const avatar = createMockAvatar({
        evolution: {
          ...DEFAULT_AVATAR_EVOLUTION,
          totalFocusMinutes: 120,
          totalTasksCompleted: 10,
          streakDays: 7
        }
      })
      const result = checkEvolutionRules(avatar)
      expect(result.newLevel).toBeGreaterThan(1)
    })
  })

  describe('applyEvolutionRewards', () => {
    it('should add decoration rewards', () => {
      const avatar = createMockAvatar()
      const rewards = [{
        id: 'evo_1',
        trigger: { type: 'focus_minutes' as const, threshold: 60 },
        reward: { type: 'decoration' as const, assetId: 'dec_star_badge', name: '星标徽章', description: '专注1小时解锁' }
      }]
      const evolution = applyEvolutionRewards(avatar, rewards)
      expect(evolution.unlockedDecorations).toContain('dec_star_badge')
    })

    it('should add effect rewards', () => {
      const avatar = createMockAvatar()
      const rewards = [{
        id: 'evo_2',
        trigger: { type: 'focus_minutes' as const, threshold: 300 },
        reward: { type: 'effect' as const, assetId: 'eff_glow', name: '光晕效果', description: '专注5小时解锁' }
      }]
      const evolution = applyEvolutionRewards(avatar, rewards)
      expect(evolution.unlockedEffects).toContain('eff_glow')
    })

    it('should add animation rewards', () => {
      const avatar = createMockAvatar()
      const rewards = [{
        id: 'evo_4',
        trigger: { type: 'tasks_completed' as const, threshold: 50 },
        reward: { type: 'animation' as const, assetId: 'anim_celebrate', name: '庆祝动画', description: '完成50个任务解锁' }
      }]
      const evolution = applyEvolutionRewards(avatar, rewards)
      expect(evolution.unlockedAnimations).toContain('anim_celebrate')
    })

    it('should not add duplicate rewards', () => {
      const avatar = createMockAvatar({
        evolution: { ...DEFAULT_AVATAR_EVOLUTION, unlockedDecorations: ['dec_star_badge'] }
      })
      const rewards = [{
        id: 'evo_1',
        trigger: { type: 'focus_minutes' as const, threshold: 60 },
        reward: { type: 'decoration' as const, assetId: 'dec_star_badge', name: '星标徽章', description: '' }
      }]
      const evolution = applyEvolutionRewards(avatar, rewards)
      expect(evolution.unlockedDecorations.filter(d => d === 'dec_star_badge')).toHaveLength(1)
    })
  })

  describe('updateEvolutionStats', () => {
    it('should add focus minutes', () => {
      const avatar = createMockAvatar()
      const evolution = updateEvolutionStats(avatar, { focusMinutes: 25 })
      expect(evolution.totalFocusMinutes).toBe(25)
    })

    it('should add task completions', () => {
      const avatar = createMockAvatar({
        evolution: { ...DEFAULT_AVATAR_EVOLUTION, totalTasksCompleted: 5 }
      })
      const evolution = updateEvolutionStats(avatar, { tasksCompleted: 3 })
      expect(evolution.totalTasksCompleted).toBe(8)
    })

    it('should set streak days', () => {
      const avatar = createMockAvatar()
      const evolution = updateEvolutionStats(avatar, { streakDays: 10 })
      expect(evolution.streakDays).toBe(10)
    })

    it('should preserve existing stats when not updated', () => {
      const avatar = createMockAvatar({
        evolution: { ...DEFAULT_AVATAR_EVOLUTION, totalFocusMinutes: 100, totalTasksCompleted: 5 }
      })
      const evolution = updateEvolutionStats(avatar, { focusMinutes: 25 })
      expect(evolution.totalFocusMinutes).toBe(125)
      expect(evolution.totalTasksCompleted).toBe(5)
    })
  })

  describe('getEvolutionProgress', () => {
    it('should return progress for all rules', () => {
      const avatar = createMockAvatar()
      const progress = getEvolutionProgress(avatar)
      expect(progress.length).toBeGreaterThan(0)
      progress.forEach(p => {
        expect(p).toHaveProperty('rule')
        expect(p).toHaveProperty('current')
        expect(p).toHaveProperty('target')
        expect(p).toHaveProperty('percentage')
        expect(p).toHaveProperty('unlocked')
        expect(p.percentage).toBeGreaterThanOrEqual(0)
        expect(p.percentage).toBeLessThanOrEqual(100)
      })
    })

    it('should show 100% for unlocked rules', () => {
      const avatar = createMockAvatar({
        evolution: { ...DEFAULT_AVATAR_EVOLUTION, totalFocusMinutes: 60 }
      })
      const progress = getEvolutionProgress(avatar)
      const evo1 = progress.find(p => p.rule.id === 'evo_1')
      expect(evo1!.percentage).toBe(100)
    })

    it('should show partial progress', () => {
      const avatar = createMockAvatar({
        evolution: { ...DEFAULT_AVATAR_EVOLUTION, totalFocusMinutes: 30 }
      })
      const progress = getEvolutionProgress(avatar)
      const evo1 = progress.find(p => p.rule.id === 'evo_1')
      expect(evo1!.percentage).toBe(50)
    })
  })
})
