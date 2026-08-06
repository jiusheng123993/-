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

const pageTimers: Map<string, number> = new Map()

// 上报单飞标志：防止阈值连发时多个 flush 并发，导致基于过期队列计数互相清空
let flushing = false

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
  flushing = true

  try {
    // 真实上报：把本地队列批量 POST 到服务端 /api/analytics/events
    await api.post('/api/analytics/events', { events: queue })
    // 上报成功后才清除已发送的前 N 条；上报期间新产生的事件（可能在 await 期间入队）
    // 用 slice 保留下来，避免整个队列被清空导致丢事件
    const remaining = getQueue()
    Taro.setStorageSync(EVENT_QUEUE_KEY, JSON.stringify(remaining.slice(queue.length)))
  } catch (error) {
    // 上报失败时保留队列，等待下次达到阈值或手动重试（不静默丢事件）
    console.warn('[Analytics] 事件上报失败，队列保留待重试:', error)
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
