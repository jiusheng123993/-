/**
 * 埋点分析服务
 *
 * 用户行为事件追踪、漏斗分析、页面停留统计，本地队列存储后批量上报
 */
import Taro from '@tarojs/taro'
import { api } from './api'
import type { UserProperties, FunnelStep } from '../types/analyticsTypes'

export interface AnalyticsEvent {
  eventName: string
  userId?: string
  petId?: string
  properties?: Record<string, unknown>
  timestamp: string
  platform: string
}

const EVENT_QUEUE_KEY = 'xhh_analytics_queue'
const USER_PROPERTIES_KEY = 'xhh_analytics_user_props'
const FUNNEL_STEPS_KEY = 'xhh_analytics_funnel_steps'
const MAX_QUEUE_SIZE = 100
const FLUSH_THRESHOLD = 20
/** 服务端 batchSchema 单次最多 50 条（超过会 400 Too big） */
const BATCH_SIZE = 50
/** 上报失败（429 等）后的退避窗口：期间不再发起 flush，避免打爆服务端限流 */
const RETRY_BACKOFF_MS = 60_000

const pageTimers: Map<string, number> = new Map()

// 上报单飞标志：防止阈值连发时多个 flush 并发，导致基于过期队列计数互相清空
let flushing = false
// 上次上报失败时间：429/5xx 后进入退避，等窗口重置再重试
let lastFlushFailAt = 0

function getUserId(): string | undefined {
  try {
    const user = Taro.getStorageSync('xhh_user')
    return user?.id
  } catch {
    return undefined
  }
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  const event: AnalyticsEvent = {
    eventName,
    userId: getUserId(),
    petId: properties?.petId as string,
    properties,
    timestamp: new Date().toISOString(),
    platform: (process.env as any).TARO_ENV || 'weapp',
  }

  const queue = getQueue()
  queue.push(event)

  if (queue.length > MAX_QUEUE_SIZE) {
    queue.shift()
  }

  Taro.setStorageSync(EVENT_QUEUE_KEY, JSON.stringify(queue))

  if (queue.length >= FLUSH_THRESHOLD) {
    flushEvents()
  }
}

export async function flushEvents(): Promise<void> {
  const queue = getQueue()
  // 队列为空或已有上报进行中时直接跳过（单飞），避免并发清空
  if (queue.length === 0 || flushing) return
  // 退避：上次上报失败（429/5xx）后 60 秒内不重试，让服务端限流窗口重置
  if (Date.now() - lastFlushFailAt < RETRY_BACKOFF_MS) return
  flushing = true

  try {
    // 单次只发一批（≤50 条）：服务端 batchSchema 限制单次最多 50 条，
    // 且一次发多批会瞬间消耗大量限流额度（120 次/分钟）导致 429；
    // 剩余队列留待下次阈值触发时再发，天然平滑。
    const batch = queue.slice(0, BATCH_SIZE)
    await api.post('/api/analytics/events', { events: batch })
    // 上报成功：清除已发送的 batch 条；上报期间新产生的事件（await 期间入队）
    // 用 slice 保留，避免整个队列被清空导致丢事件
    const remaining = getQueue()
    Taro.setStorageSync(EVENT_QUEUE_KEY, JSON.stringify(remaining.slice(batch.length)))
    lastFlushFailAt = 0
  } catch (error) {
    // 上报失败：记录失败时间进入退避，并保留队列等待下次重试（不静默丢事件）
    lastFlushFailAt = Date.now()
    console.warn('[Analytics] 事件上报失败，进入退避重试:', error)
  } finally {
    flushing = false
  }
}

export function getQueueLength(): number {
  return getQueue().length
}

export function clearQueue(): void {
  Taro.setStorageSync(EVENT_QUEUE_KEY, '[]')
}

export function setUserProperties(props: UserProperties): void {
  try {
    const existing = getUserProperties()
    const merged = existing ? { ...existing, ...props } : props
    Taro.setStorageSync(USER_PROPERTIES_KEY, JSON.stringify(merged))
  } catch {
    // ignore storage errors
  }
}

export function getUserProperties(): UserProperties | null {
  try {
    const raw = Taro.getStorageSync(USER_PROPERTIES_KEY)
    if (!raw) return null
    return JSON.parse(raw as string) as UserProperties
  } catch {
    return null
  }
}

export function trackFunnelStep(funnelName: string, stepName: string, stepIndex: number): void {
  const step: FunnelStep = {
    funnelName,
    stepName,
    stepIndex,
    timestamp: new Date().toISOString(),
  }

  try {
    const raw = Taro.getStorageSync(FUNNEL_STEPS_KEY)
    const steps: FunnelStep[] = raw ? JSON.parse(raw as string) : []
    steps.push(step)
    Taro.setStorageSync(FUNNEL_STEPS_KEY, JSON.stringify(steps))
  } catch {
    // ignore storage errors
  }

  trackEvent('funnel_step', {
    funnelName,
    stepName,
    stepIndex,
  })
}

export function startPageTimer(pageName: string): void {
  pageTimers.set(pageName, Date.now())
}

export function endPageTimer(pageName: string): void {
  const startTime = pageTimers.get(pageName)
  if (startTime == null) return

  const duration = Math.round((Date.now() - startTime) / 1000)
  pageTimers.delete(pageName)

  trackEvent('page_view', {
    pageName,
    duration,
  })
}

function getQueue(): AnalyticsEvent[] {
  try {
    const raw = Taro.getStorageSync(EVENT_QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw as string) as AnalyticsEvent[]
  } catch {
    return []
  }
}
