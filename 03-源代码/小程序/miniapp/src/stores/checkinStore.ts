import { create } from 'zustand'
import { api } from '../services/api'
import type { Checkin } from '../types'

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

  initUser: async (userId: string) => {
  },

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