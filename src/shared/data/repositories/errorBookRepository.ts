import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface ErrorBookItem {
  id: string
  userId: string
  question: string
  answer: string | null
  subject: string | null
  tags: string[]
  reviewCount: number
  mastered: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateErrorBookInput {
  userId: string
  question: string
  answer?: string
  subject?: string
  tags?: string[]
}

export interface UpdateErrorBookInput {
  question?: string
  answer?: string
  subject?: string
  tags?: string[]
  reviewCount?: number
  mastered?: boolean
}

export const errorBookRepository = {
  async findByUserId(userId: string): Promise<ErrorBookItem[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('error_book')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<ErrorBookItem>(row))
  },

  async findUnmastered(userId: string): Promise<ErrorBookItem[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('error_book')
      .select('*')
      .eq('user_id', userId)
      .eq('mastered', false)
      .order('created_at', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<ErrorBookItem>(row))
  },

  async create(input: CreateErrorBookInput): Promise<ErrorBookItem> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('error_book')
      .insert(mapInput({
        ...input,
        tags: input.tags ?? [],
        reviewCount: 0,
        mastered: false
      } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<ErrorBookItem>(data)
  },

  async update(id: string, patch: UpdateErrorBookInput): Promise<ErrorBookItem> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('error_book')
      .update(mapInput(patch as unknown as Record<string, unknown>))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<ErrorBookItem>(data)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase.from('error_book').delete().eq('id', id)
    if (error) throw new RepositoryError(error.message, error.code, error)
  }
}
