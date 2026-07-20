import type { EntitlementService } from './entitlementService'

export type UserTier = 'free' | 'study' | 'agent' | 'agent_plus'

export interface AgentTierProvider {
  getTier(userId: string): UserTier
  hasPermission(userId: string, permission: string): boolean
  isPro(userId: string): boolean
}

const tierPermissions: Record<UserTier, string[]> = {
  free: [],
  study: ['theme_all', 'cloud_sync', 'advanced_stats', 'ai_quota_study'],
  agent: [
    'memory_system',
    'agent_chat',
    'agent_silent',
    'self_evolution',
    'avatar_rpm',
    'avatar_evolution',
    'memory_sync'
  ],
  agent_plus: [
    'memory_system',
    'agent_chat',
    'agent_silent',
    'self_evolution',
    'self_evolution_realtime',
    'avatar_rpm',
    'avatar_ai_gen',
    'avatar_evolution',
    'memory_sync',
    'agent_tool_call'
  ]
}

export function createAgentTierProvider(entitlementService: EntitlementService): AgentTierProvider {
  return {
    getTier(userId: string): UserTier {
      if (entitlementService.has(userId, 'agent_plus')) return 'agent_plus'
      if (entitlementService.has(userId, 'agent')) return 'agent'
      if (entitlementService.has(userId, 'study')) return 'study'
      return 'free'
    },

    hasPermission(userId: string, permission: string): boolean {
      const tier = this.getTier(userId)
      const permissions = tierPermissions[tier]
      return permissions.includes(permission)
    },

    isPro(userId: string): boolean {
      const tier = this.getTier(userId)
      return tier !== 'free'
    }
  }
}
