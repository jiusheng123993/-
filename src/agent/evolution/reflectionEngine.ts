import type { MemoryEvent, MemoryProfile } from '../../memory/memoryTypes'
import type {
  ReflectionEngine,
  ReflectionTrigger,
  EventThreshold,
  EventThresholdCategory,
  SummarizeResult,
  ProfileChangeProposal,
  ReflectionTriggerType,
} from './reflectionEngineTypes'
import { EvolutionEntry } from './evolutionRitualTypes'

const DEFAULT_TRIGGERS: ReflectionTrigger[] = [
  {
    type: 'cron',
    cronSchedule: '0 21 * * 0',
    eventThresholds: [],
  },
  {
    type: 'event_threshold',
    eventThresholds: [
      {
        category: 'schedule_anomaly',
        count: 3,
        windowDays: 7,
        description: '凌晨2点后仍在记录',
      },
      {
        category: 'goal_completed',
        count: 1,
        windowDays: 30,
        description: '目标达成',
      },
      {
        category: 'no_reflection',
        count: 1,
        windowDays: 7,
        description: '连续7天无复盘',
      },
      {
        category: 'low_focus',
        count: 5,
        windowDays: 7,
        description: '连续5天专注时长低于目标的50%',
      },
      {
        category: 'exam_countdown',
        count: 1,
        windowDays: 1,
        description: '考试倒计时归零',
      },
    ],
  },
]

function isSundayAt21(date: Date): boolean {
  const day = date.getUTCDay()
  const hour = date.getUTCHours()
  return day === 0 && hour === 21
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr)
}

function isWithinWindow(eventDate: Date, now: Date, windowDays: number): boolean {
  const diffMs = now.getTime() - eventDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= windowDays
}

function countEventsByCategory(
  events: MemoryEvent[],
  category: EventThresholdCategory,
  now: Date,
  windowDays: number
): number {
  return events.filter((event) => {
    const eventDate = parseDate(event.createdAt)
    return isWithinWindow(eventDate, now, windowDays) && event.tags.includes(category)
  }).length
}

function checkScheduleAnomaly(events: MemoryEvent[], now: Date, threshold: EventThreshold): boolean {
  const recentEvents = events.filter((event) => {
    if (!isWithinWindow(parseDate(event.createdAt), now, threshold.windowDays)) return false
    if (!event.tags.includes('schedule_anomaly')) return false
    const hour = parseDate(event.createdAt).getUTCHours()
    return hour >= 2 && hour < 6
  })
  return recentEvents.length >= threshold.count
}

function checkGoalCompleted(events: MemoryEvent[], now: Date, threshold: EventThreshold): boolean {
  return countEventsByCategory(events, 'goal_completed', now, threshold.windowDays) >= threshold.count
}

function checkNoReflection(lastReflectionAt: string, now: Date, threshold: EventThreshold): boolean {
  const lastReflectionDate = parseDate(lastReflectionAt)
  const diffMs = now.getTime() - lastReflectionDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays >= threshold.windowDays
}

function checkLowFocus(events: MemoryEvent[], now: Date, threshold: EventThreshold): boolean {
  const recentLowFocusEvents = events.filter((event) => {
    if (!isWithinWindow(parseDate(event.createdAt), now, threshold.windowDays)) return false
    return event.tags.includes('low_focus')
  })
  return recentLowFocusEvents.length >= threshold.count
}

function checkExamCountdown(events: MemoryEvent[], now: Date, threshold: EventThreshold): boolean {
  return countEventsByCategory(events, 'exam_countdown', now, threshold.windowDays) >= threshold.count
}

function checkEventThresholds(
  events: MemoryEvent[],
  lastReflectionAt: string,
  now: Date,
  thresholds: EventThreshold[]
): boolean {
  for (const threshold of thresholds) {
    switch (threshold.category) {
      case 'schedule_anomaly':
        if (checkScheduleAnomaly(events, now, threshold)) return true
        break
      case 'goal_completed':
        if (checkGoalCompleted(events, now, threshold)) return true
        break
      case 'no_reflection':
        if (checkNoReflection(lastReflectionAt, now, threshold)) return true
        break
      case 'low_focus':
        if (checkLowFocus(events, now, threshold)) return true
        break
      case 'exam_countdown':
        if (checkExamCountdown(events, now, threshold)) return true
        break
    }
  }
  return false
}

