import { isActiveMemoryAtom, isForbiddenMemoryAtom } from '../core/memoryBodyGuards'
import type { MemoryAtom, MemoryScenario, MemoryScope } from '../core/memoryBodyTypes'

export interface MemoryRetrievalInput {
  atoms: MemoryAtom[]
  scope: MemoryScope
  query?: string
  scenarios?: MemoryScenario[]
  maxItems?: number
  minRelevanceScore?: number
}

function sameScope(atom: MemoryAtom, scope: MemoryScope): boolean {
  return atom.scope.userId === scope.userId && atom.scope.projectId === scope.projectId
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase()
}

function tokenize(text: string): string[] {
  const normalized = normalizeText(text)
  const asciiTokens = normalized.match(/[a-z0-9_]+/g) ?? []
  const cjkTokens = Array.from(normalized.matchAll(/[\u4e00-\u9fff]{1,4}/g)).map(match => match[0])
  return Array.from(new Set([...asciiTokens, ...cjkTokens].filter(token => token.length > 0)))
}

function scenarioScore(atom: MemoryAtom, scenarios: MemoryScenario[]): number {
  if (scenarios.length === 0) return 0
  const atomScenarios = atom.scenarios ?? []
  return scenarios.some(scenario => atomScenarios.includes(scenario)) ? 2 : 0
}

function queryScore(atom: MemoryAtom, query: string): number {
  const tokens = tokenize(query)
  if (tokens.length === 0) return 0
  const haystack = normalizeText([
    atom.content,
    atom.subject,
    atom.predicate,
    atom.object,
    atom.type,
    atom.layer,
    ...atom.tags,
    ...(atom.scenarios ?? [])
  ].join(' '))
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0)
}

function memoryQualityScore(atom: MemoryAtom): number {
  return atom.confidence + atom.strength + Math.max(0, atom.emotionalWeight)
}

function relevanceScore(atom: MemoryAtom, input: MemoryRetrievalInput): number {
  return queryScore(atom, input.query ?? '') + scenarioScore(atom, input.scenarios ?? [])
}

function compareByRelevance(input: MemoryRetrievalInput): (left: MemoryAtom, right: MemoryAtom) => number {
  const query = input.query ?? ''
  const scenarios = input.scenarios ?? []

  return (left, right) => {
    const leftQueryScore = queryScore(left, query)
    const rightQueryScore = queryScore(right, query)
    if (leftQueryScore !== rightQueryScore) return rightQueryScore - leftQueryScore

    const leftScenarioScore = scenarioScore(left, scenarios)
    const rightScenarioScore = scenarioScore(right, scenarios)
    if (leftScenarioScore !== rightScenarioScore) return rightScenarioScore - leftScenarioScore

    const leftQualityScore = memoryQualityScore(left)
    const rightQualityScore = memoryQualityScore(right)
    if (leftQualityScore !== rightQualityScore) return rightQualityScore - leftQualityScore

    return right.updatedAt.localeCompare(left.updatedAt)
  }
}

export function retrieveRelevantMemories(input: MemoryRetrievalInput): MemoryAtom[] {
  const maxItems = input.maxItems ?? 12
  const minRelevanceScore = input.minRelevanceScore ?? 0
  return input.atoms
    .filter(atom => sameScope(atom, input.scope))
    .filter(atom => isActiveMemoryAtom(atom) && !isForbiddenMemoryAtom(atom))
    .filter(atom => relevanceScore(atom, input) >= minRelevanceScore)
    .sort(compareByRelevance(input))
    .slice(0, maxItems)
}
