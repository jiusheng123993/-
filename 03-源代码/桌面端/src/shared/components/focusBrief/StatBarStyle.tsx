import type { FocusBriefStyleProps } from './types'
import { ListTodo, Timer, CheckCircle2, TrendingUp, Target, Flame, Zap } from 'lucide-react'

function getMotivationalText(progress: number): string {
  if (progress >= 100) return '太棒了！全部完成 🎉'
  if (progress >= 70) return '马上完成了，继续加油！'
  if (progress >= 40) return '进度不错，保持节奏 💪'
  if (progress > 0) return '起步了就很棒，动起来！'
  return '选个任务开始吧'
}

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
