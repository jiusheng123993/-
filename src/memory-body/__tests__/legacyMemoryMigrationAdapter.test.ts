import { describe, it, expect } from 'vitest'
import {
  detectLegacyFormat,
  migrateLegacyData,
  rollbackMigration,
  validateMigrationResult,
  summarizeMigrationReport,
} from '../adapter/legacyMemoryMigrationAdapter'
import type { MemoryAtom, MemoryScope, MemoryBodyState } from '../types'
import type {
  LegacyMemoryData,
  LegacyFormat,
  MigrationReport,
  MigrationResult,
} from '../adapter/legacyMemoryMigrationAdapter'

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

function makeLegacyData(
  format: LegacyFormat,
  data: unknown,
  overrides: Partial<LegacyMemoryData> = {}
): LegacyMemoryData {
  return {
    format,
    version: '0',
    source: 'test',
    data,
    metadata: {},
    ...overrides,
  }
}

// ─── detectLegacyFormat ─────────────────────────────────────

describe('detectLegacyFormat', () => {
  it('detects v0_raw_text format', () => {
    const result = detectLegacyFormat({ text: 'hello world' })
    expect(result).toBe('v0_raw_text')
  })

  it('detects v0_json_atoms format', () => {
    const result = detectLegacyFormat({ atoms: [{ id: 'a1' }] })
    expect(result).toBe('v0_json_atoms')
  })

  it('detects v1_partial_schema format', () => {
    const result = detectLegacyFormat({ atoms: [{ id: 'a1' }], version: '1' })
    expect(result).toBe('v1_partial_schema')
  })

  it('detects external_import format', () => {
    const result = detectLegacyFormat({ source: 'notion', items: ['a', 'b'] })
    expect(result).toBe('external_import')
  })

  it('returns unknown for null input', () => {
    const result = detectLegacyFormat(null)
    expect(result).toBe('unknown')
  })

  it('returns unknown for non-object input', () => {
    const result = detectLegacyFormat('just a string')
    expect(result).toBe('unknown')
  })

  it('returns unknown for unrecognized structure', () => {
    const result = detectLegacyFormat({ foo: 'bar' })
    expect(result).toBe('unknown')
  })

  it('v0_raw_text takes priority over v0_json_atoms when text field present without atoms', () => {
    const result = detectLegacyFormat({ text: 'hello' })
    expect(result).toBe('v0_raw_text')
  })

  it('source=memory_body is not treated as external_import', () => {
    const result = detectLegacyFormat({ source: 'memory_body', items: ['a'] })
    expect(result).toBe('unknown')
  })
})

// ─── migrateLegacyData ──────────────────────────────────────

