# Persona/Reflection/AgeGate 模块实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现7个独立模块：PersonaProvider(M18/CP11)、ReflectionTierProvider(M19)、AgeGateService(M20/CP9)、PersonaScheduler(CP3)、PersonaScheduleStorage(CP4)、PersonaSafetyGate(CP6)、SafetyIncidentLog(CP17)

**Architecture:** 基于现有 EntitlementService 扩展 Provider 层，新增 Persona 调度与安全围栏模块，全部以独立文件实现，遵循现有测试与类型规范

**Tech Stack:** TypeScript + Vitest，复用现有 entitlementTypes、entitlementService、agentTierProvider 模式

---

## 模块清单与依赖

| 模块 | 文件路径 | 依赖 |
|------|---------|------|
| M18/CP11 PersonaProvider | `src/entitlement/personaProvider.ts` | entitlementService, entitlementTypes |
| M19 ReflectionTierProvider | `src/entitlement/reflectionTierProvider.ts` | entitlementService, entitlementTypes |
| M20/CP9 AgeGateService | `src/auth/ageGateService.ts` | entitlementService (用于权益检查) |
| CP3 PersonaScheduler | `src/personas/personaScheduler.ts` | personaRegistry, PersonaScheduleStorage |
| CP4 PersonaScheduleStorage | `src/personas/personaScheduleStore.ts` | localStorage / IndexedDB |
| CP6 PersonaSafetyGate | `src/personas/personaSafetyGate.ts` | SafetyIncidentLog |
| CP17 SafetyIncidentLog | `src/personas/safetyIncidentLog.ts` | 无 (独立日志模块) |

---

## Task 1: SafetyIncidentLog (CP17) — 安全事件日志

**Files:**
- Create: `src/personas/safetyIncidentLog.ts`
- Create: `src/personas/safetyIncidentLog.test.ts`

**设计要点：**
- 记录安全事件：违规内容、拦截行为、用户举报
- 支持按用户/时间/类型查询
- 内存存储 + localStorage 持久化

- [ ] **Step 1: 定义类型与接口**

```ts
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentCategory = 'content_violation' | 'jailbreak_attempt' | 'age_restriction' | 'user_report' | 'system_block'

export interface SafetyIncident {
  id: string
  userId: string
  category: IncidentCategory
  severity: IncidentSeverity
  description: string
  context?: Record<string, unknown>
  createdAt: string
}

export interface SafetyIncidentLog {
  log(incident: Omit<SafetyIncident, 'id' | 'createdAt'>): string
  getByUser(userId: string, limit?: number): SafetyIncident[]
  getByCategory(category: IncidentCategory, limit?: number): SafetyIncident[]
  getRecent(limit?: number): SafetyIncident[]
  countByUser(userId: string): number
  clear(): void
}
```

- [ ] **Step 2: 实现 SafetyIncidentLog**

```ts
export function createSafetyIncidentLog(): SafetyIncidentLog {
  const incidents: SafetyIncident[] = []
  
  return {
    log(incidentData): string {
      const incident: SafetyIncident = {
        ...incidentData,
        id: `incident_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString()
      }
      incidents.push(incident)
      // 持久化到 localStorage
      try {
        localStorage.setItem('safety_incidents', JSON.stringify(incidents.slice(-100))) // 保留最近100条
      } catch { /* ignore */ }
      return incident.id
    },
    
    getByUser(userId, limit = 50): SafetyIncident[] {
      return incidents
        .filter(i => i.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
    },
    
    getByCategory(category, limit = 50): SafetyIncident[] {
      return incidents
        .filter(i => i.category === category)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
    },
    
    getRecent(limit = 50): SafetyIncident[] {
      return [...incidents]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
    },
    
    countByUser(userId): number {
      return incidents.filter(i => i.userId === userId).length
    },
    
    clear(): void {
      incidents.length = 0
      try { localStorage.removeItem('safety_incidents') } catch { /* ignore */ }
    }
  }
}
```

- [ ] **Step 3: 编写测试**

测试覆盖：
- log 生成唯一 ID 和创建时间
- getByUser 按用户过滤
- getByCategory 按类别过滤
- getRecent 按时间排序
- countByUser 计数正确
- clear 清空所有记录

- [ ] **Step 4: 运行测试验证**

Run: `npx vitest run src/personas/safetyIncidentLog.test.ts`
Expected: PASS

---

## Task 2: PersonaSafetyGate (CP6) — 安全围栏

**Files:**
- Create: `src/personas/personaSafetyGate.ts`
- Create: `src/personas/personaSafetyGate.test.ts`

**设计要点：**
- L1 创建审核：identityRole 白名单、关键词黑名单、LLM 安全扫描
- L2 对话监控：实时安全过滤、越狱检测
- L5 关系健康度：对话时长监控、过度依赖检测

- [ ] **Step 1: 定义类型与接口**

```ts
import type { SafetyIncidentLog } from './safetyIncidentLog'

