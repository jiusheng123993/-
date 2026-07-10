import { useState, useMemo, useCallback } from 'react'
import { cycleService } from './cycleService'
import { CycleCalendar } from './CycleCalendar'
import { CycleDayDetail } from './CycleDayDetail'
import { CycleTodayCard } from './CycleTodayCard'
import { CycleSettingsPage } from './CycleSettings'
import { PrivacyLock } from './PrivacyLock'
import { Calendar, BarChart3, Settings, Droplets } from 'lucide-react'
import type { SymptomType, MoodType, FlowLevel } from './cycleTypes'
import { SYMptom_LABELS, MOOD_LABELS, FLOW_LABELS } from './cycleTypes'

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
          <CycleStats />
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

function CycleStats() {
  const records = useMemo(() => cycleService.getRecords(), [])
  const prediction = useMemo(() => cycleService.getPrediction(), [])

  const stats = useMemo(() => {
    if (records.length === 0) return null

    const recordsWithFlow = records.filter((r) => r.flow)
    const totalRecords = records.length

    const flowCounts: Record<FlowLevel, number> = { spotting: 0, light: 0, medium: 0, heavy: 0 }
    recordsWithFlow.forEach((r) => {
      if (r.flow) flowCounts[r.flow]++
    })

    const symptomCounts: Record<string, number> = {}
    records.forEach((r) => {
      r.symptoms.forEach((s) => {
        symptomCounts[s] = (symptomCounts[s] || 0) + 1
      })
    })

    const moodCounts: Record<string, number> = {}
    records.forEach((r) => {
      r.moods.forEach((m) => {
        moodCounts[m] = (moodCounts[m] || 0) + 1
      })
    })

    const topSymptoms = Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const topMoods = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const avgSleep = records
      .filter((r) => r.sleepHours !== undefined)
      .reduce((sum, r, _, arr) => sum + (r.sleepHours || 0) / arr.length, 0)

    const avgExercise = records
      .filter((r) => r.exerciseMinutes !== undefined)
      .reduce((sum, r, _, arr) => sum + (r.exerciseMinutes || 0) / arr.length, 0)

    const avgWater = records
      .filter((r) => r.waterGlasses !== undefined)
      .reduce((sum, r, _, arr) => sum + (r.waterGlasses || 0) / arr.length, 0)

    return {
      totalRecords,
      recordsWithFlow: recordsWithFlow.length,
      flowCounts,
      topSymptoms,
      topMoods,
      avgSleep: Math.round(avgSleep * 10) / 10,
      avgExercise: Math.round(avgExercise),
      avgWater: Math.round(avgWater * 10) / 10
    }
  }, [records])

  if (!stats || stats.totalRecords === 0) {
    return (
      <div className="cycle-stats-placeholder">
        <BarChart3 size={32} />
        <p>暂无记录数据</p>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>开始记录周期数据后，这里将展示统计分析</p>
      </div>
    )
  }

  const maxFlowCount = Math.max(...Object.values(stats.flowCounts), 1)
  const maxSymptomCount = stats.topSymptoms.length > 0 ? stats.topSymptoms[0][1] : 1
  const maxMoodCount = stats.topMoods.length > 0 ? stats.topMoods[0][1] : 1

  return (
    <div className="cycle-stats">
      <div className="cycle-stats-summary">
        <div className="cycle-stat-card">
          <span className="cycle-stat-value">{stats.totalRecords}</span>
          <span className="cycle-stat-label">总记录天数</span>
        </div>
        <div className="cycle-stat-card">
          <span className="cycle-stat-value">{stats.recordsWithFlow}</span>
          <span className="cycle-stat-label">经期天数</span>
        </div>
        <div className="cycle-stat-card">
          <span className="cycle-stat-value">{prediction.averageCycleLength}</span>
          <span className="cycle-stat-label">平均周期(天)</span>
        </div>
        <div className="cycle-stat-card">
          <span className="cycle-stat-value">{prediction.averagePeriodLength}</span>
          <span className="cycle-stat-label">平均经期(天)</span>
        </div>
      </div>

      <div className="cycle-stats-section">
        <h4>经量分布</h4>
        <div className="cycle-stats-bars">
          {(Object.entries(stats.flowCounts) as [FlowLevel, number][]).map(([flow, count]) => (
            <div key={flow} className="cycle-stats-bar-row">
              <span className="cycle-stats-bar-label">{FLOW_LABELS[flow]}</span>
              <div className="cycle-stats-bar-track">
                <div
                  className="cycle-stats-bar-fill"
                  style={{ width: `${(count / maxFlowCount) * 100}%` }}
                />
              </div>
              <span className="cycle-stats-bar-count">{count}天</span>
            </div>
          ))}
        </div>
      </div>

      {stats.topSymptoms.length > 0 && (
        <div className="cycle-stats-section">
          <h4>常见症状 (Top 5)</h4>
          <div className="cycle-stats-bars">
            {stats.topSymptoms.map(([symptom, count]) => (
              <div key={symptom} className="cycle-stats-bar-row">
                <span className="cycle-stats-bar-label">{SYMptom_LABELS[symptom as SymptomType] || symptom}</span>
                <div className="cycle-stats-bar-track">
                  <div
                    className="cycle-stats-bar-fill symptom"
                    style={{ width: `${(count / maxSymptomCount) * 100}%` }}
                  />
                </div>
                <span className="cycle-stats-bar-count">{count}次</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.topMoods.length > 0 && (
        <div className="cycle-stats-section">
          <h4>情绪分布 (Top 5)</h4>
          <div className="cycle-stats-bars">
            {stats.topMoods.map(([mood, count]) => (
              <div key={mood} className="cycle-stats-bar-row">
                <span className="cycle-stats-bar-label">{MOOD_LABELS[mood as MoodType] || mood}</span>
                <div className="cycle-stats-bar-track">
                  <div
                    className="cycle-stats-bar-fill mood"
                    style={{ width: `${(count / maxMoodCount) * 100}%` }}
                  />
                </div>
                <span className="cycle-stats-bar-count">{count}次</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(stats.avgSleep > 0 || stats.avgExercise > 0 || stats.avgWater > 0) && (
        <div className="cycle-stats-section">
          <h4>生活习惯</h4>
          <div className="cycle-stats-summary">
            {stats.avgSleep > 0 && (
              <div className="cycle-stat-card">
                <span className="cycle-stat-value">{stats.avgSleep}h</span>
                <span className="cycle-stat-label">平均睡眠</span>
              </div>
            )}
            {stats.avgExercise > 0 && (
              <div className="cycle-stat-card">
                <span className="cycle-stat-value">{stats.avgExercise}min</span>
                <span className="cycle-stat-label">平均运动</span>
              </div>
            )}
            {stats.avgWater > 0 && (
              <div className="cycle-stat-card">
                <span className="cycle-stat-value">{stats.avgWater}杯</span>
                <span className="cycle-stat-label">平均饮水</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
