import type { MemoryEvent, MemoryProfile } from './memoryTypes'
import type { SummarizeRequest, SummarizeResult, ProfileChangeProposal } from '../agent/evolution/reflectionEngineTypes'

export interface MemorySummarizer {
  summarize(request: SummarizeRequest): Promise<SummarizeResult>
}

interface SummarizeOptions {
  minConfidence: number
  maxProposals: number
}

const defaultOptions: SummarizeOptions = {
  minConfidence: 0.6,
  maxProposals: 5,
}

function analyzeEmotionalChanges(
  events: MemoryEvent[],
  profile: MemoryProfile
): ProfileChangeProposal[] {
  const proposals: ProfileChangeProposal[] = []

  const stressEvents = events.filter(
    (e) => e.tags.includes('stress') || e.tags.includes('schedule_anomaly')
  )
  const winEvents = events.filter((e) => e.tags.includes('milestone') || e.tags.includes('goal_completed'))
  const lowFocusEvents = events.filter((e) => e.tags.includes('low_focus'))

  if (stressEvents.length >= 3 && profile.emotional.motivationLevel !== 'low') {
    proposals.push({
      fieldPath: 'emotional.motivationLevel',
      oldValue: profile.emotional.motivationLevel ?? 'medium',
      newValue: 'low',
      reasoning: `检测到连续 ${stressEvents.length} 次压力/异常作息事件，建议下调动力等级`,
      evidenceEventIds: stressEvents.slice(0, 3).map((e) => e.id),
      confidence: Math.min(0.9, 0.6 + stressEvents.length * 0.05),
    })
  }

  if (winEvents.length >= 2 && profile.emotional.motivationLevel !== 'high') {
    proposals.push({
      fieldPath: 'emotional.motivationLevel',
      oldValue: profile.emotional.motivationLevel ?? 'medium',
      newValue: 'high',
      reasoning: `检测到 ${winEvents.length} 次目标达成/里程碑事件，建议提升动力等级`,
      evidenceEventIds: winEvents.slice(0, 3).map((e) => e.id),
      confidence: Math.min(0.9, 0.65 + winEvents.length * 0.05),
    })
  }

  if (lowFocusEvents.length >= 3 && profile.emotional.motivationLevel !== 'burnout_risk') {
    proposals.push({
      fieldPath: 'emotional.motivationLevel',
      oldValue: profile.emotional.motivationLevel ?? 'medium',
      newValue: 'burnout_risk',
      reasoning: `检测到连续 ${lowFocusEvents.length} 次低专注事件，存在倦怠风险`,
      evidenceEventIds: lowFocusEvents.slice(0, 3).map((e) => e.id),
      confidence: Math.min(0.85, 0.55 + lowFocusEvents.length * 0.05),
    })
  }

  return proposals
}

function analyzeRhythmChanges(
  events: MemoryEvent[],
  profile: MemoryProfile
): ProfileChangeProposal[] {
  const proposals: ProfileChangeProposal[] = []

  const nightEvents = events.filter((e) => {
    const hour = new Date(e.createdAt).getUTCHours()
    return hour >= 0 && hour < 6
  })

  if (nightEvents.length >= 3 && profile.rhythm.sleepPattern !== 'night_owl') {
    proposals.push({
      fieldPath: 'rhythm.sleepPattern',
      oldValue: profile.rhythm.sleepPattern ?? 'stable',
      newValue: 'night_owl',
      reasoning: `检测到 ${nightEvents.length} 次凌晨活动记录，建议更新睡眠模式`,
      evidenceEventIds: nightEvents.slice(0, 3).map((e) => e.id),
      confidence: Math.min(0.85, 0.6 + nightEvents.length * 0.05),
    })
  }

  const morningEvents = events.filter((e) => {
    const hour = new Date(e.createdAt).getUTCHours()
    return hour >= 5 && hour < 9
  })

  if (morningEvents.length >= 5 && profile.rhythm.energyPeak !== 'morning') {
    proposals.push({
      fieldPath: 'rhythm.energyPeak',
      oldValue: profile.rhythm.energyPeak ?? 'flexible',
      newValue: 'morning',
      reasoning: `检测到 ${morningEvents.length} 次早间活动记录，建议更新精力高峰`,
      evidenceEventIds: morningEvents.slice(0, 3).map((e) => e.id),
      confidence: Math.min(0.85, 0.65 + morningEvents.length * 0.03),
    })
  }

  return proposals
}

function analyzeGoalChanges(
  events: MemoryEvent[],
  profile: MemoryProfile
): ProfileChangeProposal[] {
  const proposals: ProfileChangeProposal[] = []

  const goalEvents = events.filter(
    (e) => e.tags.includes('goal_change') || e.tags.includes('goal_completed')
  )

  if (goalEvents.length > 0) {
    const latestGoal = goalEvents[goalEvents.length - 1]
    if (latestGoal && profile.goals.primaryGoal !== latestGoal.content) {
      proposals.push({
        fieldPath: 'goals.primaryGoal',
        oldValue: profile.goals.primaryGoal ?? '',
        newValue: latestGoal.content,
        reasoning: `基于最新目标变更事件更新主目标`,
        evidenceEventIds: [latestGoal.id],
        confidence: 0.75,
      })
    }
  }

  return proposals
}

