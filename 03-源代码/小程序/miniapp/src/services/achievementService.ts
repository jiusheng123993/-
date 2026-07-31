/**
 * 成就系统服务
 *
 * 检测并触发各类成就（生日、连续打卡、疫苗完成、彩虹桥、节日等）
 */
import type { AchievementConfig } from '../components/AchievementCard'
import { ACHIEVEMENT_DEFS } from '../components/AchievementCard'
import { getStorageArray, setStorage } from '../utils/storage'

const SHOWN_KEY = 'achievements_shown'

/** 成就展示记录类型 */
export type AchievementType = AchievementConfig['type']

/** 成就展示记录（本地持久化） */
interface AchievementShownRecord {
  type: AchievementType
  petId: string
  shownAt: number
}

/** 加载本地成就展示记录 */
function loadShownRecords(): AchievementShownRecord[] {
  return getStorageArray<AchievementShownRecord>(SHOWN_KEY)
}

/** 保存成就展示记录 */
function saveShownRecords(records: AchievementShownRecord[]): void {
  setStorage(SHOWN_KEY, records)
}

/** 检查指定类型的成就今天是否已展示过 */
function wasShownToday(type: AchievementType, petId: string): boolean {
  const records = loadShownRecords()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()
  return records.some(r => r.type === type && r.petId === petId && r.shownAt >= todayMs)
}

/** 标记成就为已展示 */
function markShown(type: AchievementType, petId: string): void {
  const records = loadShownRecords()
  records.push({ type, petId, shownAt: Date.now() })
  saveShownRecords(records)
}

/**
 * 检测生日成就
 * @param birthDate - 出生日期
 * @param petId - 宠物 ID
 * @returns 成就配置或 null
 */
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

/**
 * 检测连续打卡成就（7天/30天/100天）
 * @param streakDays - 连续打卡天数
 * @param petId - 宠物 ID
 */
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

/**
 * 检测疫苗完成成就
 * @param petId - 宠物 ID
 * @param allCompleted - 是否全部完成
 */
export function checkVaccineCompleteAchievement(petId: string, allCompleted: boolean): AchievementConfig | null {
  if (!allCompleted) return null
  if (wasShownToday('vaccine_complete', petId)) return null
  markShown('vaccine_complete', petId)
  return ACHIEVEMENT_DEFS.vaccine_complete
}

/**
 * 检测彩虹桥成就（宠物离世安慰）
 * @param petId - 宠物 ID
 * @param isDeceased - 是否已离世
 */
export function checkRainbowBridgeAchievement(petId: string, isDeceased: boolean): AchievementConfig | null {
  if (!isDeceased) return null
  if (wasShownToday('rainbow_bridge', petId)) return null
  markShown('rainbow_bridge', petId)
  return ACHIEVEMENT_DEFS.rainbow_bridge
}

/** 节日日期配置表 */
const HOLIDAY_DATES: Record<string, { month: number; day: number; name: string }> = {
  spring_festival: { month: 0, day: 29, name: '春节' },
  mid_autumn: { month: 8, day: 17, name: '中秋' },
  christmas: { month: 11, day: 25, name: '圣诞' },
  national_day: { month: 9, day: 1, name: '国庆' },
  children_day: { month: 5, day: 1, name: '六一' },
}

/**
 * 检测节日成就
 * @param petId - 宠物 ID
 */
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

/**
 * 综合检测所有成就类型（按优先级依次检测）
 * @param context - 检测上下文（宠物信息/打卡/疫苗等）
 * @returns 触发的成就配置或 null
 */
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
