/**
 * 宠物医学知识图谱（Phase 1）
 *
 * 设计来源：01-产品文档/宠物医学知识图谱与置信度-设计方案-2026-08-22.md
 * 职责：
 *   1. 把散落在 symptomService.ts 里的规则常量（紧急症状/危险组合/关注清单/症状→疾病映射）
 *      外置为结构化、带来源、带审核状态的知识图谱数据（MEDICAL_GRAPH）
 *   2. 提供纯函数：风险等级评估（evaluateRiskLevel）、结论生成（buildConclusions）、
 *      置信度推导（deriveConfidence）——置信度由代码按依据类型推导，禁止 LLM 自评
 * 红线（与设计文档一致）：
 *   - 不做诊断、不推荐用药，只输出"症状→紧急程度→建议动作"
 *   - 本模块只负责"判断"，LLM/记忆引擎后续在服务端接入
 *   - 行为兼容：evaluateRiskLevel 与原 calculateRiskLevel 结果完全一致（纯重构）
 */
import type { SymptomCheckResult } from '../../services/symptomService'

// ===== 基础类型 =====

/** 身体系统枚举：用于症状归类与疾病关联 */
export type BodySystem =
  | 'digestive' | 'respiratory' | 'skin' | 'urinary'
  | 'nervous' | 'behavior' | 'eye_ear_mouth'
  | 'cardiovascular' | 'endocrine'

/** 紧急程度：与现有 symptomService.riskLevel 完全对齐，避免双套语义 */
export type RiskLevel = 'normal' | 'caution' | 'warning' | 'emergency'

/** 结论依据类型：rule=规则命中 / graph=图谱条目 / record=宠物记录(含记忆召回) / llm=AI推断 */
export type EvidenceBasis = 'rule' | 'graph' | 'record' | 'llm'

/** 置信度：由代码按规则推导得出，禁止 LLM 自评 */
export type Confidence = 'high' | 'medium' | 'low'

/** 审核状态：draft=待审（禁止进入正式输出） / reviewed=已核 / rejected=驳回 */
export type ReviewStatus = 'draft' | 'reviewed' | 'rejected'

/** 来源权威度：authoritative=权威机构 / community=社区整理 / internal=内部自审 */
export type Authority = 'authoritative' | 'community' | 'internal'

/** 症状附加信息：与 symptomService 的 additionalInfo 对齐 */
export interface SymptomAdditionalInfo {
  duration?: string
  frequency?: string
  severity?: string
  appetite?: string
  energy?: string
  otherNotes?: string
}

/** 依据来源引用：置信度的"底气"，所有图谱条目必须挂来源 */
export interface EvidenceSourceRef {
  sourceId: string            // 来源 ID（如 'merck' / 'aspca' / 'self_reviewed'）
  title: string               // 来源标题
  url?: string                // 原文链接（可公开访问则给出）
  authority: Authority        // 权威度（决定置信度上限）
  reviewedAt?: string         // 最近人工审核时间（YYYY-MM-DD）
  reviewStatus: ReviewStatus  // 审核状态（draft 条目不允许进入正式输出）
}

/** 症状实体：症状医学注册表（与 UI 分类目录解耦，UI 目录仍在 symptomService） */
export interface SymptomEntity {
  id: string                  // 症状 ID（与现有 symptomService 的 symptomId 对齐）
  name: string                // 症状名（'呕吐'）
  species: ('cat' | 'dog')[]  // 适用物种
  bodySystem: BodySystem      // 所属身体系统
  urgencyHints?: string[]     // 天然紧急提示（如抽搐→"疑似神经系统急症，立即就医"）
}

