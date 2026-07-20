import type { MemorySensitivity, MemorySource } from '../core/memoryBodyTypes'

export interface SensitivityInput {
  content: string
  source: MemorySource
}

export interface SensitivityResult {
  sensitivity: MemorySensitivity
  matchedPatterns: string[]
}

const forbiddenPatterns: Array<{ name: string; pattern: RegExp }> = [
  { name: 'api_key', pattern: /\b(?:api[_-]?key|apikey|secret|token)\b\s*(?:是|=|:)?\s*[a-zA-Z0-9_\-:.]{12,}/i },
  { name: 'openai_key', pattern: /sk-[a-zA-Z0-9]{12,}/i },
  { name: 'password', pattern: /\b(?:密码|password|passwd|pwd)\b\s*(?:是|=|:)?\s*\S{6,}/i },
  { name: 'database_url', pattern: /(postgres|mysql|mongodb|redis):\/\/[^\s]+/i },
  { name: 'private_key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i }
]

const sensitivePatterns: Array<{ name: string; pattern: RegExp }> = [
  { name: 'family_private', pattern: /(家庭矛盾|家里吵架|父母关系|亲密关系)/ },
  { name: 'mental_health', pattern: /(抑郁|自残|崩溃|焦虑症|心理疾病)/ },
  { name: 'financial_private', pattern: /(负债|欠款|收入|工资|银行卡)/ }
]

export function classifyMemorySensitivity(input: SensitivityInput): SensitivityResult {
  const forbidden = forbiddenPatterns.filter(item => item.pattern.test(input.content)).map(item => item.name)
  if (forbidden.length > 0) return { sensitivity: 'forbidden', matchedPatterns: forbidden }

  const sensitive = sensitivePatterns.filter(item => item.pattern.test(input.content)).map(item => item.name)
  if (sensitive.length > 0) return { sensitivity: 'sensitive', matchedPatterns: sensitive }

  return { sensitivity: 'personal', matchedPatterns: [] }
}
