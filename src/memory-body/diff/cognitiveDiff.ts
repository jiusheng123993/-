import type { MemoryAtom, MemoryLifecycle } from '../core/memoryBodyTypes'
import type { CognitiveSnapshot, CognitiveDiff as SnapshotDiff } from '../timeMachine/cognitiveTimeMachine'
import type { ReflectionResult } from '../reflection/reflectionEngine'

/**
 * 认知差异视图 — 设计文档 8.3 CognitiveDiff
 *
 * 每次会话或任务结束后可生成认知差异：
 * 1. 新增理解
 * 2. 强化理解
 * 3. 降低置信
 * 4. 归档理解
 * 5. 需要确认
 * 6. 触发信任修复的事件
 */

export type CognitiveChangeType =
  | 'new_understanding'
  | 'strengthened_understanding'
  | 'weakened_confidence'
  | 'archived_understanding'
  | 'needs_confirmation'
  | 'trust_repair_triggered'

export interface CognitiveChange {
  type: CognitiveChangeType
  atomId: string
  atomContent: string
  atomType: string
  previousLifecycle?: MemoryLifecycle
  currentLifecycle: MemoryLifecycle
  previousConfidence?: number
  currentConfidence: number
  description: string
  severity: 'info' | 'notice' | 'important' | 'critical'
}

export interface CognitiveDiffSummary {
  sessionLabel: string
  generatedAt: string
  changes: CognitiveChange[]
  counts: Record<CognitiveChangeType, number>
  totalChanges: number
  highlights: string[]
  needsUserAttention: boolean
  attentionItems: string[]
}

export interface CognitiveDiffInput {
  previousSnapshot: CognitiveSnapshot
  currentSnapshot: CognitiveSnapshot
  sessionLabel?: string
  reflectionResult?: ReflectionResult
}

const LIFECYCLE_ORDER: Record<MemoryLifecycle, number> = {
  draft: 0,
  active: 1,
  weakening: 2,
  contradicted: 3,
  archived: 4,
  confirmed: 5,
  stable: 6,
  protected: 7,
  forbidden: 8
}

function isStrengthened(oldLc: MemoryLifecycle, newLc: MemoryLifecycle): boolean {
  return (LIFECYCLE_ORDER[newLc] ?? 0) > (LIFECYCLE_ORDER[oldLc] ?? 0)
}

function determineSeverity(
  type: CognitiveChangeType,
  confidenceDelta: number
): CognitiveChange['severity'] {
  if (type === 'trust_repair_triggered') return 'critical'
  if (type === 'needs_confirmation') return 'important'
  if (type === 'new_understanding') return 'notice'
  if (type === 'strengthened_understanding') return 'info'
  if (type === 'weakened_confidence' && Math.abs(confidenceDelta) > 0.3) return 'important'
  if (type === 'weakened_confidence') return 'notice'
  if (type === 'archived_understanding') return 'info'
  return 'info'
}

function buildDescription(
  type: CognitiveChangeType,
  atom: MemoryAtom,
  prevConfidence?: number
): string {
  switch (type) {
    case 'new_understanding':
      return `新增理解：${atom.content}`
    case 'strengthened_understanding':
      return `强化理解：${atom.content}（置信度 ${prevConfidence?.toFixed(2) ?? '?'} → ${atom.confidence.toFixed(2)}）`
    case 'weakened_confidence':
      return `降低置信：${atom.content}（置信度 ${prevConfidence?.toFixed(2) ?? '?'} → ${atom.confidence.toFixed(2)}）`
    case 'archived_understanding':
      return `归档理解：${atom.content}`
    case 'needs_confirmation':
      return `需要确认：${atom.content}（当前置信度 ${atom.confidence.toFixed(2)}）`
    case 'trust_repair_triggered':
      return `触发信任修复：${atom.content}`
  }
}

/**
 * 生成认知差异视图
 *
 * 对比两个快照，生成面向用户的认知变化摘要。
 * 与 compareSnapshots 不同，本函数提供语义级别的分类和解释。
 */
