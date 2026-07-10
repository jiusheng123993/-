import type { EntitlementService } from './entitlementService'

export interface AvatarAiGenQuotaProvider {
  consume(userId: string): { ok: boolean; remaining?: number }
  getRemaining(userId: string): number
  getTotalUsed(userId: string): number
}

export function createAvatarAiGenQuotaProvider(entitlementService: EntitlementService): AvatarAiGenQuotaProvider {
  const usageCount = new Map<string, number>()

  return {
    consume(userId: string): { ok: boolean; remaining?: number } {
      const entitlements = entitlementService.list(userId)
      const quotaEntitlement = entitlements.find(
        (e) => e.code === 'avatar_ai_gen' && (e.remaining === undefined || e.remaining > 0)
      )

      if (quotaEntitlement) {
        if (quotaEntitlement.remaining !== undefined && quotaEntitlement.remaining > 0) {
          const result = entitlementService.consume(userId, 'avatar_ai_gen', 1)
          if (!result.ok) {
            return { ok: false }
          }

          const currentUsage = usageCount.get(userId) ?? 0
          usageCount.set(userId, currentUsage + 1)

          return { ok: true, remaining: result.remaining }
        }
      }

      const hasAgentPlus = entitlements.some(
        (e) => e.code === 'agent_plus' && (!e.expireAt || new Date(e.expireAt).getTime() > Date.now())
      )

      if (!hasAgentPlus) {
        return { ok: false }
      }

      const currentUsage = usageCount.get(userId) ?? 0
      const monthlyLimit = 5000

      if (currentUsage >= monthlyLimit) {
        return { ok: false }
      }

      usageCount.set(userId, currentUsage + 1)
      return { ok: true, remaining: monthlyLimit - currentUsage - 1 }
    },

    getRemaining(userId: string): number {
      const entitlements = entitlementService.list(userId)
      const quotaEntitlement = entitlements.find((e) => e.code === 'avatar_ai_gen')

      if (quotaEntitlement?.remaining !== undefined) {
        return quotaEntitlement.remaining
      }

      if (entitlements.some((e) => e.code === 'agent_plus')) {
        const used = usageCount.get(userId) ?? 0
        return Math.max(0, 5000 - used)
      }

      return 0
    },

    getTotalUsed(userId: string): number {
      return usageCount.get(userId) ?? 0
    }
  }
}
