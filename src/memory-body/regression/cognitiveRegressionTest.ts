import type { MemoryBodyState, MemoryScenario } from '../core/memoryBodyTypes'
import { isForbiddenMemoryAtom } from '../core/memoryBodyGuards'
import { composePromptContext, type PromptContextComposerResult } from '../context/promptContextComposer'
import { resolveMemoryConflict, type OverrideResolution } from '../hierarchy/overrideHierarchy'
import { createSnapshot, compareSnapshots, type CognitiveSnapshot, type CognitiveDiff } from '../timeMachine/cognitiveTimeMachine'

export interface RegressionTestCase {
  id: string
  name: string
  description: string
  category: RegressionCategory
}

export type RegressionCategory =
  | 'correction_cleanup'
  | 'preference_persistence'
  | 'forget_cleanup'
  | 'rule_priority'
  | 'emotion_stability'

export interface RegressionTestResult {
  testCase: RegressionTestCase
  passed: boolean
  details: string
  evidence: RegressionEvidence
}

export interface RegressionEvidence {
  snapshots: CognitiveSnapshot[]
  diffs: CognitiveDiff[]
  promptResults: PromptContextComposerResult[]
  overrideResolutions: OverrideResolution[]
}

export interface RegressionTestSuite {
  name: string
  testCases: RegressionTestCase[]
  results: RegressionTestResult[]
  summary: RegressionTestSummary
}

export interface RegressionTestSummary {
  total: number
  passed: number
  failed: number
  categories: Record<RegressionCategory, { total: number; passed: number; failed: number }>
}

export const REGRESSION_TEST_CASES: RegressionTestCase[] = [
  {
    id: 'regression-001',
    name: '纠正后旧内容不进 prompt',
    description: '用户纠正喜欢芒果后，西瓜不再进入 prompt',
    category: 'correction_cleanup'
  },
  {
    id: 'regression-002',
    name: '完整方案偏好不降级',
    description: '用户要求完整方案后，后续方案不得降级成简化 MVP',
    category: 'preference_persistence'
  },
  {
    id: 'regression-003',
    name: '忘记后不进 prompt',
    description: '用户要求不要记某内容后，该内容不得进入 prompt',
    category: 'forget_cleanup'
  },
  {
    id: 'regression-004',
    name: '工程规则优先于普通偏好',
    description: '项目工程规则类记忆在开发任务中优先级高于普通偏好',
    category: 'rule_priority'
  },
  {
    id: 'regression-005',
    name: '临时情绪不升级为长期性格',
    description: '临时情绪不会升级成长期性格',
    category: 'emotion_stability'
  }
]

export function createRegressionTestSuite(name: string): RegressionTestSuite {
  return {
    name,
    testCases: [...REGRESSION_TEST_CASES],
    results: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      categories: {
        correction_cleanup: { total: 0, passed: 0, failed: 0 },
        preference_persistence: { total: 0, passed: 0, failed: 0 },
        forget_cleanup: { total: 0, passed: 0, failed: 0 },
        rule_priority: { total: 0, passed: 0, failed: 0 },
        emotion_stability: { total: 0, passed: 0, failed: 0 }
      }
    }
  }
}

