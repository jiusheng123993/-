import { getSupabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type RealtimeCallback<T = Record<string, unknown>> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
}) => void

const activeChannels = new Map<string, RealtimeChannel>()

export function subscribeToTable<T = Record<string, unknown>>(
  table: string,
  callback: RealtimeCallback<T>,
  filter?: string
): () => void {
  const supabase = getSupabase()
  if (!supabase) return () => {}

  const channelKey = `${table}:${filter || '*'}`

  if (activeChannels.has(channelKey)) {
    activeChannels.get(channelKey)!.unsubscribe()
  }

  let channelBuilder = supabase.channel(channelKey)

  channelBuilder = channelBuilder.on(
    'postgres_changes' as never,
    {
      event: '*',
      schema: 'public',
      table,
      filter
    },
    (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: T; old: T }) => {
      callback({
        eventType: payload.eventType,
        new: payload.new || null,
        old: payload.old || null
      })
    }
  )

  const channel = channelBuilder.subscribe()
  activeChannels.set(channelKey, channel)

  return () => {
    channel.unsubscribe()
    activeChannels.delete(channelKey)
  }
}

export function unsubscribeAll(): void {
  for (const [key, channel] of activeChannels) {
    channel.unsubscribe()
    activeChannels.delete(key)
  }
}