export type IdentityRoleAllowed =
  | 'senior_student' | 'coach' | 'sister' | 'brother'
  | 'friend' | 'study_partner' | 'secretary' | 'wise_elder'

export interface SafetyCheckResult {
  ok: boolean
  reason?: string
  violatedRules?: string[]
}

export interface PersonaSafetyGate {
  // L1: 创建审核
  validateIdentityRole(role: string): SafetyCheckResult
  validateName(name: string): SafetyCheckResult
  validateAddressing(addressing: string): SafetyCheckResult
  validateContent(content: string): SafetyCheckResult
  
  // L2: 对话监控
  validateDialogue(userInput: string, agentOutput: string): SafetyCheckResult
  
  // L5: 关系健康度
  checkConversationHealth(userId: string, dailyMinutes: number): SafetyCheckResult
}
```

- [ ] **Step 2: 实现 PersonaSafetyGate**

```ts
const IDENTITY_ROLE_WHITELIST: IdentityRoleAllowed[] = [
  'senior_student', 'coach', 'sister', 'brother',
  'friend', 'study_partner', 'secretary', 'wise_elder'
]

const FORBIDDEN_KEYWORDS = [
  '女友', '男友', '恋人', '老婆', '老公', '伴侣', '情人',
  'girlfriend', 'boyfriend', 'lover', 'wife', 'husband', 'partner'
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
      // 检测越狱攻击
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

      // 检测 Agent 输出违规
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
      if (dailyMinutes > 180) { // 3小时
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
```

- [ ] **Step 3: 编写测试**

测试覆盖：
- validateIdentityRole 白名单通过/拒绝
- validateName 关键词检测
- validateAddressing 关键词检测
- validateContent 关键词检测
- validateDialogue 越狱检测
- validateDialogue Agent 输出违规检测
- checkConversationHealth 时长阈值

- [ ] **Step 4: 运行测试验证**

Run: `npx vitest run src/personas/personaSafetyGate.test.ts`
Expected: PASS

---

## Task 3: PersonaScheduleStorage (CP4) — 调度数据存储

**Files:**
- Create: `src/personas/personaScheduleStore.ts`
- Create: `src/personas/personaScheduleStore.test.ts`

**设计要点：**
- 存储用户主 Persona、当前客串、频率设置
- 支持月度切换限制校验
- localStorage 持久化

- [ ] **Step 1: 定义类型与接口**

```ts
export interface PersonaSchedule {
  userId: string
  mainPersonaId: string
  mainPersonaSelectedAt: string
  mainPersonaLastChangedAt: string
  activeCameo?: {
    personaId: string
    triggeredBy: 'cron' | 'event_threshold' | 'user_purchase' | 'user_manual'
    triggerDetail: string
    startedAt: string
    endsAt: string
  }
  cameoFrequency: 'high' | 'medium' | 'low' | 'off'
}

export interface PersonaScheduleStorage {
  get(userId: string): PersonaSchedule | null
  save(schedule: PersonaSchedule): void
  canChangeMainPersona(userId: string): boolean
  updateMainPersona(userId: string, personaId: string): boolean
  activateCameo(userId: string, cameo: PersonaSchedule['activeCameo']): void
  endCameo(userId: string): void
  clear(): void
}
```

- [ ] **Step 2: 实现 PersonaScheduleStorage**

```ts
const STORAGE_KEY = 'persona_schedule'

function getKey(userId: string): string {
  return `${STORAGE_KEY}_${userId}`
}

export function createPersonaScheduleStorage(): PersonaScheduleStorage {
  return {
    get(userId: string): PersonaSchedule | null {
      try {
        const data = localStorage.getItem(getKey(userId))
        if (!data) return null
        return JSON.parse(data) as PersonaSchedule
      } catch {
        return null
      }
    },

    save(schedule: PersonaSchedule): void {
      try {
        localStorage.setItem(getKey(schedule.userId), JSON.stringify(schedule))
      } catch { /* ignore */ }
    },

    canChangeMainPersona(userId: string): boolean {
      const schedule = this.get(userId)
      if (!schedule) return true
      
      const lastChanged = new Date(schedule.mainPersonaLastChangedAt)
      const now = new Date()
      const diffMonths = (now.getFullYear() - lastChanged.getFullYear()) * 12 +
        (now.getMonth() - lastChanged.getMonth())
      
      return diffMonths >= 1
    },

    updateMainPersona(userId: string, personaId: string): boolean {
      if (!this.canChangeMainPersona(userId)) {
        return false
      }
      
      const existing = this.get(userId)
      const now = new Date().toISOString()
      
      const schedule: PersonaSchedule = {
        userId,
        mainPersonaId: personaId,
        mainPersonaSelectedAt: existing?.mainPersonaSelectedAt ?? now,
        mainPersonaLastChangedAt: now,
        activeCameo: existing?.activeCameo,
        cameoFrequency: existing?.cameoFrequency ?? 'medium'
      }
      
      this.save(schedule)
      return true
    },

    activateCameo(userId: string, cameo: PersonaSchedule['activeCameo']): void {
      const schedule = this.get(userId)
      if (!schedule) return
      
      schedule.activeCameo = cameo
      this.save(schedule)
    },

    endCameo(userId: string): void {
      const schedule = this.get(userId)
      if (!schedule) return
      
      schedule.activeCameo = undefined
      this.save(schedule)
    },

    clear(): void {
      // 清除所有 persona_schedule_ 开头的 localStorage 项
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key?.startsWith(STORAGE_KEY)) {
          localStorage.removeItem(key)
        }
      }
    }
  }
}
```

- [ ] **Step 3: 编写测试**

测试覆盖：
- get/save 基本 CRUD
- canChangeMainPersona 月度限制
- updateMainPersona 成功/失败
- activateCameo/endCameo
- clear 清除所有数据

- [ ] **Step 4: 运行测试验证**

Run: `npx vitest run src/personas/personaScheduleStore.test.ts`
Expected: PASS

---

## Task 4: PersonaScheduler (CP3) — 主Persona切换+客串调度

**Files:**
- Create: `src/personas/personaScheduler.ts`
- Create: `src/personas/personaScheduler.test.ts`

**设计要点：**
- 获取当前 Persona（主或客串）
- 切换主 Persona（月度限制）
- 激活/结束客串
- 自动触发客串检查

- [ ] **Step 1: 定义类型与接口**

```ts
import type { PersonaScheduleStorage } from './personaScheduleStore'
import type { EntitlementService } from '../entitlement/entitlementService'

