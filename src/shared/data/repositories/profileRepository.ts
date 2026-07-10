import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface Profile {
  id: string
  username: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateProfileInput {
  id: string
  username?: string
  avatarUrl?: string
}

export interface UpdateProfileInput {
  username?: string
  avatarUrl?: string
}

export const profileRepository = {
  async findById(id: string): Promise<Profile | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<Profile>(data)
  },

  async create(input: CreateProfileInput): Promise<Profile> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('profiles')
      .insert(mapInput(input as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Profile>(data)
  },

  async update(id: string, patch: UpdateProfileInput): Promise<Profile> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('profiles')
      .update(mapInput(patch as unknown as Record<string, unknown>))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Profile>(data)
  },

  async upsert(input: CreateProfileInput): Promise<Profile> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('profiles')
      .upsert(mapInput(input as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Profile>(data)
  }
}