/** 风险规则：替代写死的 EMERGENCY_SYMPTOMS / WARNING_SYMPTOM_COMBOS / CAUTION_SYMPTOMS */
export interface RiskRuleEntity {
  id: string                  // 规则 ID
  name: string                // 规则名（'呕吐+精神差 → 紧急'）
  level: RiskLevel            // 命中后紧急程度
  priority: number            // 匹配优先级（大数优先：先紧急、再组合、再条件、再单症状）
  match: {
    type: 'single' | 'combo' | 'with_condition'
    symptomIds: string[]      // 命中症状（单症状或组合）
    conditions?: {            // 附加条件（可选）
      durationIn?: string[]   // 持续时长命中项（如 ['2-3天', '3天以上']）
      appetite?: string       // 食欲状态（'decreased'）
      energy?: string         // 精神状态（'low'）
    }
  }
  sourceRef: EvidenceSourceRef
}

/** 可能疾病：只做"提及/提示排查"，绝不做诊断结论 */
export interface DiseaseEntity {
  id: string                  // 疾病 ID（'gastritis'）
  name: string                // 疾病名（'胃炎'）
  species: ('cat' | 'dog')[]
  relatedSymptoms: Array<{    // 症状关联（带强度权重）
    symptomId: string
    weight: 1 | 2 | 3         // 3=高度相关，1=弱相关（Phase 1 按原 CONDITION_MAP 顺序：首位 3、其余 2）
  }>
  typicalText: string         // 一句话中性科普（不做诊断结论）
  emergencyLevel: RiskLevel   // 该疾病本身的紧急提示（Phase 1 为保守默认值，后续随权威源细化）
  sourceRef: EvidenceSourceRef
}

/** 医学知识图谱整体（单文件静态数据，带版本号） */
export interface MedicalKnowledgeGraph {
  version: string             // 图谱版本（审核更新时递增）
  updatedAt: string
  sources: EvidenceSourceRef[]
  symptoms: SymptomEntity[]
  riskRules: RiskRuleEntity[]
  diseases: DiseaseEntity[]
}

/** 单条分析结论：每个结论都带依据 + 置信度 */
export interface AnalysisConclusion {
  text: string                // 结论文案
  basis: EvidenceBasis        // 依据类型
  confidence: Confidence      // 置信度（代码推导）
  evidence?: string           // 展示给用户的依据文字
}

// ===== 来源注册表 =====

/**
 * Phase 1 来源：内部自审（迁移自既有规则库）。
 * authority='internal' → 图谱类结论置信度上限为 medium（设计文档 5.1），符合保守原则。
 * 后续随 Merck/ASPCA 等权威源逐条补录并升级为 authoritative。
 */
const SELF_REVIEWED_SOURCE: EvidenceSourceRef = {
  sourceId: 'self_reviewed',
  title: '内部自审（迁移自既有规则库，2026-08-22 复核）',
  authority: 'internal',
  reviewedAt: '2026-08-22',
  reviewStatus: 'reviewed',
}

// ===== 图谱数据（行为与原 symptomService 常量完全一致） =====

/** 紧急症状清单（原 EMERGENCY_SYMPTOMS）——命中即 emergency */
const EMERGENCY_SYMPTOM_IDS = ['seizure', 'dyspnea', 'hematuria', 'unconsciousness']

/** 危险组合（原 WARNING_SYMPTOM_COMBOS）——注意腹泻组合带时长条件 */
const WARNING_COMBOS: Array<{ symptomIds: string[]; durationIn?: string[] }> = [
  { symptomIds: ['vomiting', 'appetite_loss'] },
  { symptomIds: ['diarrhea'], durationIn: ['2-3天', '3天以上'] },
  { symptomIds: ['frequent_urination', 'hematuria'] },
]

/** 关注清单（原 CAUTION_SYMPTOMS）——命中即 caution */
const CAUTION_SYMPTOM_IDS = [
  'vomiting', 'diarrhea', 'appetite_loss', 'lethargy', 'cough',
  'itching', 'hair_loss', 'constipation', 'drooling', 'sneeze',
  'runny_nose', 'rash', 'dander', 'frequent_urination', 'dysuria',
  'head_tilt', 'ataxia', 'anxiety', 'hiding', 'excessive_licking',
  'eye_discharge', 'tearing', 'ear_odor', 'bad_breath', 'gum_swelling',
]

/** 明确归属"正常观察"档的症状（原行为：不命中任何规则 → normal） */
const NORMAL_SYMPTOM_IDS = [
  'dysphagia', 'wheezing', 'lump', 'wound', 'incontinence', 'nystagmus', 'aggression',
]

