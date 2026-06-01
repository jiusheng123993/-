import { describe, it, expect, beforeEach } from 'vitest'
import { createAgentTierProvider } from './agentTierProvider'
import { createEntitlementService } from './entitlementService'

describe('AgentTierProvider', () => {
  let provider: ReturnType<typeof createAgentTierProvider>
  let entitlementService: ReturnType<typeof createEntitlementService>

  beforeEach(() => {
    entitlementService = createEntitlementService()
    provider = createAgentTierProvider(entitlementService)
  })

  it('should return free tier for non-member', () => {
    expect(provider.getTier('user-123')).toBe('free')
  })

  it('should return study tier for study member', () => {
    entitlementService.grant('user-123', { code: 'study', source: 'sub_monthly', expireAt: null })
    expect(provider.getTier('user-123')).toBe('study')
  })

  it('should return agent tier for agent member', () => {
    entitlementService.grant('user-123', { code: 'agent', source: 'sub_monthly', expireAt: null })
    expect(provider.getTier('user-123')).toBe('agent')
  })

  it('should return agent_plus for plus member', () => {
    entitlementService.grant('user-123', { code: 'agent_plus', source: 'sub_monthly', expireAt: null })
    expect(provider.getTier('user-123')).toBe('agent_plus')
  })

  it('should prioritize agent_plus over agent', () => {
    entitlementService.grant('user-123', { code: 'agent', source: 'sub_monthly', expireAt: null })
    entitlementService.grant('user-123', { code: 'agent_plus', source: 'sub_monthly', expireAt: null })
    expect(provider.getTier('user-123')).toBe('agent_plus')
  })

  it('should check specific permissions', () => {
    entitlementService.grant('user-123', { code: 'agent', source: 'sub_monthly', expireAt: null })

    expect(provider.hasPermission('user-123', 'memory_system')).toBe(true)
    expect(provider.hasPermission('user-123', 'avatar_rpm')).toBe(true)
    expect(provider.hasPermission('user-123', 'avatar_ai_gen')).toBe(false)
    expect(provider.hasPermission('user-123', 'agent_tool_call')).toBe(false)
  })

  it('should check plus permissions', () => {
    entitlementService.grant('user-123', { code: 'agent_plus', source: 'sub_monthly', expireAt: null })

    expect(provider.hasPermission('user-123', 'avatar_ai_gen')).toBe(true)
    expect(provider.hasPermission('user-123', 'agent_tool_call')).toBe(true)
    expect(provider.hasPermission('user-123', 'self_evolution_realtime')).toBe(true)
  })

  it('should check study permissions', () => {
    entitlementService.grant('user-123', { code: 'study', source: 'sub_monthly', expireAt: null })

    expect(provider.hasPermission('user-123', 'theme_all')).toBe(true)
    expect(provider.hasPermission('user-123', 'cloud_sync')).toBe(true)
    expect(provider.hasPermission('user-123', 'memory_system')).toBe(false)
  })

  it('should return isPro compatibility', () => {
    entitlementService.grant('user-123', { code: 'study', source: 'sub_monthly', expireAt: null })
    expect(provider.isPro('user-123')).toBe(true)

    entitlementService.grant('user-456', { code: 'agent', source: 'sub_monthly', expireAt: null })
    expect(provider.isPro('user-456')).toBe(true)

    entitlementService.grant('user-789', { code: 'agent_plus', source: 'sub_monthly', expireAt: null })
    expect(provider.isPro('user-789')).toBe(true)

    expect(provider.isPro('user-no-entitlement')).toBe(false)
  })

  it('should handle expired entitlements', () => {
    entitlementService.grant('user-123', {
      code: 'agent',
      source: 'sub_monthly',
      expireAt: new Date(Date.now() - 1000).toISOString()
    })
    expect(provider.getTier('user-123')).toBe('free')
    expect(provider.isPro('user-123')).toBe(false)
  })
})