export function generateCognitiveDiff(input: CognitiveDiffInput): CognitiveDiffSummary {
  const { previousSnapshot, currentSnapshot, sessionLabel, reflectionResult } = input

  const prevMap = new Map<string, MemoryAtom>()
  const currMap = new Map<string, MemoryAtom>()

  for (const atom of previousSnapshot.state.atoms) {
    prevMap.set(atom.id, atom)
  }
  for (const atom of currentSnapshot.state.atoms) {
    currMap.set(atom.id, atom)
  }

  const changes: CognitiveChange[] = []

  // 1. 新增理解（draft 和低置信度优先标记为 needs_confirmation）
  for (const [id, atom] of currMap) {
    if (!prevMap.has(id)) {
      if (atom.lifecycle === 'draft' || (atom.confidence < 0.5 && atom.lifecycle === 'active')) {
        changes.push({
          type: 'needs_confirmation',
          atomId: id,
          atomContent: atom.content,
          atomType: atom.type,
          currentLifecycle: atom.lifecycle,
          currentConfidence: atom.confidence,
          description: buildDescription('needs_confirmation', atom),
          severity: determineSeverity('needs_confirmation', 0)
        })
      } else {
        changes.push({
          type: 'new_understanding',
          atomId: id,
          atomContent: atom.content,
          atomType: atom.type,
          currentLifecycle: atom.lifecycle,
          currentConfidence: atom.confidence,
          description: buildDescription('new_understanding', atom),
          severity: determineSeverity('new_understanding', 0)
        })
      }
    }
  }

  // 2-4. 强化/降低/归档理解
  for (const [id, prevAtom] of prevMap) {
    const currAtom = currMap.get(id)
    if (!currAtom) continue

    // 归档
    if (currAtom.lifecycle === 'archived' && prevAtom.lifecycle !== 'archived') {
      changes.push({
        type: 'archived_understanding',
        atomId: id,
        atomContent: currAtom.content,
        atomType: currAtom.type,
        previousLifecycle: prevAtom.lifecycle,
        currentLifecycle: currAtom.lifecycle,
        previousConfidence: prevAtom.confidence,
        currentConfidence: currAtom.confidence,
        description: buildDescription('archived_understanding', currAtom),
        severity: determineSeverity('archived_understanding', 0)
      })
      continue
    }

    // 强化
    if (isStrengthened(prevAtom.lifecycle, currAtom.lifecycle)) {
      changes.push({
        type: 'strengthened_understanding',
        atomId: id,
        atomContent: currAtom.content,
        atomType: currAtom.type,
        previousLifecycle: prevAtom.lifecycle,
        currentLifecycle: currAtom.lifecycle,
        previousConfidence: prevAtom.confidence,
        currentConfidence: currAtom.confidence,
        description: buildDescription('strengthened_understanding', currAtom, prevAtom.confidence),
        severity: determineSeverity('strengthened_understanding', currAtom.confidence - prevAtom.confidence)
      })
      continue
    }

    // 降低置信
    const confidenceDelta = currAtom.confidence - prevAtom.confidence
    if (confidenceDelta < -0.05) {
      changes.push({
        type: 'weakened_confidence',
        atomId: id,
        atomContent: currAtom.content,
        atomType: currAtom.type,
        previousLifecycle: prevAtom.lifecycle,
        currentLifecycle: currAtom.lifecycle,
        previousConfidence: prevAtom.confidence,
        currentConfidence: currAtom.confidence,
        description: buildDescription('weakened_confidence', currAtom, prevAtom.confidence),
        severity: determineSeverity('weakened_confidence', confidenceDelta)
      })
    }
  }

  // 5. 需要确认 — 低置信度或 draft 状态的记忆
  for (const [id, atom] of currMap) {
    if (atom.lifecycle === 'draft' || (atom.confidence < 0.5 && atom.lifecycle === 'active')) {
      // 避免重复：如果已经在其他分类中，跳过
      const alreadyListed = changes.some(c => c.atomId === id)
      if (!alreadyListed) {
        changes.push({
          type: 'needs_confirmation',
          atomId: id,
          atomContent: atom.content,
          atomType: atom.type,
          currentLifecycle: atom.lifecycle,
          currentConfidence: atom.confidence,
          description: buildDescription('needs_confirmation', atom),
          severity: determineSeverity('needs_confirmation', 0)
        })
      }
    }
  }

  // 6. 触发信任修复的事件 — 从 reflectionResult 中提取
  if (reflectionResult) {
    for (const insight of reflectionResult.insights) {
      if (insight.type === 'risk') {
        for (const atomId of insight.relatedAtomIds) {
          const atom = currMap.get(atomId)
          if (atom) {
            const alreadyListed = changes.some(c => c.atomId === atomId && c.type === 'trust_repair_triggered')
            if (!alreadyListed) {
              changes.push({
                type: 'trust_repair_triggered',
                atomId,
                atomContent: atom.content,
                atomType: atom.type,
                currentLifecycle: atom.lifecycle,
                currentConfidence: atom.confidence,
                description: buildDescription('trust_repair_triggered', atom),
                severity: 'critical'
              })
            }
          }
        }
      }
    }
  }

  // 统计
  const counts: Record<CognitiveChangeType, number> = {
    new_understanding: 0,
    strengthened_understanding: 0,
    weakened_confidence: 0,
    archived_understanding: 0,
    needs_confirmation: 0,
    trust_repair_triggered: 0
  }
  for (const change of changes) {
    counts[change.type]++
  }

  // 高亮项
  const highlights: string[] = []
  if (counts.new_understanding > 0) {
    highlights.push(`新增 ${counts.new_understanding} 条理解`)
  }
  if (counts.strengthened_understanding > 0) {
    highlights.push(`强化 ${counts.strengthened_understanding} 条理解`)
  }
  if (counts.weakened_confidence > 0) {
    highlights.push(`${counts.weakened_confidence} 条理解置信度降低`)
  }
  if (counts.archived_understanding > 0) {
    highlights.push(`归档 ${counts.archived_understanding} 条理解`)
  }
  if (counts.needs_confirmation > 0) {
    highlights.push(`${counts.needs_confirmation} 条理解需要用户确认`)
  }
  if (counts.trust_repair_triggered > 0) {
    highlights.push(`${counts.trust_repair_triggered} 条理解触发信任修复`)
  }

  // 需要用户关注的项目
  const attentionItems = changes
    .filter(c => c.severity === 'important' || c.severity === 'critical')
    .map(c => c.description)

  return {
    sessionLabel: sessionLabel ?? `会话 ${new Date().toLocaleDateString()}`,
    generatedAt: new Date().toISOString(),
    changes,
    counts,
    totalChanges: changes.length,
    highlights: highlights.length > 0 ? highlights : ['本次会话无显著认知变化'],
    needsUserAttention: attentionItems.length > 0,
    attentionItems
  }
}