/** 症状→可能疾病 映射（原 CONDITION_MAP，顺序即相关性：首位权重 3，其余 2） */
const SYMPTOM_CONDITION_MAP: Record<string, string[]> = {
  vomiting: ['胃炎', '食物不耐受', '肠道异物'],
  diarrhea: ['肠炎', '寄生虫感染', '食物过敏'],
  constipation: ['脱水', '肠道梗阻', '饮食纤维不足'],
  appetite_loss: ['感染', '口腔疾病', '消化系统疾病'],
  drooling: ['口腔溃疡', '牙齿问题', '中毒'],
  dysphagia: ['咽喉炎', '食道异物', '神经系统疾病'],
  cough: ['呼吸道感染', '气管塌陷', '心脏病'],
  sneeze: ['上呼吸道感染', '过敏性鼻炎', '鼻腔异物'],
  runny_nose: ['鼻炎', '上呼吸道感染', '过敏'],
  dyspnea: ['肺炎', '心脏病', '气管塌陷'],
  wheezing: ['哮喘', '支气管炎', '过敏'],
  itching: ['皮肤病', '寄生虫', '过敏'],
  hair_loss: ['真菌感染', '内分泌失调', '营养不良'],
  rash: ['过敏性皮炎', '湿疹', '寄生虫叮咬'],
  dander: ['皮肤干燥', '营养不良', '寄生虫'],
  lump: ['脂肪瘤', '囊肿', '肿瘤'],
  wound: ['外伤', '感染', '自咬伤'],
  frequent_urination: ['尿路感染', '糖尿病', '肾脏疾病'],
  hematuria: ['尿路结石', '膀胱炎', '肾脏疾病'],
  dysuria: ['尿路结石', '前列腺疾病', '尿道阻塞'],
  incontinence: ['尿道括约肌松弛', '神经系统疾病', '尿路感染'],
  seizure: ['癫痫', '中毒', '脑部疾病'],
  head_tilt: ['中耳炎', '前庭疾病', '脑部疾病'],
  ataxia: ['前庭疾病', '脊髓疾病', '中毒'],
  nystagmus: ['前庭疾病', '脑部疾病', '中毒'],
  lethargy: ['感染', '贫血', '代谢疾病'],
  anxiety: ['环境变化', '疼痛', '分离焦虑'],
  aggression: ['疼痛', '恐惧', '神经系统疾病'],
  hiding: ['疼痛', '恐惧', '疾病不适'],
  excessive_licking: ['皮肤病', '过敏', '焦虑'],
  eye_discharge: ['结膜炎', '泪管堵塞', '眼部感染'],
  tearing: ['结膜炎', '过敏', '泪管堵塞'],
  ear_odor: ['耳螨', '外耳炎', '真菌感染'],
  bad_breath: ['牙结石', '口腔感染', '消化系统疾病'],
  gum_swelling: ['牙龈炎', '牙周病', '口腔感染'],
}

/**
 * 疾病紧急提示覆盖表（Phase 1 保守默认，仅收录明显危险的名称）。
 * 注意：emergencyLevel 目前只用于未来 insights，不参与 evaluateRiskLevel，不影响现有行为。
 */
const DISEASE_EMERGENCY_OVERRIDES: Record<string, RiskLevel> = {
  中毒: 'emergency',
  尿道阻塞: 'emergency',
  肠道梗阻: 'warning',
  食道异物: 'warning',
  尿路结石: 'warning',
  脑部疾病: 'warning',
  癫痫: 'warning',
  肺炎: 'warning',
  心脏病: 'warning',
}

