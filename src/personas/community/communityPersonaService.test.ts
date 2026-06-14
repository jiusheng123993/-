import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCommunityPersonaService } from './communityPersonaService'
import type {
  ICommunityPersonaService,
  CommunityPersonaServiceConfig
} from './communityPersonaService'
import type { CustomPersona, CustomPersonaInput } from '../customPersona'
import type { PersonaSafetyGate, SafetyCheckResult } from '../personaSafetyGate'

function makePassingSafetyGate(): PersonaSafetyGate {
  return {
    validateIdentityRole: vi.fn().mockReturnValue({ ok: true } as SafetyCheckResult),
    validateName: vi.fn().mockReturnValue({ ok: true } as SafetyCheckResult),
    validateAddressing: vi.fn().mockReturnValue({ ok: true } as SafetyCheckResult),
    validateContent: vi.fn().mockReturnValue({ ok: true } as SafetyCheckResult),
    validateDialogue: vi.fn().mockReturnValue({ ok: true } as SafetyCheckResult),
    checkConversationHealth: vi.fn().mockReturnValue({ ok: true } as SafetyCheckResult)
  }
}

function makePersona(overrides: Partial<CustomPersona> = {}): CustomPersona {
  return {
    id: 'custom-test-1',
    name: '测试Persona',
    targetUser: '测试用户',
    painPoint: '测试痛点',
    primaryFlow: '测试流程',
    hero: '测试英雄',
    mainModuleTitle: '测试主模块',
    sideModuleTitle: '测试副模块',
    aiRole: 'AI测试角色',
    keyMetrics: ['指标1', '指标2'],
    modules: [{ id: 'mod-1', title: '模块1', description: '描述1', signal: '信号1' }],
    aiActions: ['daily-plan'],
    recommendedThemeId: 'minimal-premium',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides
  }
}

