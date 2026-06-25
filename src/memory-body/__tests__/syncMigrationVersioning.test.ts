import { describe, expect, it } from 'vitest'
import type { MemoryAtom, MemoryBodyState, MemoryScope } from '../core/memoryBodyTypes'
import {
  CURRENT_MEMORY_BODY_SCHEMA_VERSION,
  CURRENT_COGNITIVE_PROFILE_SCHEMA_VERSION,
  createMigrationPlan,
  migrateMemoryBodyState,
  needsMigration,
  exportMemoryBodyState,
  importMemoryBodyState,
  validateMemoryBodyState,
  createBackup,
  rollbackMigration,
  type ExportPayload
} from '../migration/syncMigrationVersioning'

const scope: MemoryScope = { userId: 'user-1', projectId: 'project-1' }
const timestamp = '2026-06-23T00:00:00.000Z'

function atom(partial: Partial<MemoryAtom>): MemoryAtom {
  return {
    id: partial.id ?? 'atom-1',
    scope: partial.scope ?? scope,
    layer: partial.layer ?? 'semantic',
    type: partial.type ?? 'preference',
    subject: partial.subject ?? 'user',
    predicate: partial.predicate ?? 'likes',
    object: partial.object ?? '西瓜',
    content: partial.content ?? '用户喜欢西瓜',
    source: partial.source ?? 'chat',
    confidence: partial.confidence ?? 0.78,
    strength: partial.strength ?? 0.5,
    emotionalWeight: partial.emotionalWeight ?? 0.1,
    sensitivity: partial.sensitivity ?? 'personal',
    lifecycle: partial.lifecycle ?? 'active',
    evidence: partial.evidence ?? [{
      id: 'evidence-1',
      source: 'chat',
      sourceText: '我喜欢吃西瓜',
      timestamp,
      confidence: 0.78
    }],
    tags: partial.tags ?? [],
    scenarios: partial.scenarios ?? ['chat'],
    createdAt: partial.createdAt ?? timestamp,
    updatedAt: partial.updatedAt ?? timestamp,
    lastAccessedAt: partial.lastAccessedAt ?? timestamp,
    accessCount: partial.accessCount ?? 0,
    contradictionOf: partial.contradictionOf ?? []
  }
}

function state(overrides: Partial<MemoryBodyState> = {}): MemoryBodyState {
  return {
    version: overrides.version ?? CURRENT_MEMORY_BODY_SCHEMA_VERSION,
    userId: overrides.userId ?? scope.userId,
    projectId: overrides.projectId ?? scope.projectId,
    atoms: overrides.atoms ?? [],
    entities: overrides.entities ?? [],
    relations: overrides.relations ?? [],
    beliefs: overrides.beliefs ?? [],
    meta: overrides.meta ?? {
      createdAt: timestamp,
      updatedAt: timestamp,
      totalCorrections: 0,
      totalConfirmations: 0,
      cognitiveProfileVersion: CURRENT_COGNITIVE_PROFILE_SCHEMA_VERSION
    }
  }
}

