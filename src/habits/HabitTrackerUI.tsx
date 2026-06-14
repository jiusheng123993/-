import { useState, useCallback, useMemo } from 'react'
import { usePlatform } from '../platforms'
import type { HabitState, Habit } from './habitService'
import {
  createHabitBrowserStore,
  toggleHabit,
  getTodayDateString,
  getTodayHabitRecords,
  getHabitCompletionRate,
  addCustomHabit,
  removeHabit
} from './habitService'

interface HabitTrackerProps {
  onClose?: () => void
  compact?: boolean
}

const habitStore = createHabitBrowserStore()

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function buildHeatmapData(state: HabitState, weeks: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (weeks * 7 - 1))
  startDate.setHours(0, 0, 0, 0)

  const activeHabits = state.habits.filter((h) => h.isActive)
  const cells: { date: string; dayOfWeek: number; weekIndex: number; count: number; total: number }[] = []

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startDate)
      cellDate.setDate(startDate.getDate() + w * 7 + d)
      const dateStr = cellDate.toISOString().split('T')[0]
      const dayRecords = state.records.filter((r) => r.date === dateStr && r.completed)
      cells.push({
        date: dateStr,
        dayOfWeek: d,
        weekIndex: w,
        count: dayRecords.length,
        total: activeHabits.length
      })
    }
  }
  return cells
}

function getHeatColor(completed: number, total: number): string {
  if (total === 0 || completed === 0) return 'var(--surface-elevated)'
  const ratio = completed / total
  if (ratio >= 1) return 'var(--primary)'
  if (ratio >= 0.75) return 'color-mix(in srgb, var(--primary) 75%, var(--surface-elevated))'
  if (ratio >= 0.5) return 'color-mix(in srgb, var(--primary) 50%, var(--surface-elevated))'
  if (ratio >= 0.25) return 'color-mix(in srgb, var(--primary) 25%, var(--surface-elevated))'
  return 'color-mix(in srgb, var(--primary) 12%, var(--surface-elevated))'
}

