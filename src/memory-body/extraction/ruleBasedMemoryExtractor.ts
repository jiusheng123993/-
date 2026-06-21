import {
  DEFAULT_EMOTIONAL_WEIGHT,
  DEFAULT_MEMORY_STRENGTH
} from '../core/memoryBodyConfig'
import type {
  MemoryAtom,
  MemoryAtomType,
  MemoryScenario,
  MemoryScope,
  MemorySource
} from '../core/memoryBodyTypes'
import { guardMemoryWrite } from '../safety/memoryPrivacyGuard'

export interface RuleBasedMemoryExtractionInput {
  text: string
  source: MemorySource
  scope: MemoryScope
  timestamp: string
  sourceId?: string
}

interface ExtractionMatch {
  type: MemoryAtomType
  predicate: string
  object: string
  content: string
  confidence: number
  tags: string[]
  scenarios: MemoryScenario[]
}

const preferencePatterns = [
  /我(?:很|特别|非常)?喜欢(?:吃|喝|用|看|听|玩)?([^，。,.!！?？\s]+)/,
  /我爱(?:吃|喝|用|看|听|玩)?([^，。,.!！?？\s]+)/
]

const boundaryPatterns = [
  /我不喜欢(?:吃|喝|用|看|听|玩)?([^，。,.!！?？\s]+)/,
  /我讨厌(?:吃|喝|用|看|听|玩)?([^，。,.!！?？\s]+)/,
  /不要(?:给我)?推荐([^，。,.!！?？\s]+)/
]

const goalPatterns = [
  /我的目标是([^，。,.!！?？\s]+)/,
  /我想要?([^，。,.!！?？\s]+)/,
  /我计划([^，。,.!！?？\s]+)/
]

function extractFirstObject(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    const value = match?.[1]?.trim()
    if (value) return value
  }
  return undefined
}

function createAtom(input: RuleBasedMemoryExtractionInput, match: ExtractionMatch, sensitivity: MemoryAtom['sensitivity']): MemoryAtom {
  const baseId = `${input.scope.userId}:${input.scope.projectId}:${match.type}:${match.predicate}:${match.object}:${input.timestamp}`
  const id = `atom-${encodeURIComponent(baseId)}`
  return {
    id,
    scope: input.scope,
    layer: 'semantic',
    type: match.type,
    subject: 'user',
    predicate: match.predicate,
    object: match.object,
    content: match.content,
    source: input.source,
    confidence: match.confidence,
    strength: DEFAULT_MEMORY_STRENGTH,
    emotionalWeight: DEFAULT_EMOTIONAL_WEIGHT,
    sensitivity,
    lifecycle: 'draft',
    evidence: [
      {
        id: `evidence-${id}`,
        source: input.source,
        sourceId: input.sourceId,
        sourceText: input.text,
        timestamp: input.timestamp,
        confidence: match.confidence
      }
    ],
    tags: match.tags,
    scenarios: match.scenarios,
    createdAt: input.timestamp,
    updatedAt: input.timestamp,
    lastAccessedAt: input.timestamp,
    accessCount: 0,
    contradictionOf: []
  }
}

function findExtractionMatch(text: string): ExtractionMatch | undefined {
  const boundaryObject = extractFirstObject(text, boundaryPatterns)
  if (boundaryObject) {
    return {
      type: 'boundary',
      predicate: 'dislikes',
      object: boundaryObject,
      content: `用户不喜欢${boundaryObject}`,
      confidence: 0.78,
      tags: ['boundary'],
      scenarios: ['chat', 'food_recommendation']
    }
  }

  const preferenceObject = extractFirstObject(text, preferencePatterns)
  if (preferenceObject) {
    return {
      type: 'preference',
      predicate: 'likes',
      object: preferenceObject,
      content: `用户喜欢${preferenceObject}`,
      confidence: 0.78,
      tags: ['preference'],
      scenarios: ['chat', 'food_recommendation']
    }
  }

  const goalObject = extractFirstObject(text, goalPatterns)
  if (goalObject) {
    return {
      type: 'goal',
      predicate: 'has_goal',
      object: goalObject,
      content: `用户的目标是${goalObject}`,
      confidence: 0.72,
      tags: ['goal'],
      scenarios: ['chat', 'goal_planning']
    }
  }

  return undefined
}

export function extractMemoryAtomsFromText(input: RuleBasedMemoryExtractionInput): MemoryAtom[] {
  const guard = guardMemoryWrite({ content: input.text, source: input.source })
  if (!guard.allowed) return []

  const match = findExtractionMatch(input.text)
  if (!match) return []

  return [createAtom(input, match, guard.sensitivity)]
}
