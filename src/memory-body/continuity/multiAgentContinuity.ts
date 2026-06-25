import type { MemoryBodyState, MemoryScenario } from '../core/memoryBodyTypes'
import { createSnapshot, compareSnapshots, type CognitiveSnapshot, type CognitiveDiff } from '../timeMachine/cognitiveTimeMachine'
import { composePromptContext, type PromptContextComposerResult } from '../context/promptContextComposer'
import { summarizeCognitiveProfile, buildCognitiveProfileFromState, type CognitiveProfile } from '../profile/cognitiveProfile'
import { summarizeExplainability, explainAtoms, type ExplainabilitySummary } from '../explainability/explainabilityEngine'
import { summarizeReflection, reflectOnMemoryChanges, type ReflectionSummaryOutput } from '../reflection/reflectionEngine'
import { summarizeConstitution, checkAtomsAgainstConstitution, type ConstitutionSummary } from '../constitution/memoryConstitution'

export interface AgentIdentity {
  agentId: string
  agentName: string
  sessionId: string
  startedAt: string
}

export interface AgentHandoffContext {
  fromAgent: AgentIdentity
  toAgent: AgentIdentity
  handoffTimestamp: string
  cognitiveSnapshot: CognitiveSnapshot
  profileSummary: string
  constitutionSummary: ConstitutionSummary
  constitutionViolationCount: number
  explainabilitySummary: ExplainabilitySummary
  reflectionSummary: ReflectionSummaryOutput
  activeAtomIds: string[]
  keyInsights: string[]
  pendingActions: string[]
  riskFlags: string[]
}

export interface ContinuityCheckpoint {
  id: string
  agent: AgentIdentity
  timestamp: string
  snapshot: CognitiveSnapshot
  promptContext: PromptContextComposerResult
  profile: CognitiveProfile
}

export interface ContinuityGap {
  type: 'missing_memory' | 'downgraded_confidence' | 'lost_preference' | 'context_drift' | 'rule_forgotten'
  severity: 'low' | 'medium' | 'high'
  description: string
  affectedAtomIds: string[]
  recommendation: string
}

export interface ContinuityValidationResult {
  passed: boolean
  gaps: ContinuityGap[]
  diff: CognitiveDiff
  consistencyScore: number
  summary: string
}

export interface MultiAgentContinuityReport {
  handoffChain: AgentIdentity[]
  checkpoints: ContinuityCheckpoint[]
  validations: ContinuityValidationResult[]
  overallConsistency: number
  issues: string[]
  recommendations: string[]
}

