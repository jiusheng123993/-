import { useState, useMemo } from 'react'
import { Clock, TrendingUp, Calendar, BarChart3, Target, Flame, Award } from 'lucide-react'

interface FocusStatsUIProps {
  compact?: boolean
  getWorkspaceState?: () => any
}

const colors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  accent: '#ef4444',
  accentLight: '#f87171',
  income: '#4caf50',
  progressBg: '#2a2a4a',
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