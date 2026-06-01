/**
 * ProductCatalog - 商品目录
 *
 * 职责：
 * - 声明所有可购买商品（订阅、加油包、一次性购买）
 * - 提供查询接口：按 ID、按类型、按活跃状态
 * - 价格单位统一为「分」，避免浮点精度问题
 *
 * 扩展方式：
 * - 新增商品：在 productCatalog 数组追加即可
 * - 新增渠道：在 PaymentChannel 联合类型追加，商品 channel 数组追加
 * - 限时活动：设置 visibleFrom / visibleTo 时间窗
 */

import type { Product, ProductType } from './productTypes'

export const productCatalog: Product[] = [
  {
    id: 'study_monthly',
    name: '学习会员·月付',
    type: 'subscription',
    period: 'month',
    price: 1800,
    grants: [{ code: 'study', durationDays: 30 }],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  },
  {
    id: 'study_quarterly',
    name: '学习会员·季付',
    type: 'subscription',
    period: 'quarter',
    price: 4500,
    grants: [{ code: 'study', durationDays: 90 }],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  },
  {
    id: 'study_yearly',
    name: '学习会员·年付',
    type: 'subscription',
    period: 'year',
    price: 12800,
    originalPrice: 21600,
    grants: [{ code: 'study', durationDays: 365 }],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  },
  {
    id: 'agent_monthly',
    name: 'Agent 会员·月付',
    type: 'subscription',
    period: 'month',
    price: 6400,
    grants: [
      { code: 'agent', durationDays: 30 },
      { code: 'study', durationDays: 30 },
      { code: 'avatar_rpm', durationDays: 30 },
      { code: 'memory_sync', durationDays: 30 },
      { code: 'evolution_ritual', durationDays: 30 },
      { code: 'avatar_evolution', durationDays: 30 }
    ],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  },
  {
    id: 'agent_monthly_early',
    name: 'Agent 会员·首发月付',
    type: 'subscription',
    period: 'month',
    price: 4800,
    originalPrice: 6400,
    grants: [
      { code: 'agent', durationDays: 30 },
      { code: 'study', durationDays: 30 },
      { code: 'avatar_rpm', durationDays: 30 },
      { code: 'memory_sync', durationDays: 30 },
      { code: 'evolution_ritual', durationDays: 30 },
      { code: 'avatar_evolution', durationDays: 30 }
    ],
    channel: ['wechat', 'apple', 'alipay'],
    active: true,
    visibleTo: '2026-09-30'
  },
  {
    id: 'agent_quarterly',
    name: 'Agent 会员·季付',
    type: 'subscription',
    period: 'quarter',
    price: 17280,
    originalPrice: 19200,
    grants: [
      { code: 'agent', durationDays: 90 },
      { code: 'study', durationDays: 90 },
      { code: 'avatar_rpm', durationDays: 90 },
      { code: 'memory_sync', durationDays: 90 },
      { code: 'evolution_ritual', durationDays: 90 },
      { code: 'avatar_evolution', durationDays: 90 }
    ],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  },
  {
    id: 'agent_yearly',
    name: 'Agent 会员·年付',
    type: 'subscription',
    period: 'year',
    price: 32800,
    originalPrice: 76800,
    grants: [
      { code: 'agent', durationDays: 365 },
      { code: 'study', durationDays: 365 },
      { code: 'avatar_rpm', durationDays: 365 },
      { code: 'memory_sync', durationDays: 365 },
      { code: 'evolution_ritual', durationDays: 365 },
      { code: 'avatar_evolution', durationDays: 365 }
    ],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  },
  {
    id: 'agent_plus_monthly',
    name: 'Agent PLUS·月付',
    type: 'subscription',
    period: 'month',
    price: 12800,
    grants: [
      { code: 'agent_plus', durationDays: 30 },
      { code: 'agent', durationDays: 30 },
      { code: 'study', durationDays: 30 },
      { code: 'avatar_rpm', durationDays: 30 },
      { code: 'avatar_ai_gen', quantity: 10 },
      { code: 'memory_sync', durationDays: 30 },
      { code: 'evolution_ritual', durationDays: 30 },
      { code: 'evolution_realtime', durationDays: 30 },
      { code: 'avatar_evolution', durationDays: 30 },
      { code: 'agent_tool_call', durationDays: 30 }
    ],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  },
  {
    id: 'agent_plus_monthly_early',
    name: 'Agent PLUS·首发月付',
    type: 'subscription',
    period: 'month',
    price: 9800,
    originalPrice: 12800,
    grants: [
      { code: 'agent_plus', durationDays: 30 },
      { code: 'agent', durationDays: 30 },
      { code: 'study', durationDays: 30 },
      { code: 'avatar_rpm', durationDays: 30 },
      { code: 'avatar_ai_gen', quantity: 10 },
      { code: 'memory_sync', durationDays: 30 },
      { code: 'evolution_ritual', durationDays: 30 },
      { code: 'evolution_realtime', durationDays: 30 },
      { code: 'avatar_evolution', durationDays: 30 },
      { code: 'agent_tool_call', durationDays: 30 }
    ],
    channel: ['wechat', 'apple', 'alipay'],
    active: true,
    visibleTo: '2026-09-30'
  },
  {
    id: 'agent_plus_quarterly',
    name: 'Agent PLUS·季付',
    type: 'subscription',
    period: 'quarter',
    price: 34560,
    originalPrice: 38400,
    grants: [
      { code: 'agent_plus', durationDays: 90 },
      { code: 'agent', durationDays: 90 },
      { code: 'study', durationDays: 90 },
      { code: 'avatar_rpm', durationDays: 90 },
      { code: 'avatar_ai_gen', quantity: 30 },
      { code: 'memory_sync', durationDays: 90 },
      { code: 'evolution_ritual', durationDays: 90 },
      { code: 'evolution_realtime', durationDays: 90 },
      { code: 'avatar_evolution', durationDays: 90 },
      { code: 'agent_tool_call', durationDays: 90 }
    ],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  },
  {
    id: 'agent_plus_yearly',
    name: 'Agent PLUS·年付',
    type: 'subscription',
    period: 'year',
    price: 69800,
    originalPrice: 153600,
    grants: [
      { code: 'agent_plus', durationDays: 365 },
      { code: 'agent', durationDays: 365 },
      { code: 'study', durationDays: 365 },
      { code: 'avatar_rpm', durationDays: 365 },
      { code: 'avatar_ai_gen', quantity: 120 },
      { code: 'memory_sync', durationDays: 365 },
      { code: 'evolution_ritual', durationDays: 365 },
      { code: 'evolution_realtime', durationDays: 365 },
      { code: 'avatar_evolution', durationDays: 365 },
      { code: 'agent_tool_call', durationDays: 365 }
    ],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  },
  {
    id: 'ai_pack_100',
    name: 'AI 加油包·100次',
    type: 'pack',
    price: 990,
    grants: [{ code: 'ai_quota', quantity: 100 }],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  },
  {
    id: 'ai_pack_unlimited',
    name: 'AI 加油包·不限量月卡',
    type: 'pack',
    price: 2900,
    grants: [{ code: 'ai_quota', durationDays: 30 }],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  },
  {
    id: 'avatar_ai_gen_pack_10',
    name: 'AI 3D 角色生成额度包·10次',
    type: 'pack',
    price: 3000,
    grants: [{ code: 'avatar_ai_gen', quantity: 10 }],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  },
  {
    id: 'memory_sync_storage_1gb',
    name: '记忆云同步加量包·1GB / 年',
    type: 'pack',
    price: 1000,
    grants: [{ code: 'memory_sync', durationDays: 365 }],
    channel: ['wechat', 'apple', 'alipay'],
    active: true
  }
]

export function getProductById(id: string): Product | undefined {
  return productCatalog.find((p) => p.id === id)
}

export function getActiveProducts(): Product[] {
  const now = new Date()
  return productCatalog.filter((p) => {
    if (!p.active) return false
    if (p.visibleFrom && new Date(p.visibleFrom) > now) return false
    if (p.visibleTo && new Date(p.visibleTo) < now) return false
    return true
  })
}

export function getProductsByType(type: ProductType): Product[] {
  return productCatalog.filter((p) => p.type === type)
}
