/**
 * 佣金服务
 *
 * 合作推广佣金规则管理、点击/转化记录、结算统计
 */
import Taro from '@tarojs/taro'
import { getStorage, setStorage } from '../utils/storage'

export interface CommissionRule {
  id: string
  partnerId: string
  partnerName: string
  partnerType: 'hospital' | 'ecommerce' | 'insurance' | 'other'
  commissionType: 'cpa' | 'cps' | 'cpt'
  commissionRate: number
  commissionAmount: number
  minPayout: number
  validDays: number
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface ClickRecord {
  id: string
  partnerId: string
  userId: string
  sourcePage: string
  clickTime: number
  converted: boolean
  conversionId?: string
  conversionTime?: number
  settled: boolean
  settleTime?: number
  expireTime: number
}

export interface ConversionRecord {
  id: string
  partnerId: string
  clickId: string
  userId: string
  conversionType: 'phone_call' | 'navigation' | 'appointment' | 'purchase'
  conversionTime: number
  orderAmount?: number
  commissionAmount: number
  commissionRate: number
  settled: boolean
  settleTime?: number
  settleBatchId?: string
}

export interface SettlementBatch {
  id: string
  batchTime: number
  startTime: number
  endTime: number
  totalCommission: number
  conversionCount: number
  partnerBreakdown: Record<string, { count: number; amount: number }>
  status: 'pending' | 'confirmed' | 'paid'
}

export interface CommissionStats {
  totalClicks: number
  totalConversions: number
  totalCommission: number
  settledCommission: number
  pendingCommission: number
  conversionRate: number
  monthlyBreakdown: Array<{
    month: string
    clicks: number
    conversions: number
    commission: number
  }>
}

const STORAGE_KEY_RULES = 'commission_rules'
const STORAGE_KEY_CLICKS = 'commission_clicks'
const STORAGE_KEY_CONVERSIONS = 'commission_conversions'
const STORAGE_KEY_SETTLEMENTS = 'commission_settlements'

function generateId(): string {
  return `cm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getRules(): CommissionRule[] {
  return getStorage<CommissionRule[]>(STORAGE_KEY_RULES) || []
}

function saveRules(rules: CommissionRule[]): void {
  setStorage(STORAGE_KEY_RULES, rules)
}

function getClicks(): ClickRecord[] {
  return getStorage<ClickRecord[]>(STORAGE_KEY_CLICKS) || []
}

function saveClicks(clicks: ClickRecord[]): void {
  setStorage(STORAGE_KEY_CLICKS, clicks)
}

function getConversions(): ConversionRecord[] {
  return getStorage<ConversionRecord[]>(STORAGE_KEY_CONVERSIONS) || []
}

function saveConversions(conversions: ConversionRecord[]): void {
  setStorage(STORAGE_KEY_CONVERSIONS, conversions)
}

function getSettlements(): SettlementBatch[] {
  return getStorage<SettlementBatch[]>(STORAGE_KEY_SETTLEMENTS) || []
}

function saveSettlements(settlements: SettlementBatch[]): void {
  setStorage(STORAGE_KEY_SETTLEMENTS, settlements)
}

export function addCommissionRule(rule: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>): CommissionRule {
  const rules = getRules()
  const now = new Date().toISOString()
  const newRule: CommissionRule = {
    ...rule,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  rules.push(newRule)
  saveRules(rules)
  return newRule
}

export function updateCommissionRule(id: string, updates: Partial<CommissionRule>): CommissionRule | null {
  const rules = getRules()
  const index = rules.findIndex(r => r.id === id)
  if (index === -1) return null

  rules[index] = {
    ...rules[index],
    ...updates,
    id: rules[index].id,
    createdAt: rules[index].createdAt,
    updatedAt: new Date().toISOString(),
  }
  saveRules(rules)
  return rules[index]
}

export function deleteCommissionRule(id: string): boolean {
  const rules = getRules()
  const filtered = rules.filter(r => r.id !== id)
  if (filtered.length === rules.length) return false
  saveRules(filtered)
  return true
}

export function getCommissionRules(partnerType?: CommissionRule['partnerType']): CommissionRule[] {
  const rules = getRules()
  if (partnerType) {
    return rules.filter(r => r.partnerType === partnerType && r.enabled)
  }
  return rules.filter(r => r.enabled)
}

export function getCommissionRuleByPartner(partnerId: string): CommissionRule | null {
  const rules = getRules()
  return rules.find(r => r.partnerId === partnerId && r.enabled) || null
}

export function rankHospitalPartners(
  hospitals: Array<{ id: string; name: string }>
): Array<{ id: string; name: string; commissionRate: number; hasCommission: boolean }> {
  const rules = getRules()
  return hospitals.map(h => {
    const rule = rules.find(r => r.partnerId === h.id && r.partnerType === 'hospital' && r.enabled)
    return {
      id: h.id,
      name: h.name,
      commissionRate: rule?.commissionRate ?? 0,
      hasCommission: !!rule,
    }
  })
}

export function recordClick(params: {
  partnerId: string
  userId: string
  sourcePage: string
  partnerType: CommissionRule['partnerType']
  validDays?: number
}): string {
  const clicks = getClicks()
  const rule = getCommissionRuleByPartner(params.partnerId)
  const validDays = params.validDays ?? rule?.validDays ?? 30
  const now = Date.now()

  const click: ClickRecord = {
    id: generateId(),
    partnerId: params.partnerId,
    userId: params.userId,
    sourcePage: params.sourcePage,
    clickTime: now,
    converted: false,
    settled: false,
    expireTime: now + validDays * 24 * 60 * 60 * 1000,
  }
  clicks.push(click)
  saveClicks(clicks)

  return click.id
}

export function recordConversion(params: {
  partnerId: string
  clickId: string
  userId: string
  conversionType: ConversionRecord['conversionType']
  orderAmount?: number
}): ConversionRecord | null {
  const clicks = getClicks()
  const clickIndex = clicks.findIndex(c => c.id === params.clickId && !c.converted && c.expireTime > Date.now())
  if (clickIndex === -1) {
    return null
  }

  clicks[clickIndex].converted = true
  clicks[clickIndex].conversionTime = Date.now()
  clicks[clickIndex].conversionId = generateId()
  saveClicks(clicks)

  const rule = getCommissionRuleByPartner(params.partnerId)
  const commissionRate = rule?.commissionRate ?? 0
  let commissionAmount = rule?.commissionAmount ?? 0

  if (rule?.commissionType === 'cps' && params.orderAmount) {
    commissionAmount = params.orderAmount * commissionRate
  }

  const now = Date.now()
  const conversion: ConversionRecord = {
    id: clicks[clickIndex].conversionId!,
    partnerId: params.partnerId,
    clickId: params.clickId,
    userId: params.userId,
    conversionType: params.conversionType,
    conversionTime: now,
    orderAmount: params.orderAmount,
    commissionAmount,
    commissionRate,
    settled: false,
  }
  const conversions = getConversions()
  conversions.push(conversion)
  saveConversions(conversions)

  return conversion
}

export function settlePendingCommissions(): SettlementBatch {
  const conversions = getConversions()
  const unsettled = conversions.filter(c => !c.settled)
  if (unsettled.length === 0) {
    return {
      id: '',
      batchTime: Date.now(),
      startTime: 0,
      endTime: Date.now(),
      totalCommission: 0,
      conversionCount: 0,
      partnerBreakdown: {},
      status: 'pending',
    }
  }

  let totalCommission = 0
  const partnerBreakdown: Record<string, { count: number; amount: number }> = {}

  unsettled.forEach(c => {
    c.settled = true
    c.settleTime = Date.now()
    c.settleBatchId = `batch_${Date.now()}`

    totalCommission += c.commissionAmount
    if (!partnerBreakdown[c.partnerId]) {
      partnerBreakdown[c.partnerId] = { count: 0, amount: 0 }
    }
    partnerBreakdown[c.partnerId].count++
    partnerBreakdown[c.partnerId].amount += c.commissionAmount
  })

  saveConversions(conversions)

  const settlement: SettlementBatch = {
    id: `stl_${Date.now()}`,
    batchTime: Date.now(),
    startTime: Math.min(...unsettled.map(c => c.conversionTime)),
    endTime: Math.max(...unsettled.map(c => c.conversionTime)),
    totalCommission: Math.round(totalCommission * 100) / 100,
    conversionCount: unsettled.length,
    partnerBreakdown,
    status: 'pending',
  }

  const settlements = getSettlements()
  settlements.push(settlement)
  saveSettlements(settlements)

  return settlement
}

export function confirmSettlement(batchId: string): boolean {
  const settlements = getSettlements()
  const index = settlements.findIndex(s => s.id === batchId)
  if (index === -1) return false
  settlements[index].status = 'confirmed'
  saveSettlements(settlements)
  return true
}

export function getCommissionStats(userId?: string): CommissionStats {
  const clicks = getClicks()
  const conversions = getConversions()

  const filteredClicks = userId ? clicks.filter(c => c.userId === userId) : clicks
  const filteredConversions = userId ? conversions.filter(c => c.userId === userId) : conversions

  const totalClicks = filteredClicks.length
  const totalConversions = filteredConversions.length
  const settledAmount = filteredConversions.filter(c => c.settled).reduce((sum, c) => sum + c.commissionAmount, 0)
  const pendingAmount = filteredConversions.filter(c => !c.settled).reduce((sum, c) => sum + c.commissionAmount, 0)
  const totalCommission = settledAmount + pendingAmount

  const monthlyMap = new Map<string, { clicks: number; conversions: number; commission: number }>()
  filteredClicks.forEach(c => {
    const month = new Date(c.clickTime).toISOString().slice(0, 7)
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { clicks: 0, conversions: 0, commission: 0 })
    }
    monthlyMap.get(month)!.clicks++
  })
  filteredConversions.forEach(c => {
    const month = new Date(c.conversionTime).toISOString().slice(0, 7)
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { clicks: 0, conversions: 0, commission: 0 })
    }
    monthlyMap.get(month)!.conversions++
    monthlyMap.get(month)!.commission += c.commissionAmount
  })

  const monthlyBreakdown = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, data]) => ({
      month,
      clicks: data.clicks,
      conversions: data.conversions,
      commission: Math.round(data.commission * 100) / 100,
    }))

  return {
    totalClicks,
    totalConversions,
    totalCommission: Math.round(totalCommission * 100) / 100,
    settledCommission: Math.round(settledAmount * 100) / 100,
    pendingCommission: Math.round(pendingAmount * 100) / 100,
    conversionRate: totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 10000) / 100 : 0,
    monthlyBreakdown,
  }
}

export function clearExpiredClicks(): number {
  const clicks = getClicks()
  const now = Date.now()
  const valid = clicks.filter(c => c.expireTime > now || c.converted)
  const cleared = clicks.length - valid.length
  if (cleared > 0) {
    saveClicks(valid)
  }
  return cleared
}
