import type { CustomPersona, CustomPersonaId, CustomPersonaInput } from './customPersona'
import {
  addCustomPersona,
  deleteCustomPersona,
  loadCustomPersonas,
  updateCustomPersona
} from './customPersona'
import type { PersonaSafetyGate, SafetyCheckResult } from './personaSafetyGate'
import type { SafetyIncidentLog } from './safetyIncidentLog'

export type AuditAction = 'create' | 'update' | 'delete'

export interface AuditRecord {
  id: string
  personaId: CustomPersonaId
  action: AuditAction
  userId: string
  timestamp: string
  safetyResults: Record<string, SafetyCheckResult>
  passed: boolean
  blockedReason?: string
}

export interface CustomPersonaServiceConfig {
  safetyGate: PersonaSafetyGate
  incidentLog: SafetyIncidentLog
}

export interface CustomPersonaService {
  createWithAudit(userId: string, input: CustomPersonaInput): AuditResult<CustomPersona>
  updateWithAudit(userId: string, id: CustomPersonaId, updates: Partial<CustomPersonaInput>): AuditResult<CustomPersona | null>
  deleteWithAudit(userId: string, id: CustomPersonaId): AuditResult<boolean>
  getAuditHistory(personaId?: CustomPersonaId): AuditRecord[]
  getAuditHistoryByUser(userId: string): AuditRecord[]
}

export interface AuditResult<T> {
  success: boolean
  data: T | null
  auditRecord: AuditRecord
  blockedReason?: string
}

const AUDIT_STORAGE_KEY = 'growth-workbench-persona-audit'

function generateAuditId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function loadAuditRecords(): AuditRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = window.localStorage.getItem(AUDIT_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as AuditRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveAuditRecords(records: AuditRecord[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(records))
}

export function clearAuditRecords(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUDIT_STORAGE_KEY)
}

function addAuditRecord(record: AuditRecord): void {
  const records = loadAuditRecords()
  records.push(record)
  saveAuditRecords(records)
}

function runCreateSafetyChecks(
  safetyGate: PersonaSafetyGate,
  input: CustomPersonaInput
): Record<string, SafetyCheckResult> {
  const results: Record<string, SafetyCheckResult> = {}

  results.name = safetyGate.validateName(input.name)
  results.aiRole = safetyGate.validateIdentityRole(input.aiRole)
  results.hero = safetyGate.validateContent(input.hero)
  results.painPoint = safetyGate.validateContent(input.painPoint)
  results.primaryFlow = safetyGate.validateContent(input.primaryFlow)
  results.targetUser = safetyGate.validateContent(input.targetUser)

  if (input.mainModuleTitle) {
    results.mainModuleTitle = safetyGate.validateContent(input.mainModuleTitle)
  }
  if (input.sideModuleTitle) {
    results.sideModuleTitle = safetyGate.validateContent(input.sideModuleTitle)
  }

  for (const module of input.modules) {
    if (module.title) {
      results[`module_title_${module.id}`] = safetyGate.validateContent(module.title)
    }
    if (module.description) {
      results[`module_desc_${module.id}`] = safetyGate.validateContent(module.description)
    }
  }

  return results
}

function runUpdateSafetyChecks(
  safetyGate: PersonaSafetyGate,
  updates: Partial<CustomPersonaInput>
): Record<string, SafetyCheckResult> {
  const results: Record<string, SafetyCheckResult> = {}

  if (updates.name !== undefined) {
    results.name = safetyGate.validateName(updates.name)
  }
  if (updates.aiRole !== undefined) {
    results.aiRole = safetyGate.validateIdentityRole(updates.aiRole)
  }
  if (updates.hero !== undefined) {
    results.hero = safetyGate.validateContent(updates.hero)
  }
  if (updates.painPoint !== undefined) {
    results.painPoint = safetyGate.validateContent(updates.painPoint)
  }
  if (updates.primaryFlow !== undefined) {
    results.primaryFlow = safetyGate.validateContent(updates.primaryFlow)
  }
  if (updates.targetUser !== undefined) {
    results.targetUser = safetyGate.validateContent(updates.targetUser)
  }
  if (updates.mainModuleTitle !== undefined) {
    results.mainModuleTitle = safetyGate.validateContent(updates.mainModuleTitle)
  }
  if (updates.sideModuleTitle !== undefined) {
    results.sideModuleTitle = safetyGate.validateContent(updates.sideModuleTitle)
  }

  if (updates.modules) {
    for (const module of updates.modules) {
      if (module.title) {
        results[`module_title_${module.id}`] = safetyGate.validateContent(module.title)
      }
      if (module.description) {
        results[`module_desc_${module.id}`] = safetyGate.validateContent(module.description)
      }
    }
  }

  return results
}

