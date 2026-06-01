import type { FocusBriefStyleProps } from './types'
import { ListTodo, Timer, CheckCircle2, TrendingUp, Target, Flame, Zap } from 'lucide-react'

const SIZE = 180
const STROKE = 12
const RADIUS = (SIZE - STROKE) / 2
const CIRCUM = 2 * Math.PI * RADIUS

function getMotivationalText(progress: number): string {
  if (progress >= 100) return '太棒了！全部完成 🎉'
  if (progress >= 70) return '马上完成了，继续加油！'
  if (progress >= 40) return '进度不错，保持节奏 💪'
  if (progress > 0) return '起步了就很棒，动起来！'
  return '选个任务开始吧'
}

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
            const r = RADIUS + STROKE / 2 + 8
            const cx = SIZE / 2 + r * Math.cos(angle)
            const cy = SIZE / 2 + r * Math.sin(angle)
            return (
              <circle
                key={tick}
                cx={cx}
                cy={cy}
                r={2}
                fill="var(--focus-brief-tick)"
              />
            )
          })}
        </svg>
        <div className="minimal-arc-center">
          <strong>{progress}%</strong>
          <span>完成率</span>
        </div>
      </div>
      
      <div className="minimal-arc-motivation">
        <TrendingUp size={14} aria-hidden="true" />
        <span>{getMotivationalText(progress)}</span>
      </div>

      <div className="minimal-arc-stats-grid">
        <div className="minimal-arc-stat-item">
          <div className="minimal-arc-stat-icon"><Target size={18} /></div>
          <div className="minimal-arc-stat-content">
            <strong>{data.todoCount + data.completedCount}</strong>
            <span>总任务</span>
          </div>
        </div>
        <div className="minimal-arc-stat-item">
          <div className="minimal-arc-stat-icon"><Flame size={18} /></div>
          <div className="minimal-arc-stat-content">
            <strong>{data.completedCount}</strong>
            <span>已完成</span>
          </div>
        </div>
        <div className="minimal-arc-stat-item">
          <div className="minimal-arc-stat-icon"><Zap size={18} /></div>
          <div className="minimal-arc-stat-content">
            <strong>{data.totalMinutes}</strong>
            <span>分钟</span>
          </div>
        </div>
      </div>

      <div className="focus-brief-stat-row">
        <div className="focus-brief-stat">
          <ListTodo size={16} aria-hidden="true" />
          <strong>{data.todoCount}</strong>
          <span>待办</span>
        </div>
        <div className="focus-brief-stat">
          <Timer size={16} aria-hidden="true" />
          <strong>{data.totalMinutes}</strong>
          <span>分钟</span>
        </div>
        <div className="focus-brief-stat">
          <CheckCircle2 size={16} aria-hidden="true" />
          <strong>{data.completedCount}</strong>
          <span>已完成</span>
        </div>
      </div>
    </div>
  )
}
