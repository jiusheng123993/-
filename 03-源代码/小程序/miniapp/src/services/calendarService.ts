/**
 * 日历事件服务
 *
 * 聚合疫苗接种、驱虫、健康打卡等事件，生成家庭日历视图
 */
import { getRecordsByMonth, type VaccineRecord } from './vaccineService'
import { getCheckinsByDateRange } from './checkinService'
import { getAuthenticatedUserId, isAuthenticated } from '../utils/authGuard'
import type { PetFamilyMember } from '../types/familyTypes'

export type CalendarEventType = 'vaccine' | 'deworm' | 'checkin'

export interface CalendarEvent {
  date: number
  petName: string
  petId: string
  title: string
  type: CalendarEventType
  /** 健康风险等级（仅 checkin 类型有效） */
  riskLevel?: 'low' | 'medium' | 'high' | 'emergency'
}

export interface CalendarDayEvents {
  date: number
  events: CalendarEvent[]
}

interface MemberWithName {
  petId: string
  petName: string
}

function getMonthDateRange(year: number, month: number): { startDate: string; endDate: string } {
  const m = String(month).padStart(2, '0')
  const daysInMonth = new Date(year, month, 0).getDate()
  return {
    startDate: `${year}-${m}-01`,
    endDate: `${year}-${m}-${String(daysInMonth).padStart(2, '0')}`,
  }
}

function getVaccineEventType(record: VaccineRecord): CalendarEventType {
  return record.type === 'deworm' ? 'deworm' : 'vaccine'
}

function getVaccineEventTitle(record: VaccineRecord): string {
  return record.category || record.type
}

function getCheckinRiskEmoji(level: CalendarEvent['riskLevel']): string {
  switch (level) {
    case 'emergency': return '⚠️ '
    case 'high': return '🔔 '
    case 'medium': return '💡 '
    default: return ''
  }
}

/**
 * 获取指定月份所有家庭成员的日历事件
 * 合并疫苗/驱虫记录和健康打卡记录
 */
export async function getFamilyCalendarEvents(
  members: PetFamilyMember[],
  year: number,
  month: number,
): Promise<CalendarEvent[]> {
  if (!isAuthenticated() || members.length === 0) return []
  let userId: string
  try {
    userId = getAuthenticatedUserId()
  } catch {
    return []
  }

  const { startDate, endDate } = getMonthDateRange(year, month)
  const allEvents: CalendarEvent[] = []

  const membersWithNames: MemberWithName[] = members.map((m) => ({
    petId: m.petId,
    petName: (m as unknown as Record<string, unknown>).petName as string
      || (m as unknown as Record<string, unknown>).name as string
      || '宠物',
  }))

  for (const member of membersWithNames) {
    try {
      // 获取疫苗/驱虫记录
      const vaccineRecords = await getRecordsByMonth(member.petId, year, month)
      if (vaccineRecords.length > 0) {
        for (const record of vaccineRecords) {
          const eventDate = record.date || record.nextDate
          if (!eventDate) continue
          const day = new Date(eventDate).getDate()
          allEvents.push({
            date: day,
            petName: member.petName,
            petId: member.petId,
            title: getVaccineEventTitle(record),
            type: getVaccineEventType(record),
          })
        }
      }

      // 获取健康打卡记录
      const checkinEntries = await getCheckinsByDateRange(
        member.petId,
        userId,
        startDate,
        endDate,
      )
      if (checkinEntries.length > 0) {
        for (const entry of checkinEntries) {
          const dateStr = String(entry.createdAt).slice(0, 10)
          const day = new Date(dateStr).getDate()
          const riskEmoji = getCheckinRiskEmoji(entry.riskLevel)
          allEvents.push({
            date: day,
            petName: member.petName,
            petId: member.petId,
            title: `${riskEmoji}健康打卡`,
            type: 'checkin',
            riskLevel: entry.riskLevel,
          })
        }
      }
    } catch {
      // 单个成员获取失败不影响其他成员
      continue
    }
  }

  return allEvents
}

/**
 * 获取指定日期的所有事件
 */
export function getEventsByDay(
  events: CalendarEvent[],
  day: number,
): CalendarEvent[] {
  return events.filter((e) => e.date === day)
}

/**
 * 检查某天是否有事件
 */
export function hasEventsOnDay(events: CalendarEvent[], day: number): boolean {
  return events.some((e) => e.date === day)
}