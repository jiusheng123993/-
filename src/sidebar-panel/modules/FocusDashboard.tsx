import { useMemo } from 'react'
import styles from './FocusDashboard.module.css'

interface FocusDashboardProps {
  focusMinuteText: string
  focusSecondText: string
  isFocusRunning: boolean
  focusDisplayTask: { id: string; title: string; dueLabel: string } | null
  focusTargetMinutes: number
  totalFocusMinutes: number
  onStartFocus: () => void
  onPauseFocus: () => void
  onResetFocus: () => void
  onAdjustFocus: (delta: number) => void
  onRemove: () => void
}

export function FocusDashboard({
  focusMinuteText,
  focusSecondText,
  isFocusRunning,
  focusDisplayTask,
  focusTargetMinutes,
  totalFocusMinutes,
  onStartFocus,
  onPauseFocus,
  onResetFocus,
  onAdjustFocus,
  onRemove
}: FocusDashboardProps) {
  const elapsedSeconds = useMemo(() => {
    const mins = parseInt(focusMinuteText, 10) || 0
    const secs = parseInt(focusSecondText, 10) || 0
    return mins * 60 + secs
  }, [focusMinuteText, focusSecondText])

  const totalSeconds = focusTargetMinutes * 60
  const progress = totalSeconds > 0 ? Math.min(elapsedSeconds / totalSeconds, 1) : 0
  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference * (1 - progress)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>专注仪表</span>
        <button className={styles.removeBtn} onClick={onRemove} type="button" title="移除">×</button>
      </div>

      <div className={styles.ringContainer}>
        <svg className={styles.ring} viewBox="0 0 120 120">
          <defs>
            <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--secondary)" />
            </linearGradient>
          </defs>
          <circle
            className={styles.ringTrack}
            cx="60" cy="60" r="54"
            fill="none"
            strokeWidth="6"
          />
          <circle
            className={styles.ringProgress}
            cx="60" cy="60" r="54"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            stroke="url(#focusGradient)"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className={styles.ringCenter}>
          <span className={styles.timeDisplay}>
            {focusMinuteText}<span className={styles.timeColon}>:</span>{focusSecondText}
          </span>
          {isFocusRunning && <span className={styles.runningLabel}>专注中</span>}
        </div>
      </div>

      {focusDisplayTask && (
        <div className={styles.taskLabel} title={focusDisplayTask.title}>
          {focusDisplayTask.title}
        </div>
      )}

      {!isFocusRunning && (
        <div className={styles.durationRow}>
          <button
            className={styles.adjustBtn}
            onClick={() => onAdjustFocus(-5)}
            type="button"
            disabled={focusTargetMinutes <= 5}
          >
            −5
          </button>
          <span className={styles.durationLabel}>{focusTargetMinutes} 分钟</span>
          <button
            className={styles.adjustBtn}
            onClick={() => onAdjustFocus(5)}
            type="button"
            disabled={focusTargetMinutes >= 180}
          >
            +5
          </button>
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={`${styles.mainBtn} ${isFocusRunning ? styles.mainBtnPause : ''}`}
          onClick={isFocusRunning ? onPauseFocus : onStartFocus}
          type="button"
        >
          {isFocusRunning ? '暂停' : '开始专注'}
        </button>
        <button className={styles.resetBtn} onClick={onResetFocus} type="button">
          重置
        </button>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerLabel}>今日累计</span>
        <span className={styles.footerValue}>{totalFocusMinutes} 分钟</span>
      </div>
    </div>
  )
}