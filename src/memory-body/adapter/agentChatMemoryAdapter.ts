import { buildMemoryBodyPromptContext } from '../context/memoryBodyContextBuilder'
import type { MemoryAtom, MemoryScope } from '../core/memoryBodyTypes'
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
}

function trackMemoryAccess(store: MemoryBodyStore, atoms: MemoryAtom[], accessedAt: string): void {
  atoms.forEach(atom => {
    store.upsertAtom({
      ...atom,
      accessCount: atom.accessCount + 1,
      lastAccessedAt: accessedAt,
      updatedAt: accessedAt
    })
  })
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
    }
  }
}