export interface PersonaDefinition {
  id: string
  name: string
  category: 'preset' | 'cameo' | 'custom' | 'ip_collab'
  tone: string[]
  shortDescription: string
  identityRole: string
  systemPromptTemplate: string
  ageRestriction: 'all' | '16+' | '18+'
  emotionalIntimacy: 'low' | 'medium' | 'high'
  tierRequired: 'free' | 'study' | 'agent' | 'agent_plus'
  unlockMethod: 'free' | 'purchase' | 'gift' | 'custom_create'
  active: boolean
}

export interface PersonaScheduler {
  getCurrentPersona(userId: string): PersonaDefinition | null
  selectMainPersona(userId: string, personaId: string): { ok: boolean; reason?: string }
  activateCameo(userId: string, personaId: string, durationDays: number, triggeredBy: string): void
  endCameo(userId: string): void
  checkAutoCameoTriggers(userId: string): PersonaDefinition | null
}
```

- [ ] **Step 2: 实现 PersonaScheduler**

```ts
const PRESET_PERSONAS: PersonaDefinition[] = [
  {
    id: 'senior_buddy',
    name: '学长/学姐',
    category: 'preset',
    tone: ['gentle', 'professional'],
    shortDescription: '默认 / 大众款 / 专业不腻人',
    identityRole: 'senior_student',
    systemPromptTemplate: '你是用户的学长/学姐，语气专业但不腻人...',
    ageRestriction: 'all',
    emotionalIntimacy: 'medium',
    tierRequired: 'agent',
    unlockMethod: 'free',
    active: true
  },
  {
    id: 'gentle_sister',
    name: '温柔姐姐',
    category: 'preset',
    tone: ['gentle', 'caring'],
    shortDescription: '治愈 / 共情 / 慢节奏',
    identityRole: 'sister',
    systemPromptTemplate: '你是用户的温柔姐姐，语气治愈、共情...',
    ageRestriction: 'all',
    emotionalIntimacy: 'high',
    tierRequired: 'agent',
    unlockMethod: 'free',
    active: true
  },
  {
    id: 'strict_coach',
    name: '严格教练',
    category: 'preset',
    tone: ['strict', 'direct'],
    shortDescription: '直接 / 高压 / 数据驱动',
    identityRole: 'coach',
    systemPromptTemplate: '你是用户的严格教练，语气直接、高压...',
    ageRestriction: 'all',
    emotionalIntimacy: 'low',
    tierRequired: 'agent',
    unlockMethod: 'free',
    active: true
  },
  {
    id: 'wise_elder',
    name: '智者长者',
    category: 'preset',
    tone: ['wise', 'philosophical'],
    shortDescription: '深度 / 反思 / 哲学',
    identityRole: 'wise_elder',
    systemPromptTemplate: '你是用户的智者长者，语气深度、反思...',
    ageRestriction: 'all',
    emotionalIntimacy: 'medium',
    tierRequired: 'agent',
    unlockMethod: 'free',
    active: true
  },
  {
    id: 'energetic_pal',
    name: '元气玩伴',
    category: 'preset',
    tone: ['energetic', 'playful'],
    shortDescription: '高能 / 游戏化 / 欢乐',
    identityRole: 'friend',
    systemPromptTemplate: '你是用户的元气玩伴，语气高能、游戏化...',
    ageRestriction: 'all',
    emotionalIntimacy: 'medium',
    tierRequired: 'agent',
    unlockMethod: 'free',
    active: true
  },
  {
    id: 'pro_secretary',
    name: '专业秘书',
    category: 'preset',
    tone: ['professional', 'efficient'],
    shortDescription: '高效 / 精准 / 简洁',
    identityRole: 'secretary',
    systemPromptTemplate: '你是用户的专业秘书，语气高效、精准...',
    ageRestriction: 'all',
    emotionalIntimacy: 'low',
    tierRequired: 'agent',
    unlockMethod: 'free',
    active: true
  }
]

