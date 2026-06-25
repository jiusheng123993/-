import { describe, it, expect } from 'vitest'
import {
  createSyncConfig,
  shouldSyncAtom,
  buildSyncPayload,
  createSyncBatch,
  detectSyncConflict,
  resolveSyncConflict,
  detectBatchConflicts,
  createSyncResult,
  createCloudSyncState,
  updateSyncState,
  summarizeSyncState,
} from '../adapter/cloudSyncAdapter'
import type { MemoryAtom, MemoryScope } from '../types'

const scope: MemoryScope = { userId: 'user-1', projectId: 'project-1' }
const now = '2026-06-25T00:00:00.000Z'

function makeAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: 'atom-1',
    scope,
    layer: 'semantic',
    type: 'preference',
    subject: 'user',
    predicate: 'likes',
    object: 'TypeScript',
    content: '用户喜欢 TypeScript',
    source: 'chat',
    confidence: 0.8,
    strength: 0.7,
    emotionalWeight: 0.2,
    sensitivity: 'personal',
    lifecycle: 'active',
    evidence: [],
    tags: ['coding'],
    scenarios: ['chat'],
    createdAt: now,
    updatedAt: now,
    lastAccessedAt: now,
    accessCount: 0,
    contradictionOf: [],
    ...overrides,
  }
}

// ─── createSyncConfig ───────────────────────────────────────

describe('createSyncConfig', () => {
  it('returns default config when no overrides', () => {
    const config = createSyncConfig()
    expect(config.enabled).toBe(false)
    expect(config.direction).toBe('bidirectional')
    expect(config.conflictStrategy).toBe('manual')
    expect(config.maxBatchSize).toBe(50)
    expect(config.retryMaxAttempts).toBe(3)
  })

  it('merges overrides with defaults', () => {
    const config = createSyncConfig({ enabled: true, maxBatchSize: 100 })
    expect(config.enabled).toBe(true)
    expect(config.maxBatchSize).toBe(100)
    expect(config.direction).toBe('bidirectional') // default preserved
  })

  it('handles empty overrides', () => {
    const config = createSyncConfig({})
    expect(config).toEqual(createSyncConfig())
  })
})

// ─── shouldSyncAtom ─────────────────────────────────────────

describe('shouldSyncAtom', () => {
  it('returns syncable for normal active atom with sync enabled', () => {
    const config = createSyncConfig({ enabled: true })
    const result = shouldSyncAtom(makeAtom(), config)
    expect(result.syncable).toBe(true)
    expect(result.reason).toBe('可同步')
  })

  it('returns not syncable when sync is disabled', () => {
    const config = createSyncConfig({ enabled: false })
    const result = shouldSyncAtom(makeAtom(), config)
    expect(result.syncable).toBe(false)
    expect(result.reason).toContain('未启用')
  })

  it('excludes forbidden atoms when excludeForbidden is true', () => {
    const config = createSyncConfig({ enabled: true, excludeForbidden: true })
    const result = shouldSyncAtom(makeAtom({ sensitivity: 'forbidden' }), config)
    expect(result.syncable).toBe(false)
    expect(result.reason).toContain('forbidden')
  })

  it('excludes private atoms when excludePrivate is true', () => {
    const config = createSyncConfig({ enabled: true, excludePrivate: true })
    const result = shouldSyncAtom(makeAtom({ sensitivity: 'private' }), config)
    expect(result.syncable).toBe(false)
    expect(result.reason).toContain('private')
  })

  it('excludes draft atoms', () => {
    const config = createSyncConfig({ enabled: true })
    const result = shouldSyncAtom(makeAtom({ lifecycle: 'draft' }), config)
    expect(result.syncable).toBe(false)
    expect(result.reason).toContain('草稿')
  })

  it('allows private atoms when excludePrivate is false', () => {
    const config = createSyncConfig({ enabled: true, excludePrivate: false })
    const result = shouldSyncAtom(makeAtom({ sensitivity: 'private' }), config)
    expect(result.syncable).toBe(true)
  })
})

