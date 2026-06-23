import type { MemoryBodyState } from '../core/memoryBodyTypes'

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