/**
 * 从快照差异生成认知差异视图
 *
 * 当已有 compareSnapshots 结果时，可以直接传入生成更高层次的视图。
 */
export function generateCognitiveDiffFromSnapshotDiff(
  snapshotDiff: SnapshotDiff,
  sessionLabel?: string,
  reflectionResult?: ReflectionResult
): CognitiveDiffSummary {
  const changes: CognitiveChange[] = []

  // 新增
  for (const atom of snapshotDiff.addedAtoms) {
    changes.push({
      type: 'new_understanding',
      atomId: atom.id,
      atomContent: atom.content,
      atomType: atom.type,
      currentLifecycle: atom.lifecycle,
      currentConfidence: atom.confidence,
      description: buildDescription('new_understanding', atom),
      severity: determineSeverity('new_understanding', 0)
    })
  }

  // 移除 → 归档
  for (const atom of snapshotDiff.removedAtoms) {
    changes.push({
      type: 'archived_understanding',
      atomId: atom.id,
      atomContent: atom.content,
      atomType: atom.type,
      previousLifecycle: atom.lifecycle,
      currentLifecycle: 'archived',
      previousConfidence: atom.confidence,
      currentConfidence: atom.confidence,
      description: buildDescription('archived_understanding', atom),
      severity: determineSeverity('archived_understanding', 0)
    })
  }

  // 修改
  for (const mod of snapshotDiff.modifiedAtoms) {
    const oldAtom = mod.oldAtom
    const newAtom = mod.newAtom
    if (!oldAtom || !newAtom) continue

    if (isStrengthened(oldAtom.lifecycle, newAtom.lifecycle)) {
      changes.push({
        type: 'strengthened_understanding',
        atomId: mod.atomId,
        atomContent: newAtom.content,
        atomType: newAtom.type,
        previousLifecycle: oldAtom.lifecycle,
        currentLifecycle: newAtom.lifecycle,
        previousConfidence: oldAtom.confidence,
        currentConfidence: newAtom.confidence,
        description: buildDescription('strengthened_understanding', newAtom, oldAtom.confidence),
        severity: determineSeverity('strengthened_understanding', newAtom.confidence - oldAtom.confidence)
      })
    } else if (newAtom.confidence < oldAtom.confidence - 0.05) {
      changes.push({
        type: 'weakened_confidence',
        atomId: mod.atomId,
        atomContent: newAtom.content,
        atomType: newAtom.type,
        previousLifecycle: oldAtom.lifecycle,
        currentLifecycle: newAtom.lifecycle,
        previousConfidence: oldAtom.confidence,
        currentConfidence: newAtom.confidence,
        description: buildDescription('weakened_confidence', newAtom, oldAtom.confidence),
        severity: determineSeverity('weakened_confidence', newAtom.confidence - oldAtom.confidence)
      })
    }
  }

  // 信任修复
  if (reflectionResult) {
    for (const insight of reflectionResult.insights) {
      if (insight.type === 'risk') {
        for (const atomId of insight.relatedAtomIds) {
          const alreadyListed = changes.some(c => c.atomId === atomId && c.type === 'trust_repair_triggered')
          if (!alreadyListed) {
            changes.push({
              type: 'trust_repair_triggered',
              atomId,
              atomContent: `关联风险：${insight.description}`,
              atomType: 'insight',
              currentLifecycle: 'active',
              currentConfidence: insight.confidence,
              description: `触发信任修复：${insight.description}`,
              severity: 'critical'
            })
          }
        }
      }
    }
  }

  const counts: Record<CognitiveChangeType, number> = {
    new_understanding: 0,
    strengthened_understanding: 0,
    weakened_confidence: 0,
    archived_understanding: 0,
    needs_confirmation: 0,
    trust_repair_triggered: 0
  }
  for (const change of changes) {
    counts[change.type]++
  }

  const highlights: string[] = []
  if (counts.new_understanding > 0) highlights.push(`新增 ${counts.new_understanding} 条理解`)
  if (counts.strengthened_understanding > 0) highlights.push(`强化 ${counts.strengthened_understanding} 条理解`)
  if (counts.weakened_confidence > 0) highlights.push(`${counts.weakened_confidence} 条理解置信度降低`)
  if (counts.archived_understanding > 0) highlights.push(`归档 ${counts.archived_understanding} 条理解`)
  if (counts.needs_confirmation > 0) highlights.push(`${counts.needs_confirmation} 条理解需要用户确认`)
  if (counts.trust_repair_triggered > 0) highlights.push(`${counts.trust_repair_triggered} 条理解触发信任修复`)

  const attentionItems = changes
    .filter(c => c.severity === 'important' || c.severity === 'critical')
    .map(c => c.description)

  return {
    sessionLabel: sessionLabel ?? `会话 ${new Date().toLocaleDateString()}`,
    generatedAt: new Date().toISOString(),
    changes,
    counts,
    totalChanges: changes.length,
    highlights: highlights.length > 0 ? highlights : ['本次会话无显著认知变化'],
    needsUserAttention: attentionItems.length > 0,
    attentionItems
  }
}

