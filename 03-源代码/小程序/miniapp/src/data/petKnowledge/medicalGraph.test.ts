/**
 * 医学知识图谱单测
 *
 * 覆盖（设计文档「十、测试与验证方案」）：
 *   1. 数据完整性：每个症状至少命中 1 条规则；来源全部 reviewed（无 draft 进输出）
 *   2. 置信度推导：rule/graph/record/llm 各档位 + 整体取最低档
 *   3. 规则行为回归：与原 calculateRiskLevel 逐条等价（紧急 > 组合 > 条件 > 关注 > 正常）
 *   4. 结论生成：emergency 高置信度、normal 兜底、未知症状边界
 */
import { describe, it, expect } from 'vitest'
import {
  MEDICAL_GRAPH,
  evaluateRiskLevel,
  deriveConfidence,
  deriveOverallConfidence,
  buildConclusions,
  enrichResultWithConfidence,
  getPossibleConditions,
} from './medicalGraph'
import type { SymptomCheckResult } from '../../services/symptomService'

describe('medicalGraph - 数据完整性', () => {
  it('每个症状实体都能命中至少一条风险规则', () => {
    // 收集所有规则覆盖的症状 ID（扁平化，含组合规则）
    const coveredIds = new Set<string>()
    for (const rule of MEDICAL_GRAPH.riskRules) {
      for (const id of rule.match.symptomIds) {
        coveredIds.add(id)
      }
    }
    for (const symptom of MEDICAL_GRAPH.symptoms) {
      expect(coveredIds.has(symptom.id), `症状 ${symptom.id} 未命中任何规则`).toBe(true)
    }
  })

  it('所有来源均为 reviewed（draft 条目禁止进入正式输出）', () => {
    const reviewedIds = MEDICAL_GRAPH.sources
      .filter((s) => s.reviewStatus === 'reviewed')
      .map((s) => s.sourceId)
    // 风险规则与疾病实体的来源都必须已审核
    for (const rule of MEDICAL_GRAPH.riskRules) {
      expect(reviewedIds).toContain(rule.sourceRef.sourceId)
    }
    for (const disease of MEDICAL_GRAPH.diseases) {
      expect(reviewedIds).toContain(disease.sourceRef.sourceId)
    }
  })

  it('每个疾病实体都有来源、症状关联权重合法（1-3）', () => {
    expect(MEDICAL_GRAPH.diseases.length).toBeGreaterThan(0)
    for (const disease of MEDICAL_GRAPH.diseases) {
      expect(disease.sourceRef).toBeDefined()
      expect(disease.relatedSymptoms.length).toBeGreaterThan(0)
      for (const rel of disease.relatedSymptoms) {
        expect([1, 2, 3]).toContain(rel.weight)
      }
    }
  })
})

describe('medicalGraph - 置信度推导', () => {
  it('rule：紧急规则 → high，其余规则 → medium', () => {
    expect(deriveConfidence('rule', { ruleLevel: 'emergency' })).toBe('high')
    expect(deriveConfidence('rule', { ruleLevel: 'warning' })).toBe('medium')
    expect(deriveConfidence('rule', { ruleLevel: 'caution' })).toBe('medium')
  })

  it('graph：权威来源+权重3 → high，其余（internal 等）→ medium', () => {
    expect(deriveConfidence('graph', { authority: 'authoritative', weight: 3 })).toBe('high')
    expect(deriveConfidence('graph', { authority: 'authoritative', weight: 2 })).toBe('medium')
    expect(deriveConfidence('graph', { authority: 'internal' })).toBe('medium')
  })

  it('record 固定 medium，llm 固定 low', () => {
    expect(deriveConfidence('record')).toBe('medium')
    expect(deriveConfidence('llm')).toBe('low')
  })

  it('整体置信度 = 所有结论最低档（保守原则）', () => {
    expect(deriveOverallConfidence([{ text: 'a', basis: 'rule', confidence: 'high' }])).toBe('high')
    expect(
      deriveOverallConfidence([
        { text: 'a', basis: 'rule', confidence: 'high' },
        { text: 'b', basis: 'graph', confidence: 'medium' },
      ])
    ).toBe('medium')
    expect(
      deriveOverallConfidence([
        { text: 'a', basis: 'graph', confidence: 'medium' },
        { text: 'b', basis: 'llm', confidence: 'low' },
      ])
    ).toBe('low')
    // 无结论时保守取 low
    expect(deriveOverallConfidence([])).toBe('low')
  })
})

