import { describe, it, expect } from 'vitest'
import {
  assessMemoryInjection,
  assessFalseBeliefPersistence,
  assessCrossContextLeakage,
  assessSensitiveInference,
  assessStaleMemoryHijack,
  assessOverPersonalization,
  assessUnauthorizedMemoryUse,
  assessPromptLeakage,
  calculateRiskScore,
  determineRecommendation,
  assessCognitiveThreats,
  summarizeThreatModel,
} from '../threat/cognitiveThreatModel'
import type { MemoryAtom } from '../types'

function makeAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: 'atom-1',
    content: '用户偏好 TypeScript',
    kind: 'preference',
    scope: 'project',
    scenario: 'coding',
    lifecycle: 'active',
    status: 'active',
    confidence: 0.7,
    sensitivity: 'public',
    source: 'chat',
    evidence: [],
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    quality: 0.6,
    ...overrides,
  }
}

describe('assessMemoryInjection', () => {
  it('detects script tag injection', () => {
    const result = assessMemoryInjection('<script>alert("xss")</script>')
    expect(result.detected).toBe(true)
    expect(result.severity).toBe('critical')
  })

  it('detects javascript: protocol', () => {
    const result = assessMemoryInjection('javascript:alert(1)')
    expect(result.detected).toBe(true)
  })

  it('detects onerror handler', () => {
    const result = assessMemoryInjection('<img onerror="alert(1)">')
    expect(result.detected).toBe(true)
  })

  it('passes clean text', () => {
    const result = assessMemoryInjection('用户喜欢 TypeScript')
    expect(result.detected).toBe(false)
  })
})

describe('assessFalseBeliefPersistence', () => {
  it('detects stale high-confidence stable belief', () => {
    const atom = makeAtom({ lifecycle: 'stable', confidence: 0.9 })
    const result = assessFalseBeliefPersistence(atom, true)
    expect(result.detected).toBe(true)
    expect(result.severity).toBe('high')
  })

  it('passes when not stale', () => {
    const atom = makeAtom({ lifecycle: 'stable', confidence: 0.9 })
    const result = assessFalseBeliefPersistence(atom, false)
    expect(result.detected).toBe(false)
  })

  it('passes when confidence is low', () => {
    const atom = makeAtom({ lifecycle: 'stable', confidence: 0.5 })
    const result = assessFalseBeliefPersistence(atom, true)
    expect(result.detected).toBe(false)
  })
})

describe('assessCrossContextLeakage', () => {
  it('detects cross-context leakage for non-global atom', () => {
    const atom = makeAtom({ scope: 'project', scenario: 'coding', sensitivity: 'internal' })
    const result = assessCrossContextLeakage(atom, 'learning', 'coding')
    expect(result.detected).toBe(true)
    expect(result.severity).toBe('high')
  })

  it('passes when scenarios match', () => {
    const atom = makeAtom({ scope: 'project', scenario: 'coding', sensitivity: 'internal' })
    const result = assessCrossContextLeakage(atom, 'coding', 'coding')
    expect(result.detected).toBe(false)
  })

  it('detects cross-context leakage when scenarios differ', () => {
    const atom = makeAtom({ scenario: 'coding', sensitivity: 'internal' })
    const result = assessCrossContextLeakage(atom, 'learning', 'coding')
    expect(result.detected).toBe(true)
    expect(result.severity).toBe('high')
  })

  it('passes for public sensitivity', () => {
    const atom = makeAtom({ scope: 'project', scenario: 'coding', sensitivity: 'public' })
    const result = assessCrossContextLeakage(atom, 'learning', 'coding')
    expect(result.detected).toBe(false)
  })
})

