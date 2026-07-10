import { normalizeScore } from '../core/memoryBodyGuards'
import type { MemoryAtom } from '../core/memoryBodyTypes'

export type MemoryFeedbackType = 'confirm' | 'correct' | 'forget'

export interface MemoryFeedbackCorrection {
  id: string
  predicate: string
  object: string
  content: string
}

export interface MemoryFeedback {
  type: MemoryFeedbackType
  atomId: string
  timestamp: string
  correction?: MemoryFeedbackCorrection
}

export interface MemoryFeedbackInput {
  atoms: MemoryAtom[]
  feedback: MemoryFeedback
}

export interface MemoryFeedbackResult {
  atoms: MemoryAtom[]
  applied: boolean
}

function roundScore(score: number): number {
  return Math.round(normalizeScore(score) * 100) / 100
}

function confirmAtom(atom: MemoryAtom, timestamp: string): MemoryAtom {
  return {
    ...atom,
    lifecycle: 'confirmed',
    confidence: roundScore(atom.confidence + 0.15),
    strength: roundScore(atom.strength + 0.2),
    updatedAt: timestamp
  }
}

function forgetAtom(atom: MemoryAtom, timestamp: string): MemoryAtom {
  return {
    ...atom,
    lifecycle: 'forbidden',
    sensitivity: 'forbidden',
    updatedAt: timestamp
  }
}

function correctedAtom(atom: MemoryAtom, feedback: MemoryFeedback): MemoryAtom | undefined {
  if (!feedback.correction) return undefined
  return {
    ...atom,
    id: feedback.correction.id,
    predicate: feedback.correction.predicate,
    object: feedback.correction.object,
    content: feedback.correction.content,
    source: 'manual',
    confidence: 0.95,
    strength: 0.85,
    lifecycle: 'confirmed',
    createdAt: feedback.timestamp,
    updatedAt: feedback.timestamp,
    lastAccessedAt: feedback.timestamp,
    accessCount: 0,
    contradictionOf: [atom.id]
  }
}

export function applyMemoryFeedback(input: MemoryFeedbackInput): MemoryFeedbackResult {
  const target = input.atoms.find(atom => atom.id === input.feedback.atomId)
  if (!target) return { atoms: input.atoms, applied: false }

  if (input.feedback.type === 'confirm') {
    return {
      atoms: input.atoms.map(atom => atom.id === target.id ? confirmAtom(atom, input.feedback.timestamp) : atom),
      applied: true
    }
  }

  if (input.feedback.type === 'forget') {
    return {
      atoms: input.atoms.map(atom => atom.id === target.id ? forgetAtom(atom, input.feedback.timestamp) : atom),
      applied: true
    }
  }

  const correction = correctedAtom(target, input.feedback)
  if (!correction) return { atoms: input.atoms, applied: false }

  return {
    atoms: [
      ...input.atoms.map(atom => atom.id === target.id ? { ...atom, lifecycle: 'archived' as const, updatedAt: input.feedback.timestamp } : atom),
      correction
    ],
    applied: true
  }
}
