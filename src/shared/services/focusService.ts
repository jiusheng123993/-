import {
  focusRepository,
  growthRepository,
  type FocusSession
} from '../data/repositories'

export const focusService = {
  async startSession(userId: string, mode?: string): Promise<FocusSession> {
    return focusRepository.create({
      userId,
      duration: 0,
      startedAt: new Date().toISOString(),
      mode: mode ?? 'pomodoro'
    })
  },

  async endSession(sessionId: string): Promise<{ session: FocusSession; experience: number }> {
    const session = await focusRepository.findById(sessionId)
    if (!session) throw new Error('专注记录不存在')

    const endedAt = new Date().toISOString()
    const startedAt = new Date(session.startedAt)
    const duration = Math.floor((new Date(endedAt).getTime() - startedAt.getTime()) / 1000)

    const { data, error } = await import('../infrastructure/supabase').then((m) => {
      const supabase = m.getSupabase()
      if (!supabase) throw new Error('Supabase 未配置')
      return supabase
        .from('focus_sessions')
        .update({ duration, ended_at: endedAt })
        .eq('id', sessionId)
        .select()
        .single()
    })

    if (error) throw error

    const expGain = Math.floor(duration / 60)
    if (expGain > 0) {
      await growthRepository.addExperience(session.userId, expGain)
    }

    return { session: data as FocusSession, experience: expGain }
  },

  async getHistory(userId: string, limit = 50): Promise<FocusSession[]> {
    return focusRepository.findByUserId(userId, limit)
  },

  async getTotalFocusTime(userId: string): Promise<number> {
    return focusRepository.getTotalDuration(userId)
  }
}
