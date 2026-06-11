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

const STORAGE_KEY = 'xinghuanhai-studycompanion-state'

function loadState(): StudyCompanionState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { messages: [], lastCheckIn: '' }
}

function saveState(state: StudyCompanionState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getMessages(): CompanionMessage[] {
  return loadState().messages
}

export function getLastCheckIn(): string {
  return loadState().lastCheckIn
}

export function addMessage(msg: Omit<CompanionMessage, 'id' | 'createdAt'>): CompanionMessage {
  const state = loadState()
  const newMsg: CompanionMessage = {
    ...msg,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  state.messages.push(newMsg)
  saveState(state)
  return newMsg
}

export function deleteMessage(id: string): boolean {
  const state = loadState()
  const index = state.messages.findIndex((m) => m.id === id)
  if (index === -1) return false
  state.messages.splice(index, 1)
  saveState(state)
  return true
}

export function clearMessages(): void {
  saveState({ messages: [], lastCheckIn: '' })
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