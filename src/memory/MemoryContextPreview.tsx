import { useMemo } from 'react'
import type { MemoryProfile, MemoryEvent } from './memoryTypes'
import { buildMemorySystemPromptExtension } from './memoryInjector'
import { buildMemoryEventContext } from './memoryInjector'

export interface MemoryContextPreviewProps {
  profile: MemoryProfile
  events: MemoryEvent[]
  mode?: 'chat' | 'silent_suggestion' | 'reflection'
  personaId?: string
  currentTask?: string
}

export function MemoryContextPreview({
  profile,
  events,
  mode = 'chat',
  personaId,
  currentTask
}: MemoryContextPreviewProps) {
  const context = useMemo(() => {
    const legacyProfile = {
      identity: {
        mbti: profile.identity.mbti,
        ageGroup: profile.identity.ageGroup,
        workStyle: profile.identity.workStyle,
        nickname: profile.identity.nickname,
        occupation: profile.identity.occupation || ''
      },
      personality: {
        traits: profile.personality.traits,
        motivationStyle: profile.personality.motivationStyle,
        feedbackStyle: profile.personality.feedbackStyle,
        stressResponse: profile.personality.stressResponse
      },
      rhythm: {
        energyPeak: profile.rhythm.energyPeak,
        sleepPattern: profile.rhythm.sleepPattern,
        breakPreference: profile.rhythm.breakPreference
      },
      goals: {
        shortTerm: profile.goals.shortTerm,
        longTerm: profile.goals.longTerm,
        milestones: profile.goals.milestones
      },
      preferences: {
        encouragementStyle: profile.preferences.encouragementStyle,
        reminderFrequency: profile.preferences.reminderFrequency,
        detailLevel: profile.preferences.detailLevel,
        languageStyle: profile.preferences.languageStyle
      },
      boundaries: {
        maxFocusMinutes: profile.boundaries.maxFocusMinutes,
        maxDailyTasks: profile.boundaries.maxDailyTasks,
        avoidTopics: profile.boundaries.avoidTopics
      },
      learning: {
        style: profile.learning.style,
        currentFocus: profile.learning.currentFocus,
        completedCourses: profile.learning.completedCourses
      },
      emotional: {
        moodTrend: profile.emotional.moodTrend,
        motivationLevel: profile.emotional.motivationLevel,
        lastCheckIn: profile.emotional.lastCheckIn
      }
    }

    const promptContext = {
      mode,
      personaId,
      currentTask,
      timeOfDay: getTimeOfDay()
    }

    const systemPrompt = buildMemorySystemPromptExtension(legacyProfile, events, promptContext)
    const eventContext = buildMemoryEventContext(events, currentTask || '')

    return { systemPrompt, eventContext }
  }, [profile, events, mode, personaId, currentTask])

  const activeEventCount = events.filter(e => e.status === 'active').length

  return (
    <div className="memory-context-preview" style={{
      padding: '12px',
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      fontSize: '13px',
      maxHeight: '200px',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          记忆上下文
        </span>
        <span style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          background: 'var(--bg-tertiary)',
          padding: '2px 8px',
          borderRadius: '10px'
        }}>
          {activeEventCount} 个活跃事件
        </span>
      </div>

      {context.systemPrompt || context.eventContext ? (
        <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {context.systemPrompt && (
            <div style={{ marginBottom: context.eventContext ? '8px' : 0 }}>
              <strong style={{ color: 'var(--text-primary)' }}>画像信息：</strong>
              {context.systemPrompt.split('\n').slice(0, 5).join('\n')}
              {context.systemPrompt.split('\n').length > 5 && '\n...'}
            </div>
          )}
          {context.eventContext && (
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>记忆事件：</strong>
              {context.eventContext}
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          暂无记忆数据，请先在「记忆画像」中完善你的信息
        </div>
      )}
    </div>
  )
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}
