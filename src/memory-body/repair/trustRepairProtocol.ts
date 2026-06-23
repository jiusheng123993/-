import type { MemoryAtom } from '../core/memoryBodyTypes'
import type { AuditEvent } from '../audit/memoryAuditLog'
import { createAuditEvent } from '../audit/memoryAuditLog'

export type RepairStep =
  | 'acknowledge_error'
  | 'identify_wrong_memory'
  | 'correct_memory'
  | 'record_lesson'
  | 'reduce_confidence'
  | 'show_what_changed'
  | 'prevent_repeat'

export type RepairStepStatus = 'pending' | 'completed' | 'failed'

export interface RepairStepRecord {
  step: RepairStep
  status: RepairStepStatus
  completedAt?: string
  error?: string
}

export interface ConfidenceReduction {
  atomId: string
  previousConfidence: number
  newConfidence: number
}

export interface MisunderstandingRecord {
  wrongPattern: string
  correctPattern: string
  learnedAt: string
}

export interface FutureGuard {
  pattern: string
  guardType: 'content_filter' | 'confidence_threshold' | 'user_override'
  createdAt: string
}

export interface TrustRepairInput {
  userComplaint: string
  wrongMemories: MemoryAtom[]
  correctContent: string
}

export interface RepairResult {
  session: TrustRepairSession
  success: boolean
  correctedAtoms?: MemoryAtom[]
  confidenceReductions?: ConfidenceReduction[]
  changeSummary?: string
  auditEvent?: AuditEvent
  misunderstandingRecord?: MisunderstandingRecord
  futureGuard?: FutureGuard
}

export interface TrustRepairSession {
  id: string
  userComplaint: string
  wrongMemories: MemoryAtom[]
  correctContent: string
  currentStep: RepairStep
  status: 'in_progress' | 'completed' | 'failed'
  steps: RepairStepRecord[]
  identifiedWrongAtomIds: string[]
  correctedAtoms?: MemoryAtom[]
  confidenceReductions?: ConfidenceReduction[]
  misunderstandingRecord?: MisunderstandingRecord
  changeSummary?: string
  futureGuard?: FutureGuard
  createdAt: string
  completedAt?: string
}

const STEP_ORDER: RepairStep[] = [
  'acknowledge_error',
  'identify_wrong_memory',
  'correct_memory',
  'record_lesson',
  'reduce_confidence',
  'show_what_changed',
  'prevent_repeat'
]

