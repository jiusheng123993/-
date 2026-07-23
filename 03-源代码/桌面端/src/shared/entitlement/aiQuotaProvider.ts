/**
 * AiQuotaProvider - AI 额度消费优先级管理器
 *
 * 职责：
 * - 封装 EntitlementService 的配额消费逻辑
 * - 实现优先级链：free → study → agent → pack
 * - 提供简洁 API：consume() 自动选优先级，getQuotaStatus() 查看各层级剩余
 *
 * 设计要点：
 * - 优先级链顺序：ai_quota_free → ai_quota_study → ai_quota_agent → ai_quota
 * - consume(n) 一次消费 n 个单位，从最高优先级且有剩余的层级扣除
 * - 若当前层级不够，尝试下一级（跨层级消费）
 * - 若全部耗尽，返回 ok:false
 *
 * 扩展：
 * - 新增优先级：在 quotaPriority 数组追加新 code
 * - 新增免费额度：在 productCatalog 追加 ai_quota_free grant
 */

import type { EntitlementService } from './entitlementService'
import type { EntitlementCode } from './entitlementTypes'

export interface ConsumeResult {
  ok: boolean
  source?: EntitlementCode
  remaining?: number
}

export interface QuotaStatus {
  free: { remaining: number } | null
  study: { remaining: number } | null
  agent: { remaining: number } | null
  pack: { remaining: number } | null
  activeSource: EntitlementCode | null
}

/**
 * 额度优先级链：从左到右依次尝试
 */
const quotaPriority: EntitlementCode[] = [
  'ai_quota_free',
  'ai_quota_study',
  'ai_quota_agent',
  'ai_quota'
]

/**
 * 创建 AI 额度提供者工厂，注入 EntitlementService 实例。
 */
export function createAiQuotaProvider(
  entitlementService: EntitlementService
): {
  /** 消费 n 个 AI 额度，自动从最高优先级且有剩余的层级扣除 */
  consume: (userId: string, n?: number) => ConsumeResult
  /** 查询用户在各层级的额度状态 */
  getQuotaStatus: (userId: string) => QuotaStatus
} {
  const getRemaining = (userId: string, code: EntitlementCode): number | null => {
    const entitlements = entitlementService.list(userId)
    const ent = entitlements.find(
      (e) => e.code === code && typeof e.remaining === 'number' && entitlementService.has(userId, code)
    )
    return ent?.remaining ?? null
  }

  const consume = (userId: string, n = 1): ConsumeResult => {
    if (!userId) return { ok: false }
    if (!Number.isFinite(n) || n <= 0) return { ok: false }

    for (const code of quotaPriority) {
      const remaining = getRemaining(userId, code)
      if (remaining === null) continue

      if (remaining >= n) {
        const result = entitlementService.consume(userId, code, n)
        if (result.ok) {
          return { ok: true, source: code, remaining: result.remaining }
        }
      } else if (remaining > 0) {
        // 当前层级不够，尝试消耗完当前层级后继续下一级
        const partialResult = entitlementService.consume(userId, code, remaining)
        if (partialResult.ok) {
          // 递归尝试从下一级消费剩余数量
          const remainingN = n - remaining
          const nextResult = consume(userId, remainingN)
          if (nextResult.ok) {
            return nextResult
          }
          // 下一级也不够，返回失败（已消耗的无法退回，简化处理）
          return { ok: false }
        }
      }
    }

    return { ok: false }
  }

  const getQuotaStatus = (userId: string): QuotaStatus => {
    const free = getRemaining(userId, 'ai_quota_free')
    const study = getRemaining(userId, 'ai_quota_study')
    const agent = getRemaining(userId, 'ai_quota_agent')
    const pack = getRemaining(userId, 'ai_quota')

    let activeSource: EntitlementCode | null = null
    for (const code of quotaPriority) {
      const remaining = getRemaining(userId, code)
      if (remaining !== null && remaining > 0) {
        activeSource = code
        break
      }
    }

    return {
      free: free !== null ? { remaining: free } : null,
      study: study !== null ? { remaining: study } : null,
      agent: agent !== null ? { remaining: agent } : null,
      pack: pack !== null ? { remaining: pack } : null,
      activeSource
    }
  }

  return { consume, getQuotaStatus }
}
