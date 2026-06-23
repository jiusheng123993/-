import type { MemoryAtom, MemoryScope } from '../core/memoryBodyTypes'

export type AuditEventType =
  | 'memory_created'
  | 'memory_confirmed'
  | 'memory_corrected'
  | 'memory_forgotten'
  | 'memory_protected'
  | 'memory_restored'
  | 'memory_archived'
  | 'memory_used_in_prompt'
  | 'cognitive_profile_updated'
  | 'trust_repair_triggered'
  | 'policy_blocked_memory'
  | 'migration_completed'

const SENSITIVE_KEYS = new Set([
  'apiKey', 'password', 'token', 'secret', 'key',
  'privateKey', 'accessToken', 'refreshToken', 'oauthSecret',
  'connectionString', 'certificate'
])

export interface AuditEvent {
  id: string
  type: AuditEventType
  atomId?: string
  timestamp: string
  scope: MemoryScope
  actor?: string
  summary?: string
  safeSourceText?: string
  metadata?: Record<string, unknown>
}

let auditLog: AuditEvent[] = []

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.has(key)) continue
    sanitized[key] = value
  }
  return sanitized
}

function generateEventId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createAuditEvent(
  type: AuditEventType,
  atom: MemoryAtom,
  metadata?: Record<string, unknown>
): AuditEvent {
  return {
    id: generateEventId(),
    type,
    atomId: atom.id,
    timestamp: new Date().toISOString(),
    scope: atom.scope,
    metadata: sanitizeMetadata(metadata)
  }
}

function createScopeEvent(
  type: AuditEventType,
  scope: MemoryScope,
  metadata?: Record<string, unknown>
): AuditEvent {
  return {
    id: generateEventId(),
    type,
    timestamp: new Date().toISOString(),
    scope,
    metadata: sanitizeMetadata(metadata)
  }
}

function pushEvent(event: AuditEvent): void {
  auditLog.push(event)
}

export function recordMemoryCreated(atom: MemoryAtom): void {
  pushEvent(createAuditEvent('memory_created', atom))
}

export function recordMemoryConfirmed(atom: MemoryAtom): void {
  pushEvent(createAuditEvent('memory_confirmed', atom))
}

export function recordMemoryCorrected(atom: MemoryAtom, previousContent: string): void {
  pushEvent(createAuditEvent('memory_corrected', atom, { previousContent }))
}

export function recordMemoryForgotten(atom: MemoryAtom): void {
  pushEvent(createAuditEvent('memory_forgotten', atom))
}

export function recordMemoryProtected(atom: MemoryAtom): void {
  pushEvent(createAuditEvent('memory_protected', atom))
}

export function recordMemoryRestored(atom: MemoryAtom): void {
  pushEvent(createAuditEvent('memory_restored', atom))
}

export function recordMemoryArchived(atom: MemoryAtom): void {
  pushEvent(createAuditEvent('memory_archived', atom))
}

export function recordMemoryUsedInPrompt(atom: MemoryAtom, scenario: string): void {
  pushEvent(createAuditEvent('memory_used_in_prompt', atom, { scenario }))
}

export function recordCognitiveProfileUpdated(scope: MemoryScope, affectedTraits: string[]): void {
  pushEvent(createScopeEvent('cognitive_profile_updated', scope, { affectedTraits }))
}

export function recordTrustRepairTriggered(scope: MemoryScope, reason: string): void {
  pushEvent(createScopeEvent('trust_repair_triggered', scope, { reason }))
}

export function recordPolicyBlockedMemory(atom: MemoryAtom, policy: string): void {
  pushEvent(createAuditEvent('policy_blocked_memory', atom, { policy }))
}

export function recordMigrationCompleted(scope: MemoryScope, fromVersion: number, toVersion: number): void {
  pushEvent(createScopeEvent('migration_completed', scope, { fromVersion, toVersion }))
}

export function getAuditLog(): AuditEvent[] {
  return [...auditLog]
}

export function clearAuditLog(): void {
  auditLog = []
}

export type MemoryAuditEvent = AuditEvent

export interface CreateMemoryAuditEventInput {
  id: string
  type: AuditEventType
  atomId: string
  timestamp: string
  actor: string
  summary: string
  sourceText?: string
}

export function createMemoryAuditEvent(input: CreateMemoryAuditEventInput): AuditEvent {
  const safeSourceText = sanitizeSourceText(input.sourceText)
  return {
    id: input.id,
    type: input.type,
    atomId: input.atomId,
    timestamp: input.timestamp,
    scope: { userId: '', projectId: '' },
    actor: input.actor,
    summary: input.summary,
    safeSourceText,
    metadata: sanitizeMetadata({
      actor: input.actor,
      summary: input.summary,
      sourceText: input.sourceText
    })
  }
}

const SECRET_PATTERNS = [
  /\bsk-[a-zA-Z0-9]{16,}\b/g,
  /\b(?:api[_-]?key|apikey|api_secret|secret[_-]?key)\s*[:=]\s*\S+/gi,
  /\b(?:password|passwd|pwd)\s*[:=]\s*\S+/gi,
  /\b(?:token|access[_-]?token|refresh[_-]?token)\s*[:=]\s*\S+/gi,
  /\b(?:private[_-]?key|certificate)\s*[:=]\s*\S+/gi,
  /\b(?:connection[_-]?string|conn[_-]?str)\s*[:=]\s*\S+/gi
]

function sanitizeSourceText(text?: string): string | undefined {
  if (!text) return undefined
  let sanitized = text
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED_SECRET]')
  }
  return sanitized
}