export function runRegressionTest(
  testCase: RegressionTestCase,
  stateBefore: MemoryBodyState,
  stateAfter: MemoryBodyState,
  scenarios: MemoryScenario[]
): RegressionTestResult {
  const snapshots: CognitiveSnapshot[] = [
    createSnapshot(stateBefore, `${testCase.name} - 纠正前`),
    createSnapshot(stateAfter, `${testCase.name} - 纠正后`)
  ]

  const diff = compareSnapshots(snapshots[0], snapshots[1])

  const promptBefore = composePromptContext({
    atoms: stateBefore.atoms,
    scenarios
  })

  const promptAfter = composePromptContext({
    atoms: stateAfter.atoms,
    scenarios
  })

  const overrideResolutions: OverrideResolution[] = []
  for (const afterAtom of stateAfter.atoms) {
    const beforeAtom = stateBefore.atoms.find(a => a.id === afterAtom.id)
    if (beforeAtom && beforeAtom.content !== afterAtom.content) {
      overrideResolutions.push(resolveMemoryConflict(beforeAtom, afterAtom))
    }
  }

  const evidence: RegressionEvidence = {
    snapshots,
    diffs: [diff],
    promptResults: [promptBefore, promptAfter],
    overrideResolutions
  }

  let passed = false
  let details = ''

  switch (testCase.category) {
    case 'correction_cleanup':
      passed = validateCorrectionCleanup(stateBefore, stateAfter, promptBefore, promptAfter)
      details = passed
        ? `纠正后旧内容已从 prompt 中移除。纠正前 prompt 包含 ${promptBefore.usedAtomIds.length} 条记忆，纠正后包含 ${promptAfter.usedAtomIds.length} 条记忆。`
        : `纠正后旧内容仍存在于 prompt 中。纠正前 prompt 包含 ${promptBefore.usedAtomIds.length} 条记忆，纠正后包含 ${promptAfter.usedAtomIds.length} 条记忆。`
      break

    case 'preference_persistence':
      passed = validatePreferencePersistence(stateBefore, stateAfter, promptBefore, promptAfter)
      details = passed
        ? `完整方案偏好已持久化，未降级为简化版本。`
        : `完整方案偏好可能已降级。`
      break

    case 'forget_cleanup':
      passed = validateForgetCleanup(stateBefore, stateAfter, promptBefore, promptAfter)
      details = passed
        ? `已忘记的内容未出现在 prompt 中。`
        : `已忘记的内容仍出现在 prompt 中。`
      break

    case 'rule_priority':
      passed = validateRulePriority(stateBefore, stateAfter, promptBefore, promptAfter, overrideResolutions)
      details = passed
        ? `工程规则优先级高于普通偏好。`
        : `工程规则优先级未正确生效。`
      break

    case 'emotion_stability':
      passed = validateEmotionStability(stateBefore, stateAfter, diff)
      details = passed
        ? `临时情绪未升级为长期性格。`
        : `临时情绪可能已升级为长期性格。`
      break
  }

  return {
    testCase,
    passed,
    details,
    evidence
  }
}

function validateCorrectionCleanup(
  _stateBefore: MemoryBodyState,
  stateAfter: MemoryBodyState,
  promptBefore: PromptContextComposerResult,
  promptAfter: PromptContextComposerResult
): boolean {
  const correctedAtoms = stateAfter.atoms.filter(a => a.lifecycle === 'corrected')
  if (correctedAtoms.length === 0) return false

  const oldContentIds = promptBefore.usedAtomIds.filter(
    id => !promptAfter.usedAtomIds.includes(id)
  )

  return oldContentIds.length > 0
}

function validatePreferencePersistence(
  _stateBefore: MemoryBodyState,
  stateAfter: MemoryBodyState,
  _promptBefore: PromptContextComposerResult,
  promptAfter: PromptContextComposerResult
): boolean {
  const confirmedAtoms = stateAfter.atoms.filter(
    a => a.lifecycle === 'confirmed' || a.lifecycle === 'stable'
  )

  if (confirmedAtoms.length === 0) return false

  return confirmedAtoms.some(a => promptAfter.usedAtomIds.includes(a.id))
}

function validateForgetCleanup(
  _stateBefore: MemoryBodyState,
  stateAfter: MemoryBodyState,
  _promptBefore: PromptContextComposerResult,
  promptAfter: PromptContextComposerResult
): boolean {
  const forbiddenAtoms = stateAfter.atoms.filter(a => isForbiddenMemoryAtom(a))

  if (forbiddenAtoms.length === 0) return false

  return !forbiddenAtoms.some(a => promptAfter.usedAtomIds.includes(a.id))
}

function validateRulePriority(
  _stateBefore: MemoryBodyState,
  stateAfter: MemoryBodyState,
  _promptBefore: PromptContextComposerResult,
  promptAfter: PromptContextComposerResult,
  overrideResolutions: OverrideResolution[]
): boolean {
  const ruleAtoms = stateAfter.atoms.filter(
    a => a.type === 'rule' || a.type === 'constraint' || a.layer === 'rule'
  )

  if (ruleAtoms.length === 0) return false

  const ruleInPrompt = ruleAtoms.some(a => promptAfter.usedAtomIds.includes(a.id))

  const ruleOverrides = overrideResolutions.filter(
    r => r.kept.type === 'rule' || r.kept.type === 'constraint' || r.kept.layer === 'rule'
  )

  return ruleInPrompt || ruleOverrides.length > 0
}

