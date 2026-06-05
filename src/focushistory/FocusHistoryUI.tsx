import { useState, useMemo } from 'react'
import { Clock, Calendar, TrendingUp, Flame, BarChart3, Activity } from 'lucide-react'
import { createFocusHistoryService } from './focusHistoryService'

interface FocusHistoryUIProps {
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

const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function FocusHistoryUI({ compact = false, getWorkspaceState }: FocusHistoryUIProps) {
  const [days, setDays] = useState(30)

  const service = useMemo(() => {
    const getState = getWorkspaceState || (() => ({ focusSessions: [] }))
    return createFocusHistoryService(getState)
  }, [getWorkspaceState])

  const history = service.getHistory(days)
  const heatmap = service.getHeatmapData(days)
  const dayStats = service.getDayOfWeekStats()
  const hourStats = service.getHourOfDayStats()
  const streakData = service.getStreakData()

  const totalMinutes = history.reduce((sum, e) => sum + e.minutes, 0)
  const totalSessions = history.length
  const avgPerSession = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0
  const totalPoints = history.reduce((sum, e) => sum + e.rewardPoints, 0)

  const maxHeatmap = Math.max(...heatmap.map((h) => h.count), 1)

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Clock size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>专注历史</strong>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.accent, fontSize: 18, fontWeight: 700 }}>{totalSessions}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>次专注</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.text, fontSize: 18, fontWeight: 700 }}>{Math.round(totalMinutes / 60)}h</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>总时长</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.income, fontSize: 18, fontWeight: 700 }}>{totalPoints}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>积分</small>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Activity size={24} style={{ color: colors.accent }} />专注历史分析
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderRadius: 8,
              background: days === d ? colors.accent : colors.cardBg,
              color: days === d ? '#fff' : colors.textSecondary,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14
            }}
          >
            {d}天
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <Clock size={24} style={{ color: colors.accent, marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.accent }}>{Math.round(totalMinutes / 60)}h</div>
          <small style={{ color: colors.textSecondary }}>总时长</small>
        </div>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <TrendingUp size={24} style={{ color: colors.income, marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.income }}>{totalSessions}</div>
          <small style={{ color: colors.textSecondary }}>专注次数</small>
        </div>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <BarChart3 size={24} style={{ color: colors.accentLight, marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.accentLight }}>{avgPerSession}</div>
          <small style={{ color: colors.textSecondary }}>次均分钟</small>
        </div>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <Flame size={24} style={{ color: 'var(--warning, #fbbf24)', marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning, #fbbf24)' }}>{totalPoints}</div>
          <small style={{ color: colors.textSecondary }}>获得积分</small>
        </div>
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>每周分布</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {dayStats.map((stat, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    height: stat.totalMinutes > 0 ? Math.min(60, stat.totalMinutes / 10) : 4,
                    background: stat.totalMinutes > 0 ? colors.accent : colors.cardBorder,
                    borderRadius: 4,
                    margin: '0 auto'
                  }}
                />
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>{dayLabels[stat.day].slice(1)}</div>
              <div style={{ fontSize: 10, color: colors.textSecondary }}>{stat.totalMinutes}m</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>24小时热力图</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 2 }}>
          {heatmap.map((h, i) => (
            <div
              key={i}
              title={`${h.hour}:00 - ${dayLabels[h.day]} (${h.count}次)`}
              style={{
                height: 16,
                background: h.count > 0 ? `rgba(239, 68, 68, ${h.count / maxHeatmap})` : colors.cardBorder,
                borderRadius: 2
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: colors.textSecondary }}>
          <span>0点</span>
          <span>6点</span>
          <span>12点</span>
          <span>18点</span>
          <span>24点</span>
        </div>
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>最近记录</h3>
        {history.length === 0 ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无记录</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {history.slice(0, 10).map((entry: any) => (
              <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: colors.inputBg, borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{entry.taskTitle}</div>
                  <small style={{ color: colors.textSecondary }}>{entry.completedAt?.slice(0, 16)}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: colors.accent, fontWeight: 600 }}>{entry.minutes}分钟</div>
                  <small style={{ color: colors.textSecondary }}>+{entry.rewardPoints}积分</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}