function analyzeLearningChanges(
  events: MemoryEvent[],
  profile: MemoryProfile
): ProfileChangeProposal[] {
  const proposals: ProfileChangeProposal[] = []

  const subjectEvents = events.filter((e) => e.tags.includes('subject_strong') || e.tags.includes('subject_weak'))

  const strongSubjects = subjectEvents
    .filter((e) => e.tags.includes('subject_strong'))
    .map((e) => e.content)

  const weakSubjects = subjectEvents
    .filter((e) => e.tags.includes('subject_weak'))
    .map((e) => e.content)

  if (strongSubjects.length > 0) {
    const currentStrong = profile.learning.strongSubjects ?? []
    const newStrong = [...new Set([...currentStrong, ...strongSubjects])]
    if (newStrong.length > currentStrong.length) {
      proposals.push({
        fieldPath: 'learning.strongSubjects',
        oldValue: currentStrong,
        newValue: newStrong,
        reasoning: `基于 ${strongSubjects.length} 次优势学科事件更新强项列表`,
        evidenceEventIds: subjectEvents.filter((e) => e.tags.includes('subject_strong')).map((e) => e.id),
        confidence: 0.7,
      })
    }
  }

  if (weakSubjects.length > 0) {
    const currentWeak = profile.learning.weakSubjects ?? []
    const newWeak = [...new Set([...currentWeak, ...weakSubjects])]
    if (newWeak.length > currentWeak.length) {
      proposals.push({
        fieldPath: 'learning.weakSubjects',
        oldValue: currentWeak,
        newValue: newWeak,
        reasoning: `基于 ${weakSubjects.length} 次薄弱学科事件更新弱项列表`,
        evidenceEventIds: subjectEvents.filter((e) => e.tags.includes('subject_weak')).map((e) => e.id),
        confidence: 0.7,
      })
    }
  }

  return proposals
}

function analyzePreferenceChanges(
  events: MemoryEvent[],
  profile: MemoryProfile
): ProfileChangeProposal[] {
  const proposals: ProfileChangeProposal[] = []

  const taskEvents = events.filter(e => e.category === 'task_completed')
  const focusEvents = events.filter(e => e.category === 'focus_completed')
  const journalEvents = events.filter(e => e.category === 'journal_created')
  const preferenceEvents = events.filter(e => e.category === 'preference_learned' || e.kind === 'preference')

  if (taskEvents.length >= 10 && profile.preferences.planningStyle !== 'structured') {
    proposals.push({
      fieldPath: 'preferences.planningStyle',
      oldValue: profile.preferences.planningStyle ?? 'flexible',
      newValue: 'structured',
      reasoning: `近期完成了 ${taskEvents.length} 个任务，表现出结构化规划倾向`,
      evidenceEventIds: taskEvents.slice(0, 3).map(e => e.id),
      confidence: 0.65
    })
  }

  if (focusEvents.length >= 5 && profile.preferences.workStyle !== 'deep_work') {
    proposals.push({
      fieldPath: 'preferences.workStyle',
      oldValue: profile.preferences.workStyle ?? 'flexible',
      newValue: 'deep_work',
      reasoning: `近期完成了 ${focusEvents.length} 次深度专注，表现出深度工作偏好`,
      evidenceEventIds: focusEvents.slice(0, 3).map(e => e.id),
      confidence: 0.7
    })
  }

  if (journalEvents.length >= 3 && profile.preferences.reflectionFrequency !== 'daily') {
    proposals.push({
      fieldPath: 'preferences.reflectionFrequency',
      oldValue: profile.preferences.reflectionFrequency ?? 'weekly',
      newValue: 'daily',
      reasoning: `近期创建了 ${journalEvents.length} 篇日记，表现出每日反思习惯`,
      evidenceEventIds: journalEvents.slice(0, 3).map(e => e.id),
      confidence: 0.65
    })
  }

  if (preferenceEvents.length > 0) {
    const existingCustom = profile.preferences.customPreferences ?? {}
    const newCustom: Record<string, string> = { ...existingCustom }
    let hasNewCustom = false

    for (const event of preferenceEvents) {
      const content = event.summary || event.content || ''
      const match = content.match(/用户偏好：customPreferences\.(\w+)=(.+?)。/)
      if (match) {
        const key = match[1]
        const value = match[2]
        if (!existingCustom[key] || existingCustom[key] !== value) {
          newCustom[key] = value
          hasNewCustom = true
        }
      }
    }

    if (hasNewCustom) {
      proposals.push({
        fieldPath: 'preferences.customPreferences',
        oldValue: existingCustom,
        newValue: newCustom,
        reasoning: `从 ${preferenceEvents.length} 次对话中提取了用户自定义偏好`,
        evidenceEventIds: preferenceEvents.slice(0, 5).map(e => e.id),
        confidence: 0.75
      })
    }
  }

  return proposals
}

