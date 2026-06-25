import type { MemoryAtom } from '../types'
import type { SyncConfig, SyncConflict as CloudSyncConflict } from '../adapter/cloudSyncAdapter'
import { shouldSyncAtom, detectSyncConflict } from '../adapter/cloudSyncAdapter'

export type SyncStrategy = 'local_only' | 'encrypted_sync' | 'full_sync' | 'never_sync'

export type ConflictResolutionStrategy =
  | 'local_wins'
  | 'remote_wins'
  | 'user_decides'
  | 'merge_latest'
  | 'merge_highest_confidence'

export interface SyncPolicy {
  strategy: SyncStrategy
  userEnabled: boolean
  encryptSensitive: boolean
  excludeForbidden: boolean
  excludePrivate: boolean
}

export interface SyncConflict {
  atomId: string
  localVersion: Pick<MemoryAtom, 'content' | 'confidence' | 'updatedAt'>
  remoteVersion: Pick<MemoryAtom, 'content' | 'confidence' | 'updatedAt'>
  resolution: ConflictResolutionStrategy
  resolved: boolean
  explanation: string
}

export interface LocalFirstCloudOptionalInput {
  atom: MemoryAtom
  userSyncEnabled: boolean
  isMultiDevice: boolean
  hasRemoteVersion: boolean
  remoteVersion?: Pick<MemoryAtom, 'content' | 'confidence' | 'updatedAt'>
}

export interface LocalFirstCloudOptionalResult {
  shouldSync: boolean
  syncStrategy: SyncStrategy
  conflicts: SyncConflict[]
  exportable: boolean
  deletable: boolean
  migratable: boolean
  explanation: string
}

export function determineSyncStrategy(
  atom: MemoryAtom,
  userSyncEnabled: boolean
): SyncStrategy {
  if (atom.sensitivity === 'forbidden') return 'never_sync'
  if (!userSyncEnabled) return 'local_only'
  if (atom.sensitivity === 'private' || atom.sensitivity === 'sensitive') return 'encrypted_sync'
  return 'full_sync'
}

export function resolveSyncConflict(
  atom: MemoryAtom,
  remoteVersion: Pick<MemoryAtom, 'content' | 'confidence' | 'updatedAt'> | undefined,
  strategy: ConflictResolutionStrategy
): SyncConflict | null {
  if (!remoteVersion) return null

  const hasContentConflict = atom.content !== remoteVersion.content
  const hasConfidenceConflict = Math.abs(atom.confidence - remoteVersion.confidence) > 0.1
  const hasConflict = hasContentConflict || hasConfidenceConflict

  if (!hasConflict) return null

  let resolution: ConflictResolutionStrategy = strategy
  let explanation = ''

  switch (strategy) {
    case 'local_wins':
      explanation = '本地版本优先，保留本地修改'
      break
    case 'remote_wins':
      explanation = '远程版本优先，采用云端数据'
      break
    case 'user_decides':
      explanation = '需要用户手动选择版本'
      break
    case 'merge_latest':
      resolution = new Date(atom.updatedAt) >= new Date(remoteVersion.updatedAt)
        ? 'local_wins'
        : 'remote_wins'
      explanation = `自动选择最新版本: ${resolution === 'local_wins' ? '本地' : '远程'}`
      break
    case 'merge_highest_confidence':
      resolution = atom.confidence >= remoteVersion.confidence
        ? 'local_wins'
        : 'remote_wins'
      explanation = `自动选择高置信度版本: ${resolution === 'local_wins' ? '本地' : '远程'}`
      break
  }

  return {
    atomId: atom.id,
    localVersion: {
      content: atom.content,
      confidence: atom.confidence,
      updatedAt: atom.updatedAt,
    },
    remoteVersion: {
      content: remoteVersion.content,
      confidence: remoteVersion.confidence,
      updatedAt: remoteVersion.updatedAt,
    },
    resolution,
    resolved: resolution !== 'user_decides',
    explanation,
  }
}

export function checkExportable(atom: MemoryAtom): boolean {
  if (atom.sensitivity === 'forbidden') return false
  return true
}

export function checkDeletable(atom: MemoryAtom): boolean {
  return atom.lifecycle !== 'protected'
}

export function checkMigratable(atom: MemoryAtom): boolean {
  if (atom.sensitivity === 'forbidden') return false
  if (atom.sensitivity === 'private') return false
  return true
}

export function applyLocalFirstCloudOptional(
  input: LocalFirstCloudOptionalInput
): LocalFirstCloudOptionalResult {
  const syncStrategy = determineSyncStrategy(input.atom, input.userSyncEnabled)

  const shouldSync = syncStrategy !== 'local_only' && syncStrategy !== 'never_sync'

  const conflicts: SyncConflict[] = []
  if (input.hasRemoteVersion && input.remoteVersion) {
    const conflict = resolveSyncConflict(
      input.atom,
      input.remoteVersion,
      'merge_highest_confidence'
    )
    if (conflict) conflicts.push(conflict)
  }

  const exportable = checkExportable(input.atom)
  const deletable = checkDeletable(input.atom)
  const migratable = checkMigratable(input.atom)

  const explanationParts: string[] = []
  explanationParts.push(`同步策略: ${syncStrategy}`)
  if (!shouldSync) {
    explanationParts.push(
      syncStrategy === 'never_sync'
        ? 'forbidden 记忆永不跨设备传播'
        : '云同步未开启，仅本地存储'
    )
  }
  if (conflicts.length > 0) {
    explanationParts.push(`发现 ${conflicts.length} 个冲突`)
    for (const c of conflicts) {
      explanationParts.push(`  - ${c.atomId}: ${c.explanation}`)
    }
  }
  explanationParts.push(`可导出: ${exportable}`)
  explanationParts.push(`可删除: ${deletable}`)
  explanationParts.push(`可迁移: ${migratable}`)

  return {
    shouldSync,
    syncStrategy,
    conflicts,
    exportable,
    deletable,
    migratable,
    explanation: explanationParts.join('\n'),
  }
}

