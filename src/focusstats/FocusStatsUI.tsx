import { useState, useMemo } from 'react'
import { Clock, TrendingUp, Calendar, BarChart3, Target, Flame, Award, Zap } from 'lucide-react'

interface FocusStatsUIProps {
  compact?: boolean
  getWorkspaceState?: () => any
}

const colors = {
  bg: 'var(--bg-primary, #0f0f1a)',
  cardBg: 'var(--surface, #1a1a2e)',
  cardBorder: 'var(--border, #2a2a4a)',
  text: 'var(--text, #e0e0e0)',
  textSecondary: 'var(--muted, #8888aa)',
  accent: '#ef4444',
  accentLight: '#f87171',
  income: '#4caf50',
  progressBg: 'var(--border, #2a2a4a)',
}

const CHART_W = 600
const CHART_H = 200
const CHART_PAD_L = 50
const CHART_PAD_R = 20
const CHART_PAD_T = 20
const CHART_PAD_B = 30

function buildTrendData(sessions: any[], period: 'week' | 'month' | 'year') {
  const now = new Date()
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365
  const dailyMap: Record<string, number> = {}

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dailyMap[key] = 0
  }

  sessions.forEach((s: any) => {
    const key = s.completedAt?.split('T')[0]
    if (key && dailyMap[key] !== undefined) {
      dailyMap[key] += s.minutes || 0
    }
  })

  return Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, minutes]) => ({ date, minutes }))
}

function computeStreak(sessions: any[]): { current: number; longest: number } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const focusedDays = new Set<string>()
  sessions.forEach((s: any) => {
    if (s.completedAt) {
      focusedDays.add(s.completedAt.split('T')[0])
    }
  })

  let current = 0
  const check = new Date(today)
  while (focusedDays.has(check.toISOString().split('T')[0])) {
    current++
    check.setDate(check.getDate() - 1)
  }

  let longest = 0
  let run = 0
  const sorted = Array.from(focusedDays).sort()
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      run = 1
    } else {
      const prev = new Date(sorted[i - 1])
      const curr = new Date(sorted[i])
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      if (diff === 1) {
        run++
      } else {
        run = 1
      }
    }
    longest = Math.max(longest, run)
  }

  return { current, longest }
}

