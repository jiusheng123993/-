import type { MemoryAtom, MemoryScope } from '../core/memoryBodyTypes'
import type { AuditEvent } from '../audit/memoryAuditLog'
import { createAuditEvent } from '../audit/memoryAuditLog'

export type NegotiationAction = 'confirm' | 'reject' | 'modify' | 'scope_to_project'

export type NegotiationCandidateStatus = 'pending' | 'confirmed' | 'rejected' | 'modified' | 'scoped'

export interface NegotiationCandidate {
  atom: MemoryAtom
  reason: string
  status: NegotiationCandidateStatus
  addedAt: string
}

export interface NegotiationResolution {
  candidateId: string
  action: NegotiationAction
  modifications?: Partial<Pick<MemoryAtom, 'content' | 'subject' | 'predicate' | 'object' | 'tags'>>
  projectId?: string
  resolvedAt: string
}

export interface NegotiationResult {
  session: NegotiationSession
  resolvedAtom: MemoryAtom | null
  auditEvent: AuditEvent | null
}

export interface NegotiationSession {
  id: string
  candidates: NegotiationCandidate[]
  status: 'open' | 'closed'
  createdAt: string
  closedAt?: string
}

function generateSessionId(): string {
  return `negotiation-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createNegotiationSession(): NegotiationSession {
  return {
    id: generateSessionId(),
    candidates: [],
    status: 'open',
    createdAt: new Date().toISOString()
  }
}

export function addCandidateMemory(
  session: NegotiationSession,
  atom: MemoryAtom,
  reason: string
): NegotiationSession {
  const exists = session.candidates.some(c => c.atom.id === atom.id)
  if (exists) return session

  const candidate: NegotiationCandidate = {
    atom,
    reason,
    status: 'pending',
    addedAt: new Date().toISOString()
  }

  return {
    ...session,
    candidates: [...session.candidates, candidate]
  }
}

function resolveScope(atom: MemoryAtom, resolution: NegotiationResolution): MemoryScope {
  if (resolution.action === 'scope_to_project' && resolution.projectId) {
    const existingScope = typeof atom.scope === 'object' && atom.scope !== null
      ? atom.scope as Record<string, string>
      : { userId: String(atom.scope) }
    return {
      userId: existingScope.userId || String(atom.scope),
      projectId: resolution.projectId
    } as MemoryScope
  }
  return atom.scope
}

function applyModifications(
  atom: MemoryAtom,
  modifications: NegotiationResolution['modifications']
): MemoryAtom {
  if (!modifications) return atom
  return {
    ...atom,
    ...modifications,
    updatedAt: new Date().toISOString()
  }
}

function getCandidateStatus(action: NegotiationAction): NegotiationCandidateStatus {
  switch (action) {
    case 'confirm': return 'confirmed'
    case 'reject': return 'rejected'
    case 'modify': return 'modified'
    case 'scope_to_project': return 'scoped'
  }
}

export function resolveNegotiation(
  session: NegotiationSession,
  resolution: NegotiationResolution
): NegotiationResult {
  const candidateIndex = session.candidates.findIndex(c => c.atom.id === resolution.candidateId)
  if (candidateIndex === -1) {
    throw new Error('Candidate not found')
  }

  const candidate = session.candidates[candidateIndex]
  if (candidate.status !== 'pending') {
    throw new Error(`Candidate ${resolution.candidateId} already resolved`)
  }

  let resolvedAtom: MemoryAtom | null = null
  let auditEvent: AuditEvent | null = null

  switch (resolution.action) {
    case 'confirm': {
      resolvedAtom = {
        ...candidate.atom,
        lifecycle: 'confirmed',
        confidence: Math.min(candidate.atom.confidence + 0.2, 1.0),
        updatedAt: new Date().toISOString()
      }
      auditEvent = createAuditEvent('memory_confirmed', resolvedAtom, {
        negotiationSessionId: session.id,
        previousLifecycle: candidate.atom.lifecycle
      })
      break
    }
    case 'reject': {
      resolvedAtom = {
        ...candidate.atom,
        lifecycle: 'forbidden',
        updatedAt: new Date().toISOString()
      }
      auditEvent = createAuditEvent('memory_forgotten', resolvedAtom, {
        negotiationSessionId: session.id,
        reason: candidate.reason
      })
      break
    }
    case 'modify': {
      const modified = applyModifications(candidate.atom, resolution.modifications)
      resolvedAtom = {
        ...modified,
        lifecycle: 'confirmed',
        updatedAt: new Date().toISOString()
      }
      auditEvent = createAuditEvent('memory_corrected', resolvedAtom, {
        negotiationSessionId: session.id,
        originalContent: candidate.atom.content
      })
      break
    }
    case 'scope_to_project': {
      const newScope = resolveScope(candidate.atom, resolution)
      resolvedAtom = {
        ...candidate.atom,
        scope: newScope,
        lifecycle: 'confirmed',
        updatedAt: new Date().toISOString()
      }
      auditEvent = createAuditEvent('memory_confirmed', resolvedAtom, {
        negotiationSessionId: session.id,
        previousScope: candidate.atom.scope,
        newScope
      })
      break
    }
  }

  const updatedCandidates = session.candidates.map((c, i) =>
    i === candidateIndex ? { ...c, status: getCandidateStatus(resolution.action) } : c
  )

  return {
    session: {
      ...session,
      candidates: updatedCandidates
    },
    resolvedAtom,
    auditEvent
  }
}

export function getNegotiationQueue(session: NegotiationSession): NegotiationCandidate[] {
  return session.candidates.filter(c => c.status === 'pending')
}
