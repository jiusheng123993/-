import { useState } from 'react'
import { relationshipService } from './relationshipService'
import type { SpaceActivity, SpaceMember } from './relationshipTypes'

type SharedTaskBoardProps = {
  spaceId: string
  userId: string
  members: SpaceMember[]
  activities: SpaceActivity[]
  onRefresh: () => void
  mode?: 'tasks' | 'habits'
}

export function SharedTaskBoard({ spaceId, userId, members, activities, onRefresh, mode = 'tasks' }: SharedTaskBoardProps) {
  const [taskTitle, setTaskTitle] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [habitName, setHabitName] = useState('')
  const [habitId, setHabitId] = useState('')

  const otherMembers = members.filter(m => m.userId !== userId)

  const pushedTasks = activities.filter(a =>
    mode === 'tasks'
      ? ['task_push', 'task_accept', 'task_reject', 'task_complete'].includes(a.type)
      : a.type === 'habit_check'
  )

  const handlePushTask = () => {
    if (!taskTitle.trim() || !targetUserId) return
    relationshipService.pushTask(spaceId, userId, targetUserId, `task_${Date.now()}`, taskTitle.trim())
    setTaskTitle('')
    setTargetUserId('')
    onRefresh()
  }

  const handleAcceptTask = (activityId: string) => {
    relationshipService.acceptTask(spaceId, userId, activityId)
    onRefresh()
  }

  const handleRejectTask = (activityId: string) => {
    relationshipService.rejectTask(spaceId, userId, activityId)
    onRefresh()
  }

  const handleCompleteTask = (taskId: string) => {
    relationshipService.completeSharedTask(spaceId, userId, taskId)
    onRefresh()
  }

  const handleCheckHabit = () => {
    if (!habitName.trim()) return
    relationshipService.checkHabit(spaceId, userId, habitId || `habit_${Date.now()}`, habitName.trim())
    setHabitName('')
    setHabitId('')
    onRefresh()
  }

  if (mode === 'habits') {
    return (
      <div className="shared-task-board">
        <h3>共享习惯</h3>
        <div className="habit-input">
          <input
            type="text"
            value={habitName}
            onChange={e => setHabitName(e.target.value)}
            placeholder="习惯名称"
          />
          <button className="btn-primary" onClick={handleCheckHabit}>
            打卡
          </button>
        </div>
        <div className="activity-list">
          {pushedTasks.slice(-20).reverse().map(activity => (
            <div key={activity.id} className="activity-item">
              <span className="activity-icon">✅</span>
              <span className="activity-text">
                {activity.payload.habitName as string || '习惯打卡'}
              </span>
              <span className="activity-time">
                {new Date(activity.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="shared-task-board">
      <h3>共享任务</h3>

      <div className="task-push-form">
        <input
          type="text"
          value={taskTitle}
          onChange={e => setTaskTitle(e.target.value)}
          placeholder="任务标题"
        />
        <select value={targetUserId} onChange={e => setTargetUserId(e.target.value)}>
          <option value="">选择推送对象</option>
          {otherMembers.map(m => (
            <option key={m.userId} value={m.userId}>
              {m.nickname || m.userId}
            </option>
          ))}
        </select>
        <button
          className="btn-primary"
          onClick={handlePushTask}
          disabled={!taskTitle.trim() || !targetUserId}
        >
          推送任务
        </button>
      </div>

      <div className="activity-list">
        {pushedTasks.slice(-20).reverse().map(activity => (
          <div key={activity.id} className={`activity-item type-${activity.type}`}>
            <span className="activity-icon">
              {activity.type === 'task_push' && '📤'}
              {activity.type === 'task_accept' && '✅'}
              {activity.type === 'task_reject' && '❌'}
              {activity.type === 'task_complete' && '🎉'}
            </span>
            <span className="activity-text">
              {activity.type === 'task_push' && (
                <>
                  推送了任务「{activity.payload.taskTitle as string}」
                  {activity.targetId === userId && (
                    <>
                      <button className="btn-small" onClick={() => handleAcceptTask(activity.id)}>接受</button>
                      <button className="btn-small danger" onClick={() => handleRejectTask(activity.id)}>拒绝</button>
                    </>
                  )}
                </>
              )}
              {activity.type === 'task_accept' && '接受了任务'}
              {activity.type === 'task_reject' && '拒绝了任务'}
              {activity.type === 'task_complete' && (
                <>
                  完成了任务
                  <button className="btn-small" onClick={() => handleCompleteTask(activity.targetId || '')}>
                    确认
                  </button>
                </>
              )}
            </span>
            <span className="activity-time">
              {new Date(activity.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
