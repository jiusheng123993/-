import { useState, useMemo } from 'react'
import { FileText, TrendingUp, CheckCircle, Target, Heart, Wallet, BookOpen, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { createReportService } from './reportService'
import type { ReportData } from './reportService'

interface ReportUIProps {
  compact?: boolean
  getWorkspaceState?: () => Record<string, unknown>
  getStudyState?: () => Record<string, unknown>
  getHabitState?: () => Record<string, unknown>
  getFinanceState?: () => Record<string, unknown>
  getReadingState?: () => Record<string, unknown>
  getWellnessState?: () => Record<string, unknown>
  getJournalState?: () => Record<string, unknown>
}

const colors = {
  bg: 'var(--bg-primary, #0f0f1a)',
  cardBg: 'var(--surface, #1a1a2e)',
  cardBorder: 'var(--border, #2a2a4a)',
  text: 'var(--text, #e0e0e0)',
  textSecondary: 'var(--muted, #8888aa)',
  accent: '#06b6d4',
  accentLight: '#22d3ee',
  income: '#4caf50',
  expense: '#f44336',
  progressBg: 'var(--border, #2a2a4a)',
}

export function ReportUI({
  compact = false,
  getWorkspaceState: externalGetWorkspaceState,
  getStudyState: externalGetStudyState,
  getHabitState: externalGetHabitState,
  getFinanceState: externalGetFinanceState,
  getReadingState: externalGetReadingState,
  getWellnessState: externalGetWellnessState,
  getJournalState: externalGetJournalState,
}: ReportUIProps) {
  const [reportPeriod, setReportPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthYear, setMonthYear] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })

  const reportService = useMemo(() => {
    const getWorkspaceState = externalGetWorkspaceState || (() => ({ focusSessions: [], tasks: [] }))
    const getStudyState = externalGetStudyState || (() => ({}))
    const getHabitState = externalGetHabitState || (() => ({ checkIns: [], currentStreak: 0 }))
    const getFinanceState = externalGetFinanceState || (() => ({ transactions: [] }))
    const getReadingState = externalGetReadingState || (() => ({ books: [] }))
    const getWellnessState = externalGetWellnessState || (() => ({ water: [], exercises: [], meals: [] }))
    const getJournalState = externalGetJournalState || (() => ({ entries: [] }))
    return createReportService(getWorkspaceState, getStudyState, getHabitState, getFinanceState, getReadingState, getWellnessState, getJournalState)
  }, [externalGetWorkspaceState, externalGetStudyState, externalGetHabitState, externalGetFinanceState, externalGetReadingState, externalGetWellnessState, externalGetJournalState])

  const report: ReportData = useMemo(() => {
    if (reportPeriod === 'weekly') {
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() + 1 - weekOffset * 7)
      return reportService.generateWeeklyReport(startOfWeek.toISOString().split('T')[0])
    } else {
      return reportService.generateMonthlyReport(monthYear.year, monthYear.month)
    }
  }, [reportPeriod, weekOffset, monthYear, reportService])

  const summaryText = useMemo(() => reportService.getSummaryText(report), [report, reportService])

  const formatDate = () => {
    if (reportPeriod === 'weekly') {
      return `${report.startDate} ~ ${report.endDate}`
    } else {
      return `${monthYear.year}年${monthYear.month}月`
    }
  }

  const handlePrev = () => {
    if (reportPeriod === 'weekly') {
      setWeekOffset((w) => w + 1)
    } else {
      if (monthYear.month === 1) {
        setMonthYear({ year: monthYear.year - 1, month: 12 })
      } else {
        setMonthYear({ year: monthYear.year, month: monthYear.month - 1 })
      }
    }
  }

  const handleNext = () => {
    if (reportPeriod === 'weekly') {
      setWeekOffset((w) => Math.max(0, w - 1))
    } else {
      const now = new Date()
      if (monthYear.year < now.getFullYear() || (monthYear.year === now.getFullYear() && monthYear.month < now.getMonth() + 1)) {
        if (monthYear.month === 12) {
          setMonthYear({ year: monthYear.year + 1, month: 1 })
        } else {
          setMonthYear({ year: monthYear.year, month: monthYear.month + 1 })
        }
      }
    }
  }

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <FileText size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>报告</strong>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: 8, background: colors.cardBg, borderRadius: 8 }}>
            <div style={{ color: colors.accent, fontSize: 18, fontWeight: 700 }}>{report.focus.totalSessions}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>专注</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: 8, background: colors.cardBg, borderRadius: 8 }}>
            <div style={{ color: colors.income, fontSize: 18, fontWeight: 700 }}>{report.tasks.completionRate}%</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>完成率</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: 8, background: colors.cardBg, borderRadius: 8 }}>
            <div style={{ color: colors.text, fontSize: 18, fontWeight: 700 }}>{report.habits.streakDays}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>连续</small>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: colors.textSecondary }}>
          {formatDate()} 报告
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileText size={24} style={{ color: colors.accent }} />报告中心
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setReportPeriod('weekly')}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: 8,
            background: reportPeriod === 'weekly' ? colors.accent : colors.cardBg,
            color: reportPeriod === 'weekly' ? '#000' : colors.textSecondary,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 14
          }}
        >
          周报
        </button>
        <button
          onClick={() => setReportPeriod('monthly')}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: 8,
            background: reportPeriod === 'monthly' ? colors.accent : colors.cardBg,
            color: reportPeriod === 'monthly' ? '#000' : colors.textSecondary,
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 14
          }}
        >
          月报
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '12px 16px', background: colors.cardBg, borderRadius: 12 }}>
        <button onClick={handlePrev} style={{ padding: 8, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{formatDate()}</span>
        <button onClick={handleNext} style={{ padding: 8, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrendingUp size={18} style={{ color: colors.accent }} />
            <span style={{ fontWeight: 500 }}>专注数据</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.accent, marginBottom: 4 }}>{report.focus.totalMinutes}</div>
          <small style={{ color: colors.textSecondary }}>分钟总专注</small>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{report.focus.totalSessions}</div>
              <small style={{ color: colors.textSecondary }}>次专注</small>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{report.focus.avgPerDay}</div>
              <small style={{ color: colors.textSecondary }}>日均分钟</small>
            </div>
          </div>
        </div>

        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle size={18} style={{ color: colors.income }} />
            <span style={{ fontWeight: 500 }}>任务完成</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.income, marginBottom: 4 }}>{report.tasks.completionRate}%</div>
          <small style={{ color: colors.textSecondary }}>任务完成率</small>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{report.tasks.completed}</div>
              <small style={{ color: colors.textSecondary }}>已完成</small>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{report.tasks.created}</div>
              <small style={{ color: colors.textSecondary }}>已创建</small>
            </div>
          </div>
        </div>

        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Target size={18} style={{ color: colors.accentLight }} />
            <span style={{ fontWeight: 500 }}>习惯养成</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.accentLight, marginBottom: 4 }}>{report.habits.streakDays}</div>
          <small style={{ color: colors.textSecondary }}>天连续打卡</small>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{report.habits.totalCheckIns}</div>
            <small style={{ color: colors.textSecondary }}>次打卡记录</small>
          </div>
        </div>

        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Wallet size={18} style={{ color: report.finance.balance >= 0 ? colors.income : colors.expense }} />
            <span style={{ fontWeight: 500 }}>财务收支</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: report.finance.balance >= 0 ? colors.income : colors.expense, marginBottom: 4 }}>
            {report.finance.balance >= 0 ? '+' : ''}¥{report.finance.balance.toLocaleString()}
          </div>
          <small style={{ color: colors.textSecondary }}>本月结余</small>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: colors.income }}>+{report.finance.income.toLocaleString()}</div>
              <small style={{ color: colors.textSecondary }}>收入</small>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: colors.expense }}>-{report.finance.expense.toLocaleString()}</div>
              <small style={{ color: colors.textSecondary }}>支出</small>
            </div>
          </div>
        </div>

        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BookOpen size={18} style={{ color: colors.accent }} />
            <span style={{ fontWeight: 500 }}>阅读</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.accent, marginBottom: 4 }}>{report.reading.booksCompleted}</div>
          <small style={{ color: colors.textSecondary }}>本月读完</small>
        </div>

        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Heart size={18} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 500 }}>健康</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>{report.wellness.totalWater}</div>
          <small style={{ color: colors.textSecondary }}>ml 饮水量</small>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{report.wellness.totalExercise} 分钟</div>
            <small style={{ color: colors.textSecondary }}>运动时长</small>
          </div>
        </div>
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, color: colors.textSecondary }}>报告摘要</h3>
          <button
            onClick={() => {
              navigator.clipboard.writeText(summaryText)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: colors.accent, border: 'none', borderRadius: 6, color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <Download size={14} />复制
          </button>
        </div>
        <pre style={{ fontSize: 12, lineHeight: 1.6, color: colors.textSecondary, whiteSpace: 'pre-wrap', margin: 0 }}>
          {summaryText}
        </pre>
      </div>
    </div>
  )
}