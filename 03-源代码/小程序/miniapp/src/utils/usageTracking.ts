import Taro from '@tarojs/taro'

const KEYS = {
  FIRST_SEEN: 'xhh_first_seen_at',
  FOOD_QUERY_TIMESTAMPS: 'xhh_food_query_timestamps',
  SYMPTOM_CHECK_TIMESTAMPS: 'xhh_symptom_check_timestamps',
  APP_OPEN_TIMESTAMPS: 'xhh_app_open_timestamps',
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

function getTimestamps(key: string): number[] {
  const raw = Taro.getStorageSync(key)
  if (!raw) return []
  try {
    return JSON.parse(raw as string)
  } catch {
    return []
  }
}

function saveTimestamps(key: string, timestamps: number[]): void {
  Taro.setStorageSync(key, JSON.stringify(timestamps))
}

function filterRecent(timestamps: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs
  return timestamps.filter(t => t > cutoff)
}

export function incrementFoodQueryCount(): void {
  const timestamps = filterRecent(getTimestamps(KEYS.FOOD_QUERY_TIMESTAMPS), SEVEN_DAYS_MS)
  timestamps.push(Date.now())
  saveTimestamps(KEYS.FOOD_QUERY_TIMESTAMPS, timestamps)
}

export function incrementSymptomCheckCount(): void {
  const timestamps = filterRecent(getTimestamps(KEYS.SYMPTOM_CHECK_TIMESTAMPS), SEVEN_DAYS_MS)
  timestamps.push(Date.now())
  saveTimestamps(KEYS.SYMPTOM_CHECK_TIMESTAMPS, timestamps)
}

export function recordAppOpen(): void {
  const timestamps = filterRecent(getTimestamps(KEYS.APP_OPEN_TIMESTAMPS), THREE_DAYS_MS)
  timestamps.push(Date.now())
  saveTimestamps(KEYS.APP_OPEN_TIMESTAMPS, timestamps)
}

export function isNewUser(): boolean {
  const firstSeen = Taro.getStorageSync(KEYS.FIRST_SEEN)
  if (!firstSeen) {
    Taro.setStorageSync(KEYS.FIRST_SEEN, new Date().toISOString())
    return true
  }
  const daysSince = (Date.now() - new Date(firstSeen as string).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince <= 7
}

export function getRecentFoodQueryCount(): number {
  return filterRecent(getTimestamps(KEYS.FOOD_QUERY_TIMESTAMPS), SEVEN_DAYS_MS).length
}

export function getRecentSymptomCheckCount(): number {
  return filterRecent(getTimestamps(KEYS.SYMPTOM_CHECK_TIMESTAMPS), SEVEN_DAYS_MS).length
}

export function getRecentOpenCount(): number {
  return filterRecent(getTimestamps(KEYS.APP_OPEN_TIMESTAMPS), THREE_DAYS_MS).length
}