export function summarizeSyncPolicy(result: LocalFirstCloudOptionalResult): string {
  return result.explanation
}

// ─── CloudSyncAdapter 桥接函数 ───────────────────────────────

/**
 * 将本地 SyncPolicy 转换为 CloudSyncAdapter 的 SyncConfig
 */
export function toCloudSyncConfig(policy: SyncPolicy): SyncConfig {
  return {
    enabled: policy.userEnabled,
    direction: 'bidirectional',
    conflictStrategy: 'manual',
    autoSyncIntervalMs: 5 * 60 * 1000,
    maxBatchSize: 50,
    retryMaxAttempts: 3,
    retryBackoffMs: 1000,
    encryptSensitive: policy.encryptSensitive,
    excludeForbidden: policy.excludeForbidden,
    excludePrivate: policy.excludePrivate,
  }
}

/**
 * 将 CloudSyncAdapter 的 SyncConflict 转换为本地 SyncConflict
 *
 * 字段映射：
 * - CloudSyncAdapter 的 localVersion/remoteVersion 包含 lifecycle，本地版本不需要
 * - CloudSyncAdapter 的 strategy 映射到本地的 resolution
 * - CloudSyncAdapter 的 resolvedVersion 丢弃（本地版本不需要）
 */
export function fromCloudSyncConflict(conflict: CloudSyncConflict): SyncConflict {
  const strategyMap: Record<string, ConflictResolutionStrategy> = {
    local_wins: 'local_wins',
    remote_wins: 'remote_wins',
    last_write_wins: 'merge_latest',
    merge: 'merge_highest_confidence',
    manual: 'user_decides',
  }

  return {
    atomId: conflict.atomId,
    localVersion: {
      content: conflict.localVersion.content,
      confidence: conflict.localVersion.confidence,
      updatedAt: conflict.localVersion.updatedAt,
    },
    remoteVersion: {
      content: conflict.remoteVersion.content,
      confidence: conflict.remoteVersion.confidence,
      updatedAt: conflict.remoteVersion.updatedAt,
    },
    resolution: strategyMap[conflict.strategy] ?? 'user_decides',
    resolved: conflict.resolved,
    explanation: conflict.explanation,
  }
}

/**
 * 使用 CloudSyncAdapter 的 shouldSyncAtom 和 detectSyncConflict
 * 来增强 applyLocalFirstCloudOptional 的逻辑
 */
export function applyCloudSyncPolicy(
  input: LocalFirstCloudOptionalInput
): LocalFirstCloudOptionalResult {
  const syncStrategy = determineSyncStrategy(input.atom, input.userSyncEnabled)

  const config: SyncConfig = {
    enabled: input.userSyncEnabled,
    direction: 'bidirectional',
    conflictStrategy: 'manual',
    autoSyncIntervalMs: 5 * 60 * 1000,
    maxBatchSize: 50,
    retryMaxAttempts: 3,
    retryBackoffMs: 1000,
    encryptSensitive: syncStrategy === 'encrypted_sync',
    excludeForbidden: true,
    excludePrivate: syncStrategy === 'local_only',
  }

  const { syncable, reason } = shouldSyncAtom(input.atom, config)
  const shouldSync = syncable && syncStrategy !== 'local_only' && syncStrategy !== 'never_sync'

  const conflicts: SyncConflict[] = []
  if (input.hasRemoteVersion && input.remoteVersion) {
    const cloudConflict = detectSyncConflict(input.atom, {
      content: input.remoteVersion.content,
      confidence: input.remoteVersion.confidence,
      updatedAt: input.remoteVersion.updatedAt,
      lifecycle: input.atom.lifecycle,
    })
    if (cloudConflict) {
      conflicts.push(fromCloudSyncConflict(cloudConflict))
    }
  }

  const exportable = checkExportable(input.atom)
  const deletable = checkDeletable(input.atom)
  const migratable = checkMigratable(input.atom)

  const explanationParts: string[] = []
  explanationParts.push(`同步策略: ${syncStrategy}`)
  explanationParts.push(`CloudSyncAdapter 判断: ${reason}`)
  if (!shouldSync) {
    explanationParts.push(
      syncStrategy === 'never_sync'
        ? 'forbidden 记忆永不跨设备传播'
        : '云同步未开启，仅本地存储'
    )
  }
  if (conflicts.length > 0) {
    explanationParts.push(`发现 ${conflicts.length} 个冲突`)
    for (const c of conflicts) {
      explanationParts.push(`  - ${c.atomId}: ${c.explanation}`)
    }
  }
  explanationParts.push(`可导出: ${exportable}`)
  explanationParts.push(`可删除: ${deletable}`)
  explanationParts.push(`可迁移: ${migratable}`)

  return {
    shouldSync,
    syncStrategy,
    conflicts,
    exportable,
    deletable,
    migratable,
    explanation: explanationParts.join('\n'),
  }
}
