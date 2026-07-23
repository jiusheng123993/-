import type { MemorySensitivity, MemorySource } from '../core/memoryBodyTypes'
import { detectForbiddenMemoryInstruction } from './forbiddenMemoryFilter'
import { classifyMemorySensitivity } from './sensitiveMemoryClassifier'

export interface MemoryWriteGuardInput {
  content: string
  source: MemorySource
}

export interface MemoryWriteGuardResult {
  allowed: boolean
  sensitivity: MemorySensitivity
  reason?: 'user_requested_no_memory' | 'forbidden_secret'
  matchedPatterns: string[]
}

export function guardMemoryWrite(input: MemoryWriteGuardInput): MemoryWriteGuardResult {
  const forbiddenInstruction = detectForbiddenMemoryInstruction(input.content)
  if (forbiddenInstruction.forbidden) {
    return {
      allowed: false,
      sensitivity: 'forbidden',
      reason: forbiddenInstruction.reason,
      matchedPatterns: []
    }
  }

  const sensitivity = classifyMemorySensitivity(input)
  if (sensitivity.sensitivity === 'forbidden') {
    return {
      allowed: false,
      sensitivity: 'forbidden',
      reason: 'forbidden_secret',
      matchedPatterns: sensitivity.matchedPatterns
    }
  }

  return {
    allowed: true,
    sensitivity: sensitivity.sensitivity,
    matchedPatterns: sensitivity.matchedPatterns
  }
}
