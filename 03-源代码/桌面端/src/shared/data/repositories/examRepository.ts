import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface Exam {
  id: string
  userId: string
  name: string
  subject: string | null
  examDate: string | null
  score: number | null
  totalScore: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateExamInput {
  userId: string
  name: string
  subject?: string
  examDate?: string
  score?: number
  totalScore?: number
}

export interface UpdateExamInput {
  name?: string
  subject?: string
  examDate?: string
  score?: number
  totalScore?: number
}

export const examRepository = {
  async findByUserId(userId: string): Promise<Exam[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', userId)
      .order('exam_date', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<Exam>(row))
  },

  async create(input: CreateExamInput): Promise<Exam> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('exams')
      .insert(mapInput(input as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Exam>(data)
  },

  async update(id: string, patch: UpdateExamInput): Promise<Exam> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('exams')
      .update(mapInput(patch as unknown as Record<string, unknown>))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Exam>(data)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase.from('exams').delete().eq('id', id)
    if (error) throw new RepositoryError(error.message, error.code, error)
  }
}