describe('assessSensitiveInference', () => {
  it('detects sensitive content not marked as sensitive', () => {
    const atom = makeAtom({ sensitivity: 'public' })
    const result = assessSensitiveInference(atom, true)
    expect(result.detected).toBe(true)
    expect(result.severity).toBe('high')
  })

  it('passes when already marked sensitive', () => {
    const atom = makeAtom({ sensitivity: 'sensitive' })
    const result = assessSensitiveInference(atom, true)
    expect(result.detected).toBe(false)
  })

  it('passes when not sensitive', () => {
    const atom = makeAtom({ sensitivity: 'public' })
    const result = assessSensitiveInference(atom, false)
    expect(result.detected).toBe(false)
  })
})

describe('assessStaleMemoryHijack', () => {
  it('detects stale non-archived memory with high confidence', () => {
    const atom = makeAtom({ lifecycle: 'active', confidence: 0.7 })
    const result = assessStaleMemoryHijack(atom, true)
    expect(result.detected).toBe(true)
    expect(result.severity).toBe('medium')
  })

  it('passes when archived', () => {
    const atom = makeAtom({ lifecycle: 'archived', confidence: 0.7 })
    const result = assessStaleMemoryHijack(atom, true)
    expect(result.detected).toBe(false)
  })

  it('passes when not stale', () => {
    const atom = makeAtom({ lifecycle: 'active', confidence: 0.7 })
    const result = assessStaleMemoryHijack(atom, false)
    expect(result.detected).toBe(false)
  })
})

describe('assessOverPersonalization', () => {
  it('detects low-confidence global personalization', () => {
    const atom = makeAtom({ scope: 'global', confidence: 0.5 })
    const result = assessOverPersonalization(true, atom)
    expect(result.detected).toBe(true)
    expect(result.severity).toBe('medium')
  })

  it('passes when not personalized', () => {
    const atom = makeAtom({ scope: 'global', confidence: 0.5 })
    const result = assessOverPersonalization(false, atom)
    expect(result.detected).toBe(false)
  })

  it('passes when high confidence', () => {
    const atom = makeAtom({ scope: 'global', confidence: 0.8 })
    const result = assessOverPersonalization(true, atom)
    expect(result.detected).toBe(false)
  })
})

describe('assessUnauthorizedMemoryUse', () => {
  it('detects unauthorized use of non-public memory', () => {
    const atom = makeAtom({ sensitivity: 'internal' })
    const result = assessUnauthorizedMemoryUse(false, atom)
    expect(result.detected).toBe(true)
    expect(result.severity).toBe('critical')
  })

  it('passes when authorized', () => {
    const atom = makeAtom({ sensitivity: 'internal' })
    const result = assessUnauthorizedMemoryUse(true, atom)
    expect(result.detected).toBe(false)
  })

  it('passes for public memory', () => {
    const atom = makeAtom({ sensitivity: 'public' })
    const result = assessUnauthorizedMemoryUse(false, atom)
    expect(result.detected).toBe(false)
  })
})

describe('assessPromptLeakage', () => {
  it('detects sensitive keyword in prompt', () => {
    const atom = makeAtom()
    const result = assessPromptLeakage('user password is 12345', atom)
    expect(result.detected).toBe(true)
    expect(result.severity).toBe('critical')
  })

  it('detects private atom in prompt', () => {
    const atom = makeAtom({ sensitivity: 'private' })
    const result = assessPromptLeakage('some context', atom)
    expect(result.detected).toBe(true)
  })

  it('passes clean prompt with public atom', () => {
    const atom = makeAtom({ sensitivity: 'public' })
    const result = assessPromptLeakage('用户喜欢 TypeScript', atom)
    expect(result.detected).toBe(false)
  })
})

describe('calculateRiskScore', () => {
  it('returns 0 for no detected threats', () => {
    const threats = [
      assessMemoryInjection('clean text'),
      assessFalseBeliefPersistence(makeAtom(), false),
    ]
    expect(calculateRiskScore(threats)).toBe(0)
  })

  it('calculates weighted score for detected threats', () => {
    const threats = [
      assessMemoryInjection('<script>'),
      assessUnauthorizedMemoryUse(false, makeAtom({ sensitivity: 'internal' })),
    ]
    const score = calculateRiskScore(threats)
    expect(score).toBe(20)
  })
})

