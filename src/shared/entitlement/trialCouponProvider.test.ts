import { describe, it, expect, beforeEach } from 'vitest'
import { createTrialCouponInviteProvider } from './trialCouponProvider'
import { createEntitlementService } from './entitlementService'

describe('TrialCouponInviteProvider', () => {
  let provider: ReturnType<typeof createTrialCouponInviteProvider>
  let entitlementService: ReturnType<typeof createEntitlementService>

  beforeEach(() => {
    entitlementService = createEntitlementService()
    provider = createTrialCouponInviteProvider(entitlementService)
  })

  describe('Coupon', () => {
    it('should create a coupon', () => {
      const coupon = provider.createCoupon({
        code: 'WELCOME10',
        type: 'discount',
        discountPercent: 10,
        expireAt: null,
        maxUses: 100
      })

      expect(coupon.id).toBeDefined()
      expect(coupon.code).toBe('WELCOME10')
      expect(coupon.usedCount).toBe(0)
    })

    it('should get coupon by code', () => {
      provider.createCoupon({
        code: 'TEST',
        type: 'discount',
        discountPercent: 5,
        expireAt: null
      })

      const coupon = provider.getCouponByCode('TEST')
      expect(coupon?.code).toBe('TEST')
    })

    it('should validate coupon', () => {
      provider.createCoupon({
        code: 'VALID',
        type: 'discount',
        discountPercent: 5,
        expireAt: null
      })

      const result = provider.validateCoupon('VALID')
      expect(result.valid).toBe(true)
    })

    it('should reject invalid coupon', () => {
      const result = provider.validateCoupon('NONEXISTENT')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Coupon not found')
    })

    it('should reject expired coupon', () => {
      provider.createCoupon({
        code: 'EXPIRED',
        type: 'discount',
        discountPercent: 5,
        expireAt: new Date(Date.now() - 1000).toISOString()
      })

      const result = provider.validateCoupon('EXPIRED')
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Coupon expired')
    })

    it('should use coupon and grant credit', () => {
      provider.createCoupon({
        code: 'FREE50',
        type: 'credit',
        creditAmount: 50,
        expireAt: null
      })

      const used = provider.useCoupon('user-123', 'FREE50')
      expect(used).toBe(true)
      expect(entitlementService.has('user-123', 'ai_quota')).toBe(true)
    })

    it('should use coupon and grant trial', () => {
      provider.createCoupon({
        code: 'WEEKTRY',
        type: 'free_trial',
        durationDays: 7,
        expireAt: null
      })

      const used = provider.useCoupon('user-123', 'WEEKTRY')
      expect(used).toBe(true)
      expect(entitlementService.has('user-123', 'study')).toBe(true)
    })

    it('should not allow duplicate coupon use', () => {
      provider.createCoupon({
        code: 'ONETIME',
        type: 'credit',
        creditAmount: 10,
        expireAt: null
      })

      provider.useCoupon('user-123', 'ONETIME')
      const usedAgain = provider.useCoupon('user-123', 'ONETIME')
      expect(usedAgain).toBe(false)
    })
  })

  describe('Trial', () => {
    it('should grant trial to user', () => {
      const trial = provider.grantTrial('user-123', 'study', 7)

      expect(trial.id).toBeDefined()
      expect(trial.userId).toBe('user-123')
      expect(trial.entitlementCode).toBe('study')
      expect(trial.durationDays).toBe(7)
      expect(trial.used).toBe(false)
    })

    it('should activate trial and grant entitlement', () => {
      const trial = provider.grantTrial('user-123', 'study', 7)

      provider.activateTrial('user-123', trial.id)

      expect(trial.used).toBe(true)
      expect(entitlementService.has('user-123', 'study')).toBe(true)
    })

    it('should not activate already used trial', () => {
      const trial = provider.grantTrial('user-123', 'study', 7)
      provider.activateTrial('user-123', trial.id)

      expect(() => provider.activateTrial('user-123', trial.id)).toThrow('Trial already used')
    })

    it('should get user trials', () => {
      provider.grantTrial('user-123', 'study', 7)
      provider.grantTrial('user-123', 'agent', 3)

      const trials = provider.getUserTrials('user-123')
      expect(trials).toHaveLength(2)
    })

    it('should check active trial', () => {
      provider.grantTrial('user-123', 'study', 7)

      expect(provider.hasActiveTrial('user-123', 'study')).toBe(true)
      expect(provider.hasActiveTrial('user-123', 'agent')).toBe(false)
    })
  })

  describe('Invite Reward', () => {
    it('should create invite reward', () => {
      const reward = provider.createInviteReward('user-123', 'user-456', 30)

      expect(reward.id).toBeDefined()
      expect(reward.inviterId).toBe('user-123')
      expect(reward.inviteeId).toBe('user-456')
      expect(reward.status).toBe('pending')
      expect(reward.rewardDurationDays).toBe(30)
    })

    it('should activate invite reward for both users', () => {
      provider.createInviteReward('user-123', 'user-456', 30)

      provider.activateInviteReward('user-456')

      const rewards = provider.getInviteRewards('user-123')
      expect(rewards[0].status).toBe('active')
      expect(entitlementService.has('user-123', 'study')).toBe(true)
      expect(entitlementService.has('user-456', 'study')).toBe(true)
    })

    it('should get invite rewards', () => {
      provider.createInviteReward('user-123', 'user-456', 30)
      provider.createInviteReward('user-123', 'user-789', 30)

      const rewards = provider.getInviteRewards('user-123')
      expect(rewards).toHaveLength(2)
    })
  })
})
