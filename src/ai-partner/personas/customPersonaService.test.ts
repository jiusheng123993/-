import { describe, it, expect, beforeEach } from 'vitest'
import { createCustomPersonaService, type CustomPersonaService } from './customPersonaService'
import { createPersonaSafetyGate, type PersonaSafetyGate } from './personaSafetyGate'
import { createSafetyIncidentLog, type SafetyIncidentLog } from './safetyIncidentLog'
import type { CustomPersonaInput } from './customPersona'
import { loadCustomPersonas, saveCustomPersonas } from './customPersona'

const AUDIT_STORAGE_KEY = 'growth-workbench-persona-audit'

function makeValidInput(overrides?: Partial<CustomPersonaInput>): CustomPersonaInput {
  return {
    name: '测试角色',
    targetUser: '测试用户',
    painPoint: '需要一个测试角色',
    primaryFlow: '测试流程',
    hero: '测试英雄描述',
    mainModuleTitle: '主模块',
    sideModuleTitle: '副模块',
    aiRole: 'coach',
    keyMetrics: ['指标1', '指标2', '指标3', '指标4'],
    modules: [
      { id: 'mod-1', title: '模块1', description: '描述1', signal: '活跃' },
      { id: 'mod-2', title: '模块2', description: '描述2', signal: '专注' },
      { id: 'mod-3', title: '模块3', description: '描述3', signal: '温暖' },
      { id: 'mod-4', title: '模块4', description: '描述4', signal: '个性化' },
    ],
    aiActions: ['daily-plan', 'task-breakdown', 'daily-review'],
    recommendedThemeId: 'minimal-premium',
    ...overrides,
  }
}

