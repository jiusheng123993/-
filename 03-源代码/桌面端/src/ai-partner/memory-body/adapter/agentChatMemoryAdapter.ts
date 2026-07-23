import { composePromptContext } from '../context/promptContextComposer'
import { normalizeScore } from '../core/memoryBodyGuards'
import type { MemoryAtom, MemoryScope } from '../core/memoryBodyTypes'
import { applyMemoryFeedback, type MemoryFeedback, type MemoryFeedbackResult } from '../feedback/memoryFeedback'
import { ingestMemoryText, type MemoryIngestResult } from '../ingestion/memoryIngestor'
import { retrieveRelevantMemories } from '../retrieval/memoryRetrieval'
import type { MemoryBodyStore } from '../store/memoryBodyStore'

export interface AgentChatMemoryAdapterOptions {
  store: MemoryBodyStore
  scope: MemoryScope
  now?: () => string
}

export interface AgentChatMemoryAdapter {
  rememberUserMessage: (message: string, timestamp: string) => MemoryIngestResult
  buildPromptContext: (currentMessage?: string) => string
  applyFeedback: (feedback: MemoryFeedback) => MemoryFeedbackResult
  findAtomIdsByContent: (keyword: string) => string[]
  findLatestAtomId: () => string | undefined
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
        minRelevanceScore: 0
      })
      const { context, usedAtomIds } = composePromptContext({
        atoms,
        scenarios: scenarios ? [...scenarios] : undefined,
        scope: options.scope
      })
      if (context) {
        const usedAtoms = atoms.filter(atom => usedAtomIds.includes(atom.id))
        trackMemoryAccess(options.store, usedAtoms, now())
      }
      return context
    },
    applyFeedback: (feedback) => {
      const result = applyFeedbackToStore(options.store, feedback)
      return result
    },
    findAtomIdsByContent: (keyword) => {
      const lowerKeyword = keyword.toLowerCase()
      return options.store.load().atoms
        .filter(atom => (atom.content?.toLowerCase() ?? '').includes(lowerKeyword) || (atom.object?.toLowerCase() ?? '').includes(lowerKeyword))
        .map(atom => atom.id)
    },
    findLatestAtomId: () => {
      const atoms = options.store.load().atoms
        .filter(atom => atom.lifecycle === 'active' || atom.lifecycle === 'confirmed')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return atoms[0]?.id
    }
  }
}
