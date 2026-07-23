import { useState, useCallback, useRef, useEffect } from 'react'
import Taro from '@tarojs/taro'
import {
  type SickAnxietyContext,
  type NewOwnerAnxietyContext,
  type AnxietyLevel,
} from '../engines/emotion'
import { useCheckinStore } from '../stores/checkinStore'
import { useSymptomStore } from '../stores/symptomStore'
import { useFoodQueryStore } from '../stores/foodQueryStore'

interface AnxietyDetectionState {
  showSickAnxiety: boolean
  showNewOwnerAnxiety: boolean
  sickAnxietyContext: SickAnxietyContext | null
  newOwnerAnxietyContext: NewOwnerAnxietyContext | null
  anxietyLevel: AnxietyLevel | null
}

export interface UseAnxietyDetectionReturn {
  anxietyState: AnxietyDetectionState
  checkSickAnxiety: (petId: string, petName: string) => Promise<void>
  checkNewOwnerAnxiety: (petId: string) => Promise<void>
  dismissSickAnxiety: () => void
  dismissNewOwnerAnxiety: () => void
}

const SICK_ANXIETY_KEY = 'sick_anxiety_dismissed'
const NEW_OWNER_ANXIETY_KEY = 'new_owner_anxiety_dismissed'
const LAST_CHECK_KEY = 'anxiety_last_check'

export function useAnxietyDetection(): UseAnxietyDetectionReturn {
  const [anxietyState, setAnxietyState] = useState<AnxietyDetectionState>({
    showSickAnxiety: false,
    showNewOwnerAnxiety: false,
    sickAnxietyContext: null,
    newOwnerAnxietyContext: null,
    anxietyLevel: null,
  })

  const checkinStore = useCheckinStore()
  const symptomStore = useSymptomStore()
  const foodQueryStore = useFoodQueryStore()

  const isChecking = useRef(false)

  const getTodayString = useCallback(() => {
    return new Date().toISOString().split('T')[0]
  }, [])

  const shouldCheckToday = useCallback(async () => {
    try {
      const lastCheck = Taro.getStorageSync(LAST_CHECK_KEY)
      const today = getTodayString()
      return lastCheck !== today
    } catch {
      return true
    }
  }, [getTodayString])

  const markCheckedToday = useCallback(() => {
    Taro.setStorageSync(LAST_CHECK_KEY, getTodayString())
  }, [getTodayString])

  const checkSickAnxiety = useCallback(async (petId: string, petName: string) => {
    if (isChecking.current) return
    isChecking.current = true

    try {
      const shouldCheck = await shouldCheckToday()
      if (!shouldCheck) return

      const dismissed = Taro.getStorageSync(SICK_ANXIETY_KEY)
      if (dismissed) return

      await checkinStore.fetchCheckins(petId)
      const checkins = checkinStore.checkins
      const today = new Date().toISOString().split('T')[0]
      const recentAnomalies = checkins.filter(c => {
        const d = new Date(c.date)
        const diffDays = Math.floor((new Date(today).getTime() - d.getTime()) / (24 * 60 * 60 * 1000))
        return diffDays < 7 && (c.mood === 'sad' || c.appetite === 'poor' || c.stool !== 'normal')
      })
      const consecutiveAnomalyDays = recentAnomalies.length
      const totalAnomalyDays = recentAnomalies.length
      const lastAnomalyDate = recentAnomalies.length > 0 ? recentAnomalies[0].date : null

      if (consecutiveAnomalyDays >= 3) {
        const context: SickAnxietyContext = {
          petName,
          consecutiveAnomalyDays,
        }

        const level: AnxietyLevel =
          consecutiveAnomalyDays >= 7 ? 'severe' : consecutiveAnomalyDays >= 5 ? 'moderate' : 'mild'

        setAnxietyState(prev => ({
          ...prev,
          showSickAnxiety: true,
          sickAnxietyContext: context,
          anxietyLevel: level,
        }))

        markCheckedToday()
      }
    } finally {
      isChecking.current = false
    }
  }, [checkinStore, shouldCheckToday, markCheckedToday])

  const checkNewOwnerAnxiety = useCallback(async (petId: string) => {
    if (isChecking.current) return
    isChecking.current = true

    try {
      const shouldCheck = await shouldCheckToday()
      if (!shouldCheck) return

      const dismissed = Taro.getStorageSync(NEW_OWNER_ANXIETY_KEY)
      if (dismissed) return

      const foodQueryCount = foodQueryStore.stats?.totalQueries || 0
      const symptomCheckCount = symptomStore.history.length

      if (foodQueryCount >= 5 || symptomCheckCount >= 3) {
        const context: NewOwnerAnxietyContext = {
          foodQueryCount,
          symptomCheckCount,
        }

        const total = foodQueryCount + symptomCheckCount
        const level: AnxietyLevel = total >= 15 ? 'severe' : total >= 8 ? 'moderate' : 'mild'

        setAnxietyState(prev => ({
          ...prev,
          showNewOwnerAnxiety: true,
          newOwnerAnxietyContext: context,
          anxietyLevel: level,
        }))

        markCheckedToday()
      }
    } finally {
      isChecking.current = false
    }
  }, [foodQueryStore, symptomStore, shouldCheckToday, markCheckedToday])

  const dismissSickAnxiety = useCallback(() => {
    Taro.setStorageSync(SICK_ANXIETY_KEY, true)
    setAnxietyState(prev => ({
      ...prev,
      showSickAnxiety: false,
      sickAnxietyContext: null,
    }))
  }, [])

  const dismissNewOwnerAnxiety = useCallback(() => {
    Taro.setStorageSync(NEW_OWNER_ANXIETY_KEY, true)
    setAnxietyState(prev => ({
      ...prev,
      showNewOwnerAnxiety: false,
      newOwnerAnxietyContext: null,
    }))
  }, [])

  useEffect(() => {
    return () => {
      isChecking.current = false
    }
  }, [])

  return {
    anxietyState,
    checkSickAnxiety,
    checkNewOwnerAnxiety,
    dismissSickAnxiety,
    dismissNewOwnerAnxiety,
  }
}
