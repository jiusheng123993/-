import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { createPersonaAutoSwitcher } from './personaAutoSwitcher'
import type { AutoSwitchContext } from './personaAutoSwitcher'

describe('PersonaAutoSwitcher', () => {
  let switcher: ReturnType<typeof createPersonaAutoSwitcher>

  /** 构造默认上下文，仅覆盖指定字段 */
  function makeCtx(overrides: Partial<AutoSwitchContext> = {}): AutoSwitchContext {
    return {
      hour: 10,
      userEmotion: 'neutral',
      userScene: 'unknown',
      idleMinutes: 0,
      focusMinutes: 0,
      isManualOverride: false,
      ...overrides
    }
  }

  beforeEach(() => {
    localStorage.clear()
    switcher = createPersonaAutoSwitcher()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('情绪维度', () => {
    it('sad → caring_sister', () => {
      const result = switcher.evaluate(makeCtx({ userEmotion: 'sad' }))
      expect(result.shouldSwitch).toBe(true)
      expect(result.targetPersonaId).toBe('caring_sister')
      expect(result.dimension).toBe('emotion')
    })

    it('anxious → caring_sister', () => {
      const result = switcher.evaluate(makeCtx({ userEmotion: 'anxious' }))
      expect(result.shouldSwitch).toBe(true)
      expect(result.targetPersonaId).toBe('caring_sister')
      expect(result.dimension).toBe('emotion')
    })

    it('tired → caring_sister', () => {
      const result = switcher.evaluate(makeCtx({ userEmotion: 'tired' }))
      expect(result.shouldSwitch).toBe(true)
      expect(result.targetPersonaId).toBe('caring_sister')
      expect(result.dimension).toBe('emotion')
    })

    it('happy → 不因情绪切换（走时间维度）', () => {
      const result = switcher.evaluate(makeCtx({ userEmotion: 'happy', hour: 10 }))
      expect(result.shouldSwitch).toBe(true)
      // happy 不触发情绪维度，走时间维度 → 10点 → strict_teacher
      expect(result.targetPersonaId).toBe('strict_teacher')
      expect(result.dimension).toBe('time')
    })
  })

  describe('场景维度', () => {
    it('studying → strict_teacher', () => {
      const result = switcher.evaluate(makeCtx({ userScene: 'studying', userEmotion: 'neutral' }))
      expect(result.shouldSwitch).toBe(true)
      expect(result.targetPersonaId).toBe('strict_teacher')
      expect(result.dimension).toBe('scene')
    })

    it('working → strict_teacher', () => {
      const result = switcher.evaluate(makeCtx({ userScene: 'working', userEmotion: 'neutral' }))
      expect(result.shouldSwitch).toBe(true)
      expect(result.targetPersonaId).toBe('strict_teacher')
      expect(result.dimension).toBe('scene')
    })

    it('relaxing → 不因场景切换（走时间维度）', () => {
      const result = switcher.evaluate(makeCtx({ userScene: 'relaxing', userEmotion: 'neutral', hour: 10 }))
      expect(result.shouldSwitch).toBe(true)
      // relaxing 不触发场景维度，走时间维度 → 10点 → strict_teacher
      expect(result.targetPersonaId).toBe('strict_teacher')
      expect(result.dimension).toBe('time')
    })
  })

  describe('时间维度', () => {
    it('上午9点 → strict_teacher', () => {
      const result = switcher.evaluate(makeCtx({ hour: 9 }))
      expect(result.shouldSwitch).toBe(true)
      expect(result.targetPersonaId).toBe('strict_teacher')
      expect(result.dimension).toBe('time')
    })

    it('午休13点 → playful_girlfriend', () => {
      const result = switcher.evaluate(makeCtx({ hour: 13 }))
      expect(result.shouldSwitch).toBe(true)
      expect(result.targetPersonaId).toBe('playful_girlfriend')
      expect(result.dimension).toBe('time')
    })

    it('下午15点 → strict_teacher', () => {
      const result = switcher.evaluate(makeCtx({ hour: 15 }))
      expect(result.shouldSwitch).toBe(true)
      expect(result.targetPersonaId).toBe('strict_teacher')
      expect(result.dimension).toBe('time')
    })

    it('晚间19点 → playful_girlfriend', () => {
      const result = switcher.evaluate(makeCtx({ hour: 19 }))
      expect(result.shouldSwitch).toBe(true)
      expect(result.targetPersonaId).toBe('playful_girlfriend')
      expect(result.dimension).toBe('time')
    })

    it('深夜22点 → caring_sister', () => {
      const result = switcher.evaluate(makeCtx({ hour: 22 }))
      expect(result.shouldSwitch).toBe(true)
      expect(result.targetPersonaId).toBe('caring_sister')
      expect(result.dimension).toBe('time')
    })

    it('凌晨3点 → caring_sister', () => {
      const result = switcher.evaluate(makeCtx({ hour: 3 }))
      expect(result.shouldSwitch).toBe(true)
      expect(result.targetPersonaId).toBe('caring_sister')
      expect(result.dimension).toBe('time')
    })
  })

  describe('手动覆盖', () => {
    it('isManualOverride=true → 不切换', () => {
      const result = switcher.evaluate(makeCtx({ isManualOverride: true, userEmotion: 'sad' }))
      expect(result.shouldSwitch).toBe(false)
      expect(result.targetPersonaId).toBe('')
    })
  })

  describe('冷却机制', () => {
    it('切换后立即再评估 → 不切换（冷却中）', () => {
      // 第一次切换
      const result1 = switcher.evaluate(makeCtx({ userEmotion: 'sad' }))
      expect(result1.shouldSwitch).toBe(true)
      expect(result1.targetPersonaId).toBe('caring_sister')

      // 立即再次评估，同人格在冷却中
      const result2 = switcher.evaluate(makeCtx({ userEmotion: 'sad' }))
      expect(result2.shouldSwitch).toBe(false)
      expect(result2.targetPersonaId).toBe('caring_sister')
      expect(result2.reason).toContain('冷却')
    })
  })

  describe('getRecommendedPersona', () => {
    it('不受冷却限制', () => {
      // 先触发一次切换，产生冷却记录
      switcher.evaluate(makeCtx({ userEmotion: 'sad' }))

      // getRecommendedPersona 不受冷却限制，仍返回推荐
      const rec = switcher.getRecommendedPersona(makeCtx({ userEmotion: 'sad' }))
      expect(rec.personaId).toBe('caring_sister')
      expect(rec.reason).toBeTruthy()
    })
  })

  describe('resetManualOverride', () => {
    it('重置后可自动切换', () => {
      // 设置手动覆盖标记到 localStorage
      localStorage.setItem('persona_manual_override', 'true')

      // 手动覆盖生效，不切换
      const result1 = switcher.evaluate(makeCtx({ userEmotion: 'sad' }))
      expect(result1.shouldSwitch).toBe(false)

      // 重置手动覆盖
      switcher.resetManualOverride()

      // 重置后可自动切换
      const result2 = switcher.evaluate(makeCtx({ userEmotion: 'sad' }))
      expect(result2.shouldSwitch).toBe(true)
      expect(result2.targetPersonaId).toBe('caring_sister')
    })
  })
})