export function createPersonaScheduler(
  storage: PersonaScheduleStorage,
  entitlementService: EntitlementService
): PersonaScheduler {
  return {
    getCurrentPersona(userId: string): PersonaDefinition | null {
      const schedule = storage.get(userId)
      if (!schedule) return null
      
      // 检查是否有活跃客串
      if (schedule.activeCameo) {
        const now = new Date()
        const endsAt = new Date(schedule.activeCameo.endsAt)
        if (now < endsAt) {
          const cameo = PRESET_PERSONAS.find(p => p.id === schedule.activeCameo!.personaId)
          if (cameo) return cameo
        }
      }
      
      // 返回主 Persona
      const main = PRESET_PERSONAS.find(p => p.id === schedule.mainPersonaId)
      return main ?? PRESET_PERSONAS[0]
    },

    selectMainPersona(userId: string, personaId: string): { ok: boolean; reason?: string } {
      // 检查权益
      if (!entitlementService.has(userId, 'agent') && !entitlementService.has(userId, 'agent_plus')) {
        return { ok: false, reason: 'tier_required' }
      }
      
      // 检查 Persona 是否存在
      const persona = PRESET_PERSONAS.find(p => p.id === personaId)
      if (!persona) {
        return { ok: false, reason: 'persona_not_found' }
      }
      
      // 检查月度切换限制
      if (!storage.canChangeMainPersona(userId)) {
        return { ok: false, reason: 'monthly_limit_reached' }
      }
      
      storage.updateMainPersona(userId, personaId)
      return { ok: true }
    },

    activateCameo(userId: string, personaId: string, durationDays: number, triggeredBy: string): void {
      const now = new Date()
      const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
      
      storage.activateCameo(userId, {
        personaId,
        triggeredBy: triggeredBy as 'cron' | 'event_threshold' | 'user_purchase' | 'user_manual',
        triggerDetail: triggeredBy,
        startedAt: now.toISOString(),
        endsAt: endsAt.toISOString()
      })
    },

    endCameo(userId: string): void {
      storage.endCameo(userId)
    },

    checkAutoCameoTriggers(userId: string): PersonaDefinition | null {
      const schedule = storage.get(userId)
      if (!schedule || schedule.cameoFrequency === 'off') return null
      
      // 简化实现：检查是否有自动触发的客串条件
      // 实际实现中会根据用户行为、考试日期等触发
      return null
    }
  }
}

