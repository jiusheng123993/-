
import type { AvatarDefinition } from './avatarTypes'
import { getEvolutionProgress } from './evolutionEngine'

type AvatarEvolutionPanelProps = {
  avatar: AvatarDefinition
}

export function AvatarEvolutionPanel({ avatar }: AvatarEvolutionPanelProps) {
  const progress = getEvolutionProgress(avatar)

  const triggerLabels: Record<string, string> = {
    focus_minutes: '专注时长',
    tasks_completed: '完成任务',
    streak_days: '连续打卡',
    special_event: '特殊事件'
  }

  const rewardTypeLabels: Record<string, string> = {
    decoration: '装饰',
    effect: '特效',
    animation: '动画'
  }

  return (
    <div className="evolution-panel">
      <h4>进化进度</h4>

      <div className="evolution-level">
        <span className="level-badge">Lv.{avatar.evolution.level}</span>
        <div className="level-stats">
          <span>⏰ {avatar.evolution.totalFocusMinutes}分钟</span>
          <span>✅ {avatar.evolution.totalTasksCompleted}任务</span>
          <span>🔥 {avatar.evolution.streakDays}天</span>
        </div>
      </div>

      <div className="unlocked-assets">
        {avatar.evolution.unlockedDecorations.length > 0 && (
          <div className="asset-group">
            <span className="asset-type">装饰</span>
            <div className="asset-list">
              {avatar.evolution.unlockedDecorations.map(id => (
                <span key={id} className="asset-badge decoration">{id}</span>
              ))}
            </div>
          </div>
        )}
        {avatar.evolution.unlockedEffects.length > 0 && (
          <div className="asset-group">
            <span className="asset-type">特效</span>
            <div className="asset-list">
              {avatar.evolution.unlockedEffects.map(id => (
                <span key={id} className="asset-badge effect">{id}</span>
              ))}
            </div>
          </div>
        )}
        {avatar.evolution.unlockedAnimations.length > 0 && (
          <div className="asset-group">
            <span className="asset-type">动画</span>
            <div className="asset-list">
              {avatar.evolution.unlockedAnimations.map(id => (
                <span key={id} className="asset-badge animation">{id}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="evolution-progress-list">
        <h5>进化路线</h5>
        {progress.map(({ rule, current, target, percentage, unlocked }) => (
          <div key={rule.id} className={`evolution-item ${unlocked ? 'unlocked' : ''}`}>
            <div className="evolution-info">
              <span className="evolution-reward">
                {rewardTypeLabels[rule.reward.type]} · {rule.reward.name}
              </span>
              <span className="evolution-trigger">
                {triggerLabels[rule.trigger.type]} {current}/{target}
              </span>
            </div>
            <div className="evolution-bar">
              <div
                className="evolution-bar-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="evolution-percentage">{percentage}%</span>
            {unlocked && <span className="evolution-check">✅</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
