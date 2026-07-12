import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { createProactiveChatEngine } from './proactiveChat'
import type { ProactiveCheckContext } from './proactiveChat'

describe('ProactiveChatEngine', () => {
  let engine: ReturnType<typeof createProactiveChatEngine>

  beforeEach(() => {
    localStorage.clear()
    engine = createProactiveChatEngine()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('morning_greeting', () => {
    it('8-9点触发早安问候', () => {
      const ctx: ProactiveCheckContext = {
        hour: 8,
        focusMinutes: 0,
        userEmotion: 'neutral',
        idleMinutes: 0,
        hasAchievement: false
      }
      const messages = engine.checkTriggers(ctx)
      expect(messages.length).toBeGreaterThanOrEqual(1)
      const morningMsg = messages.find(m => m.trigger === 'morning_greeting')
      expect(morningMsg).toBeDefined()
      expect(morningMsg!.personaId).toBe('strict_teacher')
      expect(morningMsg!.content).toContain('早上好')
      expect(morningMsg!.read).toBe(false)
    })

    it('7点不触发早安问候', () => {
      const ctx: ProactiveCheckContext = {
        hour: 7,
        focusMinutes: 0,
        userEmotion: 'neutral',
        idleMinutes: 0,
        hasAchievement: false
      }
      const messages = engine.checkTriggers(ctx)
      const morningMsg = messages.find(m => m.trigger === 'morning_greeting')
      expect(morningMsg).toBeUndefined()
    })

    it('9点不触发早安问候', () => {
      const ctx: ProactiveCheckContext = {
        hour: 9,
        focusMinutes: 0,
        userEmotion: 'neutral',
        idleMinutes: 0,
        hasAchievement: false
      }
      const messages = engine.checkTriggers(ctx)
      const morningMsg = messages.find(m => m.trigger === 'morning_greeting')
      expect(morningMsg).toBeUndefined()
    })
  })

  describe('evening_checkin', () => {
    it('21-22点触发晚安问候', () => {
      const ctx: ProactiveCheckContext = {
        hour: 21,
        focusMinutes: 0,
        userEmotion: 'neutral',
        idleMinutes: 0,
        hasAchievement: false
      }
      const messages = engine.checkTriggers(ctx)
      const eveningMsg = messages.find(m => m.trigger === 'evening_checkin')
      expect(eveningMsg).toBeDefined()
      expect(eveningMsg!.personaId).toBe('playful_girlfriend')
      expect(eveningMsg!.content).toContain('晚上好')
    })
  })

  describe('focus_break_reminder', () => {
    it('专注超过45分钟触发休息提醒', () => {
      const ctx: ProactiveCheckContext = {
        hour: 14,
        focusMinutes: 50,
        userEmotion: 'neutral',
        idleMinutes: 0,
        hasAchievement: false
      }
      const messages = engine.checkTriggers(ctx)
      const focusMsg = messages.find(m => m.trigger === 'focus_break_reminder')
      expect(focusMsg).toBeDefined()
      expect(focusMsg!.personaId).toBe('caring_sister')
      expect(focusMsg!.content).toContain('50分钟')
    })

    it('专注不足45分钟不触发休息提醒', () => {
      const ctx: ProactiveCheckContext = {
        hour: 14,
        focusMinutes: 30,
        userEmotion: 'neutral',
        idleMinutes: 0,
        hasAchievement: false
      }
      const messages = engine.checkTriggers(ctx)
      const focusMsg = messages.find(m => m.trigger === 'focus_break_reminder')
      expect(focusMsg).toBeUndefined()
    })
  })

  describe('emotion_care', () => {
    it('用户悲伤时触发关心问候', () => {
      const ctx: ProactiveCheckContext = {
        hour: 14,
        focusMinutes: 0,
        userEmotion: 'sad',
        idleMinutes: 0,
        hasAchievement: false
      }
      const messages = engine.checkTriggers(ctx)
      const emotionMsg = messages.find(m => m.trigger === 'emotion_care')
      expect(emotionMsg).toBeDefined()
      expect(emotionMsg!.personaId).toBe('caring_sister')
      expect(emotionMsg!.content).toContain('不太开心')
    })

    it('用户焦虑时触发关心问候', () => {
      const ctx: ProactiveCheckContext = {
        hour: 14,
        focusMinutes: 0,
        userEmotion: 'anxious',
        idleMinutes: 0,
        hasAchievement: false
      }
      const messages = engine.checkTriggers(ctx)
      const emotionMsg = messages.find(m => m.trigger === 'emotion_care')
      expect(emotionMsg).toBeDefined()
    })

    it('用户开心时不触发关心问候', () => {
      const ctx: ProactiveCheckContext = {
        hour: 14,
        focusMinutes: 0,
        userEmotion: 'happy',
        idleMinutes: 0,
        hasAchievement: false
      }
      const messages = engine.checkTriggers(ctx)
      const emotionMsg = messages.find(m => m.trigger === 'emotion_care')
      expect(emotionMsg).toBeUndefined()
    })
  })

  describe('idle_too_long', () => {
    it('空闲超过2小时触发主动搭话', () => {
      const ctx: ProactiveCheckContext = {
        hour: 14,
        focusMinutes: 0,
        userEmotion: 'neutral',
        idleMinutes: 130,
        hasAchievement: false
      }
      const messages = engine.checkTriggers(ctx)
      const idleMsg = messages.find(m => m.trigger === 'idle_too_long')
      expect(idleMsg).toBeDefined()
      expect(idleMsg!.personaId).toBe('playful_girlfriend')
      expect(idleMsg!.content).toContain('好久没见到你')
    })

    it('空闲不足2小时不触发', () => {
      const ctx: ProactiveCheckContext = {
        hour: 14,
        focusMinutes: 0,
        userEmotion: 'neutral',
        idleMinutes: 90,
        hasAchievement: false
      }
      const messages = engine.checkTriggers(ctx)
      const idleMsg = messages.find(m => m.trigger === 'idle_too_long')
      expect(idleMsg).toBeUndefined()
    })
  })

  describe('achievement_celebration', () => {
    it('完成目标时触发庆祝', () => {
      const ctx: ProactiveCheckContext = {
        hour: 14,
        focusMinutes: 0,
        userEmotion: 'neutral',
        idleMinutes: 0,
        hasAchievement: true
      }
      const messages = engine.checkTriggers(ctx)
      const achieveMsg = messages.find(m => m.trigger === 'achievement_celebration')
      expect(achieveMsg).toBeDefined()
      expect(achieveMsg!.personaId).toBe('playful_girlfriend')
      expect(achieveMsg!.content).toContain('太棒啦')
    })
  })

  describe('冷却机制', () => {
    it('同一触发类型2小时内不重复触发', () => {
      const ctx: ProactiveCheckContext = {
        hour: 8,
        focusMinutes: 0,
        userEmotion: 'neutral',
        idleMinutes: 0,
        hasAchievement: false
      }
      // 第一次触发
      const messages1 = engine.checkTriggers(ctx)
      expect(messages1.find(m => m.trigger === 'morning_greeting')).toBeDefined()

      // 第二次触发（冷却中）
      const messages2 = engine.checkTriggers(ctx)
      expect(messages2.find(m => m.trigger === 'morning_greeting')).toBeUndefined()
    })
  })

  describe('markAsRead', () => {
    it('标记消息已读', () => {
      const ctx: ProactiveCheckContext = {
        hour: 8,
        focusMinutes: 0,
        userEmotion: 'neutral',
        idleMinutes: 0,
        hasAchievement: false
      }
      const messages = engine.checkTriggers(ctx)
      expect(messages.length).toBeGreaterThanOrEqual(1)

      const unread1 = engine.getUnreadMessages()
      expect(unread1.length).toBeGreaterThanOrEqual(1)

      engine.markAsRead(messages[0].id)

      const unread2 = engine.getUnreadMessages()
      expect(unread2.length).toBe(unread1.length - 1)
    })
  })

  describe('getUnreadMessages', () => {
    it('初始时没有未读消息', () => {
      const unread = engine.getUnreadMessages()
      expect(unread).toHaveLength(0)
    })
  })

  describe('getAllMessages', () => {
    it('初始时没有消息', () => {
      const all = engine.getAllMessages()
      expect(all).toHaveLength(0)
    })

    it('触发后消息被持久化', () => {
      const ctx: ProactiveCheckContext = {
        hour: 8,
        focusMinutes: 0,
        userEmotion: 'neutral',
        idleMinutes: 0,
        hasAchievement: false
      }
      engine.checkTriggers(ctx)
      const all = engine.getAllMessages()
      expect(all.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('clearMessages', () => {
    it('清空所有消息', () => {
      const ctx: ProactiveCheckContext = {
        hour: 8,
        focusMinutes: 0,
        userEmotion: 'neutral',
        idleMinutes: 0,
        hasAchievement: false
      }
      engine.checkTriggers(ctx)
      expect(engine.getAllMessages().length).toBeGreaterThanOrEqual(1)

      engine.clearMessages()
      expect(engine.getAllMessages()).toHaveLength(0)
      expect(engine.getUnreadMessages()).toHaveLength(0)
    })
  })

  describe('自定义冷却时间', () => {
    it('使用自定义冷却时间', () => {
      const shortEngine = createProactiveChatEngine(1000) // 1秒冷却
      const ctx: ProactiveCheckContext = {
        hour: 8,
        focusMinutes: 0,
        userEmotion: 'neutral',
        idleMinutes: 0,
        hasAchievement: false
      }
      const messages1 = shortEngine.checkTriggers(ctx)
      expect(messages1.find(m => m.trigger === 'morning_greeting')).toBeDefined()

      // 冷却中
      const messages2 = shortEngine.checkTriggers(ctx)
      expect(messages2.find(m => m.trigger === 'morning_greeting')).toBeUndefined()

      shortEngine.clearMessages()
    })
  })

  describe('多触发同时满足', () => {
    it('多个条件同时满足时返回多条消息', () => {
      const ctx: ProactiveCheckContext = {
        hour: 8,
        focusMinutes: 50,
        userEmotion: 'sad',
        idleMinutes: 130,
        hasAchievement: true
      }
      const messages = engine.checkTriggers(ctx)
      // morning_greeting + focus_break_reminder + emotion_care + idle_too_long + achievement_celebration
      expect(messages.length).toBeGreaterThanOrEqual(3)
    })
  })
})
