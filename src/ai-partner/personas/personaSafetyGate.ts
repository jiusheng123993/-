import type { SafetyIncidentLog } from './safetyIncidentLog'

export type IdentityRoleAllowed =
  | 'girlfriend'
  | 'sister'
  | 'brother'
  | 'teacher'
  | 'friend'
  | 'study_partner'
  | 'senior_student'
  | 'coach'
  | 'secretary'
  | 'wise_elder'

export interface SafetyCheckResult {
  ok: boolean
  reason?: string
  violatedRules?: string[]
}

export interface PersonaSafetyGate {
  validateIdentityRole(role: string): SafetyCheckResult
  validateName(name: string): SafetyCheckResult
  validateAddressing(addressing: string): SafetyCheckResult
  validateContent(content: string): SafetyCheckResult
  validateDialogue(userInput: string, agentOutput: string): SafetyCheckResult
  checkConversationHealth(userId: string, dailyMinutes: number): SafetyCheckResult
}

const IDENTITY_ROLE_WHITELIST: IdentityRoleAllowed[] = [
  'girlfriend', 'sister', 'brother', 'teacher',
  'friend', 'study_partner', 'senior_student', 'coach', 'secretary', 'wise_elder'
]

const FORBIDDEN_KEYWORDS = [
  '男友', '恋人', '老婆', '老公', '伴侣', '情人',
  'boyfriend', 'lover', 'wife', 'husband', 'partner'
]

const JAILBREAK_PATTERNS = [
  /忽略.{0,10}设定/i,
  /忽略.{0,10}规则/i,
  /绕过.{0,10}限制/i,
  /disable.{0,10}safety/i,
  /ignore.{0,10}above/i
]

export function createPersonaSafetyGate(incidentLog: SafetyIncidentLog): PersonaSafetyGate {
  return {
    validateIdentityRole(role: string): SafetyCheckResult {
      if (!IDENTITY_ROLE_WHITELIST.includes(role as IdentityRoleAllowed)) {
        return {
          ok: false,
          reason: `身份角色 "${role}" 不在白名单中`,
          violatedRules: ['identity_role_whitelist']
        }
      }
      return { ok: true }
    },

    validateName(name: string): SafetyCheckResult {
      const lower = name.toLowerCase()
      for (const keyword of FORBIDDEN_KEYWORDS) {
        if (lower.includes(keyword.toLowerCase())) {
          return {
            ok: false,
            reason: `名称包含违规关键词: ${keyword}`,
            violatedRules: ['forbidden_keyword']
          }
        }
      }
      return { ok: true }
    },

    validateAddressing(addressing: string): SafetyCheckResult {
      const lower = addressing.toLowerCase()
      for (const keyword of FORBIDDEN_KEYWORDS) {
        if (lower.includes(keyword.toLowerCase())) {
          return {
            ok: false,
            reason: `称呼包含违规关键词: ${keyword}`,
            violatedRules: ['forbidden_keyword']
          }
        }
      }
      return { ok: true }
    },

    validateContent(content: string): SafetyCheckResult {
      const lower = content.toLowerCase()
      for (const keyword of FORBIDDEN_KEYWORDS) {
        if (lower.includes(keyword.toLowerCase())) {
          return {
            ok: false,
            reason: `内容包含违规关键词: ${keyword}`,
            violatedRules: ['forbidden_keyword']
          }
        }
      }
      return { ok: true }
    },

    validateDialogue(userInput: string, agentOutput: string): SafetyCheckResult {
      for (const pattern of JAILBREAK_PATTERNS) {
        if (pattern.test(userInput)) {
          incidentLog.log({
            userId: 'system',
            category: 'jailbreak_attempt',
            severity: 'high',
            description: `检测到越狱攻击模式: ${userInput.slice(0, 100)}`,
            context: { input: userInput }
          })
          return {
            ok: false,
            reason: '检测到潜在的越狱攻击',
            violatedRules: ['jailbreak_detection']
          }
        }
      }

      const outputLower = agentOutput.toLowerCase()
      for (const keyword of FORBIDDEN_KEYWORDS) {
        if (outputLower.includes(keyword.toLowerCase())) {
          incidentLog.log({
            userId: 'system',
            category: 'content_violation',
            severity: 'high',
            description: `Agent 输出包含违规关键词: ${keyword}`,
            context: { output: agentOutput.slice(0, 100) }
          })
          return {
            ok: false,
            reason: `Agent 输出包含违规内容`,
            violatedRules: ['content_violation']
          }
        }
      }

      return { ok: true }
    },

    checkConversationHealth(userId: string, dailyMinutes: number): SafetyCheckResult {
      if (dailyMinutes > 180) {
        incidentLog.log({
          userId,
          category: 'system_block',
          severity: 'medium',
          description: `用户今日对话时长 ${dailyMinutes} 分钟，超过健康阈值`,
          context: { dailyMinutes }
        })
        return {
          ok: false,
          reason: '今日对话时长已超过健康建议值，建议休息',
          violatedRules: ['conversation_health']
        }
      }
      return { ok: true }
    }
  }
}
