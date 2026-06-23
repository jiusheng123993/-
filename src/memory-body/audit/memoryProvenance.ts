import type { MemoryAtom } from '../core/memoryBodyTypes'

export interface ProvenanceEvent {
  type: 'origin' | 'evidence' | 'reinforcement' | 'correction' | 'usage' | 'migration' | 'rollback' | 'trust_impact'
  timestamp: string
  source?: string
  sourceText?: string
  confidence?: number
  confidenceBefore?: number
  confidenceAfter?: number
  previousContent?: string
  newContent?: string
  reason?: string
  scenario?: string
  fromVersion?: number
  toVersion?: number
  restoredContent?: string
  impact?: string
  atomSnapshot?: Pick<MemoryAtom, 'id' | 'content' | 'type' | 'sensitivity' | 'lifecycle' | 'source' | 'confidence' | 'strength'>
}

export interface MemoryProvenance {
  atomId: string
  originEvent: ProvenanceEvent
  evidenceChain: ProvenanceEvent[]
  reinforcementEvents: ProvenanceEvent[]
  correctionEvents: ProvenanceEvent[]
  usageEvents: ProvenanceEvent[]
  migrationEvents: ProvenanceEvent[]
  rollbackEvents: ProvenanceEvent[]
  trustImpactEvents: ProvenanceEvent[]
}

function createAtomSnapshot(atom: MemoryAtom): ProvenanceEvent['atomSnapshot'] {
  return {
    id: atom.id,
    content: atom.content,
    type: atom.type,
    sensitivity: atom.sensitivity,
    lifecycle: atom.lifecycle,
    source: atom.source,
    confidence: atom.confidence,
    strength: atom.strength
  }
}

export function createProvenance(atom: MemoryAtom): MemoryProvenance {
  return {
    atomId: atom.id,
    originEvent: {
      type: 'origin',
      timestamp: atom.createdAt,
      source: atom.source,
      atomSnapshot: createAtomSnapshot(atom)
    },
    evidenceChain: [],
    reinforcementEvents: [],
    correctionEvents: [],
    usageEvents: [],
    migrationEvents: [],
    rollbackEvents: [],
    trustImpactEvents: []
  }
}

export function recordOriginEvent(provenance: MemoryProvenance, event: Omit<ProvenanceEvent, 'type'>): void {
  provenance.originEvent = { ...event, type: 'origin' }
}

export function recordEvidence(provenance: MemoryProvenance, event: Omit<ProvenanceEvent, 'type'>): void {
  provenance.evidenceChain.push({ ...event, type: 'evidence' })
}

export function recordReinforcement(provenance: MemoryProvenance, event: Omit<ProvenanceEvent, 'type'>): void {
  provenance.reinforcementEvents.push({ ...event, type: 'reinforcement' })
}

export function recordCorrection(provenance: MemoryProvenance, event: Omit<ProvenanceEvent, 'type'>): void {
  provenance.correctionEvents.push({ ...event, type: 'correction' })
}

export function recordUsage(provenance: MemoryProvenance, event: Omit<ProvenanceEvent, 'type'>): void {
  provenance.usageEvents.push({ ...event, type: 'usage' })
}

export function recordMigration(provenance: MemoryProvenance, event: Omit<ProvenanceEvent, 'type'>): void {
  provenance.migrationEvents.push({ ...event, type: 'migration' })
}

export function recordRollback(provenance: MemoryProvenance, event: Omit<ProvenanceEvent, 'type'>): void {
  provenance.rollbackEvents.push({ ...event, type: 'rollback' })
}

export function recordTrustImpact(provenance: MemoryProvenance, event: Omit<ProvenanceEvent, 'type'>): void {
  provenance.trustImpactEvents.push({ ...event, type: 'trust_impact' })
}

export function getProvenanceChain(provenance: MemoryProvenance): ProvenanceEvent[] {
  return [
    provenance.originEvent,
    ...provenance.evidenceChain,
    ...provenance.reinforcementEvents,
    ...provenance.correctionEvents,
    ...provenance.usageEvents,
    ...provenance.migrationEvents,
    ...provenance.rollbackEvents,
    ...provenance.trustImpactEvents
  ]
}