// ─── buildSyncPayload ───────────────────────────────────────

describe('buildSyncPayload', () => {
  it('builds payload with operation and client info', () => {
    const atom = makeAtom()
    const payload = buildSyncPayload(atom, 'create', 'client-1')

    expect(payload.atom).toBe(atom)
    expect(payload.operation).toBe('create')
    expect(payload.clientId).toBe('client-1')
    expect(payload.clientTimestamp).toBeTruthy()
    expect(payload.checksum).toBeTruthy()
    expect(typeof payload.checksum).toBe('string')
  })

  it('generates different checksums for different atoms', () => {
    const atom1 = makeAtom({ id: 'a1', content: 'content A' })
    const atom2 = makeAtom({ id: 'a2', content: 'content B' })
    const p1 = buildSyncPayload(atom1, 'create', 'client-1')
    const p2 = buildSyncPayload(atom2, 'create', 'client-1')

    expect(p1.checksum).not.toBe(p2.checksum)
  })

  it('generates same checksum for same atom content', () => {
    const atom = makeAtom()
    const p1 = buildSyncPayload(atom, 'create', 'client-1')
    const p2 = buildSyncPayload(atom, 'create', 'client-1')

    expect(p1.checksum).toBe(p2.checksum)
  })

  it('supports update and delete operations', () => {
    const atom = makeAtom()
    const updatePayload = buildSyncPayload(atom, 'update', 'client-1')
    expect(updatePayload.operation).toBe('update')

    const deletePayload = buildSyncPayload(atom, 'delete', 'client-1')
    expect(deletePayload.operation).toBe('delete')
  })
})

// ─── detectSyncConflict ─────────────────────────────────────

describe('detectSyncConflict', () => {
  it('returns null when content and lifecycle match', () => {
    const atom = makeAtom({ content: 'same', lifecycle: 'active', updatedAt: now })
    const remote = { content: 'same', lifecycle: 'active', confidence: 0.8, updatedAt: now }

    const conflict = detectSyncConflict(atom, remote)
    expect(conflict).toBeNull()
  })

  it('detects conflict when content differs', () => {
    const atom = makeAtom({ content: 'local content', lifecycle: 'active', updatedAt: now })
    const remote = { content: 'remote content', lifecycle: 'active', confidence: 0.8, updatedAt: now }

    const conflict = detectSyncConflict(atom, remote)
    expect(conflict).not.toBeNull()
    expect(conflict!.atomId).toBe(atom.id)
  })

  it('prefers local when local is confirmed and remote is not', () => {
    const atom = makeAtom({ content: 'local', lifecycle: 'confirmed', confidence: 0.5, updatedAt: now })
    const remote = { content: 'remote', lifecycle: 'active', confidence: 0.9, updatedAt: now }

    const conflict = detectSyncConflict(atom, remote)
    expect(conflict).not.toBeNull()
    expect(conflict!.strategy).toBe('local_wins')
    expect(conflict!.explanation).toContain('已确认')
  })

  it('prefers remote when remote is confirmed and local is not', () => {
    const atom = makeAtom({ content: 'local', lifecycle: 'active', confidence: 0.9, updatedAt: now })
    const remote = { content: 'remote', lifecycle: 'confirmed', confidence: 0.5, updatedAt: now }

    const conflict = detectSyncConflict(atom, remote)
    expect(conflict).not.toBeNull()
    expect(conflict!.strategy).toBe('remote_wins')
  })

  it('prefers local when confidence is significantly higher', () => {
    const atom = makeAtom({ content: 'local', lifecycle: 'active', confidence: 0.9, updatedAt: now })
    const remote = { content: 'remote', lifecycle: 'active', confidence: 0.5, updatedAt: now }

    const conflict = detectSyncConflict(atom, remote)
    expect(conflict).not.toBeNull()
    expect(conflict!.strategy).toBe('local_wins')
    expect(conflict!.explanation).toContain('置信度')
  })

  it('prefers remote when remote confidence is significantly higher', () => {
    const atom = makeAtom({ content: 'local', lifecycle: 'active', confidence: 0.5, updatedAt: now })
    const remote = { content: 'remote', lifecycle: 'active', confidence: 0.9, updatedAt: now }

    const conflict = detectSyncConflict(atom, remote)
    expect(conflict).not.toBeNull()
    expect(conflict!.strategy).toBe('remote_wins')
  })

  it('uses last_write_wins when local is newer', () => {
    const olderTime = '2026-06-24T00:00:00.000Z'
    const atom = makeAtom({ content: 'local', lifecycle: 'active', confidence: 0.7, updatedAt: now })
    const remote = { content: 'remote', lifecycle: 'active', confidence: 0.7, updatedAt: olderTime }

    const conflict = detectSyncConflict(atom, remote)
    expect(conflict).not.toBeNull()
    expect(conflict!.strategy).toBe('last_write_wins')
  })

  it('falls back to manual when cannot auto-resolve', () => {
    const atom = makeAtom({ content: 'local', lifecycle: 'active', confidence: 0.7, updatedAt: now })
    const remote = { content: 'remote', lifecycle: 'active', confidence: 0.7, updatedAt: now }

    const conflict = detectSyncConflict(atom, remote)
    expect(conflict).not.toBeNull()
    expect(conflict!.strategy).toBe('manual')
    expect(conflict!.resolved).toBe(false)
    expect(conflict!.resolvedVersion).toBeUndefined()
  })

  it('sets resolvedVersion for auto-resolved conflicts', () => {
    const atom = makeAtom({ content: 'local', lifecycle: 'confirmed', confidence: 0.5, updatedAt: now })
    const remote = { content: 'remote', lifecycle: 'active', confidence: 0.9, updatedAt: now }

    const conflict = detectSyncConflict(atom, remote)
    expect(conflict).not.toBeNull()
    expect(conflict!.resolved).toBe(true)
    expect(conflict!.resolvedVersion).toBeDefined()
    expect(conflict!.resolvedVersion!.content).toBe('local')
  })
})