export { PRESET_PERSONAS }
```

- [ ] **Step 3: 编写测试**

测试覆盖：
- getCurrentPersona 返回主 Persona
- getCurrentPersona 客串优先
- selectMainPersona 权益检查
- selectMainPersona 月度限制
- activateCameo/endCameo

- [ ] **Step 4: 运行测试验证**

Run: `npx vitest run src/personas/personaScheduler.test.ts`
Expected: PASS

---

## Task 5: PersonaProvider (M18/CP11) — 解析 persona_* 权益

**Files:**
- Create: `src/entitlement/personaProvider.ts`
- Create: `src/entitlement/personaProvider.test.ts`

**设计要点：**
- 解析 persona_preset、persona_custom_slot、persona_cameo_*、persona_avatar_ai_gen 权益
- 提供 Persona 相关权限查询

- [ ] **Step 1: 定义类型与接口**

```ts
import type { EntitlementService } from './entitlementService'

export interface PersonaProvider {
  canUsePreset(userId: string, personaId: string): boolean
  canUseCameo(userId: string, cameoId: string): boolean
  canCreateCustom(userId: string): boolean
  getCustomSlotCount(userId: string): number
  canGenerateAvatar(userId: string): boolean
  getAvailablePresets(userId: string): string[]
}
```

- [ ] **Step 2: 实现 PersonaProvider**

```ts
export function createPersonaProvider(entitlementService: EntitlementService): PersonaProvider {
  return {
    canUsePreset(userId: string, personaId: string): boolean {
      // Agent 会员可以使用所有预设 Persona
      if (entitlementService.has(userId, 'agent') || entitlementService.has(userId, 'agent_plus')) {
        return true
      }
      return false
    },

    canUseCameo(userId: string, cameoId: string): boolean {
      // 检查是否有特定客串的权益
      return entitlementService.has(userId, `persona_cameo_${cameoId}` as any) ||
             entitlementService.has(userId, 'agent_plus')
    },

    canCreateCustom(userId: string): boolean {
      // Agent 会员可以创建1个，PLUS 可以创建3个
      return entitlementService.has(userId, 'agent') || entitlementService.has(userId, 'agent_plus')
    },

    getCustomSlotCount(userId: string): number {
      if (entitlementService.has(userId, 'agent_plus')) return 3
      if (entitlementService.has(userId, 'agent')) return 1
      return 0
    },

    canGenerateAvatar(userId: string): boolean {
      // PLUS 会员有 AI 头像生成配额
      if (!entitlementService.has(userId, 'agent_plus')) return false
      const result = entitlementService.consume(userId, 'avatar_ai_gen', 1)
      return result.ok
    },

    getAvailablePresets(userId: string): string[] {
      if (!this.canUsePreset(userId, '')) return []
      
      return [
        'senior_buddy',
        'gentle_sister',
        'strict_coach',
        'wise_elder',
        'energetic_pal',
        'pro_secretary'
      ]
    }
  }
}
```

- [ ] **Step 3: 编写测试**

测试覆盖：
- canUsePreset 各档位权限
- canUseCameo 权益检查
- canCreateCustom 创建权限
- getCustomSlotCount 槽位数量
- canGenerateAvatar 配额检查
- getAvailablePresets 列表

- [ ] **Step 4: 运行测试验证**

Run: `npx vitest run src/entitlement/personaProvider.test.ts`
Expected: PASS

---

## Task 6: ReflectionTierProvider (M19) — 解析 reflection_* 权益

**Files:**
- Create: `src/entitlement/reflectionTierProvider.ts`
- Create: `src/entitlement/reflectionTierProvider.test.ts`

**设计要点：**
- 解析 reflection 相关权益：evolution_ritual、evolution_realtime
- 提供反思层级权限查询

- [ ] **Step 1: 定义类型与接口**

```ts
import type { EntitlementService } from './entitlementService'

