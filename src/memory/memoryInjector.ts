import type { MemoryEvent, MemoryFact, LegacyMemoryProfile } from './memoryTypes'

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
