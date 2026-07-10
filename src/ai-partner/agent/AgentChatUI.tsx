import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { usePlatform } from '../../shared/platforms'
import type { PersonaId } from '../personas/personaRegistry'
import type { AvatarMood } from '../avatar/avatarTypes'
import type { MemoryProfile, MemoryEvent } from '../memory/memoryTypes'
import type { MemoryObserver } from '../memory/memoryObserver'
import type { RelationshipHealthMonitor } from '../personas/relationshipHealthMonitor'
import type { PersonaSafetyGate } from '../personas/personaSafetyGate'
import { createAgentChatMemoryAdapter, createBrowserMemoryBodyStore } from '../memory-body'
import type { AgentChatMemoryAdapter } from '../memory-body'
import type { MemoryFeedbackType } from '../memory-body'
import { agentRuntime } from './agentRuntime'
import { getMoodEmoji } from '../avatar/animator'

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
  userId?: string
  profile?: MemoryProfile
  memoryEvents?: MemoryEvent[]
  memoryObserver?: MemoryObserver | null
  onSendMessage?: (message: string) => Promise<string>
  healthMonitor?: RelationshipHealthMonitor | null
  safetyGate?: PersonaSafetyGate | null
  onConversationComplete?: (userMessage: string, agentResponse: string) => void
}

function getGreeting(aiRole?: string): string {
  const role = aiRole || 'AI 助手'
  return `你好！我是你的${role}，有什么可以帮你的吗？`
}

const CHAT_HISTORY_KEY = 'agent_chat_history'
const MEMORY_BODY_PROJECT_ID = 'xinghuanhai-growth-workbench'
const DEFAULT_MEMORY_BODY_USER_ID = 'default-user'
const MAX_HISTORY_MESSAGES = 50

const FEEDBACK_PATTERNS: { pattern: RegExp; type: MemoryFeedbackType; extractKeyword: (content: string) => string; response: string }[] = [
  { pattern: /忘掉(.+?)(?:，|。|！|？|$)|忘记(.+?)(?:，|。|！|？|$)|不要.*记住(.+?)(?:，|。|！|？|$)|忘掉.*不要记/i, type: 'forget', extractKeyword: (c) => { const m = c.match(/忘掉(.+?)(?:，|。|！|？|$)|忘记(.+?)(?:，|。|！|？|$)|不要.*记住(.+?)(?:，|。|！|？|$)/); return (m?.[1] || m?.[2] || m?.[3] || '').trim(); }, response: '已按你的要求忘掉这条记忆。' },
  { pattern: /纠正.*记忆|修正.*记忆|更正.*记忆|不是(.+?)，.*是(.+?)|是(.+?)，不是(.+)/i, type: 'correct', extractKeyword: (c) => { const m = c.match(/不是(.+?)[，,]\s*是(.+?)|是(.+?)[，,]\s*不是(.+)/); return (m?.[1] || m?.[4] || '').trim(); }, response: '已按你的纠正更新记忆。' },
  { pattern: /确认.*记忆|确认.*正确|确认.*没错/i, type: 'confirm', extractKeyword: () => '', response: '已确认这条记忆。' }
]

function tryApplyFeedbackCommand(
  adapter: AgentChatMemoryAdapter,
  content: string,
  timestamp: string
): string | null {
  for (const { pattern, type, extractKeyword, response } of FEEDBACK_PATTERNS) {
    if (pattern.test(content)) {
      const keyword = extractKeyword(content)
      if (type === 'confirm') {
        const searchKeyword = keyword || content.replace(/确认.*记忆|确认.*正确|确认.*没错|[，。！？\s]/g, '')
        const atomIds = searchKeyword ? adapter.findAtomIdsByContent(searchKeyword) : []
        const atomId = atomIds[0] || adapter.findLatestAtomId()
        if (atomId) {
          adapter.applyFeedback({ type, atomId, timestamp })
        }
      } else if (keyword) {
        const atomIds = adapter.findAtomIdsByContent(keyword)
        if (atomIds.length > 0) {
          if (type === 'correct') {
            const correctMatch = content.match(/不是(.+?)[，,]\s*是(.+?)|是(.+?)[，,]\s*不是(.+)/)
            const newContent = (correctMatch?.[2] || correctMatch?.[3] || '').trim()
            adapter.applyFeedback({
              type,
              atomId: atomIds[0],
              timestamp,
              correction: { id: `corrected_${atomIds[0]}`, predicate: 'likes', object: newContent, content: newContent }
            })
          } else {
            adapter.applyFeedback({ type, atomId: atomIds[0], timestamp })
          }
        }
      }
      return response
    }
  }
  return null
}

function loadChatHistory(): AgentMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(-MAX_HISTORY_MESSAGES)
  } catch {
    return []
  }
}

