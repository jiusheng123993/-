import { create } from 'zustand'
import {
  detectSickAnxiety,
  getSickAnxietyMessage,
  getSickAnxietyLevel,
  detectNewOwnerAnxiety,
  getNewOwnerAnxietyMessage,
  createIntervention,
} from '../engines/emotion'
import type { EmotionIntervention, EmotionSceneType, AnxietyLevel } from '../engines/emotion'
import type { EmotionCheckRecord } from '../types/emotionTypes'
import { getStorageArray, setStorage } from '../utils/storage'

const DISMISSED_KEY = 'emotion_dismissed'
const CHECK_RECORDS_KEY = 'emotion_check_records'

interface EmotionStoreState {
  activeIntervention: EmotionIntervention | null
  dismissedIds: string[]
  checkRecords: EmotionCheckRecord[]
  isLoading: boolean

  checkSickAnxiety: (
    petId: string,
    petName: string,
    consecutiveAnomalyDays: number,
    userOpenFrequency: number,
    lastAnomalyItems: string[],
    previousRecoveryCount: number,
    userId: string,
  ) => void
  checkNewOwnerAnxiety: (
    userId: string,
    accountAgeDays: number,
    foodQueryCount: number,
    symptomCheckCount: number,
    petAgeDays: number,
    hasVaccineSchedule: boolean,
    petName: string,
    species: string,
  ) => void
  dismissIntervention: () => void
  respondToIntervention: () => void
  clearExpiredRecords: () => void
  reset: () => void
}

function loadDismissedIds(): string[] {
  return getStorageArray<string>(DISMISSED_KEY)
}

function loadCheckRecords(): EmotionCheckRecord[] {
  return getStorageArray<EmotionCheckRecord>(CHECK_RECORDS_KEY)
}

function saveDismissedIds(ids: string[]): void {
  setStorage(DISMISSED_KEY, ids)
}

function saveCheckRecords(records: EmotionCheckRecord[]): void {
  setStorage(CHECK_RECORDS_KEY, records)
}

function isRecentlyChecked(
  records: EmotionCheckRecord[],
  type: EmotionSceneType,
  petId: string | undefined,
  cooldownMs: number,
): boolean {
  const now = Date.now()
  return records.some(
    r => r.type === type && r.petId === petId && now - r.checkedAt < cooldownMs,
  )
}

function isDismissed(dismissedIds: string[], interventionId: string): boolean {
  return dismissedIds.includes(interventionId)
}

export const useEmotionStore = create<EmotionStoreState>((set, get) => ({
  activeIntervention: null,
  dismissedIds: loadDismissedIds(),
  checkRecords: loadCheckRecords(),
  isLoading: false,

  checkSickAnxiety: (petId, petName, consecutiveAnomalyDays, userOpenFrequency, lastAnomalyItems, previousRecoveryCount, userId) => {
    const { checkRecords, dismissedIds } = get()
    if (isRecentlyChecked(checkRecords, 'sick_anxiety', petId, 24 * 60 * 60 * 1000)) return

    const context = { petId, petName, consecutiveAnomalyDays, userOpenFrequency, lastAnomalyItems, previousRecoveryCount }
    if (!detectSickAnxiety(context)) return

    const message = getSickAnxietyMessage(context)
    const level = getSickAnxietyLevel(context)
    const intervention = createIntervention('sick_anxiety', userId, message, context, petId, level)
    if (isDismissed(dismissedIds, intervention.id)) return

    const newRecord: EmotionCheckRecord = { type: 'sick_anxiety', petId, checkedAt: Date.now() }
    const newRecords = [...checkRecords, newRecord]
    saveCheckRecords(newRecords)
    set({ activeIntervention: intervention, checkRecords: newRecords })
  },

  checkNewOwnerAnxiety: (userId, accountAgeDays, foodQueryCount, symptomCheckCount, petAgeDays, hasVaccineSchedule, petName, species) => {
    const { checkRecords, dismissedIds } = get()
    if (isRecentlyChecked(checkRecords, 'new_owner_anxiety', undefined, 7 * 24 * 60 * 60 * 1000)) return

    const context = { userId, accountAgeDays, foodQueryCount, symptomCheckCount, petAgeDays, hasVaccineSchedule }
    if (!detectNewOwnerAnxiety(context)) return

    const message = getNewOwnerAnxietyMessage(context, species, petName)
    const queryTotal = context.foodQueryCount + context.symptomCheckCount
    const level: AnxietyLevel = queryTotal >= 15 ? 'severe' : queryTotal >= 8 ? 'moderate' : 'mild'
    const intervention = createIntervention('new_owner_anxiety', userId, message, context, undefined, level)
    if (isDismissed(dismissedIds, intervention.id)) return

    const newRecord: EmotionCheckRecord = { type: 'new_owner_anxiety', checkedAt: Date.now() }
    const newRecords = [...checkRecords, newRecord]
    saveCheckRecords(newRecords)
    set({ activeIntervention: intervention, checkRecords: newRecords })
  },

  dismissIntervention: () => {
    const { activeIntervention, dismissedIds } = get()
    if (!activeIntervention) return
    const newDismissed = [...dismissedIds, activeIntervention.id]
    saveDismissedIds(newDismissed)
    set({ activeIntervention: null, dismissedIds: newDismissed })
  },

  respondToIntervention: () => {
    const { activeIntervention } = get()
    if (!activeIntervention) return
    set({ activeIntervention: { ...activeIntervention, userResponded: true } })
  },

  clearExpiredRecords: () => {
    const { checkRecords } = get()
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const filtered = checkRecords.filter(r => r.checkedAt > sevenDaysAgo)
    saveCheckRecords(filtered)
    set({ checkRecords: filtered })
  },

  reset: () => {
    set({
      activeIntervention: null,
      dismissedIds: [],
      checkRecords: [],
      isLoading: false,
    })
  },
}))
