export interface EntitlementService {
  has(userId: string, feature: string): boolean
}

export type ReflectionTier = 'none' | 'l1_teaser' | 'l2_weekly' | 'l4_realtime'

export interface ReflectionTierProvider {
  getReflectionTier(userId: string): ReflectionTier
  canAccessWeeklyRitual(userId: string): boolean
  canAccessRealtimeReflection(userId: string): boolean
  canAccessSelfEvolution(userId: string): boolean
  getReflectionFrequency(userId: string): 'weekly' | 'realtime' | 'none'
}

export function createReflectionTierProvider(entitlementService: EntitlementService): ReflectionTierProvider {
  return {
    getReflectionTier(userId: string): ReflectionTier {
      if (entitlementService.has(userId, 'agent_plus')) return 'l4_realtime'
      if (entitlementService.has(userId, 'agent')) return 'l2_weekly'
      if (entitlementService.has(userId, 'study')) return 'l1_teaser'
      return 'none'
    },

    canAccessWeeklyRitual(userId: string): boolean {
      return entitlementService.has(userId, 'agent') || entitlementService.has(userId, 'agent_plus')
    },

    canAccessRealtimeReflection(userId: string): boolean {
      return entitlementService.has(userId, 'agent_plus')
    },

    canAccessSelfEvolution(userId: string): boolean {
      return entitlementService.has(userId, 'agent') || entitlementService.has(userId, 'agent_plus')
    },

    getReflectionFrequency(userId: string): 'weekly' | 'realtime' | 'none' {
      const tier = this.getReflectionTier(userId)
      if (tier === 'l4_realtime') return 'realtime'
      if (tier === 'l2_weekly') return 'weekly'
      return 'none'
    }
  }
}