// ─── resolveSyncConflict ────────────────────────────────────

describe('resolveSyncConflict', () => {
  it('resolves with local version', () => {
    const atom = makeAtom({ content: 'local', lifecycle: 'active', confidence: 0.7, updatedAt: now })
    const remote = { content: 'remote', lifecycle: 'active', confidence: 0.7, updatedAt: now }
    const conflict = detectSyncConflict(atom, remote)!

    const resolved = resolveSyncConflict(conflict, 'local')
    expect(resolved.resolved).toBe(true)
    expect(resolved.resolvedVersion!.content).toBe('local')
    expect(resolved.strategy).toBe('local_wins')
    expect(resolved.explanation).toContain('本地')
  })

  it('resolves with remote version', () => {
    const atom = makeAtom({ content: 'local', lifecycle: 'active', confidence: 0.7, updatedAt: now })
    const remote = { content: 'remote', lifecycle: 'active', confidence: 0.7, updatedAt: now }
    const conflict = detectSyncConflict(atom, remote)!

    const resolved = resolveSyncConflict(conflict, 'remote')
    expect(resolved.resolved).toBe(true)
    expect(resolved.resolvedVersion!.content).toBe('remote')
    expect(resolved.strategy).toBe('remote_wins')
    expect(resolved.explanation).toContain('远程')
  })
})

// ─── detectBatchConflicts ───────────────────────────────────

