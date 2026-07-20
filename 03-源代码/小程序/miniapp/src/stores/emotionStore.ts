import { create } from 'zustand'
import {
  getTopEmotionMatch,
  matchByKeywords,
  buildEmotionContext,
  detectNewUserAnxiety,
  detectIllnessAnxiety,
  formatResponseContent,
  formatSuggestions,
  type EmotionEngineContext,
  type EmotionMatchResult
} from '../engines/emotion/EmotionEngine'
import { getStorage, setStorage } from '../utils/storage'

interface EmotionState {
  activeCard: EmotionMatchResult | null
  formattedContent: string
  formattedSuggestions: string[]
  isCardVisible: boolean

  evaluateContext: (ctx: EmotionEngineContext) => void
  evaluateInput: (input: string, ctx: EmotionEngineContext) => void
  dismissCard: () => void
  clearAll: () => void
}

const BEHAVIOR_KEY = 'emotion_behavior'

interface BehaviorData {
  foodQueryCount: number
  symptomCheckCount: number
  firstSeenAt: string | null
  lastUpdatedAt: string | null
}

function getBehaviorData(): BehaviorData {
  return getStorage<BehaviorData>(BEHAVIOR_KEY) || {
    foodQueryCount: 0,
    symptomCheckCount: 0,
    firstSeenAt: null,
    lastUpdatedAt: null
  }
}

function saveBehaviorData(data: BehaviorData): void {
  setStorage(BEHAVIOR_KEY, data)
}

export function incrementFoodQueryCount(): void {
  const data = getBehaviorData()
  const now = new Date().toISOString()
  data.foodQueryCount++
  data.lastUpdatedAt = now
  if (!data.firstSeenAt) data.firstSeenAt = now
  saveBehaviorData(data)
}

export function incrementSymptomCheckCount(): void {
  const data = getBehaviorData()
  const now = new Date().toISOString()
  data.symptomCheckCount++
  data.lastUpdatedAt = now
  if (!data.firstSeenAt) data.firstSeenAt = now
  saveBehaviorData(data)
}

export function isNewUser(): boolean {
  const data = getBehaviorData()
  if (!data.firstSeenAt) return true
  const firstSeen = new Date(data.firstSeenAt)
  const daysSince = Math.floor(
    (Date.now() - firstSeen.getTime()) / (24 * 60 * 60 * 1000)
  )
  return daysSince <= 7
}

export function getRecentFoodQueryCount(): number {
  return getBehaviorData().foodQueryCount
}

export function getRecentSymptomCheckCount(): number {
  return getBehaviorData().symptomCheckCount
}

export const useEmotionStore = create<EmotionState>((set) => ({
  activeCard: null,
  formattedContent: '',
  formattedSuggestions: [],
  isCardVisible: false,

  evaluateContext: (ctx: EmotionEngineContext) => {
    const match = getTopEmotionMatch(ctx)
    if (!match) return

    set({
      activeCard: match,
      formattedContent: formatResponseContent(match.response.content, ctx.petName),
      formattedSuggestions: formatSuggestions(match.response.suggestions, ctx.petName),
      isCardVisible: true
    })
  },

  evaluateInput: (input: string, ctx: EmotionEngineContext) => {
    const match = matchByKeywords(input, ctx)
    if (!match) return

    set({
      activeCard: match,
      formattedContent: formatResponseContent(match.response.content, ctx.petName),
      formattedSuggestions: formatSuggestions(match.response.suggestions, ctx.petName),
      isCardVisible: true
    })
  },

  dismissCard: () => {
    set({ isCardVisible: false, activeCard: null })
  },

  clearAll: () => {
    set({
      activeCard: null,
      formattedContent: '',
      formattedSuggestions: [],
      isCardVisible: false
    })
  }
}))

export { buildEmotionContext, detectNewUserAnxiety, detectIllnessAnxiety }
export type { EmotionEngineContext, EmotionMatchResult }
