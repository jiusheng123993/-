/**
 * 食物查询流程 Hook 单元测试
 * 覆盖：selectFood 按 safetyLevel 分级给出结论（safe/可吃、caution/少量谨慎、toxic/禁止），
 * 不把 caution 误报成"不能吃/高风险"
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFoodFlow } from '../useFoodFlow'
import type { PetInfo } from '../../types/chatTypes'

const { mockQueryFood, mockAddAiMsg, mockAddUserMsg, mockAddMessage, mockSetIsTyping, mockUserId } = vi.hoisted(() => {
  return {
    mockQueryFood: vi.fn(),
    mockAddAiMsg: vi.fn(),
    mockAddUserMsg: vi.fn(),
    mockAddMessage: vi.fn(),
    mockSetIsTyping: vi.fn(),
    mockUserId: 'user_1',
  }
})

vi.mock('../../services/foodService', () => ({
  queryFood: (...args: any[]) => mockQueryFood(...args),
}))

vi.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ user: { id: mockUserId } }),
  },
}))

const petInfo: PetInfo = {
  name: '旺财',
  emoji: '🐕',
  breed: '金毛',
  age: '2岁',
  hasPet: true,
  isLoading: false,
  activePet: { id: 'pet_1', name: '旺财', species: 'dog' as const } as any,
}

function renderFlow(overrides?: Partial<PetInfo>) {
  return renderHook(() => useFoodFlow({
    addAiMsg: mockAddAiMsg,
    addUserMsg: mockAddUserMsg,
    addMessage: mockAddMessage,
    setIsTyping: mockSetIsTyping,
    petInfo: { ...petInfo, ...overrides },
  }))
}

describe('useFoodFlow.selectFood', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('safe 等级：结论为「可以吃（适量）」，卡 safe=true', async () => {
    mockQueryFood.mockResolvedValue({
      id: 'q_1', userId: mockUserId, foodName: '西瓜', safetyLevel: 'safe',
      detail: '去籽后少量喂食安全', isMemberQuery: false, createdAt: new Date(),
    })
    const { result } = renderFlow()
    await result.current.selectFood('西瓜')

    const msg = mockAddMessage.mock.calls[0][0]
    expect(msg.content).toContain('可以吃')
    expect(msg.content).not.toContain('不能吃')
    expect(msg.content).not.toContain('高风险')
    expect(msg.card.safe).toBe(true)
  })

  it('caution 等级：结论为「少量谨慎」，绝不误报高风险', async () => {
    mockQueryFood.mockResolvedValue({
      id: 'q_2', userId: mockUserId, foodName: '西瓜（带籽）', safetyLevel: 'caution',
      detail: '籽可能造成梗阻', isMemberQuery: false, createdAt: new Date(),
    })
    const { result } = renderFlow()
    await result.current.selectFood('西瓜（带籽）')

    const msg = mockAddMessage.mock.calls[0][0]
    expect(msg.content).toContain('少量谨慎')
    expect(msg.content).toContain('少量尝试')
    // 关键：caution 不能再被判定成"不能吃/高风险"
    expect(msg.content).not.toContain('不能吃')
    expect(msg.content).not.toContain('高风险')
    expect(msg.card.safe).toBe(false)
    expect(msg.card.risk).toBe('P4')
  })

  it('toxic 等级：结论为「有毒，禁止食用」，卡 safe=false 且 risk=P0', async () => {
    mockQueryFood.mockResolvedValue({
      id: 'q_3', userId: mockUserId, foodName: '巧克力', safetyLevel: 'toxic',
      detail: '可可碱中毒', symptoms: ['呕吐', '抽搐'], isMemberQuery: false, createdAt: new Date(),
    })
    const { result } = renderFlow()
    await result.current.selectFood('巧克力')

    const msg = mockAddMessage.mock.calls[0][0]
    expect(msg.content).toContain('有毒，禁止食用')
    expect(msg.content).toContain('高风险')
    expect(msg.content).toContain('呕吐')
    expect(msg.card.safe).toBe(false)
    expect(msg.card.risk).toBe('P0')
  })

  it('没有活跃宠物时提示先添加宠物，不发起查询', async () => {
    const { result } = renderFlow({ activePet: null })
    await result.current.selectFood('西瓜')

    expect(mockQueryFood).not.toHaveBeenCalled()
    expect(mockAddAiMsg).toHaveBeenCalledWith('请先添加宠物后再查询食物安全。')
  })

  it('查询失败时给出兜底提示', async () => {
    mockQueryFood.mockRejectedValue(new Error('network'))
    const { result } = renderFlow()
    await result.current.selectFood('西瓜')

    expect(mockAddAiMsg).toHaveBeenCalledWith('抱歉，食物查询暂时不可用，请稍后再试。')
  })
})