describe('medicalGraph - 规则行为回归（与原 calculateRiskLevel 等价）', () => {
  it('紧急单症状 → emergency', () => {
    expect(evaluateRiskLevel(['dyspnea'])).toBe('emergency')
    expect(evaluateRiskLevel(['seizure'])).toBe('emergency')
    expect(evaluateRiskLevel(['hematuria'])).toBe('emergency')
    expect(evaluateRiskLevel(['unconsciousness'])).toBe('emergency')
  })

  it('紧急组合（呕吐+腹泻 / 呕吐+嗜睡 / 呼吸困难+嗜睡）→ emergency', () => {
    expect(evaluateRiskLevel(['vomiting', 'diarrhea'])).toBe('emergency')
    expect(evaluateRiskLevel(['vomiting', 'lethargy'])).toBe('emergency')
    expect(evaluateRiskLevel(['dyspnea', 'lethargy'])).toBe('emergency')
  })

  it('危险组合（呕吐+食欲不振）→ warning', () => {
    expect(evaluateRiskLevel(['vomiting', 'appetite_loss'])).toBe('warning')
  })

  it('腹泻组合：时长未命中 → 回落 caution（原逻辑 continue）', () => {
    expect(evaluateRiskLevel(['diarrhea'], { duration: '1天' })).toBe('caution')
    expect(evaluateRiskLevel(['diarrhea'], {})).toBe('caution')
  })

  it('腹泻组合：时长 2-3天 / 3天以上 → warning', () => {
    expect(evaluateRiskLevel(['diarrhea'], { duration: '2-3天' })).toBe('warning')
    expect(evaluateRiskLevel(['diarrhea'], { duration: '3天以上' })).toBe('warning')
  })

  it('带条件规则：呕吐/腹泻+食欲下降、嗜睡+精神低 → warning', () => {
    expect(evaluateRiskLevel(['vomiting'], { appetite: 'decreased' })).toBe('warning')
    expect(evaluateRiskLevel(['diarrhea'], { appetite: 'decreased' })).toBe('warning')
    expect(evaluateRiskLevel(['lethargy'], { energy: 'low' })).toBe('warning')
  })

  it('尿频+尿血：因尿血本身是紧急症状 → emergency（原逻辑 hasEmergency 优先）', () => {
    expect(evaluateRiskLevel(['frequent_urination', 'hematuria'])).toBe('emergency')
  })

  it('关注清单单症状 → caution', () => {
    expect(evaluateRiskLevel(['cough'])).toBe('caution')
    expect(evaluateRiskLevel(['vomiting', 'itching'])).toBe('caution')
  })

  it('正常档症状 → normal', () => {
    expect(evaluateRiskLevel(['nystagmus'])).toBe('normal')
    expect(evaluateRiskLevel(['aggression'])).toBe('normal')
    expect(evaluateRiskLevel(['wound'])).toBe('normal')
    expect(evaluateRiskLevel(['dysphagia'])).toBe('normal')
  })

  it('边界：不在目录中的未知症状 → normal 兜底', () => {
    expect(evaluateRiskLevel(['unknown_symptom_xyz'])).toBe('normal')
  })
})

