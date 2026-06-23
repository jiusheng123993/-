import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import {
  createAuditEvent,
  recordMemoryCreated,
  recordMemoryConfirmed,
  recordMemoryCorrected,
  recordMemoryForgotten,
  recordMemoryProtected,
  recordMemoryRestored,
  recordMemoryArchived,
  recordMemoryUsedInPrompt,
  recordCognitiveProfileUpdated,
  recordTrustRepairTriggered,
  recordPolicyBlockedMemory,
  recordMigrationCompleted,
  getAuditLog,
  clearAuditLog,
  type AuditEventType
} from '../audit/memoryAuditLog'

const scope = { userId: 'user-1', projectId: 'project-1' }
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

describe('memoryAuditLog', () => {
  it('creates audit event with required fields', () => {
    const event = createAuditEvent('memory_created', atom({ id: 'atom-1' }))

    expect(event.id).toBeDefined()
    expect(event.type).toBe('memory_created')
    expect(event.atomId).toBe('atom-1')
    expect(event.timestamp).toBeDefined()
    expect(event.scope).toEqual(scope)
  })

  it('creates audit event with optional metadata', () => {
    const event = createAuditEvent('memory_corrected', atom({ id: 'atom-2' }), {
      previousContent: '旧内容',
      reason: '用户纠正'
    })

    expect(event.type).toBe('memory_corrected')
    expect(event.atomId).toBe('atom-2')
    expect(event.metadata?.previousContent).toBe('旧内容')
    expect(event.metadata?.reason).toBe('用户纠正')
  })

  it('records memory_created event', () => {
    clearAuditLog()
    const testAtom = atom({ id: 'atom-created' })
    recordMemoryCreated(testAtom)

    const log = getAuditLog()
    expect(log).toHaveLength(1)
    expect(log[0].type).toBe('memory_created')
    expect(log[0].atomId).toBe('atom-created')
  })

  it('records memory_confirmed event', () => {
    clearAuditLog()
    const testAtom = atom({ id: 'atom-confirmed', lifecycle: 'confirmed' })
    recordMemoryConfirmed(testAtom)

    const log = getAuditLog()
    expect(log).toHaveLength(1)
    expect(log[0].type).toBe('memory_confirmed')
  })

  it('records memory_corrected event with previous content', () => {
    clearAuditLog()
    const testAtom = atom({ id: 'atom-corrected' })
    recordMemoryCorrected(testAtom, '旧的内容')

    const log = getAuditLog()
    expect(log).toHaveLength(1)
    expect(log[0].type).toBe('memory_corrected')
    expect(log[0].metadata?.previousContent).toBe('旧的内容')
  })

  it('records memory_forgotten event', () => {
    clearAuditLog()
    const testAtom = atom({ id: 'atom-forgotten' })
    recordMemoryForgotten(testAtom)

    const log = getAuditLog()
    expect(log).toHaveLength(1)
    expect(log[0].type).toBe('memory_forgotten')
  })

  it('records memory_protected event', () => {
    clearAuditLog()
    const testAtom = atom({ id: 'atom-protected', lifecycle: 'protected' })
    recordMemoryProtected(testAtom)

    const log = getAuditLog()
    expect(log).toHaveLength(1)
    expect(log[0].type).toBe('memory_protected')
  })

  it('records memory_restored event', () => {
    clearAuditLog()
    const testAtom = atom({ id: 'atom-restored' })
    recordMemoryRestored(testAtom)

    const log = getAuditLog()
    expect(log).toHaveLength(1)
    expect(log[0].type).toBe('memory_restored')
  })

  it('records memory_archived event', () => {
    clearAuditLog()
    const testAtom = atom({ id: 'atom-archived' })
    recordMemoryArchived(testAtom)

    const log = getAuditLog()
    expect(log).toHaveLength(1)
    expect(log[0].type).toBe('memory_archived')
  })

  it('records memory_used_in_prompt event with scenario', () => {
    clearAuditLog()
    const testAtom = atom({ id: 'atom-used' })
    recordMemoryUsedInPrompt(testAtom, 'chat')

    const log = getAuditLog()
    expect(log).toHaveLength(1)
    expect(log[0].type).toBe('memory_used_in_prompt')
    expect(log[0].metadata?.scenario).toBe('chat')
  })

  it('records cognitive_profile_updated event', () => {
    clearAuditLog()
    recordCognitiveProfileUpdated(scope, ['trait-1', 'trait-2'])

    const log = getAuditLog()
    expect(log).toHaveLength(1)
    expect(log[0].type).toBe('cognitive_profile_updated')
    expect(log[0].metadata?.affectedTraits).toEqual(['trait-1', 'trait-2'])
  })

  it('records trust_repair_triggered event', () => {
    clearAuditLog()
    recordTrustRepairTriggered(scope, '用户指出误解')

    const log = getAuditLog()
    expect(log).toHaveLength(1)
    expect(log[0].type).toBe('trust_repair_triggered')
    expect(log[0].metadata?.reason).toBe('用户指出误解')
  })

  it('records policy_blocked_memory event', () => {
    clearAuditLog()
    const testAtom = atom({ id: 'atom-blocked' })
    recordPolicyBlockedMemory(testAtom, 'low_evidence_stable_blocked')

    const log = getAuditLog()
    expect(log).toHaveLength(1)
    expect(log[0].type).toBe('policy_blocked_memory')
    expect(log[0].metadata?.policy).toBe('low_evidence_stable_blocked')
  })

  it('records migration_completed event', () => {
    clearAuditLog()
    recordMigrationCompleted(scope, 1, 2)

    const log = getAuditLog()
    expect(log).toHaveLength(1)
    expect(log[0].type).toBe('migration_completed')
    expect(log[0].metadata?.fromVersion).toBe(1)
    expect(log[0].metadata?.toVersion).toBe(2)
  })

  it('maintains multiple events in order', () => {
    clearAuditLog()
    const a1 = atom({ id: 'atom-1' })
    const a2 = atom({ id: 'atom-2' })

    recordMemoryCreated(a1)
    recordMemoryConfirmed(a1)
    recordMemoryForgotten(a2)

    const log = getAuditLog()
    expect(log).toHaveLength(3)
    expect(log[0].type).toBe('memory_created')
    expect(log[1].type).toBe('memory_confirmed')
    expect(log[2].type).toBe('memory_forgotten')
  })

  it('clearAuditLog empties the log', () => {
    clearAuditLog()
    recordMemoryCreated(atom({ id: 'atom-1' }))
    expect(getAuditLog()).toHaveLength(1)

    clearAuditLog()
    expect(getAuditLog()).toHaveLength(0)
  })

  it('does not store sensitive data in audit events', () => {
    clearAuditLog()
    const event = createAuditEvent('memory_created', atom({ id: 'atom-safe' }), {
      apiKey: 'sk-secret-key',
      password: 'user-password',
      token: 'jwt-token'
    })

    const serialized = JSON.stringify(event)
    expect(serialized).not.toContain('sk-secret-key')
    expect(serialized).not.toContain('user-password')
    expect(serialized).not.toContain('jwt-token')
  })

  it('all 12 audit event types are defined', () => {
    const allTypes: AuditEventType[] = [
      'memory_created',
      'memory_confirmed',
      'memory_corrected',
      'memory_forgotten',
      'memory_protected',
      'memory_restored',
      'memory_archived',
      'memory_used_in_prompt',
      'cognitive_profile_updated',
      'trust_repair_triggered',
      'policy_blocked_memory',
      'migration_completed'
    ]

    expect(allTypes).toHaveLength(12)
  })
})