/** 症状实体表：由 UI 分类目录同源整理 + 补充 'unconsciousness'（原紧急清单有但目录无） */
const SYMPTOM_ENTITIES: SymptomEntity[] = [
  { id: 'vomiting', name: '呕吐', species: ['cat', 'dog'], bodySystem: 'digestive' },
  { id: 'diarrhea', name: '腹泻', species: ['cat', 'dog'], bodySystem: 'digestive' },
  { id: 'constipation', name: '便秘', species: ['cat', 'dog'], bodySystem: 'digestive' },
  { id: 'appetite_loss', name: '食欲不振', species: ['cat', 'dog'], bodySystem: 'digestive' },
  { id: 'drooling', name: '流口水', species: ['cat', 'dog'], bodySystem: 'digestive' },
  { id: 'dysphagia', name: '吞咽困难', species: ['cat', 'dog'], bodySystem: 'digestive' },
  { id: 'cough', name: '咳嗽', species: ['cat', 'dog'], bodySystem: 'respiratory' },
  { id: 'sneeze', name: '打喷嚏', species: ['cat', 'dog'], bodySystem: 'respiratory' },
  { id: 'runny_nose', name: '流鼻涕', species: ['cat', 'dog'], bodySystem: 'respiratory' },
  { id: 'dyspnea', name: '呼吸困难', species: ['cat', 'dog'], bodySystem: 'respiratory', urgencyHints: ['疑似呼吸系统急症，请立即就医'] },
  { id: 'wheezing', name: '喘息', species: ['cat', 'dog'], bodySystem: 'respiratory' },
  { id: 'itching', name: '瘙痒', species: ['cat', 'dog'], bodySystem: 'skin' },
  { id: 'hair_loss', name: '脱毛', species: ['cat', 'dog'], bodySystem: 'skin' },
  { id: 'rash', name: '红疹', species: ['cat', 'dog'], bodySystem: 'skin' },
  { id: 'dander', name: '皮屑', species: ['cat', 'dog'], bodySystem: 'skin' },
  { id: 'lump', name: '肿块', species: ['cat', 'dog'], bodySystem: 'skin' },
  { id: 'wound', name: '伤口', species: ['cat', 'dog'], bodySystem: 'skin' },
  { id: 'frequent_urination', name: '尿频', species: ['cat', 'dog'], bodySystem: 'urinary' },
  { id: 'hematuria', name: '尿血', species: ['cat', 'dog'], bodySystem: 'urinary', urgencyHints: ['尿血可能提示泌尿系统急症，请尽快就医'] },
  { id: 'dysuria', name: '排尿困难', species: ['cat', 'dog'], bodySystem: 'urinary' },
  { id: 'incontinence', name: '尿失禁', species: ['cat', 'dog'], bodySystem: 'urinary' },
  { id: 'seizure', name: '抽搐', species: ['cat', 'dog'], bodySystem: 'nervous', urgencyHints: ['疑似神经系统急症，请立即就医'] },
  { id: 'head_tilt', name: '歪头', species: ['cat', 'dog'], bodySystem: 'nervous' },
  { id: 'ataxia', name: '走路不稳', species: ['cat', 'dog'], bodySystem: 'nervous' },
  { id: 'nystagmus', name: '眼球震颤', species: ['cat', 'dog'], bodySystem: 'nervous' },
  { id: 'lethargy', name: '嗜睡', species: ['cat', 'dog'], bodySystem: 'behavior' },
  { id: 'anxiety', name: '焦躁', species: ['cat', 'dog'], bodySystem: 'behavior' },
  { id: 'aggression', name: '攻击性', species: ['cat', 'dog'], bodySystem: 'behavior' },
  { id: 'hiding', name: '躲藏', species: ['cat', 'dog'], bodySystem: 'behavior' },
  { id: 'excessive_licking', name: '过度舔舐', species: ['cat', 'dog'], bodySystem: 'behavior' },
  { id: 'eye_discharge', name: '眼屎增多', species: ['cat', 'dog'], bodySystem: 'eye_ear_mouth' },
  { id: 'tearing', name: '流泪', species: ['cat', 'dog'], bodySystem: 'eye_ear_mouth' },
  { id: 'ear_odor', name: '耳臭', species: ['cat', 'dog'], bodySystem: 'eye_ear_mouth' },
  { id: 'bad_breath', name: '口臭', species: ['cat', 'dog'], bodySystem: 'eye_ear_mouth' },
  { id: 'gum_swelling', name: '牙龈红肿', species: ['cat', 'dog'], bodySystem: 'eye_ear_mouth' },
  { id: 'unconsciousness', name: '昏迷', species: ['cat', 'dog'], bodySystem: 'nervous', urgencyHints: ['意识丧失为危急情况，请立即送急诊'] },
]

