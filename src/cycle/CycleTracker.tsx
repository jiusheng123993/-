import { useState, useMemo, useCallback } from 'react'
import { cycleService } from './cycleService'
import { CycleCalendar } from './CycleCalendar'
import { CycleDayDetail } from './CycleDayDetail'
import { CycleTodayCard } from './CycleTodayCard'
import { CycleSettingsPage } from './CycleSettings'
import { PrivacyLock } from './PrivacyLock'
import { Calendar, BarChart3, Settings, Droplets } from 'lucide-react'

type CycleView = 'calendar' | 'today' | 'stats' | 'settings'

export function CycleTracker() {
  const settings = useMemo(() => cycleService.getSettings(), [])
  const [isLocked, setIsLocked] = useState(settings.privacyLockEnabled && !!settings.privacyPin)
  const [view, setView] = useState<CycleView>('today')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const handleUnlock = useCallback(() => {
    setIsLocked(false)
  }, [])

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  const handleDayDetailSave = useCallback(() => {
    setSelectedDate(null)
  }, [])

  const handleDayDetailClose = useCallback(() => {
    setSelectedDate(null)
  }, [])

  const handleQuickRecord = useCallback(() => {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    setSelectedDate(dateStr)
  }, [])

  if (isLocked) {
    return <PrivacyLock onUnlock={handleUnlock} />
  }

  const prediction = cycleService.getPrediction()

  return (
    <div className="cycle-tracker">
      <div className="cycle-tracker-header">
        <Droplets size={20} />
        <h2>周期管理</h2>
      </div>

      <div className="cycle-disclaimer-banner">
        本功能仅提供记录与生活建议，不构成医学诊断。如有健康问题请咨询医生。
      </div>

      <div className="cycle-nav-tabs">
        <button
          className={`cycle-nav-tab ${view === 'today' ? 'active' : ''}`}
          onClick={() => setView('today')}
          type="button"
        >
          <Calendar size={14} />
          <span>今日</span>
        </button>
        <button
          className={`cycle-nav-tab ${view === 'calendar' ? 'active' : ''}`}
          onClick={() => setView('calendar')}
          type="button"
        >
          <Calendar size={14} />
          <span>日历</span>
        </button>
        <button
          className={`cycle-nav-tab ${view === 'stats' ? 'active' : ''}`}
          onClick={() => setView('stats')}
          type="button"
        >
          <BarChart3 size={14} />
          <span>统计</span>
        </button>
        <button
          className={`cycle-nav-tab ${view === 'settings' ? 'active' : ''}`}
          onClick={() => setView('settings')}
          type="button"
        >
          <Settings size={14} />
          <span>设置</span>
        </button>
      </div>

      <div className="cycle-content">
        {view === 'today' && (
          <CycleTodayCard onQuickRecord={handleQuickRecord} />
        )}
        {view === 'calendar' && (
          <CycleCalendar
            onDateSelect={handleDateSelect}
            prediction={prediction}
          />
        )}
        {view === 'stats' && (
          <div className="cycle-stats-placeholder">
            <BarChart3 size={32} />
            <p>统计功能开发中</p>
          </div>
        )}
        {view === 'settings' && (
          <CycleSettingsPage onBack={() => setView('today')} />
        )}
      </div>

      {selectedDate && (
        <div className="cycle-day-detail-overlay">
          <CycleDayDetail
            date={selectedDate}
            onClose={handleDayDetailClose}
            onSave={handleDayDetailSave}
          />
        </div>
      )}
    </div>
  )
}