function saveChatHistory(messages: AgentMessage[]): void {
  try {
    const toSave = messages.slice(-MAX_HISTORY_MESSAGES)
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave))
  } catch {
    // localStorage full or unavailable
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

const PREFERENCE_PATTERNS: Array<{
  pattern: RegExp
  fieldPath: string
  extract: (match: RegExpMatchArray) => string
}> = [
  { pattern: /我喜欢吃[「「]?(.{1,20})[」」]?/g, fieldPath: 'customPreferences.foodPreference', extract: m => m[1].trim() },
  { pattern: /我爱吃[「「]?(.{1,20})[」」]?/g, fieldPath: 'customPreferences.foodPreference', extract: m => m[1].trim() },
  { pattern: /我最喜欢的食物是[「「]?(.{1,20})[」」]?/g, fieldPath: 'customPreferences.foodPreference', extract: m => m[1].trim() },
  { pattern: /我喜欢[「「]?(.{1,20})[」」]?(?:这个)?颜色/g, fieldPath: 'customPreferences.colorPreference', extract: m => m[1].trim() },
  { pattern: /我最喜欢的颜色是[「「]?(.{1,10})[」」]?/g, fieldPath: 'customPreferences.colorPreference', extract: m => m[1].trim() },
  { pattern: /我喜欢听[「「]?(.{1,20})[」」]?(?:的)?(?:歌|音乐)/g, fieldPath: 'customPreferences.musicPreference', extract: m => m[1].trim() },
  { pattern: /我最喜欢的(?:歌手|乐队)是[「「]?(.{1,20})[」」]?/g, fieldPath: 'customPreferences.musicPreference', extract: m => m[1].trim() },
  { pattern: /我喜欢看[「「]?(.{1,20})[」」]?(?:的)?(?:电影|剧|动漫|动画)/g, fieldPath: 'customPreferences.entertainmentPreference', extract: m => m[1].trim() },
  { pattern: /我最喜欢的(?:电影|剧|动漫)是[「「]?(.{1,20})[」」]?/g, fieldPath: 'customPreferences.entertainmentPreference', extract: m => m[1].trim() },
  { pattern: /我喜欢(?:打|玩)[「「]?(.{1,15})[」」]?/g, fieldPath: 'customPreferences.hobbyPreference', extract: m => m[1].trim() },
  { pattern: /我的爱好是[「「]?(.{1,20})[」」]?/g, fieldPath: 'customPreferences.hobbyPreference', extract: m => m[1].trim() },
  { pattern: /我叫[「「]?(.{1,15})[」」]?/g, fieldPath: 'identity.nickname', extract: m => m[1].trim() },
  { pattern: /我的名字是[「「]?(.{1,15})[」」]?/g, fieldPath: 'identity.nickname', extract: m => m[1].trim() },
  { pattern: /我是[「「]?(.{1,15})[」」]?(?:，|。|$)/g, fieldPath: 'identity.nickname', extract: m => m[1].trim() },
  { pattern: /我(?:是|在)(?:一[个名位]?)?(学生|老师|工程师|设计师|程序员|产品经理|运营|医生|律师|自由职业|创业者)/g, fieldPath: 'identity.currentRole', extract: m => m[1].trim() },
  { pattern: /我的目标是[「「]?(.{1,40})[」」]?/g, fieldPath: 'goals.primaryGoal', extract: m => m[1].trim() },
  { pattern: /我想[「「]?(.{1,40})[」」]?/g, fieldPath: 'goals.primaryGoal', extract: m => m[1].trim() },
]

function extractPreferencesFromMessage(content: string): Array<{ fieldPath: string; value: string }> {
  const results: Array<{ fieldPath: string; value: string }> = []
  const seen = new Set<string>()
  for (const { pattern, fieldPath, extract } of PREFERENCE_PATTERNS) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(content)) !== null) {
      const value = extract(match)
      if (value && value.length >= 1 && value.length <= 40) {
        const key = `${fieldPath}=${value}`
        if (!seen.has(key)) {
          seen.add(key)
          results.push({ fieldPath, value })
        }
      }
    }
  }
  return results
}