/** 构建疾病实体：按名称去重，合并症状关联（首位权重 3，其余 2） */
function buildDiseaseEntities(): DiseaseEntity[] {
  const byName = new Map<string, DiseaseEntity>()
  for (const [symptomId, conditionNames] of Object.entries(SYMPTOM_CONDITION_MAP)) {
    conditionNames.forEach((name, index) => {
      // 权重按原映射顺序：首位（最相关）3，其余 2
      const weight: 1 | 2 | 3 = index === 0 ? 3 : 2
      let disease = byName.get(name)
      if (!disease) {
        disease = {
          id: `disease_${name}`,
          name,
          species: ['cat', 'dog'],
          relatedSymptoms: [],
          typicalText: `「${name}」为常见排查方向之一，具体请以兽医检查为准。`,
          emergencyLevel: DISEASE_EMERGENCY_OVERRIDES[name] || 'normal',
          sourceRef: SELF_REVIEWED_SOURCE,
        }
        byName.set(name, disease)
      }
      // 同一症状下已存在该疾病则不重复加入（原 CONDITION_MAP 每症状内疾病名唯一）
      if (!disease.relatedSymptoms.some((r) => r.symptomId === symptomId)) {
        disease.relatedSymptoms.push({ symptomId, weight })
      }
    })
  }
  return Array.from(byName.values())
}

/** 症状 ID → 中文名（用于规则/结论文案，避免内部 ID 泄漏到用户界面） */
function symptomName(id: string): string {
  const found = SYMPTOM_ENTITIES.find((s) => s.id === id)
  return found ? found.name : id
}

/** 附加条件值 → 中文标签（食欲/精神状态，用于规则文案） */
const CONDITION_LABELS: Record<string, string> = {
  appetite: '食欲',
  energy: '精神',
  decreased: '下降',
  low: '差',
}

