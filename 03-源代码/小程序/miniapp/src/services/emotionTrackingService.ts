/**
 * 情绪追踪服务
 *
 * 记录用户异常情绪事件，计算情绪评分、趋势分析、危机干预触发
 */
import Taro from '@tarojs/taro'

export type EmotionEventType = 'anomaly_detected' | 'symptom_check' | 'food_query' | 'grief_detected' | 'anxiety_detected'
export type EmotionSeverity = 'mild' | 'moderate' | 'severe'
export type EmotionTrend = 'improving' | 'stable' | 'worsening'

interface EmotionEvent {
  timestamp: number
  eventType: EmotionEventType
  severity: EmotionSeverity
}

const STORAGE_PREFIX = 'emotion_track_'
const CRISIS_SHOWN_PREFIX = 'crisis_shown_'
const SEVERITY_WEIGHTS: Record<EmotionSeverity, number> = {
  mild: 1,
  moderate: 3,
  severe: 5,
}
const DAY_MS = 86400000
const CRISIS_COOLDOWN_MS = DAY_MS
const CRISIS_THRESHOLD = 70

function getTrackKey(petId: string): string {
  return `${STORAGE_PREFIX}${petId}`
}

function getCrisisShownKey(petId: string): string {
  return `${CRISIS_SHOWN_PREFIX}${petId}`
}

function getEvents(petId: string): EmotionEvent[] {
  try {
    const raw = Taro.getStorageSync(getTrackKey(petId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as EmotionEvent[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveEvents(petId: string, events: EmotionEvent[]): void {
  const cutoff = Date.now() - 7 * DAY_MS
  const filtered = events.filter(e => e.timestamp > cutoff)
  Taro.setStorageSync(getTrackKey(petId), JSON.stringify(filtered))
}

function getTimeDecay(eventTimestamp: number): number {
  const now = Date.now()
  const daysDiff = (now - eventTimestamp) / DAY_MS
  if (daysDiff >= 7) return 0
  return Math.max(0, 1 - daysDiff * 0.2)
}

export function trackEmotionEvent(petId: string, eventType: EmotionEventType, severity: EmotionSeverity): void {
  const events = getEvents(petId)
  events.push({
    timestamp: Date.now(),
    eventType,
    severity,
  })
  saveEvents(petId, events)
}

export function getEmotionScore(petId: string): number {
  const events = getEvents(petId)
  if (events.length === 0) return 0

  let weightedSum = 0
  for (const event of events) {
    const weight = SEVERITY_WEIGHTS[event.severity]
    const decay = getTimeDecay(event.timestamp)
    weightedSum += weight * decay
  }

  const score = (weightedSum / 7) * 20
  return Math.min(100, Math.round(score))
}

export function shouldShowCrisisReferral(petId: string): boolean {
  const score = getEmotionScore(petId)
  if (score < CRISIS_THRESHOLD) return false

  try {
    const lastShown = Taro.getStorageSync(getCrisisShownKey(petId))
    if (lastShown && Date.now() - Number(lastShown) < CRISIS_COOLDOWN_MS) {
      return false
    }
  } catch {
    // show if cannot read
  }

  return true
}

export function recordCrisisReferralShown(petId: string): void {
  Taro.setStorageSync(getCrisisShownKey(petId), Date.now().toString())
}

export function getEmotionTrend(petId: string): EmotionTrend {
  const events = getEvents(petId)
  if (events.length < 2) return 'stable'

  const now = Date.now()
  const threeDaysAgo = now - 3 * DAY_MS
  const sevenDaysAgo = now - 7 * DAY_MS

  const recentEvents = events.filter(e => e.timestamp > threeDaysAgo)
  const olderEvents = events.filter(e => e.timestamp > sevenDaysAgo && e.timestamp <= threeDaysAgo)

  const calcAvg = (evts: EmotionEvent[]): number => {
    if (evts.length === 0) return 0
    let sum = 0
    for (const e of evts) {
      sum += SEVERITY_WEIGHTS[e.severity]
    }
    return sum / evts.length
  }

  const recentAvg = calcAvg(recentEvents)
  const olderAvg = calcAvg(olderEvents)

  if (olderAvg === 0) return recentAvg > 0 ? 'worsening' : 'stable'

  const ratio = recentAvg / olderAvg
  if (ratio > 1.2) return 'worsening'
  if (ratio < 0.8) return 'improving'
  return 'stable'
}

export function getCrisisSeverity(petId: string): 'moderate' | 'severe' {
  const score = getEmotionScore(petId)
  return score >= 90 ? 'severe' : 'moderate'
}

export function recordFollowUp(petId: string, action: 'contacted' | 'okay'): void {
  const events = getEvents(petId)
  events.push({
    timestamp: Date.now(),
    eventType: action === 'contacted' ? 'anxiety_detected' : 'anomaly_detected',
    severity: action === 'contacted' ? 'mild' : 'mild',
  })
  saveEvents(petId, events)
}
