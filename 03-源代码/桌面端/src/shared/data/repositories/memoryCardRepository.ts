import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface MemoryCard {
  id: string
  userId: string
  front: string
  back: string
  subject: string | null
  interval: number
  easeFactor: number
  reviewCount: number
  nextReviewAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateMemoryCardInput {
  userId: string
  front: string
  back: string
  subject?: string
}

export interface UpdateMemoryCardInput {
  front?: string
  back?: string
  subject?: string
  interval?: number
  easeFactor?: number
  reviewCount?: number
  nextReviewAt?: string
}

export const memoryCardRepository = {
  async findByUserId(userId: string): Promise<MemoryCard[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('memory_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<MemoryCard>(row))
  },

  async findDue(userId: string): Promise<MemoryCard[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('memory_cards')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<MemoryCard>(row))
  },

  async create(input: CreateMemoryCardInput): Promise<MemoryCard> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('memory_cards')
      .insert(mapInput({
        ...input,
        interval: 0,
        easeFactor: 2.5,
        reviewCount: 0
      } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<MemoryCard>(data)
  },

  async update(id: string, patch: UpdateMemoryCardInput): Promise<MemoryCard> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('memory_cards')
      .update(mapInput(patch as unknown as Record<string, unknown>))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<MemoryCard>(data)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase.from('memory_cards').delete().eq('id', id)
    if (error) throw new RepositoryError(error.message, error.code, error)
  }
}