function generateSessionId(): string {
  return `trust-repair-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getStepIndex(step: RepairStep): number {
  return STEP_ORDER.indexOf(step)
}

function getNextStep(current: RepairStep): RepairStep | null {
  const idx = getStepIndex(current)
  if (idx < 0 || idx >= STEP_ORDER.length - 1) return null
  return STEP_ORDER[idx + 1]
}

export function initiateTrustRepair(input: TrustRepairInput): TrustRepairSession {
  const firstStep: RepairStepRecord = {
    step: 'acknowledge_error',
    status: 'completed',
    completedAt: new Date().toISOString()
  }

  return {
    id: generateSessionId(),
    userComplaint: input.userComplaint,
    wrongMemories: input.wrongMemories,
    correctContent: input.correctContent,
    currentStep: 'acknowledge_error',
    status: 'in_progress',
    steps: [firstStep],
    identifiedWrongAtomIds: [],
    createdAt: new Date().toISOString()
  }
}

export function executeRepairStep(
  session: TrustRepairSession,
  step: RepairStep
): RepairResult {
  if (!STEP_ORDER.includes(step)) {
    throw new Error(`Unknown repair step: ${step}`)
  }

  const currentIdx = getStepIndex(session.currentStep)
  const requestedIdx = getStepIndex(step)

  if (requestedIdx !== currentIdx + 1) {
    throw new Error(
      `Invalid step order: expected "${getNextStep(session.currentStep)}" after "${session.currentStep}", got "${step}"`
    )
  }

  const stepRecord: RepairStepRecord = {
    step,
    status: 'completed',
    completedAt: new Date().toISOString()
  }

  let result: RepairResult = {
    session: {
      ...session,
      currentStep: step,
      steps: [...session.steps, stepRecord]
    },
    success: true
  }

  switch (step) {
    case 'identify_wrong_memory': {
      const wrongIds = session.wrongMemories.map(m => m.id)
      result.session = {
        ...result.session,
        identifiedWrongAtomIds: wrongIds
      }
      break
    }
    case 'correct_memory': {
      const correctedAtoms = session.wrongMemories.map(m => ({
        ...m,
        content: session.correctContent,
        lifecycle: 'corrected' as const,
        updatedAt: new Date().toISOString()
      }))
      result = {
        ...result,
        correctedAtoms,
        session: {
          ...result.session,
          correctedAtoms
        }
      }
      break
    }
    case 'record_lesson': {
      const wrongPattern = session.wrongMemories
        .map(m => m.content)
        .join(' | ')
      const misunderstandingRecord: MisunderstandingRecord = {
        wrongPattern,
        correctPattern: session.correctContent,
        learnedAt: new Date().toISOString()
      }
      result = {
        ...result,
        misunderstandingRecord,
        session: {
          ...result.session,
          misunderstandingRecord
        }
      }
      break
    }
    case 'reduce_confidence': {
      const confidenceReductions: ConfidenceReduction[] = session.wrongMemories.map(m => ({
        atomId: m.id,
        previousConfidence: m.confidence,
        newConfidence: Math.max(m.confidence - 0.3, 0.1)
      }))
      result = {
        ...result,
        confidenceReductions,
        session: {
          ...result.session,
          confidenceReductions
        }
      }
      break
    }
    case 'show_what_changed': {
      const changeSummary = `已修正记忆：原内容与用户反馈不符，已更新为正确内容「${session.correctContent}」`
      result = {
        ...result,
        changeSummary,
        session: {
          ...result.session,
          changeSummary
        }
      }
      break
    }
    case 'prevent_repeat': {
      const futureGuard: FutureGuard = {
        pattern: session.wrongMemories.map(m => m.content).join(' | '),
        guardType: 'user_override',
        createdAt: new Date().toISOString()
      }
      result = {
        ...result,
        futureGuard,
        session: {
          ...result.session,
          futureGuard
        }
      }
      break
    }
  }

  return result
}

export interface RepairStatus {
  completedSteps: number
  totalSteps: number
  isComplete: boolean
  currentStep: RepairStep
}

export function getRepairStatus(session: TrustRepairSession): RepairStatus {
  const completedSteps = session.steps.filter(s => s.status === 'completed').length
  return {
    completedSteps,
    totalSteps: STEP_ORDER.length,
    isComplete: completedSteps === STEP_ORDER.length,
    currentStep: session.currentStep
  }
}

export interface TrustRepairCompletion {
  session: TrustRepairSession
  auditEvent: AuditEvent
  correctedAtoms: MemoryAtom[]
  misunderstandingRecord: MisunderstandingRecord
  futureGuard: FutureGuard
}

export function completeTrustRepair(session: TrustRepairSession): TrustRepairCompletion {
  const status = getRepairStatus(session)
  if (!status.isComplete) {
    throw new Error('not all steps completed')
  }

  const completedSession: TrustRepairSession = {
    ...session,
    status: 'completed',
    completedAt: new Date().toISOString()
  }

  const auditAtom = session.wrongMemories[0]
  const auditEvent = createAuditEvent('trust_repair_triggered', auditAtom, {
    repairSessionId: session.id,
    userComplaint: session.userComplaint,
    correctedContent: session.correctContent,
    stepsCompleted: session.steps.length
  })

  return {
    session: completedSession,
    auditEvent,
    correctedAtoms: session.correctedAtoms || [],
    misunderstandingRecord: session.misunderstandingRecord || {
      wrongPattern: '',
      correctPattern: session.correctContent,
      learnedAt: new Date().toISOString()
    },
    futureGuard: session.futureGuard || {
      pattern: '',
      guardType: 'user_override',
      createdAt: new Date().toISOString()
    }
  }
}
