import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface Task {
  id: string
  userId: string
  goalId: string | null
  title: string
  status: string
  minutes: number
  rewardPoints: number
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  userId: string
  goalId?: string
  title: string
  status?: string
  minutes?: number
  rewardPoints?: number
}

export interface UpdateTaskInput {
  title?: string
  status?: string
  minutes?: number
  rewardPoints?: number
  goalId?: string | null
}

export const taskRepository = {
  async findById(id: string): Promise<Task | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<Task>(data)
  },

  async findByUserId(userId: string): Promise<Task[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<Task>(row))
  },

  async findByGoalId(goalId: string): Promise<Task[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<Task>(row))
  },

  async create(input: CreateTaskInput): Promise<Task> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('tasks')
      .insert(mapInput({
        ...input,
        status: input.status ?? 'todo',
        minutes: input.minutes ?? 0,
        rewardPoints: input.rewardPoints ?? 0
      } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Task>(data)
  },

  async update(id: string, patch: UpdateTaskInput): Promise<Task> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('tasks')
      .update(mapInput(patch as unknown as Record<string, unknown>))
      .eq('id', id)
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Task>(data)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw new RepositoryError(error.message, error.code, error)
  }
}
