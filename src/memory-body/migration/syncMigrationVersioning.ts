import type { MemoryAtom, MemoryBodyState, MemoryScope } from '../core/memoryBodyTypes'

export const CURRENT_MEMORY_BODY_SCHEMA_VERSION = 1
export const CURRENT_COGNITIVE_PROFILE_SCHEMA_VERSION = 1

export interface MigrationStep {
  fromVersion: number
  toVersion: number
  description: string
  migrate: (state: MemoryBodyState) => MemoryBodyState
}

export interface MigrationPlan {
  fromVersion: number
  toVersion: number
  steps: MigrationStep[]
}

export interface ExportPayload {
  exportedAt: string
  schemaVersion: number
  cognitiveProfileVersion: number
  data: MemoryBodyState
}

export interface BackupSnapshot {
  id: string
  timestamp: string
  state: MemoryBodyState
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const MIGRATION_STEPS: MigrationStep[] = [
  {
    fromVersion: 0,
    toVersion: 1,
    description: '初始化 MemoryBody schema v1：确保所有 atom 具有完整的 lifecycle 和 sensitivity 字段',
    migrate: (state: MemoryBodyState): MemoryBodyState => ({
      ...state,
      version: 1,
      atoms: state.atoms.map(atom => ({
        ...atom,
        lifecycle: atom.lifecycle || 'active',
        sensitivity: atom.sensitivity || 'personal',
        emotionalWeight: atom.emotionalWeight ?? 0.1,
        accessCount: atom.accessCount ?? 0,
        contradictionOf: atom.contradictionOf ?? [],
        conditions: atom.conditions ?? undefined
      })),
      meta: {
        ...state.meta,
        cognitiveProfileVersion: state.meta.cognitiveProfileVersion ?? CURRENT_COGNITIVE_PROFILE_SCHEMA_VERSION
      }
    })
  }
]

export function needsMigration(state: MemoryBodyState): boolean {
  return state.version < CURRENT_MEMORY_BODY_SCHEMA_VERSION
}

export function createMigrationPlan(state: MemoryBodyState): MigrationPlan {
  const applicableSteps = MIGRATION_STEPS.filter(
    step => step.fromVersion >= state.version && step.toVersion <= CURRENT_MEMORY_BODY_SCHEMA_VERSION
  )

  return {
    fromVersion: state.version,
    toVersion: CURRENT_MEMORY_BODY_SCHEMA_VERSION,
    steps: applicableSteps
  }
}

export function migrateMemoryBodyState(state: MemoryBodyState): MemoryBodyState {
  if (!needsMigration(state)) return state

  let current = state
  const plan = createMigrationPlan(state)

  for (const step of plan.steps) {
    current = step.migrate(current)
  }

  return current
}

export function exportMemoryBodyState(state: MemoryBodyState): string {
  const payload: ExportPayload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: CURRENT_MEMORY_BODY_SCHEMA_VERSION,
    cognitiveProfileVersion: CURRENT_COGNITIVE_PROFILE_SCHEMA_VERSION,
    data: state
  }
  return JSON.stringify(payload)
}

export function importMemoryBodyState(json: string): MemoryBodyState | null {
  try {
    const parsed = JSON.parse(json) as Partial<ExportPayload>
    if (!parsed.data || typeof parsed.data !== 'object') return null
    if (!Array.isArray(parsed.data.atoms)) return null

    const state = parsed.data as MemoryBodyState
    return migrateMemoryBodyState(state)
  } catch {
    return null
  }
}

