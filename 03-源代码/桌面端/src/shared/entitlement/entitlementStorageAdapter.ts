import type { Entitlement, UserEntitlements } from './entitlementTypes'
import type { Order, OrderStatus } from './orderTypes'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface EntitlementStorageAdapter {
  load(userId: string): Promise<UserEntitlements | null>
  save(data: UserEntitlements): Promise<void>
  loadAll(): Promise<UserEntitlements[]>
}

export interface OrderStorageAdapter {
  load(orderId: string): Promise<Order | null>
  loadByUser(userId: string): Promise<Order[]>
  save(order: Order): Promise<void>
  updateStatus(
    orderId: string,
    status: OrderStatus,
    extra?: { channelTradeNo?: string; receipt?: string }
  ): Promise<void>
}

export class InMemoryEntitlementStorage implements EntitlementStorageAdapter {
  private readonly store = new Map<string, UserEntitlements>()

  async load(userId: string): Promise<UserEntitlements | null> {
    if (!userId) return null
    return this.store.get(userId) ?? null
  }

  async save(data: UserEntitlements): Promise<void> {
    if (!data || !data.userId) {
      throw new Error('InMemoryEntitlementStorage.save: userId is required')
    }
    this.store.set(data.userId, { ...data, updatedAt: new Date().toISOString() })
  }

  async loadAll(): Promise<UserEntitlements[]> {
    return Array.from(this.store.values())
  }
}

export class InMemoryOrderStorage implements OrderStorageAdapter {
  private readonly store = new Map<string, Order>()

  async load(orderId: string): Promise<Order | null> {
    if (!orderId) return null
    return this.store.get(orderId) ?? null
  }

  async loadByUser(userId: string): Promise<Order[]> {
    if (!userId) return []
    return Array.from(this.store.values())
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async save(order: Order): Promise<void> {
    if (!order || !order.id) {
      throw new Error('InMemoryOrderStorage.save: order.id is required')
    }
    this.store.set(order.id, order)
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    extra?: { channelTradeNo?: string; receipt?: string }
  ): Promise<void> {
    const order = this.store.get(orderId)
    if (!order) {
      throw new Error(`InMemoryOrderStorage.updateStatus: order not found: ${orderId}`)
    }
    order.status = status
    if (extra?.channelTradeNo) order.channelTradeNo = extra.channelTradeNo
    if (extra?.receipt) order.rawReceipt = extra.receipt
    if (status === 'paid') order.paidAt = new Date().toISOString()
    if (status === 'refunded') order.refundedAt = new Date().toISOString()
  }
}

interface DbEntitlementRow {
  id: string
  user_id: string
  entitlement_key: string
  source: string
  expires_at: string | null
  scope: string | null
  remaining: number | null
  reset_at: string | null
  source_order_id: string | null
  granted_at: string
}

interface DbOrderRow {
  id: string
  user_id: string
  product_id: string
  channel: string
  amount: number
  status: string
  channel_trade_no: string | null
  receipt: string | null
  paid_at: string | null
  refunded_at: string | null
  created_at: string
  updated_at: string
}

function mapDbRowToEntitlement(row: DbEntitlementRow): Entitlement {
  return {
    code: row.entitlement_key as Entitlement['code'],
    source: row.source as Entitlement['source'],
    expireAt: row.expires_at,
    scope: row.scope ?? undefined,
    remaining: row.remaining ?? undefined,
    resetAt: row.reset_at ?? undefined,
    orderId: row.source_order_id ?? undefined,
    grantedAt: row.granted_at
  }
}

function mapDbRowToOrder(row: DbOrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    amount: row.amount,
    channel: row.channel as Order['channel'],
    status: row.status as OrderStatus,
    channelTradeNo: row.channel_trade_no ?? undefined,
    rawReceipt: row.receipt ?? undefined,
    createdAt: row.created_at,
    paidAt: row.paid_at ?? undefined,
    refundedAt: row.refunded_at ?? undefined
  }
}

export class SupabaseEntitlementStorage implements EntitlementStorageAdapter {
  constructor(private readonly client: SupabaseClient) {
    if (!client) throw new Error('SupabaseEntitlementStorage: client is required')
  }

  async load(userId: string): Promise<UserEntitlements | null> {
    if (!userId) return null
    const { data, error } = await this.client
      .from('entitlements')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.warn(`SupabaseEntitlementStorage.load failed: ${error.message}`)
      return null
    }
    if (!data || data.length === 0) return null

