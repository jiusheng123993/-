import type { MemoryEvent, MemoryFact, LegacyMemoryProfile, MemoryProfile } from './memoryTypes'

type PromptMode = 'chat' | 'silent_suggestion' | 'reflection'

type PromptTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

type PromptContext = {
  mode: PromptMode
  personaId?: string
  currentTask?: string
  timeOfDay?: PromptTimeOfDay
}

const maxRelevantEvents = 5

const normalizeText = (value: string) => value.trim().toLowerCase()

const tokenize = (query: string) => normalizeText(query).split(/\s+/).filter(Boolean)

const factLine = (fact: MemoryFact) => `- ${fact.content}`

const section = (title: string, lines: string[]) => (lines.length > 0 ? `${title}\n${lines.join('\n')}` : '')

const scoreEvent = (event: MemoryEvent, queryTokens: string[]) => {
  const searchableText = normalizeText([event.content, event.kind, event.source, ...event.tags].join(' '))
  const matchedTokens = queryTokens.filter((token) => searchableText.includes(token)).length
  return matchedTokens * 10 + event.confidence
}

export const buildMemoryEventContext = (events: MemoryEvent[], query: string): string => {
  const queryTokens = tokenize(query)
  const relevantEvents = events
    .filter((event) => event.status === 'active')
    .map((event) => ({ event, score: scoreEvent(event, queryTokens) }))
    .sort((left, right) => right.score - left.score || right.event.updatedAt.localeCompare(left.event.updatedAt))
    .slice(0, maxRelevantEvents)
    .map(({ event }) => `- ${event.content}`)

  return section('相关记忆事件', relevantEvents)
}

export const buildMemorySystemPromptExtension = (profile: LegacyMemoryProfile, events: MemoryEvent[], context: PromptContext): string => {
  const activeContents = new Set(events.filter((event) => event.status === 'active').map((event) => event.content))
  const formatFacts = (facts: MemoryFact[]) => facts.filter((fact) => activeContents.has(fact.content)).map(factLine)
  const contextLines = [
    `- 模式：${context.mode}`,
    context.personaId ? `- 当前 Persona：${context.personaId}` : '',
    context.currentTask ? `- 当前任务：${context.currentTask}` : '',
    context.timeOfDay ? `- 当前时段：${context.timeOfDay}` : ''
  ].filter(Boolean)
  const sections = [
    section('用户长期记忆', formatFacts(profile.staticFacts)),
    section('近期上下文', formatFacts(profile.dynamicContext)),
    section('用户限制与边界', formatFacts(profile.constraints)),
    section('注入上下文', contextLines)
  ].filter(Boolean)

  return sections.join('\n\n')
}

// ===== 新版 MemoryProfile 注入 =====

function formatProfileSection(title: string, entries: [string, string | number | undefined][]): string {
  const lines = entries
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `  - ${key}: ${value}`)
  return lines.length > 0 ? `${title}\n${lines.join('\n')}` : ''
}

function buildIdentitySection(profile: MemoryProfile): string {
  const { identity } = profile
  return formatProfileSection('身份', [
    ['昵称', identity.nickname],
    ['年龄段', identity.ageGroup],
    ['职业', identity.occupation],
    ['当前角色', identity.currentRole],
    ['组织', identity.organization],
    ['人生阶段', identity.lifeStage],
  ])
}

function buildPersonalitySection(profile: MemoryProfile): string {
  const { personality } = profile
  return formatProfileSection('性格', [
    ['MBTI 倾向', personality.mbtiTendency],
    ['工作风格', personality.workStyle],
    ['规划风格', personality.planningStyle],
    ['动机风格', personality.motivationStyle],
    ['反馈偏好', personality.feedbackStyle],
    ['压力反应', personality.stressResponse],
    ['自我描述', personality.selfDescription],
  ])
}

function buildRhythmSection(profile: MemoryProfile): string {
  const { rhythm } = profile
  return formatProfileSection('节奏', [
    ['精力高峰', rhythm.energyPeak],
    ['典型学习时长', rhythm.typicalStudyHours],
    ['睡眠模式', rhythm.sleepPattern],
    ['单次专注时长', rhythm.preferredSessionLength ? `${rhythm.preferredSessionLength}分钟` : undefined],
    ['休息偏好', rhythm.breakPreference],
    ['每周活跃天数', rhythm.weeklyActiveDays],
  ])
}