describe('medicalGraph - 结论生成', () => {
  it('紧急症状：规则结论 confidence=high，且包含图谱排查方向', () => {
    const conclusions = buildConclusions(['vomiting', 'diarrhea'])
    const ruleConclusion = conclusions.find((c) => c.basis === 'rule')
    expect(ruleConclusion).toBeDefined()
    expect(ruleConclusion!.confidence).toBe('high')
    // 图谱结论包含呕吐/腹泻的排查方向（如 胃炎/肠炎）
    const graphConclusion = conclusions.find((c) => c.basis === 'graph')
    expect(graphConclusion).toBeDefined()
    expect(graphConclusion!.confidence).toBe('medium') // internal 来源 → medium
  })

  it('未知症状：走 normal 兜底结论（rule/medium）', () => {
    const conclusions = buildConclusions(['unknown_symptom_xyz'])
    expect(conclusions.length).toBe(1)
    expect(conclusions[0].basis).toBe('rule')
    expect(conclusions[0].confidence).toBe('medium')
  })

  it('enrichResultWithConfidence：附加置信度与结论，原字段不变', () => {
    const base: SymptomCheckResult = {
      id: 'sym_test',
      petId: 'pet_test',
      symptoms: ['cough'],
      riskLevel: 'caution',
      possibleConditions: ['呼吸道感染'],
      aiAdvice: '建议观察',
      recommendedActions: ['持续观察'],
      createdAt: '2026-08-22T00:00:00.000Z',
    }
    const enriched = enrichResultWithConfidence(base)
    expect(enriched.id).toBe('sym_test')
    expect(enriched.riskLevel).toBe('caution')
    expect(enriched.confidence).toBeDefined()
    expect(enriched.conclusions!.length).toBeGreaterThan(0)
  })
})

describe('medicalGraph - 结论文案与排查方向（审查项修复）', () => {
  it('规则结论文案使用中文症状名，不泄漏英文内部 ID', () => {
    // 紧急单症状：抽搐（seizure）
    const seizureConclusions = buildConclusions(['seizure'])
    const ruleText = seizureConclusions.find((c) => c.basis === 'rule')!.text
    expect(ruleText).toContain('抽搐')
    expect(ruleText).not.toContain('seizure')

    // 紧急组合：呕吐+腹泻（vomiting+diarrhea）
    const comboConclusions = buildConclusions(['vomiting', 'diarrhea'])
    const comboRuleText = comboConclusions.find((c) => c.basis === 'rule')!.text
    expect(comboRuleText).toContain('呕吐')
    expect(comboRuleText).toContain('腹泻')
    expect(comboRuleText).not.toContain('vomiting')

    // 条件警告：呕吐+食欲下降（appetite=decreased）
    const conditionConclusions = buildConclusions(['vomiting'], { appetite: 'decreased' })
    const conditionRuleText = conditionConclusions.find((c) => c.basis === 'rule')!.text
    expect(conditionRuleText).toContain('食欲下降')
    expect(conditionRuleText).not.toContain('decreased')
  })

  it('getPossibleConditions 保持原"症状→疾病"顺序（共享疾病不被提前）', () => {
    // 原 CONDITION_MAP：seizure → [癫痫, 中毒, 脑部疾病]
    expect(getPossibleConditions(['seizure'])).toEqual(['癫痫', '中毒', '脑部疾病'])
    // 多症状：按症状顺序逐项 + 去重 + slice(0,5)（与原实现一致）
    expect(getPossibleConditions(['vomiting', 'diarrhea'])).toEqual([
      '胃炎', '食物不耐受', '肠道异物', '肠炎', '寄生虫感染',
    ])
  })

  it('边界：空症状 → normal 且产出兜底结论', () => {
    expect(evaluateRiskLevel([])).toBe('normal')
    const conclusions = buildConclusions([])
    expect(conclusions.length).toBe(1)
    expect(conclusions[0].basis).toBe('rule')
    expect(conclusions[0].confidence).toBe('medium')
  })

  it('边界：昏迷（unconsciousness）无疾病映射，仅产出高置信度规则结论', () => {
    const conclusions = buildConclusions(['unconsciousness'])
    const ruleConclusion = conclusions.find((c) => c.basis === 'rule')
    expect(ruleConclusion).toBeDefined()
    expect(ruleConclusion!.confidence).toBe('high')
    // 无图谱结论（SYMPTOM_CONDITION_MAP 无 unconsciousness 条目）
    expect(conclusions.some((c) => c.basis === 'graph')).toBe(false)
  })
})
