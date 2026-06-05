import type { WorkspaceState } from '../../data/workspaceStoreTypes'
import type { MemoryProfile } from '../memoryTypes'

export interface CloudSyncConfig {
  enabled: boolean
  autoSync: boolean
  syncInterval: number
  lastSyncTime?: string
}

export interface CloudSyncStatus {
  isConnected: boolean
  isSyncing: boolean
  lastSyncTime?: string
  pendingChanges: number
  error?: string
}

export interface CloudSyncPayload {
  workspace: WorkspaceState
  memory: MemoryProfile
  timestamp: string
  version: number
}

export interface CloudSyncAdapter {
  connect(): Promise<boolean>
  disconnect(): Promise<void>
  getStatus(): Promise<CloudSyncStatus>
  sync(payload: CloudSyncPayload): Promise<boolean>
  pull(): Promise<CloudSyncPayload | null>
  push(data: CloudSyncPayload): Promise<boolean>
  resolveConflict(local: CloudSyncPayload, remote: CloudSyncPayload): Promise<'local' | 'remote' | 'merge'>
}

export interface CloudSyncProvider {
  id: string
  name: string
  icon?: string
  createAdapter(config: CloudSyncConfig): CloudSyncAdapter
}

export const CLOUD_SYNC_STORAGE_KEY = 'cloud_sync_config'

export function getCloudSyncConfig(): CloudSyncConfig {
  try {
    const stored = localStorage.getItem(CLOUD_SYNC_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
  }
  return {
    enabled: false,
    autoSync: true,
    syncInterval: 5 * 60 * 1000
  }
}

export function setCloudSyncConfig(config: CloudSyncConfig): void {
  localStorage.setItem(CLOUD_SYNC_STORAGE_KEY, JSON.stringify(config))
}

export function createMockCloudSyncAdapter(): CloudSyncAdapter {
  let connected = false
  let syncing = false
  let lastSync: string | undefined
  let pending = 0

  return {
    async connect(): Promise<boolean> {
      await new Promise(r => setTimeout(r, 500))
      connected = true
      return true
    },

    async disconnect(): Promise<void> {
      connected = false
    },

    async getStatus(): Promise<CloudSyncStatus> {
      return {
        isConnected: connected,
        isSyncing: syncing,
        lastSyncTime: lastSync,
        pendingChanges: pending
      }
    },

    async sync(payload: CloudSyncPayload): Promise<boolean> {
      if (!connected) return false
      syncing = true
      await new Promise(r => setTimeout(r, 1000))
      lastSync = new Date().toISOString()
      pending = 0
      syncing = false
      return true
    },

    async pull(): Promise<CloudSyncPayload | null> {
      if (!connected) return null
      await new Promise(r => setTimeout(r, 500))
      return null
    },

    async push(data: CloudSyncPayload): Promise<boolean> {
      if (!connected) return false
      pending++
      await new Promise(r => setTimeout(r, 500))
      pending--
      lastSync = new Date().toISOString()
      return true
    },

    async resolveConflict(local: CloudSyncPayload, remote: CloudSyncPayload): Promise<'local' | 'remote' | 'merge'> {
      if (local.version >= remote.version) {
        return 'local'
      }
      return 'remote'
    }
  }
}

export const mockCloudSyncProvider: CloudSyncProvider = {
  id: 'mock',
  name: '本地模拟',
  createAdapter: createMockCloudSyncAdapter
}
