import { useState, useMemo, useCallback } from 'react'
import type { CycleRecord, CyclePhase } from './cycleTypes'
import { cycleService } from './cycleService'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type CycleCalendarProps = {
  onDateSelect: (date: string) => void
  prediction?: ReturnType<typeof cycleService.getPrediction>
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isDateInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}

const PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: '#e74c3c',
  follicular: '#2ecc71',
  ovulation: '#f39c12',
  luteal: '#9b59b6'
}

export function CycleCalendar({ onDateSelect, prediction }: CycleCalendarProps) {
  const today = useMemo(() => {
    const d = new Date()
    return formatDateStr(d.getFullYear(), d.getMonth(), d.getDate())
  }, [])

  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())

  const records = useMemo(() => {
    const all = cycleService.getRecords()
    const map = new Map<string, CycleRecord>()
    all.forEach(r => map.set(r.date, r))
    return map
  }, [])

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)

  const handlePrevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => y - 1)
    } else {
      setViewMonth(m => m - 1)
    }
  }, [viewMonth])

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => y + 1)
    } else {
      setViewMonth(m => m + 1)
    }
  }, [viewMonth])

  const getDayInfo = (day: number) => {
    const date = formatDateStr(viewYear, viewMonth, day)
    const record = records.get(date)
    const isToday = date === today

    let phase: CyclePhase | null = null
    let isPredicted = false
    let isFertile = false

    if (prediction) {
      if (record?.flow) {
        phase = 'menstrual'
      } else if (isDateInRange(date, prediction.nextPeriodStart, prediction.nextPeriodEnd)) {
        phase = 'menstrual'
        isPredicted = true
      } else if (isDateInRange(date, prediction.fertileWindowStart, prediction.fertileWindowEnd)) {
        isFertile = true
      } else if (isDateInRange(date, prediction.nextOvulation, prediction.nextOvulation)) {
        phase = 'ovulation'
        isPredicted = true
      }
    }

    return { date, record, isToday, phase, isPredicted, isFertile }
  }

  const cells: Array<ReturnType<typeof getDayInfo> | null> = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(getDayInfo(d))

  return (
    <div className="cycle-calendar">
      <div className="cycle-calendar-header">
        <button onClick={handlePrevMonth} type="button" className="cycle-nav-btn">
          <ChevronLeft size={18} />
        </button>
        <span className="cycle-month-label">
          {viewYear}年{viewMonth + 1}月
        </span>
        <button onClick={handleNextMonth} type="button" className="cycle-nav-btn">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="cycle-calendar-weekdays">
        {WEEKDAYS.map(w => (
          <div key={w} className="cycle-weekday">{w}</div>
        ))}
      </div>

      <div className="cycle-calendar-grid">
        {cells.map((info, idx) => {
          if (!info) return <div key={`empty_${idx}`} className="cycle-day-cell empty" />

          const { date, record, isToday, phase, isPredicted, isFertile } = info

          return (
            <button
              key={date}
              className={`cycle-day-cell ${isToday ? 'today' : ''} ${phase ? `phase-${phase}` : ''} ${isPredicted ? 'predicted' : ''} ${isFertile ? 'fertile' : ''} ${record ? 'has-record' : ''}`}
              onClick={() => onDateSelect(date)}
              type="button"
            >
              <span className="cycle-day-number">{new Date(date).getDate()}</span>
              {phase && (
                <span
                  className="cycle-phase-dot"
                  style={{ backgroundColor: PHASE_COLORS[phase] }}
                />
              )}
              {isFertile && <span className="cycle-fertile-dot" />}
            </button>
          )
        })}
      </div>

      <div className="cycle-calendar-legend">
        <span className="cycle-legend-item">
          <span className="cycle-legend-dot" style={{ backgroundColor: PHASE_COLORS.menstrual }} />
          经期
        </span>
        <span className="cycle-legend-item">
          <span className="cycle-legend-dot predicted-dot" style={{ backgroundColor: PHASE_COLORS.menstrual }} />
          预测经期
        </span>
        <span className="cycle-legend-item">
          <span className="cycle-legend-dot" style={{ backgroundColor: PHASE_COLORS.ovulation }} />
          排卵日
        </span>
        <span className="cycle-legend-item">
          <span className="cycle-legend-dot fertile-legend-dot" />
          易孕期
        </span>
      </div>
    </div>
  )
}
