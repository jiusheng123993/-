import { useState, useCallback, useRef } from 'react'
import {
  recordClick,
  recordConversion,
  getCommissionStats,
  clearExpiredClicks,
  type CommissionStats,
  type ConversionRecord,
} from '../services/commissionService'
import { callHospital, navigateToHospital } from '../services/hospitalService'

export interface UseHospitalCommissionOptions {
  hospitalId: string
  hospitalName: string
  partnerId?: string
  commissionRate?: number
  userId: string
  sourcePage: string
  isPartner?: boolean
}

export function useHospitalCommission(options: UseHospitalCommissionOptions) {
  const [stats, setStats] = useState<CommissionStats | null>(null)
  const clickIdRef = useRef<string | null>(null)
  const trackedRef = useRef(false)

  const trackClick = useCallback(() => {
    if (trackedRef.current || !options.isPartner) return
    trackedRef.current = true

    const clickId = recordClick({
      partnerId: options.partnerId || options.hospitalId,
      userId: options.userId,
      sourcePage: options.sourcePage,
      partnerType: 'hospital',
    })
    clickIdRef.current = clickId
  }, [options.hospitalId, options.partnerId, options.userId, options.sourcePage, options.isPartner])

  const trackCall = useCallback(() => {
    if (!clickIdRef.current) return

    recordConversion({
      partnerId: options.partnerId || options.hospitalId,
      clickId: clickIdRef.current,
      userId: options.userId,
      conversionType: 'phone_call',
    })
  }, [options.hospitalId, options.partnerId, options.userId])

  const trackNavigation = useCallback(() => {
    if (!clickIdRef.current) return

    recordConversion({
      partnerId: options.partnerId || options.hospitalId,
      clickId: clickIdRef.current,
      userId: options.userId,
      conversionType: 'navigation',
    })
  }, [options.hospitalId, options.partnerId, options.userId])

  const handleCall = useCallback(() => {
    if (!options.partnerId && !options.isPartner) {
      return
    }
    trackClick()
    trackCall()
    callHospital('')
  }, [options.partnerId, options.isPartner, trackClick, trackCall])

  const handleNavigate = useCallback((latitude: number, longitude: number, name: string) => {
    if (!options.partnerId && !options.isPartner) {
      navigateToHospital(latitude, longitude, name)
      return
    }
    trackClick()
    trackNavigation()
    navigateToHospital(latitude, longitude, name)
  }, [options.partnerId, options.isPartner, trackClick, trackNavigation])

  const refreshStats = useCallback(() => {
    const result = getCommissionStats(options.userId)
    setStats(result)
  }, [options.userId])

  const cleanUp = useCallback(() => {
    clearExpiredClicks()
  }, [])

  return {
    stats,
    isPartner: !!options.isPartner,
    commissionRate: options.commissionRate ?? 0,
    trackClick,
    trackCall,
    trackNavigation,
    handleCall,
    handleNavigate,
    refreshStats,
    cleanUp,
  }
}
