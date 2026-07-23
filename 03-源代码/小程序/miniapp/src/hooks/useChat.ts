import { useCallback } from 'react'
import { useChatStore } from '../stores/chatStore'
import { sendChatMessage } from '../services/chatService'
import type { ChatMessage } from '../types/chatTypes'
import { usePetStore } from '../stores/petStore'

export function useChat() {
  const { messages, isLoading, addMessage, setLoading } = useChatStore()
  const { currentPet } = usePetStore()

  const send = useCallback(async (text: string) => {
    if (!text.trim()) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    addMessage(userMsg)
    setLoading(true)

    try {
      const result = await sendChatMessage(text, {
        petId: currentPet?.id,
        petName: currentPet?.name || '青橘',
        petBreed: currentPet?.breed,
      }, messages)

      const aiMsg: ChatMessage = { role: 'assistant', content: result.reply }
      addMessage(aiMsg)
    } catch {
      addMessage({ role: 'assistant', content: '抱歉，我暂时无法回复，请稍后再试。' })
    } finally {
      setLoading(false)
    }
  }, [messages, currentPet, addMessage, setLoading])

  return { messages, isLoading, send }
}
