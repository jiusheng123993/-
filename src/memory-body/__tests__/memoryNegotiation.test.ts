import { describe, expect, it } from 'vitest'
import {
  createNegotiationSession,
  addCandidateMemory,
  resolveNegotiation,
  getNegotiationQueue,
  type NegotiationResolution
} from '../negotiation/memoryNegotiation'
import type { MemoryAtom } from '../core/memoryBodyTypes'

function createTestAtom(overrides: Partial<MemoryAtom> = {}): MemoryAtom {
  return {
    id: 'test-1',
    scope: 'user',
    layer: 'preference',
    type: 'preference',
    subject: 'user',
    predicate: 'likes',
    object: 'coffee',
    content: '用户喜欢咖啡',
    source: { type: 'chat', timestamp: new Date().toISOString() },
    confidence: 0.6,
    strength: 0.5,
    emotionalWeight: 0.3,
    sensitivity: 'low',
    lifecycle: 'draft',
    evidence: [{ id: 'ev-1', source: 'chat', sourceText: '我喜欢咖啡', timestamp: new Date().toISOString(), confidence: 0.6 }],
    tags: ['food', 'preference'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    accessCount: 1,
    contradictionOf: [],
    ...overrides
  }
}

describe('MemoryNegotiation', () => {
  describe('createNegotiationSession', () => {
    it('should create a session with empty queue', () => {
      const session = createNegotiationSession()
      expect(session.id).toBeDefined()
      expect(session.candidates).toEqual([])
      expect(session.status).toBe('open')
      expect(session.createdAt).toBeDefined()
    })

    it('should create sessions with unique IDs', () => {
      const session1 = createNegotiationSession()
      const session2 = createNegotiationSession()
      expect(session1.id).not.toBe(session2.id)
    })
  })

  describe('addCandidateMemory', () => {
    it('should add a candidate memory to the session', () => {
      const session = createNegotiationSession()
      const atom = createTestAtom({ id: 'candidate-1' })

      const updated = addCandidateMemory(session, atom, 'AI 发现用户可能喜欢咖啡')

      expect(updated.candidates).toHaveLength(1)
      expect(updated.candidates[0].atom.id).toBe('candidate-1')
      expect(updated.candidates[0].reason).toBe('AI 发现用户可能喜欢咖啡')
      expect(updated.candidates[0].status).toBe('pending')
    })

    it('should not add duplicate candidates', () => {
      const session = createNegotiationSession()
      const atom = createTestAtom({ id: 'candidate-1' })

      const withOne = addCandidateMemory(session, atom, 'reason 1')
      const withTwo = addCandidateMemory(withOne, atom, 'reason 2')

      expect(withTwo.candidates).toHaveLength(1)
    })

    it('should add multiple different candidates', () => {
      const session = createNegotiationSession()
      const atom1 = createTestAtom({ id: 'candidate-1' })
      const atom2 = createTestAtom({ id: 'candidate-2' })

      const withOne = addCandidateMemory(session, atom1, 'reason 1')
      const withTwo = addCandidateMemory(withOne, atom2, 'reason 2')

      expect(withTwo.candidates).toHaveLength(2)
    })
  })

  describe('resolveNegotiation', () => {
    it('should confirm a candidate memory', () => {
      const session = createNegotiationSession()
      const atom = createTestAtom({ id: 'candidate-1' })
      const withCandidate = addCandidateMemory(session, atom, 'test reason')

      const resolution: NegotiationResolution = {
        candidateId: 'candidate-1',
        action: 'confirm',
        resolvedAt: new Date().toISOString()
      }

      const result = resolveNegotiation(withCandidate, resolution)

      expect(result.session.candidates[0].status).toBe('confirmed')
      expect(result.resolvedAtom).toBeDefined()
      expect(result.resolvedAtom!.lifecycle).toBe('confirmed')
      expect(result.resolvedAtom!.confidence).toBeGreaterThan(atom.confidence)
      expect(result.auditEvent).toBeDefined()
      expect(result.auditEvent!.type).toBe('memory_confirmed')
    })

    it('should reject a candidate memory', () => {
      const session = createNegotiationSession()
      const atom = createTestAtom({ id: 'candidate-1' })
      const withCandidate = addCandidateMemory(session, atom, 'test reason')

      const resolution: NegotiationResolution = {
        candidateId: 'candidate-1',
        action: 'reject',
        resolvedAt: new Date().toISOString()
      }

      const result = resolveNegotiation(withCandidate, resolution)

      expect(result.session.candidates[0].status).toBe('rejected')
      expect(result.resolvedAtom).toBeDefined()
      expect(result.resolvedAtom!.lifecycle).toBe('forbidden')
      expect(result.auditEvent).toBeDefined()
      expect(result.auditEvent!.type).toBe('memory_forgotten')
    })

    it('should modify a candidate memory', () => {
      const session = createNegotiationSession()
      const atom = createTestAtom({ id: 'candidate-1', content: '用户喜欢咖啡' })
      const withCandidate = addCandidateMemory(session, atom, 'test reason')

      const resolution: NegotiationResolution = {
        candidateId: 'candidate-1',
        action: 'modify',
        modifications: { content: '用户喜欢拿铁咖啡' },
        resolvedAt: new Date().toISOString()
      }

      const result = resolveNegotiation(withCandidate, resolution)

      expect(result.session.candidates[0].status).toBe('modified')
      expect(result.resolvedAtom).toBeDefined()
      expect(result.resolvedAtom!.content).toBe('用户喜欢拿铁咖啡')
      expect(result.resolvedAtom!.lifecycle).toBe('confirmed')
      expect(result.auditEvent).toBeDefined()
      expect(result.auditEvent!.type).toBe('memory_corrected')
    })

    it('should scope a candidate to current project only', () => {
      const session = createNegotiationSession()
      const atom = createTestAtom({ id: 'candidate-1', scope: 'user' })
      const withCandidate = addCandidateMemory(session, atom, 'test reason')

      const resolution: NegotiationResolution = {
        candidateId: 'candidate-1',
        action: 'scope_to_project',
        projectId: 'project-1',
        resolvedAt: new Date().toISOString()
      }

      const result = resolveNegotiation(withCandidate, resolution)

      expect(result.session.candidates[0].status).toBe('scoped')
      expect(result.resolvedAtom).toBeDefined()
      expect(result.resolvedAtom!.scope).toEqual({ userId: 'user', projectId: 'project-1' })
      expect(result.resolvedAtom!.lifecycle).toBe('confirmed')
    })

    it('should throw for unknown candidate', () => {
      const session = createNegotiationSession()

      const resolution: NegotiationResolution = {
        candidateId: 'nonexistent',
        action: 'confirm',
        resolvedAt: new Date().toISOString()
      }

      expect(() => resolveNegotiation(session, resolution)).toThrow('Candidate not found')
    })

    it('should throw for already resolved candidate', () => {
      const session = createNegotiationSession()
      const atom = createTestAtom({ id: 'candidate-1' })
      const withCandidate = addCandidateMemory(session, atom, 'test reason')

      const resolution1: NegotiationResolution = {
        candidateId: 'candidate-1',
        action: 'confirm',
        resolvedAt: new Date().toISOString()
      }

      const afterFirst = resolveNegotiation(withCandidate, resolution1)

      const resolution2: NegotiationResolution = {
        candidateId: 'candidate-1',
        action: 'reject',
        resolvedAt: new Date().toISOString()
      }

      expect(() => resolveNegotiation(afterFirst.session, resolution2)).toThrow('already resolved')
    })
  })

  describe('getNegotiationQueue', () => {
    it('should return only pending candidates', () => {
      const session = createNegotiationSession()
      const atom1 = createTestAtom({ id: 'candidate-1' })
      const atom2 = createTestAtom({ id: 'candidate-2' })
      const atom3 = createTestAtom({ id: 'candidate-3' })

      let s = addCandidateMemory(session, atom1, 'reason 1')
      s = addCandidateMemory(s, atom2, 'reason 2')
      s = addCandidateMemory(s, atom3, 'reason 3')

      const resolution: NegotiationResolution = {
        candidateId: 'candidate-1',
        action: 'confirm',
        resolvedAt: new Date().toISOString()
      }

      const afterResolve = resolveNegotiation(s, resolution)

      const queue = getNegotiationQueue(afterResolve.session)
      expect(queue).toHaveLength(2)
      expect(queue.every(c => c.status === 'pending')).toBe(true)
    })
  })
})
