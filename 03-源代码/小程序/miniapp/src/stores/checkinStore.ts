/**
 * 打卡状态管理
 * 管理每日打卡记录、连续打卡天数和今日打卡状态
 */
import create from 'zustand'
import { api } from '../services/api'
import type { Checkin } from '../types'

/** 打卡状态定义 */
interface CheckinState {
  checkins: Checkin[]
  todayCheckin: Checkin | null
  streakDays: number
  isLoading: boolean
  initUser: (userId: string) => Promise<void>
  fetchCheckins: (petId: string) => Promise<void>
  doCheckin: (data: Partial<Checkin>) => Promise<Checkin>
}

export const useCheckinStore = create<CheckinState>((set, get) => ({
  checkins: [],
  todayCheckin: null,
  streakDays: 0,
  isLoading: false,

  /** 初始化用户（预留接口） */
  initUser: async (userId: string) => {
  },

  /**
   * 获取打卡记录并计算连续打卡天数
   * @param petId - 宠物 ID
   */
  fetchCheckins: async (petId: string) => {
    set({ isLoading: true })
    try {
      const checkins = await api.getCheckins(petId)
      const today = new Date().toISOString().split('T')[0]
      const todayCheckin = checkins.find(c => c.date === today) || null
      let streakDays = 0
      const sorted = [...checkins].sort((a, b) => b.date.localeCompare(a.date))
      const todayStr = new Date().toISOString().split('T')[0]
      for (let i = 0; i < sorted.length; i++) {
        const expected = new Date(todayStr)
        expected.setDate(expected.getDate() - i)
        const expectedStr = expected.toISOString().split('T')[0]
        if (sorted[i]?.date === expectedStr) {
          streakDays++
        } else {
          break
        }
      }
      set({ checkins, todayCheckin, streakDays, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  /**
   * 执行今日打卡
   * @param data - 打卡数据
   * @returns 创建后的打卡记录
   */
  doCheckin: async (data: Partial<Checkin>) => {
    const checkin = await api.createCheckin(data)
    set(state => ({
      checkins: [checkin, ...state.checkins],
      todayCheckin: checkin,
      streakDays: state.streakDays + 1,
    }))
    return checkin
  },
}))
