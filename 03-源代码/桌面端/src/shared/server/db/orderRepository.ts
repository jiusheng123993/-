import { getDbClient } from './migration'

export interface DbOrder {
  id: string
  user_id: string
  product_id: string
  channel: string
  amount: number
  status: string
  channel_trade_no: string | null
  receipt: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface DbPaymentRecord {
  id: string
  order_id: string
  channel: string
  trade_no: string | null
  amount: number
  raw_callback: Record<string, unknown> | null
  created_at: string
}

export interface DbEntitlement {
  id: string
  user_id: string
  entitlement_key: string
  source_order_id: string | null
  expires_at: string | null
  created_at: string
}

export const orderRepo = {
  async create(order: {
    id: string
    userId: string
    productId: string
    channel: string
    amount: number
  }): Promise<DbOrder> {
    const client = getDbClient()
    const { data, error } = await client
      .from('orders')
      .insert({
        id: order.id,
        user_id: order.userId,
        product_id: order.productId,
        channel: order.channel,
        amount: order.amount,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create order: ${error.message}`)
    return data as DbOrder
  },

  async findById(id: string): Promise<DbOrder | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return undefined
    return data as DbOrder
  },

  async findByUserId(userId: string): Promise<DbOrder[]> {
    const client = getDbClient()
    const { data } = await client
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return (data as DbOrder[]) || []
  },

  async updateStatus(
    id: string,
    status: string,
    extra?: { channelTradeNo?: string; receipt?: string }
  ): Promise<DbOrder | undefined> {
    const client = getDbClient()
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'paid') {
      updates.paid_at = new Date().toISOString()
    }
    if (extra?.channelTradeNo) {
      updates.channel_trade_no = extra.channelTradeNo
    }
    if (extra?.receipt) {
      updates.receipt = extra.receipt
    }

    const { data, error } = await client
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return undefined
    return data as DbOrder
  }
}

export const paymentRepo = {
  async create(record: {
    orderId: string
    channel: string
    tradeNo?: string
    amount: number
    rawCallback?: Record<string, unknown>
  }): Promise<DbPaymentRecord> {
    const client = getDbClient()
    const { data, error } = await client
      .from('payment_records')
      .insert({
        order_id: record.orderId,
        channel: record.channel,
        trade_no: record.tradeNo || null,
        amount: record.amount,
        raw_callback: record.rawCallback || null
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create payment record: ${error.message}`)
    return data as DbPaymentRecord
  },

  async findByOrderId(orderId: string): Promise<DbPaymentRecord[]> {
    const client = getDbClient()
    const { data } = await client
      .from('payment_records')
      .select('*')
      .eq('order_id', orderId)

    return (data as DbPaymentRecord[]) || []
  }
}

export const entitlementRepo = {
  async grant(params: {
    userId: string
    entitlementKey: string
    sourceOrderId?: string
    expiresAt?: string
  }): Promise<DbEntitlement> {
    const client = getDbClient()

    const { data: existing } = await client
      .from('entitlements')
      .select('id')
      .eq('user_id', params.userId)
      .eq('entitlement_key', params.entitlementKey)
      .single()

    if (existing) {
      const { data, error } = await client
        .from('entitlements')
        .update({
          source_order_id: params.sourceOrderId || null,
          expires_at: params.expiresAt || null
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw new Error(`Failed to update entitlement: ${error.message}`)
      return data as DbEntitlement
    }

    const { data, error } = await client
      .from('entitlements')
      .insert({
        user_id: params.userId,
        entitlement_key: params.entitlementKey,
        source_order_id: params.sourceOrderId || null,
        expires_at: params.expiresAt || null
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to grant entitlement: ${error.message}`)
    return data as DbEntitlement
  },

  async findByUserId(userId: string): Promise<DbEntitlement[]> {
    const client = getDbClient()
    const { data } = await client
      .from('entitlements')
      .select('*')
      .eq('user_id', userId)

    return (data as DbEntitlement[]) || []
  },

  async findByUserAndKey(
    userId: string,
    entitlementKey: string
  ): Promise<DbEntitlement | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('entitlement_key', entitlementKey)
      .single()

    if (error || !data) return undefined
    return data as DbEntitlement
  },

  async revoke(userId: string, entitlementKey: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('entitlements')
      .delete()
      .eq('user_id', userId)
      .eq('entitlement_key', entitlementKey)

    return !error
  }
}
