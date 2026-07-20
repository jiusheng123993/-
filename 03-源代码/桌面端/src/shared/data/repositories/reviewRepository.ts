import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface ReviewItem {
  id: string
  userId: string
  title: string
  subject: string | null
  dueDate: string | null
  level: string
  interval: number
  easeFactor: number
  reviewCount: number
  lastReviewDate: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateReviewInput {
  userId: string
  title: string
  subject?: string
  dueDate?: string
  level?: string
}

export interface UpdateReviewInput {
  title?: string
  subject?: string
  dueDate?: string
  level?: string
  interval?: number
  easeFactor?: number
  reviewCount?: number
  lastReviewDate?: string
}

export const reviewRepository = {
  async findById(id: string): Promise<ReviewItem | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('review_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<ReviewItem>(data)
  },

  async findByUserId(userId: string): Promise<ReviewItem[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('review_items')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<ReviewItem>(row))
  },

  async findDue(userId: string): Promise<ReviewItem[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('review_items')
      .select('*')
      .eq('user_id', userId)
      .lte('due_date', today)
      .order('due_date', { ascending: true })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<ReviewItem>(row))
  },

  async create(input: CreateReviewInput): Promise<ReviewItem> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('review_items')
      .insert(mapInput({
        ...input,
        level: input.level ?? 'medium',
        interval: 0,
        easeFactor: 2.5,
        reviewCount: 0
      } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<ReviewItem>(data)
  },

  async update(id: string, patch: UpdateReviewInput): Promise<ReviewItem> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('review_items')
      .update(mapInput(patch as unknown as Record<string, unknown>))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<ReviewItem>(data)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase.from('review_items').delete().eq('id', id)
    if (error) throw new RepositoryError(error.message, error.code, error)
  }
}
