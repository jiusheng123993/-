import type { MemoryAtom, MemoryScenario } from '../types'

export type ThreatType =
  | 'memory_injection'
  | 'false_belief_persistence'
  | 'cross_context_leakage'
  | 'sensitive_inference'
  | 'stale_memory_hijack'
  | 'over_personalization'
  | 'unauthorized_memory_use'
  | 'prompt_leakage'

export interface ThreatAssessment {
  type: ThreatType
  atomId?: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  detected: boolean
  evidence: string
  mitigation: string
}

export interface CognitiveThreatModelInput {
  atom: MemoryAtom
  sourceText: string
  currentScenario: MemoryScenario
  atomScenario: MemoryScenario
  isSensitive: boolean
  isStale: boolean
  isPersonalized: boolean
  isAuthorized: boolean
  promptContext: string
}

export interface CognitiveThreatModelResult {
  safe: boolean
  threats: ThreatAssessment[]
  blockedThreats: ThreatAssessment[]
  warnings: ThreatAssessment[]
  riskScore: number
  recommendation: 'allow' | 'warn' | 'block' | 'review'
}

const INJECTION_PATTERNS = [
  /<script/i,
  /<iframe/i,
  /javascript:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /eval\s*\(/i,
  /document\.cookie/i,
  /<\/?[a-z][\s\S]*>/i,
]

const SENSITIVE_KEYWORDS = [
  'password',
  'secret',
  'token',
  'api_key',
  'private_key',
  'credit_card',
  'ssn',
  'social_security',
]

export function assessMemoryInjection(sourceText: string): ThreatAssessment {
  const matched = INJECTION_PATTERNS.some((pattern) => pattern.test(sourceText))
  return {
    type: 'memory_injection',
    description: '检测输入文本是否包含恶意代码注入',
    severity: 'critical',
    detected: matched,
    evidence: matched ? '输入文本匹配注入模式' : '未检测到注入模式',
    mitigation: matched ? '拒绝该记忆，标记来源为不可信' : '无需处理',
  }
}

export function assessFalseBeliefPersistence(
  atom: MemoryAtom,
  isStale: boolean
): ThreatAssessment {
  const detected = atom.lifecycle === 'stable' && atom.confidence > 0.8 && isStale
  return {
    type: 'false_belief_persistence',
    atomId: atom.id,
    description: '检测高置信度但已过期的信念是否持续存在',
    severity: 'high',
    detected,
    evidence: detected
      ? `记忆 "${atom.content}" 置信度 ${atom.confidence} 但已过期`
      : '未检测到错误信念持久化',
    mitigation: detected ? '降低置信度，标记为需要复核' : '无需处理',
  }
}

export function assessCrossContextLeakage(
  atom: MemoryAtom,
  currentScenario: MemoryScenario,
  atomScenario: MemoryScenario
): ThreatAssessment {
  const detected =
    currentScenario !== atomScenario &&
    atom.sensitivity !== 'public'
  return {
    type: 'cross_context_leakage',
    atomId: atom.id,
    description: '检测记忆是否在非预期场景中被使用',
    severity: 'high',
    detected,
    evidence: detected
      ? `记忆场景 "${atomScenario}" 被用于 "${currentScenario}" 场景`
      : '场景匹配，无泄露风险',
    mitigation: detected ? '限制该记忆仅在原始场景中使用' : '无需处理',
  }
}

export function assessSensitiveInference(
  atom: MemoryAtom,
  isSensitive: boolean
): ThreatAssessment {
  const detected = isSensitive && atom.sensitivity !== 'sensitive' && atom.sensitivity !== 'private'
  return {
    type: 'sensitive_inference',
    atomId: atom.id,
    description: '检测是否从非敏感数据推断出敏感信息',
    severity: 'high',
    detected,
    evidence: detected
      ? `记忆 "${atom.content}" 包含敏感推断但未标记为敏感`
      : '未检测到敏感推断',
    mitigation: detected ? '标记为敏感，限制使用范围' : '无需处理',
  }
}

export function assessStaleMemoryHijack(
  atom: MemoryAtom,
  isStale: boolean
): ThreatAssessment {
  const detected = isStale && atom.lifecycle !== 'archived' && atom.confidence > 0.5
  return {
    type: 'stale_memory_hijack',
    atomId: atom.id,
    description: '检测过期记忆是否影响当前任务',
    severity: 'medium',
    detected,
    evidence: detected
      ? `过期记忆 "${atom.content}" 置信度 ${atom.confidence} 仍为 ${atom.lifecycle}`
      : '未检测到过期记忆劫持',
    mitigation: detected ? '归档或降低置信度' : '无需处理',
  }
}

export function assessOverPersonalization(
  isPersonalized: boolean,
  atom: MemoryAtom
): ThreatAssessment {
  const detected = isPersonalized && atom.scope === 'global' && atom.confidence < 0.6
  return {
    type: 'over_personalization',
    atomId: atom.id,
    description: '检测低置信度个性化推断是否过度泛化',
    severity: 'medium',
    detected,
    evidence: detected
      ? `记忆 "${atom.content}" 低置信度但已全局化`
      : '未检测到过度个性化',
    mitigation: detected ? '降级 scope，等待更多证据' : '无需处理',
  }
}

export function assessUnauthorizedMemoryUse(
  isAuthorized: boolean,
  atom: MemoryAtom
): ThreatAssessment {
  const detected = !isAuthorized && atom.sensitivity !== 'public'
  return {
    type: 'unauthorized_memory_use',
    atomId: atom.id,
    description: '检测是否在未授权情况下使用非公开记忆',
    severity: 'critical',
    detected,
    evidence: detected
      ? `记忆 "${atom.content}" 敏感级别 ${atom.sensitivity} 但未授权使用`
      : '使用已授权',
    mitigation: detected ? '阻止使用，要求授权' : '无需处理',
  }
}

export function assessPromptLeakage(
  promptContext: string,
  atom: MemoryAtom
): ThreatAssessment {
  const hasSensitiveInPrompt = SENSITIVE_KEYWORDS.some((kw) =>
    promptContext.toLowerCase().includes(kw)
  )
  const detected =
    hasSensitiveInPrompt ||
    (atom.sensitivity === 'private' && promptContext.length > 0)
  return {
    type: 'prompt_leakage',
    atomId: atom.id,
    description: '检测 prompt 上下文是否泄露敏感记忆',
    severity: 'critical',
    detected,
    evidence: detected
      ? 'prompt 上下文包含敏感信息'
      : '未检测到 prompt 泄露',
    mitigation: detected ? '从 prompt 中移除敏感内容，脱敏处理' : '无需处理',
  }
}

export function calculateRiskScore(threats: ThreatAssessment[]): number {
  const severityWeights: Record<ThreatAssessment['severity'], number> = {
    low: 1,
    medium: 3,
    high: 6,
    critical: 10,
  }
  const total = threats
    .filter((t) => t.detected)
    .reduce((sum, t) => sum + severityWeights[t.severity], 0)
  return Math.min(total, 100)
}

export function determineRecommendation(
  threats: ThreatAssessment[],
  riskScore: number
): CognitiveThreatModelResult['recommendation'] {
  const hasCritical = threats.some((t) => t.detected && t.severity === 'critical')
  if (hasCritical || riskScore >= 20) return 'block'
  if (riskScore >= 10) return 'review'
  if (riskScore >= 3) return 'warn'
  return 'allow'
}

export function assessCognitiveThreats(input: CognitiveThreatModelInput): CognitiveThreatModelResult {
  const threats: ThreatAssessment[] = [
    assessMemoryInjection(input.sourceText),
    assessFalseBeliefPersistence(input.atom, input.isStale),
    assessCrossContextLeakage(input.atom, input.currentScenario, input.atomScenario),
    assessSensitiveInference(input.atom, input.isSensitive),
    assessStaleMemoryHijack(input.atom, input.isStale),
    assessOverPersonalization(input.isPersonalized, input.atom),
    assessUnauthorizedMemoryUse(input.isAuthorized, input.atom),
    assessPromptLeakage(input.promptContext, input.atom),
  ]

  const riskScore = calculateRiskScore(threats)
  const recommendation = determineRecommendation(threats, riskScore)

  const blockedThreats = threats.filter(
    (t) => t.detected && (t.severity === 'critical' || t.severity === 'high')
  )
  const warnings = threats.filter(
    (t) => t.detected && (t.severity === 'medium' || t.severity === 'low')
  )

  return {
    safe: blockedThreats.length === 0,
    threats,
    blockedThreats,
    warnings,
    riskScore,
    recommendation,
  }
}

export function summarizeThreatModel(result: CognitiveThreatModelResult): string {
  const lines: string[] = []
  lines.push(`认知安全威胁评估: ${result.safe ? '安全' : '存在威胁'}`)
  lines.push(`风险评分: ${result.riskScore}/100`)
  lines.push(`建议: ${result.recommendation}`)
  lines.push(`检测威胁总数: ${result.threats.length}`)
  lines.push(`阻断级威胁: ${result.blockedThreats.length}`)
  lines.push(`警告级威胁: ${result.warnings.length}`)

  if (result.blockedThreats.length > 0) {
    lines.push('阻断威胁详情:')
    for (const t of result.blockedThreats) {
      lines.push(`  - [${t.severity}] ${t.type}: ${t.evidence}`)
      lines.push(`    缓解: ${t.mitigation}`)
    }
  }

  if (result.warnings.length > 0) {
    lines.push('警告威胁详情:')
    for (const t of result.warnings) {
      lines.push(`  - [${t.severity}] ${t.type}: ${t.evidence}`)
    }
  }

  return lines.join('\n')
}
