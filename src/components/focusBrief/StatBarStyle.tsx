import type { FocusBriefStyleProps } from './types'
import { ListTodo, Timer, CheckCircle2 } from 'lucide-react'

export function StatBarStyle({ data }: FocusBriefStyleProps) {
  const progress = Math.max(0, Math.min(100, data.progress))

  return (
    <div className="focus-brief stat-bar">
      <div className="stat-bar-head">
        <div className="stat-bar-percent">
          <strong>{progress}</strong>
          <em>%</em>
        </div>
        <span className="stat-bar-tag">本周完成</span>
      </div>
      <div
        className="stat-bar-track"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="stat-bar-fill" style={{ width: `${progress}%` }} />
        <span className="stat-bar-marker" style={{ left: `${progress}%` }} aria-hidden="true" />
      </div>
      <div className="stat-bar-grid">
        <article>
          <ListTodo size={16} aria-hidden="true" />
          <strong>{data.todoCount}</strong>
          <span>待办</span>
        </article>
        <article>
          <Timer size={16} aria-hidden="true" />
          <strong>{data.totalMinutes}</strong>
          <span>分钟</span>
        </article>
        <article>
          <CheckCircle2 size={16} aria-hidden="true" />
          <strong>{data.completedCount}</strong>
          <span>已完成</span>
        </article>
      </div>
    </div>
  )
}
