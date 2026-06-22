import { buildMemoryBodyPromptContext } from '../context/memoryBodyContextBuilder'
import type { MemoryScope } from '../core/memoryBodyTypes'
import { ingestMemoryText, type MemoryIngestResult } from '../ingestion/memoryIngestor'
import { retrieveRelevantMemories } from '../retrieval/memoryRetrieval'
import type { MemoryBodyStore } from '../store/memoryBodyStore'

export interface AgentChatMemoryAdapterOptions {
  store: MemoryBodyStore
  scope: MemoryScope
}

export interface AgentChatMemoryAdapter {
  rememberUserMessage: (message: string, timestamp: string) => MemoryIngestResult
  buildPromptContext: (currentMessage?: string) => string
}

export function createAgentChatMemoryAdapter(options: AgentChatMemoryAdapterOptions): AgentChatMemoryAdapter {
  return {
    rememberUserMessage: (message, timestamp) => ingestMemoryText({
      text: message,
      source: 'chat',
      scope: options.scope,
      timestamp,
      store: options.store
    }),
    buildPromptContext: (currentMessage) => buildMemoryBodyPromptContext({
      atoms: retrieveRelevantMemories({
        atoms: options.store.load().atoms,
        scope: options.scope,
        query: currentMessage,
        scenarios: currentMessage ? ['chat', 'food_recommendation', 'emotional_support', 'goal_planning'] : undefined,
        minRelevanceScore: currentMessage ? 1 : 0
      })
    })
  }
}
