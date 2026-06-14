import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAdaptiveTooltip } from '../../platforms'
import { loadRecords, getTodayRecords } from '../../focus-mode/focusModeService'
import type { PomodoroRecord } from '../../focus-mode/types'
import { computeStats, drawTrendChart, type DashboardStats } from '../../focus-timer/focusChartUtils'
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

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const taskTooltip = useAdaptiveTooltip(focusDisplayTask?.title || '')
  const [todayRecords, setTodayRecords] = useState<PomodoroRecord[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const loadData = useCallback(() => {
    const records = loadRecords()
    setStats(computeStats(records))
    setTodayRecords(getTodayRecords().filter(r => r.type === 'focus'))
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (stats && canvasRef.current) {
      drawTrendChart(canvasRef.current, stats.dailyStats)
    }
  }, [stats])

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
        <div className={styles.taskLabel} {...taskTooltip.tooltipProps}>
          {focusDisplayTask.title}
        </div>
      )}
      {taskTooltip.tooltipElement}

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

      {stats && (
        <div className={styles.dashboardSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatMinutes(stats.todayMinutes)}</div>
              <div className={styles.statLabel}>今日专注</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatMinutes(stats.weekMinutes)}</div>
              <div className={styles.statLabel}>本周专注</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{formatMinutes(stats.monthMinutes)}</div>
              <div className={styles.statLabel}>本月专注</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.completedSessions}</div>
              <div className={styles.statLabel}>完成次数</div>
            </div>
          </div>

          <div className={styles.chartSection}>
            <div className={styles.chartTitle}>专注趋势</div>
            <canvas ref={canvasRef} className={styles.trendCanvas} />
          </div>

          {stats.subjectStats.length > 0 && (
            <div className={styles.subjectSection}>
              <div className={styles.chartTitle}>科目分布</div>
              <div className={styles.subjectList}>
                {stats.subjectStats.slice(0, 5).map((s) => (
                  <div key={s.subject} className={styles.subjectItem}>
                    <span className={styles.subjectName}>{s.subject}</span>
                    <div className={styles.subjectBar}>
                      <div
                        className={styles.subjectBarFill}
                        style={{
                          width: `${(s.minutes / stats.subjectStats[0].minutes) * 100}%`,
                        }}
                      />
                    </div>
                    <span className={styles.subjectTime}>{formatMinutes(s.minutes)}</span>
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
          📋 {showHistory ? '收起记录' : `今日记录 (${todayRecords.length})`}
        </button>

        {showHistory && (
          <div className={styles.historyList}>
            {todayRecords.length === 0 ? (
              <div className={styles.emptyHistory}>今天还没有专注记录</div>
            ) : (
              todayRecords.map((r) => (
                <div key={r.id} className={styles.historyItem}>
                  <div className={styles.historyInfo}>
                    <span className={styles.historySubject}>{r.taskTitle || '未分类'}</span>
                    <span className={styles.historyTime}>
                      {new Date(r.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={styles.historyMeta}>
                    <span className={styles.historyDuration}>{r.durationMinutes}分钟</span>
                    <span className={`${styles.historyStatus} ${r.abandoned ? styles.incomplete : styles.completed}`}>
                      {r.abandoned ? '⚠️' : '✅'}
                    </span>
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