export function validateMemoryBodyState(state: MemoryBodyState): ValidationResult {
  const errors: string[] = []

  if (!state || typeof state !== 'object') {
    errors.push('state 必须是一个对象')
    return { valid: false, errors }
  }

  if (!state.userId || typeof state.userId !== 'string') {
    errors.push('userId 必须是非空字符串')
  }

  if (!state.projectId || typeof state.projectId !== 'string') {
    errors.push('projectId 必须是非空字符串')
  }

  if (!Array.isArray(state.atoms)) {
    errors.push('atoms 必须是数组')
  }

  if (!Array.isArray(state.entities)) {
    errors.push('entities 必须是数组')
  }

  if (!Array.isArray(state.relations)) {
    errors.push('relations 必须是数组')
  }

  if (!Array.isArray(state.beliefs)) {
    errors.push('beliefs 必须是数组')
  }

  if (typeof state.version !== 'number' || state.version < 0) {
    errors.push('version 必须是非负整数')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function createBackup(state: MemoryBodyState): BackupSnapshot {
  return {
    id: `backup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    state: JSON.parse(JSON.stringify(state))
  }
}

export function rollbackMigration(currentState: MemoryBodyState, backup: BackupSnapshot | null): MemoryBodyState {
  if (!backup) return currentState
  return JSON.parse(JSON.stringify(backup.state))
}

// ─── 遗留数据导入桥接函数 ───────────────────────────────

export interface LegacyImportResult {
  status: 'success' | 'failed'
  state?: MemoryBodyState
  reason?: string
}

/**
 * 导入遗留格式数据，返回 MemoryBodyState 或 null
 *
 * 支持格式：
 * - v0_raw_text: { format: 'v0_raw_text', data: string, userId: string, projectId: string }
 * - v0_json_atoms: { format: 'v0_json_atoms', data: Array<Partial<MemoryAtom>>, userId: string, projectId: string }
 */
export function importLegacyData(raw: unknown): MemoryBodyState | null {
  if (!raw || typeof raw !== 'object') return null

  const input = raw as Record<string, unknown>

  if (input.format === 'v0_raw_text' && typeof input.data === 'string') {
    const now = new Date().toISOString()
    const scope: MemoryScope = {
      userId: typeof input.userId === 'string' ? input.userId : 'unknown',
      projectId: typeof input.projectId === 'string' ? input.projectId : 'unknown',
    }
    return {
      version: CURRENT_MEMORY_BODY_SCHEMA_VERSION as 1,
      scope,
      atoms: [{
        id: `legacy-${Date.now()}`,
        scope,
        layer: 'semantic',
        type: 'preference',
        subject: 'user',
        predicate: 'stated',
        object: input.data.slice(0, 50),
        content: input.data,
        source: 'migration',
        confidence: 0.5,
        strength: 0.5,
        emotionalWeight: 0.1,
        sensitivity: 'personal',
        lifecycle: 'active',
        evidence: [],
        tags: ['legacy', 'v0_raw_text'],
        scenarios: ['general'],
        createdAt: now,
        updatedAt: now,
        lastAccessedAt: now,
        accessCount: 0,
        contradictionOf: [],
      }],
      entities: [],
      relations: [],
      beliefs: [],
      meta: {
        createdAt: now,
        updatedAt: now,
        totalInteractions: 0,
        totalCorrections: 0,
        maturityLevel: 0,
      },
    }
  }

  if (input.format === 'v0_json_atoms' && Array.isArray(input.data)) {
    const now = new Date().toISOString()
    const scope: MemoryScope = {
      userId: typeof input.userId === 'string' ? input.userId : 'unknown',
      projectId: typeof input.projectId === 'string' ? input.projectId : 'unknown',
    }
    const atoms: MemoryAtom[] = input.data.map((item: Record<string, unknown>, index: number) => ({
      id: item.id as string ?? `legacy-atom-${index}`,
      scope,
      layer: (item.layer as MemoryAtom['layer']) ?? 'semantic',
      type: (item.type as MemoryAtom['type']) ?? 'preference',
      subject: (item.subject as string) ?? 'user',
      predicate: (item.predicate as string) ?? 'stated',
      object: (item.object as string) ?? '',
      content: (item.content as string) ?? '',
      source: (item.source as MemoryAtom['source']) ?? 'migration',
      confidence: typeof item.confidence === 'number' ? item.confidence : 0.5,
      strength: typeof item.strength === 'number' ? item.strength : 0.5,
      emotionalWeight: typeof item.emotionalWeight === 'number' ? item.emotionalWeight : 0.1,
      sensitivity: (item.sensitivity as MemoryAtom['sensitivity']) ?? 'personal',
      lifecycle: (item.lifecycle as MemoryAtom['lifecycle']) ?? 'active',
      evidence: Array.isArray(item.evidence) ? item.evidence as MemoryAtom['evidence'] : [],
      tags: Array.isArray(item.tags) ? item.tags as string[] : ['legacy'],
      scenarios: Array.isArray(item.scenarios) ? item.scenarios as MemoryAtom['scenarios'] : ['general'],
      createdAt: (item.createdAt as string) ?? now,
      updatedAt: (item.updatedAt as string) ?? now,
      lastAccessedAt: (item.lastAccessedAt as string) ?? now,
      accessCount: typeof item.accessCount === 'number' ? item.accessCount : 0,
      contradictionOf: Array.isArray(item.contradictionOf) ? item.contradictionOf as string[] : [],
    }))
    return {
      version: CURRENT_MEMORY_BODY_SCHEMA_VERSION as 1,
      scope,
      atoms,
      entities: [],
      relations: [],
      beliefs: [],
      meta: {
        createdAt: now,
        updatedAt: now,
        totalInteractions: 0,
        totalCorrections: 0,
        maturityLevel: 0,
      },
    }
  }

  return null
}

/**
 * 智能导入：自动识别格式并导入
 *
 * - 如果是标准 ExportPayload 格式，使用 importMemoryBodyState
 * - 如果是遗留格式，使用 importLegacyData
 * - 完全无效数据返回 failed
 */
export function smartImport(raw: unknown): LegacyImportResult {
  if (!raw || typeof raw !== 'object') {
    return { status: 'failed', reason: '无效数据：不是对象' }
  }

  // 尝试标准格式导入
  if (typeof raw === 'object') {
    try {
      const json = JSON.stringify(raw)
      const result = importMemoryBodyState(json)
      if (result) {
        return { status: 'success', state: result }
      }
    } catch {
      // 继续尝试遗留格式
    }
  }

  // 尝试遗留格式导入
  const legacyResult = importLegacyData(raw)
  if (legacyResult) {
    return { status: 'success', state: legacyResult }
  }

  return { status: 'failed', reason: '无法识别的数据格式' }
}