function shouldTriggerImpl(
  events: MemoryEvent[],
  lastReflectionAt: string,
  now: string,
  hasEntryThisWeek?: boolean
): boolean {
  const nowDate = parseDate(now)

  for (const trigger of DEFAULT_TRIGGERS) {
    if (trigger.type === 'cron' && trigger.cronSchedule) {
      if (hasEntryThisWeek) continue
      if (isSundayAt21(nowDate)) return true
    }

    if (trigger.type === 'event_threshold' && trigger.eventThresholds.length > 0) {
      if (checkEventThresholds(events, lastReflectionAt, nowDate, trigger.eventThresholds)) {
        return true
      }
    }
  }

  return false
}

function buildReflectionPrompt(profile: MemoryProfile, events: MemoryEvent[]): string {
  const nickname = profile.identity.nickname || '用户'
  const primaryGoal = profile.goals.primaryGoal || '未设定'
  const planningStyle = profile.personality.planningStyle || '未设定'
  const workRhythm = profile.personality.workRhythm || '未设定'
  const motivationLevel = profile.emotional.motivationLevel || 'medium'

  const recentEvents = events.slice(-20)
  const eventLines = recentEvents.map(e => {
    const time = new Date(e.timestamp).toLocaleDateString('zh-CN')
    return `- [${time}] ${e.category}: ${e.summary}`
  }).join('\n')

  return `你是一个个人成长工作台的反思引擎。请基于以下用户画像和近期活动记录，进行深度反思分析。

用户画像：
- 昵称：${nickname}
- 主要目标：${primaryGoal}
- 规划风格：${planningStyle}
- 工作节奏：${workRhythm}
- 当前动力水平：${motivationLevel}

近期活动记录：
${eventLines || '暂无活动记录'}

请分析并输出以下内容（JSON格式）：
{
  "reflectionNote": "一段200字以内的反思总结，包含对用户近期状态的整体观察、进步点和需要关注的地方",
  "proposedChanges": [
    {
      "fieldPath": "字段路径（如 emotional.motivationLevel, personality.planningStyle, goals.primaryGoal 等）",
      "oldValue": "当前值",
      "newValue": "建议的新值",
      "reasoning": "修改理由，基于具体事件证据",
      "confidence": 0.0-1.0 之间的置信度
    }
  ]
}

要求：
1. reflectionNote 要具体、有洞察，引用具体事件
2. proposedChanges 只提出真正有依据的修改建议，confidence 低于 0.6 的不要提出
3. 最多提出 3 条修改建议
4. 只输出 JSON，不要有其他内容`
}

function parseReflectionResponse(responseText: string): SummarizeResult {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    const parsed = JSON.parse(jsonMatch[0])
    
    const proposedChanges: ProfileChangeProposal[] = (parsed.proposedChanges || [])
      .filter((p: ProfileChangeProposal) => p.confidence >= 0.6)
      .map((p: ProfileChangeProposal) => ({
        fieldPath: p.fieldPath,
        oldValue: p.oldValue,
        newValue: p.newValue,
        reasoning: p.reasoning,
        evidenceEventIds: [],
        confidence: p.confidence
      }))

    return {
      proposedChanges,
      reflectionNote: parsed.reflectionNote || '反思完成',
      confidence: proposedChanges.length > 0 
        ? proposedChanges.reduce((sum: number, p: ProfileChangeProposal) => sum + p.confidence, 0) / proposedChanges.length
        : 0.5
    }
  } catch {
    return {
      proposedChanges: [],
      reflectionNote: 'AI 反思分析暂时不可用，请稍后重试。',
      confidence: 0
    }
  }
}

