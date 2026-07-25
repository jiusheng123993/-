import { useCallback, useEffect, useRef, useState } from 'react'
import { sendChatMessage, type ChatContext } from '../services/chatService'
import type { ChatMessage, Message, PetInfo } from '../types/chatTypes'
import { logger } from '../logger'

let messageIdCounter = 0

/** 生成唯一消息 ID */
export function genId(): string {
  return `msg_${++messageIdCounter}_${Date.now()}`
}

/** 食物/回忆流程处理器，由主组件注册以打破循环依赖 */
export interface FlowHandlers {
  foodActive: boolean
  selectFood: (text: string) => void | Promise<void>
  memoryActive: boolean
  handleMemoryRecord: (text: string) => void | Promise<void>
}

export interface UseChatCoreParams {
  petInfo: PetInfo
  /** 输入框当前值 */
  inputValue: string
  /** 清空输入框 */
  setInputValue: (value: string) => void
  /** 关闭加号菜单 */
  setPlusMenuOpen: (open: boolean) => void
  /** 隐藏问候快捷操作 */
  setShowGreetingQuickActions: (show: boolean) => void
}

/**
 * 聊天核心 Hook
 *
 * 管理消息列表、流式输出、打字状态与聊天历史，
 * 并通过 handleSend 编排普通聊天流程与食物/回忆流程的分流。
 */
export function useChatCore(params: UseChatCoreParams) {
  const { petInfo, inputValue, setInputValue, setPlusMenuOpen, setShowGreetingQuickActions } = params

  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [streamingId, setStreamingId] = useState<string | null>(null)

  const streamRef = useRef<{
    timer: ReturnType<typeof setInterval> | null
    fullContent: string
    id: string
  } | null>(null)

  const scrollRef = useRef<any>(null)

  /** 食物/回忆流程处理器引用，由主组件通过 setFlowHandlers 注册 */
  const flowHandlersRef = useRef<FlowHandlers>({
    foodActive: false,
    selectFood: () => {},
    memoryActive: false,
    handleMemoryRecord: () => {},
  })

  /** 注册食物/回忆流程处理器 */
  const setFlowHandlers = useCallback((handlers: FlowHandlers) => {
    flowHandlersRef.current = handlers
  }, [])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 999999
      }
    }, 100)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    const newMsg: Message = { ...msg, id: genId() }
    setMessages(prev => [...prev, newMsg])
  }, [])

  const addAiMsg = useCallback(
    (content: string, options?: string[]) => {
      addMessage({ type: 'ai', content, options })
    },
    [addMessage]
  )

  const addUserMsg = useCallback(
    (content: string) => {
      addMessage({ type: 'user', content })
    },
    [addMessage]
  )

  /** 打字机效果逐字输出 AI 回复 */
  const streamAiReply = useCallback((fullContent: string, onDone?: () => void) => {
    const id = genId()
    setMessages(prev => [...prev, { id, type: 'ai', content: '' }])
    setStreamingId(id)

    const chars = Array.from(fullContent)
    let idx = 0

    streamRef.current = { timer: null, fullContent, id }
    streamRef.current.timer = setInterval(() => {
      idx += 2
      if (idx >= chars.length) {
        setMessages(prev =>
          prev.map(m => (m.id === id ? { ...m, content: fullContent } : m))
        )
        if (streamRef.current?.timer) clearInterval(streamRef.current.timer)
        streamRef.current = null
        setStreamingId(null)
        onDone?.()
        return
      }
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, content: chars.slice(0, idx).join('') } : m))
      )
    }, 25)
  }, [])

  /** 跳过流式，立即显示完整内容 */
  const skipStream = useCallback(() => {
    if (streamRef.current) {
      if (streamRef.current.timer) clearInterval(streamRef.current.timer)
      const { fullContent, id } = streamRef.current
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, content: fullContent } : m))
      )
      streamRef.current = null
      setStreamingId(null)
    }
  }, [])

  // 组件卸载时清理流式定时器
  useEffect(() => {
    return () => {
      if (streamRef.current?.timer) clearInterval(streamRef.current.timer)
    }
  }, [])

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text) return
    setInputValue('')
    setPlusMenuOpen(false)
    setShowGreetingQuickActions(false)

    const handlers = flowHandlersRef.current
    if (handlers.foodActive) {
      handlers.selectFood(text)
      return
    }

    if (handlers.memoryActive) {
      handlers.handleMemoryRecord(text)
      return
    }

    addUserMsg(text)

    const context: ChatContext = {
      petId: petInfo.activePet?.id,
      petName: petInfo.name,
      petBreed: petInfo.breed,
      petAge: petInfo.age,
    }

    setIsTyping(true)
    try {
      const result = await sendChatMessage(text, context, chatHistory)
      setIsTyping(false)

      if (result.blocked) {
        addAiMsg(result.reply)
      } else {
        streamAiReply(result.reply, () => {
          setChatHistory(prev => [
            ...prev.slice(-18),
            { role: 'user', content: text },
            { role: 'assistant', content: result.reply },
          ])
        })
      }
    } catch (err) {
      setIsTyping(false)
      logger.error('index', 'AI chat failed', err)
      addAiMsg('抱歉，我现在有点走神了…请稍后再试，或者试试点击快捷按钮进行打卡/查食物。')
    }
  }

  return {
    messages,
    isTyping,
    setIsTyping,
    chatHistory,
    setChatHistory,
    streamingId,
    scrollRef,
    addMessage,
    addAiMsg,
    addUserMsg,
    streamAiReply,
    skipStream,
    scrollToBottom,
    handleSend,
    setFlowHandlers,
  }
}

export type UseChatCoreReturn = ReturnType<typeof useChatCore>