describe('CustomPersonaService', () => {
  let safetyGate: PersonaSafetyGate
  let incidentLog: SafetyIncidentLog
  let service: CustomPersonaService

  beforeEach(() => {
    incidentLog = createSafetyIncidentLog()
    safetyGate = createPersonaSafetyGate(incidentLog)
    service = createCustomPersonaService({ safetyGate, incidentLog })
    saveCustomPersonas([])
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUDIT_STORAGE_KEY)
    }
  })

  describe('createWithAudit', () => {
    it('should create a persona when all safety checks pass', () => {
      const input = makeValidInput()
      const result = service.createWithAudit('user-1', input)

      expect(result.success).toBe(true)
      expect(result.data).not.toBeNull()
      expect(result.data!.name).toBe('测试角色')
      expect(result.data!.id).toMatch(/^custom-/)
      expect(result.auditRecord.passed).toBe(true)
      expect(result.auditRecord.action).toBe('create')
      expect(result.auditRecord.userId).toBe('user-1')
    })

    it('should persist the created persona', () => {
      const input = makeValidInput()
      const result = service.createWithAudit('user-1', input)

      expect(result.success).toBe(true)
      const personas = loadCustomPersonas()
      expect(personas).toHaveLength(1)
      expect(personas[0].id).toBe(result.data!.id)
    })

    it('should block creation when name contains forbidden keyword', () => {
      const input = makeValidInput({ name: '女友角色' })
      const result = service.createWithAudit('user-1', input)

      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
      expect(result.blockedReason).toBeDefined()
      expect(result.auditRecord.passed).toBe(false)
    })

    it('should block creation when aiRole is not in whitelist', () => {
      const input = makeValidInput({ aiRole: 'hacker' })
      const result = service.createWithAudit('user-1', input)

      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
      expect(result.blockedReason).toContain('aiRole')
    })

    it('should block creation when content contains forbidden keyword', () => {
      const input = makeValidInput({ hero: '包含女友内容' })
      const result = service.createWithAudit('user-1', input)

      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
    })

    it('should log incident when creation is blocked', () => {
      const input = makeValidInput({ name: '女友角色' })
      service.createWithAudit('user-1', input)

      const incidents = incidentLog.getByUser('user-1')
      expect(incidents.length).toBeGreaterThan(0)
      expect(incidents[0].severity).toBe('high')
    })

    it('should log incident when creation passes', () => {
      const input = makeValidInput()
      service.createWithAudit('user-1', input)

      const incidents = incidentLog.getByUser('user-1')
      expect(incidents.length).toBeGreaterThan(0)
      expect(incidents[0].severity).toBe('low')
    })

    it('should run safety checks on all text fields', () => {
      const input = makeValidInput()
      const result = service.createWithAudit('user-1', input)

      expect(result.auditRecord.safetyResults).toHaveProperty('name')
      expect(result.auditRecord.safetyResults).toHaveProperty('aiRole')
      expect(result.auditRecord.safetyResults).toHaveProperty('hero')
      expect(result.auditRecord.safetyResults).toHaveProperty('painPoint')
      expect(result.auditRecord.safetyResults).toHaveProperty('primaryFlow')
      expect(result.auditRecord.safetyResults).toHaveProperty('targetUser')
    })

    it('should run safety checks on module titles and descriptions', () => {
      const input = makeValidInput()
      const result = service.createWithAudit('user-1', input)

      expect(result.auditRecord.safetyResults).toHaveProperty('module_title_mod-1')
      expect(result.auditRecord.safetyResults).toHaveProperty('module_desc_mod-1')
    })

    it('should not persist persona when blocked', () => {
      const input = makeValidInput({ name: '女友角色' })
      service.createWithAudit('user-1', input)

      const personas = loadCustomPersonas()
      expect(personas).toHaveLength(0)
    })
  })

  describe('updateWithAudit', () => {
    it('should update a persona when safety checks pass', () => {
      const createInput = makeValidInput()
      const created = service.createWithAudit('user-1', createInput)
      const personaId = created.data!.id

      const result = service.updateWithAudit('user-1', personaId, { name: '更新角色' })

      expect(result.success).toBe(true)
      expect(result.data).not.toBeNull()
      expect(result.data!.name).toBe('更新角色')
      expect(result.auditRecord.action).toBe('update')
    })

    it('should block update when name contains forbidden keyword', () => {
      const createInput = makeValidInput()
      const created = service.createWithAudit('user-1', createInput)
      const personaId = created.data!.id

      const result = service.updateWithAudit('user-1', personaId, { name: '女友更新' })

      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
      expect(result.blockedReason).toBeDefined()
    })

    it('should only check fields that are being updated', () => {
      const createInput = makeValidInput()
      const created = service.createWithAudit('user-1', createInput)
      const personaId = created.data!.id

      const result = service.updateWithAudit('user-1', personaId, { name: '新名字' })

      expect(result.success).toBe(true)
      expect(result.auditRecord.safetyResults).toHaveProperty('name')
      expect(result.auditRecord.safetyResults).not.toHaveProperty('aiRole')
    })

    it('should return null data for non-existent persona', () => {
      const result = service.updateWithAudit('user-1', 'custom-nonexistent', { name: '新名字' })

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
    })
  })

  describe('deleteWithAudit', () => {
    it('should delete a persona and log audit', () => {
      const createInput = makeValidInput()
      const created = service.createWithAudit('user-1', createInput)
      const personaId = created.data!.id

      const result = service.deleteWithAudit('user-1', personaId)

      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(result.auditRecord.action).toBe('delete')

      const personas = loadCustomPersonas()
      expect(personas).toHaveLength(0)
    })

    it('should return false for non-existent persona', () => {
      const result = service.deleteWithAudit('user-1', 'custom-nonexistent')

      expect(result.success).toBe(false)
      expect(result.data).toBe(false)
    })
  })

  describe('getAuditHistory', () => {
    it('should return all audit records', () => {
      service.createWithAudit('user-1', makeValidInput({ name: '角色A' }))
      service.createWithAudit('user-2', makeValidInput({ name: '角色B' }))

      const history = service.getAuditHistory()
      expect(history).toHaveLength(2)
    })

    it('should filter by personaId', () => {
      const created = service.createWithAudit('user-1', makeValidInput({ name: '角色A' }))
      const personaId = created.data!.id

      service.createWithAudit('user-2', makeValidInput({ name: '角色B' }))

      const history = service.getAuditHistory(personaId)
      expect(history).toHaveLength(1)
      expect(history[0].personaId).toBe(personaId)
    })
  })

  describe('getAuditHistoryByUser', () => {
    it('should filter by userId', () => {
      service.createWithAudit('user-1', makeValidInput({ name: '角色A' }))
      service.createWithAudit('user-1', makeValidInput({ name: '角色B' }))
      service.createWithAudit('user-2', makeValidInput({ name: '角色C' }))

      const history = service.getAuditHistoryByUser('user-1')
      expect(history).toHaveLength(2)
      expect(history.every((r) => r.userId === 'user-1')).toBe(true)
    })
  })

  describe('audit record structure', () => {
    it('should include all required fields in audit record', () => {
      const result = service.createWithAudit('user-1', makeValidInput())

      const record = result.auditRecord
      expect(record.id).toMatch(/^audit-/)
      expect(record.personaId).toBeTruthy()
      expect(record.action).toBe('create')
      expect(record.userId).toBe('user-1')
      expect(record.timestamp).toBeTruthy()
      expect(record.safetyResults).toBeDefined()
      expect(record.passed).toBe(true)
    })

    it('should include blockedReason when blocked', () => {
      const result = service.createWithAudit('user-1', makeValidInput({ name: '女友角色' }))

      expect(result.auditRecord.passed).toBe(false)
      expect(result.auditRecord.blockedReason).toBeDefined()
    })
  })
})
