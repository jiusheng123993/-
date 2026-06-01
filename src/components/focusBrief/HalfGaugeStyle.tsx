import type { FocusBriefStyleProps } from './types'
import { ListTodo, Timer, CheckCircle2 } from 'lucide-react'

const W = 220
const H = 124
const STROKE = 14
const CX = W / 2
const CY = H - 10
const R = CX - STROKE - 4

function describeArc(startAngleDeg: number, endAngleDeg: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const sx = CX + R * Math.cos(toRad(startAngleDeg))
  const sy = CY + R * Math.sin(toRad(startAngleDeg))
  const ex = CX + R * Math.cos(toRad(endAngleDeg))
  const ey = CY + R * Math.sin(toRad(endAngleDeg))
  const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0
  return `M ${sx} ${sy} A ${R} ${R} 0 ${largeArc} 1 ${ex} ${ey}`
}

function stateLabel(progress: number) {
  if (progress >= 100) return '已达成 · 继续保持节奏'
  if (progress >= 70) return '接近达成 · 临门一脚'
  if (progress >= 40) return '稳步推进中'
  if (progress > 0) return '起步阶段 · 持续累积'
  return '尚未开启 · 选个任务开始'
}

export function HalfGaugeStyle({ data }: FocusBriefStyleProps) {
  const progress = Math.max(0, Math.min(100, data.progress))
  const startAngle = 180
  const endAngle = 360
  const totalDeg = endAngle - startAngle
  const seg1End = startAngle + totalDeg * 0.4
  const seg2End = startAngle + totalDeg * 0.7
  const pointerAngleDeg = startAngle + (totalDeg * progress) / 100
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const pointerX = CX + R * Math.cos(toRad(pointerAngleDeg))
  const pointerY = CY + R * Math.sin(toRad(pointerAngleDeg))

  return (
    <div className="focus-brief half-gauge">
      <div className="half-gauge-svg-wrap">
        <svg
          width={W}
          height={H + 6}
          viewBox={`0 0 ${W} ${H + 6}`}
          aria-hidden="true"
        >
          <path
            d={describeArc(startAngle, endAngle)}
            fill="none"
            stroke="var(--focus-brief-track)"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          <path
            d={describeArc(startAngle, seg1End)}
            fill="none"
            stroke="var(--focus-brief-gauge-low)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            opacity={progress >= 1 ? 1 : 0.35}
          />
          <path
            d={describeArc(seg1End, Math.min(seg2End, pointerAngleDeg))}
            fill="none"
            stroke="var(--focus-brief-gauge-mid)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            opacity={progress > 40 ? 1 : 0.25}
          />
          <path
            d={describeArc(seg2End, Math.max(seg2End, pointerAngleDeg))}
            fill="none"
            stroke="var(--focus-brief-gauge-high)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            opacity={progress > 70 ? 1 : 0.25}
          />
          <circle
            cx={pointerX}
            cy={pointerY}
            r={STROKE / 2 + 2}
            fill="var(--surface-strong)"
            stroke="var(--chart-plan, var(--primary))"
            strokeWidth={2.5}
          />
        </svg>
        <div className="half-gauge-center">
          <strong>{progress}%</strong>
          <span>{stateLabel(progress)}</span>
        </div>
      </div>
      <div className="focus-brief-stat-row tight">
        <div className="focus-brief-stat">
          <ListTodo size={14} aria-hidden="true" />
          <strong>{data.todoCount}</strong>
          <span>待办</span>
        </div>
        <div className="focus-brief-stat">
          <Timer size={14} aria-hidden="true" />
          <strong>{data.totalMinutes}</strong>
          <span>分钟</span>
        </div>
        <div className="focus-brief-stat">
          <CheckCircle2 size={14} aria-hidden="true" />
          <strong>{data.completedCount}</strong>
          <span>已完成</span>
        </div>
      </div>
    </div>
  )
}