export function FocusStatsUI({ compact = false, getWorkspaceState }: FocusStatsUIProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week')

  const workspaceState = useMemo(() => {
    if (getWorkspaceState) return getWorkspaceState()
    return { focusSessions: [], tasks: [] }
  }, [getWorkspaceState])

  const sessions = workspaceState.focusSessions || []

  const filteredSessions = useMemo(() => {
    const now = new Date()
    let startDate: Date
    if (period === 'week') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
    } else if (period === 'month') {
      startDate = new Date(now)
      startDate.setMonth(now.getMonth() - 1)
    } else {
      startDate = new Date(now)
      startDate.setFullYear(now.getFullYear() - 1)
    }
    return sessions.filter((s: any) => new Date(s.completedAt) >= startDate)
  }, [sessions, period])

  const trendData = useMemo(() => buildTrendData(filteredSessions, period), [filteredSessions, period])
  const streak = useMemo(() => computeStreak(sessions), [sessions])

  const stats = useMemo(() => {
    const totalMinutes = filteredSessions.reduce((sum: number, s: any) => sum + (s.minutes || 0), 0)
    const totalSessions = filteredSessions.length
    const avgPerDay = totalMinutes / (period === 'week' ? 7 : period === 'month' ? 30 : 365)
    
    const taskMinutes: Record<string, number> = {}
    filteredSessions.forEach((s: any) => {
      const task = s.taskTitle || '未知任务'
      taskMinutes[task] = (taskMinutes[task] || 0) + (s.minutes || 0)
    })
    const topTasks = Object.entries(taskMinutes)
      .map(([title, minutes]) => ({ title, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5)

    const dailyData: Record<string, number> = {}
    filteredSessions.forEach((s: any) => {
      const date = s.completedAt?.split('T')[0]
      if (date) dailyData[date] = (dailyData[date] || 0) + (s.minutes || 0)
    })
    const dailyMinutes = Object.values(dailyData).filter(Boolean)
    const bestDay = Object.entries(dailyData).sort((a, b) => b[1] - a[1])[0]

    const totalPoints = filteredSessions.reduce((sum: number, s: any) => sum + (s.rewardPoints || 0), 0)

    return {
      totalMinutes,
      totalSessions,
      avgPerDay: Math.round(avgPerDay),
      topTasks,
      bestDay: bestDay ? { date: bestDay[0], minutes: bestDay[1] } : null,
      maxDailyMinutes: dailyMinutes.length > 0 ? Math.max(...dailyMinutes) : 0,
      totalPoints
    }
  }, [filteredSessions, period])

  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    if (hours > 0) return `${hours}小时${minutes}分钟`
    return `${minutes}分钟`
  }

  const trendPath = useMemo(() => {
    if (trendData.length === 0) return ''
    const maxVal = Math.max(...trendData.map((d) => d.minutes), 1)
    const plotW = CHART_W - CHART_PAD_L - CHART_PAD_R
    const plotH = CHART_H - CHART_PAD_T - CHART_PAD_B
    const points = trendData.map((d, i) => {
      const x = CHART_PAD_L + (i / Math.max(trendData.length - 1, 1)) * plotW
      const y = CHART_PAD_T + plotH - (d.minutes / maxVal) * plotH
      return `${x},${y}`
    })
    return points.join(' ')
  }, [trendData])

  const trendAreaPath = useMemo(() => {
    if (trendData.length === 0) return ''
    const maxVal = Math.max(...trendData.map((d) => d.minutes), 1)
    const plotW = CHART_W - CHART_PAD_L - CHART_PAD_R
    const plotH = CHART_H - CHART_PAD_T - CHART_PAD_B
    const bottomY = CHART_PAD_T + plotH
    const firstX = CHART_PAD_L
    const lastX = CHART_PAD_L + plotW
    const linePoints = trendData.map((d, i) => {
      const x = CHART_PAD_L + (i / Math.max(trendData.length - 1, 1)) * plotW
      const y = CHART_PAD_T + plotH - (d.minutes / maxVal) * plotH
      return `${x},${y}`
    })
    return `M ${firstX} ${bottomY} L ${linePoints.join(' L ')} L ${lastX} ${bottomY} Z`
  }, [trendData])

  const trendLabels = useMemo(() => {
    if (trendData.length === 0) return []
    const step = Math.max(1, Math.floor(trendData.length / 6))
    return trendData.filter((_, i) => i % step === 0 || i === trendData.length - 1)
  }, [trendData])

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Clock size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>专注统计</strong>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.accent, fontSize: 18, fontWeight: 700 }}>{stats.totalSessions}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>次专注</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.text, fontSize: 18, fontWeight: 700 }}>{formatMinutes(stats.totalMinutes)}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>总时长</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.income, fontSize: 18, fontWeight: 700 }}>{stats.totalPoints}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>积分</small>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', borderTop: `1px solid ${colors.cardBorder}` }}>
          <Flame size={14} style={{ color: 'var(--warning, #fbbf24)' }} />
          <span style={{ fontSize: 12, color: colors.textSecondary }}>连续专注</span>
          <strong style={{ fontSize: 14, color: 'var(--warning, #fbbf24)', marginLeft: 'auto' }}>{streak.current} 天</strong>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <BarChart3 size={24} style={{ color: colors.accent }} />专注统计
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['week', 'month', 'year'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderRadius: 8,
              background: period === p ? colors.accent : colors.cardBg,
              color: period === p ? '#fff' : colors.textSecondary,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14
            }}
          >
            {p === 'week' ? '本周' : p === 'month' ? '本月' : '本年'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <Clock size={24} style={{ color: colors.accent, marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.accent }}>{formatMinutes(stats.totalMinutes)}</div>
          <small style={{ color: colors.textSecondary }}>总专注时长</small>
        </div>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <TrendingUp size={24} style={{ color: colors.income, marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.income }}>{stats.totalSessions}</div>
          <small style={{ color: colors.textSecondary }}>专注次数</small>
        </div>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <Target size={24} style={{ color: colors.accentLight, marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.accentLight }}>{stats.avgPerDay}</div>
          <small style={{ color: colors.textSecondary }}>日均分钟</small>
        </div>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <Award size={24} style={{ color: 'var(--warning, #fbbf24)', marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning, #fbbf24)' }}>{stats.totalPoints}</div>
          <small style={{ color: colors.textSecondary }}>获得积分</small>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <Flame size={24} style={{ color: 'var(--warning, #fbbf24)', marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning, #fbbf24)' }}>{streak.current} 天</div>
          <small style={{ color: colors.textSecondary }}>当前连续专注</small>
        </div>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <Zap size={24} style={{ color: colors.accentLight, marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.accentLight }}>{streak.longest} 天</div>
          <small style={{ color: colors.textSecondary }}>历史最长连续</small>
        </div>
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>每日专注趋势</h3>
        {trendData.length === 0 ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 40 }}>暂无数据，开始你的第一次专注吧！</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ display: 'block', margin: '0 auto' }}>
              <defs>
                <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.accent} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colors.accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <path d={trendAreaPath} fill="url(#trendAreaGrad)" />
              <polyline
                points={trendPath}
                fill="none"
                stroke={colors.accent}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {trendData.map((d, i) => {
                const maxVal = Math.max(...trendData.map((t) => t.minutes), 1)
                const plotW = CHART_W - CHART_PAD_L - CHART_PAD_R
                const plotH = CHART_H - CHART_PAD_T - CHART_PAD_B
                const cx = CHART_PAD_L + (i / Math.max(trendData.length - 1, 1)) * plotW
                const cy = CHART_PAD_T + plotH - (d.minutes / maxVal) * plotH
                return d.minutes > 0 ? (
                  <circle key={i} cx={cx} cy={cy} r={3} fill={colors.accent} stroke={colors.cardBg} strokeWidth={1.5} />
                ) : null
              })}
              {trendLabels.map((d) => {
                const idx = trendData.indexOf(d)
                const maxVal = Math.max(...trendData.map((t) => t.minutes), 1)
                const plotW = CHART_W - CHART_PAD_L - CHART_PAD_R
                const plotH = CHART_H - CHART_PAD_T - CHART_PAD_B
                const x = CHART_PAD_L + (idx / Math.max(trendData.length - 1, 1)) * plotW
                const label = d.date.slice(5)
                return (
                  <text key={d.date} x={x} y={CHART_H - 6} textAnchor="middle" fontSize={10} fill={colors.textSecondary}>
                    {label}
                  </text>
                )
              })}
            </svg>
          </div>
        )}
      </div>

      {stats.bestDay && (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>最佳表现</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>最高专注日</div>
              <small style={{ color: colors.textSecondary }}>{stats.bestDay.date}</small>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent }}>{formatMinutes(stats.bestDay.minutes)}</div>
              <small style={{ color: colors.textSecondary }}>当日专注</small>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>任务分布</h3>
        {stats.topTasks.length === 0 ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无数据</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {stats.topTasks.map((task, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: colors.accent, color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{task.title}</div>
                  <div style={{ height: 6, background: colors.progressBg, borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${(task.minutes / stats.topTasks[0].minutes) * 100}%`, background: colors.accent, borderRadius: 3 }} />
                  </div>
                </div>
                <span style={{ color: colors.textSecondary, fontSize: 13 }}>{formatMinutes(task.minutes)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}