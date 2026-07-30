import { getStorage, setStorage } from '../../utils/storage'
import type { FoodMemory, FeedingEvent, DietProfile } from '../types/memoryBodyTypes'

const STORAGE_KEY = 'diet_memories'

export class DietMemoryAdapter {
  private userId: string

  constructor(userId: string) {
    if (!userId) throw new Error('[DietMemoryAdapter] userId is required')
    this.userId = userId
  }

  private userKey(key: string): string {
    return `${key}_${this.userId}`
  }

  private getAll(): FoodMemory[] {
    return getStorage<FoodMemory[]>(this.userKey(STORAGE_KEY)) || []
  }

  private saveAll(items: FoodMemory[]): void {
    if (items.length > 500) items = items.slice(-500)
    setStorage(this.userKey(STORAGE_KEY), items)
  }

  recordFeeding(petId: string, foodName: string, event: FeedingEvent): void {
    const all = this.getAll()
    const key = `${petId}_${foodName.toLowerCase()}`
    const existing = all.find(m => `${m.petId}_${m.foodName.toLowerCase()}` === key)

    if (existing) {
      existing.feedings.push(event)
      existing.totalFeedings++
      existing.lastFedDate = event.date
      if (event.reaction === 'refused' || event.reaction === 'upset_stomach') {
        existing.preference = 'dislikes'
      } else if (event.reaction === 'good' && existing.preference === 'unknown') {
        existing.preference = 'likes'
      }
    } else {
      all.push({
        foodName: foodName.toLowerCase(),
        petId,
        safetyLevel: 'safe',
        feedings: [event],
        totalFeedings: 1,
        lastFedDate: event.date,
        preference: 'unknown',
      })
    }

    this.saveAll(all)
  }

  getDietProfile(petId: string): DietProfile {
    const all = this.getAll().filter(m => m.petId === petId)
    const safeFoods: string[] = []
    const dangerousFoods: string[] = []
    const allergies: string[] = []

    for (const m of all) {
      if (m.safetyLevel === 'safe' || m.safetyLevel === 'caution') {
        safeFoods.push(m.foodName)
      } else {
        dangerousFoods.push(m.foodName)
      }
      if (m.preference === 'dislikes' && m.feedings.some(f => f.reaction === 'upset_stomach')) {
        allergies.push(m.foodName)
      }
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const recentFoods = new Set(
      all.filter(m => m.lastFedDate && m.lastFedDate >= sevenDaysAgo).map(m => m.foodName)
    )
    const diversityScore = Math.min(100, recentFoods.size * 10)

    const liked = all.filter(m => m.preference === 'likes').map(m => m.foodName)
    const preferenceSummary = liked.length > 0
      ? `偏好食物: ${liked.join('、')}`
      : '暂无明显的饮食偏好数据'

    return {
      petId,
      safeFoods: [...new Set(safeFoods)],
      dangerousFoods: [...new Set(dangerousFoods)],
      allergies: [...new Set(allergies)],
      diversityScore,
      preferenceSummary,
    }
  }

  getFoodPreference(petId: string, foodName: string): FoodMemory | null {
    const all = this.getAll()
    return all.find(m => m.petId === petId && m.foodName === foodName.toLowerCase()) || null
  }

  clear(): void {
    setStorage(this.userKey(STORAGE_KEY), [])
  }
}
