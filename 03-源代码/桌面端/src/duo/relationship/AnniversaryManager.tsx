import { useState } from 'react'
import { relationshipService } from './relationshipService'
import type { Anniversary, SharedGoal } from './relationshipTypes'

type AnniversaryManagerProps = {
  spaceId: string
  userId: string
  anniversaries: Anniversary[]
  sharedGoals: SharedGoal[]
  onRefresh: () => void
}

export function AnniversaryManager({ spaceId, userId, anniversaries, sharedGoals, onRefresh }: AnniversaryManagerProps) {
  const [showAddAnniversary, setShowAddAnniversary] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [annName, setAnnName] = useState('')
  const [annDate, setAnnDate] = useState('')
  const [annRepeat, setAnnRepeat] = useState<'yearly' | 'monthly' | 'once'>('yearly')
  const [annRemindDays, setAnnRemindDays] = useState(3)
  const [goalName, setGoalName] = useState('')
  const [goalDate, setGoalDate] = useState('')

  const canUseAnniversary = relationshipService.canUseFeature(userId, 'anniversary')

  const handleAddAnniversary = () => {
    if (!annName.trim() || !annDate) return
    relationshipService.addAnniversary(spaceId, userId, annName.trim(), annDate, annRepeat, annRemindDays)
    setAnnName('')
    setAnnDate('')
    setShowAddAnniversary(false)
    onRefresh()
  }

  const handleAddGoal = () => {
    if (!goalName.trim() || !goalDate) return
    relationshipService.addSharedGoal(spaceId, userId, goalName.trim(), goalDate, [userId])
    setGoalName('')
    setGoalDate('')
    setShowAddGoal(false)
    onRefresh()
  }

  const handleUpdateGoalProgress = (goalId: string, progress: number) => {
    relationshipService.updateGoalProgress(spaceId, userId, goalId, progress)
    onRefresh()
  }

  const repeatLabels: Record<string, string> = {
    yearly: '每年',
    monthly: '每月',
    once: '仅一次'
  }

  const daysUntil = (dateStr: string, repeat: string): number => {
    const now = new Date()
    const target = new Date(dateStr)
    if (repeat === 'yearly') {
      const thisYear = new Date(now.getFullYear(), target.getMonth(), target.getDate())
      if (thisYear < now) {
        thisYear.setFullYear(now.getFullYear() + 1)
      }
      return Math.ceil((thisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }
    if (repeat === 'monthly') {
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), target.getDate())
      if (thisMonth < now) {
        thisMonth.setMonth(thisMonth.getMonth() + 1)
      }
      return Math.ceil((thisMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="anniversary-manager">
      <div className="section-header">
        <h3>纪念日</h3>
        {canUseAnniversary && (
          <button className="btn-small" onClick={() => setShowAddAnniversary(!showAddAnniversary)}>
            + 添加
          </button>
        )}
      </div>

      {showAddAnniversary && (
        <div className="add-form">
          <input
            type="text"
            value={annName}
            onChange={e => setAnnName(e.target.value)}
            placeholder="纪念日名称"
          />
          <input
            type="date"
            value={annDate}
            onChange={e => setAnnDate(e.target.value)}
          />
          <select value={annRepeat} onChange={e => setAnnRepeat(e.target.value as 'yearly' | 'monthly' | 'once')}>
            <option value="yearly">每年</option>
            <option value="monthly">每月</option>
            <option value="once">仅一次</option>
          </select>
          <div className="form-group">
            <label>提前提醒天数</label>
            <input
              type="number"
              value={annRemindDays}
              onChange={e => setAnnRemindDays(Number(e.target.value))}
              min={0}
              max={30}
            />
          </div>
          <button className="btn-primary" onClick={handleAddAnniversary}>保存</button>
        </div>
      )}

      {anniversaries.length === 0 ? (
        <p className="empty-text">暂无纪念日</p>
      ) : (
        <div className="anniversary-list">
          {anniversaries
            .sort((a, b) => daysUntil(a.date, a.repeat) - daysUntil(b.date, b.repeat))
            .map(ann => {
              const days = daysUntil(ann.date, ann.repeat)
              return (
                <div key={ann.id} className="anniversary-item">
                  <div className="anniversary-icon">
                    {days <= ann.remindDays ? '🔔' : '💝'}
                  </div>
                  <div className="anniversary-info">
                    <span className="anniversary-name">{ann.name}</span>
                    <span className="anniversary-date">{ann.date}</span>
                    <span className="anniversary-repeat">{repeatLabels[ann.repeat]}</span>
                  </div>
                  <div className="anniversary-countdown">
                    {days <= 0 ? '今天！' : `${days}天后`}
                  </div>
                </div>
              )
            })}
        </div>
      )}

      <div className="section-header" style={{ marginTop: '1.5rem' }}>
        <h3>共同目标</h3>
        <button className="btn-small" onClick={() => setShowAddGoal(!showAddGoal)}>
          + 添加
        </button>
      </div>

      {showAddGoal && (
        <div className="add-form">
          <input
            type="text"
            value={goalName}
            onChange={e => setGoalName(e.target.value)}
            placeholder="目标名称"
          />
          <input
            type="date"
            value={goalDate}
            onChange={e => setGoalDate(e.target.value)}
          />
          <button className="btn-primary" onClick={handleAddGoal}>保存</button>
        </div>
      )}

      {sharedGoals.length === 0 ? (
        <p className="empty-text">暂无共同目标</p>
      ) : (
        <div className="goal-list">
          {sharedGoals.map(goal => (
            <div key={goal.id} className="goal-item">
              <div className="goal-info">
                <span className="goal-name">{goal.name}</span>
                <span className="goal-date">目标日期: {goal.targetDate}</span>
              </div>
              <div className="goal-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <span className="progress-text">{goal.progress}%</span>
              </div>
              <div className="goal-actions">
                <button
                  className="btn-small"
                  onClick={() => handleUpdateGoalProgress(goal.id, Math.min(100, goal.progress + 10))}
                >
                  +10%
                </button>
                {goal.progress < 100 && (
                  <button
                    className="btn-small primary"
                    onClick={() => handleUpdateGoalProgress(goal.id, 100)}
                  >
                    完成
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
