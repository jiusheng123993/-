import { getStorage, setStorage } from '../../utils/storage'
import type { BehaviorObservation, BehavioralBaseline } from '../types/memoryBodyTypes'

const STORAGE_KEY = 'behavior_observations'

export class BehaviorAdapter {
  private userId: string

  constructor(userId: string) {
    if (!userId) throw new Error('[BehaviorAdapter] userId is required')
    this.userId = userId
  }

  private userKey(key: string): string {
    return `${key}_${this.userId}`
  }

  private getAll(): BehaviorObservation[] {
    return getStorage<BehaviorObservation[]>(this.userKey(STORAGE_KEY)) || []
  }

  private saveAll(items: BehaviorObservation[]): void {
    if (items.length > 500) items = items.slice(-500)
    setStorage(this.userKey(STORAGE_KEY), items)
  }

  recordObservation(petId: string, observation: BehaviorObservation): void {
    const all = this.getAll()
    all.push({ ...observation, date: observation.date || new Date().toISOString().split('T')[0] })
    this.saveAll(all)
  }

  buildBaseline(petId: string): BehavioralBaseline {
    const obs = this.getAll().filter(o => o.date >= this.daysAgo(90))
    const petObs = obs.filter(o => this.isForPet(o, petId))

    const traits: string[] = []
    const energyLevels = petObs.filter(o => o.category === 'energy')
    if (energyLevels.length >= 3) {
      const highEnergy = energyLevels.filter(o => o.description.includes('活跃') || o.description.includes('兴奋'))
      if (highEnergy.length > energyLevels.length * 0.6) traits.push('精力充沛')
      else traits.push('安静温和')
    }

    const socialObs = petObs.filter(o => o.category === 'social')
    if (socialObs.length >= 2) {
      const friendly = socialObs.filter(o => o.description.includes('友好') || o.description.includes('亲人'))
      if (friendly.length > socialObs.length * 0.6) traits.push('亲人友善')
    }

    if (traits.length === 0) traits.push('待观察')

    const recentConcerns = petObs.filter(
      o => o.severity === 'concern' && o.date >= this.daysAgo(7)
    ).slice(-10)

    return {
      petId,
      personalityTraits: traits,
      dailyBaseline: {
        activityLevel: energyLevels.length >= 5 ? 'medium' : undefined,
        socialWithHumans: traits.includes('亲人友善') ? 'friendly' : undefined,
      },
      recentConcerns,
      behaviorSummary: traits.length > 0
        ? `${petObs.length > 10 ? '有充足观察数据' : '观察数据有限'}。性格倾向：${traits.join('、')}。`
        : '暂无足够行为数据',
    }
  }

  detectAnomalies(petId: string): BehaviorObservation[] {
    return this.getAll().filter(
      o => o.severity === 'concern' && this.isForPet(o, petId) && o.date >= this.daysAgo(14)
    )
  }

  getPersonalitySummary(petId: string): string {
    const baseline = this.buildBaseline(petId)
    return baseline.behaviorSummary
  }

  private isForPet(obs: BehaviorObservation, petId: string): boolean {
    return true
  }

  private daysAgo(n: number): string {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }

  clear(): void {
    setStorage(this.userKey(STORAGE_KEY), [])
  }
}
