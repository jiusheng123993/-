import { useState, useCallback } from 'react'
import type { JournalState, JournalEntry } from './journalService'
import {
  createJournalBrowserStore,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getEntryByDate,
  getEntriesByType,
  getMoodStats,
  getAverageMoodScore,
  getWeeklyReflection,
  getTodayDateString,
  MOOD_OPTIONS
} from './journalService'
import { createAiPromptDraft } from '../ai/aiProvider'

const journalStore = createJournalBrowserStore()

interface JournalUIProps {
  onClose?: () => void
  compact?: boolean
  getWorkspaceState?: () => any
}

export function JournalUI({ onClose, compact = false, getWorkspaceState }: JournalUIProps) {
  const [state, setState] = useState<JournalState>(() => journalStore.load())
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'history'>('daily')
  const [isEditing, setIsEditing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    mood: 'good' as JournalEntry['mood'],
    highlights: '',
    challenges: '',
    lessons: '',
    tomorrowPlan: '',
    tags: ''
  })

  const today = getTodayDateString()
  const todayEntry = getEntryByDate(state, today, 'daily')
  const avgMood = getAverageMoodScore(state, 7)
  const weeklyReflection = getWeeklyReflection(state)

  const persistState = useCallback((newState: JournalState) => {
    setState(newState)
    journalStore.save(newState)
  }, [])

  const handleSave = () => {
    if (!editForm.title.trim() && !editForm.content.trim()) return

    const moodOption = MOOD_OPTIONS.find((m) => m.value === editForm.mood) || MOOD_OPTIONS[2]

    if (todayEntry) {
      persistState(updateJournalEntry(state, todayEntry.id, {
        title: editForm.title,
        content: editForm.content,
        mood: editForm.mood,
        moodScore: moodOption.score,
        highlights: editForm.highlights.split('\n').filter(Boolean),
        challenges: editForm.challenges.split('\n').filter(Boolean),
        lessons: editForm.lessons.split('\n').filter(Boolean),
        tomorrowPlan: editForm.tomorrowPlan.split('\n').filter(Boolean),
        tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
      }))
    } else {
      persistState(createJournalEntry(state, {
        date: today,
        type: 'daily',
        mood: editForm.mood,
        moodScore: moodOption.score,
        title: editForm.title,
        content: editForm.content,
        highlights: editForm.highlights.split('\n').filter(Boolean),
        challenges: editForm.challenges.split('\n').filter(Boolean),
        lessons: editForm.lessons.split('\n').filter(Boolean),
        tomorrowPlan: editForm.tomorrowPlan.split('\n').filter(Boolean),
        tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
      }))
    }
    setIsEditing(false)
  }

  const startEditing = () => {
    if (todayEntry) {
      setEditForm({
        title: todayEntry.title,
        content: todayEntry.content,
        mood: todayEntry.mood,
        highlights: todayEntry.highlights.join('\n'),
        challenges: todayEntry.challenges.join('\n'),
        lessons: todayEntry.lessons.join('\n'),
        tomorrowPlan: todayEntry.tomorrowPlan.join('\n'),
        tags: todayEntry.tags.join(', ')
      })
    } else {
      setEditForm({
        title: '',
        content: '',
        mood: 'good',
        highlights: '',
        challenges: '',
        lessons: '',
        tomorrowPlan: '',
        tags: ''
      })
    }
    setIsEditing(true)
  }

  const handleDelete = (id: string) => {
    persistState(deleteJournalEntry(state, id))
  }

  const handleAiAssist = async () => {
    setAiLoading(true)
    setAiSuggestion(null)
    try {
      const ws = getWorkspaceState?.()
      const todayTasks = ws?.tasks?.filter((t: any) => {
        if (!t.createdAt) return false
        const d = new Date(t.createdAt)
        const tdy = new Date()
        return d.toDateString() === tdy.toDateString()
      }) || []
      const todayFocus = ws?.focusSessions?.filter((s: any) => {
        if (!s.completedAt) return false
        const d = new Date(s.completedAt)
        const tdy = new Date()
        return d.toDateString() === tdy.toDateString()
      }) || []
      const todayHabits = ws?.habitState?.records?.filter((r: any) => r.date === today) || []
      const todayMood = ws?.moodState?.records?.filter((r: any) => r.date === today) || []

      const contextParts: string[] = []
      if (todayTasks.length > 0) {
        contextParts.push(`今日任务：${todayTasks.map((t: any) => `${t.title}(${t.completed ? '已完成' : '未完成'})`).join('、')}`)
      }
      if (todayFocus.length > 0) {
        const totalMin = todayFocus.reduce((s: number, f: any) => s + (f.minutes || 0), 0)
        contextParts.push(`今日专注：${todayFocus.length}次，共${totalMin}分钟`)
      }
      if (todayHabits.length > 0) {
        const done = todayHabits.filter((r: any) => r.completed).length
        contextParts.push(`今日习惯：${done}/${todayHabits.length} 完成`)
      }
      if (todayMood.length > 0) {
        contextParts.push(`今日心情记录：${todayMood.length}条`)
      }

      const draft = createAiPromptDraft({
        kind: 'daily-review',
        input: '请根据以下数据生成今日复盘建议',
        context: contextParts.join('\n') || '暂无今日活动数据'
      })

      const prompt = `${draft.systemPrompt}\n\n用户今日数据：\n${draft.userPrompt}\n\n请生成一段温暖、鼓励的复盘建议（200字以内），包含：1. 今日亮点总结 2. 可改进的地方 3. 明日建议。`

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('xhh_deepseek_key') || ''}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`API 请求失败: ${response.status} ${errText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || '无法生成建议，请稍后重试'
      setAiSuggestion(content)
    } catch (err: any) {
      setAiSuggestion(`AI 辅助暂不可用：${err.message || '请检查 API Key 配置'}`)
    } finally {
      setAiLoading(false)
    }
  }

  if (compact) {
    return <CompactJournalView
      todayEntry={todayEntry}
      avgMood={avgMood}
      streak={state.currentStreak}
      onStartEdit={startEditing}
    />
  }

  const moodStats = getMoodStats(state, 14)
  const weeklyEntries = getEntriesByType(state, 'weekly')

  return (
    <div className="journal-ui" role="region" aria-label="复盘日记">
      <div className="journal-header">
        <div>
          <p className="eyebrow">Reflection Journal · 复盘日记</p>
          <h2>每日复盘</h2>
        </div>
        <div className="journal-stats">
          <span className="journal-stat-badge" style={{
            padding: '4px 12px',
            borderRadius: 8,
            background: 'var(--surface-elevated)',
            fontSize: 13
          }}>
            🔥 连续 {state.currentStreak} 天
          </span>
          <span className="journal-stat-badge" style={{
            padding: '4px 12px',
            borderRadius: 8,
            background: 'var(--surface-elevated)',
            fontSize: 13
          }}>
            {avgMood > 0 ? MOOD_OPTIONS.find((m) => m.score === Math.round(avgMood))?.emoji : '📝'} 均分 {avgMood}
          </span>
        </div>
      </div>

      <div className="journal-tabs" style={{
        display: 'flex',
        gap: 4,
        marginBottom: 16,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 8
      }}>
        {(['daily', 'weekly', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? '#fff' : 'var(--text)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 400
            }}
          >
            {tab === 'daily' ? '今日' : tab === 'weekly' ? '周复盘' : '历史'}
          </button>
        ))}
      </div>

      {activeTab === 'daily' && (
        <div className="journal-daily">
          {isEditing ? (
            <div className="journal-edit-form">
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}>今日心情</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setEditForm({ ...editForm, mood: m.value })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: editForm.mood === m.value ? `2px solid var(--primary)` : '1px solid var(--border)',
                        background: editForm.mood === m.value ? 'var(--primary)' : 'transparent',
                        color: editForm.mood === m.value ? '#fff' : 'var(--text)',
                        cursor: 'pointer',
                        fontSize: 18
                      }}
                      title={m.label}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                placeholder="今天的标题..."
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 16,
                  marginBottom: 12,
                  boxSizing: 'border-box'
                }}
              />

              <textarea
                placeholder="今天发生了什么？有什么收获和反思？..."
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={6}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 14,
                  resize: 'vertical',
                  marginBottom: 12,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  lineHeight: 1.6
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>✨ 今日亮点（每行一个）</label>
                  <textarea
                    placeholder="完成了XX项目&#10;运动了30分钟"
                    value={editForm.highlights}
                    onChange={(e) => setEditForm({ ...editForm, highlights: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: 13,
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>⚠️ 遇到的挑战</label>
                  <textarea
                    placeholder="有点拖延&#10;注意力不集中"
                    value={editForm.challenges}
                    onChange={(e) => setEditForm({ ...editForm, challenges: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: 13,
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>💡 学到的教训</label>
                  <textarea
                    placeholder="先完成再完美"
                    value={editForm.lessons}
                    onChange={(e) => setEditForm({ ...editForm, lessons: e.target.value })}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: 13,
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>📋 明日计划</label>
                  <textarea
                    placeholder="继续开发新功能&#10;阅读30分钟"
                    value={editForm.tomorrowPlan}
                    onChange={(e) => setEditForm({ ...editForm, tomorrowPlan: e.target.value })}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: 13,
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <input
                type="text"
                placeholder="标签（用逗号分隔）"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 13,
                  marginBottom: 12,
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSave}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  保存复盘
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : todayEntry ? (
            <div className="journal-today-view">
              <div className="journal-today-mood" style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                padding: 12,
                borderRadius: 12,
                background: 'var(--surface-elevated)'
              }}>
                <span style={{ fontSize: 32 }}>
                  {MOOD_OPTIONS.find((m) => m.value === todayEntry.mood)?.emoji}
                </span>
                <div>
                  <strong style={{ fontSize: 16 }}>{todayEntry.title}</strong>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                    {MOOD_OPTIONS.find((m) => m.value === todayEntry.mood)?.label}
                  </p>
                </div>
              </div>

              <div className="journal-today-content" style={{
                padding: 16,
                borderRadius: 12,
                background: 'var(--surface-elevated)',
                marginBottom: 12,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap'
              }}>
                {todayEntry.content}
              </div>

              {aiSuggestion && (
                <div style={{
                  padding: 16,
                  borderRadius: 12,
                  background: 'color-mix(in srgb, var(--primary) 8%, var(--surface-elevated))',
                  border: '1px solid color-mix(in srgb, var(--primary) 20%, var(--border))',
                  marginBottom: 12,
                  lineHeight: 1.7,
                  fontSize: 14
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>🤖</span>
                    <strong style={{ fontSize: 13, color: 'var(--primary)' }}>AI 复盘建议</strong>
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{aiSuggestion}</p>
                </div>
              )}

              {todayEntry.highlights.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 13, color: 'var(--muted)' }}>✨ 今日亮点</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                    {todayEntry.highlights.map((h, i) => (
                      <li key={i} style={{ fontSize: 14, marginBottom: 2 }}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {todayEntry.challenges.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 13, color: 'var(--muted)' }}>⚠️ 遇到的挑战</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                    {todayEntry.challenges.map((c, i) => (
                      <li key={i} style={{ fontSize: 14, marginBottom: 2 }}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {todayEntry.lessons.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 13, color: 'var(--muted)' }}>💡 学到的教训</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                    {todayEntry.lessons.map((l, i) => (
                      <li key={i} style={{ fontSize: 14, marginBottom: 2 }}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={startEditing}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer'
                  }}
                >
                  编辑复盘
                </button>
                <button
                  onClick={handleAiAssist}
                  disabled={aiLoading}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--primary)',
                    background: aiLoading ? 'var(--surface-elevated)' : 'transparent',
                    color: aiLoading ? 'var(--muted)' : 'var(--primary)',
                    cursor: aiLoading ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  🤖 {aiLoading ? '生成中...' : 'AI 复盘'}
                </button>
                <button
                  onClick={() => handleDelete(todayEntry.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--danger, #ef4444)',
                    cursor: 'pointer'
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ) : (
            <div className="journal-empty" style={{
              textAlign: 'center',
              padding: 40,
              borderRadius: 12,
              background: 'var(--surface-elevated)'
            }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>📝</p>
              <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>今天还没有写复盘</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>
                花几分钟回顾今天，记录收获和反思
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={startEditing}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  开始复盘
                </button>
                <button
                  onClick={handleAiAssist}
                  disabled={aiLoading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: '1px solid var(--primary)',
                    background: 'transparent',
                    color: 'var(--primary)',
                    cursor: aiLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  🤖 {aiLoading ? '生成中...' : 'AI 帮我复盘'}
                </button>
              </div>
              {aiSuggestion && (
                <div style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 12,
                  background: 'color-mix(in srgb, var(--primary) 8%, var(--surface-elevated))',
                  border: '1px solid color-mix(in srgb, var(--primary) 20%, var(--border))',
                  lineHeight: 1.7,
                  fontSize: 14,
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>🤖</span>
                    <strong style={{ fontSize: 13, color: 'var(--primary)' }}>AI 复盘建议</strong>
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{aiSuggestion}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="journal-weekly">
          <div className="weekly-summary" style={{
            padding: 16,
            borderRadius: 12,
            background: 'var(--surface-elevated)',
            marginBottom: 16
          }}>
            <h3 style={{ margin: '0 0 12px' }}>本周概览</h3>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{weeklyReflection.avgMood}</span>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>平均心情</p>
              </div>
              <div>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{weeklyReflection.totalHighlights}</span>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>亮点</p>
              </div>
              <div>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{weeklyReflection.totalChallenges}</span>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>挑战</p>
              </div>
              <div>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{weeklyReflection.entries.length}</span>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>日记数</p>
              </div>
            </div>
          </div>

          {moodStats.length > 0 && (
            <div className="mood-chart" style={{ marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>心情趋势</h4>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60 }}>
                {moodStats.map((stat) => (
                  <div
                    key={stat.date}
                    title={`${stat.date}: ${stat.score}/5`}
                    style={{
                      flex: 1,
                      height: `${(stat.score / 5) * 100}%`,
                      background: stat.score >= 4 ? '#10b981' : stat.score >= 3 ? '#f59e0b' : '#ef4444',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 4,
                      transition: 'height 200ms ease'
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{moodStats[0]?.date.slice(5)}</span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{moodStats[moodStats.length - 1]?.date.slice(5)}</span>
              </div>
            </div>
          )}

          {weeklyEntries.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>周复盘记录</h4>
              {weeklyEntries.map((entry) => (
                <div key={entry.id} style={{
                  padding: 12,
                  borderRadius: 8,
                  background: 'var(--surface-elevated)',
                  marginBottom: 8
                }}>
                  <strong>{entry.title}</strong>
                  <p style={{ margin: '4px 0', fontSize: 13, color: 'var(--muted)' }}>{entry.content.slice(0, 100)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="journal-history">
          {state.entries.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>暂无复盘记录</p>
          ) : (
            state.entries.map((entry) => (
              <div key={entry.id} style={{
                padding: 12,
                borderRadius: 8,
                background: 'var(--surface-elevated)',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <span style={{ fontSize: 24 }}>
                  {MOOD_OPTIONS.find((m) => m.value === entry.mood)?.emoji}
                </span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 14 }}>{entry.title}</strong>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {entry.date} · {entry.type === 'daily' ? '日复盘' : entry.type === 'weekly' ? '周复盘' : '月复盘'}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: 16
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {onClose && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            关闭
          </button>
        </div>
      )}
    </div>
  )
}

function CompactJournalView({
  todayEntry,
  avgMood,
  streak,
  onStartEdit
}: {
  todayEntry: JournalEntry | undefined
  avgMood: number
  streak: number
  onStartEdit: () => void
}) {
  return (
    <div className="journal-compact" role="region" aria-label="复盘概览">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>今日复盘</strong>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>🔥 {streak}天</span>
      </div>
      {todayEntry ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>
              {MOOD_OPTIONS.find((m) => m.value === todayEntry.mood)?.emoji}
            </span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{todayEntry.title}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 8px', lineHeight: 1.5 }}>
            {todayEntry.content.slice(0, 80)}{todayEntry.content.length > 80 ? '...' : ''}
          </p>
          <button
            onClick={onStartEdit}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            编辑
          </button>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 8px' }}>
            今天还没有写复盘
          </p>
          <button
            onClick={onStartEdit}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            开始复盘
          </button>
        </div>
      )}
    </div>
  )
}