describe('detectBatchConflicts', () => {
  it('detects conflicts across multiple atoms', () => {
    const atom1 = makeAtom({ id: 'a1', content: 'local1', lifecycle: 'active', confidence: 0.7, updatedAt: now })
    const atom2 = makeAtom({ id: 'a2', content: 'local2', lifecycle: 'active', confidence: 0.7, updatedAt: now })
    const remoteVersions = new Map([
      ['a1', { content: 'remote1', lifecycle: 'active' as const, confidence: 0.7, updatedAt: now }],
      ['a2', { content: 'local2', lifecycle: 'active' as const, confidence: 0.7, updatedAt: now }],
    ])

    const conflicts = detectBatchConflicts([atom1, atom2], remoteVersions)
    expect(conflicts.length).toBe(1)
    expect(conflicts[0].atomId).toBe('a1')
  })

  it('returns empty array when no conflicts', () => {
    const atom = makeAtom({ id: 'a1', content: 'same', lifecycle: 'active', updatedAt: now })
    const remoteVersions = new Map([
      ['a1', { content: 'same', lifecycle: 'active' as const, confidence: 0.7, updatedAt: now }],
    ])

    const conflicts = detectBatchConflicts([atom], remoteVersions)
    expect(conflicts).toHaveLength(0)
  })

  it('skips atoms not in remote map', () => {
    const atom = makeAtom({ id: 'a1', content: 'local', lifecycle: 'active', confidence: 0.7, updatedAt: now })
    const remoteVersions = new Map<string, { updatedAt: string; content: string }>()

    const conflicts = detectBatchConflicts([atom], remoteVersions)
    expect(conflicts).toHaveLength(0)
  })
})

// ─── createSyncBatch ───────────────────────────────────────

describe('createSyncBatch', () => {
  it('creates a sync batch with generated id', () => {
    const atom = makeAtom()
    const payload = buildSyncPayload(atom, 'create', 'client-1')
    const batch = createSyncBatch(scope, [payload])

    expect(batch.id).toMatch(/^sync-batch-/)
    expect(batch.scope).toEqual(scope)
    expect(batch.payloads).toHaveLength(1)
    expect(batch.payloads[0]).toBe(payload)
    expect(batch.status).toBe('idle')
    expect(batch.createdAt).toBeTruthy()
    expect(batch.retryCount).toBe(0)
  })

  it('handles empty payloads', () => {
    const batch = createSyncBatch(scope, [])
    expect(batch.payloads).toHaveLength(0)
    expect(batch.status).toBe('idle')
  })

  it('generates unique batch ids', () => {
    const batch1 = createSyncBatch(scope, [])
    const batch2 = createSyncBatch(scope, [])
    expect(batch1.id).not.toBe(batch2.id)
  })
})

// ─── createSyncResult ───────────────────────────────────────

