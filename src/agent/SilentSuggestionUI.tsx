import { useState, useEffect, useCallback } from 'react'
import type { MemoryProfile, MemoryEvent } from '../memory/memoryTypes'

export interface SilentSuggestion {
  id: string
  message: string
  priority: 'low' | 'medium' | 'high'
  dismissible: boolean
  actionLabel?: string
  action?: () => void
}

export interface SilentSuggestionUIProps {
  suggestions: SilentSuggestion[]
  onDismiss?: (id: string) => void
  onAction?: (id: string) => void
}

const PRIORITY_STYLES = {
  low: { bg: 'var(--surface-elevated)', border: 'var(--border)', icon: '💡' },
  medium: { bg: 'var(--surface-elevated)', border: 'var(--warning)', icon: '⚡' },
  high: { bg: 'var(--surface-elevated)', border: 'var(--error)', icon: '🔥' }
}

export function SilentSuggestionUI({ suggestions, onDismiss, onAction }: SilentSuggestionUIProps) {
  const [visibleSuggestions, setVisibleSuggestions] = useState<SilentSuggestion[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const filtered = suggestions.filter(s => !dismissedIds.has(s.id))
    const sorted = [...filtered].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    setVisibleSuggestions(sorted.slice(0, 3))
  }, [suggestions, dismissedIds])

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
    onDismiss?.(id)
  }

  const handleAction = (suggestion: SilentSuggestion) => {
    if (suggestion.action) {
      suggestion.action()
    }
    onAction?.(suggestion.id)
  }

  if (visibleSuggestions.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '24px',
        width: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 900
      }}
    >
      {visibleSuggestions.map(suggestion => {
        const style = PRIORITY_STYLES[suggestion.priority]
        return (
          <div
            key={suggestion.id}
            style={{
              padding: '14px 16px',
              background: style.bg,
              borderRadius: '12px',
              borderLeft: `3px solid ${style.border}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              animation: 'slideIn 300ms ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>{style.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '13px', 
                  lineHeight: 1.5, 
                  color: 'var(--text)',
                  wordBreak: 'break-word'
                }}>
                  {suggestion.message}
                </p>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '10px',
                  alignItems: 'center'
                }}>
                  {suggestion.actionLabel && (
                    <button
                      onClick={() => handleAction(suggestion)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--primary)',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {suggestion.actionLabel}
                    </button>
                  )}
                  {suggestion.dismissible && (
                    <button
                      onClick={() => handleDismiss(suggestion.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--muted)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginLeft: 'auto'
                      }}
                    >
                      知道了
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

export function useSilentSuggestions(profile?: MemoryProfile, memoryEvents?: MemoryEvent[]) {
  const [suggestions, setSuggestions] = useState<SilentSuggestion[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<SilentSuggestion[]>([])

  const generateAiSuggestions = useCallback(async () => {
    if (!profile && (!memoryEvents || memoryEvents.length === 0)) return
    
    try {
      const apiKey = localStorage.getItem('deepseek_api_key') || ''
      if (!apiKey) return

      const nickname = profile?.identity?.nickname || '用户'
      const primaryGoal = profile?.goals?.primaryGoal || '未设定'
      const motivationLevel = profile?.emotional?.motivationLevel || 'medium'
      
      const recentEvents = (memoryEvents || []).slice(-10)
      const eventLines = recentEvents.map(e => {
        const time = new Date(e.timestamp).toLocaleDateString('zh-CN')
        return `- [${time}] ${e.category}: ${e.summary}`
      }).join('\n')

      const prompt = `你是一个个人成长工作台的智能建议引擎。请基于以下用户信息，生成1-2条个性化建议。

用户昵称：${nickname}
主要目标：${primaryGoal}
动力水平：${motivationLevel}

近期活动：
${eventLines || '暂无活动记录'}

请输出JSON格式的建议列表：
[{"message": "建议内容（30字以内，温暖鼓励的语气）", "priority": "high/medium/low"}]

只输出JSON数组，不要其他内容。`

      const isDev = import.meta.env.DEV
      const endpoint = isDev ? '/api/deepseek' : 'https://api.deepseek.com/v1/chat/completions'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个个人成长工作台的智能建议引擎。只输出JSON格式。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 300
        })
      })

      if (!response.ok) return
      
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Array<{ message: string; priority: string }>
        const aiSuggestionsList: SilentSuggestion[] = parsed.map((item, index) => ({
          id: `ai-suggestion-${Date.now()}-${index}`,
          message: item.message,
          priority: (item.priority as 'high' | 'medium' | 'low') || 'low',
          dismissible: true
        }))
        setAiSuggestions(aiSuggestionsList)
      }
    } catch {
      // AI suggestions are optional, silently fail
    }
  }, [profile, memoryEvents])

  const generateSuggestions = useCallback(() => {
    const now = new Date()
    const hour = now.getHours()
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
    const dayOfWeek = now.getDay()
    
    const newSuggestions: SilentSuggestion[] = []
    const nickname = profile?.identity?.nickname || '你'
    
    if (timeOfDay === 'morning' && hour >= 6 && hour <= 9) {
      const primaryGoal = profile?.goals?.primaryGoal
      const goalHint = primaryGoal ? `，今天继续朝着「${primaryGoal}」前进` : ''
      newSuggestions.push({
        id: `suggestion-${Date.now()}-1`,
        message: `早上好${nickname}！新的一天从制定计划开始${goalHint} 💪`,
        priority: 'high',
        dismissible: true,
        actionLabel: '查看任务',
        action: () => {
          const event = new CustomEvent('navigate-to-tasks')
          window.dispatchEvent(event)
        }
      })
    }
    
    if (hour >= 20 && hour <= 22) {
      const todayEvents = memoryEvents?.filter(e => {
        const eventDate = new Date(e.timestamp).toDateString()
        return eventDate === now.toDateString()
      })
      const completedCount = todayEvents?.filter(e => e.category === 'task_completed').length || 0
      const restMessage = completedCount > 0 
        ? `今天完成了${completedCount}个任务，辛苦了！`
        : '今天辛苦了！'
      newSuggestions.push({
        id: `suggestion-${Date.now()}-2`,
        message: `${restMessage}记得早点休息，明天还有新的挑战等着你 🌙`,
        priority: 'medium',
        dismissible: true
      })
    }
    
    if (dayOfWeek === 1 && timeOfDay === 'morning') {
      newSuggestions.push({
        id: `suggestion-${Date.now()}-3`,
        message: '周一啦！上周的反思总结做好了吗？可以回顾一下继续优化 🔄',
        priority: 'low',
        dismissible: true,
        actionLabel: '查看反思'
      })
    }

    const recentFocusEvents = memoryEvents?.filter(e => e.category === 'focus_completed') || []
    if (recentFocusEvents.length > 0) {
      const lastFocus = recentFocusEvents[recentFocusEvents.length - 1]
      const focusDate = new Date(lastFocus.timestamp)
      const daysSinceFocus = Math.floor((now.getTime() - focusDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceFocus >= 2 && daysSinceFocus <= 5) {
        newSuggestions.push({
          id: `suggestion-${Date.now()}-5`,
          message: `已经${daysSinceFocus}天没有专注了，要不要来一次深度专注？🧘`,
          priority: 'medium',
          dismissible: true,
          actionLabel: '开始专注',
          action: () => {
            const event = new CustomEvent('navigate-to-focus')
            window.dispatchEvent(event)
          }
        })
      }
    }

    const recentGoalEvents = memoryEvents?.filter(e => e.category === 'goal_updated') || []
    if (recentGoalEvents.length > 0) {
      const lastGoal = recentGoalEvents[recentGoalEvents.length - 1]
      const goalDate = new Date(lastGoal.timestamp)
      const daysSinceGoal = Math.floor((now.getTime() - goalDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceGoal >= 7) {
        newSuggestions.push({
          id: `suggestion-${Date.now()}-6`,
          message: `已经一周没有更新目标了，目标还符合你的方向吗？可以重新审视一下 🎯`,
          priority: 'low',
          dismissible: true,
          actionLabel: '查看目标',
          action: () => {
            const event = new CustomEvent('navigate-to-goals')
            window.dispatchEvent(event)
          }
        })
      }
    }

    const learningStyle = profile?.learning?.preferredMethods?.[0]
    if (learningStyle && Math.random() > 0.6) {
      const methodHints: Record<string, string> = {
        '阅读': '📚 阅读是很好的学习方式，记得做笔记加深理解',
        '实践': '🔧 动手实践是最好的老师，今天有什么想尝试的吗？',
        '视频': '🎬 看视频学习时记得暂停思考，不要只是被动接收',
        '讨论': '💬 找个学习伙伴讨论一下，碰撞出新的想法',
        '写作': '✍️ 把学到的写下来，教是最好的学'
      }
      const hint = methodHints[learningStyle]
      if (hint) {
        newSuggestions.push({
          id: `suggestion-${Date.now()}-7`,
          message: hint,
          priority: 'low',
          dismissible: true
        })
      }
    }
    
    if (Math.random() > 0.7) {
      newSuggestions.push({
        id: `suggestion-${Date.now()}-4`,
        message: '学习累了可以适当休息一下，站起来活动活动身体效率更高 🚶',
        priority: 'low',
        dismissible: true
      })
    }
    
    setSuggestions(newSuggestions)
  }, [profile, memoryEvents])

  useEffect(() => {
    generateSuggestions()
    generateAiSuggestions()
    const interval = setInterval(() => {
      generateSuggestions()
      generateAiSuggestions()
    }, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [generateSuggestions, generateAiSuggestions])

  const allSuggestions = [...aiSuggestions, ...suggestions]

  return { suggestions: allSuggestions, refresh: generateSuggestions }
}
