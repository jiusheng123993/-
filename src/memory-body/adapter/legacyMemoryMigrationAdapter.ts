import type { MemoryAtom, MemoryBodyState, MemoryScope } from '../types'

/**
 * LegacyMemoryMigrationAdapter — 设计文档 Architecture - Integration
 *
 * 遗留记忆迁移适配器：将旧版本/旧格式的记忆数据迁移到当前 schema。
 *
 * 设计原则（设计文档 14.2）：
 * - schema 变更必须带 migration 和 rollback
 * - 迁移可回滚
 * - 与 syncMigrationVersioning 互补：syncMigrationVersioning 管理 schema 版本，
 *   LegacyMemoryMigrationAdapter 处理具体的数据迁移逻辑
 */

export type LegacyFormat =
  | 'v0_raw_text'
  | 'v0_json_atoms'
  | 'v1_partial_schema'
  | 'external_import'
  | 'unknown'

export interface LegacyMemoryData {
  format: LegacyFormat
  version: string
  source: string
  exportedAt?: string
  data: unknown
  metadata: Record<string, unknown>
}

export interface MigrationReport {
  id: string
  fromFormat: LegacyFormat
  fromVersion: string
  toVersion: string
  startedAt: string
  completedAt: string
  totalItems: number
  migrated: number
  skipped: number
  failed: number
  errors: MigrationError[]
  warnings: string[]
  rollbackAvailable: boolean
}

export interface MigrationError {
  index: number
  item: unknown
  reason: string
  severity: 'warning' | 'error' | 'fatal'
}

export interface MigrationResult {
  atoms: MemoryAtom[]
  report: MigrationReport
}

export interface RollbackResult {
  success: boolean
  restoredCount: number
  errors: string[]
}

// ─── 格式检测 ───────────────────────────────────────────────

/**
 * 检测遗留数据格式
 */
export function detectLegacyFormat(data: unknown): LegacyFormat {
  if (!data || typeof data !== 'object') return 'unknown'

  const obj = data as Record<string, unknown>

  // v0 纯文本格式
  if (typeof obj.text === 'string' && !obj.atoms && !obj.version) {
    return 'v0_raw_text'
  }

  // v0 JSON atoms 格式
  if (Array.isArray(obj.atoms) && (!obj.version || obj.version === '0')) {
    return 'v0_json_atoms'
  }

  // v1 部分 schema
  if (Array.isArray(obj.atoms) && obj.version === '1') {
    return 'v1_partial_schema'
  }

  // 外部导入
  if (obj.source && typeof obj.source === 'string' && obj.source !== 'memory_body') {
    return 'external_import'
  }

  return 'unknown'
}

// ─── 迁移函数 ───────────────────────────────────────────────

/**
 * 迁移遗留数据到当前 schema
 */
export function migrateLegacyData(
  legacyData: LegacyMemoryData,
  scope: MemoryScope
): MigrationResult {
  const format = legacyData.format || detectLegacyFormat(legacyData.data)
  const startedAt = new Date().toISOString()

  switch (format) {
    case 'v0_raw_text':
      return migrateV0RawText(legacyData, scope, startedAt)

    case 'v0_json_atoms':
      return migrateV0JsonAtoms(legacyData, scope, startedAt)

    case 'v1_partial_schema':
      return migrateV1PartialSchema(legacyData, scope, startedAt)

    case 'external_import':
      return migrateExternalImport(legacyData, scope, startedAt)

    default:
      return {
        atoms: [],
        report: {
          id: `migration-${Date.now()}`,
          fromFormat: format,
          fromVersion: legacyData.version,
          toVersion: '1',
          startedAt,
          completedAt: new Date().toISOString(),
          totalItems: 0,
          migrated: 0,
          skipped: 0,
          failed: 0,
          errors: [{
            index: -1,
            item: legacyData.data,
            reason: `无法识别的数据格式: ${format}`,
            severity: 'fatal'
          }],
          warnings: [],
          rollbackAvailable: false
        }
      }
  }
}

