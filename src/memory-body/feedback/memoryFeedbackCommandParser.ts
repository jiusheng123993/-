import type { MemoryAtom } from '../core/memoryBodyTypes'
import type { MemoryFeedback } from './memoryFeedback'

export interface MemoryFeedbackCommandInput {
  text: string
  atoms: MemoryAtom[]
  timestamp: string
}

export type MemoryFeedbackCommandResult =
  | { matched: true; feedback: MemoryFeedback }
  | { matched: false }

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, '')
}

function mostRecentAtom(atoms: MemoryAtom[]): MemoryAtom | undefined {
  return [...atoms].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]
}

function findTargetAtom(text: string, atoms: MemoryAtom[]): MemoryAtom | undefined {
  return atoms.find(atom => text.includes(atom.object) || text.includes(atom.content))
}

function correctionId(atomId: string, timestamp: string): string {
  return `atom-correction-${atomId}-${encodeURIComponent(timestamp)}`
}

function parseCorrection(text: string): { newObject: string; oldObject: string } | undefined {
  const patterns = [
    /喜欢的是([^，。,.!！?？]+)[，,]?不是([^，。,.!！?？]+)/,
    /不是([^，。,.!！?？]+)[，,]?是([^，。,.!！?？]+)/
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue
    if (pattern === patterns[0]) return { newObject: match[1], oldObject: match[2] }
    return { newObject: match[2], oldObject: match[1] }
  }

  return undefined
}

function isConfirmCommand(text: string): boolean {
  return /确认|没错|是的|对的|正确/.test(text)
}

function isForgetCommand(text: string): boolean {
  return /忘掉|删除记忆|不要记|别记/.test(text)
}

export function parseMemoryFeedbackCommand(input: MemoryFeedbackCommandInput): MemoryFeedbackCommandResult {
  const text = normalizeText(input.text)
  const correction = parseCorrection(text)
  if (correction) {
    const target = input.atoms.find(atom => atom.object === correction.oldObject || text.includes(atom.object))
    if (!target) return { matched: false }
    return {
      matched: true,
      feedback: {
        type: 'correct',
        atomId: target.id,
        timestamp: input.timestamp,
        correction: {
          id: correctionId(target.id, input.timestamp),
          predicate: target.predicate,
          object: correction.newObject,
          content: `用户喜欢${correction.newObject}`
        }
      }
    }
  }

  if (isForgetCommand(text)) {
    const target = findTargetAtom(text, input.atoms)
    if (!target) return { matched: false }
    return {
      matched: true,
      feedback: {
        type: 'forget',
        atomId: target.id,
        timestamp: input.timestamp
      }
    }
  }

  if (isConfirmCommand(text)) {
    const target = mostRecentAtom(input.atoms)
    if (!target) return { matched: false }
    return {
      matched: true,
      feedback: {
        type: 'confirm',
        atomId: target.id,
        timestamp: input.timestamp
      }
    }
  }

  return { matched: false }
}
