import { useState, useRef, useEffect, useCallback } from 'react'
import type { PersonaId } from '../personas/personaRegistry'
import type { AvatarMood } from '../avatar/avatarTypes'
import type { MemoryProfile, MemoryEvent } from '../memory/memoryTypes'
import type { MemoryObserver } from '../memory/memoryObserver'
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
  profile?: MemoryProfile
  memoryEvents?: MemoryEvent[]
  memoryObserver?: MemoryObserver | null
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

const TOPIC_KEYWORDS: Record<string, string[]> = {
  '学习': ['学习', '考试', '复习', '课程', '知识', '阅读', '读书', '笔记', '记忆'],
  '目标': ['目标', '计划', '规划', '进度', '达成', '完成'],
  '专注': ['专注', '注意力', '分心', '效率', '番茄', '深度工作'],
  '情绪': ['焦虑', '压力', '心情', '情绪', '放松', '开心', '难过'],
  '习惯': ['习惯', '打卡', '坚持', '自律', '日常'],
  '时间管理': ['时间', '安排', '日程', '拖延', '截止'],
  '成长': ['成长', '进步', '提升', '改变', '突破'],
  '健康': ['健康', '睡眠', '运动', '饮食', '身体'],
}

function extractTopics(content: string): string[] {
  const topics: string[] = []
  const lowerContent = content.toLowerCase()
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => lowerContent.includes(kw))) {
      topics.push(topic)
    }
  }
  return topics.length > 0 ? topics : ['general']
}

export function AgentChatUI({ isOpen, onClose, personaId, aiRole, profile, memoryEvents, memoryObserver, onSendMessage }: AgentChatUIProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamingContentRef = useRef('')

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

  function mapMood(mood?: 'neutral' | 'happy' | 'encouraging' | 'thinking' | 'concerned' | 'celebrating'): AvatarMood {
    return mood ?? 'neutral'
  }

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
    streamingContentRef.current = ''
    
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
          profile: profile,
          memoryEvents: memoryEvents,
          signal: controller.signal,
          onChunk: (chunk: string) => {
            streamingContentRef.current += chunk
            setMessages(prev => prev.map(m =>
              m.id === streamingId
                ? { ...m, content: m.content + chunk }
                : m
            ))
          }
        })

        conversationHistoryRef.current.push({ role: 'agent', content: streamingContentRef.current })
        streamingContentRef.current = ''

        setMessages(prev => {
          const streamMsg = prev.find(m => m.id === streamingId)
          if (streamMsg) {
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
      
      if (memoryObserver && conversationHistoryRef.current.length >= 2) {
        const lastUserMsg = [...conversationHistoryRef.current].reverse().find(h => h.role === 'user')
        const lastAgentMsg = [...conversationHistoryRef.current].reverse().find(h => h.role === 'agent')
        if (lastUserMsg && lastAgentMsg) {
          const topics = extractTopics(lastUserMsg.content)
          const summary = lastUserMsg.content.length > 80 
            ? lastUserMsg.content.slice(0, 80) + '...' 
            : lastUserMsg.content
          memoryObserver.onConversationComplete(summary, topics)
          
          const memoryMatches = lastAgentMsg.content.matchAll(/\[MEMORY:\s*([^\]=]+)\s*=\s*([^\]]+)\]/g)
          for (const match of memoryMatches) {
            const fieldPath = match[1].trim()
            const newValue = match[2].trim()
            memoryObserver.onUserPreferenceLearned(
              `${fieldPath}=${newValue}`,
              `用户在对话中说："${lastUserMsg.content.slice(0, 50)}"`
            )
          }
        }
      }
    }
  }, [inputValue, isLoading, onSendMessage, personaId, aiRole, memoryObserver])

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
