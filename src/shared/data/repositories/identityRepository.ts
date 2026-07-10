import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface Identity {
  id: string
  userId: string
  name: string
  role: string
  avatarEmoji: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateIdentityInput {
  userId: string
  name: string
  role?: string
  avatarEmoji?: string
}

export interface UpdateIdentityInput {
  name?: string
  role?: string
  avatarEmoji?: string
  isActive?: boolean
}

export const identityRepository = {
  async findByUserId(userId: string): Promise<Identity[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('identities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<Identity>(row))
  },

  async findActive(userId: string): Promise<Identity | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('identities')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<Identity>(data)
  },

  async create(input: CreateIdentityInput): Promise<Identity> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('identities')
      .insert(mapInput({ ...input, role: input.role ?? 'student', isActive: false } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Identity>(data)
  },

  async update(id: string, patch: UpdateIdentityInput): Promise<Identity> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('identities')
      .update(mapInput(patch as unknown as Record<string, unknown>))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Identity>(data)
  },

  async setActive(userId: string, identityId: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    await supabase.from('identities').update({ is_active: false }).eq('user_id', userId)
    const { error } = await supabase.from('identities').update({ is_active: true }).eq('id', identityId)
    if (error) throw new RepositoryError(error.message, error.code, error)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase.from('identities').delete().eq('id', id)
    if (error) throw new RepositoryError(error.message, error.code, error)
  }
}
