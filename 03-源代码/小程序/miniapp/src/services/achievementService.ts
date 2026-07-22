import type { AchievementConfig } from '../components/AchievementCard'
import { ACHIEVEMENT_DEFS } from '../components/AchievementCard'
import { getStorageArray, setStorage } from '../utils/storage'

const SHOWN_KEY = 'achievements_shown'

export type AchievementType = AchievementConfig['type']

interface AchievementShownRecord {
  type: AchievementType
  petId: string
  shownAt: number
}

function loadShownRecords(): AchievementShownRecord[] {
  return getStorageArray<AchievementShownRecord>(SHOWN_KEY)
}

function saveShownRecords(records: AchievementShownRecord[]): void {
  setStorage(SHOWN_KEY, records)
}

function wasShownToday(type: AchievementType, petId: string): boolean {
  const records = loadShownRecords()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()
  return records.some(r => r.type === type && r.petId === petId && r.shownAt >= todayMs)
}

function markShown(type: AchievementType, petId: string): void {
  const records = loadShownRecords()
  records.push({ type, petId, shownAt: Date.now() })
  saveShownRecords(records)
}

export function checkBirthdayAchievement(birthDate: string | undefined, petId: string): AchievementConfig | null {
  if (!birthDate) return null
  if (wasShownToday('birthday', petId)) return null
  const today = new Date()
  const birth = new Date(birthDate)
  if (today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate()) {
    markShown('birthday', petId)
    return ACHIEVEMENT_DEFS.birthday
  }
  return null
}

export function checkStreakAchievement(streakDays: number, petId: string): AchievementConfig | null {
  if (streakDays === 7 && !wasShownToday('streak_7', petId)) {
    markShown('streak_7', petId)
    return ACHIEVEMENT_DEFS.streak_7
  }
  if (streakDays === 30 && !wasShownToday('streak_30', petId)) {
    markShown('streak_30', petId)
    return ACHIEVEMENT_DEFS.streak_30
  }
  if (streakDays === 100 && !wasShownToday('streak_100', petId)) {
    markShown('streak_100', petId)
    return ACHIEVEMENT_DEFS.streak_100
  }
  return null
}

export function checkVaccineCompleteAchievement(petId: string, allCompleted: boolean): AchievementConfig | null {
  if (!allCompleted) return null
  if (wasShownToday('vaccine_complete', petId)) return null
  markShown('vaccine_complete', petId)
  return ACHIEVEMENT_DEFS.vaccine_complete
}

export function checkRainbowBridgeAchievement(petId: string, isDeceased: boolean): AchievementConfig | null {
  if (!isDeceased) return null
  if (wasShownToday('rainbow_bridge', petId)) return null
  markShown('rainbow_bridge', petId)
  return ACHIEVEMENT_DEFS.rainbow_bridge
}

const HOLIDAY_DATES: Record<string, { month: number; day: number; name: string }> = {
  spring_festival: { month: 0, day: 29, name: '春节' },
  mid_autumn: { month: 8, day: 17, name: '中秋' },
  christmas: { month: 11, day: 25, name: '圣诞' },
  national_day: { month: 9, day: 1, name: '国庆' },
  children_day: { month: 5, day: 1, name: '六一' },
}

export function checkHolidayAchievement(petId: string): AchievementConfig | null {
  if (wasShownToday('holiday', petId)) return null
  const now = new Date()
  const isHoliday = Object.values(HOLIDAY_DATES).some(
    h => now.getMonth() === h.month && now.getDate() === h.day,
  )
  if (isHoliday) {
    markShown('holiday', petId)
    return ACHIEVEMENT_DEFS.holiday
  }
  return null
}

export function checkAllAchievements(context: {
  petId: string
  birthDate?: string
  streakDays: number
  isDeceased: boolean
  allVaccinesCompleted?: boolean
}): AchievementConfig | null {
  const birthday = checkBirthdayAchievement(context.birthDate, context.petId)
  if (birthday) return birthday

  const streak = checkStreakAchievement(context.streakDays, context.petId)
  if (streak) return streak

  const rainbow = checkRainbowBridgeAchievement(context.petId, context.isDeceased)
  if (rainbow) return rainbow

  if (context.allVaccinesCompleted) {
    const vaccine = checkVaccineCompleteAchievement(context.petId, context.allVaccinesCompleted)
    if (vaccine) return vaccine
  }

  const holiday = checkHolidayAchievement(context.petId)
  if (holiday) return holiday

  return null
}
