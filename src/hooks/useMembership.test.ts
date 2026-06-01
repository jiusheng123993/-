import { describe, expect, it, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMembership } from './useMembership'

describe('useMembership', () => {
  const userId = 'test-user-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns default tier for free user', () => {
    const { result } = renderHook(() => useMembership(userId))

    expect(result.current.currentTier.level).toBe('free')
    expect(result.current.currentTier.label).toBe('免费用户')
  })

  it('returns correct tier info', () => {
    const { result } = renderHook(() => useMembership(userId))

    const studyInfo = result.current.getTierInfo('study')
    expect(studyInfo.name).toBe('学习会员')
    expect(studyInfo.features).toContain('高级主题全解锁')

    const agentInfo = result.current.getTierInfo('agent')
    expect(agentInfo.name).toBe('Agent 会员')
    expect(agentInfo.features).toContain('有记忆的AI搭子')

    const plusInfo = result.current.getTierInfo('agent_plus')
    expect(plusInfo.name).toBe('Agent PLUS')
    expect(plusInfo.features).toContain('无限AI额度')
  })

  it('formats price correctly', () => {
    const { result } = renderHook(() => useMembership(userId))

    expect(result.current.formatPrice(1000)).toBe('¥10')
    expect(result.current.formatPrice(0)).toBe('¥0')
    expect(result.current.formatPrice(999)).toBe('¥10')
  })

  it('returns correct period labels', () => {
    const { result } = renderHook(() => useMembership(userId))

    expect(result.current.getPeriodLabel('month')).toBe('月')
    expect(result.current.getPeriodLabel('quarter')).toBe('季')
    expect(result.current.getPeriodLabel('year')).toBe('年')
    expect(result.current.getPeriodLabel('unknown')).toBe('unknown')
  })

  it('returns correct grant labels', () => {
    const { result } = renderHook(() => useMembership(userId))

    expect(result.current.getGrantLabel('study')).toBe('学习会员')
    expect(result.current.getGrantLabel('agent')).toBe('Agent 会员')
    expect(result.current.getGrantLabel('agent_plus')).toBe('Agent PLUS')
    expect(result.current.getGrantLabel('avatar_rpm')).toBe('RPM捏脸')
    expect(result.current.getGrantLabel('unknown')).toBe('unknown')
  })

  it('starts trial correctly', () => {
    const { result } = renderHook(() => useMembership(userId))

    act(() => {
      result.current.startTrial('study', 3)
    })

    expect(result.current.trials.length).toBe(1)
    expect(result.current.trials[0].code).toBe('study')
    expect(result.current.trials[0].used).toBe(false)
  })

  it('redeems valid coupon correctly', async () => {
    const { result } = renderHook(() => useMembership(userId))

    let response = result.current.redeemCoupon('WELCOME10')
    expect(response.success).toBe(true)
    
    await act(async () => {})
    
    expect(result.current.coupons.length).toBe(1)
    expect(result.current.coupons[0].code).toBe('WELCOME10')

    response = result.current.redeemCoupon('NEWUSER50')
    expect(response.success).toBe(true)
    
    await act(async () => {})
    
    expect(result.current.coupons.length).toBe(2)
  })

  it('rejects invalid coupon', () => {
    const { result } = renderHook(() => useMembership(userId))

    const response = result.current.redeemCoupon('INVALID')
    expect(response.success).toBe(false)
    expect(response.message).toBe('优惠券码无效')
  })

  it('rejects empty coupon code', () => {
    const { result } = renderHook(() => useMembership(userId))

    const response = result.current.redeemCoupon('')
    expect(response.success).toBe(false)
    expect(response.message).toBe('请输入优惠券码')
  })

  it('checks active trial correctly', () => {
    const { result } = renderHook(() => useMembership(userId))

    expect(result.current.hasActiveTrial('study')).toBe(false)

    act(() => {
      result.current.startTrial('study', 3)
    })

    expect(result.current.hasActiveTrial('study')).toBe(true)
  })

  it('filters products by tier', () => {
    const { result } = renderHook(() => useMembership(userId))

    const studyProducts = result.current.getProductsByTier('study')
    expect(studyProducts.every(p => p.id.startsWith('study'))).toBe(true)

    const agentProducts = result.current.getProductsByTier('agent')
    expect(agentProducts.every(p => p.id.startsWith('agent') && !p.id.includes('plus'))).toBe(true)

    const plusProducts = result.current.getProductsByTier('agent_plus')
    expect(plusProducts.every(p => p.id.includes('plus'))).toBe(true)
  })

  it('returns quota status', () => {
    const { result } = renderHook(() => useMembership(userId))

    expect(result.current.quotaStatus).toHaveProperty('free')
    expect(result.current.quotaStatus).toHaveProperty('study')
    expect(result.current.quotaStatus).toHaveProperty('agent')
    expect(result.current.quotaStatus).toHaveProperty('pack')
  })

  it('calculates total quota correctly', () => {
    const { result } = renderHook(() => useMembership(userId))

    expect(typeof result.current.totalQuota).toBe('number')
  })
})
