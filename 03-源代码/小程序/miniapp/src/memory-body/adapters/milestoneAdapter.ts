import { getStorage, setStorage } from '../../utils/storage'
import type { PetMilestone } from '../types/memoryBodyTypes'

const STORAGE_KEY = 'pet_milestones'

export class MilestoneAdapter {
  private userId: string

  constructor(userId: string) {
    if (!userId) throw new Error('[MilestoneAdapter] userId is required')
    this.userId = userId
  }

  private userKey(key: string): string {
    return `${key}_${this.userId}`
  }

  private getAll(): PetMilestone[] {
    return getStorage<PetMilestone[]>(this.userKey(STORAGE_KEY)) || []
  }

  private saveAll(items: PetMilestone[]): void {
    if (items.length > 200) items = items.slice(-200)
    setStorage(this.userKey(STORAGE_KEY), items)
  }

  addMilestone(petId: string, milestone: Omit<PetMilestone, 'id'>): void {
    const all = this.getAll()
    all.push({
      ...milestone,
      id: `ms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    })
    this.saveAll(all)
  }

  getTimeline(petId: string): PetMilestone[] {
    return this.getAll()
      .filter(m => m.petId === petId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  getUpcomingMilestone(petId: string): { type: string; date: string; daysUntil: number } | null {
    const today = new Date().toISOString().split('T')[0]
    const future = this.getAll()
      .filter(m => m.petId === petId && m.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))

    if (future.length === 0) return null
    const next = future[0]
    const daysUntil = Math.ceil(
      (new Date(next.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    )
    return { type: next.type, date: next.date, daysUntil }
  }

  syncFromCheckins(petId: string, checkinCount: number): void {
    const all = this.getAll()
    if (checkinCount >= 1 && !all.some(m => m.petId === petId && m.type === 'first_checkin')) {
      this.addMilestone(petId, {
        petId,
        type: 'first_checkin',
        title: '第一次健康打卡',
        date: new Date().toISOString().split('T')[0],
        icon: '📝',
      })
    }
  }

  clear(): void {
    setStorage(this.userKey(STORAGE_KEY), [])
  }
}