function migrateV0RawText(
  legacyData: LegacyMemoryData,
  scope: MemoryScope,
  startedAt: string
): MigrationResult {
  const data = legacyData.data as { text: string; timestamp?: string }
  const now = new Date().toISOString()
  const timestamp = data.timestamp || now

  // 将纯文本按行拆分，每行作为一条记忆
  const lines = data.text.split('\n').filter(line => line.trim().length > 0)
  const atoms: MemoryAtom[] = lines.map((line, index) => ({
    id: `migrated-v0-${Date.now()}-${index}`,
    scope,
    layer: 'semantic' as const,
    type: 'preference' as const,
    subject: 'user',
    predicate: 'mentioned',
    object: line.trim().slice(0, 100),
    content: line.trim(),
    source: 'migration' as const,
    confidence: 0.5,
    strength: 0.5,
    emotionalWeight: 0.1,
    sensitivity: 'personal' as const,
    lifecycle: 'draft' as const,
    evidence: [],
    tags: ['legacy-migration', 'v0-raw-text'],
    scenarios: ['general'],
    createdAt: timestamp,
    updatedAt: now,
    lastAccessedAt: now,
    accessCount: 0,
    contradictionOf: []
  }))

  return {
    atoms,
    report: {
      id: `migration-${Date.now()}`,
      fromFormat: 'v0_raw_text',
      fromVersion: '0',
      toVersion: '1',
      startedAt,
      completedAt: new Date().toISOString(),
      totalItems: lines.length,
      migrated: atoms.length,
      skipped: 0,
      failed: 0,
      errors: [],
      warnings: ['v0 纯文本迁移：所有记忆标记为 draft，置信度默认 0.5，建议用户审查确认'],
      rollbackAvailable: true
    }
  }
}

function migrateV0JsonAtoms(
  legacyData: LegacyMemoryData,
  scope: MemoryScope,
  startedAt: string
): MigrationResult {
  const data = legacyData.data as { atoms: Array<Record<string, unknown>> }
  const now = new Date().toISOString()
  const atoms: MemoryAtom[] = []
  const errors: MigrationError[] = []
  const warnings: string[] = []
  const skipped = 0
  let failed = 0

  for (let i = 0; i < data.atoms.length; i++) {
    const raw = data.atoms[i]

    try {
      const atom: MemoryAtom = {
        id: (raw.id as string) || `migrated-v0-${Date.now()}-${i}`,
        scope: (raw.scope as MemoryScope) || scope,
        layer: (raw.layer as MemoryAtom['layer']) || 'semantic',
        type: (raw.type as MemoryAtom['type']) || 'preference',
        subject: (raw.subject as string) || 'user',
        predicate: (raw.predicate as string) || 'mentioned',
        object: (raw.object as string) || String(raw.content || '').slice(0, 100),
        content: (raw.content as string) || JSON.stringify(raw),
        source: (raw.source as MemoryAtom['source']) || 'migration',
        confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5,
        strength: typeof raw.strength === 'number' ? raw.strength : 0.5,
        emotionalWeight: typeof raw.emotionalWeight === 'number' ? raw.emotionalWeight : 0.1,
        sensitivity: isValidSensitivity(raw.sensitivity) ? raw.sensitivity as MemoryAtom['sensitivity'] : 'personal',
        lifecycle: isValidLifecycle(raw.lifecycle) ? raw.lifecycle as MemoryAtom['lifecycle'] : 'active',
        evidence: Array.isArray(raw.evidence) ? raw.evidence as MemoryAtom['evidence'] : [],
        tags: Array.isArray(raw.tags) ? raw.tags as string[] : ['legacy-migration'],
        scenarios: Array.isArray(raw.scenarios) ? raw.scenarios as MemoryAtom['scenarios'] : ['general'],
        conditions: raw.conditions as Record<string, string | number | boolean> | undefined,
        createdAt: (raw.createdAt as string) || now,
        updatedAt: (raw.updatedAt as string) || now,
        lastAccessedAt: (raw.lastAccessedAt as string) || now,
        accessCount: typeof raw.accessCount === 'number' ? raw.accessCount : 0,
        contradictionOf: Array.isArray(raw.contradictionOf) ? raw.contradictionOf as string[] : []
      }

      atoms.push(atom)
    } catch (e) {
      failed++
      errors.push({
        index: i,
        item: raw,
        reason: `迁移失败: ${e instanceof Error ? e.message : String(e)}`,
        severity: 'error'
      })
    }
  }

  if (atoms.length > 0) {
    warnings.push(`v0 JSON 迁移完成，${atoms.length} 条记忆已迁移。部分字段使用默认值，建议审查。`)
  }

  return {
    atoms,
    report: {
      id: `migration-${Date.now()}`,
      fromFormat: 'v0_json_atoms',
      fromVersion: '0',
      toVersion: '1',
      startedAt,
      completedAt: new Date().toISOString(),
      totalItems: data.atoms.length,
      migrated: atoms.length,
      skipped,
      failed,
      errors,
      warnings,
      rollbackAvailable: true
    }
  }
}

