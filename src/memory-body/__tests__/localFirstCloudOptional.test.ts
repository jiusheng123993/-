import { describe, it, expect } from 'vitest'
import {
  determineSyncStrategy,
  resolveSyncConflict,
  checkExportable,
  checkDeletable,
  checkMigratable,
  applyLocalFirstCloudOptional,
  summarizeSyncPolicy,
} from '../sync/localFirstCloudOptional'
import type { MemoryAtom } from '../types'

function makeAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: 'atom-1',
    content: '用户偏好 TypeScript',
    kind: 'preference',
    scope: 'project',
    scenario: 'coding',
    lifecycle: 'active',
    status: 'active',
    confidence: 0.7,
    sensitivity: 'public',
    source: 'chat',
    evidence: [],
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    quality: 0.6,
    ...overrides,
  }
}

describe('determineSyncStrategy', () => {
  it('returns never_sync for forbidden atoms', () => {
    const atom = makeAtom({ sensitivity: 'forbidden' })
    expect(determineSyncStrategy(atom, true)).toBe('never_sync')
  })

  it('returns local_only when user has not enabled sync', () => {
    const atom = makeAtom({ sensitivity: 'public' })
    expect(determineSyncStrategy(atom, false)).toBe('local_only')
  })

  it('returns encrypted_sync for private atoms', () => {
    const atom = makeAtom({ sensitivity: 'private' })
    expect(determineSyncStrategy(atom, true)).toBe('encrypted_sync')
  })

  it('returns encrypted_sync for sensitive atoms', () => {
    const atom = makeAtom({ sensitivity: 'sensitive' })
    expect(determineSyncStrategy(atom, true)).toBe('encrypted_sync')
  })

  it('returns full_sync for public atoms with sync enabled', () => {
    const atom = makeAtom({ sensitivity: 'public' })
    expect(determineSyncStrategy(atom, true)).toBe('full_sync')
  })

  it('returns full_sync for internal atoms with sync enabled', () => {
    const atom = makeAtom({ sensitivity: 'internal' })
    expect(determineSyncStrategy(atom, true)).toBe('full_sync')
  })
})

describe('resolveSyncConflict', () => {
  const remoteVersion = {
    content: '用户偏好 JavaScript',
    confidence: 0.5,
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }

  it('returns null when no remote version', () => {
    const atom = makeAtom()
    expect(resolveSyncConflict(atom, undefined, 'local_wins')).toBeNull()
  })

  it('returns null when no conflict', () => {
    const atom = makeAtom()
    const same = {
      content: atom.content,
      confidence: atom.confidence,
      updatedAt: atom.updatedAt,
    }
    expect(resolveSyncConflict(atom, same, 'local_wins')).toBeNull()
  })

  it('resolves with local_wins strategy', () => {
    const atom = makeAtom()
    const conflict = resolveSyncConflict(atom, remoteVersion, 'local_wins')
    expect(conflict).not.toBeNull()
    expect(conflict!.resolution).toBe('local_wins')
    expect(conflict!.resolved).toBe(true)
  })

  it('resolves with remote_wins strategy', () => {
    const atom = makeAtom()
    const conflict = resolveSyncConflict(atom, remoteVersion, 'remote_wins')
    expect(conflict).not.toBeNull()
    expect(conflict!.resolution).toBe('remote_wins')
    expect(conflict!.resolved).toBe(true)
  })

  it('marks user_decides as unresolved', () => {
    const atom = makeAtom()
    const conflict = resolveSyncConflict(atom, remoteVersion, 'user_decides')
    expect(conflict).not.toBeNull()
    expect(conflict!.resolution).toBe('user_decides')
    expect(conflict!.resolved).toBe(false)
  })

  it('merge_latest picks newer version', () => {
    const atom = makeAtom({ updatedAt: new Date().toISOString() })
    const conflict = resolveSyncConflict(atom, remoteVersion, 'merge_latest')
    expect(conflict).not.toBeNull()
    expect(conflict!.resolution).toBe('local_wins')
  })

  it('merge_highest_confidence picks higher confidence', () => {
    const atom = makeAtom({ confidence: 0.9 })
    const conflict = resolveSyncConflict(atom, remoteVersion, 'merge_highest_confidence')
    expect(conflict).not.toBeNull()
    expect(conflict!.resolution).toBe('local_wins')
  })
})

describe('checkExportable', () => {
  it('forbidden atoms are not exportable', () => {
    const atom = makeAtom({ sensitivity: 'forbidden' })
    expect(checkExportable(atom)).toBe(false)
  })

  it('other atoms are exportable', () => {
    expect(checkExportable(makeAtom({ sensitivity: 'public' }))).toBe(true)
    expect(checkExportable(makeAtom({ sensitivity: 'private' }))).toBe(true)
    expect(checkExportable(makeAtom({ sensitivity: 'sensitive' }))).toBe(true)
  })
})

