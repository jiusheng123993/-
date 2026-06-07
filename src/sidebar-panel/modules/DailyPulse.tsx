import styles from './DailyPulse.module.css'

interface DailyPulseProps {
  streakDays: number
  completedTasks: number
  totalFocusMinutes: number
  todoTasks: { id: string; title: string; dueLabel: string; minutes: number }[]
  onRemove: () => void
}

export function DailyPulse({
  streakDays,
  completedTasks,
  totalFocusMinutes,
  todoTasks,
  onRemove
}: DailyPulseProps) {
  const pendingCount = todoTasks.length
  const focusHours = (totalFocusMinutes / 60).toFixed(1)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>今日脉搏</span>
        <button className={styles.removeBtn} onClick={onRemove} type="button" title="移除">×</button>
      </div>

      <div className={styles.grid}>
        <div className={`${styles.metric} ${styles.metricStreak}`}>
          <span className={styles.metricIcon}>🔥</span>
          <span className={styles.metricValue}>{streakDays}</span>
          <span className={styles.metricLabel}>连续天数</span>
        </div>
        <div className={`${styles.metric} ${styles.metricDone}`}>
          <span className={styles.metricIcon}>✅</span>
          <span className={styles.metricValue}>{completedTasks}</span>
          <span className={styles.metricLabel}>已完成</span>
        </div>
        <div className={`${styles.metric} ${styles.metricFocus}`}>
          <span className={styles.metricIcon}>⏱️</span>
          <span className={styles.metricValue}>{focusHours}h</span>
          <span className={styles.metricLabel}>专注时长</span>
        </div>
        <div className={`${styles.metric} ${styles.metricPending}`}>
          <span className={styles.metricIcon}>📋</span>
          <span className={styles.metricValue}>{pendingCount}</span>
          <span className={styles.metricLabel}>待办任务</span>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className={styles.pendingBar}>
          <div className={styles.pendingBarHeader}>
            <span className={styles.pendingBarTitle}>待处理</span>
            <span className={styles.pendingBarCount}>{pendingCount} 项</span>
          </div>
          <div className={styles.pendingList}>
            {todoTasks.slice(0, 3).map((t) => (
              <div key={t.id} className={styles.pendingItem}>
                <span className={styles.pendingDot} />
                <span className={styles.pendingName}>{t.title}</span>
                <span className={styles.pendingDue}>{t.dueLabel}</span>
              </div>
            ))}
            {todoTasks.length > 3 && (
              <div className={styles.pendingMore}>+{todoTasks.length - 3} 更多...</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
