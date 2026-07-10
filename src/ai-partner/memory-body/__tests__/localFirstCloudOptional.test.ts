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
import type { MemoryAtom } from '../core/memoryBodyTypes'

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