export function HabitTracker({ onClose, compact = false }: HabitTrackerProps) {
  const [state, setState] = useState<HabitState>(() => habitStore.load())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitIcon, setNewHabitIcon] = useState('⭐')
  const [newHabitTarget, setNewHabitTarget] = useState(1)
  const [newHabitUnit, setNewHabitUnit] = useState('次')
  const [viewMode, setViewMode] = useState<'list' | 'heatmap'>('list')
  const { deviceCategory } = usePlatform()
  const isMobile = deviceCategory === 'mobile'
  const today = getTodayDateString()
  const todayRecords = getTodayHabitRecords(state, today)
  const completionRate = getHabitCompletionRate(state, today)

  const heatmapData = useMemo(() => buildHeatmapData(state, 12), [state])

  const persistState = useCallback((newState: HabitState) => {
    setState(newState)
    habitStore.save(newState)
  }, [])

  const handleToggle = (habitId: string) => {
    persistState(toggleHabit(state, habitId, today))
  }

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return
    const habit: Omit<Habit, 'isActive'> = {
      id: `custom-${Date.now()}`,
      name: newHabitName.trim(),
      icon: newHabitIcon,
      category: 'life',
      target: newHabitTarget,
      unit: newHabitUnit,
      color: '#6366f1'
    }
    persistState(addCustomHabit(state, habit))
    setNewHabitName('')
    setShowAddForm(false)
  }

  const handleRemoveHabit = (habitId: string) => {
    persistState(removeHabit(state, habitId))
  }

  const activeHabits = state.habits.filter((h) => h.isActive)

  if (compact) {
    return <CompactHabitView
      habits={activeHabits}
      todayRecords={todayRecords}
      completionRate={completionRate}
      onToggle={handleToggle}
    />
  }

  return (
    <div className="habit-tracker" role="region" aria-label="习惯追踪">
      <div className="habit-tracker-header">
        <div>
          <p className="eyebrow">Habit Tracker · 习惯追踪</p>
          <h2>每日习惯</h2>
        </div>
        <div className="habit-tracker-stats">
          <div className="habit-completion-ring" style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: `conic-gradient(var(--primary) ${completionRate * 3.6}deg, var(--surface-elevated) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{completionRate}%</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setViewMode('list')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: viewMode === 'list' ? 'var(--primary)' : 'var(--surface-elevated)',
            color: viewMode === 'list' ? '#fff' : 'var(--text)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 13
          }}
        >
          列表
        </button>
        <button
          onClick={() => setViewMode('heatmap')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: viewMode === 'heatmap' ? 'var(--primary)' : 'var(--surface-elevated)',
            color: viewMode === 'heatmap' ? '#fff' : 'var(--text)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 13
          }}
        >
          热力图
        </button>
      </div>

      {viewMode === 'heatmap' ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {WEEKDAYS.map((day) => (
              <div key={day} style={{ width: 24, textAlign: 'center', fontSize: 10, color: 'var(--muted)' }}>
                {day}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
            {Array.from({ length: 12 }, (_, w) => (
              <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Array.from({ length: 7 }, (_, d) => {
                  const cell = heatmapData.find((c) => c.weekIndex === w && c.dayOfWeek === d)
                  if (!cell) return <div key={d} style={{ width: 24, height: 24 }} />
                  const isToday = cell.date === today
                  return (
                    <div
                      key={d}
                      title={isMobile ? undefined : `${cell.date}: ${cell.count}/${cell.total} 完成`}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        background: getHeatColor(cell.count, cell.total),
                        border: isToday ? '2px solid var(--text)' : '1px solid transparent',
                        boxSizing: 'border-box'
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
            <span>少</span>
            {[0.12, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <div
                key={ratio}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: ratio === 0.12
                    ? 'color-mix(in srgb, var(--primary) 12%, var(--surface-elevated))'
                    : ratio === 0.25
                    ? 'color-mix(in srgb, var(--primary) 25%, var(--surface-elevated))'
                    : ratio === 0.5
                    ? 'color-mix(in srgb, var(--primary) 50%, var(--surface-elevated))'
                    : ratio === 0.75
                    ? 'color-mix(in srgb, var(--primary) 75%, var(--surface-elevated))'
                    : 'var(--primary)'
                }}
              />
            ))}
            <span>多</span>
          </div>
        </div>
      ) : (
        <div className="habit-list">
        {activeHabits.map((habit) => {
          const record = todayRecords.find((r) => r.habitId === habit.id)
          const isCompleted = record?.completed ?? false

          return (
            <div
              key={habit.id}
              className={`habit-item ${isCompleted ? 'completed' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                background: isCompleted ? `${habit.color}15` : 'var(--surface-elevated)',
                border: `1px solid ${isCompleted ? habit.color : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                marginBottom: 8
              }}
              onClick={() => handleToggle(habit.id)}
            >
              <span style={{ fontSize: 24 }}>{habit.icon}</span>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: 14 }}>{habit.name}</strong>
                <small style={{ color: 'var(--muted)' }}>
                  目标：{habit.target}{habit.unit}
                  {state.currentStreak[habit.id] > 0 && (
                    <span style={{ marginLeft: 8, color: habit.color }}>
                      🔥 {state.currentStreak[habit.id]} 天
                    </span>
                  )}
                </small>
              </div>
              <div
                className={`habit-checkbox ${isCompleted ? 'checked' : ''}`}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: `2px solid ${isCompleted ? habit.color : 'var(--border)'}`,
                  background: isCompleted ? habit.color : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 14,
                  flexShrink: 0
                }}
              >
                {isCompleted && '✓'}
              </div>
              <button
                className="habit-remove-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveHabit(habit.id)
                }}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: '4px 8px',
                  borderRadius: 6,
                  opacity: 0.5
                }}
                title="删除习惯"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
      )}

      {showAddForm ? (
        <div className="habit-add-form" style={{
          padding: 16,
          borderRadius: 12,
          background: 'var(--surface-elevated)',
          marginTop: 12
        }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="习惯名称"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)'
              }}
            />
            <input
              type="text"
              placeholder="图标"
              value={newHabitIcon}
              onChange={(e) => setNewHabitIcon(e.target.value)}
              style={{
                width: 48,
                padding: '8px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                textAlign: 'center',
                fontSize: 18
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="number"
              placeholder="目标"
              value={newHabitTarget}
              onChange={(e) => setNewHabitTarget(Number(e.target.value))}
              min={1}
              style={{
                width: 80,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)'
              }}
            />
            <input
              type="text"
              placeholder="单位"
              value={newHabitUnit}
              onChange={(e) => setNewHabitUnit(e.target.value)}
              style={{
                width: 80,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleAddHabit}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--primary)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              添加
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                padding: '8px 16px',
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
      ) : (
        <button
          className="habit-add-btn"
          onClick={() => setShowAddForm(true)}
          type="button"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '2px dashed var(--border)',
            background: 'transparent',
            color: 'var(--muted)',
            cursor: 'pointer',
            marginTop: 12,
            fontSize: 14
          }}
        >
          + 添加新习惯
        </button>
      )}

      {onClose && (
        <div className="habit-tracker-footer" style={{ marginTop: 16 }}>
          <button
            className="habit-close-btn"
            onClick={onClose}
            type="button"
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

function CompactHabitView({
  habits,
  todayRecords,
  completionRate,
  onToggle
}: {
  habits: Habit[]
  todayRecords: { habitId: string; completed: boolean }[]
  completionRate: number
  onToggle: (habitId: string) => void
}) {
  return (
    <div className="habit-compact" role="region" aria-label="习惯概览">
      <div className="habit-compact-header">
        <strong>今日习惯</strong>
        <span>{completionRate}%</span>
      </div>
      <div className="habit-compact-list">
        {habits.slice(0, 5).map((habit) => {
          const record = todayRecords.find((r) => r.habitId === habit.id)
          const isCompleted = record?.completed ?? false
          return (
            <button
              key={habit.id}
              className={`habit-compact-item ${isCompleted ? 'done' : ''}`}
              onClick={() => onToggle(habit.id)}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 8,
                border: 'none',
                background: isCompleted ? `${habit.color}20` : 'transparent',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <span>{habit.icon}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{habit.name}</span>
              {isCompleted && <span style={{ color: habit.color }}>✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}