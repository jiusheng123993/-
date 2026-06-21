import type { MemoryAtom, MemoryScope, MemorySource } from '../core/memoryBodyTypes'
import { extractMemoryAtomsFromText } from '../extraction/ruleBasedMemoryExtractor'
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