function migrateV1PartialSchema(
  legacyData: LegacyMemoryData,
  scope: MemoryScope,
  startedAt: string
): MigrationResult {
  const data = legacyData.data as { atoms: Array<Record<string, unknown>>; version: string }
  const now = new Date().toISOString()
  const atoms: MemoryAtom[] = []
  const errors: MigrationError[] = []
  const warnings: string[] = []
  const skipped = 0
  let failed = 0

  for (let i = 0; i < data.atoms.length; i++) {
    const raw = data.atoms[i]

    try {
      // v1 部分 schema：补齐缺失字段
      const atom: MemoryAtom = {
        id: (raw.id as string) || `migrated-v1-${Date.now()}-${i}`,
        scope: (raw.scope as MemoryScope) || scope,
        layer: (raw.layer as MemoryAtom['layer']) || 'semantic',
        type: (raw.type as MemoryAtom['type']) || 'preference',
        subject: (raw.subject as string) || 'user',
        predicate: (raw.predicate as string) || 'mentioned',
        object: (raw.object as string) || String(raw.content || '').slice(0, 100),
        content: (raw.content as string) || '',
        source: (raw.source as MemoryAtom['source']) || 'migration',
        confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5,
        strength: typeof raw.strength === 'number' ? raw.strength : 0.5,
        emotionalWeight: typeof raw.emotionalWeight === 'number' ? raw.emotionalWeight : 0.1,
        sensitivity: isValidSensitivity(raw.sensitivity) ? raw.sensitivity as MemoryAtom['sensitivity'] : 'personal',
        lifecycle: isValidLifecycle(raw.lifecycle) ? raw.lifecycle as MemoryAtom['lifecycle'] : 'active',
        evidence: Array.isArray(raw.evidence) ? raw.evidence as MemoryAtom['evidence'] : [],
        tags: Array.isArray(raw.tags) ? raw.tags as string[] : [],
        scenarios: Array.isArray(raw.scenarios) ? raw.scenarios as MemoryAtom['scenarios'] : ['general'],
        conditions: raw.conditions as Record<string, string | number | boolean> | undefined,
        createdAt: (raw.createdAt as string) || now,
        updatedAt: (raw.updatedAt as string) || now,
        lastAccessedAt: (raw.lastAccessedAt as string) || now,
        accessCount: typeof raw.accessCount === 'number' ? raw.accessCount : 0,
        contradictionOf: Array.isArray(raw.contradictionOf) ? raw.contradictionOf as string[] : []
      }

      atoms.push(atom)
    } catch (e) {
      failed++
      errors.push({
        index: i,
        item: raw,
        reason: `迁移失败: ${e instanceof Error ? e.message : String(e)}`,
        severity: 'error'
      })
    }
  }

  return {
    atoms,
    report: {
      id: `migration-${Date.now()}`,
      fromFormat: 'v1_partial_schema',
      fromVersion: data.version || '1',
      toVersion: '1',
      startedAt,
      completedAt: new Date().toISOString(),
      totalItems: data.atoms.length,
      migrated: atoms.length,
      skipped,
      failed,
      errors,
      warnings,
      rollbackAvailable: true
    }
  }
}

function migrateExternalImport(
  legacyData: LegacyMemoryData,
  scope: MemoryScope,
  startedAt: string
): MigrationResult {
  const data = legacyData.data as Record<string, unknown>
  const now = new Date().toISOString()
  const atoms: MemoryAtom[] = []
  const warnings: string[] = []

  // 尝试从外部数据中提取记忆
  const items = extractItemsFromExternalData(data)

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    atoms.push({
      id: `ext-import-${Date.now()}-${i}`,
      scope,
      layer: 'semantic',
      type: 'preference',
      subject: 'user',
      predicate: 'imported',
      object: String(item).slice(0, 100),
      content: String(item),
      source: 'migration',
      confidence: 0.4,
      strength: 0.4,
      emotionalWeight: 0.1,
      sensitivity: 'personal',
      lifecycle: 'draft',
      evidence: [],
      tags: ['external-import', legacyData.source],
      scenarios: ['general'],
      createdAt: legacyData.exportedAt || now,
      updatedAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      contradictionOf: []
    })
  }

  warnings.push(`外部导入（来源：${legacyData.source}）：${atoms.length} 条记忆已导入，标记为 draft，建议审查确认`)

  return {
    atoms,
    report: {
      id: `migration-${Date.now()}`,
      fromFormat: 'external_import',
      fromVersion: legacyData.version,
      toVersion: '1',
      startedAt,
      completedAt: new Date().toISOString(),
      totalItems: items.length,
      migrated: atoms.length,
      skipped: 0,
      failed: 0,
      errors: [],
      warnings,
      rollbackAvailable: true
    }
  }
}

