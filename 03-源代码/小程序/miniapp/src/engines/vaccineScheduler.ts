/**
 * 疫苗/驱虫自动排程引擎
 * 根据宠物出生日期、品种和已有接种记录，自动生成疫苗和驱虫的排程计划
 */
import { DOG_VACCINE_SCHEDULE, CAT_VACCINE_SCHEDULE } from '../data/petKnowledge/vaccineSchedule'
import type { VaccineScheduleTemplate } from '../data/petKnowledge/vaccineSchedule'

interface PetInfo {
  species: 'dog' | 'cat'
  birthDate: string
  existingVaccines?: { name: string; date: string }[]
}

export interface AutoScheduleItem {
  id: string
  vaccineName: string
  scheduledDate: string
  status: 'upcoming' | 'due' | 'overdue' | 'completed'
  daysUntilDue: number
  isCore: boolean
  notes: string
  reminderLevel: 0 | 1 | 2 | 3
}

export interface DewormingScheduleItem {
  id: string
  type: 'internal' | 'external'
  scheduledDate: string
  status: 'upcoming' | 'due' | 'overdue' | 'completed'
  daysUntilDue: number
  reminderLevel: 0 | 1 | 2 | 3
}

/**
 * 疫苗/驱虫自动排程引擎
 *
 * 根据宠物出生日期、品种和已有接种记录，
 * 自动生成疫苗和驱虫的排程计划，包含提醒等级计算。
 */

function getLifeStage(birthDate: string): 'puppy_kitten' | 'adult' | 'senior' {
  const birth = new Date(birthDate)
  const now = new Date()
  const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())

  if (ageMonths <= 12) return 'puppy_kitten'
  if (ageMonths <= 84) return 'adult'
  return 'senior'
}

function getScheduleTemplates(species: 'dog' | 'cat'): VaccineScheduleTemplate[] {
  return species === 'dog' ? DOG_VACCINE_SCHEDULE : CAT_VACCINE_SCHEDULE
}

function parseWeekAgeToDate(birthDate: string, weekOrAge: string): string | null {
  const birth = new Date(birthDate)

  const weekMatch = weekOrAge.match(/(\d+)-?(\d+)?周龄/)
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1])
    const date = new Date(birth)
    date.setDate(date.getDate() + weeks * 7)
    return date.toISOString().split('T')[0]
  }

  const monthMatch = weekOrAge.match(/(\d+)月龄/)
  if (monthMatch) {
    const months = parseInt(monthMatch[1])
    const date = new Date(birth)
    date.setMonth(date.getMonth() + months)
    return date.toISOString().split('T')[0]
  }

  const yearMatch = weekOrAge.match(/(\d+)岁/)
  if (yearMatch) {
    const years = parseInt(yearMatch[1])
    const date = new Date(birth)
    date.setFullYear(date.getFullYear() + years)
    return date.toISOString().split('T')[0]
  }

  if (weekOrAge.includes('每年') || weekOrAge.includes('每3年')) {
    return null
  }

  return null
}

/** 自动生成疫苗排程 */
export function generateAutoVaccineSchedule(pet: PetInfo): AutoScheduleItem[] {
  const lifeStage = getLifeStage(pet.birthDate)
  const templates = getScheduleTemplates(pet.species)
  const template = templates.find(t => t.lifeStage === lifeStage)

  if (!template) return []

  const now = new Date()
  const items: AutoScheduleItem[] = []
  const existingNames = new Set((pet.existingVaccines || []).map(v => v.name))

  template.schedule.forEach((slot: { weekOrAge: string; vaccines: string[]; notes: string }, slotIndex: number) => {
    slot.vaccines.forEach((vaccine, vaccineIndex) => {
      const cleanName = vaccine.replace(/（[^）]+）/, '').trim()

      if (existingNames.has(cleanName)) return

      const scheduledDate = parseWeekAgeToDate(pet.birthDate, slot.weekOrAge)

      if (!scheduledDate) {
        if (slot.weekOrAge.includes('每年')) {
          const nextDate = new Date(now)
          nextDate.setMonth(nextDate.getMonth() + 12)
          items.push(createScheduleItem(
            `${template.id}_${slotIndex}_${vaccineIndex}`,
            vaccine,
            nextDate.toISOString().split('T')[0],
            slot.notes,
            true
          ))
        } else if (slot.weekOrAge.includes('每3年')) {
          const nextDate = new Date(now)
          nextDate.setFullYear(nextDate.getFullYear() + 3)
          items.push(createScheduleItem(
            `${template.id}_${slotIndex}_${vaccineIndex}`,
            vaccine,
            nextDate.toISOString().split('T')[0],
            slot.notes,
            true
          ))
        }
        return
      }

      items.push(createScheduleItem(
        `${template.id}_${slotIndex}_${vaccineIndex}`,
        vaccine,
        scheduledDate,
        slot.notes,
        false
      ))
    })
  })

  return items.map(item => ({
    ...item,
    ...calculateStatusAndReminder(item.scheduledDate, now),
  }))
}