/** 构建风险规则：与原 calculateRiskLevel 判定顺序一致（优先级：紧急单症状 > 紧急组合 > 危险组合 > 条件 > 关注 > 正常） */
function buildRiskRules(): RiskRuleEntity[] {
  const rules: RiskRuleEntity[] = []
  // 紧急单症状（priority 100）
  for (const id of EMERGENCY_SYMPTOM_IDS) {
    rules.push({
      id: `rule_emergency_single_${id}`,
      name: `紧急症状：${symptomName(id)} → 立即就医`,
      level: 'emergency',
      priority: 100,
      match: { type: 'single', symptomIds: [id] },
      sourceRef: SELF_REVIEWED_SOURCE,
    })
  }
  // 紧急组合（priority 90，原代码硬编码的三组）
  const emergencyCombos: string[][] = [
    ['vomiting', 'diarrhea'],
    ['vomiting', 'lethargy'],
    ['dyspnea', 'lethargy'],
  ]
  emergencyCombos.forEach((combo, i) => {
    rules.push({
      id: `rule_emergency_combo_${i}`,
      name: `紧急组合：${combo.map(symptomName).join('+')} → 立即就医`,
      level: 'emergency',
      priority: 90,
      match: { type: 'combo', symptomIds: combo },
      sourceRef: SELF_REVIEWED_SOURCE,
    })
  })
  // 危险组合（priority 80，含腹泻时长条件）
  WARNING_COMBOS.forEach((combo, i) => {
    rules.push({
      id: `rule_warning_combo_${i}`,
      name: `危险组合：${combo.symptomIds.map(symptomName).join('+')}${combo.durationIn ? `（持续${combo.durationIn.join('/')}）` : ''} → 尽快就医`,
      level: 'warning',
      priority: 80,
      match: {
        type: 'combo',
        symptomIds: combo.symptomIds,
        ...(combo.durationIn ? { conditions: { durationIn: combo.durationIn } } : {}),
      },
      sourceRef: SELF_REVIEWED_SOURCE,
    })
  })
  // 带条件警告（priority 70，原代码：呕吐/腹泻 + 食欲下降、嗜睡 + 精神低）
  const conditionRules: Array<{ symptomId: string; condition: 'appetite' | 'energy'; value: string }> = [
    { symptomId: 'vomiting', condition: 'appetite', value: 'decreased' },
    { symptomId: 'diarrhea', condition: 'appetite', value: 'decreased' },
    { symptomId: 'lethargy', condition: 'energy', value: 'low' },
  ]
  conditionRules.forEach((r, i) => {
    rules.push({
      id: `rule_warning_condition_${i}`,
      name: `条件警告：${symptomName(r.symptomId)} + ${CONDITION_LABELS[r.condition] || r.condition}${CONDITION_LABELS[r.value] || r.value} → 尽快就医`,
      level: 'warning',
      priority: 70,
      match: {
        type: 'with_condition',
        symptomIds: [r.symptomId],
        conditions: r.condition === 'appetite' ? { appetite: r.value } : { energy: r.value },
      },
      sourceRef: SELF_REVIEWED_SOURCE,
    })
  })
  // 关注单症状（priority 60）
  rules.push({
    id: 'rule_caution_single',
    name: '关注清单：任一关注症状 → 观察',
    level: 'caution',
    priority: 60,
    match: { type: 'single', symptomIds: CAUTION_SYMPTOM_IDS },
    sourceRef: SELF_REVIEWED_SOURCE,
  })
  // 正常观察档（priority 50，明确归属；原行为为兜底 normal）
  rules.push({
    id: 'rule_normal_single',
    name: '正常观察：未命中高风险规则 → 观察',
    level: 'normal',
    priority: 50,
    match: { type: 'single', symptomIds: NORMAL_SYMPTOM_IDS },
    sourceRef: SELF_REVIEWED_SOURCE,
  })
  return rules
}

/** 医学知识图谱实例（Phase 1 静态数据，行为与原 symptomService 常量一致） */
export const MEDICAL_GRAPH: MedicalKnowledgeGraph = {
  version: '2026-08-22.1',
  updatedAt: '2026-08-22',
  sources: [SELF_REVIEWED_SOURCE],
  symptoms: SYMPTOM_ENTITIES,
  riskRules: buildRiskRules(),
  diseases: buildDiseaseEntities(),
}

/**
 * 当前生效图谱（Phase 3 热更新）
 * 默认 MEDICAL_GRAPH（打包静态兜底）；setActiveGraph 由外部（服务端下发）切换，
 * 保证小程序无需发版即可使用审核后的最新知识
 */
let activeGraph: MedicalKnowledgeGraph = MEDICAL_GRAPH;

/**
 * 切换当前生效图谱（Phase 3：拉取 /api/knowledge/latest 成功后调用；结构不合法时忽略）
 * 校验到条目级（审查项修复）：规则非空 + 每条规则含 id/level/sourceRef，
 * 防止"空规则/缺来源"的坏数据上线导致紧急规则全灭或渲染崩溃
 */
export function setActiveGraph(graph: MedicalKnowledgeGraph): void {
  if (
    graph &&
    Array.isArray(graph.riskRules) &&
    graph.riskRules.length > 0 &&
    Array.isArray(graph.diseases) &&
    graph.riskRules.every(
      (r) =>
        r &&
        typeof r.id === 'string' &&
        typeof r.level === 'string' &&
        r.sourceRef &&
        typeof r.sourceRef.sourceId === 'string',
    )
  ) {
    activeGraph = graph;
  }
}

/** 获取当前生效图谱（评估/结论统一读这里，默认静态兜底） */
export function getActiveGraph(): MedicalKnowledgeGraph {
  return activeGraph;
}