function analyzePersonalityTraits(
  events: MemoryEvent[],
  profile: MemoryProfile
): ProfileChangeProposal[] {
  const proposals: ProfileChangeProposal[] = []

  const taskEvents = events.filter(e => e.category === 'task_completed')
  const focusEvents = events.filter(e => e.category === 'focus_completed')
  const goalEvents = events.filter(e => e.category === 'goal_updated')

  const currentTraits = profile.personality.traits || []

  if (taskEvents.length >= 8 && !currentTraits.includes('执行力强')) {
    proposals.push({
      fieldPath: 'personality.traits',
      oldValue: currentTraits,
      newValue: [...currentTraits, '执行力强'],
      reasoning: `近期完成了 ${taskEvents.length} 个任务，表现出较强的执行力`,
      evidenceEventIds: taskEvents.slice(0, 3).map(e => e.id),
      confidence: 0.7
    })
  }

  if (focusEvents.length >= 5 && !currentTraits.includes('专注力强')) {
    proposals.push({
      fieldPath: 'personality.traits',
      oldValue: currentTraits,
      newValue: [...currentTraits, '专注力强'],
      reasoning: `近期完成了 ${focusEvents.length} 次深度专注`,
      evidenceEventIds: focusEvents.slice(0, 3).map(e => e.id),
      confidence: 0.7
    })
  }

  if (goalEvents.length >= 3 && !currentTraits.includes('目标导向')) {
    proposals.push({
      fieldPath: 'personality.traits',
      oldValue: currentTraits,
      newValue: [...currentTraits, '目标导向'],
      reasoning: `近期更新了 ${goalEvents.length} 次目标，表现出目标导向特质`,
      evidenceEventIds: goalEvents.slice(0, 3).map(e => e.id),
      confidence: 0.65
    })
  }

  return proposals
}

function generateReflectionNote(
  events: MemoryEvent[],
  proposals: ProfileChangeProposal[]
): string {
  const eventCount = events.length
  const categories = [...new Set(events.map((e) => e.kind))]
  const highConfidenceProposals = proposals.filter((p) => p.confidence >= 0.7)

  const parts = [
    `分析了最近 ${eventCount} 条记忆事件，涉及 ${categories.length} 个类别。`,
  ]

  if (highConfidenceProposals.length > 0) {
    parts.push(`发现 ${highConfidenceProposals.length} 条高置信度画像变更建议。`)
  }

  if (proposals.length > highConfidenceProposals.length) {
    parts.push(`另有 ${proposals.length - highConfidenceProposals.length} 条建议待进一步验证。`)
  }

  const stressCount = events.filter((e) => e.tags.includes('stress')).length
  if (stressCount >= 3) {
    parts.push(`检测到 ${stressCount} 次压力相关事件，建议关注身心健康。`)
  }

  const winCount = events.filter((e) => e.tags.includes('milestone') || e.tags.includes('goal_completed')).length
  if (winCount > 0) {
    parts.push(`恭喜！最近达成 ${winCount} 个里程碑/目标。`)
  }

  return parts.join('')
}

export function createMemorySummarizer(options: Partial<SummarizeOptions> = {}): MemorySummarizer {
  const opts = { ...defaultOptions, ...options }

  return {
    async summarize(request: SummarizeRequest): Promise<SummarizeResult> {
      const { events, currentProfile } = request

      if (events.length === 0) {
        return {
          proposedChanges: [],
          reflectionNote: '暂无足够事件进行画像归纳。',
          confidence: 0,
        }
      }

      const sortedEvents = [...events].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      const recentEvents = sortedEvents.slice(0, 50)

      const emotionalProposals = analyzeEmotionalChanges(recentEvents, currentProfile)
      const rhythmProposals = analyzeRhythmChanges(recentEvents, currentProfile)
      const goalProposals = analyzeGoalChanges(recentEvents, currentProfile)
      const learningProposals = analyzeLearningChanges(recentEvents, currentProfile)
      const preferenceProposals = analyzePreferenceChanges(recentEvents, currentProfile)
      const personalityProposals = analyzePersonalityTraits(recentEvents, currentProfile)

      const allProposals = [...emotionalProposals, ...rhythmProposals, ...goalProposals, ...learningProposals, ...preferenceProposals, ...personalityProposals]

      const filteredProposals = allProposals
        .filter((p) => p.confidence >= opts.minConfidence)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, opts.maxProposals)

      const avgConfidence =
        filteredProposals.length > 0
          ? filteredProposals.reduce((sum, p) => sum + p.confidence, 0) / filteredProposals.length
          : 0

      const reflectionNote = generateReflectionNote(recentEvents, filteredProposals)

      return {
        proposedChanges: filteredProposals,
        reflectionNote,
        confidence: avgConfidence,
      }
    },
  }
}

export const memorySummarizer = createMemorySummarizer()
