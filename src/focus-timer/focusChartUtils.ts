import type { PomodoroRecord } from '../focus-mode/types'

export interface DashboardStats {
  todayMinutes: number
  weekMinutes: number
  monthMinutes: number
  completedSessions: number
  dailyStats: { date: string; minutes: number }[]
  subjectStats: { subject: string; minutes: number; sessions: number }[]
}

export function computeStats(records: PomodoroRecord[]): DashboardStats {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let todayMinutes = 0
  let weekMinutes = 0
  let monthMinutes = 0
  let completedSessions = 0

  const dailyMap: Record<string, number> = {}
  const subjectMap: Record<string, { minutes: number; sessions: number }> = {}

  for (const r of records) {
    if (r.type !== 'focus' || r.abandoned) continue
    completedSessions++

    const dateStr = r.completedAt.slice(0, 10)
    const completedDate = new Date(r.completedAt)

    if (dateStr === todayStr) {
      todayMinutes += r.durationMinutes
    }

    if (completedDate >= weekStart) {
      weekMinutes += r.durationMinutes
    }

    if (completedDate >= monthStart) {
      monthMinutes += r.durationMinutes
    }

    dailyMap[dateStr] = (dailyMap[dateStr] || 0) + r.durationMinutes

    const subject = r.taskTitle || '未分类'
    if (!subjectMap[subject]) {
      subjectMap[subject] = { minutes: 0, sessions: 0 }
    }
    subjectMap[subject].minutes += r.durationMinutes
    subjectMap[subject].sessions++
  }

  const dailyStats = Object.entries(dailyMap)
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const subjectStats = Object.entries(subjectMap)
    .map(([subject, stats]) => ({ subject, ...stats }))
    .sort((a, b) => b.minutes - a.minutes)

  return {
    todayMinutes,
    weekMinutes,
    monthMinutes,
    completedSessions,
    dailyStats,
    subjectStats,
  }
}

export interface TrendChartOptions {
  padding?: { top: number; right: number; bottom: number; left: number }
  ySteps?: number
  emptyFontSize?: string
  axisFontSize?: string
  labelFontSize?: string
  gradientOpacity?: number
  lineWidth?: number
  pointRadius?: number
  labelStepDenom?: number
}

const defaultOptions: Required<TrendChartOptions> = {
  padding: { top: 12, right: 12, bottom: 24, left: 32 },
  ySteps: 3,
  emptyFontSize: '11px',
  axisFontSize: '9px',
  labelFontSize: '9px',
  gradientOpacity: 0.15,
  lineWidth: 1.5,
  pointRadius: 2.5,
  labelStepDenom: 5,
}

export function drawTrendChart(
  canvas: HTMLCanvasElement,
  dailyStats: { date: string; minutes: number }[],
  options?: TrendChartOptions
) {
  const opts = { ...defaultOptions, ...options }
  const p = opts.padding

  let ctx: CanvasRenderingContext2D | null = null
  try {
    ctx = canvas.getContext('2d')
  } catch {
    return
  }
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const w = rect.width
  const h = rect.height
  const chartW = w - p.left - p.right
  const chartH = h - p.top - p.bottom

  ctx.clearRect(0, 0, w, h)

  if (dailyStats.length === 0) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = `${opts.emptyFontSize} system-ui`
    ctx.textAlign = 'center'
    ctx.fillText('暂无数据', w / 2, h / 2)
    return
  }

  const maxMinutes = Math.max(...dailyStats.map((d) => d.minutes), 1)
  const yMax = Math.ceil(maxMinutes / 30) * 30 || 30

  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  for (let i = 0; i <= opts.ySteps; i++) {
    const y = p.top + (chartH / opts.ySteps) * i
    ctx.beginPath()
    ctx.moveTo(p.left, y)
    ctx.lineTo(w - p.right, y)
    ctx.stroke()

    ctx.fillStyle = '#94a3b8'
    ctx.font = `${opts.axisFontSize} system-ui`
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.round(yMax - (yMax / opts.ySteps) * i)}m`, p.left - 4, y + 3)
  }

  const step = dailyStats.length > 1 ? chartW / (dailyStats.length - 1) : chartW / 2
  const points: { x: number; y: number }[] = dailyStats.map((d, i) => ({
    x: p.left + (dailyStats.length === 1 ? chartW / 2 : step * i),
    y: p.top + chartH - (d.minutes / yMax) * chartH,
  }))

  const gradient = ctx.createLinearGradient(0, p.top, 0, p.top + chartH)
  gradient.addColorStop(0, `rgba(99, 102, 241, ${opts.gradientOpacity})`)
  gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)')

  ctx.beginPath()
  ctx.moveTo(points[0].x, p.top + chartH)
  for (const pt of points) {
    ctx.lineTo(pt.x, pt.y)
  }
  ctx.lineTo(points[points.length - 1].x, p.top + chartH)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.beginPath()
  ctx.strokeStyle = '#6366f1'
  ctx.lineWidth = opts.lineWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  for (let i = 0; i < points.length; i++) {
    if (i === 0) ctx.moveTo(points[i].x, points[i].y)
    else ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()

  for (const pt of points) {
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, opts.pointRadius, 0, Math.PI * 2)
    ctx.fillStyle = '#6366f1'
    ctx.fill()
  }

  ctx.fillStyle = '#94a3b8'
  ctx.font = `${opts.labelFontSize} system-ui`
  ctx.textAlign = 'center'
  const labelStep = Math.max(1, Math.floor(dailyStats.length / opts.labelStepDenom))
  dailyStats.forEach((d, i) => {
    if (i % labelStep === 0 || i === dailyStats.length - 1) {
      const x = points[i].x
      const label = d.date.slice(5)
      ctx.fillText(label, x, h - 4)
    }
  })
}
