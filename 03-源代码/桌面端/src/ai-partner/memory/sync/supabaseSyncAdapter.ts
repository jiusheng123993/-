import type { CloudSyncAdapter, CloudSyncConfig, CloudSyncPayload, CloudSyncStatus, CloudSyncProvider } from './cloudSyncAdapter'
import { getSupabase } from '../../../shared/infrastructure/supabase'

const SYNC_API_BASE = '/api/sync'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export function createSupabaseSyncAdapter(config: CloudSyncConfig): CloudSyncAdapter {
  let connected = false
  let syncing = false
  let lastSync: string | undefined
  let pending = 0
  let error: string | undefined

  const checkConnection = async (): Promise<boolean> => {
    try {
      const supabase = getSupabase()
      if (!supabase) return false
      const { error: pingError } = await supabase.from('sync_log').select('id').limit(1)
      return !pingError
    } catch {
      return false
    }
  }

  return {
    async connect(): Promise<boolean> {
      try {
        const ok = await checkConnection()
        connected = ok
        if (ok) {
          lastSync = config.lastSyncTime
        }
        return ok
      } catch (e) {
        error = (e as Error).message
        connected = false
        return false
      }
    },

    async disconnect(): Promise<void> {
      connected = false
    },

    async getStatus(): Promise<CloudSyncStatus> {
      return {
        isConnected: connected,
        isSyncing: syncing,
        lastSyncTime: lastSync,
        pendingChanges: pending,
        error
      }
    },

    async sync(payload: CloudSyncPayload): Promise<boolean> {
      if (!connected) return false
      syncing = true
      error = undefined

      try {
        const pushResult = await this.push(payload)
        if (!pushResult) {
          syncing = false
          return false
        }

        const remote = await this.pull()
        if (remote) {
          const resolution = await this.resolveConflict(payload, remote)
          if (resolution === 'remote') {
            return true
          }
        }

        lastSync = new Date().toISOString()
        pending = 0
        syncing = false
        return true
      } catch (e) {
        error = (e as Error).message
        syncing = false
        return false
      }
    },

    async pull(): Promise<CloudSyncPayload | null> {
      if (!connected) return null

      try {
        const headers = getAuthHeaders()
        const since = lastSync ? `?since=${encodeURIComponent(lastSync)}` : ''
        const response = await fetch(`${SYNC_API_BASE}/pull${since}`, { headers })

        if (!response.ok) return null

        const data = await response.json()
        lastSync = data.syncedAt

        return {
          workspace: payload.workspace,
          memory: payload.memory,
          timestamp: data.syncedAt,
          version: 1
        }
      } catch {
        return null
      }
    },

    async push(_data: CloudSyncPayload): Promise<boolean> {
      if (!connected) return false

      try {
        pending++
        const headers = getAuthHeaders()
        const response = await fetch(`${SYNC_API_BASE}/push`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            personas: [],
            memoryEvents: []
          })
        })

        pending--
        if (!response.ok) return false

        const result = await response.json()
        if (result.success) {
          lastSync = result.syncedAt
        }
        return result.success
      } catch {
        pending--
        return false
      }
    },

    async resolveConflict(local: CloudSyncPayload, remote: CloudSyncPayload): Promise<'local' | 'remote' | 'merge'> {
      try {
        const headers = getAuthHeaders()
        const response = await fetch(`${SYNC_API_BASE}/conflict`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            localVersion: local.version,
            remoteVersion: remote.version,
            localData: {},
            remoteData: {}
          })
        })

        if (!response.ok) {
          return local.version >= remote.version ? 'local' : 'remote'
        }

        const result = await response.json()
        return result.resolution
      } catch {
        return local.version >= remote.version ? 'local' : 'remote'
      }
    }
  }
}

export const supabaseSyncProvider: CloudSyncProvider = {
  id: 'supabase',
  name: 'Supabase 云同步',
  icon: '☁️',
  createAdapter: createSupabaseSyncAdapter
}
