import { useMemo } from 'react'
import type { Habit, HabitState } from '../../habits/habitService'
import { getTodayDateString, toggleHabit } from '../../habits/habitService'
import styles from './HabitsModule.module.css'

interface HabitsModuleProps {
  onRemove: () => void
}

const STORAGE_KEY = 'habit-state'

function loadHabitState(): HabitState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as HabitState
  } catch { /* ignore */ }
  return { habits: [], records: [], currentStreak: {}, bestStreak: {} }
}

function saveHabitState(state: HabitState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function HabitsModule({ onRemove }: HabitsModuleProps) {
  const state = useMemo(() => loadHabitState(), [])
  const today = getTodayDateString()
  const activeHabits = state.habits.filter((h) => h.isActive)
  const todayRecords = state.records.filter((r) => r.date === today)
  const completedIds = new Set(todayRecords.filter((r) => r.completed).map((r) => r.habitId))

  const handleToggle = (habit: Habit) => {
    const newState = toggleHabit(state, habit.id, today)
    saveHabitState(newState)
    window.dispatchEvent(new CustomEvent('habit-state-changed', { detail: newState }))
  }

  if (activeHabits.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.title}>微习惯打卡</span>
          <button className={styles.removeBtn} onClick={onRemove} type="button" title="移除">×</button>
        </div>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🌱</span>
          <span className={styles.emptyText}>还没有习惯，去添加吧</span>
        </div>
      </div>
    )
  }

  const completedCount = completedIds.size
  const totalCount = activeHabits.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>微习惯打卡</span>
        <button className={styles.removeBtn} onClick={onRemove} type="button" title="移除">×</button>
      </div>

      <div className={styles.progressRow}>
        <div className={styles.progressRing}>
          <svg viewBox="0 0 60 60" className={styles.progressSvg}>
            <circle
              className={styles.progressTrack}
              cx="30" cy="30" r="26"
              fill="none" strokeWidth="4"
            />
            <circle
              className={styles.progressFill}
              cx="30" cy="30" r="26"
              fill="none" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 26}
              strokeDashoffset={2 * Math.PI * 26 * (1 - progressPercent / 100)}
              transform="rotate(-90 30 30)"
            />
          </svg>
          <span className={styles.progressText}>{progressPercent}%</span>
        </div>
        <div className={styles.progressInfo}>
          <span className={styles.progressLabel}>今日完成</span>
          <span className={styles.progressCount}>{completedCount}/{totalCount}</span>
        </div>
      </div>

      <div className={styles.habitList}>
        {activeHabits.map((habit) => {
          const isCompleted = completedIds.has(habit.id)
          const streak = state.currentStreak[habit.id] || 0
          return (
            <button
              key={habit.id}
              className={`${styles.habitItem} ${isCompleted ? styles.habitItemDone : ''}`}
              onClick={() => handleToggle(habit)}
              type="button"
            >
              <span className={styles.habitIcon}>{habit.icon}</span>
              <span className={styles.habitName}>{habit.name}</span>
              <span className={styles.habitTarget}>
                {habit.target}{habit.unit}
              </span>
              {streak > 0 && (
                <span className={styles.habitStreak} title={`连续 ${streak} 天`}>
                  {streak}🔥
                </span>
              )}
              <span className={`${styles.habitCheck} ${isCompleted ? styles.habitCheckDone : ''}`}>
                {isCompleted ? '✓' : '○'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