    const rows = data as DbEntitlementRow[]
    const entitlements = rows.map(mapDbRowToEntitlement)
    return {
      userId,
      entitlements,
      updatedAt: new Date().toISOString()
    }
  }

  async save(data: UserEntitlements): Promise<void> {
    if (!data || !data.userId) {
      throw new Error('SupabaseEntitlementStorage.save: userId is required')
    }

    const { error: deleteError } = await this.client
      .from('entitlements')
      .delete()
      .eq('user_id', data.userId)

    if (deleteError) {
      throw new Error(`SupabaseEntitlementStorage.save delete failed: ${deleteError.message}`)
    }

    if (data.entitlements.length === 0) return

    const rows = data.entitlements.map((e) => ({
      user_id: data.userId,
      entitlement_key: e.code,
      source: e.source,
      expires_at: e.expireAt,
      scope: e.scope ?? null,
      remaining: e.remaining ?? null,
      reset_at: e.resetAt ?? null,
      source_order_id: e.orderId ?? null,
      granted_at: e.grantedAt
    }))

    const { error: insertError } = await this.client
      .from('entitlements')
      .insert(rows)

    if (insertError) {
      throw new Error(`SupabaseEntitlementStorage.save insert failed: ${insertError.message}`)
    }
  }

  async loadAll(): Promise<UserEntitlements[]> {
    const { data, error } = await this.client
      .from('entitlements')
      .select('*')

    if (error) {
      console.warn(`SupabaseEntitlementStorage.loadAll failed: ${error.message}`)
      return []
    }
    if (!data || data.length === 0) return []

    const rows = data as DbEntitlementRow[]
    const grouped = new Map<string, Entitlement[]>()

    for (const row of rows) {
      const list = grouped.get(row.user_id) ?? []
      list.push(mapDbRowToEntitlement(row))
      grouped.set(row.user_id, list)
    }

    return Array.from(grouped.entries()).map(([userId, entitlements]) => ({
      userId,
      entitlements,
      updatedAt: new Date().toISOString()
    }))
  }
}

export class SupabaseOrderStorage implements OrderStorageAdapter {
  constructor(private readonly client: SupabaseClient) {
    if (!client) throw new Error('SupabaseOrderStorage: client is required')
  }

  async load(orderId: string): Promise<Order | null> {
    if (!orderId) return null
    const { data, error } = await this.client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !data) return null
    return mapDbRowToOrder(data as DbOrderRow)
  }

  async loadByUser(userId: string): Promise<Order[]> {
    if (!userId) return []
    const { data, error } = await this.client
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return (data as DbOrderRow[]).map(mapDbRowToOrder)
  }

  async save(order: Order): Promise<void> {
    if (!order || !order.id) {
      throw new Error('SupabaseOrderStorage.save: order.id is required')
    }

    const { data: existing } = await this.client
      .from('orders')
      .select('id')
      .eq('id', order.id)
      .single()

    if (existing) {
      const { error } = await this.client
        .from('orders')
        .update({
          user_id: order.userId,
          product_id: order.productId,
          amount: order.amount,
          channel: order.channel,
          status: order.status,
          channel_trade_no: order.channelTradeNo ?? null,
          receipt: order.rawReceipt ?? null,
          paid_at: order.paidAt ?? null,
          refunded_at: order.refundedAt ?? null,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (error) {
        throw new Error(`SupabaseOrderStorage.save update failed: ${error.message}`)
      }
      return
    }

    const { error } = await this.client
      .from('orders')
      .insert({
        id: order.id,
        user_id: order.userId,
        product_id: order.productId,
        amount: order.amount,
        channel: order.channel,
        status: order.status,
        channel_trade_no: order.channelTradeNo ?? null,
        receipt: order.rawReceipt ?? null,
        paid_at: order.paidAt ?? null,
        refunded_at: order.refundedAt ?? null,
        created_at: order.createdAt,
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw new Error(`SupabaseOrderStorage.save insert failed: ${error.message}`)
    }
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    extra?: { channelTradeNo?: string; receipt?: string }
  ): Promise<void> {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'paid') {
      updates.paid_at = new Date().toISOString()
    }
    if (status === 'refunded') {
      updates.refunded_at = new Date().toISOString()
    }
    if (extra?.channelTradeNo) {
      updates.channel_trade_no = extra.channelTradeNo
    }
    if (extra?.receipt) {
      updates.receipt = extra.receipt
    }

    const { error } = await this.client
      .from('orders')
      .update(updates)
      .eq('id', orderId)

    if (error) {
      throw new Error(`SupabaseOrderStorage.updateStatus failed: ${error.message}`)
    }
  }
}

export interface StorageAdapters {
  entitlementStorage: EntitlementStorageAdapter
  orderStorage: OrderStorageAdapter
  isPersistent: boolean
}

export async function createStorageAdapters(
  supabaseClient: SupabaseClient | null
): Promise<StorageAdapters> {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('entitlements')
        .select('id')
        .limit(1)

      if (!error) {
        return {
          entitlementStorage: new SupabaseEntitlementStorage(supabaseClient),
          orderStorage: new SupabaseOrderStorage(supabaseClient),
          isPersistent: true
        }
      }

      console.warn(
        `[StorageAdapter] Supabase connectivity check failed (${error.message}), falling back to in-memory storage. Data will NOT persist.`
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(
        `[StorageAdapter] Supabase client error (${message}), falling back to in-memory storage. Data will NOT persist.`
      )
    }
  } else {
    console.warn(
      '[StorageAdapter] No Supabase client provided, using in-memory storage. Data will NOT persist.'
    )
  }

  return {
    entitlementStorage: new InMemoryEntitlementStorage(),
    orderStorage: new InMemoryOrderStorage(),
    isPersistent: false
  }
}