describe('createSyncResult', () => {
  it('creates synced result when no errors or unresolved conflicts', () => {
    const startedAt = new Date(Date.now() - 1000).toISOString()
    const result = createSyncResult('batch-1', 5, 3, [], [], startedAt)

    expect(result.batchId).toBe('batch-1')
    expect(result.status).toBe('synced')
    expect(result.uploaded).toBe(5)
    expect(result.downloaded).toBe(3)
    expect(result.conflicts).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
    expect(result.startedAt).toBe(startedAt)
    expect(result.completedAt).toBeTruthy()
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('sets status to error when errors exist', () => {
    const result = createSyncResult('batch-1', 0, 0, [], ['network error'], now)
    expect(result.status).toBe('error')
  })

  it('sets status to conflict when unresolved conflicts exist', () => {
    const atom = makeAtom({ content: 'local', lifecycle: 'active', confidence: 0.7, updatedAt: now })
    const remote = { content: 'remote', lifecycle: 'active', confidence: 0.7, updatedAt: now }
    const conflict = detectSyncConflict(atom, remote)!

    const result = createSyncResult('batch-1', 1, 1, [conflict], [], now)
    expect(result.status).toBe('conflict')
  })

  it('sets status to synced when all conflicts are resolved', () => {
    const atom = makeAtom({ content: 'local', lifecycle: 'confirmed', confidence: 0.5, updatedAt: now })
    const remote = { content: 'remote', lifecycle: 'active', confidence: 0.9, updatedAt: now }
    const conflict = detectSyncConflict(atom, remote)!

    const result = createSyncResult('batch-1', 1, 1, [conflict], [], now)
    expect(result.status).toBe('synced')
  })

  it('calculates duration correctly', () => {
    const startedAt = new Date(Date.now() - 1000).toISOString()
    const result = createSyncResult('batch-1', 0, 0, [], [], startedAt)
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })
})

// ─── createCloudSyncState ───────────────────────────────────

describe('createCloudSyncState', () => {
  it('creates default idle state', () => {
    const state = createCloudSyncState()

    expect(state.status).toBe('idle')
    expect(state.config.enabled).toBe(false)
    expect(state.pendingUploads).toBe(0)
    expect(state.pendingDownloads).toBe(0)
    expect(state.totalSynced).toBe(0)
    expect(state.totalConflicts).toBe(0)
    expect(state.isOnline).toBe(true)
  })

  it('accepts config overrides', () => {
    const state = createCloudSyncState({ enabled: true, maxBatchSize: 100 })
    expect(state.config.enabled).toBe(true)
    expect(state.config.maxBatchSize).toBe(100)
  })

  it('has no lastSyncAt initially', () => {
    const state = createCloudSyncState()
    expect(state.lastSyncAt).toBeUndefined()
  })
})

// ─── updateSyncState ────────────────────────────────────────

describe('updateSyncState', () => {
  it('updates status and counters', () => {
    const state = createCloudSyncState()
    const updated = updateSyncState(state, {
      status: 'syncing',
      pendingUploads: 10,
      pendingDownloads: 5
    })

    expect(updated.status).toBe('syncing')
    expect(updated.pendingUploads).toBe(10)
    expect(updated.pendingDownloads).toBe(5)
    // original unchanged fields preserved
    expect(updated.totalSynced).toBe(0)
    expect(updated.isOnline).toBe(true)
  })

  it('updates lastSyncAt', () => {
    const state = createCloudSyncState()
    const updated = updateSyncState(state, { lastSyncAt: now })
    expect(updated.lastSyncAt).toBe(now)
  })

  it('does not mutate original state', () => {
    const state = createCloudSyncState()
    updateSyncState(state, { status: 'syncing' })
    expect(state.status).toBe('idle')
  })
})

// ─── summarizeSyncState ─────────────────────────────────────

describe('summarizeSyncState', () => {
  it('summarizes idle state', () => {
    const state = createCloudSyncState()
    const summary = summarizeSyncState(state)

    expect(summary).toContain('空闲')
    expect(summary).toContain('未启用')
    expect(summary).toContain('尚未同步')
  })

  it('summarizes syncing state', () => {
    const state = createCloudSyncState({ enabled: true })
    const updated = updateSyncState(state, {
      status: 'syncing',
      pendingUploads: 5,
      pendingDownloads: 3,
      totalSynced: 100,
      totalConflicts: 2,
      lastSyncAt: now
    })
    const summary = summarizeSyncState(updated)

    expect(summary).toContain('同步中')
    expect(summary).toContain('已启用')
    expect(summary).toContain('待上传：5')
    expect(summary).toContain('累计同步：100')
    expect(summary).toContain('累计冲突：2')
    expect(summary).toContain(now)
  })

  it('summarizes offline state', () => {
    const state = createCloudSyncState()
    const updated = updateSyncState(state, { status: 'offline', isOnline: false })
    const summary = summarizeSyncState(updated)

    expect(summary).toContain('离线')
    expect(summary).toContain('离线')
  })

  it('summarizes error state', () => {
    const state = createCloudSyncState()
    const updated = updateSyncState(state, { status: 'error' })
    const summary = summarizeSyncState(updated)

    expect(summary).toContain('错误')
  })

  it('summarizes conflict state', () => {
    const state = createCloudSyncState()
    const updated = updateSyncState(state, { status: 'conflict' })
    const summary = summarizeSyncState(updated)

    expect(summary).toContain('有冲突')
  })

  it('summarizes paused state', () => {
    const state = createCloudSyncState()
    const updated = updateSyncState(state, { status: 'paused' })
    const summary = summarizeSyncState(updated)

    expect(summary).toContain('已暂停')
  })
})