function generateCheckpointId(): string {
  return `checkpoint-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createAgentIdentity(
  agentId: string,
  agentName: string,
  sessionId: string,
  startedAt?: string
): AgentIdentity {
  return {
    agentId,
    agentName,
    sessionId,
    startedAt: startedAt ?? new Date().toISOString()
  }
}

export function createContinuityCheckpoint(
  agent: AgentIdentity,
  state: MemoryBodyState,
  scenarios: MemoryScenario[]
): ContinuityCheckpoint {
  const snapshot = createSnapshot(state, `Agent ${agent.agentName} checkpoint`)
  const promptContext = composePromptContext({ atoms: state.atoms, scenarios })
  const profile = buildCognitiveProfileFromState(state)

  return {
    id: generateCheckpointId(),
    agent,
    timestamp: new Date().toISOString(),
    snapshot,
    promptContext,
    profile
  }
}

export function buildHandoffContext(
  fromAgent: AgentIdentity,
  toAgent: AgentIdentity,
  state: MemoryBodyState
): AgentHandoffContext {
  const snapshot = createSnapshot(state, `Handoff from ${fromAgent.agentName} to ${toAgent.agentName}`)
  const profile = buildCognitiveProfileFromState(state)
  const profileSummary = summarizeCognitiveProfile(profile)
  const constitutionCheck = checkAtomsAgainstConstitution(state.atoms)
  const constitutionSummary = summarizeConstitution()
  const explainabilitySummary = summarizeExplainability(explainAtoms({ atoms: state.atoms }))
  const reflectionSummary = summarizeReflection(reflectOnMemoryChanges({
    previousAtoms: [],
    currentAtoms: state.atoms
  }))

  const activeAtoms = state.atoms.filter(a => a.lifecycle === 'active' || a.lifecycle === 'confirmed' || a.lifecycle === 'stable')
  const activeAtomIds = activeAtoms.map(a => a.id)

  const keyInsights: string[] = []
  const pendingActions: string[] = []
  const riskFlags: string[] = []

  for (const atom of activeAtoms) {
    if (atom.type === 'goal' && atom.lifecycle !== 'archived') {
      pendingActions.push(`目标待完成: ${atom.content}`)
    }
    if (atom.type === 'boundary' || atom.type === 'preference') {
      keyInsights.push(`关键偏好: ${atom.content}`)
    }
    if (atom.sensitivity === 'sensitive' || atom.sensitivity === 'private') {
      riskFlags.push(`敏感记忆: ${atom.id} (${atom.sensitivity})`)
    }
  }

  for (const issue of constitutionCheck.violations) {
    riskFlags.push(`宪章违规: ${issue.principleId} - ${issue.reason}`)
  }

  return {
    fromAgent,
    toAgent,
    handoffTimestamp: new Date().toISOString(),
    cognitiveSnapshot: snapshot,
    profileSummary,
    constitutionSummary,
    constitutionViolationCount: constitutionCheck.violations.length,
    explainabilitySummary,
    reflectionSummary,
    activeAtomIds,
    keyInsights,
    pendingActions,
    riskFlags
  }
}

export function validateContinuity(
  previousCheckpoint: ContinuityCheckpoint,
  currentCheckpoint: ContinuityCheckpoint
): ContinuityValidationResult {
  const diff = compareSnapshots(previousCheckpoint.snapshot, currentCheckpoint.snapshot)
  const gaps: ContinuityGap[] = []

  for (const removed of diff.removedAtoms) {
    if (removed.lifecycle === 'confirmed' || removed.lifecycle === 'stable') {
      gaps.push({
        type: 'missing_memory',
        severity: 'high',
        description: `已确认/稳定的记忆丢失: "${removed.content}"`,
        affectedAtomIds: [removed.id],
        recommendation: `恢复记忆 "${removed.content}" 或确认用户主动删除`
      })
    }
    if (removed.type === 'preference' || removed.type === 'boundary') {
      gaps.push({
        type: 'lost_preference',
        severity: 'high',
        description: `偏好/边界记忆丢失: "${removed.content}"`,
        affectedAtomIds: [removed.id],
        recommendation: `恢复偏好 "${removed.content}"`
      })
    }
    if (removed.type === 'rule' || removed.layer === 'rule') {
      gaps.push({
        type: 'rule_forgotten',
        severity: 'high',
        description: `工程规则丢失: "${removed.content}"`,
        affectedAtomIds: [removed.id],
        recommendation: `恢复规则 "${removed.content}"`
      })
    }
  }

  for (const modified of diff.modifiedAtoms) {
    if (modified.oldAtom && modified.newAtom) {
      if (modified.oldAtom.confidence > modified.newAtom.confidence + 0.2) {
        gaps.push({
          type: 'downgraded_confidence',
          severity: 'medium',
          description: `记忆置信度显著下降: "${modified.oldAtom.content}" (${modified.oldAtom.confidence} → ${modified.newAtom.confidence})`,
          affectedAtomIds: [modified.atomId],
          recommendation: `检查置信度下降原因，确认是否需要重新确认`
        })
      }
      if (
        modified.oldAtom.lifecycle === 'confirmed' &&
        (modified.newAtom.lifecycle === 'draft' || modified.newAtom.lifecycle === 'weakening')
      ) {
        gaps.push({
          type: 'context_drift',
          severity: 'medium',
          description: `已确认记忆状态退化: "${modified.oldAtom.content}" (${modified.oldAtom.lifecycle} → ${modified.newAtom.lifecycle})`,
          affectedAtomIds: [modified.atomId],
          recommendation: `检查上下文漂移原因`
        })
      }
    }
  }

  const previousActiveIds = new Set(previousCheckpoint.promptContext.usedAtomIds)
  const currentActiveIds = new Set(currentCheckpoint.promptContext.usedAtomIds)
  const lostInPrompt = [...previousActiveIds].filter(id => !currentActiveIds.has(id))

  for (const id of lostInPrompt) {
    const atom = previousCheckpoint.snapshot.state.atoms.find(a => a.id === id)
    if (atom && (atom.lifecycle === 'confirmed' || atom.lifecycle === 'stable')) {
      const alreadyFlagged = gaps.some(g => g.affectedAtomIds.includes(id))
      if (!alreadyFlagged) {
        gaps.push({
          type: 'context_drift',
          severity: 'low',
          description: `已确认记忆未进入当前 prompt: "${atom.content}"`,
          affectedAtomIds: [id],
          recommendation: `检查场景过滤或边界条件`
        })
      }
    }
  }

  const totalChecks = diff.addedAtoms.length + diff.removedAtoms.length + diff.modifiedAtoms.length + 1
  const gapPenalty = gaps.reduce((sum, g) => {
    switch (g.severity) {
      case 'high': return sum + 3
      case 'medium': return sum + 1
      case 'low': return sum + 0.5
    }
  }, 0)
  const consistencyScore = Math.max(0, Math.min(1, 1 - gapPenalty / Math.max(totalChecks, 1)))

  const passed = gaps.filter(g => g.severity === 'high').length === 0

  const summaryParts: string[] = []
  if (diff.addedAtoms.length > 0) summaryParts.push(`新增 ${diff.addedAtoms.length} 条记忆`)
  if (diff.removedAtoms.length > 0) summaryParts.push(`移除 ${diff.removedAtoms.length} 条记忆`)
  if (diff.modifiedAtoms.length > 0) summaryParts.push(`修改 ${diff.modifiedAtoms.length} 条记忆`)
  if (gaps.length > 0) summaryParts.push(`发现 ${gaps.length} 个接续缺口`)
  const summary = summaryParts.length > 0 ? summaryParts.join('，') : '认知状态完全一致'

  return {
    passed,
    gaps,
    diff,
    consistencyScore: Math.round(consistencyScore * 100) / 100,
    summary
  }
}

export function buildMultiAgentContinuityReport(
  checkpoints: ContinuityCheckpoint[]
): MultiAgentContinuityReport {
  if (checkpoints.length === 0) {
    return {
      handoffChain: [],
      checkpoints: [],
      validations: [],
      overallConsistency: 1,
      issues: [],
      recommendations: []
    }
  }

  const handoffChain = checkpoints.map(c => c.agent)
  const validations: ContinuityValidationResult[] = []
  const issues: string[] = []
  const recommendations: string[] = []

  for (let i = 1; i < checkpoints.length; i++) {
    const validation = validateContinuity(checkpoints[i - 1], checkpoints[i])
    validations.push(validation)

    if (!validation.passed) {
      issues.push(
        `Agent "${handoffChain[i].agentName}" 接续时发现 ${validation.gaps.filter(g => g.severity === 'high').length} 个高危缺口`
      )
    }

    for (const gap of validation.gaps) {
      recommendations.push(gap.recommendation)
    }
  }

  const overallConsistency = validations.length > 0
    ? Math.round(validations.reduce((sum, v) => sum + v.consistencyScore, 0) / validations.length * 100) / 100
    : 1

  return {
    handoffChain,
    checkpoints,
    validations,
    overallConsistency,
    issues,
    recommendations: [...new Set(recommendations)]
  }
}

export function generateContinuityBrief(
  handoff: AgentHandoffContext
): string {
  const lines: string[] = [
    `=== Agent 交接简报 ===`,
    `从: ${handoff.fromAgent.agentName} (${handoff.fromAgent.sessionId})`,
    `到: ${handoff.toAgent.agentName} (${handoff.toAgent.sessionId})`,
    `时间: ${handoff.handoffTimestamp}`,
    ``,
    `--- 认知画像摘要 ---`,
    handoff.profileSummary,
    ``,
    `--- 活跃记忆 (${handoff.activeAtomIds.length} 条) ---`,
    ...handoff.activeAtomIds.slice(0, 10).map(id => `  - ${id}`),
    handoff.activeAtomIds.length > 10 ? `  ... 还有 ${handoff.activeAtomIds.length - 10} 条` : '',
    ``,
    `--- 关键洞察 ---`,
    ...handoff.keyInsights.map(i => `  - ${i}`),
    ``,
    `--- 待处理事项 ---`,
    ...(handoff.pendingActions.length > 0 ? handoff.pendingActions.map(a => `  - ${a}`) : ['  (无)']),
    ``,
    `--- 风险标记 ---`,
    ...(handoff.riskFlags.length > 0 ? handoff.riskFlags.map(r => `  - ${r}`) : ['  (无)']),
    ``,
    `--- 宪章状态 ---`,
    `  总原则: ${handoff.constitutionSummary.totalPrinciples}`,
    `  违规: ${handoff.constitutionViolationCount}`,
    ``,
    `--- 可解释性 ---`,
    `  总记忆: ${handoff.explainabilitySummary.totalAtoms}`,
    `  已确认: ${handoff.explainabilitySummary.confirmedCount}`,
    `  平均质量: ${handoff.explainabilitySummary.averageQuality.toFixed(2)}`,
    ``,
    `--- 反思摘要 ---`,
    `  变化: ${handoff.reflectionSummary.totalChanges}`,
    `  冲突: ${handoff.reflectionSummary.totalConflicts}`,
    `  洞察: ${handoff.reflectionSummary.totalInsights}`
  ]

  return lines.join('\n')
}
