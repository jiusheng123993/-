import type { MemoryAtom, MemoryLifecycle } from '../core/memoryBodyTypes'
import { scoreMemoryQuality } from '../quality/memoryQuality'

export interface ReflectionChange {
  atomId: string
  changeType: 'new' | 'strengthened' | 'weakened' | 'corrected' | 'archived' | 'conflict_resolved'
  before?: string
  after?: string
  description: string
}

export interface ReflectionConflict {
  atomIdA: string
  atomIdB: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface ReflectionInsight {
  type: 'pattern' | 'shift' | 'gap' | 'risk' | 'suggestion'
  description: string
  relatedAtomIds: string[]
  confidence: number
}

export interface ReflectionResult {
  changes: ReflectionChange[]
  conflicts: ReflectionConflict[]
  insights: ReflectionInsight[]
  summary: string
  confidence: number
  generatedAt: string
}

export interface ReflectionEngineInput {
  previousAtoms: MemoryAtom[]
  currentAtoms: MemoryAtom[]
  previousSnapshotAt?: string
}

function detectChanges(previous: MemoryAtom[], current: MemoryAtom[]): ReflectionChange[] {
  const changes: ReflectionChange[] = []
  const prevMap = new Map(previous.map(a => [a.id, a]))
  const currMap = new Map(current.map(a => [a.id, a]))

  for (const [id, currAtom] of currMap) {
    const prevAtom = prevMap.get(id)
    if (!prevAtom) {
      changes.push({
        atomId: id,
        changeType: 'new',
        description: `新增记忆：${currAtom.content}`
      })
      continue
    }

    if (prevAtom.lifecycle !== currAtom.lifecycle) {
      if (isStrengthened(prevAtom.lifecycle, currAtom.lifecycle)) {
        changes.push({
          atomId: id,
          changeType: 'strengthened',
          before: prevAtom.lifecycle,
          after: currAtom.lifecycle,
          description: `记忆强化：${prevAtom.lifecycle} → ${currAtom.lifecycle}（${currAtom.content}）`
        })
      } else if (isWeakened(prevAtom.lifecycle, currAtom.lifecycle)) {
        changes.push({
          atomId: id,
          changeType: 'weakened',
          before: prevAtom.lifecycle,
          after: currAtom.lifecycle,
          description: `记忆弱化：${prevAtom.lifecycle} → ${currAtom.lifecycle}（${currAtom.content}）`
        })
      } else if (currAtom.lifecycle === 'archived') {
        changes.push({
          atomId: id,
          changeType: 'archived',
          before: prevAtom.lifecycle,
          after: currAtom.lifecycle,
          description: `记忆归档：${currAtom.content}`
        })
      } else if (currAtom.lifecycle === 'contradicted') {
        changes.push({
          atomId: id,
          changeType: 'corrected',
          before: prevAtom.lifecycle,
          after: currAtom.lifecycle,
          description: `记忆被纠正：${currAtom.content}`
        })
      }
    }

    if (prevAtom.confidence !== currAtom.confidence) {
      const diff = currAtom.confidence - prevAtom.confidence
      if (Math.abs(diff) >= 0.1) {
        changes.push({
          atomId: id,
          changeType: diff > 0 ? 'strengthened' : 'weakened',
          before: prevAtom.confidence.toFixed(2),
          after: currAtom.confidence.toFixed(2),
          description: `置信度变化：${prevAtom.confidence.toFixed(2)} → ${currAtom.confidence.toFixed(2)}（${currAtom.content}）`
        })
      }
    }
  }

  for (const [id, prevAtom] of prevMap) {
    if (!currMap.has(id)) {
      changes.push({
        atomId: id,
        changeType: 'archived',
        description: `记忆已移除：${prevAtom.content}`
      })
    }
  }

  return changes
}

function isStrengthened(prev: MemoryLifecycle, curr: MemoryLifecycle): boolean {
  const order: MemoryLifecycle[] = ['draft', 'active', 'confirmed', 'stable', 'protected']
  const prevIdx = order.indexOf(prev)
  const currIdx = order.indexOf(curr)
  return prevIdx >= 0 && currIdx > prevIdx
}

function isWeakened(prev: MemoryLifecycle, curr: MemoryLifecycle): boolean {
  const order: MemoryLifecycle[] = ['draft', 'active', 'confirmed', 'stable', 'protected']
  const prevIdx = order.indexOf(prev)
  const currIdx = order.indexOf(curr)
  return prevIdx >= 0 && currIdx >= 0 && currIdx < prevIdx
}

function detectConflicts(atoms: MemoryAtom[]): ReflectionConflict[] {
  const conflicts: ReflectionConflict[] = []

  for (const atom of atoms) {
    for (const conflictId of atom.contradictionOf) {
      const conflictAtom = atoms.find(a => a.id === conflictId)
      if (conflictAtom) {
        const existingConflict = conflicts.find(
          c => (c.atomIdA === atom.id && c.atomIdB === conflictId) ||
               (c.atomIdA === conflictId && c.atomIdB === atom.id)
        )
        if (!existingConflict) {
          conflicts.push({
            atomIdA: atom.id,
            atomIdB: conflictId,
            description: `${atom.content} 与 ${conflictAtom.content} 存在冲突`,
            severity: atom.confidence > 0.7 && conflictAtom.confidence > 0.7 ? 'high' : 'medium'
          })
        }
      }
    }
  }

  return conflicts
}

function generateInsights(
  changes: ReflectionChange[],
  conflicts: ReflectionConflict[],
  atoms: MemoryAtom[]
): ReflectionInsight[] {
  const insights: ReflectionInsight[] = []

  const newCount = changes.filter(c => c.changeType === 'new').length
  const strengthenedCount = changes.filter(c => c.changeType === 'strengthened').length
  const weakenedCount = changes.filter(c => c.changeType === 'weakened').length
  const correctedCount = changes.filter(c => c.changeType === 'corrected').length

  if (newCount > 0) {
    insights.push({
      type: 'pattern',
      description: `新增 ${newCount} 条记忆，系统对用户的理解正在扩展`,
      relatedAtomIds: changes.filter(c => c.changeType === 'new').map(c => c.atomId),
      confidence: 0.8
    })
  }

  if (strengthenedCount > 0) {
    insights.push({
      type: 'pattern',
      description: `${strengthenedCount} 条记忆得到强化，用户偏好趋于稳定`,
      relatedAtomIds: changes.filter(c => c.changeType === 'strengthened').map(c => c.atomId),
      confidence: 0.75
    })
  }

  if (weakenedCount > 0) {
    insights.push({
      type: 'shift',
      description: `${weakenedCount} 条记忆正在弱化，用户偏好可能发生变化`,
      relatedAtomIds: changes.filter(c => c.changeType === 'weakened').map(c => c.atomId),
      confidence: 0.7
    })
  }

  if (correctedCount > 0) {
    insights.push({
      type: 'shift',
      description: `${correctedCount} 条记忆被纠正，系统之前的理解需要调整`,
      relatedAtomIds: changes.filter(c => c.changeType === 'corrected').map(c => c.atomId),
      confidence: 0.9
    })
  }

  if (conflicts.length > 0) {
    const highSeverityConflicts = conflicts.filter(c => c.severity === 'high')
    if (highSeverityConflicts.length > 0) {
      insights.push({
        type: 'risk',
        description: `存在 ${highSeverityConflicts.length} 个高严重性冲突，可能影响回答质量`,
        relatedAtomIds: highSeverityConflicts.flatMap(c => [c.atomIdA, c.atomIdB]),
        confidence: 0.85
      })
    }
  }

  const unconfirmedAtoms = atoms.filter(a =>
    a.lifecycle !== 'confirmed' && a.lifecycle !== 'stable' && a.lifecycle !== 'protected'
  )
  if (unconfirmedAtoms.length > 5) {
    insights.push({
      type: 'gap',
      description: `${unconfirmedAtoms.length} 条记忆尚未确认，建议用户审核`,
      relatedAtomIds: unconfirmedAtoms.slice(0, 10).map(a => a.id),
      confidence: 0.7
    })
  }

  const lowQualityAtoms = atoms.filter(a => {
    const quality = scoreMemoryQuality(a)
    return quality.overallScore < 0.3
  })
  if (lowQualityAtoms.length > 0) {
    insights.push({
      type: 'suggestion',
      description: `${lowQualityAtoms.length} 条记忆质量较低，建议清理或补充证据`,
      relatedAtomIds: lowQualityAtoms.map(a => a.id),
      confidence: 0.65
    })
  }

  return insights
}

function buildReflectionSummary(
  changes: ReflectionChange[],
  conflicts: ReflectionConflict[],
  insights: ReflectionInsight[]
): string {
  const parts: string[] = []

  const changeTypes = new Map<string, number>()
  for (const change of changes) {
    changeTypes.set(change.changeType, (changeTypes.get(change.changeType) ?? 0) + 1)
  }

  const changeDescriptions: string[] = []
  for (const [type, count] of changeTypes) {
    const labels: Record<string, string> = {
      new: `新增 ${count} 条`,
      strengthened: `强化 ${count} 条`,
      weakened: `弱化 ${count} 条`,
      corrected: `纠正 ${count} 条`,
      archived: `归档 ${count} 条`,
      conflict_resolved: `解决冲突 ${count} 条`
    }
    changeDescriptions.push(labels[type] ?? `${type} ${count} 条`)
  }

  if (changeDescriptions.length > 0) {
    parts.push(`本次反思发现：${changeDescriptions.join('，')}`)
  }

  if (conflicts.length > 0) {
    parts.push(`检测到 ${conflicts.length} 个记忆冲突`)
  }

  if (insights.length > 0) {
    const keyInsights = insights.slice(0, 3).map(i => i.description)
    parts.push(`关键洞察：${keyInsights.join('；')}`)
  }

  if (parts.length === 0) {
    return '本次反思未发现显著变化'
  }

  return parts.join('。')
}

export function reflectOnMemoryChanges(input: ReflectionEngineInput): ReflectionResult {
  const { previousAtoms, currentAtoms } = input

  const changes = detectChanges(previousAtoms, currentAtoms)
  const conflicts = detectConflicts(currentAtoms)
  const insights = generateInsights(changes, conflicts, currentAtoms)
  const summary = buildReflectionSummary(changes, conflicts, insights)

  const totalConfidence = insights.length > 0
    ? insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length
    : 0.5

  return {
    changes,
    conflicts,
    insights,
    summary,
    confidence: Math.round(totalConfidence * 100) / 100,
    generatedAt: new Date().toISOString()
  }
}

export interface SingleSessionReflectionInput {
  atoms: MemoryAtom[]
  sessionEvents: { type: string; description: string; timestamp: string }[]
}

export function reflectOnSession(input: SingleSessionReflectionInput): ReflectionResult {
  const { atoms, sessionEvents } = input

  const changes: ReflectionChange[] = []
  const eventTypes = new Set(sessionEvents.map(e => e.type))

  if (eventTypes.has('correction')) {
    const correctionEvents = sessionEvents.filter(e => e.type === 'correction')
    for (const event of correctionEvents) {
      changes.push({
        atomId: 'session',
        changeType: 'corrected',
        description: `用户纠正：${event.description}`
      })
    }
  }

  if (eventTypes.has('confirmation')) {
    const confirmationEvents = sessionEvents.filter(e => e.type === 'confirmation')
    for (const event of confirmationEvents) {
      changes.push({
        atomId: 'session',
        changeType: 'strengthened',
        description: `用户确认：${event.description}`
      })
    }
  }

  if (eventTypes.has('new_preference')) {
    const newPrefEvents = sessionEvents.filter(e => e.type === 'new_preference')
    for (const event of newPrefEvents) {
      changes.push({
        atomId: 'session',
        changeType: 'new',
        description: `新偏好：${event.description}`
      })
    }
  }

  const conflicts = detectConflicts(atoms)
  const insights = generateInsights(changes, conflicts, atoms)

  const summaryParts: string[] = []
  if (changes.length > 0) {
    summaryParts.push(`本次会话产生 ${changes.length} 项认知变化`)
  }
  if (conflicts.length > 0) {
    summaryParts.push(`检测到 ${conflicts.length} 个记忆冲突`)
  }
  if (summaryParts.length === 0) {
    summaryParts.push('本次会话未产生显著认知变化')
  }

  return {
    changes,
    conflicts,
    insights,
    summary: summaryParts.join('。'),
    confidence: insights.length > 0
      ? Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length * 100) / 100
      : 0.5,
    generatedAt: new Date().toISOString()
  }
}

export interface ReflectionSummaryOutput {
  totalChanges: number
  changeBreakdown: Record<string, number>
  totalConflicts: number
  highSeverityConflicts: number
  totalInsights: number
  insightTypes: Record<string, number>
  overallConfidence: number
  summary: string
}

export function summarizeReflection(result: ReflectionResult): ReflectionSummaryOutput {
  const changeBreakdown: Record<string, number> = {}
  for (const change of result.changes) {
    changeBreakdown[change.changeType] = (changeBreakdown[change.changeType] ?? 0) + 1
  }

  const insightTypes: Record<string, number> = {}
  for (const insight of result.insights) {
    insightTypes[insight.type] = (insightTypes[insight.type] ?? 0) + 1
  }

  return {
    totalChanges: result.changes.length,
    changeBreakdown,
    totalConflicts: result.conflicts.length,
    highSeverityConflicts: result.conflicts.filter(c => c.severity === 'high').length,
    totalInsights: result.insights.length,
    insightTypes,
    overallConfidence: result.confidence,
    summary: result.summary
  }
}
