import { describe, it, expect, vi } from 'vitest'
import { createPersonaAvatarGen } from './personaAvatarGen'
import type { PersonaAvatarGenConfig, IPersonaAvatarGen } from './personaAvatarGen'
import type { PersonaDefinition } from './personaScheduler'
import type { AvatarAiGenQuotaProvider } from '../../shared/entitlement/avatarAiGenProvider'
import type { IAvatarAIProvider } from '../avatar/avatarAIProvider'
import type { AvatarGenerationRequest } from '../avatar/avatarTypes'

function makePersona(overrides: Partial<PersonaDefinition> = {}): PersonaDefinition {
  return {
    id: 'test-persona-1',
    name: '测试学姐',
    category: 'preset',
    tone: ['gentle', 'caring'],
    shortDescription: '温柔体贴的学姐，陪伴你学习成长',
    identityRole: 'senior_student',
    systemPromptTemplate: '你是一个温柔的学姐...',
    ageRestriction: 'all',
    emotionalIntimacy: 'medium',
    tierRequired: 'free',
    unlockMethod: 'free',
    active: true,
    ...overrides
  }
}

function makeQuotaProvider(
  overrides: Partial<AvatarAiGenQuotaProvider> = {}
): AvatarAiGenQuotaProvider {
  return {
    consume: vi.fn().mockReturnValue({ ok: true, remaining: 9 }),
    getRemaining: vi.fn().mockReturnValue(10),
    getTotalUsed: vi.fn().mockReturnValue(0),
    ...overrides
  }
}