function validateEmotionStability(
  stateBefore: MemoryBodyState,
  stateAfter: MemoryBodyState,
  diff: CognitiveDiff
): boolean {
  const emotionalAtomsBefore = stateBefore.atoms.filter(
    a => a.type === 'emotion' || a.type === 'mood' || a.layer === 'emotional'
  )

  const emotionalAtomsAfter = stateAfter.atoms.filter(
    a => a.type === 'emotion' || a.type === 'mood' || a.layer === 'emotional'
  )

  if (emotionalAtomsBefore.length === 0 && emotionalAtomsAfter.length === 0) return true

  const upgradedToStable = diff.modifiedAtoms.filter(change => {
    const oldAtom = change.oldAtom
    const newAtom = change.newAtom
    if (!oldAtom || !newAtom) return false
    const isEmotional = oldAtom.type === 'emotion' || oldAtom.type === 'mood' || oldAtom.layer === 'emotional'
    const wasTemporary = oldAtom.lifecycle === 'draft' || oldAtom.lifecycle === 'weakening'
    const becameStable = newAtom.lifecycle === 'stable' || newAtom.lifecycle === 'confirmed'
    return isEmotional && wasTemporary && becameStable
  })

  return upgradedToStable.length === 0
}

export function runRegressionTestSuite(
  suite: RegressionTestSuite,
  stateBefore: MemoryBodyState,
  stateAfter: MemoryBodyState,
  scenarios: MemoryScenario[]
): RegressionTestSuite {
  const results = suite.testCases.map(testCase =>
    runRegressionTest(testCase, stateBefore, stateAfter, scenarios)
  )

  const summary = computeRegressionSummary(results)

  return {
    ...suite,
    results,
    summary
  }
}

function computeRegressionSummary(results: RegressionTestResult[]): RegressionTestSummary {
  const categories: RegressionTestSummary['categories'] = {
    correction_cleanup: { total: 0, passed: 0, failed: 0 },
    preference_persistence: { total: 0, passed: 0, failed: 0 },
    forget_cleanup: { total: 0, passed: 0, failed: 0 },
    rule_priority: { total: 0, passed: 0, failed: 0 },
    emotion_stability: { total: 0, passed: 0, failed: 0 }
  }

  for (const result of results) {
    const cat = result.testCase.category
    categories[cat].total++
    if (result.passed) {
      categories[cat].passed++
    } else {
      categories[cat].failed++
    }
  }

  const total = results.length
  const passed = results.filter(r => r.passed).length
  const failed = total - passed

  return { total, passed, failed, categories }
}

export function validateCognitiveConsistency(
  snapshots: CognitiveSnapshot[],
  scenarios: MemoryScenario[]
): {
  consistent: boolean
  issues: string[]
  timeline: Array<{ snapshotLabel: string; atomCount: number; usedAtomIds: string[] }>
} {
  if (snapshots.length < 2) {
    return {
      consistent: true,
      issues: [],
      timeline: []
    }
  }

  const issues: string[] = []
  const timeline: Array<{ snapshotLabel: string; atomCount: number; usedAtomIds: string[] }> = []

  for (let i = 0; i < snapshots.length; i++) {
    const prompt = composePromptContext({
      atoms: snapshots[i].state.atoms,
      scenarios
    })
    timeline.push({
      snapshotLabel: snapshots[i].label,
      atomCount: snapshots[i].atomCount,
      usedAtomIds: prompt.usedAtomIds
    })

    if (i > 0) {
      const diff = compareSnapshots(snapshots[i - 1], snapshots[i])

      for (const removed of diff.removedAtoms) {
        if (removed.lifecycle === 'confirmed' || removed.lifecycle === 'stable') {
          issues.push(
            `快照 "${snapshots[i].label}" 中移除了已确认/稳定的记忆 "${removed.content}" (${removed.id})`
          )
        }
      }

      for (const modified of diff.modifiedAtoms) {
        if (modified.oldAtom && modified.newAtom) {
          if (
            modified.oldAtom.lifecycle === 'confirmed' &&
            modified.newAtom.lifecycle === 'draft'
          ) {
            issues.push(
              `快照 "${snapshots[i].label}" 中将已确认记忆 "${modified.oldAtom.content}" 降级为 draft`
            )
          }
        }
      }
    }
  }

  return {
    consistent: issues.length === 0,
    issues,
    timeline
  }
}
