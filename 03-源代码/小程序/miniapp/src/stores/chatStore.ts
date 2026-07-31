/**
 * AI 聊天状态管理
 * 管理 chat 消息列表、当前对话宠物和加载状态
 */
import create from 'zustand'
import type { ChatMessage } from '../types/chatTypes'

/** 聊天状态定义 */
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
  /** 添加一条聊天消息 */
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  /** 设置聊天加载状态 */
  setLoading: (loading) => set({ isLoading: loading }),
  /** 设置当前对话的宠物 */
  setActivePet: (id, name) => set({ activePetId: id, activePetName: name }),
  /** 重置聊天消息到初始欢迎语 */
  resetMessages: () => set({
    messages: [
      { role: 'assistant', content: '今天你的毛孩子怎么样？来打个卡，或者查查食物安全，我都能帮你~' }
    ]
  }),
}))
