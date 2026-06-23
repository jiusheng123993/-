import { describe, expect, it } from 'vitest'
import type { MemoryAtom } from '../core/memoryBodyTypes'
import { scoreMemoryQuality } from '../quality/memoryQuality'

const baseAtom: MemoryAtom = {
  id: 'atom-1',
  scope: { userId: 'user-1', projectId: 'project-1' },
  layer: 'semantic',
  type: 'preference',
  subject: 'user',
  predicate: 'prefers',
  object: '完整方案',
  content: '用户偏好完整方案，不接受简化版',
  source: 'chat',
  confidence: 0.8,
  strength: 0.8,
  emotionalWeight: 0.3,
  sensitivity: 'personal',
  lifecycle: 'confirmed',
  evidence: [{
    id: 'evidence-1',
    source: 'chat',
    sourceText: '要做就做最完整的方案',
    timestamp: '2026-06-23T00:00:00.000Z',
    confidence: 0.9
  }],
  tags: ['complete-solution'],
  scenarios: ['chat', 'goal_planning'],
  createdAt: '2026-06-23T00:00:00.000Z',
  updatedAt: '2026-06-23T00:00:00.000Z',
  lastAccessedAt: '2026-06-23T00:00:00.000Z',
  accessCount: 3,
  contradictionOf: []
}

describe('memoryQuality', () => {
  it('scores confirmed high-evidence memory as high value and low review need', () => {
    expect(scoreMemoryQuality(baseAtom)).toEqual({
      valueScore: 0.86,
      evidenceScore: 0.9,
      stabilityScore: 0.85,
      riskScore: 0.35,
      reviewNeed: 0.1,
      overallScore: 0.77
    })
  })

  it('raises risk and review need for sensitive draft memory', () => {
    expect(scoreMemoryQuality({
      ...baseAtom,
      id: 'atom-sensitive',
      lifecycle: 'draft',
      sensitivity: 'sensitive',
      evidence: []
    })).toEqual({
      valueScore: 0.68,
      evidenceScore: 0,
      stabilityScore: 0.25,
      riskScore: 0.8,
      reviewNeed: 0.9,
      overallScore: 0.2
    })
  })
})