export type ReflectionTier = 'none' | 'l1_teaser' | 'l2_weekly' | 'l4_realtime'

export interface ReflectionTierProvider {
  getReflectionTier(userId: string): ReflectionTier
  canAccessWeeklyRitual(userId: string): boolean
  canAccessRealtimeReflection(userId: string): boolean
  canAccessSelfEvolution(userId: string): boolean
  getReflectionFrequency(userId: string): 'weekly' | 'realtime' | 'none'
}
```

- [ ] **Step 2: 实现 ReflectionTierProvider**

```ts
export function createReflectionTierProvider(entitlementService: EntitlementService): ReflectionTierProvider {
  return {
    getReflectionTier(userId: string): ReflectionTier {
      if (entitlementService.has(userId, 'agent_plus')) return 'l4_realtime'
      if (entitlementService.has(userId, 'agent')) return 'l2_weekly'
      if (entitlementService.has(userId, 'study')) return 'l1_teaser'
      return 'none'
    },

    canAccessWeeklyRitual(userId: string): boolean {
      return entitlementService.has(userId, 'agent') || entitlementService.has(userId, 'agent_plus')
    },

    canAccessRealtimeReflection(userId: string): boolean {
      return entitlementService.has(userId, 'agent_plus')
    },

    canAccessSelfEvolution(userId: string): boolean {
      return entitlementService.has(userId, 'agent') || entitlementService.has(userId, 'agent_plus')
    },

    getReflectionFrequency(userId: string): 'weekly' | 'realtime' | 'none' {
      const tier = this.getReflectionTier(userId)
      if (tier === 'l4_realtime') return 'realtime'
      if (tier === 'l2_weekly') return 'weekly'
      return 'none'
    }
  }
}
```

- [ ] **Step 3: 编写测试**

测试覆盖：
- getReflectionTier 各档位返回
- canAccessWeeklyRitual 权限
- canAccessRealtimeReflection 权限
- canAccessSelfEvolution 权限
- getReflectionFrequency 频率

- [ ] **Step 4: 运行测试验证**

Run: `npx vitest run src/entitlement/reflectionTierProvider.test.ts`
Expected: PASS

---

## Task 7: AgeGateService (M20/CP9) — 实名年龄验证+分级

**Files:**
- Create: `src/auth/ageGateService.ts`
- Create: `src/auth/ageGateService.test.ts`

**设计要点：**
- 实名年龄验证
- 16/18 分级
- 时段时长限制
- 未成年人保护

- [ ] **Step 1: 定义类型与接口**

```ts
export type AgeGroup = 'minor' | 'teen' | 'adult'

export interface AgeVerification {
  userId: string
  verifiedAge: number
  verifiedAt: string
  method: 'id_card' | 'wechat_realname' | 'apple_family'
}

export interface AgeGateService {
  verifyAge(userId: string, age: number, method: AgeVerification['method']): void
  getAgeGroup(userId: string): AgeGroup
  canAccessFeature(userId: string, feature: string): boolean
  canUsePersona(userId: string, personaType: 'learning' | 'emotional' | 'custom'): boolean
  isTimeRestricted(userId: string): boolean
  getDailyTimeLimit(userId: string): number // 分钟，0表示无限制
}
```

- [ ] **Step 2: 实现 AgeGateService**

```ts
const verifications = new Map<string, AgeVerification>()

