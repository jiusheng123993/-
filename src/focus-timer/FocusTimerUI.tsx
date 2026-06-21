import { useState, useEffect, useCallback, useRef } from 'react'
import { loadRecords, getTodayRecords } from '../focus-mode/focusModeService'
import type { PomodoroRecord } from '../focus-mode/types'
import { computeStats, drawTrendChart, type DashboardStats } from './focusChartUtils'
import styles from './FocusTimerUI.module.css'

interface FocusTimerUIProps {
  userId?: string
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}

export function FocusTimerUI({ userId: _userId }: FocusTimerUIProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [showHistory, setShowHistory] = useState(false)
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
      drawTrendChart(canvasRef.current, stats.dailyStats, {
        padding: { top: 16, right: 16, bottom: 28, left: 40 },
        ySteps: 4,
        emptyFontSize: '12px',
        axisFontSize: '10px',
        labelFontSize: '10px',
        gradientOpacity: 0.2,
        lineWidth: 2,
        pointRadius: 3,
        labelStepDenom: 6,
      })
    }
  }, [stats])

  return (
    <div className={styles.container}>
      {stats && (
        <div className={styles.statsSection}>
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
                {stats.subjectStats.map((s) => (
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