describe('checkDeletable', () => {
  it('protected atoms are not deletable', () => {
    const atom = makeAtom({ lifecycle: 'protected' })
    expect(checkDeletable(atom)).toBe(false)
  })

  it('other atoms are deletable', () => {
    expect(checkDeletable(makeAtom({ lifecycle: 'active' }))).toBe(true)
    expect(checkDeletable(makeAtom({ lifecycle: 'archived' }))).toBe(true)
  })
})

describe('checkMigratable', () => {
  it('forbidden atoms are not migratable', () => {
    const atom = makeAtom({ sensitivity: 'forbidden' })
    expect(checkMigratable(atom)).toBe(false)
  })

  it('private atoms are not migratable', () => {
    const atom = makeAtom({ sensitivity: 'private' })
    expect(checkMigratable(atom)).toBe(false)
  })

  it('public atoms are migratable', () => {
    const atom = makeAtom({ sensitivity: 'public' })
    expect(checkMigratable(atom)).toBe(true)
  })
})

describe('applyLocalFirstCloudOptional', () => {
  it('keeps local only when sync not enabled', () => {
    const atom = makeAtom()
    const result = applyLocalFirstCloudOptional({
      atom,
      userSyncEnabled: false,
      isMultiDevice: false,
      hasRemoteVersion: false,
    })
    expect(result.shouldSync).toBe(false)
    expect(result.syncStrategy).toBe('local_only')
  })

  it('never syncs forbidden atoms', () => {
    const atom = makeAtom({ sensitivity: 'forbidden' })
    const result = applyLocalFirstCloudOptional({
      atom,
      userSyncEnabled: true,
      isMultiDevice: false,
      hasRemoteVersion: false,
    })
    expect(result.shouldSync).toBe(false)
    expect(result.syncStrategy).toBe('never_sync')
  })

  it('syncs public atoms when enabled', () => {
    const atom = makeAtom({ sensitivity: 'public' })
    const result = applyLocalFirstCloudOptional({
      atom,
      userSyncEnabled: true,
      isMultiDevice: false,
      hasRemoteVersion: false,
    })
    expect(result.shouldSync).toBe(true)
    expect(result.syncStrategy).toBe('full_sync')
  })

  it('encrypts private atoms during sync', () => {
    const atom = makeAtom({ sensitivity: 'private' })
    const result = applyLocalFirstCloudOptional({
      atom,
      userSyncEnabled: true,
      isMultiDevice: false,
      hasRemoteVersion: false,
    })
    expect(result.shouldSync).toBe(true)
    expect(result.syncStrategy).toBe('encrypted_sync')
  })

  it('detects sync conflicts', () => {
    const atom = makeAtom({ content: '本地版本', confidence: 0.8 })
    const result = applyLocalFirstCloudOptional({
      atom,
      userSyncEnabled: true,
      isMultiDevice: true,
      hasRemoteVersion: true,
      remoteVersion: {
        content: '远程版本',
        confidence: 0.5,
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    })
    expect(result.conflicts.length).toBeGreaterThan(0)
  })

  it('marks forbidden as not exportable', () => {
    const atom = makeAtom({ sensitivity: 'forbidden' })
    const result = applyLocalFirstCloudOptional({
      atom,
      userSyncEnabled: false,
      isMultiDevice: false,
      hasRemoteVersion: false,
    })
    expect(result.exportable).toBe(false)
  })

  it('marks protected as not deletable', () => {
    const atom = makeAtom({ lifecycle: 'protected' })
    const result = applyLocalFirstCloudOptional({
      atom,
      userSyncEnabled: false,
      isMultiDevice: false,
      hasRemoteVersion: false,
    })
    expect(result.deletable).toBe(false)
  })
})

describe('summarizeSyncPolicy', () => {
  it('returns explanation string', () => {
    const atom = makeAtom()
    const result = applyLocalFirstCloudOptional({
      atom,
      userSyncEnabled: true,
      isMultiDevice: false,
      hasRemoteVersion: false,
    })
    const summary = summarizeSyncPolicy(result)
    expect(summary).toContain('full_sync')
  })
})

// ─── CloudSyncAdapter 桥接函数测试 ───────────────────────────────

import { toCloudSyncConfig, fromCloudSyncConflict, applyCloudSyncPolicy } from '../sync/localFirstCloudOptional'
import type { SyncConflict as CloudSyncConflict } from '../adapter/cloudSyncAdapter'

describe('toCloudSyncConfig', () => {
  it('正常转换 SyncPolicy 为 SyncConfig', () => {
    const config = toCloudSyncConfig({
      strategy: 'full_sync',
      userEnabled: true,
      encryptSensitive: true,
      excludeForbidden: true,
      excludePrivate: false,
    })
    expect(config.enabled).toBe(true)
    expect(config.direction).toBe('bidirectional')
    expect(config.conflictStrategy).toBe('manual')
    expect(config.autoSyncIntervalMs).toBe(5 * 60 * 1000)
    expect(config.maxBatchSize).toBe(50)
    expect(config.retryMaxAttempts).toBe(3)
    expect(config.retryBackoffMs).toBe(1000)
  })

  it('encryptSensitive 映射正确', () => {
    const configTrue = toCloudSyncConfig({
      strategy: 'encrypted_sync',
      userEnabled: true,
      encryptSensitive: true,
      excludeForbidden: true,
      excludePrivate: false,
    })
    expect(configTrue.encryptSensitive).toBe(true)

    const configFalse = toCloudSyncConfig({
      strategy: 'full_sync',
      userEnabled: true,
      encryptSensitive: false,
      excludeForbidden: true,
      excludePrivate: false,
    })
    expect(configFalse.encryptSensitive).toBe(false)
  })

  it('excludeForbidden 映射正确', () => {
    const configTrue = toCloudSyncConfig({
      strategy: 'full_sync',
      userEnabled: true,
      encryptSensitive: false,
      excludeForbidden: true,
      excludePrivate: false,
    })
    expect(configTrue.excludeForbidden).toBe(true)

    const configFalse = toCloudSyncConfig({
      strategy: 'full_sync',
      userEnabled: true,
      encryptSensitive: false,
      excludeForbidden: false,
      excludePrivate: false,
    })
    expect(configFalse.excludeForbidden).toBe(false)
  })
})

describe('fromCloudSyncConflict', () => {
  const cloudConflict: CloudSyncConflict = {
    atomId: 'atom-1',
    localVersion: {
      content: '本地内容',
      confidence: 0.8,
      updatedAt: '2026-01-01T00:00:00.000Z',
      lifecycle: 'active',
    },
    remoteVersion: {
      content: '远程内容',
      confidence: 0.6,
      updatedAt: '2026-01-02T00:00:00.000Z',
      lifecycle: 'confirmed',
    },
    strategy: 'local_wins',
    resolved: true,
    explanation: '本地版本优先',
  }

  it('正常转换 strategy→resolution 映射', () => {
    const result = fromCloudSyncConflict(cloudConflict)
    expect(result.atomId).toBe('atom-1')
    expect(result.resolution).toBe('local_wins')
    expect(result.localVersion.content).toBe('本地内容')
    expect(result.remoteVersion.content).toBe('远程内容')
  })

  it('resolved 状态传递', () => {
    const resolved = fromCloudSyncConflict(cloudConflict)
    expect(resolved.resolved).toBe(true)

    const unresolved = fromCloudSyncConflict({ ...cloudConflict, strategy: 'manual', resolved: false })
    expect(unresolved.resolved).toBe(false)
  })

  it('explanation 传递', () => {
    const result = fromCloudSyncConflict(cloudConflict)
    expect(result.explanation).toBe('本地版本优先')
  })

  it('last_write_wins 映射为 merge_latest', () => {
    const result = fromCloudSyncConflict({ ...cloudConflict, strategy: 'last_write_wins' })
    expect(result.resolution).toBe('merge_latest')
  })

  it('merge 映射为 merge_highest_confidence', () => {
    const result = fromCloudSyncConflict({ ...cloudConflict, strategy: 'merge' })
    expect(result.resolution).toBe('merge_highest_confidence')
  })

  it('manual 映射为 user_decides', () => {
    const result = fromCloudSyncConflict({ ...cloudConflict, strategy: 'manual' })
    expect(result.resolution).toBe('user_decides')
  })
})

describe('applyCloudSyncPolicy', () => {
  it('正常同步 public atom', () => {
    const atom = makeAtom({ sensitivity: 'public' })
    const result = applyCloudSyncPolicy({
      atom,
      userSyncEnabled: true,
      isMultiDevice: false,
      hasRemoteVersion: false,
    })
    expect(result.shouldSync).toBe(true)
    expect(result.syncStrategy).toBe('full_sync')
  })

  it('forbidden 不同步', () => {
    const atom = makeAtom({ sensitivity: 'forbidden' })
    const result = applyCloudSyncPolicy({
      atom,
      userSyncEnabled: true,
      isMultiDevice: false,
      hasRemoteVersion: false,
    })
    expect(result.shouldSync).toBe(false)
    expect(result.syncStrategy).toBe('never_sync')
  })

  it('draft 不同步', () => {
    const atom = makeAtom({ sensitivity: 'public', lifecycle: 'draft' as MemoryAtom['lifecycle'] })
    const result = applyCloudSyncPolicy({
      atom,
      userSyncEnabled: true,
      isMultiDevice: false,
      hasRemoteVersion: false,
    })
    expect(result.shouldSync).toBe(false)
  })

  it('有冲突场景', () => {
    const atom = makeAtom({ content: '本地版本', confidence: 0.8 })
    const result = applyCloudSyncPolicy({
      atom,
      userSyncEnabled: true,
      isMultiDevice: true,
      hasRemoteVersion: true,
      remoteVersion: {
        content: '远程版本',
        confidence: 0.5,
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    })
    expect(result.conflicts.length).toBeGreaterThan(0)
  })
})
