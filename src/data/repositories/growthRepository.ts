import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface GrowthState {
  userId: string
  level: number
  experience: number
  streakDays: number
  achievements: number
  updatedAt: string
}

export interface UpdateGrowthInput {
  level?: number
  experience?: number
  streakDays?: number
  achievements?: number
}

export const growthRepository = {
  async findByUserId(userId: string): Promise<GrowthState | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('growth_state')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<GrowthState>(data)
  },

  async upsert(userId: string, input: UpdateGrowthInput): Promise<GrowthState> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('growth_state')
      .upsert(mapInput({ userId, ...input } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<GrowthState>(data)
  },

  async addExperience(userId: string, amount: number): Promise<GrowthState> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const current = await this.findByUserId(userId)
    const newExp = (current?.experience ?? 0) + amount
    const newLevel = Math.floor(newExp / 100) + 1

    return this.upsert(userId, { experience: newExp, level: newLevel })
  }
}
