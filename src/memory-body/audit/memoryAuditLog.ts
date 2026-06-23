export type MemoryAuditEventType =
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

export type MemoryAuditActor = 'user' | 'assistant' | 'system'

export interface MemoryAuditEventInput {
  id: string
  type: MemoryAuditEventType
  atomId?: string
  timestamp: string
  actor: MemoryAuditActor
  summary: string
  sourceText?: string
}

export interface MemoryAuditEvent {
  id: string
  type: MemoryAuditEventType
  atomId?: string
  timestamp: string
  actor: MemoryAuditActor
  summary: string
  safeSourceText?: string
}

const secretPatterns = [
  /sk-[a-zA-Z0-9_-]{8,}/g,
  /(token\s*[=:：]\s*)[^\s，。；;]+/gi,
  /(password\s*[=:：]\s*)[^\s，。；;]+/gi,
  /(api[_-]?key\s*[=:：]\s*)[^\s，。；;]+/gi
]

export function redactAuditText(text: string): string {
  return secretPatterns.reduce((safeText, pattern) => safeText.replace(pattern, match => {
    const prefixMatch = match.match(/^(token\s*[=:：]\s*|password\s*[=:：]\s*|api[_-]?key\s*[=:：]\s*)/i)
    return prefixMatch ? `${prefixMatch[1]}[REDACTED_SECRET]` : '[REDACTED_SECRET]'
  }), text)
}

export function createMemoryAuditEvent(input: MemoryAuditEventInput): MemoryAuditEvent {
  return {
    id: input.id,
    type: input.type,
    atomId: input.atomId,
    timestamp: input.timestamp,
    actor: input.actor,
    summary: input.summary,
    safeSourceText: input.sourceText ? redactAuditText(input.sourceText) : undefined
  }
}
