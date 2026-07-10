import { getDbClient } from './migration'

export interface DbPersona {
  id: string
  user_id: string
  name: string
  description: string | null
  persona_type: string
  config: Record<string, unknown>
  avatar_url: string | null
  is_public: boolean
  share_count: number
  rating_avg: number
  rating_count: number
  status: string
  created_at: string
  updated_at: string
}

export interface DbMemoryEvent {
  id: string
  user_id: string
  event_type: string
  content: string | null
  metadata: Record<string, unknown>
  importance: number
  created_at: string
}

export interface DbSyncLog {
  id: string
  user_id: string
  table_name: string
  record_id: string
  action: string
  synced_at: string
}

export const personaRepo = {
  async create(persona: {
    userId: string
    name: string
    description?: string
    personaType?: string
    config?: Record<string, unknown>
    avatarUrl?: string
    isPublic?: boolean
  }): Promise<DbPersona> {
    const client = getDbClient()
    const { data, error } = await client
      .from('personas')
      .insert({
        user_id: persona.userId,
        name: persona.name,
        description: persona.description || null,
        persona_type: persona.personaType || 'custom',
        config: persona.config || {},
        avatar_url: persona.avatarUrl || null,
        is_public: persona.isPublic || false
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create persona: ${error.message}`)
    return data as DbPersona
  },

  async findById(id: string): Promise<DbPersona | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('personas')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return undefined
    return data as DbPersona
  },

  async findByUserId(userId: string): Promise<DbPersona[]> {
    const client = getDbClient()
    const { data } = await client
      .from('personas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return (data as DbPersona[]) || []
  },

  async findPublic(options?: {
    personaType?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<DbPersona[]> {
    const client = getDbClient()
    let query = client
      .from('personas')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'active')

    if (options?.personaType) {
      query = query.eq('persona_type', options.personaType)
    }
    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`)
    }

    query = query
      .order('rating_avg', { ascending: false })
      .limit(options?.limit || 20)

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
    }

    const { data } = await query
    return (data as DbPersona[]) || []
  },

  async update(
    id: string,
    userId: string,
    updates: Partial<Pick<DbPersona, 'name' | 'description' | 'config' | 'avatar_url' | 'is_public' | 'status'>>
  ): Promise<DbPersona | undefined> {
    const client = getDbClient()
    const { data, error } = await client
      .from('personas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error || !data) return undefined
    return data as DbPersona
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('personas')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return !error
  },

  async incrementShareCount(id: string): Promise<void> {
    const client = getDbClient()
    await client.rpc('increment_share_count' as never, { persona_id: id } as never)
  }
}

export const memoryEventRepo = {
  async create(event: {
    userId: string
    eventType: string
    content?: string
    metadata?: Record<string, unknown>
    importance?: number
  }): Promise<DbMemoryEvent> {
    const client = getDbClient()
    const { data, error } = await client
      .from('memory_events')
      .insert({
        user_id: event.userId,
        event_type: event.eventType,
        content: event.content || null,
        metadata: event.metadata || {},
        importance: event.importance || 0
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create memory event: ${error.message}`)
    return data as DbMemoryEvent
  },

  async findByUserId(
    userId: string,
    options?: { eventType?: string; limit?: number; offset?: number }
  ): Promise<DbMemoryEvent[]> {
    const client = getDbClient()
    let query = client
      .from('memory_events')
      .select('*')
      .eq('user_id', userId)

    if (options?.eventType) {
      query = query.eq('event_type', options.eventType)
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(options?.limit || 50)

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data } = await query
    return (data as DbMemoryEvent[]) || []
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const client = getDbClient()
    const { error } = await client
      .from('memory_events')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return !error
  }
}

export const syncLogRepo = {
  async log(entry: {
    userId: string
    tableName: string
    recordId: string
    action: 'insert' | 'update' | 'delete'
  }): Promise<void> {
    const client = getDbClient()
    await client.from('sync_log').insert({
      user_id: entry.userId,
      table_name: entry.tableName,
      record_id: entry.recordId,
      action: entry.action
    })
  },

  async getLatestSync(
    userId: string,
    tableName: string
  ): Promise<string | undefined> {
    const client = getDbClient()
    const { data } = await client
      .from('sync_log')
      .select('synced_at')
      .eq('user_id', userId)
      .eq('table_name', tableName)
      .order('synced_at', { ascending: false })
      .limit(1)
      .single()

    return data ? (data as { synced_at: string }).synced_at : undefined
  }
}
