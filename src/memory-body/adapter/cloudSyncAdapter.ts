import type { MemoryAtom, MemoryScope } from '../types'

/**
 * CloudSyncAdapter — 设计文档 Architecture - Integration
 *
 * 云端同步适配器：定义记忆数据与云端同步的接口和策略。
 *
 * 设计原则（设计文档 14.3）：
 * - CloudSyncAdapter 上线前不得影响本地优先行为
 * - 同步功能最后实现，默认本地优先
 * - 多设备同步产生冲突时需要冲突解决策略
 *
 * 与 LocalFirstCloudOptional（本地优先策略）互补：
 * - LocalFirstCloudOptional 定义"是否同步"的策略
 * - CloudSyncAdapter 定义"如何同步"的适配接口
 */

export type SyncDirection = 'upload' | 'download' | 'bidirectional'

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'synced'
  | 'conflict'
  | 'error'
  | 'offline'
  | 'paused'

export type ConflictStrategy =
  | 'local_wins'
  | 'remote_wins'
  | 'last_write_wins'
  | 'merge'
  | 'manual'

export interface SyncConfig {
  enabled: boolean
  direction: SyncDirection
  conflictStrategy: ConflictStrategy
  autoSyncIntervalMs: number
  maxBatchSize: number
  retryMaxAttempts: number
  retryBackoffMs: number
  encryptSensitive: boolean
  excludeForbidden: boolean
  excludePrivate: boolean
}

export interface SyncAtomPayload {
  atom: MemoryAtom
  operation: 'create' | 'update' | 'delete'
  clientTimestamp: string
  clientId: string
  checksum: string
}

export interface SyncBatch {
  id: string
  scope: MemoryScope
  payloads: SyncAtomPayload[]
  status: SyncStatus
  createdAt: string
  completedAt?: string
  error?: string
  retryCount: number
}

export interface SyncConflict {
  atomId: string
  localVersion: Pick<MemoryAtom, 'content' | 'confidence' | 'updatedAt' | 'lifecycle'>
  remoteVersion: Pick<MemoryAtom, 'content' | 'confidence' | 'updatedAt' | 'lifecycle'>
  strategy: ConflictStrategy
  resolved: boolean
  resolvedVersion?: Pick<MemoryAtom, 'content' | 'confidence' | 'updatedAt' | 'lifecycle'>
  explanation: string
}

export interface SyncResult {
  batchId: string
  status: SyncStatus
  uploaded: number
  downloaded: number
  conflicts: SyncConflict[]
  errors: string[]
  startedAt: string
  completedAt: string
  durationMs: number
}

export interface CloudSyncState {
  config: SyncConfig
  status: SyncStatus
  lastSyncAt?: string
  pendingUploads: number
  pendingDownloads: number
  totalSynced: number
  totalConflicts: number
  isOnline: boolean
}

// ─── 默认配置 ───────────────────────────────────────────────

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  enabled: false,
  direction: 'bidirectional',
  conflictStrategy: 'manual',
  autoSyncIntervalMs: 5 * 60 * 1000, // 5 分钟
  maxBatchSize: 50,
  retryMaxAttempts: 3,
  retryBackoffMs: 1000,
  encryptSensitive: true,
  excludeForbidden: true,
  excludePrivate: false
}

// ─── 核心函数 ───────────────────────────────────────────────

/**
 * 创建同步配置
 */
export function createSyncConfig(overrides?: Partial<SyncConfig>): SyncConfig {
  return { ...DEFAULT_SYNC_CONFIG, ...overrides }
}

/**
 * 判断原子是否应该同步
 */
export function shouldSyncAtom(
  atom: MemoryAtom,
  config: SyncConfig
): { syncable: boolean; reason: string } {
  if (!config.enabled) {
    return { syncable: false, reason: '同步功能未启用' }
  }

  if (config.excludeForbidden && atom.sensitivity === 'forbidden') {
    return { syncable: false, reason: 'forbidden 记忆不参与同步' }
  }

  if (config.excludePrivate && atom.sensitivity === 'private') {
    return { syncable: false, reason: 'private 记忆不参与同步' }
  }

  if (atom.lifecycle === 'draft') {
    return { syncable: false, reason: '草稿记忆不参与同步' }
  }

  return { syncable: true, reason: '可同步' }
}

/**
 * 构建同步负载
 */
export function buildSyncPayload(
  atom: MemoryAtom,
  operation: SyncAtomPayload['operation'],
  clientId: string
): SyncAtomPayload {
  const contentStr = JSON.stringify({
    content: atom.content,
    subject: atom.subject,
    predicate: atom.predicate,
    object: atom.object,
    confidence: atom.confidence,
    lifecycle: atom.lifecycle,
    sensitivity: atom.sensitivity
  })

  // 简单 checksum（生产环境应使用 crypto.subtle）
  let hash = 0
  for (let i = 0; i < contentStr.length; i++) {
    const char = contentStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }

  return {
    atom,
    operation,
    clientTimestamp: new Date().toISOString(),
    clientId,
    checksum: Math.abs(hash).toString(16)
  }
}

/**
 * 创建同步批次
 */