describe('determineRecommendation', () => {
  it('returns block for critical threats', () => {
    const threats = [assessMemoryInjection('<script>')]
    expect(determineRecommendation(threats, 10)).toBe('block')
  })

  it('returns block for high risk score', () => {
    const threats = [assessFalseBeliefPersistence(makeAtom({ lifecycle: 'stable', confidence: 0.9 }), true)]
    expect(determineRecommendation(threats, 20)).toBe('block')
  })

  it('returns review for medium risk', () => {
    expect(determineRecommendation([], 10)).toBe('review')
  })

  it('returns warn for low risk', () => {
    expect(determineRecommendation([], 5)).toBe('warn')
  })

  it('returns allow for no risk', () => {
    expect(determineRecommendation([], 0)).toBe('allow')
  })
})

describe('assessCognitiveThreats', () => {
  it('returns safe for clean input', () => {
    const atom = makeAtom()
    const result = assessCognitiveThreats({
      atom,
      sourceText: '用户喜欢 TypeScript',
      currentScenario: 'coding',
      atomScenario: 'coding',
      isSensitive: false,
      isStale: false,
      isPersonalized: false,
      isAuthorized: true,
      promptContext: '',
    })
    expect(result.safe).toBe(true)
    expect(result.recommendation).toBe('allow')
  })

  it('detects injection threat', () => {
    const atom = makeAtom()
    const result = assessCognitiveThreats({
      atom,
      sourceText: '<script>alert(1)</script>',
      currentScenario: 'coding',
      atomScenario: 'coding',
      isSensitive: false,
      isStale: false,
      isPersonalized: false,
      isAuthorized: true,
      promptContext: '',
    })
    expect(result.safe).toBe(false)
    expect(result.recommendation).toBe('block')
    expect(result.blockedThreats.length).toBeGreaterThan(0)
  })

  it('detects cross-context leakage', () => {
    const atom = makeAtom({ scope: 'project', scenario: 'coding', sensitivity: 'internal' })
    const result = assessCognitiveThreats({
      atom,
      sourceText: 'clean text',
      currentScenario: 'learning',
      atomScenario: 'coding',
      isSensitive: false,
      isStale: false,
      isPersonalized: false,
      isAuthorized: true,
      promptContext: '',
    })
    expect(result.safe).toBe(false)
    expect(result.blockedThreats.some((t) => t.type === 'cross_context_leakage')).toBe(true)
  })

  it('detects unauthorized use', () => {
    const atom = makeAtom({ sensitivity: 'internal' })
    const result = assessCognitiveThreats({
      atom,
      sourceText: 'clean text',
      currentScenario: 'coding',
      atomScenario: 'coding',
      isSensitive: false,
      isStale: false,
      isPersonalized: false,
      isAuthorized: false,
      promptContext: '',
    })
    expect(result.safe).toBe(false)
    expect(result.blockedThreats.some((t) => t.type === 'unauthorized_memory_use')).toBe(true)
  })
})

describe('summarizeThreatModel', () => {
  it('summarizes safe result', () => {
    const atom = makeAtom()
    const result = assessCognitiveThreats({
      atom,
      sourceText: 'clean text',
      currentScenario: 'coding',
      atomScenario: 'coding',
      isSensitive: false,
      isStale: false,
      isPersonalized: false,
      isAuthorized: true,
      promptContext: '',
    })
    const summary = summarizeThreatModel(result)
    expect(summary).toContain('安全')
    expect(summary).toContain('allow')
  })

  it('summarizes unsafe result', () => {
    const atom = makeAtom()
    const result = assessCognitiveThreats({
      atom,
      sourceText: '<script>',
      currentScenario: 'coding',
      atomScenario: 'coding',
      isSensitive: false,
      isStale: false,
      isPersonalized: false,
      isAuthorized: true,
      promptContext: '',
    })
    const summary = summarizeThreatModel(result)
    expect(summary).toContain('存在威胁')
    expect(summary).toContain('block')
  })
})
