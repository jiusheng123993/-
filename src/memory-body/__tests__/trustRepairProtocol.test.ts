import { describe, expect, it } from 'vitest'
import {
  initiateTrustRepair,
  executeRepairStep,
  getRepairStatus,
  completeTrustRepair,
  type RepairStep
} from '../repair/trustRepairProtocol'
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
    confidence: 0.8,
    strength: 0.7,
    emotionalWeight: 0.3,
    sensitivity: 'low',
    lifecycle: 'active',
    evidence: [
      { id: 'ev-1', source: 'chat', sourceText: '我喜欢咖啡', timestamp: new Date().toISOString(), confidence: 0.8 }
    ],
    tags: ['food', 'preference'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    accessCount: 5,
    contradictionOf: [],
    ...overrides
  }
}

describe('TrustRepairProtocol', () => {
  describe('initiateTrustRepair', () => {
    it('should create a repair session with the first step', () => {
      const wrongAtom = createTestAtom({ id: 'wrong-1', content: '用户喜欢茶' })
      const session = initiateTrustRepair({
        userComplaint: '我不喜欢茶，我喜欢咖啡',
        wrongMemories: [wrongAtom],
        correctContent: '用户喜欢咖啡'
      })

      expect(session.id).toBeDefined()
      expect(session.userComplaint).toBe('我不喜欢茶，我喜欢咖啡')
      expect(session.wrongMemories).toHaveLength(1)
      expect(session.correctContent).toBe('用户喜欢咖啡')
      expect(session.currentStep).toBe('acknowledge_error')
      expect(session.status).toBe('in_progress')
      expect(session.steps).toHaveLength(1)
      expect(session.steps[0].step).toBe('acknowledge_error')
      expect(session.steps[0].status).toBe('completed')
    })

    it('should create sessions with unique IDs', () => {
      const atom = createTestAtom({ id: 'wrong-1' })
      const session1 = initiateTrustRepair({
        userComplaint: '错误1',
        wrongMemories: [atom],
        correctContent: '正确1'
      })
      const session2 = initiateTrustRepair({
        userComplaint: '错误2',
        wrongMemories: [atom],
        correctContent: '正确2'
      })
      expect(session1.id).not.toBe(session2.id)
    })
  })

  describe('executeRepairStep', () => {
    it('should execute identifyWrongMemory step', () => {
      const wrongAtom = createTestAtom({ id: 'wrong-1', content: '用户喜欢茶' })
      let session = initiateTrustRepair({
        userComplaint: '我不喜欢茶',
        wrongMemories: [wrongAtom],
        correctContent: '用户喜欢咖啡'
      })

      const result = executeRepairStep(session, 'identify_wrong_memory')
      session = result.session

      expect(result.success).toBe(true)
      expect(session.currentStep).toBe('identify_wrong_memory')
      expect(session.steps).toHaveLength(2)
      expect(session.steps[1].step).toBe('identify_wrong_memory')
      expect(session.steps[1].status).toBe('completed')
      expect(session.identifiedWrongAtomIds).toContain('wrong-1')
    })

    it('should execute correctMemory step', () => {
      const wrongAtom = createTestAtom({ id: 'wrong-1', content: '用户喜欢茶' })
      let session = initiateTrustRepair({
        userComplaint: '我不喜欢茶',
        wrongMemories: [wrongAtom],
        correctContent: '用户喜欢咖啡'
      })

      session = executeRepairStep(session, 'identify_wrong_memory').session
      const result = executeRepairStep(session, 'correct_memory')
      session = result.session

      expect(result.success).toBe(true)
      expect(session.currentStep).toBe('correct_memory')
      expect(result.correctedAtoms).toBeDefined()
      expect(result.correctedAtoms!.length).toBeGreaterThan(0)
      expect(result.correctedAtoms![0].content).toBe('用户喜欢咖啡')
      expect(result.correctedAtoms![0].lifecycle).toBe('corrected')
    })

    it('should execute recordLesson step', () => {
      const wrongAtom = createTestAtom({ id: 'wrong-1', content: '用户喜欢茶' })
      let session = initiateTrustRepair({
        userComplaint: '我不喜欢茶',
        wrongMemories: [wrongAtom],
        correctContent: '用户喜欢咖啡'
      })

      session = executeRepairStep(session, 'identify_wrong_memory').session
      session = executeRepairStep(session, 'correct_memory').session
      const result = executeRepairStep(session, 'record_lesson')
      session = result.session

      expect(result.success).toBe(true)
      expect(session.currentStep).toBe('record_lesson')
      expect(session.misunderstandingRecord).toBeDefined()
      expect(session.misunderstandingRecord!.wrongPattern).toContain('茶')
      expect(session.misunderstandingRecord!.correctPattern).toContain('咖啡')
    })

    it('should execute reduceConfidence step', () => {
      const wrongAtom = createTestAtom({ id: 'wrong-1', content: '用户喜欢茶', confidence: 0.9 })
      let session = initiateTrustRepair({
        userComplaint: '我不喜欢茶',
        wrongMemories: [wrongAtom],
        correctContent: '用户喜欢咖啡'
      })

      session = executeRepairStep(session, 'identify_wrong_memory').session
      session = executeRepairStep(session, 'correct_memory').session
      session = executeRepairStep(session, 'record_lesson').session
      const result = executeRepairStep(session, 'reduce_confidence')
      session = result.session

      expect(result.success).toBe(true)
      expect(session.currentStep).toBe('reduce_confidence')
      expect(result.confidenceReductions).toBeDefined()
      expect(result.confidenceReductions!.length).toBeGreaterThan(0)
      expect(result.confidenceReductions![0].previousConfidence).toBe(0.9)
      expect(result.confidenceReductions![0].newConfidence).toBeLessThan(0.9)
    })

    it('should execute showWhatChanged step', () => {
      const wrongAtom = createTestAtom({ id: 'wrong-1', content: '用户喜欢茶' })
      let session = initiateTrustRepair({
        userComplaint: '我不喜欢茶',
        wrongMemories: [wrongAtom],
        correctContent: '用户喜欢咖啡'
      })

      session = executeRepairStep(session, 'identify_wrong_memory').session
      session = executeRepairStep(session, 'correct_memory').session
      session = executeRepairStep(session, 'record_lesson').session
      session = executeRepairStep(session, 'reduce_confidence').session
      const result = executeRepairStep(session, 'show_what_changed')
      session = result.session

      expect(result.success).toBe(true)
      expect(session.currentStep).toBe('show_what_changed')
      expect(result.changeSummary).toBeDefined()
      expect(result.changeSummary!).toContain('咖啡')
    })

    it('should execute preventRepeat step', () => {
      const wrongAtom = createTestAtom({ id: 'wrong-1', content: '用户喜欢茶' })
      let session = initiateTrustRepair({
        userComplaint: '我不喜欢茶',
        wrongMemories: [wrongAtom],
        correctContent: '用户喜欢咖啡'
      })

      session = executeRepairStep(session, 'identify_wrong_memory').session
      session = executeRepairStep(session, 'correct_memory').session
      session = executeRepairStep(session, 'record_lesson').session
      session = executeRepairStep(session, 'reduce_confidence').session
      session = executeRepairStep(session, 'show_what_changed').session
      const result = executeRepairStep(session, 'prevent_repeat')
      session = result.session

      expect(result.success).toBe(true)
      expect(session.currentStep).toBe('prevent_repeat')
      expect(session.futureGuard).toBeDefined()
      expect(session.futureGuard!.pattern).toContain('茶')
    })

    it('should throw for invalid step order', () => {
      const wrongAtom = createTestAtom({ id: 'wrong-1', content: '用户喜欢茶' })
      const session = initiateTrustRepair({
        userComplaint: '我不喜欢茶',
        wrongMemories: [wrongAtom],
        correctContent: '用户喜欢咖啡'
      })

      expect(() => executeRepairStep(session, 'correct_memory')).toThrow()
    })

    it('should throw for unknown step', () => {
      const wrongAtom = createTestAtom({ id: 'wrong-1', content: '用户喜欢茶' })
      const session = initiateTrustRepair({
        userComplaint: '我不喜欢茶',
        wrongMemories: [wrongAtom],
        correctContent: '用户喜欢咖啡'
      })

      expect(() => executeRepairStep(session, 'unknown_step' as RepairStep)).toThrow()
    })
  })

  describe('getRepairStatus', () => {
    it('should return current repair progress', () => {
      const wrongAtom = createTestAtom({ id: 'wrong-1', content: '用户喜欢茶' })
      let session = initiateTrustRepair({
        userComplaint: '我不喜欢茶',
        wrongMemories: [wrongAtom],
        correctContent: '用户喜欢咖啡'
      })

      let status = getRepairStatus(session)
      expect(status.completedSteps).toBe(1)
      expect(status.totalSteps).toBe(7)
      expect(status.isComplete).toBe(false)

      session = executeRepairStep(session, 'identify_wrong_memory').session
      session = executeRepairStep(session, 'correct_memory').session

      status = getRepairStatus(session)
      expect(status.completedSteps).toBe(3)
    })
  })

  describe('completeTrustRepair', () => {
    it('should complete the repair and return final result', () => {
      const wrongAtom = createTestAtom({ id: 'wrong-1', content: '用户喜欢茶' })
      let session = initiateTrustRepair({
        userComplaint: '我不喜欢茶',
        wrongMemories: [wrongAtom],
        correctContent: '用户喜欢咖啡'
      })

      session = executeRepairStep(session, 'identify_wrong_memory').session
      session = executeRepairStep(session, 'correct_memory').session
      session = executeRepairStep(session, 'record_lesson').session
      session = executeRepairStep(session, 'reduce_confidence').session
      session = executeRepairStep(session, 'show_what_changed').session
      session = executeRepairStep(session, 'prevent_repeat').session

      const result = completeTrustRepair(session)

      expect(result.session.status).toBe('completed')
      expect(result.auditEvent).toBeDefined()
      expect(result.auditEvent!.type).toBe('trust_repair_triggered')
      expect(result.correctedAtoms).toBeDefined()
      expect(result.misunderstandingRecord).toBeDefined()
      expect(result.futureGuard).toBeDefined()
    })

    it('should throw if not all steps completed', () => {
      const wrongAtom = createTestAtom({ id: 'wrong-1', content: '用户喜欢茶' })
      const session = initiateTrustRepair({
        userComplaint: '我不喜欢茶',
        wrongMemories: [wrongAtom],
        correctContent: '用户喜欢咖啡'
      })

      expect(() => completeTrustRepair(session)).toThrow('not all steps completed')
    })
  })
})
