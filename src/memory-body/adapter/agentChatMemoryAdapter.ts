import { buildMemoryBodyPromptContext } from '../context/memoryBodyContextBuilder'
import type { MemoryScope } from '../core/memoryBodyTypes'
import { ingestMemoryText, type MemoryIngestResult } from '../ingestion/memoryIngestor'
import type { MemoryBodyStore } from '../store/memoryBodyStore'

export interface AgentChatMemoryAdapterOptions {
  store: MemoryBodyStore
  scope: MemoryScope
}

export interface AgentChatMemoryAdapter {
  rememberUserMessage: (message: string, timestamp: string) => MemoryIngestResult
  buildPromptContext: () => string
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
    buildPromptContext: () => buildMemoryBodyPromptContext({
      atoms: options.store.listActiveAtoms(options.scope)
    })
  }
}