export function AgentChatUI({ isOpen, onClose, personaId, aiRole, userId, profile, memoryEvents, memoryObserver, onSendMessage, healthMonitor, safetyGate, onConversationComplete }: AgentChatUIProps) {
  const [messages, setMessages] = useState<AgentMessage[]>(() => loadChatHistory())
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamingContentRef = useRef('')
  const memoryBodyUserId = userId || profile?.scope.userId || DEFAULT_MEMORY_BODY_USER_ID
  const memoryBodyAdapter = useMemo(() => createAgentChatMemoryAdapter({
    store: createBrowserMemoryBodyStore(memoryBodyUserId, MEMORY_BODY_PROJECT_ID),
    scope: { userId: memoryBodyUserId, projectId: MEMORY_BODY_PROJECT_ID }
  }), [memoryBodyUserId])

  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'agent'; content: string }>>([])

  useEffect(() => {
    if (isOpen) {
      const restored = loadChatHistory()
      if (restored.length > 0) {
        setMessages(restored)
        conversationHistoryRef.current = restored
          .filter(m => m.role === 'user' || m.role === 'agent')
          .map(m => ({ role: m.role as 'user' | 'agent', content: m.content }))
      } else {
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
    }
  }, [isOpen, aiRole])

  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages)
    }
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return

    const userContent = inputValue.trim()

    const crisisResult = healthMonitor?.checkCrisis('current-user', userContent)

    const dialogueSafetyResult = safetyGate?.validateDialogue(userContent, '')
    if (dialogueSafetyResult && !dialogueSafetyResult.ok) {
      const blockedMessage: AgentMessage = {
        id: `msg-${Date.now()}`,
        role: 'agent',
        content: `🛡️ 内容安全提醒：${dialogueSafetyResult.reason || '您的消息包含不适宜内容，请修改后重试。'}`,
        timestamp: new Date().toISOString(),
        mood: 'concerned'
      }
      setMessages(prev => [...prev, blockedMessage])
      setInputValue('')
      return
    }

    const userMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userContent,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    conversationHistoryRef.current.push({ role: 'user', content: userMessage.content })
    streamingContentRef.current = ''
    
    setInputValue('')

    const feedbackResult = tryApplyFeedbackCommand(memoryBodyAdapter, userMessage.content, userMessage.timestamp)
    if (feedbackResult) {
      const agentMessage: AgentMessage = {
        id: `msg-feedback-${Date.now()}`,
        role: 'agent',
        content: feedbackResult,
        timestamp: new Date().toISOString(),
        mood: 'happy'
      }
      setMessages(prev => [...prev, agentMessage])
      conversationHistoryRef.current.push({ role: 'agent', content: feedbackResult })
      return
    }

    setIsLoading(true)

    memoryBodyAdapter.rememberUserMessage(userMessage.content, userMessage.timestamp)
    const memoryBodyContext = memoryBodyAdapter.buildPromptContext(userMessage.content)

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
      if (crisisResult?.isCrisis) {
        setMessages(prev => prev.map(m =>
          m.id === streamingId
            ? { ...m, content: crisisResult.recommendedAction, mood: 'concerned' }
            : m
        ))
        conversationHistoryRef.current.push({ role: 'agent', content: crisisResult.recommendedAction })
      } else if (onSendMessage) {
        const responseContent = await onSendMessage(userMessage.content)
        setMessages(prev => prev.map(m =>
          m.id === streamingId
            ? { ...m, content: responseContent, mood: 'neutral' }
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
          memoryBodyContext,
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
                ? { ...m, mood: 'neutral' }
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

          const extractedPrefs = extractPreferencesFromMessage(lastUserMsg.content)
          for (const { fieldPath, value } of extractedPrefs) {
            memoryObserver.onUserPreferenceLearned(
              `${fieldPath}=${value}`,
              `用户在对话中说："${lastUserMsg.content.slice(0, 50)}"`
            )
          }

          onConversationComplete?.(lastUserMsg.content, lastAgentMsg.content)
        }
      }
    }
  }, [inputValue, isLoading, onSendMessage, personaId, memoryObserver, healthMonitor, safetyGate, onConversationComplete, memoryEvents, profile, memoryBodyAdapter])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const conversationDailyMinutes = useMemo(() => {
    if (!userId || !safetyGate) return 0
    const userMessages = messages.filter(m => m.role === 'user')
    return userMessages.length * 2
  }, [messages, userId, safetyGate])

  const conversationHealthResult = useMemo(() => {
    if (!userId || !safetyGate || conversationDailyMinutes === 0) return null
    return safetyGate.checkConversationHealth(userId, conversationDailyMinutes)
  }, [userId, safetyGate, conversationDailyMinutes])

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
        {conversationHealthResult && !conversationHealthResult.ok && (
          <div style={{
            padding: 12,
            borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: '#f59e0b'
          }}>
            <span>⚠️</span>
            <span>{conversationHealthResult.reason}</span>
          </div>
        )}
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
  const { deviceCategory } = usePlatform()
  const isMobile = deviceCategory === 'mobile'

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        right: isMobile ? '16px' : '24px',
        bottom: isMobile ? '16px' : '24px',
        width: isMobile ? '56px' : '60px',
        height: isMobile ? '56px' : '60px',
        borderRadius: '50%',
        border: 'none',
        background: 'var(--primary)',
        color: '#fff',
        fontSize: isMobile ? '26px' : '28px',
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647,
        transition: 'transform 200ms, box-shadow 200ms'
      }}
      aria-label="打开 AI 聊天"
      onMouseEnter={isMobile ? undefined : e => {
        e.currentTarget.style.transform = 'scale(1.1)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)'
      }}
      onMouseLeave={isMobile ? undefined : e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.4)'
      }}
    >
      🤖
    </button>
  )
}