export function createSyncBatch(
  scope: MemoryScope,
  payloads: SyncAtomPayload[]
): SyncBatch {
  return {
    id: `sync-batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    scope,
    payloads,
    status: 'idle',
    createdAt: new Date().toISOString(),
    retryCount: 0
  }
}

/**
 * 检测同步冲突
 */
export function detectSyncConflict(
  localAtom: MemoryAtom,
  remoteVersion: Pick<MemoryAtom, 'content' | 'confidence' | 'updatedAt' | 'lifecycle'>
): SyncConflict | null {
  // 内容相同则无冲突
  if (localAtom.content === remoteVersion.content &&
    localAtom.lifecycle === remoteVersion.lifecycle) {
    return null
  }

  const localTime = new Date(localAtom.updatedAt).getTime()
  const remoteTime = new Date(remoteVersion.updatedAt).getTime()

  let strategy: ConflictStrategy
  let explanation: string

  if (localAtom.lifecycle === 'confirmed' && remoteVersion.lifecycle !== 'confirmed') {
    strategy = 'local_wins'
    explanation = '本地已确认的记忆优先于远程未确认版本'
  } else if (remoteVersion.lifecycle === 'confirmed' && localAtom.lifecycle !== 'confirmed') {
    strategy = 'remote_wins'
    explanation = '远程已确认的记忆优先于本地未确认版本'
  } else if (localAtom.confidence > remoteVersion.confidence + 0.2) {
    strategy = 'local_wins'
    explanation = `本地置信度（${localAtom.confidence}）显著高于远程（${remoteVersion.confidence}）`
  } else if (remoteVersion.confidence > localAtom.confidence + 0.2) {
    strategy = 'remote_wins'
    explanation = `远程置信度（${remoteVersion.confidence}）显著高于本地（${localAtom.confidence}）`
  } else if (localTime > remoteTime) {
    strategy = 'last_write_wins'
    explanation = '本地版本更新，以本地为准'
  } else {
    strategy = 'manual'
    explanation = '无法自动判断，需要用户手动选择'
  }

  return {
    atomId: localAtom.id,
    localVersion: {
      content: localAtom.content,
      confidence: localAtom.confidence,
      updatedAt: localAtom.updatedAt,
      lifecycle: localAtom.lifecycle
    },
    remoteVersion,
    strategy,
    resolved: strategy !== 'manual',
    resolvedVersion: strategy !== 'manual'
      ? (strategy === 'local_wins' || strategy === 'last_write_wins'
        ? { content: localAtom.content, confidence: localAtom.confidence, updatedAt: localAtom.updatedAt, lifecycle: localAtom.lifecycle }
        : remoteVersion)
      : undefined,
    explanation
  }
}

/**
 * 解决同步冲突
 */
export function resolveSyncConflict(
  conflict: SyncConflict,
  chosenVersion: 'local' | 'remote'
): SyncConflict {
  const version = chosenVersion === 'local' ? conflict.localVersion : conflict.remoteVersion
  return {
    ...conflict,
    resolved: true,
    resolvedVersion: version,
    strategy: chosenVersion === 'local' ? 'local_wins' : 'remote_wins',
    explanation: `用户手动选择${chosenVersion === 'local' ? '本地' : '远程'}版本`
  }
}

/**
 * 批量检测冲突
 */
export function detectBatchConflicts(
  localAtoms: MemoryAtom[],
  remoteVersions: Map<string, Pick<MemoryAtom, 'content' | 'confidence' | 'updatedAt' | 'lifecycle'>>
): SyncConflict[] {
  const conflicts: SyncConflict[] = []

  for (const atom of localAtoms) {
    const remote = remoteVersions.get(atom.id)
    if (!remote) continue

    const conflict = detectSyncConflict(atom, remote)
    if (conflict) {
      conflicts.push(conflict)
    }
  }

  return conflicts
}

/**
 * 创建同步结果
 */
export function createSyncResult(
  batchId: string,
  uploaded: number,
  downloaded: number,
  conflicts: SyncConflict[],
  errors: string[],
  startedAt: string
): SyncResult {
  const completedAt = new Date().toISOString()
  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime()

  const status: SyncStatus = errors.length > 0
    ? 'error'
    : conflicts.some(c => !c.resolved)
      ? 'conflict'
      : 'synced'

  return {
    batchId,
    status,
    uploaded,
    downloaded,
    conflicts,
    errors,
    startedAt,
    completedAt,
    durationMs
  }
}

/**
 * 创建初始同步状态
 */
export function createCloudSyncState(config?: Partial<SyncConfig>): CloudSyncState {
  return {
    config: createSyncConfig(config),
    status: 'idle',
    pendingUploads: 0,
    pendingDownloads: 0,
    totalSynced: 0,
    totalConflicts: 0,
    isOnline: true
  }
}

/**
 * 更新同步状态
 */
export function updateSyncState(
  state: CloudSyncState,
  updates: Partial<CloudSyncState>
): CloudSyncState {
  return { ...state, ...updates }
}

/**
 * 生成同步摘要
 */
export function summarizeSyncState(state: CloudSyncState): string {
  const lines: string[] = [
    `云端同步状态：${state.status === 'idle' ? '空闲' : state.status === 'syncing' ? '同步中' : state.status === 'synced' ? '已同步' : state.status === 'conflict' ? '有冲突' : state.status === 'error' ? '错误' : state.status === 'offline' ? '离线' : '已暂停'}`,
    `同步开关：${state.config.enabled ? '已启用' : '未启用'}`,
    `待上传：${state.pendingUploads} | 待下载：${state.pendingDownloads}`,
    `累计同步：${state.totalSynced} | 累计冲突：${state.totalConflicts}`,
    `网络状态：${state.isOnline ? '在线' : '离线'}`,
    state.lastSyncAt ? `上次同步：${state.lastSyncAt}` : '尚未同步'
  ]
  return lines.join('\n')
}
