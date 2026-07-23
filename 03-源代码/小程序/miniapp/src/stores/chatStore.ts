import create from 'zustand'
import type { ChatMessage } from '../types/chatTypes'

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  activePetId: string | null
  activePetName: string
  addMessage: (msg: ChatMessage) => void
  setLoading: (loading: boolean) => void
  setActivePet: (id: string, name: string) => void
  resetMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      role: 'assistant',
      content: '今天你的毛孩子怎么样？来打个卡，或者查查食物安全，我都能帮你~'
    }
  ],
  isLoading: false,
  activePetId: null,
  activePetName: '青橘',
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setActivePet: (id, name) => set({ activePetId: id, activePetName: name }),
  resetMessages: () => set({
    messages: [
      { role: 'assistant', content: '今天你的毛孩子怎么样？来打个卡，或者查查食物安全，我都能帮你~' }
    ]
  }),
}))
