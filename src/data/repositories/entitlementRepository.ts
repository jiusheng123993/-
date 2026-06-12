import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface Entitlement {
  id: string
  userId: string
  key: string
  source: string
  expiresAt: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface CreateEntitlementInput {
  userId: string
  key: string
  source: string
  expiresAt?: string
  metadata?: Record<string, unknown>
}

export const entitlementRepository = {
  async findByUserId(userId: string): Promise<Entitlement[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('entitlements')
      .select('*')
      .eq('user_id', userId)

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<Entitlement>(row))
  },

  async findByUserAndKey(userId: string, key: string): Promise<Entitlement | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('key', key)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<Entitlement>(data)
  },

  async create(input: CreateEntitlementInput): Promise<Entitlement> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('entitlements')
      .insert(mapInput({ ...input, metadata: input.metadata ?? {} } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Entitlement>(data)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase.from('entitlements').delete().eq('id', id)
    if (error) throw new RepositoryError(error.message, error.code, error)
  }
}
