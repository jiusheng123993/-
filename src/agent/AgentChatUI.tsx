import { useState, useRef, useEffect, useCallback } from 'react'
import type { PersonaId } from '../personas/personaRegistry'
import type { AvatarMood } from '../avatar/avatarTypes'
import { agentRuntime } from './agentRuntime'

export interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
  mood?: AvatarMood
}

export interface AgentChatUIProps {
  isOpen: boolean
  onClose: () => void
  personaId?: PersonaId
  aiRole?: string
  avatarId?: string
  onSendMessage?: (message: string) => Promise<string>
}

function getGreeting(aiRole?: string): string {
  const role = aiRole || 'AI 助手'
  return `你好！我是你的${role}，有什么可以帮你的吗？`
}

function getMoodEmoji(mood?: AvatarMood): string {
  switch (mood) {
    case 'happy': return '😊'
    case 'encouraging': return '💪'
    case 'thinking': return '🤔'
    case 'concerned': return '😟'
    case 'celebrating': return '🎉'
    default: return '👋'
  }
}

export function AgentChatUI({ isOpen, onClose, personaId, aiRole, onSendMessage }: AgentChatUIProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'agent'; content: string }>>([])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: AgentMessage = {
        id: `msg-${Date.now()}`,
        role: 'agent',
        content: getGreeting(aiRole),
        timestamp: new Date().toISOString(),
        mood: 'happy'
      }
      setMessages([greeting])
      conversationHistoryRef.current = []
    }
  }, [isOpen, aiRole])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    conversationHistoryRef.current.push({ role: 'user', content: userMessage.content })
    
    setInputValue('')
    setIsLoading(true)

    const streamingId = `msg-stream-${Date.now()}`
    const streamingMessage: AgentMessage = {
      id: streamingId,
      role: 'agent',
      content: '',
      timestamp: new Date().toISOString(),
      mood: 'thinking'
    }
    setMessages(prev => [...prev, streamingMessage])

    try {
      if (onSendMessage) {
        const responseContent = await onSendMessage(userMessage.content)
        setMessages(prev => prev.map(m =>
          m.id === streamingId
            ? { ...m, content: responseContent, mood: mapMood(undefined) }
            : m
        ))
        conversationHistoryRef.current.push({ role: 'agent', content: responseContent })
      } else {
        const controller = new AbortController()
        abortControllerRef.current = controller

        await agentRuntime.sendMessageStream({
          message: userMessage.content,
          personaId: personaId,
          conversationHistory: conversationHistoryRef.current,
          signal: controller.signal,
          onChunk: (chunk: string) => {
            setMessages(prev => prev.map(m =>
              m.id === streamingId
                ? { ...m, content: m.content + chunk }
                : m
            ))
          }
        })

        const finalContent = conversationHistoryRef.current.length > 0
          ? '' : ''
        setMessages(prev => {
          const streamMsg = prev.find(m => m.id === streamingId)
          if (streamMsg) {
            conversationHistoryRef.current.push({ role: 'agent', content: streamMsg.content })
            return prev.map(m =>
              m.id === streamingId
                ? { ...m, mood: mapMood(undefined) }
                : m
            )
          }
          return prev
        })
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === streamingId
          ? { ...m, content: m.content || '抱歉，出了点问题，请稍后再试。', mood: 'concerned' }
          : m
      ))
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [inputValue, isLoading, onSendMessage, personaId, aiRole])

  function mapMood(mood?: 'neutral' | 'happy' | 'encouraging' | 'thinking' | 'concerned' | 'celebrating'): AvatarMood {
    return mood ?? 'neutral'
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  if (!isOpen) return null

  return (
    <div
      className="agent-chat-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.48)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: 'min(90vw, 800px)',
          height: 'min(85vh, 700px)',
          background: 'var(--surface)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-elevated)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
          >
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px' }}>{aiRole || 'AI 助手'}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>在线</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="关闭聊天"
        >
          ✕
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {messages.map(message => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '16px',
                background: message.role === 'user' 
                  ? 'var(--primary)' 
                  : 'var(--surface-elevated)',
                color: message.role === 'user' ? '#fff' : 'var(--text)',
                fontSize: '14px',
                lineHeight: 1.5,
                wordBreak: 'break-word'
              }}
            >
              <span style={{ marginRight: '6px' }}>
                {message.role === 'agent' ? getMoodEmoji(message.mood) : ''}
              </span>
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '16px',
                background: 'var(--surface-elevated)',
                fontSize: '14px',
                color: 'var(--muted)'
              }}
            >
              正在思考...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '12px'
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            background: 'var(--surface-elevated)',
            color: 'var(--text)',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            background: inputValue.trim() && !isLoading ? 'var(--primary)' : 'var(--surface-elevated)',
            color: inputValue.trim() && !isLoading ? '#fff' : 'var(--muted)',
            cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 200ms'
          }}
          aria-label="发送消息"
        >
          ➤
        </button>
      </div>
      </div>
    </div>
  )
}

export function AgentChatToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: 'none',
        background: 'var(--primary)',
        color: '#fff',
        fontSize: '28px',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647,
        transition: 'transform 200ms, box-shadow 200ms'
      }}
      aria-label="打开 AI 聊天"
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.4)'
      }}
    >
      🤖
    </button>
  )
}
