import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface Journal {
  id: string
  userId: string
  title: string | null
  content: string
  mood: string | null
  tags: string[]
  entryDate: string
  createdAt: string
  updatedAt: string
}

export interface CreateJournalInput {
  userId: string
  content: string
  title?: string
  mood?: string
  tags?: string[]
  entryDate?: string
}

export interface UpdateJournalInput {
  title?: string
  content?: string
  mood?: string
  tags?: string[]
}

export const journalRepository = {
  async findById(id: string): Promise<Journal | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<Journal>(data)
  },

  async findByUserId(userId: string): Promise<Journal[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<Journal>(row))
  },

  async findByDate(userId: string, date: string): Promise<Journal | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<Journal>(data)
  },

  async create(input: CreateJournalInput): Promise<Journal> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('journals')
      .insert(mapInput({
        ...input,
        tags: input.tags ?? [],
        entryDate: input.entryDate ?? new Date().toISOString().split('T')[0]
      } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Journal>(data)
  },

  async update(id: string, patch: UpdateJournalInput): Promise<Journal> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('journals')
      .update(mapInput(patch as unknown as Record<string, unknown>))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Journal>(data)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase.from('journals').delete().eq('id', id)
    if (error) throw new RepositoryError(error.message, error.code, error)
  }
}
