import type { FocusBriefStyleProps } from './types'
import { ListTodo, Timer, CheckCircle2 } from 'lucide-react'

const SIZE = 148
const STROKE = 10
const RADIUS = (SIZE - STROKE) / 2
const CIRCUM = 2 * Math.PI * RADIUS

export function MinimalArcStyle({ data }: FocusBriefStyleProps) {
  const progress = Math.max(0, Math.min(100, data.progress))
  const dashOffset = CIRCUM * (1 - progress / 100)
  const ticks = [0, 25, 50, 75]

  return (
    <div className="focus-brief minimal-arc">
      <div className="minimal-arc-ring" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <defs>
            <linearGradient id="focusBriefArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--chart-plan, var(--primary))" />
              <stop offset="100%" stopColor="var(--chart-review, var(--accent))" />
            </linearGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--focus-brief-track)"
            strokeWidth={STROKE}
          />
          <circle
            className="minimal-arc-progress"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="url(#focusBriefArcGrad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUM}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
          {ticks.map((tick) => {
            const angle = (tick / 100) * 2 * Math.PI - Math.PI / 2
            const r = RADIUS + STROKE / 2 + 6
            const cx = SIZE / 2 + r * Math.cos(angle)
            const cy = SIZE / 2 + r * Math.sin(angle)
            return (
              <circle
                key={tick}
                cx={cx}
                cy={cy}
                r={1.6}
                fill="var(--focus-brief-tick)"
              />
            )
          })}
        </svg>
        <div className="minimal-arc-center">
          <strong>{progress}%</strong>
          <span>本周完成率</span>
        </div>
      </div>
      <div className="focus-brief-stat-row">
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
