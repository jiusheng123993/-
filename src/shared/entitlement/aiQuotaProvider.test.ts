import { beforeEach, describe, expect, it } from 'vitest'
import { createAiQuotaProvider } from './aiQuotaProvider'
import { createEntitlementService } from './entitlementService'

describe('AiQuotaProvider', () => {
  let entitlementService: ReturnType<typeof createEntitlementService>
  let provider: ReturnType<typeof createAiQuotaProvider>

  beforeEach(() => {
    entitlementService = createEntitlementService()
    provider = createAiQuotaProvider(entitlementService)
  })

  it('should consume from ai_quota_free when no other quota exists', () => {
    // 假设系统有默认免费额度 5 个
    entitlementService.grant('user-123', { code: 'ai_quota_free', source: 'monthly_grant', expireAt: null, remaining: 5 })
    const result = provider.consume('user-123')
    expect(result.ok).toBe(true)
    expect(result.source).toBe('ai_quota_free')
    expect(result.remaining).toBe(4) // 5 - 1
  })

  it('should consume from ai_quota_study when free is exhausted', () => {
    // 耗尽免费额度
    for (let i = 0; i < 5; i++) provider.consume('user-123')
    // 授予学习会员额度
    entitlementService.grant('user-123', { code: 'ai_quota_study', source: 'sub_monthly', expireAt: null, remaining: 100 })
    // 下一次应从学习会员额度扣
    const result = provider.consume('user-123')
    expect(result.ok).toBe(true)
    expect(result.source).toBe('ai_quota_study')
    expect(result.remaining).toBe(99)
  })

  it('should consume from ai_quota when pack is available', () => {
    entitlementService.grant('user-123', { code: 'ai_quota', source: 'ai_pack', expireAt: null, remaining: 50 })
    const result = provider.consume('user-123')
    expect(result.ok).toBe(true)
    expect(result.source).toBe('ai_quota')
    expect(result.remaining).toBe(49)
  })

  it('should prioritize: free → study → agent → pack', () => {
    // 全部授予
    entitlementService.grant('user-123', { code: 'ai_quota_free', source: 'monthly_grant', expireAt: null, remaining: 5 })
    entitlementService.grant('user-123', { code: 'ai_quota_study', source: 'sub_monthly', expireAt: null, remaining: 100 })
    entitlementService.grant('user-123', { code: 'ai_quota_agent', source: 'sub_monthly', expireAt: null, remaining: 200 })
    entitlementService.grant('user-123', { code: 'ai_quota', source: 'ai_pack', expireAt: null, remaining: 300 })

    // 耗尽 free
    for (let i = 0; i < 5; i++) provider.consume('user-123')
    // 耗尽 study
    for (let i = 0; i < 100; i++) provider.consume('user-123')
    // 耗尽 agent
    for (let i = 0; i < 200; i++) provider.consume('user-123')
    // 最后应该用 pack
    const result = provider.consume('user-123')
    expect(result.ok).toBe(true)
    expect(result.source).toBe('ai_quota')
    expect(result.remaining).toBe(299)
  })

  it('should return insufficient when all quotas exhausted', () => {
    // 不授予任何额度
    const result = provider.consume('user-123')
    expect(result.ok).toBe(false)
    expect(result.source).toBeUndefined()
    expect(result.remaining).toBeUndefined()
  })

  it('should reject consume with n <= 0', () => {
    expect(provider.consume('user-123', 0).ok).toBe(false)
    expect(provider.consume('user-123', -1).ok).toBe(false)
  })

  it('should get quota status for all levels', () => {
    entitlementService.grant('user-123', { code: 'ai_quota_free', source: 'monthly_grant', expireAt: null, remaining: 5 })
    entitlementService.grant('user-123', { code: 'ai_quota_study', source: 'sub_monthly', expireAt: null, remaining: 100 })
    entitlementService.grant('user-123', { code: 'ai_quota', source: 'ai_pack', expireAt: null, remaining: 50 })

    const status = provider.getQuotaStatus('user-123')
    expect(status.free.remaining).toBe(5)
    expect(status.study?.remaining).toBe(100)
    expect(status.agent).toBeNull()
    expect(status.pack?.remaining).toBe(50)
    expect(status.activeSource).toBe('ai_quota_free')
  })

  it('should return null for expired quota in status', () => {
    entitlementService.grant('user-123', { code: 'ai_quota_study', source: 'sub_monthly', expireAt: new Date(Date.now() - 1000).toISOString(), remaining: 100 })
    const status = provider.getQuotaStatus('user-123')
    expect(status.study).toBeNull()
  })

  it('should handle missing user gracefully', () => {
    expect(provider.consume('non-existent-user').ok).toBe(false)
    expect(provider.getQuotaStatus('non-existent-user').activeSource).toBeNull()
  })

  it('should consume multiple units at once', () => {
    entitlementService.grant('user-123', { code: 'ai_quota', source: 'ai_pack', expireAt: null, remaining: 10 })
    const result = provider.consume('user-123', 3)
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(7)
  })

  it('should reject when single quota insufficient for batch consume', () => {
    entitlementService.grant('user-123', { code: 'ai_quota', source: 'ai_pack', expireAt: null, remaining: 2 })
    const result = provider.consume('user-123', 5)
    expect(result.ok).toBe(false)
    // 消费失败时 remaining 为 undefined（因为没有成功消费）
    expect(result.remaining).toBeUndefined()
  })
})
