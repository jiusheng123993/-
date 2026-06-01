/**
 * Entitlement 权益数据契约
 *
 * 设计原则：
 * - 业务层永不直接判断「是否会员」，只查询「是否拥有某项 EntitlementCode」
 * - 任意付费产品、试用、赠送、活动都通过授予对应 EntitlementCode 实现
 * - Provider / 商品目录可独立增减，业务层不变
 */

/**
 * 权益代码枚举：业务层用此判断用户能用什么能力
 * - 订阅类：study / agent / agent_plus / space
 * - 配额类：ai_quota / ai_quota_study / ai_quota_agent / ai_quota_free / avatar_ai_gen
 * - 内容购买：theme_<id> / template_<id>
 * - 角色与记忆：avatar_rpm / memory_sync / evolution_ritual / evolution_realtime / avatar_evolution
 * - Agent 进阶：agent_tool_call
 * - B 端预留：org
 */
export type EntitlementCode =
  | 'study'
  | 'agent'
  | 'agent_plus'
  | 'space'
  | 'ai_quota'
  | 'ai_quota_study'
  | 'ai_quota_agent'
  | 'ai_quota_free'
  | 'theme_<id>'
  | 'template_<id>'
  | 'avatar_rpm'
  | 'avatar_ai_gen'
  | 'memory_sync'
  | 'evolution_ritual'
  | 'evolution_realtime'
  | 'avatar_evolution'
  | 'agent_tool_call'
  | 'org'

/**
 * 权益来源：用于审计、退款、续费判断
 */
export type EntitlementSource =
  | 'sub_monthly'
  | 'sub_quarterly'
  | 'sub_yearly'
  | 'space_monthly'
  | 'space_yearly'
  | 'ai_pack'
  | 'ai_unlimited_monthly'
  | 'one_time_purchase'
  | 'monthly_grant'
  | 'trial'
  | 'invite_reward'
  | 'early_bird_gift'
  | 'purchase'

/**
 * 单条权益记录
 * @property code 权益代码
 * @property source 来源（订阅 / 一次性购买 / 试用 / 赠送等）
 * @property expireAt 过期时间 ISO 字符串；null 代表永久（仅用于一次性购买）
 * @property scope 可选范围（如某个 themeId），用于精细化授权
 * @property remaining 剩余配额（仅配额类权益使用）
 * @property resetAt 配额下次重置时间
 * @property orderId 关联的订单号（便于退款联动）
 * @property grantedAt 授予时间 ISO 字符串（由 service 自动写入）
 */
export interface Entitlement {
  code: EntitlementCode
  source: EntitlementSource
  expireAt: string | null
  scope?: string
  remaining?: number
  resetAt?: string
  orderId?: string
  grantedAt: string
}

/**
 * 单个用户的权益快照（持久化单位）
 */
export interface UserEntitlements {
  userId: string
  entitlements: Entitlement[]
  updatedAt: string
}