function makeAiProvider(
  overrides: Partial<IAvatarAIProvider> = {}
): IAvatarAIProvider {
  return {
    generate: vi.fn().mockResolvedValue({
      id: 'req-1',
      userId: 'user-1',
      prompt: 'test prompt',
      style: 'anime',
      renderMode: '2d_sticker',
      status: 'completed',
      result: {
        id: 'avatar-1',
        userId: 'user-1',
        name: 'AI角色',
        source: 'meshy_ai',
        renderMode: '2d_sticker',
        thumbnailUrl: 'https://example.com/thumb.png',
        stickerUrl: 'https://example.com/sticker.png',
        evolution: {
          level: 1,
          unlockedDecorations: [],
          unlockedEffects: [],
          unlockedAnimations: [],
          totalFocusMinutes: 0,
          totalTasksCompleted: 0,
          streakDays: 0
        },
        animations: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      createdAt: '2026-01-01T00:00:00Z'
    } as AvatarGenerationRequest),
    checkStatus: vi.fn(),
    cancel: vi.fn().mockReturnValue(true),
    ...overrides
  }
}

function createSut(
  overrides: Partial<PersonaAvatarGenConfig> = {}
): IPersonaAvatarGen {
  const persona = makePersona()
  return createPersonaAvatarGen({
    quotaProvider: makeQuotaProvider(),
    aiProvider: makeAiProvider(),
    getPersonaById: vi.fn().mockReturnValue(persona),
    ...overrides
  })
}

describe('personaAvatarGen', () => {
  describe('generate', () => {
    it('should generate avatar for a valid persona', async () => {
      const sut = createSut()

      const result = await sut.generate('test-persona-1', 'user-1')

      expect(result.success).toBe(true)
      expect(result.avatarUrl).toBe('https://example.com/sticker.png')
      expect(result.thumbnailUrl).toBe('https://example.com/thumb.png')
      expect(result.prompt).toBeDefined()
      expect(result.remaining).toBe(9)
    })

    it('should return error when persona not found', async () => {
      const sut = createPersonaAvatarGen({
        quotaProvider: makeQuotaProvider(),
        aiProvider: makeAiProvider(),
        getPersonaById: vi.fn().mockReturnValue(undefined)
      })

      const result = await sut.generate('nonexistent', 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Persona不存在')
    })

    it('should return error when quota exhausted', async () => {
      const sut = createPersonaAvatarGen({
        quotaProvider: makeQuotaProvider({
          consume: vi.fn().mockReturnValue({ ok: false, remaining: 0 })
        }),
        aiProvider: makeAiProvider(),
        getPersonaById: vi.fn().mockReturnValue(makePersona())
      })

      const result = await sut.generate('test-persona-1', 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('次数已用完')
      expect(result.remaining).toBe(0)
    })

    it('should return error when AI generation fails', async () => {
      const sut = createPersonaAvatarGen({
        quotaProvider: makeQuotaProvider(),
        aiProvider: makeAiProvider({
          generate: vi.fn().mockResolvedValue({
            id: 'req-1',
            userId: 'user-1',
            prompt: 'test',
            renderMode: '2d_sticker',
            status: 'failed',
            error: 'AI服务不可用',
            createdAt: '2026-01-01T00:00:00Z'
          } as AvatarGenerationRequest)
        }),
        getPersonaById: vi.fn().mockReturnValue(makePersona())
      })

      const result = await sut.generate('test-persona-1', 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('AI服务不可用')
    })

    it('should return error when AI provider throws', async () => {
      const sut = createPersonaAvatarGen({
        quotaProvider: makeQuotaProvider(),
        aiProvider: makeAiProvider({
          generate: vi.fn().mockRejectedValue(new Error('网络超时'))
        }),
        getPersonaById: vi.fn().mockReturnValue(makePersona())
      })

      const result = await sut.generate('test-persona-1', 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('网络超时')
    })

    it('should return error for pending status', async () => {
      const sut = createPersonaAvatarGen({
        quotaProvider: makeQuotaProvider(),
        aiProvider: makeAiProvider({
          generate: vi.fn().mockResolvedValue({
            id: 'req-1',
            userId: 'user-1',
            prompt: 'test',
            renderMode: '2d_sticker',
            status: 'pending',
            createdAt: '2026-01-01T00:00:00Z'
          } as AvatarGenerationRequest)
        }),
        getPersonaById: vi.fn().mockReturnValue(makePersona())
      })

      const result = await sut.generate('test-persona-1', 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toContain('生成状态异常')
    })

    it('should build prompt from persona attributes', async () => {
      const generateSpy = vi.fn().mockResolvedValue({
        id: 'req-1',
        userId: 'user-1',
        prompt: 'test',
        renderMode: '2d_sticker',
        status: 'completed',
        result: {
          id: 'avatar-1',
          userId: 'user-1',
          name: 'AI角色',
          source: 'meshy_ai',
          renderMode: '2d_sticker',
          thumbnailUrl: 'https://example.com/thumb.png',
          stickerUrl: 'https://example.com/sticker.png',
          evolution: {
            level: 1,
            unlockedDecorations: [],
            unlockedEffects: [],
            unlockedAnimations: [],
            totalFocusMinutes: 0,
            totalTasksCompleted: 0,
            streakDays: 0
          },
          animations: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z'
        },
        createdAt: '2026-01-01T00:00:00Z'
      } as AvatarGenerationRequest)

      const persona = makePersona({
        name: '冷酷教练',
        tone: ['sharp', 'professional'],
        identityRole: 'coach',
        shortDescription: '严格但有效的学习教练'
      })

      const sut = createPersonaAvatarGen({
        quotaProvider: makeQuotaProvider(),
        aiProvider: makeAiProvider({ generate: generateSpy }),
        getPersonaById: vi.fn().mockReturnValue(persona)
      })

      const result = await sut.generate('test-persona-1', 'user-1')

      expect(result.success).toBe(true)
      expect(result.prompt).toContain('教练/导师')
      expect(result.prompt).toContain('锐利干练')
      expect(result.prompt).toContain('专业严谨')
      expect(result.prompt).toContain('冷酷教练')
    })

    it('should use anime as default style', async () => {
      const generateSpy = vi.fn().mockResolvedValue({
        id: 'req-1',
        userId: 'user-1',
        prompt: 'test',
        renderMode: '2d_sticker',
        status: 'completed',
        result: {
          id: 'avatar-1',
          userId: 'user-1',
          name: 'AI角色',
          source: 'meshy_ai',
          renderMode: '2d_sticker',
          thumbnailUrl: 'https://example.com/thumb.png',
          stickerUrl: 'https://example.com/sticker.png',
          evolution: {
            level: 1,
            unlockedDecorations: [],
            unlockedEffects: [],
            unlockedAnimations: [],
            totalFocusMinutes: 0,
            totalTasksCompleted: 0,
            streakDays: 0
          },
          animations: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z'
        },
        createdAt: '2026-01-01T00:00:00Z'
      } as AvatarGenerationRequest)

      const sut = createPersonaAvatarGen({
        quotaProvider: makeQuotaProvider(),
        aiProvider: makeAiProvider({ generate: generateSpy }),
        getPersonaById: vi.fn().mockReturnValue(makePersona())
      })

      await sut.generate('test-persona-1', 'user-1')

      expect(generateSpy).toHaveBeenCalledWith(
        expect.any(String),
        'anime',
        '2d_sticker'
      )
    })

    it('should pass custom style to AI provider', async () => {
      const generateSpy = vi.fn().mockResolvedValue({
        id: 'req-1',
        userId: 'user-1',
        prompt: 'test',
        renderMode: '2d_sticker',
        status: 'completed',
        result: {
          id: 'avatar-1',
          userId: 'user-1',
          name: 'AI角色',
          source: 'meshy_ai',
          renderMode: '2d_sticker',
          thumbnailUrl: 'https://example.com/thumb.png',
          stickerUrl: 'https://example.com/sticker.png',
          evolution: {
            level: 1,
            unlockedDecorations: [],
            unlockedEffects: [],
            unlockedAnimations: [],
            totalFocusMinutes: 0,
            totalTasksCompleted: 0,
            streakDays: 0
          },
          animations: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z'
        },
        createdAt: '2026-01-01T00:00:00Z'
      } as AvatarGenerationRequest)

      const sut = createPersonaAvatarGen({
        quotaProvider: makeQuotaProvider(),
        aiProvider: makeAiProvider({ generate: generateSpy }),
        getPersonaById: vi.fn().mockReturnValue(makePersona())
      })

      await sut.generate('test-persona-1', 'user-1', 'chibi')

      expect(generateSpy).toHaveBeenCalledWith(
        expect.any(String),
        'chibi',
        '2d_sticker'
      )
    })

    it('should fallback to thumbnailUrl when stickerUrl is missing', async () => {
      const sut = createPersonaAvatarGen({
        quotaProvider: makeQuotaProvider(),
        aiProvider: makeAiProvider({
          generate: vi.fn().mockResolvedValue({
            id: 'req-1',
            userId: 'user-1',
            prompt: 'test',
            renderMode: '2d_sticker',
            status: 'completed',
            result: {
              id: 'avatar-1',
              userId: 'user-1',
              name: 'AI角色',
              source: 'meshy_ai',
              renderMode: '2d_sticker',
              thumbnailUrl: 'https://example.com/thumb.png',
              evolution: {
                level: 1,
                unlockedDecorations: [],
                unlockedEffects: [],
                unlockedAnimations: [],
                totalFocusMinutes: 0,
                totalTasksCompleted: 0,
                streakDays: 0
              },
              animations: [],
              createdAt: '2026-01-01T00:00:00Z',
              updatedAt: '2026-01-01T00:00:00Z'
            },
            createdAt: '2026-01-01T00:00:00Z'
          } as AvatarGenerationRequest)
        }),
        getPersonaById: vi.fn().mockReturnValue(makePersona())
      })

      const result = await sut.generate('test-persona-1', 'user-1')

      expect(result.success).toBe(true)
      expect(result.avatarUrl).toBe('https://example.com/thumb.png')
    })
  })

  describe('getRemaining', () => {
    it('should delegate to quota provider', () => {
      const quotaProvider = makeQuotaProvider({
        getRemaining: vi.fn().mockReturnValue(5)
      })
      const sut = createPersonaAvatarGen({
        quotaProvider,
        aiProvider: makeAiProvider(),
        getPersonaById: vi.fn()
      })

      const remaining = sut.getRemaining('user-1')

      expect(remaining).toBe(5)
      expect(quotaProvider.getRemaining).toHaveBeenCalledWith('user-1')
    })
  })

  describe('getTotalUsed', () => {
    it('should delegate to quota provider', () => {
      const quotaProvider = makeQuotaProvider({
        getTotalUsed: vi.fn().mockReturnValue(3)
      })
      const sut = createPersonaAvatarGen({
        quotaProvider,
        aiProvider: makeAiProvider(),
        getPersonaById: vi.fn()
      })

      const used = sut.getTotalUsed('user-1')

      expect(used).toBe(3)
      expect(quotaProvider.getTotalUsed).toHaveBeenCalledWith('user-1')
    })
  })

  describe('buildAvatarPrompt', () => {
    it('should handle unknown tone gracefully', async () => {
      const persona = makePersona({
        tone: ['unknown_tone']
      })

      const sut = createPersonaAvatarGen({
        quotaProvider: makeQuotaProvider(),
        aiProvider: makeAiProvider(),
        getPersonaById: vi.fn().mockReturnValue(persona)
      })

      const result = await sut.generate('test-persona-1', 'user-1')

      expect(result.success).toBe(true)
      expect(result.prompt).toContain('unknown_tone')
    })

    it('should handle unknown identity role gracefully', async () => {
      const persona = makePersona({
        identityRole: 'unknown_role'
      })

      const sut = createPersonaAvatarGen({
        quotaProvider: makeQuotaProvider(),
        aiProvider: makeAiProvider(),
        getPersonaById: vi.fn().mockReturnValue(persona)
      })

      const result = await sut.generate('test-persona-1', 'user-1')

      expect(result.success).toBe(true)
      expect(result.prompt).toContain('unknown_role')
    })
  })
})
