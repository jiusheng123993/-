import type { MemoryAtom } from '../core/memoryBodyTypes'

export enum OverrideLevel {
  USER_EXPLICIT_COMMAND = 1,
  USER_EXPLICIT_CORRECTION = 2,
  USER_CONFIRMED_MEMORY = 3,
  PROJECT_RULE = 4,
  GLOBAL_RULE = 5,
  HISTORICAL_MEMORY = 6,
  MODEL_INFERENCE = 7
}

export const OVERRIDE_PRIORITY_ORDER: OverrideLevel[] = [
  OverrideLevel.USER_EXPLICIT_COMMAND,
  OverrideLevel.USER_EXPLICIT_CORRECTION,
  OverrideLevel.USER_CONFIRMED_MEMORY,
  OverrideLevel.PROJECT_RULE,
  OverrideLevel.GLOBAL_RULE,
  OverrideLevel.HISTORICAL_MEMORY,
  OverrideLevel.MODEL_INFERENCE
]

export const OVERRIDE_LEVEL_LABELS: Record<OverrideLevel, string> = {
  [OverrideLevel.USER_EXPLICIT_COMMAND]: '用户最新明确指令',
  [OverrideLevel.USER_EXPLICIT_CORRECTION]: '用户明确纠正',
  [OverrideLevel.USER_CONFIRMED_MEMORY]: '用户确认记忆',
  [OverrideLevel.PROJECT_RULE]: '项目规则',
  [OverrideLevel.GLOBAL_RULE]: '全局规则',
  [OverrideLevel.HISTORICAL_MEMORY]: '历史记忆',
  [OverrideLevel.MODEL_INFERENCE]: '模型推断'
}

export type OverrideSourceType =
  | 'user_command'
  | 'user_correction'
  | 'memory_lifecycle'
  | 'project_rule'
  | 'global_rule'
  | 'model_inference'

export interface OverrideSource {
  type: OverrideSourceType
  lifecycle?: string
  timestamp: string
}

export interface OverrideResolution {
  kept: MemoryAtom
  discarded: MemoryAtom
  reason: string
}

function getPriorityIndex(level: OverrideLevel): number {
  return OVERRIDE_PRIORITY_ORDER.indexOf(level)
}

export function getOverrideLevel(source: OverrideSource): OverrideLevel {
  switch (source.type) {
    case 'user_command':
      return OverrideLevel.USER_EXPLICIT_COMMAND
    case 'user_correction':
      return OverrideLevel.USER_EXPLICIT_CORRECTION
    case 'memory_lifecycle':
      if (source.lifecycle === 'confirmed') return OverrideLevel.USER_CONFIRMED_MEMORY
      return OverrideLevel.HISTORICAL_MEMORY
    case 'project_rule':
      return OverrideLevel.PROJECT_RULE
    case 'global_rule':
      return OverrideLevel.GLOBAL_RULE
    case 'model_inference':
      return OverrideLevel.MODEL_INFERENCE
  }
}

export function isHigherPriority(a: OverrideLevel, b: OverrideLevel): boolean {
  return getPriorityIndex(a) < getPriorityIndex(b)
}

export function canOverride(newLevel: OverrideLevel, existingLevel: OverrideLevel): boolean {
  return isHigherPriority(newLevel, existingLevel)
}

export function resolveOverride(a: OverrideSource, b: OverrideSource): OverrideSource {
  const levelA = getOverrideLevel(a)
  const levelB = getOverrideLevel(b)

  if (isHigherPriority(levelA, levelB)) return a
  if (isHigherPriority(levelB, levelA)) return b

  return a.timestamp >= b.timestamp ? a : b
}

function inferAtomSource(atom: MemoryAtom): OverrideSource {
  if (atom.source === 'user_command') {
    return { type: 'user_command', timestamp: atom.updatedAt }
  }
  if (atom.source === 'user_correction') {
    return { type: 'user_correction', timestamp: atom.updatedAt }
  }
  if (atom.lifecycle === 'confirmed') {
    return { type: 'memory_lifecycle', lifecycle: 'confirmed', timestamp: atom.updatedAt }
  }
  if (atom.source === 'model_inference') {
    return { type: 'model_inference', timestamp: atom.updatedAt }
  }
  return { type: 'memory_lifecycle', lifecycle: atom.lifecycle, timestamp: atom.updatedAt }
}

export function resolveMemoryConflict(a: MemoryAtom, b: MemoryAtom): OverrideResolution {
  const sourceA = inferAtomSource(a)
  const sourceB = inferAtomSource(b)
  const winner = resolveOverride(sourceA, sourceB)
  const kept = winner === sourceA ? a : b
  const discarded = winner === sourceA ? b : a
  const keptLevel = getOverrideLevel(inferAtomSource(kept))
  const discardedLevel = getOverrideLevel(inferAtomSource(discarded))

  return {
    kept,
    discarded,
    reason: `${OVERRIDE_LEVEL_LABELS[keptLevel]} 覆盖 ${OVERRIDE_LEVEL_LABELS[discardedLevel]}：${kept.content}`
  }
}
