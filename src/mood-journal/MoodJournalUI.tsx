import { useState, useEffect, useCallback, useRef } from 'react'
import { usePlatform } from '../platforms'
import {
  getEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  getMoodStats,
  getTodayEntry,
  MOOD_EMOJIS,
  MOOD_LABELS,
  MOOD_TAGS,
  type MoodEntry,
  type MoodStats,
} from './moodJournalService'
import styles from './MoodJournalUI.module.css'

interface MoodJournalUIProps {
  userId?: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[d.getDay()]
  return `${month}月${day}日 周${weekday}`
}

function getScoreColor(score: number): string {
  if (score <= 3) return '#ef4444'
  if (score <= 5) return '#f59e0b'
  if (score <= 7) return '#22c55e'
  return '#3b82f6'
}

export function MoodJournalUI({ userId: _userId }: MoodJournalUIProps) {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [stats, setStats] = useState<MoodStats | null>(null)
  const [todayEntry, setTodayEntry] = useState<MoodEntry | undefined>(undefined)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { deviceCategory } = usePlatform()
  const isMobile = deviceCategory === 'mobile'

  const [score, setScore] = useState(5)
  const [note, setNote] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const loadData = useCallback(() => {
    setEntries(getEntries())
    setStats(getMoodStats())
    setTodayEntry(getTodayEntry())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const drawTrendChart = useCallback((canvas: HTMLCanvasElement, weeklyStats: { date: string; score: number }[]) => {
    let ctx: CanvasRenderingContext2D | null = null
    try {
      ctx = canvas.getContext('2d')
    } catch {
      return
    }
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const padding = { top: 16, right: 16, bottom: 28, left: 36 }
    const chartW = w - padding.left - padding.right
    const chartH = h - padding.top - padding.bottom

    ctx.clearRect(0, 0, w, h)

    if (weeklyStats.length === 0) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('暂无数据', w / 2, h / 2)
      return
    }

    const yMax = 10

    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    const ySteps = 5
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (chartH / ySteps) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(w - padding.right, y)
      ctx.stroke()

      ctx.fillStyle = '#94a3b8'
      ctx.font = '10px system-ui'
      ctx.textAlign = 'right'
      ctx.fillText(`${Math.round(yMax - (yMax / ySteps) * i)}`, padding.left - 6, y + 4)
    }

    const step = weeklyStats.length > 1 ? chartW / (weeklyStats.length - 1) : chartW / 2
    const points: { x: number; y: number }[] = weeklyStats.map((d, i) => ({
      x: padding.left + (weeklyStats.length === 1 ? chartW / 2 : step * i),
      y: padding.top + chartH - (d.score / yMax) * chartH,
    }))

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH)
    gradient.addColorStop(0, 'rgba(234, 179, 8, 0.25)')
    gradient.addColorStop(1, 'rgba(234, 179, 8, 0.02)')

    ctx.beginPath()
    ctx.moveTo(points[0].x, padding.top + chartH)
    for (const p of points) {
      ctx.lineTo(p.x, p.y)
    }
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    ctx.strokeStyle = '#eab308'
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    for (let i = 0; i < points.length; i++) {
      if (i === 0) ctx.moveTo(points[i].x, points[i].y)
      else ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()

    for (const p of points) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#eab308'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
    }

    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px system-ui'
    ctx.textAlign = 'center'
    const labelStep = Math.max(1, Math.floor(weeklyStats.length / 6))
    weeklyStats.forEach((d, i) => {
      if (i % labelStep === 0 || i === weeklyStats.length - 1) {
        const x = points[i].x
        const label = d.date.slice(5)
        ctx.fillText(label, x, h - 4)
      }
    })
  }, [])

  useEffect(() => {
    if (stats && canvasRef.current) {
      drawTrendChart(canvasRef.current, stats.weeklyStats)
    }
  }, [stats, drawTrendChart])

  const handleSubmit = () => {
    const todayStr = new Date().toISOString().slice(0, 10)
    if (editingId) {
      updateEntry(editingId, { score, note: note || undefined, tags: selectedTags })
      setEditingId(null)
    } else {
      addEntry({
        date: todayStr,
        score,
        note: note || undefined,
        tags: selectedTags,
      })
    }
    setShowAddForm(false)
    setScore(5)
    setNote('')
    setSelectedTags([])
    loadData()
  }

  const handleEdit = (entry: MoodEntry) => {
    setEditingId(entry.id)
    setScore(entry.score)
    setNote(entry.note || '')
    setSelectedTags(entry.tags)
    setShowAddForm(true)
  }

  const handleDelete = (id: string) => {
    deleteEntry(id)
    loadData()
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingId(null)
    setScore(5)
    setNote('')
    setSelectedTags([])
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const hasTodayEntry = !!todayEntry

  return (
    <div className={styles.container}>
      <div className={styles.todaySection}>
        <div className={styles.todayHeader}>
          <div className={styles.todayDate}>{formatDate(todayStr)}</div>
          {hasTodayEntry && !showAddForm ? (
            <div className={styles.todayMood}>
              <span className={styles.todayEmoji}>{MOOD_EMOJIS[todayEntry!.score]}</span>
              <span className={styles.todayScore} style={{ color: getScoreColor(todayEntry!.score) }}>
                {todayEntry!.score}/10 {MOOD_LABELS[todayEntry!.score]}
              </span>
              {todayEntry!.note && (
                <span className={styles.todayNote}>"{todayEntry!.note}"</span>
              )}
              {todayEntry!.tags.length > 0 && (
                <div className={styles.todayTags}>
                  {todayEntry!.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              )}
              <div className={styles.todayActions}>
                <button className={styles.editBtn} onClick={() => handleEdit(todayEntry!)}>
                  ✏️ 修改
                </button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(todayEntry!.id)}>
                  🗑 删除
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.todayEmpty}>
              <span className={styles.todayEmptyIcon}>📝</span>
              <span>今天还没有记录心情</span>
              {!showAddForm && (
                <button className={styles.addBtn} onClick={() => setShowAddForm(true)}>
                  + 记录今日心情
                </button>
              )}
            </div>
          )}
        </div>

        {showAddForm && (
          <div className={styles.addForm}>
            <div className={styles.formTitle}>
              {editingId ? '修改心情记录' : '记录今日心情'}
            </div>

            <div className={styles.scoreSection}>
              <div className={styles.scoreLabel}>情绪评分</div>
              <div className={styles.scoreDisplay}>
                <span className={styles.scoreEmoji}>{MOOD_EMOJIS[score]}</span>
                <span className={styles.scoreValue} style={{ color: getScoreColor(score) }}>
                  {score}/10 - {MOOD_LABELS[score]}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className={styles.scoreSlider}
                style={{
                  background: `linear-gradient(to right, #ef4444, #f59e0b ${(score / 10) * 50}%, #22c55e ${(score / 10) * 80}%, #3b82f6)`,
                }}
              />
              <div className={styles.scoreMarks}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    className={`${styles.scoreMark} ${score === n ? styles.scoreMarkActive : ''}`}
                    onClick={() => setScore(n)}
                    title={isMobile ? undefined : MOOD_LABELS[n]}
                  >
                    {MOOD_EMOJIS[n]}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.noteSection}>
              <label className={styles.noteLabel}>心情笔记（可选）</label>
              <textarea
                className={styles.noteInput}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="今天发生了什么？有什么想说的..."
                rows={3}
                maxLength={500}
              />
              <div className={styles.noteCount}>{note.length}/500</div>
            </div>

            <div className={styles.tagsSection}>
              <label className={styles.tagsLabel}>情绪标签（可选）</label>
              <div className={styles.tagsGrid}>
                {MOOD_TAGS.map((tag) => (
                  <button
                    key={tag}
                    className={`${styles.tagBtn} ${selectedTags.includes(tag) ? styles.tagBtnActive : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formActions}>
              <button className={styles.submitBtn} onClick={handleSubmit}>
                {editingId ? '💾 保存修改' : '✅ 记录心情'}
              </button>
              <button className={styles.cancelBtn} onClick={handleCancel}>
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {stats && (
        <div className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: getScoreColor(Math.round(stats.averageScore)) }}>
                {stats.averageScore}
              </div>
              <div className={styles.statLabel}>平均情绪</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalEntries}</div>
              <div className={styles.statLabel}>记录天数</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.streakDays}</div>
              <div className={styles.statLabel}>连续记录</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statValue} ${stats.lowStreakDays >= 3 ? styles.statWarning : ''}`}>
                {stats.lowStreakDays}
              </div>
              <div className={styles.statLabel}>低情绪天数</div>
            </div>
          </div>

          {stats.lowStreakDays >= 3 && (
            <div className={styles.alertBanner}>
              <span className={styles.alertIcon}>⚠️</span>
              <span>你已经连续 {stats.lowStreakDays} 天情绪较低，记得照顾好自己。如果需要，可以向朋友或家人倾诉。</span>
            </div>
          )}

          <div className={styles.chartSection}>
            <div className={styles.chartTitle}>📈 近7天情绪趋势</div>
            <canvas ref={canvasRef} className={styles.trendCanvas} />
          </div>

          {stats.tagStats.length > 0 && (
            <div className={styles.tagStatsSection}>
              <div className={styles.chartTitle}>🏷 情绪标签分布</div>
              <div className={styles.tagStatsList}>
                {stats.tagStats.slice(0, 8).map((t) => (
                  <div key={t.tag} className={styles.tagStatItem}>
                    <span className={styles.tagStatName}>{t.tag}</span>
                    <div className={styles.tagStatBar}>
                      <div
                        className={styles.tagStatBarFill}
                        style={{
                          width: `${(t.count / stats.tagStats[0].count) * 100}%`,
                          backgroundColor: getScoreColor(Math.round(t.avgScore)),
                        }}
                      />
                    </div>
                    <span className={styles.tagStatCount}>{t.count}次</span>
                    <span className={styles.tagStatAvg} style={{ color: getScoreColor(Math.round(t.avgScore)) }}>
                      {t.avgScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.historySection}>
        <button
          className={styles.historyToggle}
          onClick={() => setShowHistory(!showHistory)}
        >
          📋 {showHistory ? '收起历史' : `历史记录 (${entries.length})`}
        </button>

        {showHistory && (
          <div className={styles.historyList}>
            {entries.length === 0 ? (
              <div className={styles.emptyHistory}>还没有心情记录，开始记录你的第一份心情吧</div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className={styles.historyItem}>
                  <div className={styles.historyLeft}>
                    <span className={styles.historyEmoji}>{MOOD_EMOJIS[entry.score]}</span>
                    <div className={styles.historyInfo}>
                      <div className={styles.historyDate}>{formatDate(entry.date)}</div>
                      <div className={styles.historyScore} style={{ color: getScoreColor(entry.score) }}>
                        {entry.score}/10 {MOOD_LABELS[entry.score]}
                      </div>
                      {entry.note && (
                        <div className={styles.historyNote}>"{entry.note}"</div>
                      )}
                      {entry.tags.length > 0 && (
                        <div className={styles.historyTags}>
                          {entry.tags.map((tag) => (
                            <span key={tag} className={styles.tag}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.historyActions}>
                    <button className={styles.editBtn} onClick={() => handleEdit(entry)}>
                      ✏️
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(entry.id)}>
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
