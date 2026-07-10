import { useState, useEffect, useCallback, useRef } from 'react'
import { useApiKeyStatus } from '../../shared/hooks/useApiKeyStatus'
import { useMembership } from '../../shared/hooks/useMembership'
import { sendAgentChatMessageStream } from '../../ai-partner/agent/agentRuntime'
import {
  getMessages,
  addMessage,
  deleteMessage,
  clearMessages,
  updateLastCheckIn,
  getLastCheckIn,
  type CompanionMessage,
} from './studyCompanionService'
import styles from './StudyCompanionUI.module.css'

interface StudyCompanionUIProps {
  userId?: string
}

type QuickAction = {
  id: string
  label: string
  emoji: string
  prompt: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'anxiety', label: '考前焦虑', emoji: '😰', prompt: '我最近因为考试很焦虑，能帮我缓解一下吗？' },
  { id: 'review', label: '学习复盘', emoji: '📝', prompt: '帮我做一下今天的学习复盘吧' },
  { id: 'encourage', label: '需要鼓励', emoji: '💪', prompt: '最近学习有点疲惫，给我一些鼓励吧' },
  { id: 'breath', label: '呼吸放松', emoji: '🧘', prompt: '引导我做一次呼吸放松练习' },
  { id: 'mindful', label: '正念练习', emoji: '🌸', prompt: '带我做一个简短的正念练习' },
  { id: 'motivation', label: '找回动力', emoji: '🔥', prompt: '我最近学习动力不足，帮我找回状态' },
]

