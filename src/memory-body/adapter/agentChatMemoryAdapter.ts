import { buildMemoryBodyPromptContext } from '../context/memoryBodyContextBuilder'
import { normalizeScore } from '../core/memoryBodyGuards'
import type { MemoryAtom, MemoryScope } from '../core/memoryBodyTypes'
import { applyMemoryFeedback, type MemoryFeedback, type MemoryFeedbackResult } from '../feedback/memoryFeedback'
import { parseMemoryFeedbackCommand } from '../feedback/memoryFeedbackCommandParser'
import { ingestMemoryText, type MemoryIngestResult } from '../ingestion/memoryIngestor'
import { retrieveRelevantMemories } from '../retrieval/memoryRetrieval'
import type { MemoryBodyStore } from '../store/memoryBodyStore'

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
      const atoms = retrieveRelevantMemories({
        atoms: options.store.load().atoms,
        scope: options.scope,
        query: currentMessage,
        scenarios: currentMessage ? ['chat', 'food_recommendation', 'emotional_support', 'goal_planning'] : undefined,
        minRelevanceScore: currentMessage ? 1 : 0
      })
      const context = buildMemoryBodyPromptContext({ atoms })
      if (context) trackMemoryAccess(options.store, atoms, now())
      return context
    },
    applyFeedback: (feedback) => applyFeedbackToStore(options.store, feedback),
    applyFeedbackCommand: (message, timestamp) => {
      const command = parseMemoryFeedbackCommand({
        text: message,
        atoms: options.store.load().atoms,
        timestamp
      })
      if (!command.matched) return { matched: false, applied: false }
      return {
        matched: true,
        feedback: command.feedback,
        ...applyFeedbackToStore(options.store, command.feedback)
      }
    }
  }
}
