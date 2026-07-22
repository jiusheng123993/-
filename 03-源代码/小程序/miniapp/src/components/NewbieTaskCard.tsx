import { View, Text } from '@tarojs/components'
import { useState, useEffect, useMemo } from 'react'
import Taro from '@tarojs/taro'
import './NewbieTaskCard.scss'

interface NewbieTask {
  key: string
  icon: string
  title: string
  completed: boolean
}

interface NewbieTaskCardProps {
  hasPet: boolean
  hasCheckin: boolean
  hasFoodQuery: boolean
  onComplete: () => void
}

const STORAGE_KEY = 'xhh_newbie_tasks'

function loadTaskStates(): Record<string, boolean> {
  const raw = Taro.getStorageSync(STORAGE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw as string) as Record<string, boolean>
  } catch {
    return {}
  }
}

function saveTaskStates(states: Record<string, boolean>): void {
  Taro.setStorageSync(STORAGE_KEY, JSON.stringify(states))
}

export default function NewbieTaskCard({ hasPet, hasCheckin, hasFoodQuery, onComplete }: NewbieTaskCardProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    return Taro.getStorageSync('xhh_newbie_tasks_completed') || false
  })

  const tasks: NewbieTask[] = useMemo(() => [
    { key: 'add_pet', icon: '🐾', title: '添加宠物', completed: hasPet },
    { key: 'first_checkin', icon: '📋', title: '完成首次打卡', completed: hasCheckin },
    { key: 'food_query', icon: '🍖', title: '查询一次食物', completed: hasFoodQuery },
  ], [hasPet, hasCheckin, hasFoodQuery])

  const completedCount = tasks.filter(t => t.completed).length
  const allCompleted = completedCount === tasks.length

  useEffect(() => {
    if (!allCompleted) return
    const states = loadTaskStates()
    if (states._allCompleted) return
    states._allCompleted = true
    saveTaskStates(states)
    setShowCelebration(true)
    const timer = setTimeout(() => {
      setShowCelebration(false)
      setDismissed(true)
      Taro.setStorageSync('xhh_newbie_tasks_completed', true)
      onComplete()
    }, 3000)
    return () => clearTimeout(timer)
  }, [allCompleted, onComplete])

  if (dismissed) return null

  const progressPercent = (completedCount / tasks.length) * 100

  return (
    <View className={`newbie-task-card ${showCelebration ? 'newbie-task-card--celebrating' : ''}`}>
      {showCelebration && (
        <View className='newbie-task-card__celebration'>
          <Text className='newbie-task-card__celebration-emoji'>🎉</Text>
          <Text className='newbie-task-card__celebration-text'>太棒了！新手任务全部完成！</Text>
        </View>
      )}

      {!showCelebration && (
        <>
          <View className='newbie-task-card__header'>
            <Text className='newbie-task-card__title'>新手任务</Text>
            <Text className='newbie-task-card__progress-text'>{completedCount}/{tasks.length}</Text>
          </View>

          <View className='newbie-task-card__progress-bar'>
            <View className='newbie-task-card__progress-fill' style={{ width: `${progressPercent}%` }} />
          </View>

          <View className='newbie-task-card__tasks'>
            {tasks.map(task => (
              <View key={task.key} className={`newbie-task-card__task ${task.completed ? 'newbie-task-card__task--completed' : ''}`}>
                <View className='newbie-task-card__task-icon'>
                  <Text className='newbie-task-card__task-emoji'>{task.icon}</Text>
                </View>
                <Text className='newbie-task-card__task-title'>{task.title}</Text>
                <View className='newbie-task-card__task-status'>
                  <Text className='newbie-task-card__task-status-text'>
                    {task.completed ? '✅' : '○'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}
