import { createStorageService } from '../../shared/data/storageFactory'

export interface CompanionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  type: 'chat' | 'encouragement' | 'analysis' | 'alert'
  createdAt: string
}

export interface StudyCompanionState {
  messages: CompanionMessage[]
  lastCheckIn: string
}

const storage = createStorageService<StudyCompanionState>(
  'xinghuanhai-studycompanion-state',
  { messages: [], lastCheckIn: '' }
)

export function getMessages(): CompanionMessage[] {
  return storage.load().messages
}

export function getLastCheckIn(): string {
  return storage.load().lastCheckIn
}

export function addMessage(msg: Omit<CompanionMessage, 'id' | 'createdAt'>): CompanionMessage {
  const state = storage.load()
  const newMsg: CompanionMessage = {
    ...msg,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  state.messages.push(newMsg)
  storage.save(state)
  return newMsg
}

export function deleteMessage(id: string): boolean {
  const state = storage.load()
  const index = state.messages.findIndex((m) => m.id === id)
  if (index === -1) return false
  state.messages.splice(index, 1)
  storage.save(state)
  return true
}

export function clearMessages(): void {
  storage.save({ messages: [], lastCheckIn: '' })
}

export function updateLastCheckIn(date: string): void {
  const state = loadState()
  state.lastCheckIn = date
  saveState(state)
}

export function getRecentMessages(limit: number = 50): CompanionMessage[] {
  const messages = loadState().messages
  return messages.slice(-limit)
}