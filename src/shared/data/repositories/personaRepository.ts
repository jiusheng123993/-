import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface CustomPersona {
  id: string
  userId: string
  name: string
  description: string | null
  tone: string | null
  identity: string | null
  avatarEmoji: string | null
  isPublished: boolean
  safetyStatus: string
  createdAt: string
  updatedAt: string
}

export interface CreatePersonaInput {
  userId: string
  name: string
  description?: string
  tone?: string
  identity?: string
  avatarEmoji?: string
}

export interface UpdatePersonaInput {
  name?: string
  description?: string
  tone?: string
  identity?: string
  avatarEmoji?: string
  isPublished?: boolean
  safetyStatus?: string
}

export const personaRepository = {
  async findById(id: string): Promise<CustomPersona | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('custom_personas')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<CustomPersona>(data)
  },

  async findByUserId(userId: string): Promise<CustomPersona[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('custom_personas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<CustomPersona>(row))
  },

  async create(input: CreatePersonaInput): Promise<CustomPersona> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('custom_personas')
      .insert(mapInput(input as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<CustomPersona>(data)
  },

  async update(id: string, patch: UpdatePersonaInput): Promise<CustomPersona> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('custom_personas')
      .update(mapInput(patch as unknown as Record<string, unknown>))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<CustomPersona>(data)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase.from('custom_personas').delete().eq('id', id)
    if (error) throw new RepositoryError(error.message, error.code, error)
  }
}
