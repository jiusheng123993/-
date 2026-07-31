/**
 * 情绪追踪 Hook
 * 管理宠物主人的情绪评分、趋势分析及危机干预转介
 */
import { useState, useCallback, useEffect } from 'react'
import {
  type EmotionEventType,
  type EmotionSeverity,
  type EmotionTrend,
  trackEmotionEvent,
  getEmotionScore,
  shouldShowCrisisReferral,
  recordCrisisReferralShown,
  getEmotionTrend,
  getCrisisSeverity,
  recordFollowUp,
} from '../services/emotionTrackingService'

interface UseEmotionTrackingReturn {
  emotionScore: number
  emotionTrend: EmotionTrend
  showCrisisReferral: boolean
  crisisSeverity: 'moderate' | 'severe'
  trackEvent: (eventType: EmotionEventType, severity: EmotionSeverity) => void
  dismissCrisisReferral: () => void
  handleFollowUp: (action: 'contacted' | 'okay') => void
}

/**
 * 情绪追踪 Hook
 * 管理宠物主人的情绪评分、趋势分析及危机干预转介
 */
export function useEmotionTracking(petId: string | null): UseEmotionTrackingReturn {
  const [emotionScore, setEmotionScore] = useState(0)
  const [emotionTrend, setEmotionTrend] = useState<EmotionTrend>('stable')
  const [showCrisis, setShowCrisis] = useState(false)
  const [crisisSeverity, setCrisisSeverity] = useState<'moderate' | 'severe'>('moderate')

  const recalculate = useCallback(() => {
    if (!petId) return
    const score = getEmotionScore(petId)
    const trend = getEmotionTrend(petId)
    const shouldShow = shouldShowCrisisReferral(petId)
    const severity = getCrisisSeverity(petId)

    setEmotionScore(score)
    setEmotionTrend(trend)
    setShowCrisis(shouldShow)
    setCrisisSeverity(severity)
  }, [petId])

  useEffect(() => {
    recalculate()
  }, [recalculate])

  const trackEvent = useCallback((eventType: EmotionEventType, severity: EmotionSeverity) => {
    if (!petId) return
    trackEmotionEvent(petId, eventType, severity)
    recalculate()
  }, [petId, recalculate])

  const dismissCrisisReferral = useCallback(() => {
    if (!petId) return
    recordCrisisReferralShown(petId)
    setShowCrisis(false)
  }, [petId])

  const handleFollowUp = useCallback((action: 'contacted' | 'okay') => {
    if (!petId) return
    recordFollowUp(petId, action)
    recordCrisisReferralShown(petId)
    setShowCrisis(false)
  }, [petId])

  return {
    emotionScore,
    emotionTrend,
    showCrisisReferral: showCrisis,
    crisisSeverity,
    trackEvent,
    dismissCrisisReferral,
    handleFollowUp,
  }
}