/**
 * 生成面向用户的认知变化摘要文本
 */
export function formatCognitiveDiffForUser(summary: CognitiveDiffSummary): string {
  const lines: string[] = []

  lines.push(`📊 认知变化摘要 — ${summary.sessionLabel}`)
  lines.push(`生成时间：${new Date(summary.generatedAt).toLocaleString()}`)
  lines.push('')

  if (summary.totalChanges === 0) {
    lines.push('本次会话无显著认知变化。')
    return lines.join('\n')
  }

  lines.push('## 变化概览')
  for (const highlight of summary.highlights) {
    lines.push(`- ${highlight}`)
  }
  lines.push('')

  // 按严重度分组展示
  const critical = summary.changes.filter(c => c.severity === 'critical')
  const important = summary.changes.filter(c => c.severity === 'important')
  const notice = summary.changes.filter(c => c.severity === 'notice')
  const info = summary.changes.filter(c => c.severity === 'info')

  if (critical.length > 0) {
    lines.push('## 🔴 需要立即关注')
    for (const change of critical) {
      lines.push(`- ${change.description}`)
    }
    lines.push('')
  }

  if (important.length > 0) {
    lines.push('## 🟡 建议关注')
    for (const change of important) {
      lines.push(`- ${change.description}`)
    }
    lines.push('')
  }

  if (notice.length > 0) {
    lines.push('## 🔵 变化详情')
    for (const change of notice) {
      lines.push(`- ${change.description}`)
    }
    lines.push('')
  }

  if (info.length > 0) {
    lines.push('## ⚪ 其他变化')
    for (const change of info) {
      lines.push(`- ${change.description}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