function allChecksPassed(results: Record<string, SafetyCheckResult>): boolean {
  return Object.values(results).every((r) => r.ok)
}

function getFirstBlockedReason(results: Record<string, SafetyCheckResult>): string {
  for (const [field, result] of Object.entries(results)) {
    if (!result.ok) {
      return `[${field}] ${result.reason}`
    }
  }
  return '未知审核原因'
}

export function createCustomPersonaService(config: CustomPersonaServiceConfig): CustomPersonaService {
  const { safetyGate, incidentLog } = config

  return {
    createWithAudit(userId: string, input: CustomPersonaInput): AuditResult<CustomPersona> {
      const safetyResults = runCreateSafetyChecks(safetyGate, input)
      const passed = allChecksPassed(safetyResults)

      const auditRecord: AuditRecord = {
        id: generateAuditId(),
        personaId: '' as CustomPersonaId,
        action: 'create',
        userId,
        timestamp: new Date().toISOString(),
        safetyResults,
        passed
      }

      if (!passed) {
        const blockedReason = getFirstBlockedReason(safetyResults)
        auditRecord.blockedReason = blockedReason

        incidentLog.log({
          userId,
          category: 'content_violation',
          severity: 'high',
          description: `自定义 Persona 创建审核未通过: ${blockedReason}`,
          context: { input: JSON.stringify(input).slice(0, 200), safetyResults }
        })

        addAuditRecord(auditRecord)
        return { success: false, data: null, auditRecord, blockedReason }
      }

      const persona = addCustomPersona(input)
      auditRecord.personaId = persona.id

      incidentLog.log({
        userId,
        category: 'content_violation',
        severity: 'low',
        description: `自定义 Persona "${input.name}" 创建审核通过`,
        context: { personaId: persona.id }
      })

      addAuditRecord(auditRecord)
      return { success: true, data: persona, auditRecord }
    },

    updateWithAudit(
      userId: string,
      id: CustomPersonaId,
      updates: Partial<CustomPersonaInput>
    ): AuditResult<CustomPersona | null> {
      const safetyResults = runUpdateSafetyChecks(safetyGate, updates)
      const passed = allChecksPassed(safetyResults)

      const auditRecord: AuditRecord = {
        id: generateAuditId(),
        personaId: id,
        action: 'update',
        userId,
        timestamp: new Date().toISOString(),
        safetyResults,
        passed
      }

      if (!passed) {
        const blockedReason = getFirstBlockedReason(safetyResults)
        auditRecord.blockedReason = blockedReason

        incidentLog.log({
          userId,
          category: 'content_violation',
          severity: 'high',
          description: `自定义 Persona ${id} 更新审核未通过: ${blockedReason}`,
          context: { personaId: id, updates: JSON.stringify(updates).slice(0, 200) }
        })

        addAuditRecord(auditRecord)
        return { success: false, data: null, auditRecord, blockedReason }
      }

      const updated = updateCustomPersona(id, updates)

      incidentLog.log({
        userId,
        category: 'content_violation',
        severity: 'low',
        description: `自定义 Persona ${id} 更新审核通过`,
        context: { personaId: id }
      })

      addAuditRecord(auditRecord)
      return { success: true, data: updated, auditRecord }
    },

    deleteWithAudit(userId: string, id: CustomPersonaId): AuditResult<boolean> {
      const auditRecord: AuditRecord = {
        id: generateAuditId(),
        personaId: id,
        action: 'delete',
        userId,
        timestamp: new Date().toISOString(),
        safetyResults: {},
        passed: true
      }

      const deleted = deleteCustomPersona(id)

      incidentLog.log({
        userId,
        category: 'content_violation',
        severity: 'low',
        description: `自定义 Persona ${id} 已删除`,
        context: { personaId: id }
      })

      addAuditRecord(auditRecord)
      return { success: deleted, data: deleted, auditRecord }
    },

    getAuditHistory(personaId?: CustomPersonaId): AuditRecord[] {
      const records = loadAuditRecords()
      if (personaId) {
        return records.filter((r) => r.personaId === personaId)
      }
      return records
    },

    getAuditHistoryByUser(userId: string): AuditRecord[] {
      const records = loadAuditRecords()
      return records.filter((r) => r.userId === userId)
    }
  }
}