function createSut(overrides: Partial<CommunityPersonaServiceConfig> = {}): ICommunityPersonaService {
  const persona = makePersona()
  return createCommunityPersonaService({
    safetyGate: makePassingSafetyGate(),
    getCustomPersonaById: vi.fn().mockReturnValue(persona),
    getCustomPersonasByUser: vi.fn().mockReturnValue([persona]),
    addCustomPersona: vi.fn((input: CustomPersonaInput) => ({
      ...input,
      id: `custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })),
    ...overrides
  })
}

describe('communityPersonaService', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  describe('publish', () => {
    it('should publish a persona to community', async () => {
      const sut = createSut()

      const result = await sut.publish('user-1', 'custom-test-1', 'public')

      expect(result.ok).toBe(true)
      expect(result.entryId).toBeDefined()
      expect(result.entryId).toMatch(/^comm-/)
    })

    it('should reject publish when persona not found', async () => {
      const sut = createCommunityPersonaService({
        safetyGate: makePassingSafetyGate(),
        getCustomPersonaById: vi.fn().mockReturnValue(undefined),
        getCustomPersonasByUser: vi.fn().mockReturnValue([]),
        addCustomPersona: vi.fn()
      })

      const result = await sut.publish('user-1', 'nonexistent', 'public')

      expect(result.ok).toBe(false)
      expect(result.rejectedReasons).toContain('Persona不存在')
    })

    it('should reject publish when persona name fails safety check', async () => {
      const sut = createCommunityPersonaService({
        safetyGate: {
          ...makePassingSafetyGate(),
          validateName: vi.fn().mockReturnValue({
            ok: false,
            reason: '名称包含违规关键词: 女友'
          } as SafetyCheckResult)
        },
        getCustomPersonaById: vi.fn().mockReturnValue(makePersona({ name: '女友' })),
        getCustomPersonasByUser: vi.fn().mockReturnValue([]),
        addCustomPersona: vi.fn()
      })

      const result = await sut.publish('user-1', 'custom-test-1', 'public')

      expect(result.ok).toBe(false)
      expect(result.rejectedReasons).toContain('名称包含违规关键词: 女友')
    })

    it('should reject publish when content fails safety check', async () => {
      const sut = createCommunityPersonaService({
        safetyGate: {
          ...makePassingSafetyGate(),
          validateContent: vi.fn().mockReturnValue({
            ok: false,
            reason: '内容包含违规关键词'
          } as SafetyCheckResult)
        },
        getCustomPersonaById: vi.fn().mockReturnValue(makePersona()),
        getCustomPersonasByUser: vi.fn().mockReturnValue([]),
        addCustomPersona: vi.fn()
      })

      const result = await sut.publish('user-1', 'custom-test-1', 'public')

      expect(result.ok).toBe(false)
      expect(result.rejectedReasons).toContain('内容包含违规关键词')
    })

    it('should reject duplicate publish', async () => {
      const sut = createSut()

      await sut.publish('user-1', 'custom-test-1', 'public')
      const result = await sut.publish('user-1', 'custom-test-1', 'public')

      expect(result.ok).toBe(false)
      expect(result.rejectedReasons).toContain('该Persona已发布')
    })

    it('should reject publish when creator is banned', async () => {
      const sut = createSut()

      await sut.publish('user-1', 'custom-test-1', 'public')

      const entry = (await sut.list({ limit: 1 }))[0]
      await sut.report('reporter-1', entry.id, 'inappropriate_persona')
      await sut.report('reporter-2', entry.id, 'plagiarism')
      await sut.report('reporter-3', entry.id, 'impersonation')

      const result = await sut.publish('user-1', 'custom-test-1', 'public')

      expect(result.ok).toBe(false)
      expect(result.rejectedReasons).toContain('您的创作者权限已被封禁')
    })
  })

  describe('unpublish', () => {
    it('should unpublish own persona', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')

      const result = await sut.unpublish('user-1', pubResult.entryId!)

      expect(result.ok).toBe(true)
    })

    it('should reject unpublish by non-owner', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')

      const result = await sut.unpublish('user-2', pubResult.entryId!)

      expect(result.ok).toBe(false)
      expect(result.reason).toContain('无权下架')
    })

    it('should reject unpublish nonexistent entry', async () => {
      const sut = createSut()

      const result = await sut.unpublish('user-1', 'nonexistent')

      expect(result.ok).toBe(false)
      expect(result.reason).toContain('不存在')
    })
  })

  describe('list', () => {
    it('should list published entries sorted by hot by default', async () => {
      const sut = createSut()
      await sut.publish('user-1', 'custom-test-1', 'public')

      const entries = await sut.list()

      expect(entries.length).toBeGreaterThanOrEqual(1)
      expect(entries[0].reviewStatus).toBe('approved')
    })

    it('should filter out removed entries', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')
      await sut.unpublish('user-1', pubResult.entryId!)

      const entries = await sut.list()

      expect(entries.every(e => e.reviewStatus === 'approved')).toBe(true)
    })

    it('should sort by new', async () => {
      const sut = createSut()
      await sut.publish('user-1', 'custom-test-1', 'public')

      const entries = await sut.list({ sort: 'new' })

      expect(entries.length).toBeGreaterThanOrEqual(1)
    })

    it('should sort by top_rated', async () => {
      const sut = createSut()
      await sut.publish('user-1', 'custom-test-1', 'public')

      const entries = await sut.list({ sort: 'top_rated' })

      expect(entries.length).toBeGreaterThanOrEqual(1)
    })

    it('should support search filter', async () => {
      const sut = createSut()
      await sut.publish('user-1', 'custom-test-1', 'public')

      const entries = await sut.list({ search: '测试' })

      expect(entries.length).toBeGreaterThanOrEqual(1)
    })

    it('should return empty for non-matching search', async () => {
      const sut = createSut()
      await sut.publish('user-1', 'custom-test-1', 'public')

      const entries = await sut.list({ search: '不存在的关键词xyz' })

      expect(entries.length).toBe(0)
    })

    it('should respect limit and offset', async () => {
      const sut = createSut()
      await sut.publish('user-1', 'custom-test-1', 'public')

      const entries = await sut.list({ limit: 1, offset: 0 })

      expect(entries.length).toBeLessThanOrEqual(1)
    })
  })

  describe('getById', () => {
    it('should return entry by id', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')

      const entry = sut.getById(pubResult.entryId!)

      expect(entry).toBeDefined()
      expect(entry!.id).toBe(pubResult.entryId)
    })

    it('should return undefined for nonexistent entry', () => {
      const sut = createSut()

      const entry = sut.getById('nonexistent')

      expect(entry).toBeUndefined()
    })
  })

  describe('importToMy', () => {
    it('should import a community persona', async () => {
      const addCustomPersonaSpy = vi.fn((input: CustomPersonaInput) => ({
        ...input,
        id: `custom-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      const sut = createCommunityPersonaService({
        safetyGate: makePassingSafetyGate(),
        getCustomPersonaById: vi.fn().mockReturnValue(makePersona()),
        getCustomPersonasByUser: vi.fn().mockReturnValue([]),
        addCustomPersona: addCustomPersonaSpy
      })

      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')
      const result = await sut.importToMy('user-2', pubResult.entryId!)

      expect(result.ok).toBe(true)
      expect(result.createdPersonaId).toBeDefined()
      expect(addCustomPersonaSpy).toHaveBeenCalled()
    })

    it('should reject import of nonexistent entry', async () => {
      const sut = createSut()

      const result = await sut.importToMy('user-1', 'nonexistent')

      expect(result.ok).toBe(false)
      expect(result.reason).toContain('不存在')
    })

    it('should reject import of removed entry', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')
      await sut.unpublish('user-1', pubResult.entryId!)

      const result = await sut.importToMy('user-2', pubResult.entryId!)

      expect(result.ok).toBe(false)
      expect(result.reason).toContain('已下架')
    })

    it('should increment import count', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')

      await sut.importToMy('user-2', pubResult.entryId!)

      const entry = sut.getById(pubResult.entryId!)
      expect(entry!.importCount).toBe(1)
    })
  })

  describe('report', () => {
    it('should report a community persona', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')

      const result = await sut.report('reporter-1', pubResult.entryId!, 'inappropriate_persona', '违规内容描述')

      expect(result.ok).toBe(true)
    })

    it('should reject duplicate report from same user', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')

      await sut.report('reporter-1', pubResult.entryId!, 'inappropriate_persona')
      const result = await sut.report('reporter-1', pubResult.entryId!, 'plagiarism')

      expect(result.ok).toBe(false)
      expect(result.reason).toContain('已举报')
    })

    it('should increment report count on entry', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')

      await sut.report('reporter-1', pubResult.entryId!, 'inappropriate_persona')

      const entry = sut.getById(pubResult.entryId!)
      expect(entry!.reportCount).toBe(1)
    })

    it('should apply penalty strike to creator', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')

      await sut.report('reporter-1', pubResult.entryId!, 'inappropriate_persona')

      const penalty = sut.getCreatorPenalty('user-1')
      expect(penalty.strikeCount).toBe(1)
      expect(penalty.banned).toBe(false)
    })

    it('should ban creator after 3 strikes', async () => {
      const sut = createSut()

      await sut.publish('user-1', 'custom-test-1', 'public')
      const entry = (await sut.list({ limit: 1 }))[0]

      await sut.report('r1', entry.id, 'inappropriate_persona')
      await sut.report('r2', entry.id, 'plagiarism')
      await sut.report('r3', entry.id, 'impersonation')

      const penalty = sut.getCreatorPenalty('user-1')
      expect(penalty.strikeCount).toBe(3)
      expect(penalty.banned).toBe(true)
      expect(penalty.bannedAt).toBeDefined()
    })

    it('should reject report for nonexistent entry', async () => {
      const sut = createSut()

      const result = await sut.report('reporter-1', 'nonexistent', 'other')

      expect(result.ok).toBe(false)
      expect(result.reason).toContain('不存在')
    })
  })

  describe('rate', () => {
    it('should rate a community persona', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')

      const result = await sut.rate('user-2', pubResult.entryId!, 4)

      expect(result.ok).toBe(true)
    })

    it('should reject self-rating', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')

      const result = await sut.rate('user-1', pubResult.entryId!, 5)

      expect(result.ok).toBe(false)
      expect(result.reason).toContain('不能给自己的Persona评分')
    })

    it('should update existing rating', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')

      await sut.rate('user-2', pubResult.entryId!, 3)
      await sut.rate('user-2', pubResult.entryId!, 5)

      const rating = sut.getUserRating('user-2', pubResult.entryId!)
      expect(rating!.score).toBe(5)
    })

    it('should update entry rating average', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')

      await sut.rate('user-2', pubResult.entryId!, 4)
      await sut.rate('user-3', pubResult.entryId!, 2)

      const entry = sut.getById(pubResult.entryId!)
      expect(entry!.ratingCount).toBe(2)
      expect(entry!.ratingAverage).toBe(3)
    })

    it('should reject rating for nonexistent entry', async () => {
      const sut = createSut()

      const result = await sut.rate('user-1', 'nonexistent', 3)

      expect(result.ok).toBe(false)
      expect(result.reason).toContain('不存在')
    })
  })

  describe('getReports', () => {
    it('should return reports for an entry', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')
      await sut.report('reporter-1', pubResult.entryId!, 'inappropriate_persona')

      const reports = sut.getReports(pubResult.entryId!)

      expect(reports.length).toBe(1)
      expect(reports[0].reason).toBe('inappropriate_persona')
    })

    it('should return empty array for entry with no reports', () => {
      const sut = createSut()

      const reports = sut.getReports('nonexistent')

      expect(reports).toEqual([])
    })
  })

  describe('getRatings', () => {
    it('should return ratings for an entry', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')
      await sut.rate('user-2', pubResult.entryId!, 4)

      const ratings = sut.getRatings(pubResult.entryId!)

      expect(ratings.length).toBe(1)
      expect(ratings[0].score).toBe(4)
    })
  })

  describe('getUserRating', () => {
    it('should return user rating', async () => {
      const sut = createSut()
      const pubResult = await sut.publish('user-1', 'custom-test-1', 'public')
      await sut.rate('user-2', pubResult.entryId!, 4)

      const rating = sut.getUserRating('user-2', pubResult.entryId!)

      expect(rating).toBeDefined()
      expect(rating!.score).toBe(4)
    })

    it('should return undefined for unrated entry', () => {
      const sut = createSut()

      const rating = sut.getUserRating('user-1', 'nonexistent')

      expect(rating).toBeUndefined()
    })
  })

  describe('getCreatorPenalty', () => {
    it('should return default penalty for new user', () => {
      const sut = createSut()

      const penalty = sut.getCreatorPenalty('new-user')

      expect(penalty.strikeCount).toBe(0)
      expect(penalty.banned).toBe(false)
    })
  })

  describe('search', () => {
    it('should search entries by display name', async () => {
      const sut = createSut()
      await sut.publish('user-1', 'custom-test-1', 'public')

      const results = await sut.search('测试')

      expect(results.length).toBeGreaterThanOrEqual(1)
    })

    it('should return empty for non-matching search', async () => {
      const sut = createSut()
      await sut.publish('user-1', 'custom-test-1', 'public')

      const results = await sut.search('不存在的关键词xyz')

      expect(results.length).toBe(0)
    })
  })
})
