import { getSupabase } from '../../infrastructure/supabase'
import { RepositoryError, mapRow, mapInput } from './types'

export interface Order {
  id: string
  userId: string
  productId: string
  amount: number
  currency: string
  status: string
  paymentMethod: string | null
  paidAt: string | null
  createdAt: string
}

export interface CreateOrderInput {
  userId: string
  productId: string
  amount: number
  currency?: string
  paymentMethod?: string
}

export const orderRepository = {
  async findById(id: string): Promise<Order | null> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new RepositoryError(error.message, error.code, error)
    }
    return mapRow<Order>(data)
  },

  async findByUserId(userId: string): Promise<Order[]> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new RepositoryError(error.message, error.code, error)
    return (data || []).map((row) => mapRow<Order>(row))
  },

  async create(input: CreateOrderInput): Promise<Order> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const { data, error } = await supabase
      .from('orders')
      .insert(mapInput({ ...input, currency: input.currency ?? 'CNY', status: 'pending' } as unknown as Record<string, unknown>))
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Order>(data)
  },

  async updateStatus(id: string, status: string, paidAt?: string): Promise<Order> {
    const supabase = getSupabase()
    if (!supabase) throw new RepositoryError('Supabase 未配置', 'NOT_CONFIGURED')

    const patch: Record<string, unknown> = { status }
    if (paidAt) patch.paid_at = paidAt

    const { data, error } = await supabase
      .from('orders')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new RepositoryError(error.message, error.code, error)
    return mapRow<Order>(data)
  }
}