function createScheduleItem(
  id: string,
  vaccineName: string,
  scheduledDate: string,
  notes: string,
  isCore: boolean
): AutoScheduleItem {
  return {
    id,
    vaccineName,
    scheduledDate,
    status: 'upcoming',
    daysUntilDue: 0,
    isCore,
    notes,
    reminderLevel: 0,
  }
}

function calculateStatusAndReminder(scheduledDate: string, now: Date): { status: AutoScheduleItem['status']; daysUntilDue: number; reminderLevel: 0 | 1 | 2 | 3 } {
  const due = new Date(scheduledDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  let status: AutoScheduleItem['status'] = 'upcoming'
  let reminderLevel: 0 | 1 | 2 | 3 = 0

  if (diffDays < -3) {
    status = 'overdue'
    reminderLevel = 3
  } else if (diffDays <= 0) {
    status = 'due'
    reminderLevel = 2
  } else if (diffDays <= 7) {
    status = 'upcoming'
    reminderLevel = 1
  } else {
    status = 'upcoming'
    reminderLevel = 0
  }

  return { status, daysUntilDue: diffDays, reminderLevel }
}

/** 自动生成驱虫排程 */
export function generateDewormingSchedule(pet: PetInfo): DewormingScheduleItem[] {
  const birth = new Date(pet.birthDate)
  const now = new Date()
  const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())

  const items: DewormingScheduleItem[] = []

  if (ageMonths <= 6) {
    const nextDate = new Date(now)
    nextDate.setMonth(nextDate.getMonth() + 1)
    items.push({
      id: 'internal_puppy',
      type: 'internal',
      scheduledDate: nextDate.toISOString().split('T')[0],
      status: 'upcoming',
      daysUntilDue: 30,
      reminderLevel: 0,
    })
    items.push({
      id: 'external_puppy',
      type: 'external',
      scheduledDate: nextDate.toISOString().split('T')[0],
      status: 'upcoming',
      daysUntilDue: 30,
      reminderLevel: 0,
    })
  } else {
    const nextInternal = new Date(now)
    nextInternal.setMonth(nextInternal.getMonth() + 3)
    items.push({
      id: 'internal_adult',
      type: 'internal',
      scheduledDate: nextInternal.toISOString().split('T')[0],
      status: 'upcoming',
      daysUntilDue: 90,
      reminderLevel: 0,
    })

    const nextExternal = new Date(now)
    nextExternal.setMonth(nextExternal.getMonth() + 1)
    items.push({
      id: 'external_adult',
      type: 'external',
      scheduledDate: nextExternal.toISOString().split('T')[0],
      status: 'upcoming',
      daysUntilDue: 30,
      reminderLevel: 0,
    })
  }

  return items.map(item => ({
    ...item,
    ...calculateDewormingStatusAndReminder(item.scheduledDate, now),
  }))
}

function calculateDewormingStatusAndReminder(scheduledDate: string, now: Date): { status: DewormingScheduleItem['status']; daysUntilDue: number; reminderLevel: 0 | 1 | 2 | 3 } {
  return calculateStatusAndReminder(scheduledDate, now) as { status: DewormingScheduleItem['status']; daysUntilDue: number; reminderLevel: 0 | 1 | 2 | 3 }
}

/** 获取需要提醒的疫苗项 */
export function getVaccineReminders(schedule: AutoScheduleItem[]): AutoScheduleItem[] {
  return schedule.filter(item => item.reminderLevel > 0)
}

/** 获取需要提醒的驱虫项 */
export function getDewormingReminders(schedule: DewormingScheduleItem[]): DewormingScheduleItem[] {
  return schedule.filter(item => item.reminderLevel > 0)
}

/** 获取提醒消息内容（标题+正文） */
export function getReminderMessage(reminderLevel: 1 | 2 | 3, type: 'vaccine' | 'deworming', name: string): { title: string; content: string } {
  if (type === 'vaccine') {
    switch (reminderLevel) {
      case 1:
        return { title: '疫苗提醒', content: `您的宠物7天内需要接种${name}，请提前预约宠物医院。` }
      case 2:
        return { title: '疫苗到期', content: `您的宠物今天需要接种${name}，请尽快联系宠物医院。` }
      case 3:
        return { title: '疫苗逾期', content: `您的宠物${name}已逾期3天以上，请立即联系宠物医院补种！` }
    }
  } else {
    switch (reminderLevel) {
      case 1:
        return { title: '驱虫提醒', content: `7天内需要为您的宠物进行${name === 'internal' ? '体内' : '体外'}驱虫。` }
      case 2:
        return { title: '驱虫到期', content: `今天需要为您的宠物进行${name === 'internal' ? '体内' : '体外'}驱虫。` }
      case 3:
        return { title: '驱虫逾期', content: `您的宠物${name === 'internal' ? '体内' : '体外'}驱虫已逾期，请尽快处理！` }
    }
  }
}
