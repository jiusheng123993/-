import { describe, it, expect } from 'vitest'
import type { MemoryProfile } from './memoryTypes'
import { createEmptyProfile, validateProfile, mergeProfiles, getProfileSummary, compressProfileToPrompt } from './memoryProfile'

const testScope = { userId: 'user-1', projectId: 'test' }

describe('MemoryProfile', () => {
  describe('createEmptyProfile', () => {
    it('should create profile with default values', () => {
      const profile = createEmptyProfile(testScope)
      
      expect(profile.version).toBe(1)
      expect(profile.scope).toEqual(testScope)
      expect(profile.identity).toEqual({})
      expect(profile.meta.totalEventsProcessed).toBe(0)
      expect(profile.meta.sourceBreakdown).toEqual({ manual: 0, conversation: 0, behavior: 0 })
    })
  })

  describe('validateProfile', () => {
    it('should return true for valid profile', () => {
      const profile = createEmptyProfile(testScope)
      expect(validateProfile(profile)).toBe(true)
    })

    it('should return false for null', () => {
      expect(validateProfile(null)).toBe(false)
    })

    it('should return false for missing version', () => {
      expect(validateProfile({ scope: testScope })).toBe(false)
    })
  })

  describe('mergeProfiles', () => {
    it('should merge identity updates', () => {
      const existing = createEmptyProfile(testScope)
      const updates = { identity: { nickname: '小明' } }
      
      const merged = mergeProfiles(existing, updates, 'manual')
      
      expect(merged.identity.nickname).toBe('小明')
      expect(merged.meta.sourceBreakdown.manual).toBe(1)
    })

    it('should preserve existing data when merging', () => {
      const existing: MemoryProfile = {
        ...createEmptyProfile(testScope),
        identity: { nickname: '小红' },
        personality: { mbtiTendency: 'MBTI_INTJ' },
      }
      const updates = { identity: { occupation: '学生' } }
      
      const merged = mergeProfiles(existing, updates, 'manual')
      
      expect(merged.identity.nickname).toBe('小红')
      expect(merged.identity.occupation).toBe('学生')
      expect(merged.personality.mbtiTendency).toBe('MBTI_INTJ')
    })
  })

  describe('getProfileSummary', () => {
    it('should return empty message for blank profile', () => {
      const profile = createEmptyProfile(testScope)
      expect(getProfileSummary(profile)).toBe('暂无画像信息')
    })

    it('should include filled fields', () => {
      const profile: MemoryProfile = {
        ...createEmptyProfile(testScope),
        identity: { nickname: '测试' },
        personality: { mbtiTendency: 'MBTI_ENFP' },
        goals: { primaryGoal: '考研' },
        rhythm: { energyPeak: 'morning' },
        emotional: { motivationLevel: 'high' },
      }
      
      const summary = getProfileSummary(profile)
      expect(summary).toContain('测试')
      expect(summary).toContain('MBTI_ENFP')
      expect(summary).toContain('考研')
    })
  })

  describe('compressProfileToPrompt', () => {
    it('should truncate long profiles', () => {
      const profile: MemoryProfile = {
        ...createEmptyProfile(testScope),
        identity: { nickname: 'A'.repeat(500) },
        personality: { mbtiTendency: 'MBTI_INTJ', selfDescription: 'B'.repeat(500) },
      }
      
      const compressed = compressProfileToPrompt(profile, 100)
      expect(compressed.length).toBeLessThan(200)
    })
  })
})