function buildGoalsSection(profile: MemoryProfile): string {
  const { goals } = profile
  const lines: string[] = []
  if (goals.primaryGoal) lines.push(`  - 主要目标: ${goals.primaryGoal}`)
  if (goals.secondaryGoals && goals.secondaryGoals.length > 0) {
    lines.push(`  - 次要目标: ${goals.secondaryGoals.join(', ')}`)
  }
  if (goals.targetExams && goals.targetExams.length > 0) {
    lines.push(`  - 目标考试: ${goals.targetExams.join(', ')}`)
  }
  if (goals.targetDate) lines.push(`  - 目标日期: ${goals.targetDate}`)
  if (goals.careerDirection) lines.push(`  - 职业方向: ${goals.careerDirection}`)
  return lines.length > 0 ? `目标\n${lines.join('\n')}` : ''
}

function buildPreferencesSection(profile: MemoryProfile): string {
  const { preferences } = profile
  return formatProfileSection('偏好', [
    ['鼓励风格', preferences.encouragementStyle],
    ['提醒频率', preferences.reminderFrequency],
    ['详细程度', preferences.detailLevel],
    ['语言风格', preferences.languageStyle],
  ])
}

function buildBoundariesSection(profile: MemoryProfile): string {
  const { boundaries } = profile
  const lines: string[] = []
  if (boundaries.tabooTopics && boundaries.tabooTopics.length > 0) {
    lines.push(`  - 禁忌话题: ${boundaries.tabooTopics.join(', ')}`)
  }
  if (boundaries.triggerWords && boundaries.triggerWords.length > 0) {
    lines.push(`  - 触发词: ${boundaries.triggerWords.join(', ')}`)
  }
  if (boundaries.dontMention && boundaries.dontMention.length > 0) {
    lines.push(`  - 避免提及: ${boundaries.dontMention.join(', ')}`)
  }
  if (boundaries.sensitiveAreas && boundaries.sensitiveAreas.length > 0) {
    lines.push(`  - 敏感区域: ${boundaries.sensitiveAreas.join(', ')}`)
  }
  return lines.length > 0 ? `边界\n${lines.join('\n')}` : ''
}

function buildLearningSection(profile: MemoryProfile): string {
  const { learning } = profile
  const lines: string[] = []
  if (learning.strongSubjects && learning.strongSubjects.length > 0) {
    lines.push(`  - 优势学科: ${learning.strongSubjects.join(', ')}`)
  }
  if (learning.weakSubjects && learning.weakSubjects.length > 0) {
    lines.push(`  - 薄弱学科: ${learning.weakSubjects.join(', ')}`)
  }
  if (learning.learningStyle) lines.push(`  - 学习风格: ${learning.learningStyle}`)
  if (learning.commonBlockers && learning.commonBlockers.length > 0) {
    lines.push(`  - 常见障碍: ${learning.commonBlockers.join(', ')}`)
  }
  if (learning.effectiveStrategies && learning.effectiveStrategies.length > 0) {
    lines.push(`  - 有效策略: ${learning.effectiveStrategies.join(', ')}`)
  }
  return lines.length > 0 ? `学习\n${lines.join('\n')}` : ''
}

function buildEmotionalSection(profile: MemoryProfile): string {
  const { emotional } = profile
  const lines: string[] = []
  if (emotional.currentMoodTrend) lines.push(`  - 情绪趋势: ${emotional.currentMoodTrend}`)
  if (emotional.motivationLevel) lines.push(`  - 动力水平: ${emotional.motivationLevel}`)
  if (emotional.supportNeeds && emotional.supportNeeds.length > 0) {
    lines.push(`  - 支持需求: ${emotional.supportNeeds.join(', ')}`)
  }
  if (emotional.recentWins && emotional.recentWins.length > 0) {
    lines.push(`  - 近期成就: ${emotional.recentWins.join(', ')}`)
  }
  return lines.length > 0 ? `情绪\n${lines.join('\n')}` : ''
}

export interface MemoryInjectorOptions {
  maxProfileTokens?: number
  maxEventTokens?: number
  includeEmptySections?: boolean
}

const defaultInjectorOptions: MemoryInjectorOptions = {
  maxProfileTokens: 400,
  maxEventTokens: 200,
  includeEmptySections: false,
}

