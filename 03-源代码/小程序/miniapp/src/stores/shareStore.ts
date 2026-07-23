import create from 'zustand'
import {
  getOrCreateInviteCode,
  getShareStats,
  recordShare,
  grantShareReward,
} from '../services/shareService'
import type { ShareCardType, ShareStats, ShareRewardResult } from '../types/shareTypes'

interface ShareStoreState {
  inviteCode: string
  shareStats: ShareStats | null
  isLoading: boolean
  error: string | null

  fetchInviteCode: (userId: string) => Promise<void>
  fetchShareStats: (userId: string) => Promise<void>
  recordShareAction: (userId: string, cardType: ShareCardType, petId: string, platform: string) => Promise<void>
  checkAndGrantReward: (userId: string) => Promise<ShareRewardResult | null>
  clearError: () => void
}

export const useShareStore = create<ShareStoreState>((set, get) => ({
  inviteCode: '',
  shareStats: null,
  isLoading: false,
  error: null,

  fetchInviteCode: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const code = await getOrCreateInviteCode(userId)
      set({ inviteCode: code, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取邀请码失败', isLoading: false })
    }
  },

  fetchShareStats: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const stats = await getShareStats(userId)
      set({ shareStats: stats, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取分享统计失败', isLoading: false })
    }
  },

  recordShareAction: async (userId: string, cardType: ShareCardType, petId: string, platform: string) => {
    try {
      await recordShare(userId, cardType, petId, platform)
      const stats = get().shareStats
      if (stats) {
        const key = `${cardType}Shares` as keyof ShareStats
        set({
          shareStats: {
            ...stats,
            totalShares: stats.totalShares + 1,
            [key]: ((stats[key] as number) || 0) + 1,
          },
        })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '记录分享失败' })
    }
  },

  checkAndGrantReward: async (userId: string) => {
    try {
      const result = await grantShareReward(userId)
      if (result.rewardGranted) {
        const stats = get().shareStats
        if (stats) {
          set({
            shareStats: {
              ...stats,
              successfulInvites: stats.successfulInvites + 1,
            },
          })
        }
      }
      return result
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '奖励发放失败' })
      return null
    }
  },

  clearError: () => set({ error: null }),
}))