export function StudyCompanionUI({ userId }: StudyCompanionUIProps) {
  const { hasAnyKey } = useApiKeyStatus()
  const { isMember } = useMembership(userId)

  const [messages, setMessages] = useState<CompanionMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [showBreathGuide, setShowBreathGuide] = useState(false)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle')
  const [breathCount, setBreathCount] = useState(0)
  const [breathSeconds, setBreathSeconds] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadData = useCallback(() => {
    setMessages(getMessages())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const canUseAI = hasAnyKey && isMember
  const [showPermissionBanner, setShowPermissionBanner] = useState(false)
  const [showFallbackNotice, setShowFallbackNotice] = useState(false)

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg = addMessage({ role: 'user', content: trimmed, type: 'chat' })
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setShowQuickActions(false)

    if (!canUseAI) {
      setShowPermissionBanner(true)
      setShowFallbackNotice(true)
      const fallbackMsg = addMessage({
        role: 'assistant',
        content: getFallbackResponse(trimmed),
        type: 'encouragement',
      })
      setMessages((prev) => [...prev, fallbackMsg])
      return
    }

    setShowPermissionBanner(false)
    setShowFallbackNotice(false)

    setIsLoading(true)
    setStreamingContent('')

    let fullContent = ''
    try {
      await sendAgentChatMessageStream({
        message: trimmed,
        personaId: 'exam-student',
        providerId: 'deepseek',
        conversationHistory: messages.slice(-10).map((m) => ({
          role: m.role === 'user' ? 'user' : 'agent',
          content: m.content,
        })),
        onChunk: (chunk: string) => {
          fullContent += chunk
          setStreamingContent(fullContent)
        },
      })

      const assistantMsg = addMessage({
        role: 'assistant',
        content: fullContent || '抱歉，我暂时无法回复，请稍后再试。',
        type: 'chat',
      })
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      const errorMsg = addMessage({
        role: 'assistant',
        content: '抱歉，连接出现了一些问题。请检查网络后重试。💙',
        type: 'alert',
      })
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
      setStreamingContent('')
    }
  }, [isLoading, canUseAI, messages])

  const handleQuickAction = (action: QuickAction) => {
    handleSend(action.prompt)
  }

  const handleClearChat = () => {
    clearMessages()
    setMessages([])
    setShowQuickActions(true)
  }

  const handleDeleteMessage = (id: string) => {
    deleteMessage(id)
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  const handleCheckIn = () => {
    const today = new Date().toISOString().slice(0, 10)
    updateLastCheckIn(today)
    handleSend('我今天来打卡报到了，帮我做一下今日学习状态检查吧')
  }

  const startBreathGuide = () => {
    setShowBreathGuide(true)
    setBreathPhase('inhale')
    setBreathCount(0)
    setBreathSeconds(0)
    runBreathCycle(0)
  }

  const stopBreathGuide = () => {
    if (breathTimerRef.current) {
      clearInterval(breathTimerRef.current)
      breathTimerRef.current = null
    }
    setShowBreathGuide(false)
    setBreathPhase('idle')
    setBreathCount(0)
    setBreathSeconds(0)
  }

  const runBreathCycle = (startCount: number) => {
    let count = startCount
    let seconds = 0
    let phase: 'inhale' | 'hold' | 'exhale' = 'inhale'

    breathTimerRef.current = setInterval(() => {
      seconds++
      setBreathSeconds(seconds)

      if (phase === 'inhale' && seconds >= 4) {
        phase = 'hold'
        seconds = 0
        setBreathPhase('hold')
      } else if (phase === 'hold' && seconds >= 7) {
        phase = 'exhale'
        seconds = 0
        setBreathPhase('exhale')
      } else if (phase === 'exhale' && seconds >= 8) {
        count++
        setBreathCount(count)
        if (count >= 4) {
          stopBreathGuide()
          const completeMsg = addMessage({
            role: 'assistant',
            content: '很好！4 轮呼吸练习完成。感觉怎么样？是不是平静了一些？记得在感到焦虑的时候随时来找我做呼吸练习。💙',
            type: 'encouragement',
          })
          setMessages((prev) => [...prev, completeMsg])
          return
        }
        phase = 'inhale'
        seconds = 0
        setBreathPhase('inhale')
      }
      setBreathSeconds(seconds)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  const lastCheckIn = getLastCheckIn()
  const todayStr = new Date().toISOString().slice(0, 10)
  const hasCheckedInToday = lastCheckIn === todayStr

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.companionAvatar}>🤗</span>
          <div>
            <h3 className={styles.companionName}>小寰</h3>
            <p className={styles.companionDesc}>你的 AI 备考陪伴伙伴</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {!hasCheckedInToday && (
            <button className={styles.checkInBtn} onClick={handleCheckIn} type="button">
              📍 今日打卡
            </button>
          )}
          <button className={styles.clearBtn} onClick={handleClearChat} type="button" title="清空对话">
            🗑️
          </button>
        </div>
      </div>

      {showBreathGuide && (
        <div className={styles.breathGuide}>
          <div className={styles.breathCircle}>
            <div
              className={`${styles.breathAnim} ${breathPhase === 'inhale' ? styles.inhale : breathPhase === 'hold' ? styles.hold : styles.exhale}`}
            />
            <div className={styles.breathText}>
              {breathPhase === 'inhale' && '吸气'}
              {breathPhase === 'hold' && '屏息'}
              {breathPhase === 'exhale' && '呼气'}
            </div>
            <div className={styles.breathTimer}>{breathSeconds}s</div>
          </div>
          <div className={styles.breathInfo}>
            第 {breathCount + 1}/4 轮 · 4-7-8 呼吸法
          </div>
          <button className={styles.breathStopBtn} onClick={stopBreathGuide} type="button">
            结束练习
          </button>
        </div>
      )}

      <div className={styles.messages}>
        {messages.length === 0 && showQuickActions && (
          <div className={styles.welcome}>
            <div className={styles.welcomeEmoji}>💙</div>
            <h4>嗨！我是小寰</h4>
            <p>无论你是感到焦虑、需要鼓励，还是想复盘学习，我都在这里陪着你。试试下面的快速入口吧：</p>
            <div className={styles.quickActions}>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  className={styles.quickActionBtn}
                  onClick={() => handleQuickAction(action)}
                  type="button"
                >
                  <span className={styles.quickActionEmoji}>{action.emoji}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
            <button className={styles.breathStartBtn} onClick={startBreathGuide} type="button">
              🧘 开始呼吸练习
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${msg.role === 'user' ? styles.userMsg : styles.assistantMsg} ${styles[msg.type]}`}
          >
            <div className={styles.messageAvatar}>
              {msg.role === 'user' ? '👤' : '🤗'}
            </div>
            <div className={styles.messageContent}>
              <div className={styles.messageText}>{msg.content}</div>
              <div className={styles.messageMeta}>
                <span className={styles.messageTime}>
                  {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  className={styles.deleteMsgBtn}
                  onClick={() => handleDeleteMessage(msg.id)}
                  type="button"
                  title="删除消息"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}

        {isLoading && streamingContent && (
          <div className={`${styles.message} ${styles.assistantMsg}`}>
            <div className={styles.messageAvatar}>🤗</div>
            <div className={styles.messageContent}>
              <div className={styles.messageText}>{streamingContent}</div>
              <span className={styles.typingIndicator}>输入中...</span>
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className={`${styles.message} ${styles.assistantMsg}`}>
            <div className={styles.messageAvatar}>🤗</div>
            <div className={styles.messageContent}>
              <div className={styles.typingDots}>
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        {!canUseAI && showPermissionBanner && (
          <div className={styles.permissionBanner}>
            <span className={styles.permissionBannerIcon}>
              {!hasAnyKey ? '🔑' : '🔒'}
            </span>
            <span className={styles.permissionBannerText}>
              {!hasAnyKey
                ? '尚未配置 AI API Key，小寰无法使用 AI 回复'
                : 'AI 陪伴是会员专属功能，升级后即可使用'}
            </span>
            <span className={styles.permissionBannerSub}>
              {!hasAnyKey
                ? '前往设置页面配置讯飞星火或其他 AI 服务商的 API Key'
                : '当前使用离线模式回复，内容为预设模板'}
            </span>
            <div className={styles.permissionBannerActions}>
              {!hasAnyKey ? (
                <button
                  className={styles.permissionBannerBtnPrimary}
                  onClick={() => {
                    const event = new CustomEvent('navigate', { detail: { page: 'settings' } })
                    window.dispatchEvent(event)
                  }}
                  type="button"
                >
                  前往配置
                </button>
              ) : (
                <>
                  <button
                    className={styles.permissionBannerBtnPrimary}
                    onClick={() => {
                      const event = new CustomEvent('navigate', { detail: { page: 'membership' } })
                      window.dispatchEvent(event)
                    }}
                    type="button"
                  >
                    了解会员
                  </button>
                  <button
                    className={styles.permissionBannerBtn}
                    onClick={() => setShowPermissionBanner(false)}
                    type="button"
                  >
                    知道了
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        {!canUseAI && showFallbackNotice && messages.length > 0 && (
          <div className={styles.fallbackNotice}>
            <span className={styles.fallbackNoticeIcon}>⚠️</span>
            <span>当前为离线模式，回复内容为预设模板，非 AI 生成</span>
          </div>
        )}
        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="和小寰说说你的心情..."
            disabled={isLoading}
          />
          <button
            className={styles.sendBtn}
            onClick={() => handleSend(input)}
            disabled={isLoading || !input.trim()}
            type="button"
          >
            发送
          </button>
        </div>
        {messages.length > 0 && (
          <div className={styles.miniQuickActions}>
            <button onClick={() => handleQuickAction(QUICK_ACTIONS[0])} type="button">😰 焦虑</button>
            <button onClick={() => handleQuickAction(QUICK_ACTIONS[2])} type="button">💪 鼓励</button>
            <button onClick={startBreathGuide} type="button">🧘 呼吸</button>
          </div>
        )}
      </div>
    </div>
  )
}

function getFallbackResponse(input: string): string {
  const lower = input.toLowerCase()

  if (lower.includes('焦虑') || lower.includes('紧张') || lower.includes('担心')) {
    return '我能感受到你的焦虑。考试前的紧张是很正常的，这说明你在乎这件事。试试做几次深呼吸：慢慢吸气 4 秒，屏住 7 秒，缓缓呼出 8 秒。重复几次，你会发现心跳慢慢平静下来。💙'
  }

  if (lower.includes('累') || lower.includes('疲惫') || lower.includes('困')) {
    return '学习累了就休息一下吧，这不是偷懒，是为了更好地前进。去喝杯水，站起来走走，或者闭眼听一首喜欢的歌。我在这里等你回来。☕'
  }

  if (lower.includes('鼓励') || lower.includes('加油') || lower.includes('动力')) {
    return '你知道吗？每一个坚持学习的日子，都在让你离目标更近一步。你已经很棒了，不要因为一时的困难否定自己。相信自己，你一定可以的！💪✨'
  }

  if (lower.includes('复盘') || lower.includes('总结') || lower.includes('回顾')) {
    return '好的，让我们一起来回顾一下。今天你完成了哪些学习任务？遇到了什么困难？有什么收获？写下来，你会发现其实自己已经进步了很多。📝'
  }

  if (lower.includes('呼吸') || lower.includes('放松') || lower.includes('冥想')) {
    return '来，找一个舒服的姿势坐好。闭上眼睛，把注意力放在呼吸上。吸气...感受空气进入身体。呼气...把紧张和疲惫一起呼出去。重复几次，让身体慢慢放松下来。🧘'
  }

  return '谢谢你愿意和我分享。无论你在经历什么，我都在这里陪着你。想聊聊学习、心情，还是需要一些鼓励？尽管告诉我。💙'
}
