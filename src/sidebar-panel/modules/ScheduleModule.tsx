import { useMemo } from 'react'
import type { ScheduleEvent, ScheduleState } from '../../schedule/scheduleService'
import styles from './ScheduleModule.module.css'

interface ScheduleModuleProps {
  onRemove: () => void
  onOpenSchedule?: () => void
}

const STORAGE_KEY = 'xinghuanhai-schedule-state'

function loadState(): ScheduleState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ScheduleState
  } catch { /* ignore */ }
  return { events: [] }
}

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getTimeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function isEventNow(event: ScheduleEvent): boolean {
  if (!event.time) return false
  const now = new Date()
  const [h, m] = event.time.split(':').map(Number)
  const start = h * 60 + m
  const current = now.getHours() * 60 + now.getMinutes()
  if (!event.endTime) return current >= start && current < start + 60
  const [eh, em] = event.endTime.split(':').map(Number)
  const end = eh * 60 + em
  return current >= start && current < end
}

export function ScheduleModule({ onRemove, onOpenSchedule }: ScheduleModuleProps) {
  const state = useMemo(() => loadState(), [])
  const today = getTodayStr()

  const todayEvents = state.events
    .filter((e) => e.date === today && !e.completed)
    .sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time)
      if (a.time) return -1
      if (b.time) return 1
      return 0
    })

  const nowEvent = todayEvents.find((e) => isEventNow(e))
  const upcomingEvents = todayEvents.filter((e) => !isEventNow(e))

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>今日日程条</span>
        <button className={styles.removeBtn} onClick={onRemove} type="button" title="移除">×</button>
      </div>

      {todayEvents.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📅</span>
          <span className={styles.emptyText}>今日暂无日程</span>
          {onOpenSchedule && (
            <button className={styles.addScheduleBtn} onClick={onOpenSchedule} type="button">
              + 添加日程
            </button>
          )}
        </div>
      ) : (
        <>
          {nowEvent && (
            <div className={styles.nowBanner} style={{ borderLeftColor: nowEvent.color }}>
              <span className={styles.nowDot} style={{ background: nowEvent.color }} />
              <span className={styles.nowLabel}>正在进行</span>
              <span className={styles.nowTitle}>{nowEvent.title}</span>
              <span className={styles.nowTime}>
                {getTimeLabel(nowEvent.time)}
                {nowEvent.endTime && ` - ${getTimeLabel(nowEvent.endTime)}`}
              </span>
            </div>
          )}

          <div className={styles.timeline}>
            {upcomingEvents.slice(0, 4).map((event, i) => (
              <div key={event.id} className={styles.timelineItem}>
                <div className={styles.timelineLine}>
                  <div
                    className={styles.timelineDot}
                    style={{ background: event.color }}
                  />
                  {i < Math.min(upcomingEvents.length, 4) - 1 && (
                    <div className={styles.timelineConnector} />
                  )}
                </div>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineTime}>
                    {event.time ? getTimeLabel(event.time) : '全天'}
                  </span>
                  <span className={styles.timelineTitle}>{event.title}</span>
                </div>
              </div>
            ))}
          </div>

          {todayEvents.length > 5 && (
            <div className={styles.more}>
              +{todayEvents.length - 5} 更多日程
            </div>
          )}
        </>
      )}
    </div>
  )
}
