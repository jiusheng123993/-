export type EvolutionTriggerType = 'cron' | 'event_threshold' | 'manual'

export interface ProfileChangeProposal {
  fieldPath: string
  oldValue: unknown
  newValue: unknown
  reasoning: string
  evidenceEventIds: string[]
  confidence: number
}

export interface EvolutionEntry {
  id: string
  userId: string
  triggeredBy: EvolutionTriggerType
  triggerDetail: string
  proposedChanges: ProfileChangeProposal[]
  userDecision: 'pending' | 'accepted' | 'rejected' | 'modified'
  finalChanges: Array<{
    fieldPath: string
    oldValue: unknown
    newValue: unknown
  }>
  reflectionNote: string
  createdAt: string
  decidedAt?: string
}

export interface EvolutionRitualUIProps {
  entry: EvolutionEntry
  onAccept: (entryId: string) => void
  onReject: (entryId: string) => void
  onModify: (entryId: string, modifiedChanges: EvolutionEntry['finalChanges']) => void
  onViewDetails?: (entryId: string) => void
  onClose?: () => void
}
