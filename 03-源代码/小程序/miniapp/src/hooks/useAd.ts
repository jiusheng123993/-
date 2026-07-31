/**
 * 广告管理 Hook
 * 提供 Banner、激励视频、插屏三种广告类型的创建、展示与数据统计
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import {
  createBannerAd,
  createRewardedVideoAd,
  showRewardedVideoAd,
  showInterstitialAd,
  getAdStatsInfo,
  getCurrentAdConfig,
  type AdConfig,
  type AdStats,
} from '../services/adService'

/**
 * Banner 广告自定义 Hook
 * 提供 Banner 广告的创建、加载状态管理
 */
export interface UseBannerAdOptions {
  adUnitId: string
  autoShow?: boolean
}

export function useBannerAd(options: UseBannerAdOptions) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const adRef = useRef<unknown>(null)

  useEffect(() => {
    if (!options.adUnitId) return

    const ad = createBannerAd({
      adUnitId: options.adUnitId,
      onLoad: () => {
        setIsLoaded(true)
        setError(null)
      },
      onError: (err) => {
        setError(err)
        setIsLoaded(false)
      },
    })

    adRef.current = ad

    return () => {
      if (ad) {
        try {
          ;(ad as { destroy?: () => void }).destroy?.()
        } catch {
          // ignore
        }
      }
    }
  }, [options.adUnitId])

  return { isLoaded, error, ad: adRef.current }
}

/**
 * 激励视频广告自定义 Hook
 * 提供激励视频广告的展示、加载与奖励回调管理
 */
export interface UseRewardedVideoAdOptions {
  adUnitId: string
  onReward?: () => void
  onFail?: () => void
}

export function useRewardedVideoAd(options: UseRewardedVideoAdOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const adRef = useRef<unknown>(null)

  useEffect(() => {
    if (!options.adUnitId) return

    const ad = createRewardedVideoAd({
      adUnitId: options.adUnitId,
      onLoad: () => {
        setIsReady(true)
      },
      onError: () => {
        setIsReady(false)
      },
    })

    adRef.current = ad

    return () => {
      if (ad) {
        try {
          ;(ad as { destroy?: () => void }).destroy?.()
        } catch {
          // ignore
        }
      }
    }
  }, [options.adUnitId])

  const show = useCallback(async (): Promise<boolean> => {
    if (!options.adUnitId) {
      options.onFail?.()
      return false
    }

    setIsLoading(true)
    try {
      const result = await showRewardedVideoAd(options.adUnitId)
      if (result) {
        options.onReward?.()
      } else {
        options.onFail?.()
      }
      return result
    } finally {
      setIsLoading(false)
    }
  }, [options.adUnitId, options.onReward, options.onFail])

  return { isLoading, isReady, show }
}

/**
 * 插屏广告自定义 Hook
 * 提供插屏广告的展示与加载状态管理
 */
export interface UseInterstitialAdOptions {
  adUnitId: string
}

export function useInterstitialAd(options: UseInterstitialAdOptions) {
  const [isLoading, setIsLoading] = useState(false)

  const show = useCallback(async (): Promise<boolean> => {
    if (!options.adUnitId) return false

    setIsLoading(true)
    try {
      return await showInterstitialAd(options.adUnitId)
    } finally {
      setIsLoading(false)
    }
  }, [options.adUnitId])

  return { isLoading, show }
}

/**
 * 广告统计数据自定义 Hook
 * 提供广告统计信息与配置的读取和刷新
 */
export function useAdStats() {
  const [stats, setStats] = useState<AdStats>(getAdStatsInfo)
  const [config, setConfig] = useState<AdConfig>(getCurrentAdConfig)

  const refresh = useCallback(() => {
    setStats(getAdStatsInfo())
    setConfig(getCurrentAdConfig())
  }, [])

  return { stats, config, refresh }
}
