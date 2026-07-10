import type { EntitlementService } from './entitlementService'
import type { EntitlementCode } from './entitlementTypes'

export type CouponType = 'discount' | 'free_trial' | 'credit'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  discountAmount?: number
  discountPercent?: number
  durationDays?: number
  creditAmount?: number
  applicableProducts?: string[]
  maxUses?: number
  usedCount: number
  expireAt: string | null
  createdAt: string
}

export interface Trial {
  id: string
  userId: string
  entitlementCode: EntitlementCode
  durationDays: number
  startedAt: string
  expireAt: string
  used: boolean
}

export interface InviteReward {
  id: string
  inviterId: string
  inviteeId: string
  rewardCode: EntitlementCode
  rewardDurationDays: number
  status: 'pending' | 'active' | 'expired'
  createdAt: string
  activatedAt?: string
}

export interface TrialCouponInviteProvider {
  createCoupon(coupon: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>): Coupon
  getCouponByCode(code: string): Coupon | null
  useCoupon(userId: string, code: string): boolean
  validateCoupon(code: string): { valid: boolean; message?: string }

  grantTrial(userId: string, entitlementCode: EntitlementCode, durationDays: number): Trial
  activateTrial(userId: string, trialId: string): void
  getUserTrials(userId: string): Trial[]
  hasActiveTrial(userId: string, entitlementCode: EntitlementCode): boolean

  createInviteReward(inviterId: string, inviteeId: string, rewardDays: number): InviteReward
  activateInviteReward(inviteeId: string): void
  getInviteRewards(userId: string): InviteReward[]
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function createTrialCouponInviteProvider(
  entitlementService: EntitlementService
): TrialCouponInviteProvider {
  const coupons = new Map<string, Coupon>()
  const userCouponUsage = new Map<string, Set<string>>()
  const trials = new Map<string, Trial>()
  const userTrials = new Map<string, Trial[]>()
  const inviteRewards = new Map<string, InviteReward[]>()

  return {
    createCoupon(couponData: Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>): Coupon {
      const coupon: Coupon = {
        ...couponData,
        id: generateId(),
        usedCount: 0,
        createdAt: new Date().toISOString()
      }
      coupons.set(coupon.code, coupon)
      return coupon
    },

    getCouponByCode(code: string): Coupon | null {
      return coupons.get(code) ?? null
    },

    useCoupon(userId: string, code: string): boolean {
      const coupon = coupons.get(code)
      if (!coupon) return false

      if (coupon.expireAt && new Date(coupon.expireAt).getTime() < Date.now()) {
        return false
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return false
      }

      const userUsed = userCouponUsage.get(userId) ?? new Set()
      if (userUsed.has(code)) {
        return false
      }

      coupon.usedCount += 1
      userUsed.add(code)
      userCouponUsage.set(userId, userUsed)

      if (coupon.type === 'free_trial' && coupon.durationDays) {
        entitlementService.grant(userId, {
          code: 'study',
          source: 'trial',
          expireAt: new Date(Date.now() + coupon.durationDays * 24 * 60 * 60 * 1000).toISOString()
        })
      } else if (coupon.type === 'credit' && coupon.creditAmount) {
        entitlementService.grant(userId, {
          code: 'ai_quota',
          source: 'one_time_purchase',
          expireAt: null,
          remaining: coupon.creditAmount
        })
      }

      return true
    },

    validateCoupon(code: string): { valid: boolean; message?: string } {
      const coupon = coupons.get(code)
      if (!coupon) {
        return { valid: false, message: 'Coupon not found' }
      }

      if (coupon.expireAt && new Date(coupon.expireAt).getTime() < Date.now()) {
        return { valid: false, message: 'Coupon expired' }
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return { valid: false, message: 'Coupon usage limit reached' }
      }

      return { valid: true }
    },

    grantTrial(userId: string, entitlementCode: EntitlementCode, durationDays: number): Trial {
      const trial: Trial = {
        id: generateId(),
        userId,
        entitlementCode,
        durationDays,
        startedAt: new Date().toISOString(),
        expireAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
        used: false
      }

      trials.set(trial.id, trial)

      const userTrialList = userTrials.get(userId) ?? []
      userTrialList.push(trial)
      userTrials.set(userId, userTrialList)

      return trial
    },

    activateTrial(userId: string, trialId: string): void {
      const trial = trials.get(trialId)
      if (!trial || trial.userId !== userId) {
        throw new Error('Trial not found')
      }

      if (trial.used) {
        throw new Error('Trial already used')
      }

      const expireAt = new Date(trial.expireAt).getTime()
      if (expireAt < Date.now()) {
        throw new Error('Trial expired')
      }

      trial.used = true

      entitlementService.grant(userId, {
        code: trial.entitlementCode,
        source: 'trial',
        expireAt: trial.expireAt
      })
    },

    getUserTrials(userId: string): Trial[] {
      return userTrials.get(userId) ?? []
    },

    hasActiveTrial(userId: string, entitlementCode: EntitlementCode): boolean {
      const userTrialList = userTrials.get(userId) ?? []
      return userTrialList.some(
        (t) => t.entitlementCode === entitlementCode && !t.used && new Date(t.expireAt).getTime() > Date.now()
      )
    },

    createInviteReward(inviterId: string, inviteeId: string, rewardDays: number): InviteReward {
      const reward: InviteReward = {
        id: generateId(),
        inviterId,
        inviteeId,
        rewardCode: 'study',
        rewardDurationDays: rewardDays,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      const inviterRewards = inviteRewards.get(inviterId) ?? []
      inviterRewards.push(reward)
      inviteRewards.set(inviterId, inviterRewards)

      return reward
    },

    activateInviteReward(inviteeId: string): void {
      const allRewards = Array.from(inviteRewards.values()).flat()
      const reward = allRewards.find((r) => r.inviteeId === inviteeId && r.status === 'pending')

      if (!reward) {
        throw new Error('No pending invite reward found')
      }

      reward.status = 'active'
      reward.activatedAt = new Date().toISOString()

      const expireAt = new Date(Date.now() + reward.rewardDurationDays * 24 * 60 * 60 * 1000).toISOString()
      entitlementService.grant(reward.inviteeId, {
        code: reward.rewardCode,
        source: 'invite_reward',
        expireAt
      })
      entitlementService.grant(reward.inviterId, {
        code: reward.rewardCode,
        source: 'invite_reward',
        expireAt
      })
    },

    getInviteRewards(userId: string): InviteReward[] {
      return inviteRewards.get(userId) ?? []
    }
  }
}
