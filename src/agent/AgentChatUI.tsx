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
  avatarId?: string
  onSendMessage?: (message: string) => Promise<string>
}

const PERSONA_GREETINGS: Record<string, string> = {
  default: '你好！我是你的 AI 学习搭子，有什么可以帮你的吗？',
  exam_prep: '你好！我是你的备考助手，让我们一起冲刺吧！',
  study_buddy: '你好！一起学习的路上有我陪你。',
  life_coach: '你好！有什么生活或学习上的困惑都可以问我。',
}

function getGreeting(personaId?: string): string {
  if (!personaId) return PERSONA_GREETINGS.default
  return PERSONA_GREETINGS[personaId] ?? PERSONA_GREETINGS.default
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

export function AgentChatUI({ isOpen, onClose, personaId, onSendMessage }: AgentChatUIProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'agent'; content: string }>>([])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: AgentMessage = {
        id: `msg-${Date.now()}`,
        role: 'agent',
        content: getGreeting(personaId),
        timestamp: new Date().toISOString(),
        mood: 'happy'
      }
      setMessages([greeting])
      conversationHistoryRef.current = []
    }
  }, [isOpen, personaId])

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

    try {
      let responseContent: string
      let responseMood: AvatarMood = 'thinking'

      if (onSendMessage) {
        responseContent = await onSendMessage(userMessage.content)
      } else {
        const response = await agentRuntime.sendMessage({
          message: userMessage.content,
          personaId: personaId,
          conversationHistory: conversationHistoryRef.current
        })
        responseContent = response.content
        responseMood = mapMood(response.mood)
      }

      const agentMessage: AgentMessage = {
        id: `msg-${Date.now()}`,
        role: 'agent',
        content: responseContent,
        timestamp: new Date().toISOString(),
        mood: responseMood
      }
      setMessages(prev => [...prev, agentMessage])
      conversationHistoryRef.current.push({ role: 'agent', content: responseContent })
    } catch {
      const errorMessage: AgentMessage = {
        id: `msg-${Date.now()}`,
        role: 'agent',
        content: '抱歉，出了点问题，请稍后再试。',
        timestamp: new Date().toISOString(),
        mood: 'concerned'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, onSendMessage, personaId])

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
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        width: '380px',
        height: '520px',
        background: 'var(--surface)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1001,
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
            <div style={{ fontWeight: 600, fontSize: '15px' }}>AI 学习搭子</div>
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
        zIndex: 1000,
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