describe('syncMigrationVersioning', () => {
  describe('schema versions', () => {
    it('has defined current schema versions', () => {
      expect(CURRENT_MEMORY_BODY_SCHEMA_VERSION).toBeGreaterThan(0)
      expect(CURRENT_COGNITIVE_PROFILE_SCHEMA_VERSION).toBeGreaterThan(0)
    })
  })

  describe('needsMigration', () => {
    it('returns false when state version matches current', () => {
      expect(needsMigration(state({ version: CURRENT_MEMORY_BODY_SCHEMA_VERSION }))).toBe(false)
    })

    it('returns true when state version is older than current', () => {
      expect(needsMigration(state({ version: 0 }))).toBe(true)
      expect(needsMigration(state({ version: CURRENT_MEMORY_BODY_SCHEMA_VERSION - 1 }))).toBe(true)
    })

    it('returns false when state version is newer (forward compat)', () => {
      expect(needsMigration(state({ version: CURRENT_MEMORY_BODY_SCHEMA_VERSION + 1 }))).toBe(false)
    })
  })

  describe('createMigrationPlan', () => {
    it('creates empty plan when no migration needed', () => {
      const plan = createMigrationPlan(state({ version: CURRENT_MEMORY_BODY_SCHEMA_VERSION }))
      expect(plan.steps).toHaveLength(0)
      expect(plan.fromVersion).toBe(CURRENT_MEMORY_BODY_SCHEMA_VERSION)
      expect(plan.toVersion).toBe(CURRENT_MEMORY_BODY_SCHEMA_VERSION)
    })

    it('creates migration steps for each version gap', () => {
      const plan = createMigrationPlan(state({ version: 0 }))
      expect(plan.steps.length).toBeGreaterThan(0)
      expect(plan.fromVersion).toBe(0)
      expect(plan.toVersion).toBe(CURRENT_MEMORY_BODY_SCHEMA_VERSION)
    })

    it('each step has a description', () => {
      const plan = createMigrationPlan(state({ version: 0 }))
      for (const step of plan.steps) {
        expect(step.description).toBeTruthy()
        expect(step.fromVersion).toBeLessThan(step.toVersion)
      }
    })
  })

  describe('migrateMemoryBodyState', () => {
    it('returns same state when already current', () => {
      const original = state({ version: CURRENT_MEMORY_BODY_SCHEMA_VERSION })
      const result = migrateMemoryBodyState(original)
      expect(result.version).toBe(CURRENT_MEMORY_BODY_SCHEMA_VERSION)
      expect(result.atoms).toEqual(original.atoms)
    })

    it('updates version to current after migration', () => {
      const oldState = state({ version: 0 })
      const result = migrateMemoryBodyState(oldState)
      expect(result.version).toBe(CURRENT_MEMORY_BODY_SCHEMA_VERSION)
    })

    it('preserves atoms during migration', () => {
      const testAtom = atom({ id: 'atom-1' })
      const oldState = state({ version: 0, atoms: [testAtom] })
      const result = migrateMemoryBodyState(oldState)
      expect(result.atoms).toHaveLength(1)
      expect(result.atoms[0].id).toBe('atom-1')
    })

    it('preserves entities during migration', () => {
      const oldState = state({
        version: 0,
        entities: [{ id: 'entity-1', scope, name: 'test', type: 'concept', createdAt: timestamp, updatedAt: timestamp }]
      })
      const result = migrateMemoryBodyState(oldState)
      expect(result.entities).toHaveLength(1)
      expect(result.entities[0].id).toBe('entity-1')
    })

    it('preserves relations during migration', () => {
      const oldState = state({
        version: 0,
        relations: [{ id: 'rel-1', scope, fromId: 'a', toId: 'b', type: 'related_to', createdAt: timestamp, updatedAt: timestamp }]
      })
      const result = migrateMemoryBodyState(oldState)
      expect(result.relations).toHaveLength(1)
      expect(result.relations[0].id).toBe('rel-1')
    })

    it('preserves beliefs during migration', () => {
      const oldState = state({
        version: 0,
        beliefs: [{ id: 'belief-1', scope, statement: 'test', confidence: 0.8, createdAt: timestamp, updatedAt: timestamp }]
      })
      const result = migrateMemoryBodyState(oldState)
      expect(result.beliefs).toHaveLength(1)
      expect(result.beliefs[0].id).toBe('belief-1')
    })
  })

  describe('exportMemoryBodyState', () => {
    it('exports state as valid JSON string', () => {
      const testState = state({ atoms: [atom({ id: 'atom-1' })] })
      const exported = exportMemoryBodyState(testState)
      const parsed = JSON.parse(exported) as ExportPayload
      expect(parsed.schemaVersion).toBe(CURRENT_MEMORY_BODY_SCHEMA_VERSION)
      expect(parsed.data.atoms).toHaveLength(1)
    })

    it('export payload includes metadata', () => {
      const testState = state({ atoms: [atom({ id: 'atom-1' })] })
      const exported = exportMemoryBodyState(testState)
      const parsed = JSON.parse(exported) as ExportPayload
      expect(parsed.exportedAt).toBeDefined()
      expect(parsed.schemaVersion).toBe(CURRENT_MEMORY_BODY_SCHEMA_VERSION)
      expect(parsed.data).toBeDefined()
    })
  })

  describe('importMemoryBodyState', () => {
    it('imports valid exported state', () => {
      const testState = state({ atoms: [atom({ id: 'atom-1' })] })
      const exported = exportMemoryBodyState(testState)
      const imported = importMemoryBodyState(exported)
      expect(imported).not.toBeNull()
      expect(imported!.atoms).toHaveLength(1)
      expect(imported!.atoms[0].id).toBe('atom-1')
    })

    it('returns null for invalid JSON', () => {
      const imported = importMemoryBodyState('not valid json')
      expect(imported).toBeNull()
    })

    it('returns null for missing data field', () => {
      const imported = importMemoryBodyState(JSON.stringify({ exportedAt: timestamp, schemaVersion: 1 }))
      expect(imported).toBeNull()
    })

    it('migrates imported state if version is older', () => {
      const oldState = state({ version: 0, atoms: [atom({ id: 'atom-1' })] })
      const exported = exportMemoryBodyState(oldState)
      const imported = importMemoryBodyState(exported)
      expect(imported).not.toBeNull()
      expect(imported!.version).toBe(CURRENT_MEMORY_BODY_SCHEMA_VERSION)
    })
  })

  describe('validateMemoryBodyState', () => {
    it('returns valid for correct state', () => {
      const result = validateMemoryBodyState(state())
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns invalid for null', () => {
      const result = validateMemoryBodyState(null as unknown as MemoryBodyState)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('returns invalid for missing atoms array', () => {
      const invalid = { ...state(), atoms: undefined as unknown as MemoryAtom[] }
      const result = validateMemoryBodyState(invalid)
      expect(result.valid).toBe(false)
    })

    it('returns invalid for missing userId', () => {
      const invalid = { ...state(), userId: '' }
      const result = validateMemoryBodyState(invalid)
      expect(result.valid).toBe(false)
    })
  })

  describe('createBackup', () => {
    it('creates a backup snapshot of current state', () => {
      const testState = state({ atoms: [atom({ id: 'atom-1' })] })
      const backup = createBackup(testState)
      expect(backup.id).toBeDefined()
      expect(backup.timestamp).toBeDefined()
      expect(backup.state.atoms).toHaveLength(1)
      expect(backup.state.atoms[0].id).toBe('atom-1')
    })

    it('backup preserves full state', () => {
      const testState = state({
        atoms: [atom({ id: 'atom-1' })],
        entities: [{ id: 'entity-1', scope, name: 'test', type: 'concept', createdAt: timestamp, updatedAt: timestamp }]
      })
      const backup = createBackup(testState)
      expect(backup.state.entities).toHaveLength(1)
    })
  })

  describe('rollbackMigration', () => {
    it('rolls back to backup state', () => {
      const originalState = state({ atoms: [atom({ id: 'atom-1', content: '原始内容' })] })
      const backup = createBackup(originalState)

      const modifiedState = state({ atoms: [atom({ id: 'atom-1', content: '修改后内容' })] })
      const rolledBack = rollbackMigration(modifiedState, backup)

      expect(rolledBack.atoms[0].content).toBe('原始内容')
    })

    it('returns current state if backup is null', () => {
      const currentState = state({ atoms: [atom({ id: 'atom-1' })] })
      const rolledBack = rollbackMigration(currentState, null)
      expect(rolledBack).toEqual(currentState)
    })
  })
})

// ─── 遗留数据导入桥接函数测试 ───────────────────────────────

import { importLegacyData, smartImport } from '../migration/syncMigrationVersioning'

const legacyScope: MemoryScope = { userId: 'user-1', projectId: 'project-1' }

describe('importLegacyData', () => {
  it('v0_raw_text 格式导入', () => {
    const result = importLegacyData({
      format: 'v0_raw_text',
      data: '用户喜欢 TypeScript',
      userId: legacyScope.userId,
      projectId: legacyScope.projectId,
    })
    expect(result).not.toBeNull()
    expect(result!.atoms).toHaveLength(1)
    expect(result!.atoms[0].content).toBe('用户喜欢 TypeScript')
    expect(result!.atoms[0].tags).toContain('legacy')
    expect(result!.atoms[0].tags).toContain('v0_raw_text')
    expect(result!.scope.userId).toBe(legacyScope.userId)
  })

  it('v0_json_atoms 格式导入', () => {
    const result = importLegacyData({
      format: 'v0_json_atoms',
      data: [
        { id: 'a1', content: '偏好1', confidence: 0.8 },
        { id: 'a2', content: '偏好2', confidence: 0.6 },
      ],
      userId: legacyScope.userId,
      projectId: legacyScope.projectId,
    })
    expect(result).not.toBeNull()
    expect(result!.atoms).toHaveLength(2)
    expect(result!.atoms[0].id).toBe('a1')
    expect(result!.atoms[0].content).toBe('偏好1')
    expect(result!.atoms[1].id).toBe('a2')
    expect(result!.atoms[1].content).toBe('偏好2')
  })

  it('非遗留格式返回 null', () => {
    const result = importLegacyData({
      format: 'unknown_format',
      data: 'some data',
    })
    expect(result).toBeNull()
  })

  it('无效 JSON 返回 null', () => {
    const result = importLegacyData('not an object')
    expect(result).toBeNull()
  })

  it('null 输入返回 null', () => {
    const result = importLegacyData(null)
    expect(result).toBeNull()
  })

  it('v0_raw_text 缺少 userId 使用默认值', () => {
    const result = importLegacyData({
      format: 'v0_raw_text',
      data: 'some text',
    })
    expect(result).not.toBeNull()
    expect(result!.scope.userId).toBe('unknown')
  })
})

describe('smartImport', () => {
  it('标准格式导入', () => {
    const testState = state({ atoms: [atom({ id: 'atom-1' })] })
    const exported = exportMemoryBodyState(testState)
    const parsed = JSON.parse(exported)
    const result = smartImport(parsed)
    expect(result.status).toBe('success')
    expect(result.state).toBeDefined()
    expect(result.state!.atoms).toHaveLength(1)
    expect(result.state!.atoms[0].id).toBe('atom-1')
  })

  it('遗留格式导入', () => {
    const result = smartImport({
      format: 'v0_raw_text',
      data: '用户喜欢 TypeScript',
      userId: legacyScope.userId,
      projectId: legacyScope.projectId,
    })
    expect(result.status).toBe('success')
    expect(result.state).toBeDefined()
    expect(result.state!.atoms).toHaveLength(1)
    expect(result.state!.atoms[0].content).toBe('用户喜欢 TypeScript')
  })

  it('完全无效数据返回 failed', () => {
    const result = smartImport('not an object')
    expect(result.status).toBe('failed')
    expect(result.reason).toBeDefined()
  })

  it('null 输入返回 failed', () => {
    const result = smartImport(null)
    expect(result.status).toBe('failed')
  })

  it('无法识别的对象返回 failed', () => {
    const result = smartImport({ foo: 'bar' })
    expect(result.status).toBe('failed')
    expect(result.reason).toBe('无法识别的数据格式')
  })
})