async function callAiForReflection(prompt: string): Promise<string> {
  const providerId = 'deepseek'
  const apiKey = localStorage.getItem('deepseek_api_key') || ''
  
  if (!apiKey) {
    throw new Error('AI API key not configured')
  }

  const isDev = import.meta.env.DEV
  const endpoint = isDev ? '/api/deepseek' : 'https://api.deepseek.com/v1/chat/completions'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个个人成长工作台的反思引擎。你只输出 JSON 格式的分析结果。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })
  })

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`)
  }

  const data = await response.json()
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content
  }

  throw new Error('Empty response from AI')
}

async function executeReflectionImpl(
  profile: MemoryProfile,
  events: MemoryEvent[]
): Promise<SummarizeResult> {
  try {
    const prompt = buildReflectionPrompt(profile, events)
    const aiResponse = await callAiForReflection(prompt)
    return parseReflectionResponse(aiResponse)
  } catch (error) {
    console.error('AI reflection failed, using rule-based fallback:', error)
    
    const recentEvents = events.slice(-20)
    const proposedChanges: ProfileChangeProposal[] = []

    const completedTasks = recentEvents.filter(e => e.category === 'task_completed').length
    const focusSessions = recentEvents.filter(e => e.category === 'focus_completed').length
    const goalUpdates = recentEvents.filter(e => e.category === 'goal_updated').length

    if (completedTasks >= 5) {
      proposedChanges.push({
        fieldPath: 'emotional.motivationLevel',
        oldValue: profile.emotional.motivationLevel ?? 'medium',
        newValue: 'high',
        reasoning: `近期完成了 ${completedTasks} 个任务，表现出良好的执行力`,
        evidenceEventIds: recentEvents.filter(e => e.category === 'task_completed').slice(0, 3).map(e => e.id),
        confidence: 0.7
      })
    }

    if (focusSessions >= 3) {
      proposedChanges.push({
        fieldPath: 'rhythm.energyPeak',
        oldValue: profile.rhythm.energyPeak ?? 'unknown',
        newValue: 'morning',
        reasoning: `近期完成了 ${focusSessions} 次专注会话，专注力表现良好`,
        evidenceEventIds: recentEvents.filter(e => e.category === 'focus_completed').slice(0, 3).map(e => e.id),
        confidence: 0.65
      })
    }

    if (goalUpdates === 0 && recentEvents.length > 10) {
      proposedChanges.push({
        fieldPath: 'goals.primaryGoal',
        oldValue: profile.goals.primaryGoal ?? '',
        newValue: profile.goals.primaryGoal ?? '',
        reasoning: '近期没有目标更新，建议重新审视当前目标是否仍然符合方向',
        evidenceEventIds: [],
        confidence: 0.6
      })
    }

    const reflectionNote = completedTasks > 0 || focusSessions > 0
      ? `近期完成了 ${completedTasks} 个任务和 ${focusSessions} 次专注会话。${goalUpdates === 0 ? '建议重新审视目标方向。' : '继续保持良好的节奏！'}`
      : '近期活动较少，建议增加学习和专注的频率。'

    return {
      proposedChanges: proposedChanges.filter(p => p.confidence >= 0.6),
      reflectionNote,
      confidence: proposedChanges.length > 0 ? 0.65 : 0.5
    }
  }
}

function getDefaultTriggersImpl(): ReflectionTrigger[] {
  return DEFAULT_TRIGGERS
}

function createEntryImpl(
  triggerType: ReflectionTriggerType,
  triggerDetail: string,
  events: MemoryEvent[],
  userId: string
): EvolutionEntry {
  const now = new Date().toISOString()

  return {
    id: `evo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    userId,
    triggeredBy: triggerType,
    triggerDetail,
    proposedChanges: [],
    userDecision: 'pending',
    finalChanges: [],
    reflectionNote: '',
    createdAt: now
  }
}

export const reflectionEngine: ReflectionEngine = {
  shouldTrigger: shouldTriggerImpl,
  executeReflection: executeReflectionImpl,
  getDefaultTriggers: getDefaultTriggersImpl,
  createEntry: createEntryImpl,
}

export { isSundayAt21, checkEventThresholds, countEventsByCategory }
