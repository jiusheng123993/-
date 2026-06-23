import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import {
  createProvenance,
  recordEvidence,
  recordReinforcement,
  recordCorrection,
  recordUsage,
  recordMigration,
  recordRollback,
  recordTrustImpact,
  getProvenanceChain
} from '../audit/memoryProvenance'

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

describe('memoryProvenance', () => {
  it('creates provenance with origin event', () => {
    const provenance = createProvenance(atom({ id: 'atom-1' }))

    expect(provenance.atomId).toBe('atom-1')
    expect(provenance.originEvent).toBeDefined()
    expect(provenance.originEvent.type).toBe('origin')
    expect(provenance.originEvent.atomSnapshot).toBeDefined()
    expect(provenance.evidenceChain).toEqual([])
    expect(provenance.reinforcementEvents).toEqual([])
    expect(provenance.correctionEvents).toEqual([])
    expect(provenance.usageEvents).toEqual([])
    expect(provenance.migrationEvents).toEqual([])
    expect(provenance.rollbackEvents).toEqual([])
    expect(provenance.trustImpactEvents).toEqual([])
  })

  it('records origin event with source info', () => {
    const provenance = createProvenance(atom({ id: 'atom-2', source: 'chat' }))

    expect(provenance.originEvent.source).toBe('chat')
    expect(provenance.originEvent.timestamp).toBeDefined()
  })

  it('records evidence in evidence chain', () => {
    const provenance = createProvenance(atom({ id: 'atom-3' }))
    recordEvidence(provenance, {
      source: 'chat',
      sourceText: '用户再次提到喜欢西瓜',
      timestamp: '2026-06-24T00:00:00.000Z',
      confidence: 0.9
    })

    expect(provenance.evidenceChain).toHaveLength(1)
    expect(provenance.evidenceChain[0].source).toBe('chat')
    expect(provenance.evidenceChain[0].sourceText).toBe('用户再次提到喜欢西瓜')
    expect(provenance.evidenceChain[0].confidence).toBe(0.9)
  })

  it('records reinforcement events', () => {
    const provenance = createProvenance(atom({ id: 'atom-4' }))
    recordReinforcement(provenance, {
      source: 'chat',
      confidenceBefore: 0.7,
      confidenceAfter: 0.85,
      timestamp: '2026-06-24T00:00:00.000Z'
    })

    expect(provenance.reinforcementEvents).toHaveLength(1)
    expect(provenance.reinforcementEvents[0].confidenceBefore).toBe(0.7)
    expect(provenance.reinforcementEvents[0].confidenceAfter).toBe(0.85)
  })

  it('records correction events with previous content', () => {
    const provenance = createProvenance(atom({ id: 'atom-5' }))
    recordCorrection(provenance, {
      previousContent: '用户喜欢苹果',
      newContent: '用户喜欢西瓜',
      reason: '用户纠正',
      timestamp: '2026-06-24T00:00:00.000Z'
    })

    expect(provenance.correctionEvents).toHaveLength(1)
    expect(provenance.correctionEvents[0].previousContent).toBe('用户喜欢苹果')
    expect(provenance.correctionEvents[0].newContent).toBe('用户喜欢西瓜')
    expect(provenance.correctionEvents[0].reason).toBe('用户纠正')
  })

  it('records usage events with scenario', () => {
    const provenance = createProvenance(atom({ id: 'atom-6' }))
    recordUsage(provenance, {
      scenario: 'chat',
      timestamp: '2026-06-24T00:00:00.000Z'
    })

    expect(provenance.usageEvents).toHaveLength(1)
    expect(provenance.usageEvents[0].scenario).toBe('chat')
  })

  it('records migration events', () => {
    const provenance = createProvenance(atom({ id: 'atom-7' }))
    recordMigration(provenance, {
      fromVersion: 1,
      toVersion: 2,
      timestamp: '2026-06-24T00:00:00.000Z'
    })

    expect(provenance.migrationEvents).toHaveLength(1)
    expect(provenance.migrationEvents[0].fromVersion).toBe(1)
    expect(provenance.migrationEvents[0].toVersion).toBe(2)
  })

  it('records rollback events', () => {
    const provenance = createProvenance(atom({ id: 'atom-8' }))
    recordRollback(provenance, {
      reason: '用户要求回滚',
      restoredContent: '用户喜欢苹果',
      timestamp: '2026-06-24T00:00:00.000Z'
    })

    expect(provenance.rollbackEvents).toHaveLength(1)
    expect(provenance.rollbackEvents[0].reason).toBe('用户要求回滚')
    expect(provenance.rollbackEvents[0].restoredContent).toBe('用户喜欢苹果')
  })

  it('records trust impact events', () => {
    const provenance = createProvenance(atom({ id: 'atom-9' }))
    recordTrustImpact(provenance, {
      impact: 'confidence_reduced',
      reason: '用户指出不准确',
      confidenceBefore: 0.9,
      confidenceAfter: 0.5,
      timestamp: '2026-06-24T00:00:00.000Z'
    })

    expect(provenance.trustImpactEvents).toHaveLength(1)
    expect(provenance.trustImpactEvents[0].impact).toBe('confidence_reduced')
    expect(provenance.trustImpactEvents[0].confidenceBefore).toBe(0.9)
    expect(provenance.trustImpactEvents[0].confidenceAfter).toBe(0.5)
  })

  it('getProvenanceChain returns ordered events', () => {
    const provenance = createProvenance(atom({ id: 'atom-10' }))
    recordEvidence(provenance, {
      source: 'chat',
      sourceText: '证据1',
      timestamp: '2026-06-24T00:00:00.000Z',
      confidence: 0.8
    })
    recordReinforcement(provenance, {
      source: 'chat',
      confidenceBefore: 0.7,
      confidenceAfter: 0.85,
      timestamp: '2026-06-25T00:00:00.000Z'
    })
    recordCorrection(provenance, {
      previousContent: '旧',
      newContent: '新',
      reason: '纠正',
      timestamp: '2026-06-26T00:00:00.000Z'
    })

    const chain = getProvenanceChain(provenance)
    expect(chain).toHaveLength(4)
    expect(chain[0].type).toBe('origin')
    expect(chain[1].type).toBe('evidence')
    expect(chain[2].type).toBe('reinforcement')
    expect(chain[3].type).toBe('correction')
  })

  it('getProvenanceChain returns empty array for empty provenance', () => {
    const provenance = createProvenance(atom({ id: 'atom-empty' }))
    const chain = getProvenanceChain(provenance)
    expect(chain).toHaveLength(1)
    expect(chain[0].type).toBe('origin')
  })

  it('origin event stores atom snapshot without sensitive data', () => {
    const provenance = createProvenance(atom({
      id: 'atom-safe',
      content: '正常内容',
      sensitivity: 'personal'
    }))

    const snapshot = provenance.originEvent.atomSnapshot
    expect(snapshot.content).toBe('正常内容')
    expect(snapshot.sensitivity).toBe('personal')
  })
})
