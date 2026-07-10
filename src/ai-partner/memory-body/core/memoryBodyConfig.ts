import type { MemoryLifecycle, MemorySensitivity } from './memoryBodyTypes'

export const MEMORY_BODY_VERSION = 1

export const MEMORY_BODY_STORAGE_KEY = 'xinghuanhai-memory-body-state'

export const ACTIVE_MEMORY_LIFECYCLES: MemoryLifecycle[] = [
  'active',
  'confirmed',
  'stable',
  'protected'
]

export const WRITABLE_MEMORY_SENSITIVITIES: MemorySensitivity[] = [
  'public',
  'personal',
  'sensitive',
  'private'
]

export const DEFAULT_MEMORY_CONFIDENCE = 0.7
export const DEFAULT_MEMORY_STRENGTH = 0.5
export const DEFAULT_EMOTIONAL_WEIGHT = 0.1