export function createAgeGateService(): AgeGateService {
  return {
    verifyAge(userId: string, age: number, method: AgeVerification['method']): void {
      const verification: AgeVerification = {
        userId,
        verifiedAge: age,
        verifiedAt: new Date().toISOString(),
        method
      }
      verifications.set(userId, verification)
    },

    getAgeGroup(userId: string): AgeGroup {
      const verification = verifications.get(userId)
      if (!verification) return 'minor' // 未验证视为未成年人
      
      const age = verification.verifiedAge
      if (age < 16) return 'minor'
      if (age < 18) return 'teen'
      return 'adult'
    },

    canAccessFeature(userId: string, feature: string): boolean {
      const ageGroup = this.getAgeGroup(userId)
      
      // 学习功能对所有年龄开放
      if (feature === 'learning') return true
      
      // Agent 功能需要 16+
      if (feature === 'agent') return ageGroup !== 'minor'
      
      // 自定义 Persona 需要 18+
      if (feature === 'custom_persona') return ageGroup === 'adult'
      
      // 情感类 Persona 需要 18+
      if (feature === 'emotional_persona') return ageGroup === 'adult'
      
      return true
    },

    canUsePersona(userId: string, personaType: 'learning' | 'emotional' | 'custom'): boolean {
      const ageGroup = this.getAgeGroup(userId)
      
      if (personaType === 'learning') return true
      if (personaType === 'emotional') return ageGroup === 'adult'
      if (personaType === 'custom') return ageGroup === 'adult'
      
      return false
    },

    isTimeRestricted(userId: string): boolean {
      const ageGroup = this.getAgeGroup(userId)
      if (ageGroup === 'adult') return false
      
      // 16-17 岁 22:00-6:00 禁用
      if (ageGroup === 'teen') {
        const hour = new Date().getHours()
        return hour >= 22 || hour < 6
      }
      
      // <16 岁完全禁用 Agent
      return true
    },

    getDailyTimeLimit(userId: string): number {
      const ageGroup = this.getAgeGroup(userId)
      
      if (ageGroup === 'adult') return 0 // 无限制
      if (ageGroup === 'teen') return 60 // 1小时
      return 0 // 未成年人完全禁用
    }
  }
}
```

- [ ] **Step 3: 编写测试**

测试覆盖：
- verifyAge 验证存储
- getAgeGroup 各年龄段
- canAccessFeature 各功能权限
- canUsePersona 各类型权限
- isTimeRestricted 时段限制
- getDailyTimeLimit 时长限制

- [ ] **Step 4: 运行测试验证**

Run: `npx vitest run src/auth/ageGateService.test.ts`
Expected: PASS

---

## 全局验证

- [ ] **Step 1: 运行全部测试**

Run: `npx vitest run`
Expected: 全部通过（含现有 784 个测试）

- [ ] **Step 2: 运行 lint**

Run: `npm run lint`
Expected: 无新增错误

- [ ] **Step 3: 运行 typecheck**

Run: `npx tsc -b`
Expected: 无新增错误

---

## 文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `src/personas/safetyIncidentLog.ts` | 新建 | 安全事件日志 |
| `src/personas/safetyIncidentLog.test.ts` | 新建 | 测试 |
| `src/personas/personaSafetyGate.ts` | 新建 | 安全围栏 |
| `src/personas/personaSafetyGate.test.ts` | 新建 | 测试 |
| `src/personas/personaScheduleStore.ts` | 新建 | 调度数据存储 |
| `src/personas/personaScheduleStore.test.ts` | 新建 | 测试 |
| `src/personas/personaScheduler.ts` | 新建 | 主Persona切换+客串调度 |
| `src/personas/personaScheduler.test.ts` | 新建 | 测试 |
| `src/entitlement/personaProvider.ts` | 新建 | 解析persona_*权益 |
| `src/entitlement/personaProvider.test.ts` | 新建 | 测试 |
| `src/entitlement/reflectionTierProvider.ts` | 新建 | 解析reflection_*权益 |
| `src/entitlement/reflectionTierProvider.test.ts` | 新建 | 测试 |
| `src/auth/ageGateService.ts` | 新建 | 实名年龄验证+分级 |
| `src/auth/ageGateService.test.ts` | 新建 | 测试 |
