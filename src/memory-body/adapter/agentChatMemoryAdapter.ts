import { composePromptContext } from '../context/promptContextComposer'
import { normalizeScore } from '../core/memoryBodyGuards'
import type { MemoryAtom, MemoryScope } from '../core/memoryBodyTypes'
import { applyMemoryFeedback, type MemoryFeedback, type MemoryFeedbackResult } from '../feedback/memoryFeedback'
import { parseMemoryFeedbackCommand } from '../feedback/memoryFeedbackCommandParser'
import { ingestMemoryText, type MemoryIngestResult } from '../ingestion/memoryIngestor'
import { retrieveRelevantMemories } from '../retrieval/memoryRetrieval'
import type { MemoryBodyStore } from '../store/memoryBodyStore'
import { createMemoryAuditEvent } from '../audit/memoryAuditLog'

function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function auditFeedback(store: MemoryBodyStore, feedback: MemoryFeedback, result: MemoryFeedbackResult): void {
  if (!result.applied) return
  const eventType = feedback.type === 'confirm' ? 'memory_confirmed' as const
    : feedback.type === 'forget' ? 'memory_forgotten' as const
    : 'memory_corrected' as const
  store.appendAuditEvent(createMemoryAuditEvent({
    id: generateAuditId(),
    type: eventType,
    atomId: feedback.atomId,
    timestamp: feedback.timestamp,
    actor: 'user',
    summary: feedback.type === 'confirm' ? '用户确认记忆'
      : feedback.type === 'forget' ? '用户要求忘记记忆'
      : '用户纠正记忆',
    sourceText: feedback.correction?.content
  }))
}

function auditPromptUsage(store: MemoryBodyStore, usedAtomIds: string[], timestamp: string): void {
  usedAtomIds.forEach(atomId => {
    store.appendAuditEvent(createMemoryAuditEvent({
      id: generateAuditId(),
      type: 'memory_used_in_prompt',
      atomId,
      timestamp,
      actor: 'system',
      summary: '记忆被注入 prompt 上下文'
    }))
  })
}

export interface AgentChatMemoryAdapterOptions {
  store: MemoryBodyStore
  scope: MemoryScope
  now?: () => string
}

export type AgentChatMemoryFeedbackCommandResult =
  | ({ matched: true; feedback: MemoryFeedback } & MemoryFeedbackResult)
  | { matched: false; applied: false }

export interface AgentChatMemoryAdapter {
  rememberUserMessage: (message: string, timestamp: string) => MemoryIngestResult
  buildPromptContext: (currentMessage?: string) => string
  applyFeedback: (feedback: MemoryFeedback) => MemoryFeedbackResult
  applyFeedbackCommand: (message: string, timestamp: string) => AgentChatMemoryFeedbackCommandResult
}

function roundScore(score: number): number {
  return Math.round(normalizeScore(score) * 100) / 100
}

function trackMemoryAccess(store: MemoryBodyStore, atoms: MemoryAtom[], accessedAt: string): void {
  atoms.forEach(atom => {
    store.upsertAtom({
      ...atom,
      confidence: roundScore(atom.confidence + 0.02),
      strength: roundScore(atom.strength + 0.04),
      accessCount: atom.accessCount + 1,
      lastAccessedAt: accessedAt,
      updatedAt: accessedAt
    })
  })
}

function updateFeedbackMeta(store: MemoryBodyStore, feedback: MemoryFeedback, result: MemoryFeedbackResult): MemoryFeedbackResult {
  if (!result.applied) return result
  const state = store.load()
  store.save({
    ...state,
    atoms: result.atoms,
    meta: {
      ...state.meta,
      updatedAt: feedback.timestamp,
      totalCorrections: feedback.type === 'correct' ? state.meta.totalCorrections + 1 : state.meta.totalCorrections
    }
  })
  return result
}

function applyFeedbackToStore(store: MemoryBodyStore, feedback: MemoryFeedback): MemoryFeedbackResult {
  return updateFeedbackMeta(store, feedback, applyMemoryFeedback({
    atoms: store.load().atoms,
    feedback
  }))
}

export function createAgentChatMemoryAdapter(options: AgentChatMemoryAdapterOptions): AgentChatMemoryAdapter {
  const now = options.now ?? (() => new Date().toISOString())

  return {
    rememberUserMessage: (message, timestamp) => ingestMemoryText({
      text: message,
      source: 'chat',
      scope: options.scope,
      timestamp,
      store: options.store
    }),
    buildPromptContext: (currentMessage) => {
      const scenarios = currentMessage ? ['chat', 'food_recommendation', 'emotional_support', 'goal_planning'] as const : undefined
      const atoms = retrieveRelevantMemories({
        atoms: options.store.load().atoms,
        scope: options.scope,
        query: currentMessage,
        scenarios,
        minRelevanceScore: currentMessage ? 1 : 0
      })
      const { context, usedAtomIds } = composePromptContext({
        atoms,
        scenarios: scenarios ? [...scenarios] : undefined,
        scope: options.scope
      })
      if (context) {
        const usedAtoms = atoms.filter(atom => usedAtomIds.includes(atom.id))
        trackMemoryAccess(options.store, usedAtoms, now())
        auditPromptUsage(options.store, usedAtomIds, now())
      }
      return context
    },
    applyFeedback: (feedback) => {
      const result = applyFeedbackToStore(options.store, feedback)
      auditFeedback(options.store, feedback, result)
      return result
    },
    applyFeedbackCommand: (message, timestamp) => {
      const command = parseMemoryFeedbackCommand({
        text: message,
        atoms: options.store.load().atoms,
        timestamp
      })
      if (!command.matched) return { matched: false, applied: false }
      const result = applyFeedbackToStore(options.store, command.feedback)
      auditFeedback(options.store, command.feedback, result)
      return {
        matched: true,
        feedback: command.feedback,
        ...result
      }
    }
  }
}
