import { View, Text } from '@tarojs/components'
import { useMemo } from 'react'
import type { ThemeSuiteTask, ModerationResult } from '../../types/wardrobeTypes'
import './ThemeSuiteProgress.scss'

interface ThemeSuiteProgressProps {
  task: ThemeSuiteTask | null
  isGenerating: boolean
  onRetry: () => void
  onViewResult: (task: ThemeSuiteTask) => void
  onDismiss: () => void
}

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  pending: { icon: '⏳', label: '排队中', color: 'warning' },
  processing: { icon: '🎨', label: '生成中', color: 'primary' },
  completed: { icon: '✅', label: '生成完成', color: 'success' },
  failed: { icon: '❌', label: '生成失败', color: 'danger' },
}

const MODERATION_LABELS: Record<ModerationResult, string> = {
  pass: '审核通过',
  review: '人工审核中',
  block: '内容未通过审核',
}

const PROGRESS_STEPS = [
  { key: 'submit', label: '提交' },
  { key: 'generate', label: '生成' },
  { key: 'moderate', label: '审核' },
  { key: 'complete', label: '完成' },
]

function getStepIndex(task: ThemeSuiteTask | null): number {
  if (!task) return -1
  switch (task.status) {
    case 'pending': return 0
    case 'processing': return 1
    case 'completed':
      if (task.moderationResult === 'block') return 2
      if (task.moderationResult === 'review') return 2
      return 3
    case 'failed': return 1
    default: return -1
  }
}

export default function ThemeSuiteProgress({
  task,
  isGenerating,
  onRetry,
  onViewResult,
  onDismiss,
}: ThemeSuiteProgressProps) {
  const statusConfig = useMemo(() => {
    if (!task) return null
    return STATUS_CONFIG[task.status] || STATUS_CONFIG.pending
  }, [task])

  const currentStep = useMemo(() => getStepIndex(task), [task])

  if (!task && !isGenerating) return null

  const displayTask = task || {
    id: '',
    userId: '',
    petId: '',
    suiteId: '',
    status: 'pending' as const,
    resultUrl: null,
    moderationResult: null,
    quotaConsumed: true,
    retryCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const config = statusConfig || STATUS_CONFIG.pending
  const isCompleted = displayTask.status === 'completed'
  const isFailed = displayTask.status === 'failed'
  const isBlocked = displayTask.moderationResult === 'block'
  const isUnderReview = displayTask.moderationResult === 'review'

  return (
    <View className='theme-progress'>
      <View className='theme-progress__header'>
        <View className='theme-progress__status'>
          <Text className={`theme-progress__status-icon theme-progress__status-icon--${config.color}`}>
            {config.icon}
          </Text>
          <Text className='theme-progress__status-label'>{config.label}</Text>
        </View>
        {isCompleted && !isBlocked && (
          <View className='theme-progress__close' onClick={onDismiss}>
            <Text className='theme-progress__close-icon'>✕</Text>
          </View>
        )}
      </View>

      <View className='theme-progress__steps'>
        {PROGRESS_STEPS.map((step, index) => {
          const isActive = index === currentStep
          const isDone = index < currentStep
          const isFailedStep = isFailed && index === 1
          const isBlockedStep = isBlocked && index === 2

          return (
            <View key={step.key} className='theme-progress__step'>
              <View
                className={`theme-progress__step-dot${
                  isDone ? ' theme-progress__step-dot--done' : ''
                }${
                  isActive ? ' theme-progress__step-dot--active' : ''
                }${
                  isFailedStep ? ' theme-progress__step-dot--failed' : ''
                }${
                  isBlockedStep ? ' theme-progress__step-dot--blocked' : ''
                }`}
              >
                {isDone && <Text className='theme-progress__step-check'>✓</Text>}
                {isFailedStep && <Text className='theme-progress__step-x'>✕</Text>}
                {isBlockedStep && <Text className='theme-progress__step-x'>✕</Text>}
                {isActive && !isFailedStep && !isBlockedStep && (
                  <View className='theme-progress__step-pulse' />
                )}
              </View>
              <Text
                className={`theme-progress__step-label${
                  isDone || isActive ? ' theme-progress__step-label--active' : ''
                }`}
              >
                {step.label}
              </Text>
              {index < PROGRESS_STEPS.length - 1 && (
                <View
                  className={`theme-progress__step-line${
                    isDone ? ' theme-progress__step-line--done' : ''
                  }${
                    isFailedStep || isBlockedStep ? ' theme-progress__step-line--failed' : ''
                  }`}
                />
              )}
            </View>
          )
        })}
      </View>

      {isUnderReview && (
        <View className='theme-progress__notice theme-progress__notice--warning'>
          <Text className='theme-progress__notice-icon'>⏳</Text>
          <Text className='theme-progress__notice-text'>
            内容正在人工审核中，预计1-2小时出结果
          </Text>
        </View>
      )}

      {isBlocked && (
        <View className='theme-progress__notice theme-progress__notice--danger'>
          <Text className='theme-progress__notice-icon'>⚠️</Text>
          <Text className='theme-progress__notice-text'>
            生成内容未通过审核，请更换主题重新生成
          </Text>
        </View>
      )}

      {isFailed && (
        <View className='theme-progress__notice theme-progress__notice--danger'>
          <Text className='theme-progress__notice-icon'>⚠️</Text>
          <Text className='theme-progress__notice-text'>
            生成失败，请重试或更换主题
          </Text>
        </View>
      )}

      <View className='theme-progress__actions'>
        {isFailed && (
          <View className='theme-progress__btn theme-progress__btn--primary' onClick={onRetry}>
            <Text className='theme-progress__btn-text'>重新生成</Text>
          </View>
        )}
        {isCompleted && !isBlocked && !isUnderReview && (
          <View
            className='theme-progress__btn theme-progress__btn--primary'
            onClick={() => onViewResult(displayTask)}
          >
            <Text className='theme-progress__btn-text'>查看结果</Text>
          </View>
        )}
        {(isFailed || isBlocked) && (
          <View className='theme-progress__btn theme-progress__btn--secondary' onClick={onDismiss}>
            <Text className='theme-progress__btn-text'>关闭</Text>
          </View>
        )}
      </View>
    </View>
  )
}