/**
 * 获取可能相关的排查方向（保持原 CONDITION_MAP 的"症状→疾病"顺序）
 * 顺序 = symptomIds 逐项 + 每症状内疾病列表顺序，与原 generatePossibleConditions 完全一致（审查项修复）
 * 注：Phase 3 MVP 中该映射仍来自打包静态表（保证顺序稳定），热更新的疾病数据影响结论生成与规则
 * @param symptomIds - 已选症状
 * @returns 去重后的疾病名列表（最多 5 项，仅供"提示排查"，不构成诊断）
 */
export function getPossibleConditions(symptomIds: string[]): string[] {
  const conditions = new Set<string>()
  for (const id of symptomIds) {
    const mapped = SYMPTOM_CONDITION_MAP[id]
    if (mapped) {
      for (const c of mapped) conditions.add(c)
    }
  }
  return Array.from(conditions).slice(0, 5)
}

// ===== 评估与结论生成（纯函数，行为兼容） =====

/** 规则匹配结果：命中的规则 + 最终等级 */
interface RuleMatchResult {
  rule: RiskRuleEntity | null   // 决定最终等级的最高优先级命中规则（normal 档也算命中）
  level: RiskLevel
}

/**
 * 单症状是否命中规则
 * 语义区分（与原 symptomService 逻辑等价）：
 *   - type='single'（含关注清单/正常档，规则内是多个备选症状）→ 任一命中即算（原 CAUTION_SYMPTOMS 的 OR 语义）
 *   - type='combo' / 'with_condition' → 全部命中才算（原 WARNING_SYMPTOM_COMBOS 的 AND 语义）
 * @param rule - 风险规则
 * @param symptomIds - 已选症状
 * @param info - 附加信息（时长/食欲/精神）
 */
function ruleMatches(rule: RiskRuleEntity, symptomIds: string[], info?: SymptomAdditionalInfo): boolean {
  const present = (id: string) => symptomIds.includes(id)
  const matched = rule.match.type === 'single'
    ? rule.match.symptomIds.some(present)
    : rule.match.symptomIds.every(present)
  if (!matched) return false
  const conditions = rule.match.conditions
  if (!conditions) return true
  // 时长条件：命中任一才成立
  if (conditions.durationIn) {
    const duration = info?.duration
    return !!duration && conditions.durationIn.includes(duration)
  }
  // 食欲/精神条件：逐项比对
  if (conditions.appetite) {
    if (info?.appetite !== conditions.appetite) return false
  }
  if (conditions.energy) {
    if (info?.energy !== conditions.energy) return false
  }
  return true
}

/**
 * 匹配规则：按优先级从高到低，返回最高优先级命中的规则与最终等级
 * 行为与原 calculateRiskLevel 完全一致（紧急 > 紧急组合 > 危险组合[带时长] > 条件 > 关注 > 正常）
 */
function matchRules(symptomIds: string[], info?: SymptomAdditionalInfo): RuleMatchResult {
  // 过滤待审（draft）规则——设计文档 7.2 硬约束"draft 禁止进入正式输出"（审查项修复）；
  // 按优先级排序当前生效图谱的规则（规则量小，逐次 sort 开销可忽略）
  const sorted = activeGraph.riskRules
    .filter((r) => r.sourceRef?.reviewStatus !== 'draft')
    .sort((a, b) => b.priority - a.priority)
  for (const rule of sorted) {
    if (ruleMatches(rule, symptomIds, info)) {
      return { rule, level: rule.level }
    }
  }
  // 兜底：理论上不可达（rule_normal_single 覆盖所有目录症状），保持与原行为一致返回 normal
  return { rule: null, level: 'normal' }
}

/**
 * 风险等级评估（替代原 calculateRiskLevel）
 * @param symptomIds - 已选症状 ID 列表
 * @param info - 附加信息（可选）
 * @returns 紧急程度
 */
export function evaluateRiskLevel(symptomIds: string[], info?: SymptomAdditionalInfo): RiskLevel {
  return matchRules(symptomIds, info).level
}

/**
 * 置信度推导（纯规则，禁止 LLM 自评）
 * 规则：紧急规则命中 → high；图谱权威来源+权重3 → high；其余规则/图谱 → medium；LLM 推断 → low
 * @param basis - 依据类型
 * @param opts - 附加信息（规则等级 / 关联权重 / 来源权威度）
 */
