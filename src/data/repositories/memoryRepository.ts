import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface MemoryEvent {
  id: string
  userId: string
  type: string
  title: string
  content: string | null
  importance: number
  tags: string[]
  forgotten: boolean
  forgottenAt: string | null
  createdAt: string
}

export interface CreateMemoryInput {
  userId: string
  type: string
  title: string
  content?: string
  importance?: number
  tags?: string[]
}

export const memoryRepository = {
  async findById(id: string): Promise<MemoryEvent | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('memory_events')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<MemoryEvent>(data)
  },

  async findByUserId(userId: string, limit = 100): Promise<MemoryEvent[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('memory_events')
      .select('*')
      .eq('user_id', userId)
      .eq('forgotten', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<MemoryEvent>(row))
  },

  async findByType(userId: string, type: string): Promise<MemoryEvent[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('memory_events')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('forgotten', false)
      .order('created_at', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<MemoryEvent>(row))
  },

  async create(input: CreateMemoryInput): Promise<MemoryEvent> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('memory_events')
      .insert(mapInput({
        ...input,
        importance: input.importance ?? 1,
        tags: input.tags ?? [],
        forgotten: false
      } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<MemoryEvent>(data)
  },

  async forget(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase
      .from('memory_events')
      .update({ forgotten: true, forgotten_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new RepositoryError(error.message, error.code, error)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase.from('memory_events').delete().eq('id', id)
    if (error) throw new RepositoryError(error.message, error.code, error)
  }
}
