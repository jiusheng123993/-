import Taro from '@tarojs/taro'
import { getStorage, setStorage } from '../utils/storage'

export type AdType = 'banner' | 'rewardedVideo' | 'interstitial'

export interface AdConfig {
  bannerAdUnitId: string
  rewardedVideoAdUnitId: string
  interstitialAdUnitId: string
  maxDailyAds: number
  minIntervalSeconds: number
}

export interface AdStats {
  todayImpressions: number
  todayClicks: number
  lastShowTime: number
  totalImpressions: number
  totalClicks: number
}

const DEFAULT_AD_CONFIG: AdConfig = {
  bannerAdUnitId: '',
  rewardedVideoAdUnitId: '',
  interstitialAdUnitId: '',
  maxDailyAds: 20,
  minIntervalSeconds: 30,
}

function getAdConfig(): AdConfig {
  return getStorage<AdConfig>('ad_config') || DEFAULT_AD_CONFIG
}

function getAdStats(): AdStats {
  const today = new Date().toISOString().slice(0, 10)
  const stored = getStorage<AdStats & { date: string }>('ad_stats')
  if (stored && stored.date === today) {
    return {
      todayImpressions: stored.todayImpressions,
      todayClicks: stored.todayClicks,
      lastShowTime: stored.lastShowTime,
      totalImpressions: stored.totalImpressions,
      totalClicks: stored.totalClicks,
    }
  }
  return {
    todayImpressions: 0,
    todayClicks: 0,
    lastShowTime: 0,
    totalImpressions: 0,
    totalClicks: 0,
  }
}

function saveAdStats(stats: AdStats): void {
  const today = new Date().toISOString().slice(0, 10)
  setStorage('ad_stats', { ...stats, date: today })
}

function canShowAd(): boolean {
  const config = getAdConfig()
  const stats = getAdStats()

  if (stats.todayImpressions >= config.maxDailyAds) {
    return false
  }

  const now = Date.now()
  if (now - stats.lastShowTime < config.minIntervalSeconds * 1000) {
    return false
  }

  return true
}

function recordImpression(): void {
  const stats = getAdStats()
  stats.todayImpressions++
  stats.totalImpressions++
  stats.lastShowTime = Date.now()
  saveAdStats(stats)
}

function recordClick(): void {
  const stats = getAdStats()
  stats.todayClicks++
  stats.totalClicks++
  saveAdStats(stats)
}

export interface BannerAdOptions {
  adUnitId: string
  onLoad?: () => void
  onError?: (err: unknown) => void
  onClick?: () => void
}

interface TaroAdInstance {
  onLoad?: (callback: () => void) => void
  onError?: (callback: (err: unknown) => void) => void
  onClose?: (callback: (res: { isEnded: boolean }) => void) => void
  show: () => Promise<void>
}

export function createBannerAd(options: BannerAdOptions): TaroAdInstance | null {
  try {
    const ad = (Taro as unknown as Record<string, (...args: unknown[]) => unknown>).createBannerAd({
      adUnitId: options.adUnitId,
      style: {
        left: 0,
        top: 0,
        width: 320,
      },
    }) as TaroAdInstance | null

    if (ad) {
      ad.onLoad?.(() => {
        options.onLoad?.()
      })
      ad.onError?.((err: unknown) => {
        options.onError?.(err)
      })
    }

    return ad
  } catch {
    return null
  }
}

export interface RewardedVideoAdOptions {
  adUnitId: string
  onLoad?: () => void
  onError?: (err: unknown) => void
  onClose?: (isEnded: boolean) => void
}

export function createRewardedVideoAd(options: RewardedVideoAdOptions): TaroAdInstance | null {
  try {
    const ad = (Taro as unknown as Record<string, (...args: unknown[]) => unknown>).createRewardedVideoAd({
      adUnitId: options.adUnitId,
    }) as TaroAdInstance | null

    if (ad) {
      ad.onLoad?.(() => {
        options.onLoad?.()
      })
      ad.onError?.((err: unknown) => {
        options.onError?.(err)
      })
      ad.onClose?.((res: { isEnded: boolean }) => {
        options.onClose?.(res.isEnded)
      })
    }

    return ad
  } catch {
    return null
  }
}

export interface InterstitialAdOptions {
  adUnitId: string
  onLoad?: () => void
  onError?: (err: unknown) => void
  onClose?: () => void
}

export function createInterstitialAd(options: InterstitialAdOptions): TaroAdInstance | null {
  try {
    const ad = (Taro as unknown as Record<string, (...args: unknown[]) => unknown>).createInterstitialAd({
      adUnitId: options.adUnitId,
    }) as TaroAdInstance | null

    if (ad) {
      ad.onLoad?.(() => {
        options.onLoad?.()
      })
      ad.onError?.((err: unknown) => {
        options.onError?.(err)
      })
      ad.onClose?.(() => {
        options.onClose?.()
      })
    }

    return ad
  } catch {
    return null
  }
}

export async function showRewardedVideoAd(adUnitId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!canShowAd()) {
      resolve(false)
      return
    }

    const ad = createRewardedVideoAd({
      adUnitId,
      onClose: (isEnded: boolean) => {
        if (isEnded) {
          recordImpression()
        }
        resolve(isEnded)
      },
      onError: () => {
        resolve(false)
      },
    })

    if (!ad) {
      resolve(false)
      return
    }

    try {
      ad.show().catch(() => {
        resolve(false)
      })
    } catch {
      resolve(false)
    }
  })
}

export async function showInterstitialAd(adUnitId: string): Promise<boolean> {
  if (!canShowAd()) {
    return false
  }

  return new Promise((resolve) => {
    const ad = createInterstitialAd({
      adUnitId,
      onClose: () => {
        recordImpression()
        resolve(true)
      },
      onError: () => {
        resolve(false)
      },
    })

    if (!ad) {
      resolve(false)
      return
    }

    try {
      ad.show().catch(() => {
        resolve(false)
      })
    } catch {
      resolve(false)
    }
  })
}

export function getAdStatsInfo(): AdStats {
  return getAdStats()
}

export function resetAdStats(): void {
  const today = new Date().toISOString().slice(0, 10)
  setStorage('ad_stats', {
    todayImpressions: 0,
    todayClicks: 0,
    lastShowTime: 0,
    totalImpressions: 0,
    totalClicks: 0,
    date: today,
  })
}

export function updateAdConfig(config: Partial<AdConfig>): void {
  const current = getAdConfig()
  setStorage('ad_config', { ...current, ...config })
}

export function getCurrentAdConfig(): AdConfig {
  return getAdConfig()
}