export function deriveConfidence(
  basis: EvidenceBasis,
  opts?: { ruleLevel?: RiskLevel; weight?: number; authority?: Authority }
): Confidence {
  if (basis === 'llm') return 'low'
  if (basis === 'rule') {
    // 紧急规则是安全底线，确定性最高
    return opts?.ruleLevel === 'emergency' ? 'high' : 'medium'
  }
  if (basis === 'graph') {
    // 权威来源 + 强关联(3) → high；其余 → medium（internal 来源最高 medium）
    return opts?.authority === 'authoritative' && opts?.weight === 3 ? 'high' : 'medium'
  }
  // record（打卡/记忆召回）：真实数据但非医学结论，固定 medium
  return 'medium'
}

/**
 * 生成分析结论列表（Phase 1：规则 + 图谱两类；record/llm 后续接入）
 * @param symptomIds - 已选症状
 * @param info - 附加信息
 * @returns 结论列表（含依据与置信度），保证至少一条（normal 兜底）
 */
export function buildConclusions(symptomIds: string[], info?: SymptomAdditionalInfo): AnalysisConclusion[] {
  const { rule, level } = matchRules(symptomIds, info)
  const conclusions: AnalysisConclusion[] = []

  // 1. 规则结论：命中的最高优先级规则
  if (rule) {
    conclusions.push({
      text: rule.name,
      basis: 'rule',
      confidence: deriveConfidence('rule', { ruleLevel: rule.level }),
      // sourceRef 缺失时（坏数据防御）不拼依据文案，避免崩溃（审查项修复）
      evidence: rule.sourceRef ? `依据：${rule.sourceRef.title}` : undefined,
    })
  }

  // 2. 图谱结论：症状→可能疾病（提示排查方向，非诊断；读当前生效图谱，支持热更新；过滤 draft 条目）
  const conditionNames = new Set<string>()
  for (const id of symptomIds) {
    const disease = activeGraph.diseases.filter(
      (d) => d.sourceRef?.reviewStatus !== 'draft' && d.relatedSymptoms.some((r) => r.symptomId === id)
    )
    for (const d of disease) {
      conditionNames.add(d.name)
    }
  }
  const topConditions = Array.from(conditionNames).slice(0, 3)
  if (topConditions.length > 0) {
    conclusions.push({
      text: `可能相关的排查方向：${topConditions.join('、')}（仅供参考，不构成诊断）`,
      basis: 'graph',
      confidence: deriveConfidence('graph', { authority: rule?.sourceRef.authority }),
      evidence: '依据：知识图谱症状→疾病关联',
    })
  }

  // 3. 正常兜底结论（未命中任何规则时）
  if (level === 'normal' && !rule) {
    conclusions.push({
      text: '当前所选症状未命中高风险规则，建议持续观察；如症状加重或持续超过24小时请就医',
      basis: 'rule',
      confidence: 'medium',
    })
  }

  return conclusions
}

/**
 * 整体置信度 = 所有结论中最低的一档（保守原则）
 * 只要有一条 low，整体即 low（提示"部分内容为推测"）
 */
export function deriveOverallConfidence(conclusions: AnalysisConclusion[]): Confidence {
  if (conclusions.length === 0) return 'low'
  const rank: Record<Confidence, number> = { high: 3, medium: 2, low: 1 }
  const minRank = Math.min(...conclusions.map((c) => rank[c.confidence]))
  return minRank === 3 ? 'high' : minRank === 2 ? 'medium' : 'low'
}

/**
 * 在现有 SymptomCheckResult 基础上附加置信度与结论（供 analyzeSymptoms 使用）
 * @param result - 本地生成的分析结果
 * @returns 带置信度字段的结果（不修改原对象）
 */
export function enrichResultWithConfidence(result: SymptomCheckResult): SymptomCheckResult {
  const conclusions = buildConclusions(result.symptoms, result.additionalInfo)
  return {
    ...result,
    confidence: deriveOverallConfidence(conclusions),
    conclusions,
  }
}