export function buildMemoryProfilePrompt(
  profile: MemoryProfile,
  events: MemoryEvent[],
  context: PromptContext,
  options: MemoryInjectorOptions = {}
): string {
  const opts = { ...defaultInjectorOptions, ...options }

  const sections = [
    buildIdentitySection(profile),
    buildPersonalitySection(profile),
    buildRhythmSection(profile),
    buildGoalsSection(profile),
    buildPreferencesSection(profile),
    buildBoundariesSection(profile),
    buildLearningSection(profile),
    buildEmotionalSection(profile),
  ].filter(Boolean)

  const profileText = sections.join('\n\n')

  const eventContext = buildMemoryEventContext(events, context.currentTask ?? '')
  const trimmedEventContext = eventContext.length > (opts.maxEventTokens ?? 200) * 4
    ? eventContext.slice(0, (opts.maxEventTokens ?? 200) * 4) + '\n...'
    : eventContext

  const contextLines = [
    `- 模式：${context.mode}`,
    context.personaId ? `- 当前 Persona：${context.personaId}` : '',
    context.currentTask ? `- 当前任务：${context.currentTask}` : '',
    context.timeOfDay ? `- 当前时段：${context.timeOfDay}` : '',
  ].filter(Boolean)

  const parts = [
    '=== 用户画像 ===',
    profileText || '（画像信息待补充）',
    '',
    '=== 相关记忆 ===',
    trimmedEventContext || '（暂无相关记忆）',
    '',
    '=== 注入上下文 ===',
    contextLines.join('\n') || '（无额外上下文）',
  ]

  return parts.join('\n')
}

export function buildSilentSuggestionPrompt(
  profile: MemoryProfile,
  events: MemoryEvent[],
  context: { currentPage: string; currentTask?: string; timeOfDay: string }
): string {
  const profileSummary = [
    profile.identity.nickname ? `用户昵称：${profile.identity.nickname}` : '',
    profile.rhythm.energyPeak ? `精力高峰：${profile.rhythm.energyPeak}` : '',
    profile.emotional.motivationLevel ? `当前动力：${profile.emotional.motivationLevel}` : '',
    profile.goals.primaryGoal ? `主要目标：${profile.goals.primaryGoal}` : '',
  ].filter(Boolean).join('\n')

  const recentEvents = events
    .filter((e) => e.status === 'active')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)
    .map((e) => `- ${e.content}`)
    .join('\n')

  return [
    '=== 静默建议生成 ===',
    '',
    '用户画像摘要：',
    profileSummary || '（暂无画像信息）',
    '',
    '近期事件：',
    recentEvents || '（暂无近期事件）',
    '',
    '当前上下文：',
    `- 页面：${context.currentPage}`,
    context.currentTask ? `- 当前任务：${context.currentTask}` : '',
    `- 时段：${context.timeOfDay}`,
    '',
    '请生成一条简短、温暖、不打扰用户的建议（50字以内）。',
  ].filter(Boolean).join('\n')
}

export function buildReflectionPrompt(
  profile: MemoryProfile,
  events: MemoryEvent[]
): string {
  const profileSnapshot = [
    profile.identity.nickname ? `昵称: ${profile.identity.nickname}` : '',
    profile.personality.mbtiTendency ? `MBTI: ${profile.personality.mbtiTendency}` : '',
    profile.rhythm.sleepPattern ? `睡眠: ${profile.rhythm.sleepPattern}` : '',
    profile.emotional.motivationLevel ? `动力: ${profile.emotional.motivationLevel}` : '',
    profile.goals.primaryGoal ? `目标: ${profile.goals.primaryGoal}` : '',
  ].filter(Boolean).join('\n')

  const eventSummary = events
    .filter((e) => e.status === 'active')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10)
    .map((e) => `- [${e.kind}] ${e.content}`)
    .join('\n')

  return [
    '=== 反思引擎 ===',
    '',
    '当前画像快照：',
    profileSnapshot || '（画像待建立）',
    '',
    '近期事件（最近10条）：',
    eventSummary || '（暂无事件）',
    '',
    '请分析以上事件对画像的潜在影响，输出结构化的变更提案。',
    '每个提案需包含：字段路径、旧值、新值、推理依据、置信度。',
  ].filter(Boolean).join('\n')
}
