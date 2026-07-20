import type { MemoryAtom, MemoryScope, MemorySource } from '../core/memoryBodyTypes'
import type { MemoryBodyStore } from '../store/memoryBodyStore'

export interface MemoryIngestInput {
  text: string
  source: MemorySource
  scope: MemoryScope
  timestamp: string
  store: MemoryBodyStore
  sourceId?: string
}

export interface MemoryIngestResult {
  writtenAtoms: MemoryAtom[]
  skipped: boolean
  reason?: 'no_extractable_memory'
}

function extractMemoryAtomsFromText(input: { text: string; source: MemorySource; scope: MemoryScope; timestamp: string; sourceId?: string }): MemoryAtom[] {
  const { text, source, scope, timestamp, sourceId } = input
  const patterns: RegExp[] = [
    /(?:我|用户)?(?:喜欢|偏好|最爱|prefer)\s*(.+?)(?:[，。！？\n]|$)/gi,
    /(?:我|用户)?(?:不喜欢|讨厌|不喜欢|hate)\s*(.+?)(?:[，。！？\n]|$)/gi,
    /(?:我|用户)?(?:目标|想要|希望|goal)\s*(.+?)(?:[，。！？\n]|$)/gi,
  ]
  const atoms: MemoryAtom[] = []
  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      const content = match[1].trim()
      if (!content) continue
      const isNegative = /不喜欢|讨厌|hate/i.test(match[0])
      const isGoal = /目标|想要|希望|goal/i.test(match[0])
      atoms.push({
        id: `${sourceId ?? source}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        content,
        layer: 'semantic',
        type: isGoal ? 'goal' : 'preference',
        scope,
        subject: 'user',
        predicate: isNegative ? 'dislikes' : 'likes',
        object: content,
        scenarios: ['chat'],
        lifecycle: 'active',
        confidence: 0.6,
        sensitivity: 'public',
        source,
        evidence: [],
        tags: isNegative ? ['negative'] : [],
        createdAt: timestamp,
        updatedAt: timestamp,
        quality: 0.5,
        strength: 0.5,
        emotionalWeight: 0,
        accessCount: 0,
        lastAccessedAt: timestamp,
        contradictionOf: [],
      })
    }
  }
  return atoms
}

export function ingestMemoryText(input: MemoryIngestInput): MemoryIngestResult {
  const extractedAtoms = extractMemoryAtomsFromText({
    text: input.text,
    source: input.source,
    scope: input.scope,
    timestamp: input.timestamp,
    sourceId: input.sourceId
  })

  if (extractedAtoms.length === 0) {
    return {
      writtenAtoms: [],
      skipped: true,
      reason: 'no_extractable_memory'
    }
  }

  const writtenAtoms = extractedAtoms.map(atom => ({
    ...atom,
    lifecycle: 'active' as const,
    updatedAt: input.timestamp,
    lastAccessedAt: input.timestamp
  }))

  writtenAtoms.forEach(atom => input.store.upsertAtom(atom))

  return {
    writtenAtoms,
    skipped: false
  }
}
