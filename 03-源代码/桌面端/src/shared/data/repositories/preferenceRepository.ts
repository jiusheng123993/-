import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface Preference {
  userId: string
  themeId: string
  themeMode: string
  activePersona: string | null
  aiSettings: Record<string, unknown>
  syncSettings: Record<string, unknown>
  updatedAt: string
}

export interface UpdatePreferenceInput {
  themeId?: string
  themeMode?: string
  activePersona?: string | null
  aiSettings?: Record<string, unknown>
  syncSettings?: Record<string, unknown>
}

export const preferenceRepository = {
  async findByUserId(userId: string): Promise<Preference | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<Preference>(data)
  },

  async upsert(userId: string, input: UpdatePreferenceInput): Promise<Preference> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('preferences')
      .upsert(mapInput({ userId, ...input } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Preference>(data)
  }
}