function extractItemsFromExternalData(data: Record<string, unknown>): string[] {
  // 尝试多种外部数据格式
  if (Array.isArray(data.items)) return data.items.map(String)
  if (Array.isArray(data.memories)) return data.memories.map(String)
  if (Array.isArray(data.entries)) return data.entries.map(String)
  if (Array.isArray(data.records)) return data.records.map(String)
  if (typeof data.text === 'string') return [data.text]
  if (typeof data.content === 'string') return [data.content]

  // 尝试将整个对象序列化
  return [JSON.stringify(data)]
}

// ─── 校验辅助 ───────────────────────────────────────────────

function isValidSensitivity(value: unknown): boolean {
  return ['public', 'personal', 'sensitive', 'private', 'forbidden'].includes(String(value))
}

function isValidLifecycle(value: unknown): boolean {
  return ['draft', 'active', 'confirmed', 'stable', 'weakening', 'archived', 'contradicted', 'protected', 'forbidden'].includes(String(value))
}

// ─── 回滚 ───────────────────────────────────────────────────

/**
 * 回滚迁移（从迁移结果中移除已迁移的 atoms）
 */
export function rollbackMigration(
  currentState: MemoryBodyState,
  migrationResult: MigrationResult
): RollbackResult {
  const migratedIds = new Set(migrationResult.atoms.map(a => a.id))
  const errors: string[] = []

  if (!migrationResult.report.rollbackAvailable) {
    return {
      success: false,
      restoredCount: 0,
      errors: ['此迁移不支持回滚']
    }
  }

  const remainingAtoms = currentState.atoms.filter(a => !migratedIds.has(a.id))
  const restoredCount = currentState.atoms.length - remainingAtoms.length

  return {
    success: true,
    restoredCount,
    errors
  }
}

/**
 * 验证迁移结果
 */
export function validateMigrationResult(result: MigrationResult): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []

  if (result.atoms.length === 0 && result.report.totalItems > 0) {
    issues.push('所有数据迁移失败')
  }

  for (const atom of result.atoms) {
    if (!atom.id) issues.push(`原子缺少 id`)
    if (!atom.content) issues.push(`原子 ${atom.id} 缺少 content`)
    if (atom.confidence < 0 || atom.confidence > 1) issues.push(`原子 ${atom.id} confidence 超出范围`)
    if (atom.strength < 0 || atom.strength > 1) issues.push(`原子 ${atom.id} strength 超出范围`)
  }

  if (result.report.errors.some(e => e.severity === 'fatal')) {
    issues.push('存在致命迁移错误')
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * 生成迁移报告摘要
 */
export function summarizeMigrationReport(report: MigrationReport): string {
  const lines: string[] = [
    `迁移报告 #${report.id}`,
    `格式：${report.fromFormat} → v${report.toVersion}`,
    `总计：${report.totalItems} | 成功：${report.migrated} | 跳过：${report.skipped} | 失败：${report.failed}`,
    `耗时：${report.startedAt} → ${report.completedAt}`,
    `可回滚：${report.rollbackAvailable ? '是' : '否'}`
  ]

  if (report.errors.length > 0) {
    lines.push(`错误：${report.errors.length} 条`)
    for (const err of report.errors.slice(0, 3)) {
      lines.push(`  • [${err.severity}] ${err.reason}`)
    }
  }

  if (report.warnings.length > 0) {
    lines.push(`警告：${report.warnings.length} 条`)
    for (const w of report.warnings.slice(0, 3)) {
      lines.push(`  • ${w}`)
    }
  }

  return lines.join('\n')
}
