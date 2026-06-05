import { useState, useMemo } from 'react'
import { Smile, Frown, Meh, LucideIcon, Trash2, TrendingUp, Calendar } from 'lucide-react'
import { createMoodService, moodEmojis, moodLabels } from './moodService'
import type { MoodEntry } from './moodService'

interface MoodUIProps {
  compact?: boolean
  service?: ReturnType<typeof createMoodService>
}

const colors = {
  bg: 'var(--app-background, #f8fafc)',
  cardBg: 'var(--card-gradient, #ffffff)',
  cardBorder: 'var(--border, rgba(15, 118, 110, 0.12))',
  text: 'var(--text, #0f172a)',
  textSecondary: 'var(--muted, #64748b)',
  accent: 'var(--primary, #0f766e)',
  inputBg: 'var(--surface, rgba(255, 255, 255, 0.82))',
  inputBorder: 'var(--border, rgba(15, 118, 110, 0.12))',
}

const moodColors = ['var(--chart-review, #ef4444)', 'var(--chart-plan, #f97316)', '#eab308', '#84cc16', '#22c55e']

export function MoodUI({ compact = false, service: externalService }: MoodUIProps) {
  const [service] = useState(() => externalService ?? createMoodService())
  const [selectedMood, setSelectedMood] = useState<MoodEntry['mood'] | null>(null)
  const [note, setNote] = useState('')
  const [daysToShow, setDaysToShow] = useState(7)

  const todayMood = service.getTodayMood()
  const trend = service.getMoodTrend(daysToShow)
  const stats = service.getMoodStats(daysToShow)

  const handleSaveMood = () => {
    if (!selectedMood) return
    service.addMood(selectedMood, note)
    setSelectedMood(null)
    setNote('')
  }

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Smile size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>心情</strong>
        </div>
        {todayMood ? (
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>{moodEmojis[todayMood.mood - 1]}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>{moodLabels[todayMood.mood - 1]}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
            {moodEmojis.map((emoji, i) => (
              <button
                key={i}
                onClick={() => { setSelectedMood((i + 1) as MoodEntry['mood']) }}
                style={{ fontSize: 20, padding: 4, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, transition: 'all 0.2s' }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', fontSize: 11, color: colors.textSecondary }}>
          {stats.totalEntries > 0 ? `${daysToShow}天平均: ${stats.avgMood}分` : '记录今日心情'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Smile size={24} style={{ color: colors.accent }} />心情追踪
      </h2>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16 }}>记录今日心情</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          {moodEmojis.map((emoji, i) => (
            <button
              key={i}
              onClick={() => setSelectedMood((i + 1) as MoodEntry['mood'])}
              style={{
                fontSize: 36,
                padding: 12,
                background: selectedMood === i + 1 ? colors.cardBorder : 'transparent',
                border: `2px solid ${selectedMood === i + 1 ? moodColors[i] : 'transparent'}`,
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        {selectedMood && (
          <>
            <p style={{ textAlign: 'center', marginBottom: 12, color: moodColors[selectedMood - 1], fontWeight: 500 }}>
              {moodLabels[selectedMood - 1]}
            </p>
            <textarea
              placeholder="写下今天的心情..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: '100%', minHeight: 60, padding: 12, border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14, resize: 'vertical', marginBottom: 12 }}
            />
            <button
              onClick={handleSaveMood}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.accent, color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              保存
            </button>
          </>
        )}
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, color: colors.textSecondary }}>心情趋势</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setDaysToShow(days)}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: 4,
                  background: daysToShow === days ? colors.accent : colors.inputBg,
                  color: daysToShow === days ? 'var(--surface-strong, #fff)' : colors.textSecondary,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                {days}天
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
          {trend.map((day, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: '100%',
                  height: day.avgMood > 0 ? day.avgMood * 18 : 4,
                  background: day.avgMood > 0 ? moodColors[Math.round(day.avgMood) - 1] : colors.cardBorder,
                  borderRadius: 4,
                  transition: 'all 0.3s'
                }}
              />
              <span style={{ fontSize: 9, color: colors.textSecondary }}>{day.date.slice(-2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>统计</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent }}>{stats.avgMood || '-'}</div>
            <small style={{ color: colors.textSecondary }}>平均心情</small>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>{stats.totalEntries}</div>
            <small style={{ color: colors.textSecondary }}>记录次数</small>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.totalEntries > 0 ? moodEmojis[stats.mostCommonMood - 1] : '-'}</div>
            <small style={{ color: colors.textSecondary }}>最常见</small>
          </div>
        </div>
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>历史记录</h3>
        {service.getState().entries.length === 0 ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无记录</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {service.getState().entries.slice(0, 10).map((entry) => (
              <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: colors.inputBg, borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{moodEmojis[entry.mood - 1]}</span>
                  <div>
                    <div style={{ fontWeight: 500 }}>{moodLabels[entry.mood - 1]}</div>
                    {entry.note && <small style={{ color: colors.textSecondary }}>{entry.note}</small>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <small style={{ color: colors.textSecondary }}>{entry.date}</small>
                  <button onClick={() => service.removeMood(entry.id)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}