describe('migrateLegacyData', () => {
  // ── v0_raw_text ──

  describe('v0_raw_text', () => {
    it('migrates plain text into atoms', () => {
      const legacy = makeLegacyData('v0_raw_text', {
        text: 'line one\nline two\nline three',
        timestamp: now,
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(3)
      expect(result.atoms[0].content).toBe('line one')
      expect(result.atoms[0].lifecycle).toBe('draft')
      expect(result.atoms[0].confidence).toBe(0.5)
      expect(result.atoms[0].tags).toContain('legacy-migration')
      expect(result.report.fromFormat).toBe('v0_raw_text')
      expect(result.report.migrated).toBe(3)
      expect(result.report.failed).toBe(0)
      expect(result.report.rollbackAvailable).toBe(true)
    })

    it('skips empty lines', () => {
      const legacy = makeLegacyData('v0_raw_text', {
        text: 'line one\n\n\nline two\n  \n',
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(2)
      expect(result.atoms[0].content).toBe('line one')
      expect(result.atoms[1].content).toBe('line two')
    })

    it('truncates long object to 100 chars', () => {
      const longLine = 'a'.repeat(200)
      const legacy = makeLegacyData('v0_raw_text', { text: longLine })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms[0].object.length).toBeLessThanOrEqual(100)
    })

    it('includes warning about draft status', () => {
      const legacy = makeLegacyData('v0_raw_text', { text: 'hello' })

      const result = migrateLegacyData(legacy, scope)

      expect(result.report.warnings.length).toBeGreaterThan(0)
      expect(result.report.warnings[0]).toContain('draft')
    })
  })

  // ── v0_json_atoms ──

  describe('v0_json_atoms', () => {
    it('migrates v0 JSON atoms preserving existing fields', () => {
      const legacy = makeLegacyData('v0_json_atoms', {
        atoms: [
          {
            id: 'old-1',
            content: 'old memory',
            confidence: 0.9,
            lifecycle: 'confirmed',
            sensitivity: 'sensitive',
            tags: ['important'],
          },
        ],
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(1)
      expect(result.atoms[0].id).toBe('old-1')
      expect(result.atoms[0].content).toBe('old memory')
      expect(result.atoms[0].confidence).toBe(0.9)
      expect(result.atoms[0].lifecycle).toBe('confirmed')
      expect(result.atoms[0].sensitivity).toBe('sensitive')
      expect(result.atoms[0].tags).toEqual(['important'])
    })

    it('fills defaults for missing fields', () => {
      const legacy = makeLegacyData('v0_json_atoms', {
        atoms: [{ content: 'minimal' }],
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms[0].confidence).toBe(0.5)
      expect(result.atoms[0].strength).toBe(0.5)
      expect(result.atoms[0].lifecycle).toBe('active')
      expect(result.atoms[0].sensitivity).toBe('personal')
      expect(result.atoms[0].source).toBe('migration')
    })

    it('handles invalid sensitivity gracefully', () => {
      const legacy = makeLegacyData('v0_json_atoms', {
        atoms: [{ content: 'test', sensitivity: 'top_secret' }],
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms[0].sensitivity).toBe('personal')
    })

    it('handles invalid lifecycle gracefully', () => {
      const legacy = makeLegacyData('v0_json_atoms', {
        atoms: [{ content: 'test', lifecycle: 'deleted' }],
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms[0].lifecycle).toBe('active')
    })

    it('generates id for atoms without id', () => {
      const legacy = makeLegacyData('v0_json_atoms', {
        atoms: [{ content: 'no id' }],
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms[0].id).toMatch(/^migrated-v0-/)
    })

    it('handles empty atoms array', () => {
      const legacy = makeLegacyData('v0_json_atoms', { atoms: [] })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(0)
      expect(result.report.totalItems).toBe(0)
    })
  })

  // ── v1_partial_schema ──

  describe('v1_partial_schema', () => {
    it('migrates v1 partial schema atoms', () => {
      const legacy = makeLegacyData('v1_partial_schema', {
        atoms: [
          {
            id: 'v1-1',
            content: 'v1 memory',
            confidence: 0.7,
            lifecycle: 'stable',
          },
        ],
        version: '1',
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(1)
      expect(result.atoms[0].id).toBe('v1-1')
      expect(result.atoms[0].content).toBe('v1 memory')
      expect(result.atoms[0].lifecycle).toBe('stable')
      expect(result.report.fromFormat).toBe('v1_partial_schema')
    })

    it('fills missing fields with defaults', () => {
      const legacy = makeLegacyData('v1_partial_schema', {
        atoms: [{ id: 'v1-2' }],
        version: '1',
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms[0].content).toBe('')
      expect(result.atoms[0].confidence).toBe(0.5)
      expect(result.atoms[0].source).toBe('migration')
    })
  })

  // ── external_import ──

  describe('external_import', () => {
    it('migrates items array from external source', () => {
      const legacy = makeLegacyData('external_import', {
        source: 'notion',
        items: ['item1', 'item2', 'item3'],
      }, { source: 'notion' })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(3)
      expect(result.atoms[0].content).toBe('item1')
      expect(result.atoms[0].lifecycle).toBe('draft')
      expect(result.atoms[0].confidence).toBe(0.4)
      expect(result.atoms[0].tags).toContain('external-import')
      expect(result.atoms[0].tags).toContain('notion')
    })

    it('migrates memories array', () => {
      const legacy = makeLegacyData('external_import', {
        source: 'evernote',
        memories: ['m1', 'm2'],
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(2)
      expect(result.atoms[0].content).toBe('m1')
    })

    it('migrates entries array', () => {
      const legacy = makeLegacyData('external_import', {
        source: 'roam',
        entries: ['e1'],
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(1)
      expect(result.atoms[0].content).toBe('e1')
    })

    it('migrates records array', () => {
      const legacy = makeLegacyData('external_import', {
        source: 'obsidian',
        records: ['r1', 'r2'],
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(2)
    })

    it('migrates text field', () => {
      const legacy = makeLegacyData('external_import', {
        source: 'plain',
        text: 'single text entry',
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(1)
      expect(result.atoms[0].content).toBe('single text entry')
    })

    it('migrates content field', () => {
      const legacy = makeLegacyData('external_import', {
        source: 'markdown',
        content: '# markdown content',
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(1)
      expect(result.atoms[0].content).toBe('# markdown content')
    })

    it('falls back to JSON serialization for unrecognized structure', () => {
      const legacy = makeLegacyData('external_import', {
        source: 'custom',
        customField: 'value',
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(1)
      expect(result.atoms[0].content).toContain('customField')
    })

    it('includes warning about draft status', () => {
      const legacy = makeLegacyData('external_import', {
        source: 'notion',
        items: ['item1'],
      })

      const result = migrateLegacyData(legacy, scope)

      expect(result.report.warnings.length).toBeGreaterThan(0)
      expect(result.report.warnings[0]).toContain('draft')
    })
  })

  // ── unknown format ──

  describe('unknown format', () => {
    it('returns empty atoms with fatal error for unknown format', () => {
      const legacy = makeLegacyData('unknown', { foo: 'bar' })

      const result = migrateLegacyData(legacy, scope)

      expect(result.atoms).toHaveLength(0)
      expect(result.report.errors).toHaveLength(1)
      expect(result.report.errors[0].severity).toBe('fatal')
      expect(result.report.errors[0].reason).toContain('无法识别')
      expect(result.report.rollbackAvailable).toBe(false)
    })
  })

  // ── auto-detect format ──

  it('auto-detects format when not explicitly provided', () => {
    const legacy: LegacyMemoryData = {
      format: '' as LegacyFormat,
      version: '0',
      source: 'test',
      data: { text: 'auto detected' },
      metadata: {},
    }

    const result = migrateLegacyData(legacy, scope)

    expect(result.atoms).toHaveLength(1)
    expect(result.report.fromFormat).toBe('v0_raw_text')
  })
})

// ─── rollbackMigration ──────────────────────────────────────

describe('rollbackMigration', () => {
  it('rolls back migration by removing migrated atoms', () => {
    const migratedAtom1 = makeAtom({ id: 'mig-1' })
    const migratedAtom2 = makeAtom({ id: 'mig-2' })
    const existingAtom = makeAtom({ id: 'existing-1' })

    const currentState: MemoryBodyState = {
      atoms: [migratedAtom1, migratedAtom2, existingAtom],
    }

    const migrationResult: MigrationResult = {
      atoms: [migratedAtom1, migratedAtom2],
      report: {
        id: 'migration-1',
        fromFormat: 'v0_raw_text',
        fromVersion: '0',
        toVersion: '1',
        startedAt: now,
        completedAt: now,
        totalItems: 2,
        migrated: 2,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        rollbackAvailable: true,
      },
    }

    const result = rollbackMigration(currentState, migrationResult)

    expect(result.success).toBe(true)
    expect(result.restoredCount).toBe(2)
  })

  it('returns failure when rollback is not available', () => {
    const currentState: MemoryBodyState = { atoms: [] }
    const migrationResult: MigrationResult = {
      atoms: [],
      report: {
        id: 'migration-1',
        fromFormat: 'unknown',
        fromVersion: '0',
        toVersion: '1',
        startedAt: now,
        completedAt: now,
        totalItems: 0,
        migrated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        rollbackAvailable: false,
      },
    }

    const result = rollbackMigration(currentState, migrationResult)

    expect(result.success).toBe(false)
    expect(result.errors).toContain('此迁移不支持回滚')
  })

  it('handles empty current state', () => {
    const currentState: MemoryBodyState = { atoms: [] }
    const migrationResult: MigrationResult = {
      atoms: [makeAtom({ id: 'mig-1' })],
      report: {
        id: 'migration-1',
        fromFormat: 'v0_raw_text',
        fromVersion: '0',
        toVersion: '1',
        startedAt: now,
        completedAt: now,
        totalItems: 1,
        migrated: 1,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        rollbackAvailable: true,
      },
    }

    const result = rollbackMigration(currentState, migrationResult)

    expect(result.success).toBe(true)
    expect(result.restoredCount).toBe(0)
  })
})

// ─── validateMigrationResult ────────────────────────────────

describe('validateMigrationResult', () => {
  it('validates a successful migration result', () => {
    const atom = makeAtom({ id: 'valid-1', content: 'valid content' })
    const result: MigrationResult = {
      atoms: [atom],
      report: {
        id: 'migration-1',
        fromFormat: 'v0_json_atoms',
        fromVersion: '0',
        toVersion: '1',
        startedAt: now,
        completedAt: now,
        totalItems: 1,
        migrated: 1,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        rollbackAvailable: true,
      },
    }

    const validation = validateMigrationResult(result)

    expect(validation.valid).toBe(true)
    expect(validation.issues).toHaveLength(0)
  })

  it('detects missing id', () => {
    const atom = makeAtom({ id: '', content: 'no id' })
    const result: MigrationResult = {
      atoms: [atom],
      report: {
        id: 'migration-1',
        fromFormat: 'v0_json_atoms',
        fromVersion: '0',
        toVersion: '1',
        startedAt: now,
        completedAt: now,
        totalItems: 1,
        migrated: 1,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        rollbackAvailable: true,
      },
    }

    const validation = validateMigrationResult(result)

    expect(validation.valid).toBe(false)
    expect(validation.issues.some(i => i.includes('缺少 id'))).toBe(true)
  })

  it('detects missing content', () => {
    const atom = makeAtom({ id: 'a1', content: '' })
    const result: MigrationResult = {
      atoms: [atom],
      report: {
        id: 'migration-1',
        fromFormat: 'v0_json_atoms',
        fromVersion: '0',
        toVersion: '1',
        startedAt: now,
        completedAt: now,
        totalItems: 1,
        migrated: 1,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        rollbackAvailable: true,
      },
    }

    const validation = validateMigrationResult(result)

    expect(validation.valid).toBe(false)
    expect(validation.issues.some(i => i.includes('缺少 content'))).toBe(true)
  })

  it('detects confidence out of range', () => {
    const atom = makeAtom({ id: 'a1', content: 'test', confidence: 1.5 })
    const result: MigrationResult = {
      atoms: [atom],
      report: {
        id: 'migration-1',
        fromFormat: 'v0_json_atoms',
        fromVersion: '0',
        toVersion: '1',
        startedAt: now,
        completedAt: now,
        totalItems: 1,
        migrated: 1,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        rollbackAvailable: true,
      },
    }

    const validation = validateMigrationResult(result)

    expect(validation.valid).toBe(false)
    expect(validation.issues.some(i => i.includes('confidence'))).toBe(true)
  })

  it('detects strength out of range', () => {
    const atom = makeAtom({ id: 'a1', content: 'test', strength: -0.5 })
    const result: MigrationResult = {
      atoms: [atom],
      report: {
        id: 'migration-1',
        fromFormat: 'v0_json_atoms',
        fromVersion: '0',
        toVersion: '1',
        startedAt: now,
        completedAt: now,
        totalItems: 1,
        migrated: 1,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        rollbackAvailable: true,
      },
    }

    const validation = validateMigrationResult(result)

    expect(validation.valid).toBe(false)
    expect(validation.issues.some(i => i.includes('strength'))).toBe(true)
  })

  it('detects fatal errors in report', () => {
    const result: MigrationResult = {
      atoms: [],
      report: {
        id: 'migration-1',
        fromFormat: 'unknown',
        fromVersion: '0',
        toVersion: '1',
        startedAt: now,
        completedAt: now,
        totalItems: 1,
        migrated: 0,
        skipped: 0,
        failed: 1,
        errors: [{ index: 0, item: {}, reason: 'fatal error', severity: 'fatal' }],
        warnings: [],
        rollbackAvailable: false,
      },
    }

    const validation = validateMigrationResult(result)

    expect(validation.valid).toBe(false)
    expect(validation.issues.some(i => i.includes('致命'))).toBe(true)
  })

  it('detects all items failed', () => {
    const result: MigrationResult = {
      atoms: [],
      report: {
        id: 'migration-1',
        fromFormat: 'v0_json_atoms',
        fromVersion: '0',
        toVersion: '1',
        startedAt: now,
        completedAt: now,
        totalItems: 5,
        migrated: 0,
        skipped: 0,
        failed: 5,
        errors: [],
        warnings: [],
        rollbackAvailable: true,
      },
    }

    const validation = validateMigrationResult(result)

    expect(validation.valid).toBe(false)
    expect(validation.issues.some(i => i.includes('所有数据迁移失败'))).toBe(true)
  })

  it('handles empty atoms with zero totalItems', () => {
    const result: MigrationResult = {
      atoms: [],
      report: {
        id: 'migration-1',
        fromFormat: 'v0_json_atoms',
        fromVersion: '0',
        toVersion: '1',
        startedAt: now,
        completedAt: now,
        totalItems: 0,
        migrated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        warnings: [],
        rollbackAvailable: true,
      },
    }

    const validation = validateMigrationResult(result)

    expect(validation.valid).toBe(true)
  })
})

// ─── summarizeMigrationReport ───────────────────────────────

describe('summarizeMigrationReport', () => {
  it('summarizes a successful migration report', () => {
    const report: MigrationReport = {
      id: 'migration-123',
      fromFormat: 'v0_raw_text',
      fromVersion: '0',
      toVersion: '1',
      startedAt: now,
      completedAt: now,
      totalItems: 10,
      migrated: 10,
      skipped: 0,
      failed: 0,
      errors: [],
      warnings: ['建议审查'],
      rollbackAvailable: true,
    }

    const summary = summarizeMigrationReport(report)

    expect(summary).toContain('migration-123')
    expect(summary).toContain('v0_raw_text')
    expect(summary).toContain('v1')
    expect(summary).toContain('总计：10')
    expect(summary).toContain('成功：10')
    expect(summary).toContain('可回滚：是')
    expect(summary).toContain('建议审查')
  })

  it('summarizes a report with errors', () => {
    const report: MigrationReport = {
      id: 'migration-456',
      fromFormat: 'v0_json_atoms',
      fromVersion: '0',
      toVersion: '1',
      startedAt: now,
      completedAt: now,
      totalItems: 5,
      migrated: 3,
      skipped: 0,
      failed: 2,
      errors: [
        { index: 0, item: {}, reason: 'parse error', severity: 'error' },
        { index: 1, item: {}, reason: 'type mismatch', severity: 'warning' },
      ],
      warnings: [],
      rollbackAvailable: true,
    }

    const summary = summarizeMigrationReport(report)

    expect(summary).toContain('失败：2')
    expect(summary).toContain('错误：2 条')
    expect(summary).toContain('parse error')
    expect(summary).toContain('type mismatch')
  })

  it('summarizes a report with rollback unavailable', () => {
    const report: MigrationReport = {
      id: 'migration-789',
      fromFormat: 'unknown',
      fromVersion: '0',
      toVersion: '1',
      startedAt: now,
      completedAt: now,
      totalItems: 0,
      migrated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      warnings: [],
      rollbackAvailable: false,
    }

    const summary = summarizeMigrationReport(report)

    expect(summary).toContain('可回滚：否')
  })

  it('limits errors to first 3 in summary', () => {
    const report: MigrationReport = {
      id: 'migration-999',
      fromFormat: 'v0_json_atoms',
      fromVersion: '0',
      toVersion: '1',
      startedAt: now,
      completedAt: now,
      totalItems: 5,
      migrated: 1,
      skipped: 0,
      failed: 4,
      errors: [
        { index: 0, item: {}, reason: 'error 1', severity: 'error' },
        { index: 1, item: {}, reason: 'error 2', severity: 'error' },
        { index: 2, item: {}, reason: 'error 3', severity: 'error' },
        { index: 3, item: {}, reason: 'error 4', severity: 'error' },
      ],
      warnings: [],
      rollbackAvailable: true,
    }

    const summary = summarizeMigrationReport(report)

    expect(summary).toContain('error 1')
    expect(summary).toContain('error 2')
    expect(summary).toContain('error 3')
    expect(summary).not.toContain('error 4')
  })

  it('limits warnings to first 3 in summary', () => {
    const report: MigrationReport = {
      id: 'migration-888',
      fromFormat: 'v0_raw_text',
      fromVersion: '0',
      toVersion: '1',
      startedAt: now,
      completedAt: now,
      totalItems: 1,
      migrated: 1,
      skipped: 0,
      failed: 0,
      errors: [],
      warnings: ['w1', 'w2', 'w3', 'w4'],
      rollbackAvailable: true,
    }

    const summary = summarizeMigrationReport(report)

    expect(summary).toContain('w1')
    expect(summary).toContain('w2')
    expect(summary).toContain('w3')
    expect(summary).not.toContain('w4')
  })
})
