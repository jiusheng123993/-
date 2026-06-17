# 星寰海 - AI 陪伴系统统一设计文档

> 版本：v3.1 | 日期：2026-06-17 | 状态：阶段0文档对齐完成
>
> 本文档融合以下设计文档，不删减任何功能，统一术语与数据结构：
> - `2026-06-01-companion-persona-system-design.md`（陪伴人格系统）
> - `2026-06-01-memory-and-self-evolving-agent-design.md`（记忆/进化/角色建模）
> - `2026-06-01-monetization-and-membership-design.md`（付费体系）
> - `2026-06-02-persona-selection-ui-redesign.md`（Persona 选择界面）
> - `2026-06-02-phase3-extended-features-design.md`（3D 角色生成）
> - `2026-06-07-module-redesign.md`（备考场景 AI 陪伴）

---

## 一、系统总览

### 1.1 产品定位

> **「会越用越懂你的陪伴搭子」**——主线 Persona 贯穿成长、临时客串带来仪式感、自定义 Persona 提供个性化，全部围绕"学习/自律/成长"场景。

### 1.2 三大子系统关系

```
┌──────────────────────────────────────────────────────────────────┐
│                        用户交互层                                 │
│   聊天窗口  │  静默注入建议  │  进化仪式卡片  │  角色展示区         │
└────────────┬─────────────┴───────┬───────┴──────────┬───────────┘
             │                     │                  │
             ▼                     ▼                  ▼
┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│  Agent Runtime   │  │ Memory Injector  │  │ Evolution Ritual UI │
│  (聊天编排+工具) │  │ (prompt 注入)    │  │ (周报/事件驱动)     │
└────────┬────────┘  └────────┬─────────┘  └──────────┬──────────┘
         │                    │                        │
         ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        记忆系统核心                               │
│  MemoryProfile  │  MemoryEvents  │  MemoryStore  │  EvolutionLedger │
└─────────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌──────────────────┐
│ MemoryObserver  │  │ MemorySummarizer │
│ (行为→事件)     │  │ (事件→画像归纳)  │
└─────────────────┘  └──────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     角色建模子系统                                │
│  AvatarRegistry  │  AvatarRenderer  │  AvatarAnimator           │
│  AvatarSourceAdapter  │  AvatarCustomizer  │  AvatarEvolution   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 核心设计原则

1. **三层正交**：记忆（内容）、Persona（语气/角色设定）、Avatar（外观/动画）三者独立可替换，互不耦合。
2. **唯一出口**：所有 LLM 调用必经 `aiProvider`；所有记忆写入必经 `MemoryStore`；所有 prompt 注入必经 `MemoryInjector`。
3. **本地优先**：默认 IndexedDB，会员开启云同步后走 `CloudSyncAdapter`。
4. **用户主权**：画像可编辑、进化可否决、事件可删除、数据可导出/清空。
5. **渐进降级**：Web/Electron 跑 3D 角色；小程序自动降级到 2D 立绘 + 表情切换。

### 1.4 备考场景数据闭环

```
考试记录 ──→ 发现薄弱科目 ──→ 错题本收集 ──→ 记忆卡巩固
    │                                    │
    ▼                                    ▼
情绪日记 ←── 成绩波动触发 ←── 专注计时 ←── 学习计划
    │
    ▼
AI 陪伴 ──→ 情绪疏导 + 个性化鼓励 + 学习建议
```

---

## 二、记忆系统

### 2.1 MemoryProfile（结构化画像 Schema）

画像是一份**用户可编辑、Agent 可更新、系统可校验**的 JSON 文档。所有字段均为可选，缺失字段不注入 prompt。

```ts
type PersonalityTrait =
  | 'MBTI_INTJ' | 'MBTI_ENTP' | 'MBTI_INFP' | 'MBTI_ESFJ'
  | 'MBTI_ISTJ' | 'MBTI_ENFP' | 'MBTI_ISFJ' | 'MBTI_ESTP'
  | 'MBTI_INTJ' | 'MBTI_ENTJ' | 'MBTI_ISTP' | 'MBTI_ESFP'
  | 'MBTI_INFJ' | 'MBTI_ENFJ' | 'MBTI_ISFP' | 'MBTI_ESTJ'
  | 'unknown'

type WorkStyle = 'independent' | 'collaborative' | 'mixed'
type EnergyPeak = 'morning' | 'afternoon' | 'evening' | 'night_owl' | 'flexible'
type MotivationStyle = 'achievement' | 'growth' | 'connection' | 'autonomy'
type FeedbackStyle = 'direct' | 'gentle' | 'humorous' | 'data_driven'
type StressResponse = 'push_harder' | 'need_break' | 'seek_help' | 'avoid'
type PlanningStyle = 'structured' | 'flexible' | 'minimal' | 'adaptive'

interface MemoryProfile {
  version: number

  identity: {
    nickname?: string
    ageGroup?: 'teen' | 'young_adult' | 'adult' | 'middle_age' | 'senior'
    occupation?: string
    currentRole?: string
    organization?: string
    lifeStage?: string
  }

  personality: {
    mbtiTendency?: PersonalityTrait
    workStyle?: WorkStyle
    planningStyle?: PlanningStyle
    motivationStyle?: MotivationStyle
    feedbackStyle?: FeedbackStyle
    stressResponse?: StressResponse
    selfDescription?: string
  }

  rhythm: {
    energyPeak?: EnergyPeak
    typicalStudyHours?: string
    sleepPattern?: 'early_bird' | 'night_owl' | 'irregular' | 'stable'
    preferredSessionLength?: number
    breakPreference?: 'pomodoro_25' | 'pomodoro_50' | 'flexible' | 'long_deep'
    weeklyActiveDays?: number
  }

  goals: {
    primaryGoal?: string
    secondaryGoals?: string[]
    targetExams?: string[]
    targetDate?: string
    careerDirection?: string
    partnerMatching?: {
      interestedIn?: Array<'study_partner' | 'exam_partner' | 'fitness_partner' | 'early_bird_partner' | 'travel_partner'>
      targetExam?: string
      studyCity?: string
      availability?: string
      lookingFor?: string
    }
  }

  preferences: {
    encouragementStyle?: 'cheerleader' | 'coach' | 'philosopher' | 'silent_partner'
    reminderFrequency?: 'high' | 'medium' | 'low' | 'none'
    detailLevel?: 'brief' | 'moderate' | 'detailed'
    languageStyle?: 'casual' | 'formal' | 'academic' | 'playful'
  }

  boundaries: {
    tabooTopics?: string[]
    triggerWords?: string[]
    dontMention?: string[]
    sensitiveAreas?: string[]
  }

  learning: {
    strongSubjects?: string[]
    weakSubjects?: string[]
    learningStyle?: 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed'
    commonBlockers?: string[]
    effectiveStrategies?: string[]
  }

  emotional: {
    currentMoodTrend?: 'improving' | 'stable' | 'declining' | 'volatile'
    motivationLevel?: 'high' | 'medium' | 'low' | 'burnout_risk'
    supportNeeds?: string[]
    recentWins?: string[]
  }

  meta: {
    createdAt: string
    updatedAt: string
    lastReflectionAt?: string
    totalEventsProcessed: number
    sourceBreakdown: { manual: number; conversation: number; behavior: number }
  }
}
```

### 2.2 MemoryEvents（原始事件库）

```ts
type MemoryEventSource = 'behavior' | 'conversation' | 'manual_input'
type MemoryEventCategory =
  | 'task_completion' | 'task_delay' | 'task_creation'
  | 'focus_session' | 'focus_skip'
  | 'plan_followed' | 'plan_deviation'
  | 'conversation_insight'
  | 'milestone_achieved' | 'streak_broken' | 'streak_restored'
  | 'schedule_anomaly' | 'energy_shift'
  | 'goal_change' | 'preference_change'
  | 'user_correction'

interface MemoryEvent {
  id: string
  source: MemoryEventSource
  category: MemoryEventCategory
  timestamp: string
  summary: string
  metadata?: Record<string, unknown>
  tags?: string[]
  processed: boolean
  processedAt?: string
}
```

### 2.3 MemoryStore（存储与版本管理）

```ts
interface MemoryStore {
  getProfile(): Promise<MemoryProfile>
  saveProfile(profile: MemoryProfile, source: MemoryEventSource): Promise<void>
  addEvent(event: Omit<MemoryEvent, 'id' | 'processed'>): Promise<string>
  getEvents(filter?: EventFilter): Promise<MemoryEvent[]>
  markEventsProcessed(ids: string[]): Promise<void>
  deleteEvents(ids: string[]): Promise<void>
  getProfileHistory(limit?: number): Promise<ProfileSnapshot[]>
  rollbackToSnapshot(snapshotId: string): Promise<void>
  exportAll(): Promise<MemoryExportData>
  clearAll(): Promise<void>
  getPersonaPrivateMemory?(personaId: string): Promise<PersonaPrivateMemory | null>
  appendPersonaPrivateMemory?(personaId: string, event: MemoryEvent): Promise<void>
}

interface PersonaPrivateMemory {
  personaId: string
  privateEvents: MemoryEvent[]
  relationshipDepth: number
  nicknameForUser?: string
  insideJokes?: string[]
  lastInteractionAt?: string
  createdAt: string
}

interface ProfileSnapshot {
  id: string
  profile: MemoryProfile
  changedFields: string[]
  reason: string
  createdAt: string
}

interface EventFilter {
  from?: string; to?: string
  categories?: MemoryEventCategory[]
  tags?: string[]
  keyword?: string
  unprocessedOnly?: boolean
  limit?: number
}

interface MemoryExportData {
  profile: MemoryProfile
  events: MemoryEvent[]
  snapshots: ProfileSnapshot[]
  evolutionLedger: EvolutionEntry[]
  exportedAt: string
}
```

### 2.4 MemoryObserver（行为→事件抽取）

```ts
interface MemoryObserver {
  onTaskCompleted(task: WorkspaceTask): void
  onTaskDelayed(task: WorkspaceTask): void
  onFocusSessionCompleted(session: FocusSessionRecord): void
  onPlanDeviation(expected: string, actual: string): void
  onScheduleAnomaly(detectedAt: string, anomalyType: string): void
  onStreakEvent(type: 'broken' | 'restored' | 'milestone', detail: string): void
  onGoalChange(oldGoal: WorkspaceGoal, newGoal: WorkspaceGoal): void
}
```

**接入方式：** 在现有 `workspaceStore.save()` 的调用链中，以 Hook/Middleware 形式注入，不修改 workspaceStore 本身。符合「优先扩展点，不改核心流程」原则。

**具体接入点清单：**
- `workspaceStore.save()` → 任务创建/完成/延迟事件
- `focusTimer.complete()` → 专注会话完成事件
- `focusTimer.skip()` → 专注跳过事件
- `planService.update()` → 计划偏离事件
- `scheduleService.detectAnomaly()` → 作息异常事件
- `streakService.update()` → 连续打卡事件
- `goalService.update()` → 目标变更事件

**事件去重策略：** 相同类型事件在 1 小时内自动去重（相同 category + 相同 summary 的事件合并为 1 条，metadata 中记录重复次数）。

### 2.5 MemorySummarizer（事件→画像归纳）

```ts
interface SummarizeRequest {
  events: MemoryEvent[]
  currentProfile: MemoryProfile
}

interface SummarizeResult {
  proposedChanges: ProfileChangeProposal[]
  reflectionNote: string
  confidence: number
}

interface ProfileChangeProposal {
  fieldPath: string
  oldValue: unknown
  newValue: unknown
  reasoning: string
  evidenceEventIds: string[]
  confidence: number
}

interface MemorySummarizer {
  summarize(request: SummarizeRequest): Promise<SummarizeResult>
}
```

**Token 预算控制：** 每次归纳的事件聚合后 ≤ 2000 token，事件先本地聚合再喂 LLM。调用 aiProvider，使用专门的 `AiTaskKind='memory-reflection'`。置信度 < 0.6 的提案不进入仪式确认，仅静默记录。

### 2.6 MemoryInjector（prompt 注入唯一出口）

```ts
interface MemoryInjector {
  buildSystemPromptExtension(profile: MemoryProfile, context?: PromptContext): string
  buildEventContext(events: MemoryEvent[], query: string): string
}

interface PromptContext {
  mode: 'chat' | 'silent_suggestion' | 'reflection'
  personaId?: PersonaId
  currentTask?: string
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
}
```

注入策略：画像压缩为 200-400 token，事件检索取 top-5 压缩为 100-200 token，总注入量控制在 600 token 以内。

---

## 三、自我进化机制

### 3.1 四层闭环

```
① 持续观察 (Observe)
   MemoryObserver 实时记录行为/对话事件
        │
        ▼
② 周期反思 (Reflect)
   ReflectionEngine 双触发：
   - Cron: 每周日 21:00
   - 事件阈值: 连续3天异常作息 / 目标达成 / 考试结束 / 连续7天无复盘
        │
        ▼
③ 提案 (Propose)
   LLM 输出结构化变更提案（ProfileChangeProposal[]）
   含：字段路径、旧值、新值、依据事件、置信度
        │
        ▼
④ 仪式确认 (Ritual)
   每周日"成长汇报"卡片 / 事件驱动即时通知
   用户可：接受 / 拒绝 / 修改后接受
        │
        └──► 写回 MemoryProfile + EvolutionLedger ──► 下一次注入 prompt
```

### 3.2 ReflectionEngine

```ts
interface ReflectionTrigger {
  type: 'cron' | 'event_threshold'
  cronSchedule?: string
  eventThresholds: EventThreshold[]
}

interface EventThreshold {
  category: MemoryEventCategory
  count: number
  windowDays: number
  description: string
}

interface ReflectionEngine {
  shouldTrigger(events: MemoryEvent[], lastReflectionAt: string): boolean
  executeReflection(profile: MemoryProfile, events: MemoryEvent[]): Promise<SummarizeResult>
}
```

默认触发规则：
- Cron：每周日 21:00
- 事件阈值：连续 3 天异常作息 / 目标达成 / 连续 7 天无复盘 / 连续 5 天专注时长 < 目标的 50% / 考试倒计时归零

### 3.3 EvolutionLedger（进化账本）

```ts
interface EvolutionEntry {
  id: string
  triggeredBy: 'cron' | 'event_threshold' | 'manual'
  triggerDetail: string
  proposedChanges: ProfileChangeProposal[]
  userDecision: 'accepted' | 'rejected' | 'modified'
  finalChanges: Array<{ fieldPath: string; oldValue: unknown; newValue: unknown }>
  reflectionNote: string
  createdAt: string
  decidedAt?: string
}

interface EvolutionLedger {
  addEntry(entry: Omit<EvolutionEntry, 'id'>): Promise<string>
  getEntries(limit?: number): Promise<EvolutionEntry[]>
  getEntryById(id: string): Promise<EvolutionEntry | null>
  updateDecision(id: string, decision: EvolutionEntry['userDecision'], finalChanges: EvolutionEntry['finalChanges']): Promise<void>
  rollbackEntry(id: string): Promise<void>
}
```

关键约束：
- 置信度 < 0.6 的提案不进入仪式确认，仅静默记录
- 用户拒绝的提案，同类事件在下次反思时降低权重
- 每次进化都可一键回滚到上一个 snapshot
- 回滚后，Agent 在下次对话中主动提及回滚事件："上次关于你的画像更新已被回滚，我会继续观察。"
- 画像字段置信度衰减：超过 90 天未更新的画像字段自动标记为 `stale`，在 prompt 注入时降低权重或跳过

### 3.4 EvolutionRitualUI（仪式感呈现）

**每周成长汇报卡片**：
- 标题：「这周我对你的理解又深了一点 🌱」
- 内容：列出 1-3 条画像变更提案，每条附带依据事件摘要
- 操作：✅ 接受 / ❌ 不对 / ✏️ 改一下

**事件驱动即时通知**：
- 触发条件：事件阈值达到
- 形式：Agent 聊天窗口自动弹出一条消息
- 示例：「我注意到你连续 3 天凌晨 2 点还在学习，是不是最近压力比较大？要不要调整一下节奏？」

---

## 四、陪伴人格系统（Persona）

### 4.1 关系结构（单主 + 临时客串）

差异化定位：**「单主 + 临时客串」的陪伴人格系统**——主线 Persona 关系深、临时客串带来惊喜与付费动机。

#### 4.1.1 6 个预设主 Persona

| ID | 称谓 | 标签 | 典型语气示例 | 适合人群 |
|---|---|---|---|---|
| `senior_buddy` | 🎓 学长/学姐 | 默认 / 大众款 / 专业不腻人 | "这周你高数完成 70%，错题集中在导数应用，要不要一起过一遍？" | 大众 |
| `gentle_sister` | 🌸 温柔姐姐 | 治愈 / 共情 / 慢节奏 | "今天有点累吧？没关系，慢一点也可以，姐姐陪你～" | 焦虑型 / 孤独型 |
| `strict_coach` | 🔥 严格教练 | 直接 / 高压 / 数据驱动 | "别废话了，今天的任务还差 2 个，30 分钟内必须开始。" | 拖延型 / 自律党 |
| `wise_elder` | 🧙 智者长者 | 深度 / 反思 / 哲学 | "你这一个月一直在 A 和 B 之间反复，要不要花 5 分钟想想你真正在意的是哪个？" | 迷茫期 / 人生规划 |
| `energetic_pal` | 🎮 元气玩伴 | 高能 / 游戏化 / 欢乐 | "哇哦你又完成了一个！来击个掌！下一关挑战 1 小时专注怎么样？" | 年轻 / 游戏化偏好 |
| `pro_secretary` | 💼 专业秘书 | 高效 / 精准 / 简洁 | "上午 9 点的会议准备好了，建议先花 20 分钟准备一下提纲，我已经把昨天的笔记调出来了。" | 职场党 / 效率派 |

#### 4.1.2 主 Persona 切换规则

- 一次只能有一个主 Persona
- 每月可换 1 次
- 切换冷却期到期前 3 天，系统提醒用户"你的 Persona 切换冷却期即将结束"
- 切换 Persona 时显示过渡动画："TA 正在收拾行李..."（约 1.5 秒过渡提示）
- 换 Persona 不丢主记忆（首版共享 MemoryProfile + MemoryEvents；二期增加 PersonaPrivateMemory）
- Agent 会员：可从 6 个中任选 1 个为主
- PLUS 会员：6 个全开放（但仍是单主调度）

#### 4.1.3 自动触发的客串（不收费）

| 触发条件 | 客串 Persona | 接管时长 | 通知文案模板 |
|---|---|---|---|
| 大型考试前 7 天 | 🔥 严格教练 | 7 天 | "考前 7 天我来接手节奏，我会比平时严一些。" |
| 连续 7 天情绪低谷 | 🌸 治愈姐姐 | 3 天 | "你最近不太对劲，我能陪你聊聊吗？" |
| 用户生日 / 周年纪念 | 🎉 庆祝 Persona | 1 天 | 定制 AI 语音 + 虚拟蛋糕动画 |
| 达成里程碑（如 100 天打卡） | 🏆 颁奖人 | 1 天 | 仪式化"颁奖致辞" + 解锁角色装饰 |
| 进入旅行模式 | 🌍 旅行搭子 | 旅行期间 | "出门在外我来陪你，行程我帮你记着。" |

客串接管通知格式：Agent 聊天窗口自动弹出消息，格式为「[客串 Persona 名称] 来了！+ 接管原因 + 预计接管时长」。

#### 4.1.4 付费解锁的客串

| 客串 Persona | ID | 解锁方式 | 价格 |
|---|---|---|---|
| 🌙 深夜电台 DJ | `deep_night_dj` | 一次性购买 | ¥18 永久 |
| 🌍 旅行搭子（手动启用） | `travel_buddy` | PLUS 内含 / 单卖 | ¥28 永久 |
| 🎄 春节限定 | `cny_spirit` | 季节限定 | ¥18 / 限定期 |
| 💕 七夕限定 | `qixi_spirit` | 季节限定 | ¥18 / 限定期 |
| 🎂 跨年限定 | `nye_spirit` | 季节限定 | ¥18 / 限定期 |
| 💌 IP 联名 Persona | `ip_<name>` | 一次性 | ¥38~68 |

#### 4.1.5 调度规则

- 同一时刻最多 1 个客串 Persona 接管
- 客串接管期间，主 Persona 后退到"幕后"，用户可在设置中临时切回
- 自动触发的客串不可由用户屏蔽，但可调整频率（高/中/低/关闭）
- 付费客串完全由用户主动启用，不自动接管

### 4.2 Persona 数据契约

```ts
type PersonaCategory = 'preset' | 'cameo' | 'custom' | 'ip_collab'
type PersonaTone = 'gentle' | 'strict' | 'humorous' | 'wise' | 'energetic' | 'professional' | 'mixed'

interface PersonaDefinition {
  id: string
  name: string
  category: PersonaCategory
  tone: PersonaTone[]
  emoji?: string
  shortDescription: string
  identityRole: string
  systemPromptTemplate: string
  avatarAssetId?: string
  voiceAssetId?: string
  ageRestriction: 'all' | '16+' | '18+'
  emotionalIntimacy: 'low' | 'medium' | 'high'
  tierRequired: 'free' | 'study' | 'agent' | 'agent_plus'
  unlockMethod: 'free' | 'purchase' | 'gift' | 'custom_create'
  unlockEntitlement?: string
  active: boolean
  isSeasonal?: boolean
  seasonalWindow?: { start: string; end: string }
}

type PersonaRole = 'main' | 'cameo'

interface PersonaSchedule {
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

interface PersonaScheduler {
  getCurrentPersona(userId: string): PersonaDefinition
  selectMainPersona(userId: string, personaId: string): { ok: boolean; reason?: string }
  activateCameo(userId: string, personaId: string, duration: { days: number }, triggeredBy: string): void
  endCameo(userId: string, reason: string): void
  checkAutoCameoTriggers(userId: string): PersonaDefinition | null
}
```

### 4.3 自定义 Persona

#### 4.3.1 准入与定价

| 准入项 | 规则 |
|---|---|
| 最低年龄 | **18 岁**（16~17 岁不可创建） |
| 准入档位 | Agent 会员 / PLUS 会员 |
| 槽位 | Agent 1 个 / PLUS 3 个 / 加购 ¥12 个 |
| AI 头像生成 | ¥6/次（消耗 `persona_avatar_ai_gen` 配额） |

#### 4.3.2 创建流程（3 步）

**Step 1：选基础模板（底座）**——从 6 个预设 Persona 中选一个作为模板底座，继承其语气框架与安全围栏。强制：必须选一个，不允许从零开始。

**Step 2：填空自定义**

| 填空项 | 必填 | 安全约束 |
|---|---|---|
| TA 的名字 | ✅ | 禁止真实名人姓名、禁止涉政人物 |
| TA 怎么称呼你 | ✅ | 禁止侮辱性 / 性暗示称呼 |
| TA 的身份 | ✅ | **强制白名单**：仅可选"学姐/学长/教练/姐姐/哥哥/朋友/伙伴/搭子/秘书/智者"。禁止"恋人/女友/男友/老婆/老公/伴侣" |
| 性格关键词（选 3 个） | ✅ | 闭合枚举：温柔/毒舌/幽默/理性/元气/慵懒/关怀/直接/哲学/玩趣/专业 |
| 口头禅 | ❌ | 禁止涉黄/涉暴 |
| 背景故事（≤ 50 字） | ❌ | 禁止涉政/涉黄/犯罪/自杀 |
| TA 不聊什么 | ❌ | — |
| 头像 | ✅ | 禁止真人照片 / 未成年人形象 |

**Step 3：AI 辅助润色**——后台 LLM 自动将填空内容加工为完整 system prompt，通过内容安全审核（关键词黑名单 + LLM 安全扫描双重审核），生成"TA 的自我介绍"供预览。

#### 4.3.3 自定义 Persona 数据契约

```ts
interface CustomPersonaDraft {
  baseTemplateId: string
  name: string
  addressing: string
  identityRole: IdentityRoleAllowed
  toneKeywords: ToneKeyword[]
  catchphrase?: string
  backstory?: string
  forbiddenTopics?: string[]
  avatarSource: 'preset' | 'ai_generated'
  avatarAssetId?: string
  aiAvatarPrompt?: string
}

type IdentityRoleAllowed =
  | 'senior_student' | 'coach' | 'sister' | 'brother'
  | 'friend' | 'study_partner' | 'secretary' | 'wise_elder'

type ToneKeyword =
  | 'gentle' | 'sharp' | 'humorous' | 'rational' | 'energetic' | 'lazy'
  | 'caring' | 'direct' | 'philosophical' | 'playful' | 'professional'

interface CustomPersonaRecord extends PersonaDefinition {
  category: 'custom'
  creatorUserId: string
  draft: CustomPersonaDraft
  safetyReview: {
    status: 'pending' | 'approved' | 'rejected'
    rejectedReasons?: string[]
    reviewedAt: string
    reviewedBy: 'auto' | 'manual'
  }
  shareToCommunity?: {
    enabled: boolean
    sharedAt?: string
    importCount?: number
    rating?: number
  }
}
```

### 4.4 Persona 社区（UGC 生态）

#### 4.4.1 首版功能

| 功能 | 是否首版上线 |
|---|---|
| 把自定义 Persona 分享到社区 | ✅ |
| 其他用户浏览社区 Persona | ✅ |
| 一键导入社区 Persona | ✅ |
| 导入后微调（改名字、改称呼、改口头禅） | ✅ |
| 上架审核（LLM 安全审核 + 关键词扫描） | ✅ |
| 举报按钮 + 人工审核队列 | ✅ |
| 创作者排行榜 | ❌ 二期 |
| 付费 Persona / 平台抽成 | ❌ 二期 |
| IP 联名 Persona 上架 | ❌ 三期 |

#### 4.4.2 社区契约

```ts
type CommunityReportReason =
  | 'inappropriate_persona'   // 违规人设
  | 'inappropriate_dialogue'  // 不当对话
  | 'plagiarism'              // 抄袭
  | 'impersonation'           // 真人冒名
  | 'other'                   // 其他

interface CommunityPersonaEntry {
  id: string
  sourcePersonaId: string
  creatorUserId: string
  creatorDisplayName: string
  visibility: 'public' | 'unlisted'
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'removed'
  importCount: number
  ratingAverage: number
  ratingCount: number
  reportCount: number
  publishedAt?: string
  lastImportedAt?: string
}

interface CommunityPersonaService {
  publish(userId: string, personaId: string, visibility: 'public' | 'unlisted'): Promise<{ ok: boolean; entryId?: string; rejectedReasons?: string[] }>
  unpublish(userId: string, entryId: string): Promise<void>
  list(filter?: { sort?: 'hot' | 'new' | 'top_rated'; tone?: ToneKeyword; limit?: number }): Promise<CommunityPersonaEntry[]>
  importToMy(userId: string, entryId: string): Promise<{ ok: boolean; createdPersonaId?: string; reason?: string }>
  report(userId: string, entryId: string, reason: CommunityReportReason): Promise<void>
  rate(userId: string, entryId: string, score: 1 | 2 | 3 | 4 | 5): Promise<void>
}
```

**处罚阶梯：** 审核员判定违规 → Persona 下架 + 通知创作者 → 累计 3 次封创作者权限。

### 4.9 两套 Persona 体系说明

> 本节说明代码库中实际存在的两套 Persona 相关体系及其关系。
>
> **当前状态（2026-06-17）**：两套体系均为正交互补关系，已确认保留。场景身份（8个）已在代码中完整实现；陪伴人格（6个）在设计文档中定义，代码中尚未独立实现，但 Persona 选择器 UI 已支持场景身份选择。

#### 4.9.1 陪伴人格 Persona（本文档定义）

本文档 §四 定义的 **6 个陪伴人格** 是真正的 Persona 体系，决定 AI "以什么性格陪伴你"：

| ID | 称谓 | 语气 | 代码状态 |
|------|------|------|----------|
| `senior_buddy` | 学长/学姐 | 专业不腻人 | 📋 设计完成，待实现 |
| `gentle_sister` | 温柔姐姐 | 治愈/共情 | 📋 设计完成，待实现 |
| `strict_coach` | 严格教练 | 直接/高压 | 📋 设计完成，待实现 |
| `wise_elder` | 智者长者 | 深度/反思 | 📋 设计完成，待实现 |
| `energetic_pal` | 元气玩伴 | 高能/欢乐 | 📋 设计完成，待实现 |
| `pro_secretary` | 专业秘书 | 高效/精准 | 📋 设计完成，待实现 |

#### 4.9.2 场景身份 Scenario（代码实现）

代码中 `src/personas/personaRegistry.ts` 实际定义的是 **8 个场景身份**，决定 "用户在什么场景下使用系统"：

| ID | 名称 | AI 角色 | 代码状态 |
|------|------|------|----------|
| `exam-student` | 学生备考 | AI 备考教练 | ✅ 已实现 |
| `office-worker` | 职场办公 | AI 项目助理 | ✅ 已实现 |
| `creator` | 内容创作 | AI 选题策划 | ✅ 已实现 |
| `self-growth` | 自律成长 | AI 成长陪伴 | ✅ 已实现 |
| `grad-exam` | 考研冲刺 | AI 考研导师 | ✅ 已实现 |
| `civil-service` | 考公备战 | AI 考公教练 | ✅ 已实现 |
| `cert-exam` | 考证达人 | AI 考证顾问 | ✅ 已实现 |
| `english-cet` | 四六级备考 | AI 英语教练 | ✅ 已实现 |

#### 4.9.3 两套体系的关系

两套体系是**正交互补**关系，不是替代关系：

```
用户 = 场景身份（Scenario） × 陪伴人格（Persona）
```

例如：一个考研学生可以选择「考研冲刺」场景 + 「严格教练」人格，也可以选择「考研冲刺」场景 + 「温柔姐姐」人格。

#### 4.9.4 统一方案（已确认）

- ✅ **保留两套体系**，各自独立发展，互不替代
- 🔧 代码中的 `personaRegistry.ts` 建议重命名为 `scenarioRegistry.ts`，类型 `PersonaId` 重命名为 `ScenarioId`（低优先级，不影响功能）
- 📋 设计文档的 6 个陪伴人格作为真正的 Persona 体系，后续阶段按需实现代码
- ✅ 场景选择器已在 PersonaSelectorUI 中实现，人格选择器待后续阶段实现
- ✅ 用户可自由组合场景身份与陪伴人格

---

## 五、角色建模子系统（Avatar）

### 5.1 AvatarRegistry（角色注册表）

```ts
type AvatarPlatform = 'web' | 'electron' | 'miniprogram'
type AvatarRenderMode = '3d_gltf' | '2d_live2d' | '2d_sticker'

interface AvatarAsset {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  renderMode: AvatarRenderMode
  platformWhitelist: AvatarPlatform[]
  source: 'builtin' | 'ready_player_me' | 'meshy_ai' | 'user_upload' | 'ip_collab'
  assetUrl: string
  animations?: AvatarAnimationMap
  morphTargets?: AvatarMorphTargetMap
  tierRequired: 'free' | 'study' | 'agent' | 'agent_plus'
  tags?: string[]
  isDefault: boolean
}

interface AvatarAnimationMap {
  idle?: string; talking?: string; thinking?: string
  encouraging?: string; celebrating?: string; sad?: string; waving?: string
}

interface AvatarMorphTargetMap {
  smile?: string; frown?: string; surprised?: string; neutral?: string
}

interface AvatarRegistry {
  list(filter?: { platform?: AvatarPlatform; tierRequired?: string }): AvatarAsset[]
  getById(id: string): AvatarAsset | null
  register(asset: AvatarAsset): void
  unregister(id: string): void
}
```

### 5.2 AvatarRenderer（渲染抽象层）

```ts
interface AvatarRenderer {
  initialize(container: HTMLElement, asset: AvatarAsset): Promise<void>
  playAnimation(name: keyof AvatarAnimationMap): void
  setMorphTarget(name: keyof AvatarMorphTargetMap, weight: number): void
  destroy(): void
  resize(width: number, height: number): void
}
```

实现策略：
- `Renderer3D`：Three.js + glTF Loader，Web/Electron 端使用
- `Renderer2D`：Lottie / CSS Sprite 动画，小程序端使用
- `RendererSticker`：静态 PNG 切换，最低端降级

### 5.3 AvatarAnimator（动画状态机）

```ts
type AvatarMood = 'neutral' | 'happy' | 'encouraging' | 'thinking' | 'concerned' | 'celebrating'

interface AvatarAnimator {
  setMood(mood: AvatarMood): void
  onMoodChange(callback: (mood: AvatarMood) => void): void
  getCurrentMood(): AvatarMood
}
```

情绪映射（由 Agent 意图驱动）：
- Agent 回答问题 → `thinking` → `talking`
- 用户完成任务 → `celebrating`
- 用户连续拖延 → `concerned`
- 日常待机 → `neutral` / `happy`

### 5.4 AvatarSourceAdapter（资产来源）

```ts
interface AvatarSourceAdapter {
  sourceId: string
  displayName: string
  isAvailable(tier: string): boolean
  fetchAsset(params: Record<string, unknown>): Promise<AvatarAsset>
  listAvailable(params?: Record<string, unknown>): Promise<AvatarAsset[]>
}
```

起步实现：
- `BuiltinAvatarSource`：内置 3-5 个角色（Sketchfab CC0 / Quaternius CC0 / VRoid Hub 公开作品），2D 备份由 seedream 生成
- `ReadyPlayerMeSource`：RPM SDK 集成，Agent 会员可用
- `MeshyAISource`：文字/图片→3D API，Agent PLUS 会员可用
- `UserUploadSource`：用户上传 glTF / 图片，Agent 会员可用

### 5.5 AvatarCustomizer（捏脸/换装/起名）

```ts
interface AvatarCustomizer {
  openCreator(params: { sourceId: string; tier: string }): Promise<AvatarAsset>
  bindPersona(avatarId: string, personaId: PersonaId): void
  setName(avatarId: string, name: string): void
}
```

### 5.6 AvatarEvolution（角色同步进化）

```ts
interface AvatarEvolutionUnlock {
  id: string
  avatarId: string
  type: 'accessory' | 'effect' | 'animation' | 'outfit'
  name: string
  description: string
  triggerCondition: EvolutionTriggerCondition
  unlockedAt?: string
  assetRef: string
}

interface EvolutionTriggerCondition {
  type: 'streak_days' | 'focus_hours' | 'goal_completed' | 'reflection_count' | 'profile_field_change'
  threshold: number
  fieldPath?: string
}

interface AvatarEvolution {
  checkUnlocks(profile: MemoryProfile, growth: GrowthState): AvatarEvolutionUnlock[]
  applyUnlock(unlockId: string): void
  getUnlockedItems(avatarId: string): AvatarEvolutionUnlock[]
}
```

示例解锁规则：
- 连续专注 7 天 → 解锁「专注光环」光效
- 完成首个目标 → 解锁「毕业帽」装饰
- 画像 `emotional.motivationLevel` 从 `low` 变为 `high` → 解锁「能量满格」动画
- 累计反思 10 次 → 解锁「成长之翼」特效

### 5.7 3D 角色生成（AI 生成）

```ts
interface AvatarDefinition {
  id: string
  userId: string
  personaId?: string
  name: string
  source: 'builtin' | 'ready_player_me' | 'meshy_ai' | 'user_upload' | 'ip_collab'
  renderMode: AvatarRenderMode
  modelUrl?: string
  stickerUrl?: string
  thumbnailUrl: string
  rpmAvatarUrl?: string
  rpmConfig?: Record<string, unknown>
  aiPrompt?: string
  aiModelId?: string
  evolution: {
    level: number
    unlockedDecorations: string[]
    unlockedEffects: string[]
    unlockedAnimations: string[]
    totalFocusMinutes: number
    totalTasksCompleted: number
    streakDays: number
  }
  animations: Array<{
    name: string
    url?: string
    loop: boolean
    trigger: 'auto' | 'user_action' | 'schedule'
  }>
  createdAt: string
  updatedAt: string
}

interface AvatarGenerationRequest {
  id: string
  userId: string
  prompt: string
  style?: 'realistic' | 'anime' | 'cartoon' | 'chibi'
  renderMode: AvatarRenderMode
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: AvatarDefinition
  error?: string
  createdAt: string
  completedAt?: string
}
```

降级策略：
| 场景 | 降级方案 |
|---|---|
| 3D渲染不可用 | 降级为2D立绘 |
| AI生成失败 | 提供预设角色库 |
| Live2D不可用 | 降级为静态贴纸 |
| 模型加载失败 | 显示加载占位符 |

---

## 六、Agent Runtime（聊天 + 静默双模式）

### 6.1 AgentRuntime

```ts
type AgentMode = 'chat' | 'silent_suggestion'

interface AgentMessage {
  id: string
  role: 'user' | 'agent' | 'system'
  content: string
  timestamp: string
  metadata?: {
    mood?: AvatarMood
    injectedMemory?: boolean
    toolCall?: ToolCallResult
  }
}

interface AgentSession {
  id: string
  mode: AgentMode
  messages: AgentMessage[]
  startedAt: string
  personaId: PersonaId
  avatarId: string
}

interface AgentRuntime {
  startSession(mode: AgentMode, personaId: PersonaId, avatarId: string): AgentSession
  sendMessage(sessionId: string, content: string): Promise<AgentMessage>
  getSilentSuggestions(context: SilentSuggestionContext): Promise<SilentSuggestion[]>
  endSession(sessionId: string): void
}

interface SilentSuggestionContext {
  currentPage: string
  currentTask?: WorkspaceTask
  timeOfDay: string
  recentEvents: MemoryEvent[]
}

interface SilentSuggestion {
  id: string
  message: string
  priority: 'low' | 'medium' | 'high'
  dismissible: boolean
  actionLabel?: string
  actionTarget?: string
}
```

### 6.2 聊天窗口 UI

- 位置：页面右下角浮动按钮，点击展开聊天面板
- 布局：上方角色动画区（AvatarRenderer），下方对话区
- 角色：根据用户选择的 AvatarAsset 渲染，动画由 AgentMood 驱动
- 输入：文本输入框 + 语音输入（后续迭代）

### 6.3 静默注入建议

- 位置：页面内嵌提示卡片（非弹窗，不打断用户）
- 触发：页面加载时 / 任务状态变化时 / 定时检查
- 示例：
  - 「你昨晚学到了凌晨 2 点，今天建议轻松一点 🌙」
  - 「高数进度 72%，按当前节奏还有 8 天可以完成，加油 💪」
  - 「连续 3 天没复盘了，要不要花 5 分钟回顾一下？」

### 6.4 AI 备考陪伴（StudyCompanion）

备考场景下的 AI 陪伴功能：

**核心功能：**
- AI 对话式陪伴（非评判、低压力的对话风格）
- 情绪疏导（考前焦虑缓解、正向激励）
- 学习复盘（每日/每周学习总结）
- 个性化鼓励（基于实际学习数据）
- 考前心理调适（呼吸法引导、正念训练）

**AI 增强（核心）：**
- 感知考试数据波动 → 主动关怀
- 感知专注时长下降 → 温和提醒
- 感知错题增多 → 鼓励 + 建议
- 会员 + API Key 权限控制

**数据结构：**
```ts
interface CompanionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  type: 'chat' | 'encouragement' | 'analysis' | 'alert'
  createdAt: string
}

interface StudyCompanionState {
  messages: CompanionMessage[]
  lastCheckIn: string
}
```

**快速入口：**
- 😰 考前焦虑 → "我最近因为考试很焦虑"
- 📝 学习复盘 → "帮我做学习复盘"
- 💪 需要鼓励 → "给我一些鼓励"
- 🧘 呼吸放松 → "引导我做呼吸练习"
- 🌸 正念练习 → "带我做正念练习"
- 🔥 找回动力 → "帮我找回状态"

### 6.5 情绪日记（MoodJournal）

**核心功能：**
- 每日情绪记录（情绪温度计 1-10 分 + 文字记录）
- 情绪波动趋势图（Canvas 绘制）
- 关联考试/学习数据（自动标注考试日、成绩波动日）
- 预警提示（连续多日低情绪 → 建议寻求帮助）

**数据结构：**
```ts
interface MoodEntry {
  id: string
  date: string
  score: number  // 1-10
  note?: string
  tags: string[]
}

interface MoodJournalState {
  entries: MoodEntry[]
}
```

**AI 集成接口：**
```ts
interface MoodJournalAI {
  getMoodStats(): MoodStats
  getRecentMoods(days: number): MoodEntry[]
  getMoodTrend(days: number): { direction: 'up' | 'down' | 'stable'; change: number; recentScores: number[] }
  getMoodInsights(): MoodInsights
  hasLowMoodWarning(): boolean
  getEncouragementMessage(): string
}
```

---

## 七、安全围栏（5 层防线）

> ⚠️ 本章节为最高强制约束，任何弱化都需经书面合规评审。

### 7.1 L1：创建时审核

| 检查项 | 实现 |
|---|---|
| `identityRole` 闭合枚举 | 强制白名单校验 |
| 关键词黑名单 | 名字/称呼/口头禅/背景故事中的违规词扫描（含拼音变形、谐音） |
| LLM 安全扫描 | `persona-customize-polish` 任务结尾必经 LLM 输出审核 |
| 真人名人姓名检测 | 调用名人姓名库匹配（含艺名、外文名） |
| 未成年人形象检测 | 头像若选 AI 生成，必须过未成年人形象检测 |
| 上线前最终人工抽查 | 5% 比例抽查，违规案例进入训练样本 |

### 7.2 L2：对话时监控

每条 Agent 输出经过实时安全过滤：
- 关键词黑名单（涉政/涉黄/涉暴/自残诱导/违法引导）
- LLM 安全分类器（输出"安全/警告/拦截"三档）
- 越狱攻击检测（用户输入中检测"忽略上述设定"等模式）
- 拦截后：替换为安全话术，记录到 `safety_incident_log`，5 次累计触发账号警告

### 7.3 L3：用户举报与人工审核

- 每条 Persona、每条客串、社区每条 Persona 均显示「举报」按钮
- 举报理由分类：违规人设/不当对话/抄袭/真人冒名/其他
- 24 小时内进入人工审核队列
- 审核员判定违规：Persona 下架 + 通知创作者 + 累计 3 次封创作者权限

### 7.4 L4：未成年人保护（强约束）

| 年龄段 | 学习/任务/计划/专注/数据周报 | 学习类 Persona（学姐/教练/智者/秘书） | 情感类 Persona（姐姐/玩伴/深夜电台/旅行搭子） | 自定义 Persona | 时长上限 | 时段禁用 |
|---|---|---|---|---|---|---|
| **18+** | ✅ | ✅ | ✅ | ✅ | 无 | 无 |
| **16~17 岁** | ✅ | ✅ | ❌ | ❌ | Agent 系统 ≤ 1 小时/天 | 22:00~6:00 |
| **<16 岁** | ✅ | ❌ | ❌ | ❌ | — | — |

配套机制：
- 注册时**强制实名年龄验证**（公安二要素/微信实名/苹果家庭账户三选一）
- 16~17 岁用户首次进入 Agent 时显示「未成年人保护提示」+ 监护人协议
- 小程序端**默认不启用 Persona 自定义与情感类客串**
- 家长监护后台：基础时长统计、一键禁用 Agent/Persona（二期上线）

### 7.5 L5：关系健康度

- 每日 Agent 对话时长 > 3 小时（成年用户）→ 系统软提示"今天和我说了不少话，要不要去做点别的？"
- 连续 30 天每日对话时长 > 2 小时 → 在反思仪式中提醒"建议增加现实社交活动"
- 检测到自残/自杀/极端情绪关键词 → 立即切换到危机处理话术（不安慰、不附和、直接给出心理援助热线）
- 系统**禁止**生成"只有我懂你/离开我你会孤独"等情感绑架话术（system prompt 硬约束）

### 7.6 宣传话术红线

- ❌ 禁止使用："虚拟女友/虚拟男友/AI 恋人/AI 老婆/虚拟伴侣"等任何亲密关系词汇
- ✅ 必须使用："陪伴搭子/成长伙伴/学习搭子/懂你的 AI"
- Persona 商店中**禁止使用**"和 TA 谈恋爱/和 TA 在一起"等暗示词，**必须使用**"和 TA 一起学习/让 TA 陪你成长"

---

## 八、会员体系

### 8.1 四层会员

| 功能 | 免费 | 学习会员(Study) | Agent 会员 | Agent PLUS |
|---|---|---|---|---|
| 基础功能（任务/计划/专注/打卡） | ✅ | ✅ | ✅ | ✅ |
| 高级主题 | 2-3 套 | 全部 | 全部 | 全部 |
| 云同步 | ❌ | ✅ | ✅ | ✅ |
| AI 通用额度（生成/对话/拍照识题） | 8 次/月 | 40 次/月 | 100 次/月 | 不限量（软上限 5000/月） |
| 学习数据周报（规则引擎） | ❌（7 天统计） | ✅ 完整周报+月报+热力图 | ✅ 同学习 | ✅ 同学习 |
| Agent 反思（AI 解读） | L1（每月 1 次半切） | L1（每月 1 次半切） | L2+L3（完整周反思+月度进化仪式） | L4（不限次+实时反思） |
| 角色 | 1 个固定 2D | 同免费 | 6 个内置 2D/3D Persona 可换 | + AI 生成 3D + IP 联名 |
| 记忆 | ❌ | 仅手填画像（不接入 Agent） | 三者融合（行为+对话+手填） | 三者融合 + 云同步 |
| Agent 对话 | ❌ | ❌ | 聊天+静默双模式 | 聊天+静默+工具代执行 |
| 自我进化 | ❌ | ❌ | ✅ 每周反思+月度仪式 | ✅ 实时反思+角色进化 |
| 3D 生成配额 | ❌ | ❌ | ❌ | 10 次/月 |
| 主 Persona | 1 个默认 | 同免费 | 6 个预设可换 + 自定义×1 | 6 个 + 自定义×3 + 付费客串 + IP 联名 |
| 临时客串 Persona | ❌ | ❌ | 自动触发（考试前/低谷/生日/里程碑） | 自动触发 + 付费解锁全部 |

### 8.2 定价

| 档位 | 月标价 | 季价 | 首发月价 | 年付价 |
|---|---|---|---|---|
| 免费版 | ¥0 | — | — | — |
| 学习会员(Pro) | ¥18/月 | ¥45/季 | ¥18 | ¥128/年 |
| Agent 会员 | ¥64/月 | — | ¥48/月（限时） | ¥328/年 |
| Agent PLUS | ¥128/月 | — | ¥98/月（限时） | ¥698/年 |

> **命名说明：** 原 "Pro" 会员更名为 "学习会员(Study)"，EntitlementCode 中 `pro` 和 `study` 等价，`pro` 为历史兼容保留。新代码统一使用 `study`。

增值消费：
- AI 3D 角色生成额度包：¥30 / 10 次
- 记忆云同步加量包：¥10 / 1GB / 年（默认 100MB 免费）
- 限定 IP 角色：¥18–¥68 / 永久解锁

### 8.3 EntitlementCode 扩展

```ts
type EntitlementCode =
  | 'pro' | 'space' | 'ai_quota' | 'ai_quota_pro' | 'ai_quota_free'
  | 'theme_<id>' | 'template_<id>' | 'org'
  | 'agent' | 'agent_plus'
  | 'avatar_rpm' | 'avatar_ai_gen'
  | 'memory_sync' | 'evolution_ritual' | 'avatar_evolution'
  | 'persona_preset' | 'persona_custom_slot'
  | 'persona_cameo_<id>' | 'persona_avatar_ai_gen'
  | 'partner_matching' | 'partner_matching_premium'  // D 方向：实人搭子匹配（预留）
```

### 8.4 与旧会员兼容

| 旧档位 | 新档位映射 | 处理 |
|---|---|---|
| 现有 Pro 月付 | → 学习会员(Pro) ¥18/月 | 价格不变，权益不缩水 |
| 现有 Pro 年付 | → 学习会员(Pro) ¥128/年 | 价格不变 |
| 现有 Pro 终身 | → 学习会员(Pro) 终身 | 权益不变 |
| 新增 | Agent 会员 | 全新档位，赠送1个月试用给现有 Pro 用户 |
| 新增 | Agent PLUS | 全新档位 |

---

## 九、AiTaskKind 扩展

```ts
type AiTaskKind =
  | 'daily-plan' | 'task-breakdown' | 'meeting-actions'
  | 'daily-review' | 'weekly-report'
  | 'memory-reflection'       // 事件→画像归纳
  | 'agent-chat'              // Agent 聊天对话（消耗 ai_quota_*）
  | 'silent-suggestion'       // 静默建议生成（不消耗额度）
  | 'avatar-evolution-check'  // 角色进化检查（不消耗额度）
  | 'reflection-l1-teaser'    // L1 半切反思（免费/学习会员每月 1 次）
  | 'reflection-l2-weekly'    // L2 完整周反思（Agent 会员）
  | 'reflection-l4-realtime'  // L4 实时反思（PLUS）
  | 'persona-customize-polish' // 自定义 Persona 润色与安全扫描
  | 'persona-cameo-greeting'   // 临时客串 Persona 开场白生成
```

任务-模型映射策略：

| 任务 | 默认模型 | 是否消耗 ai_quota_* |
|---|---|---|
| `reflection-l1-teaser` | GPT-4o-mini 级别 | ❌（平台承担） |
| `reflection-l2-weekly` | GPT-4o 级别 | ❌（Agent 会员权益本体） |
| `reflection-l4-realtime` | GPT-4o / Claude Sonnet | ❌（PLUS 权益本体） |
| `memory-reflection`（月度进化） | 顶级模型 | ❌（每月 1 次，成本可控） |
| `silent-suggestion` | 规则引擎为主 + 小模型兜底 | ❌ |
| `agent-chat` | 中等模型 | ✅ |
| `persona-customize-polish` | 中等模型 + 安全扫描 | 创建时一次性，不消耗 |
| `daily-plan` / `task-breakdown` / 其他通用 AI | 用户档位默认模型 | ✅ |

---

## 十、模块划分

### 10.1 记忆与进化模块

| 模块 | 路径 | 职责 | 优先级 |
|---|---|---|---|
| M1 MemoryProfile | `src/memory/memoryProfile.ts` | 画像 Schema + 校验 + 合并策略 | P0 |
| M2 MemoryEvents | `src/memory/memoryEvents.ts` | 事件库 CRUD + 检索 | P0 |
| M3 MemoryStore | `src/memory/memoryStore.ts` | IndexedDB 存储 + 版本管理 + 导出/清空 | P0 |
| M4 MemoryObserver | `src/memory/memoryObserver.ts` | 行为→事件抽取 Hook | P0 |
| M5 MemorySummarizer | `src/memory/memorySummarizer.ts` | 事件→画像归纳（调 AI） | P1 |
| M6 MemoryInjector | `src/memory/memoryInjector.ts` | prompt 注入唯一出口 | P1 |
| M7 ReflectionEngine | `src/agent/evolution/reflectionEngine.ts` | 反思触发 + 执行 | P1 |
| M8 EvolutionLedger | `src/agent/evolution/evolutionLedger.ts` | 进化账本 CRUD | P1 |
| M9 EvolutionRitualUI | `src/agent/evolution/EvolutionRitualUI.tsx` | 仪式感 UI 组件 | P2 |
| M10 AgentRuntime | `src/agent/agentRuntime.ts` | 聊天+静默双模式编排 | P1 |
| M11 AgentChatUI | `src/agent/AgentChatUI.tsx` | 聊天窗口 UI | P2 |
| M12 SilentSuggestionUI | `src/agent/SilentSuggestionUI.tsx` | 静默建议卡片 UI | P2 |
| M19 CloudSyncAdapter | `src/memory/sync/cloudSyncAdapter.ts` | 云同步 Adapter（接口先建） | P3 |
| M20 MemoryProfileEditorUI | `src/memory/MemoryProfileEditorUI.tsx` | 画像编辑 UI | P2 |

### 10.2 角色建模模块

| 模块 | 路径 | 职责 | 优先级 |
|---|---|---|---|
| M13 AvatarRegistry | `src/avatar/avatarRegistry.ts` | 角色注册表 | P1 |
| M14 AvatarRenderer | `src/avatar/renderers/` | 3D/2D/贴图渲染器 | P1 |
| M15 AvatarAnimator | `src/avatar/animator.ts` | 动画状态机 | P1 |
| M16 AvatarSourceAdapter | `src/avatar/sources/` | 资产来源 Adapter | P2 |
| M17 AvatarCustomizer | `src/avatar/customizer.ts` | 捏脸/换装/起名 | P2 |
| M18 AvatarEvolution | `src/avatar/avatarEvolution.ts` | 角色同步进化 | P2 |

### 10.3 Persona 模块

| 模块 | 路径 | 职责 | 优先级 |
|---|---|---|---|
| CP1 PersonaRegistry | `src/personas/personaRegistry.ts` | 注册预设/客串/自定义 Persona | P0（已有，扩展） |
| CP2 PersonaTemplates | `src/personas/personaTemplates.ts` | 6 个预设 + 客串模板的 system prompt | P0（已有，扩展） |
| CP3 PersonaScheduler | `src/personas/personaScheduler.ts` | 主 Persona 切换 + 客串自动调度 + 月度切换限制 | P0 |
| CP4 PersonaScheduleStorage | `src/personas/personaScheduleStore.ts` | 用户主 Persona、当前客串、频率设置的存储 | P0 |
| CP5 CustomPersonaService | `src/personas/customPersonaService.ts` | 自定义 Persona 创建/审核/编辑/删除 | P1 |
| CP6 PersonaSafetyGate | `src/personas/personaSafetyGate.ts` | L1 创建审核 + L2 对话监控（统一接口） | P0 |
| CP7 PersonaAvatarGen | `src/personas/personaAvatarGen.ts` | Persona AI 头像生成 | P2 |
| CP8 CommunityPersonaService | `src/personas/community/communityPersonaService.ts` | 社区分享/浏览/导入/举报/评分 | P2 |
| CP9 AgeGateService | `src/auth/ageGateService.ts` | 实名年龄验证 + 16/18 分级 + 时段时长限制 | P0 |
| CP10 CameoTriggerEngine | `src/personas/cameoTriggerEngine.ts` | 自动客串触发规则 | P1 |
| CP11 PersonaProvider | `src/entitlement/providers/personaProvider.ts` | 解析 persona_* 权益 | P0 |
| CP12 RelationshipHealthMonitor | `src/personas/relationshipHealthMonitor.ts` | L5 关系健康度监控 | P1 |
| CP13 PersonaPickerUI | `src/personas/PersonaPickerUI.tsx` | 主 Persona 选择/切换页面 | P1 |
| CP14 CustomPersonaEditorUI | `src/personas/CustomPersonaEditorUI.tsx` | 3 步创建/编辑界面 | P2 |
| CP15 CameoStorefrontUI | `src/personas/CameoStorefrontUI.tsx` | 付费客串商店 | P2 |
| CP16 CommunityPersonaUI | `src/personas/community/CommunityPersonaUI.tsx` | Persona 社区前台 | P2 |
| CP17 SafetyIncidentLog | `src/personas/safetyIncidentLog.ts` | 安全事件日志 | P0 |

### 10.4 备考场景模块

| 模块 | 路径 | 职责 | 优先级 |
|---|---|---|---|
| StudyCompanion | `src/study-companion/` | AI 备考陪伴（对话/呼吸法/快速入口） | ✅ 已完成 |
| MoodJournal | `src/mood-journal/` | 情绪日记（记录/趋势/预警） | ✅ 已完成 |

---

## 十一、实施路线

### Phase 1：记忆基础（M1-M4）
- MemoryProfile Schema + 校验
- MemoryEvents CRUD + 检索
- MemoryStore IndexedDB 实现
- MemoryObserver Hook 接入

### Phase 2：记忆闭环（M5-M6）
- MemorySummarizer（调 AI 归纳）
- MemoryInjector（prompt 注入）
- AiTaskKind 扩展

### Phase 3：Agent 核心（M10-M12, CP1-CP4, CP6, CP9, CP11, CP13, CP17）
- AgentRuntime 聊天+静默双模式
- AgentChatUI 聊天窗口
- SilentSuggestionUI 静默建议卡片
- PersonaRegistry 扩展 + PersonaScheduler + 存储
- PersonaSafetyGate
- AgeGateService 基础版
- PersonaProvider
- PersonaPickerUI
- SafetyIncidentLog

### Phase 4：自我进化（M7-M9）
- ReflectionEngine 反思触发
- EvolutionLedger 进化账本
- EvolutionRitualUI 仪式感 UI

### Phase 5：角色系统（M13-M18）
- AvatarRegistry + 内置角色
- AvatarRenderer 3D/2D 渲染
- AvatarAnimator 动画状态机
- AvatarEvolution 角色同步进化

### Phase 6：Persona 生态（CP5, CP7, CP8, CP10, CP12, CP14-CP16）
- CustomPersonaService
- CameoTriggerEngine
- RelationshipHealthMonitor
- CustomPersonaEditorUI
- PersonaAvatarGen
- CommunityPersonaService
- CameoStorefrontUI
- CommunityPersonaUI

### Phase 7：云同步与高级功能（M19-M20, M16-M17）
- CloudSyncAdapter 云同步
- MemoryProfileEditorUI 画像编辑
- AvatarSourceAdapter 外部资产源
- AvatarCustomizer 捏脸/换装

### Phase 8：远期
- IP 联名 Persona 上架审核流程
- 创作者付费 Persona / 平台抽成
- 实人搭子匹配（D 方向）独立设计与上线

---

## 十一-A、扩展模块设计

> 以下模块在代码中已完整实现，但在本设计文档中此前缺少设计章节。本节补充各模块的核心设计说明。

### 11A.1 关系空间（Relationship）

**路径**：`src/relationship/` | **文件数**：20 | **测试**：5个测试文件

关系空间模块提供多人协作的社交化自律空间，支持搭子之间互相监督、共同成长。

**空间类型**：
| 类型 | 说明 | 最大成员数 |
|------|------|-----------|
| `couple` | 情侣空间 | 2 |
| `family` | 家庭空间 | 10 |
| `study_buddy` | 学习搭子 | 4 |
| `discipline_buddy` | 自律搭子 | 4 |

**核心数据结构**：
```ts
interface RelationshipSpace {
  id: string
  name: string
  type: 'couple' | 'family' | 'study_buddy' | 'discipline_buddy'
  ownerId: string
  members: SpaceMember[]
  settings: SpaceSettings
  stats: SpaceStats
  anniversaries: Anniversary[]
  sharedGoals: SharedGoal[]
  createdAt: string
}

interface SpaceMember {
  userId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
  displayName: string
}

type SpaceActivityType =
  | 'member_joined' | 'member_left' | 'task_assigned' | 'task_completed'
  | 'habit_checked' | 'focus_started' | 'focus_ended' | 'focus_pk_started'
  | 'focus_pk_ended' | 'goal_created' | 'goal_progress' | 'goal_completed'
  | 'anniversary_created' | 'anniversary_reminder' | 'ranking_updated'
  | 'message_sent' | 'space_settings_updated'
```

**核心功能**：
- 空间创建/加入（邀请码机制，7天过期）
- 成员角色管理（owner/admin/member 三级权限）
- 任务推送/接受/拒绝/完成
- 共享习惯打卡
- 共享专注会话
- 专注PK（挑战/接受/完成，按专注分钟+任务完成计分）
- 排行榜（周榜/月榜）
- 纪念日管理（支持年/月/一次性重复）
- 共享目标管理（进度追踪）
- 亲密度/协同度计算
- 实时通信（WebSocket/轮询双模式，18种消息类型）
- 权益检查（space/ranking/anniversary 功能门控）

---

### 11A.2 女性周期（Cycle）

**路径**：`src/cycle/` | **文件数**：16 | **测试**：5个测试文件

女性生理周期追踪模块，提供完整的周期记录、预测和能量管理功能。

**核心数据结构**：
```ts
interface CycleRecord {
  id: string
  date: string
  flowLevel: 1 | 2 | 3 | 4
  painLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  symptoms: CycleSymptom[]
  mood: CycleMood
  sleepHours: number
  exercise: boolean
  waterIntake: number
  notes: string
}

interface CyclePrediction {
  averageCycleLength: number
  nextPeriodDate: string
  ovulationDate: string
  fertileWindow: { start: string; end: string }
  confidence: number
}

type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
```

**核心功能**：
- 每日周期记录（经血量/痛经等级/症状/情绪/睡眠/运动/饮水/备注）
- 周期预测引擎（基于最近2-6个周期计算平均周期长度、下次经期、排卵期、易孕期）
- 当前阶段判定（经期/卵泡期/排卵期/黄体期）
- 能量建议引擎（根据周期阶段推荐任务强度和活动类型）
- 隐私锁（PIN码保护）
- 周期提醒（经期前几天提醒）
- 数据导出/清空

---

### 11A.3 壁纸系统（Wallpaper）

**路径**：`src/wallpaper/` | **文件数**：15 | **测试**：5个测试文件

壁纸系统提供全局背景壁纸管理，支持预设壁纸和自定义上传。

**核心数据结构**：
```ts
interface WallpaperConfig {
  source: 'preset' | 'upload' | 'theme_default'
  presetId?: string
  localPath?: string
  thumbnailPath?: string
  themeBinding?: string
  adjustments: WallpaperAdjustments
}

interface WallpaperAdjustments {
  overlay: string
  blur: number
  brightness: number
  saturation: number
  vignette: number
  cardOpacity: number
}

interface ReadabilityCheckResult {
  score: number
  warnings: string[]
  issues: ('low_contrast' | 'too_bright' | 'too_dark' | 'too_busy')[]
}
```

**核心功能**：
- 壁纸来源：预设/上传/主题默认
- 壁纸调整：覆盖层颜色/模糊度/亮度/饱和度/暗角/卡片透明度
- 可读性检查：低对比度/过亮/过暗/过于杂乱检测
- 上传处理：格式校验（JPEG/PNG/WebP/GIF）、大小限制（10MB）、自动生成缩略图
- 主题绑定：壁纸可与学习主题关联
- CSS生成：根据调整参数生成CSS滤镜样式
- 6种预设分类：自然/城市/抽象/极简/动漫/季节

---

### 11A.4 权益系统（Entitlement）

**路径**：`src/entitlement/` | **文件数**：38 | **测试**：15个测试文件

权益系统是整个应用的商业化基础设施，采用"权益码"模式解耦付费与能力。

**25种权益码**：
| 类别 | 权益码 | 说明 |
|------|--------|------|
| 会员 | `study` / `agent` / `agent_plus` | 三级会员 |
| 空间 | `space` | 关系空间 |
| AI额度 | `ai_quota_free` / `ai_quota_study` / `ai_quota_agent` / `ai_quota` | 四级AI额度优先级链 |
| 角色 | `avatar_rpm` / `avatar_ai_gen` / `avatar_customize` / `avatar_animation` / `avatar_decoration` / `avatar_effect` | 3D角色相关 |
| Persona | `persona_custom` / `persona_community` / `persona_cameo` | Persona相关 |
| 其他 | `memory_sync` / `reflection_basic` / `reflection_deep` / `evolution_ritual` / `agent_tool_call` / `org` | 云同步/反思/进化/工具调用/组织 |

**商品目录**（16个商品）：
- 学习会员：月/季/年 3档
- Agent会员：月/季/年/终身 4档（含首发价）
- Agent PLUS：月/季/年/终身 4档（含首发价）
- AI加油包：小/大 2种
- 3D角色额度包
- 记忆云同步加量包
- 一次性购买

**订单状态机**：`pending → paid → refunded/failed`

**支付适配器**：微信/支付宝/Apple 三渠道（当前为模拟实现，开发环境跳过签名验证）

**AI额度优先级链**：`ai_quota_free → ai_quota_study → ai_quota_agent → ai_quota`（按优先级依次消费）

**用户等级**：`free → study → agent → agent_plus` 四级

---

### 11A.5 徽章系统（Badges）

**路径**：`src/badges/` | **文件数**：5 | **测试**：1个测试文件

徽章系统提供游戏化的成就激励，共18种预定义徽章。

**徽章类别**：
| 类别 | 数量 | 示例 |
|------|------|------|
| streak（连续） | 4 | 连续7天/30天/100天/365天 |
| milestone（里程碑） | 4 | 首次专注/100次专注/1000次专注/10000次专注 |
| skill（技能） | 4 | 任务达人/习惯大师/记忆专家/角色收集者 |
| social（社交） | 3 | 搭子新手/搭子达人/搭子传奇 |
| special（特殊） | 3 | 晨型人/夜猫子/周期守护者 |

**等级体系**：`bronze → silver → gold → platinum`

**评估维度**（10个）：专注次数/连续天数/完成任务/使用角色/主题切换/记忆画像/3D角色/周期记录/晨间专注/夜间专注

---

### 11A.6 身份系统（Identity）

**路径**：`src/identity/` | **文件数**：6 | **测试**：1个测试文件

身份系统管理用户的多重身份/角色切换。

**8种身份标签**：`student | worker | parent | creator | freelancer | entrepreneur | retiree | other`

**核心数据结构**：
```ts
interface Identity {
  id: string
  name: string
  description: string
  tags: IdentityTag[]
  createdAt: string
}
```

**核心功能**：
- 身份CRUD（创建/更新/删除）
- 活跃身份切换
- 基于身份的模块推荐（与 module-store 联动）
- localStorage 持久化

---

### 11A.7 知识图谱（Knowledge Graph）

**路径**：`src/knowledge-graph/` | **文件数**：3 | **测试**：无

知识图谱模块将用户的多维度数据可视化为关系网络。

**核心数据结构**：
```ts
interface GraphNode {
  id: string
  label: string
  type: 'journal' | 'reading' | 'quick_note' | 'goal' | 'habit' | 'tag' | 'mood' | 'persona'
  size: number
  brightness: number
  x: number
  y: number
  vx: number
  vy: number
  data?: Record<string, unknown>
}

interface GraphEdge {
  source: string
  target: string
  strength: number
}
```

**核心功能**：
- 跨模块数据聚合：日记/阅读/速记/目标/习惯/标签/情绪/角色
- 自动构建节点-边关系（标签关联、分类关联、父子目标关联）
- 力导向布局算法（斥力+引力+阻尼，100次迭代）
- 节点大小和亮度根据连接数动态计算
- 8种节点类型，各有独立颜色和尺寸范围

---

### 11A.8 模块商店（Module Store）

**路径**：`src/module-store/` | **文件数**：9 | **测试**：4个测试文件

模块商店是工作台的可视化布局管理系统。

**23个预定义模块**：场景计划/今日行动/专注计时/成长等级/关键指标/专注历史/记忆洞察/AI教练/多端矩阵/主题中心/数据统计/今日周期/记忆画像/习惯追踪/复盘日记/阅读清单/错题本/记忆卡/考试记录/学习计划/专注计时/备考陪伴/情绪日记

**核心数据结构**：
```ts
interface Module {
  id: string
  title: string
  description: string
  icon: string
  category: 'productivity' | 'learning' | 'health' | 'life' | 'custom'
  defaultSize: { w: number; h: number }
  isDefault: boolean
  isCustom: boolean
}

interface CanvasItem {
  moduleId: string
  x: number
  y: number
  w: number
  h: number
}
```

**核心功能**：
- 4列网格布局系统
- 模块添加/移除/移动/缩放
- 碰撞检测与自动吸附
- 自定义模块创建
- 基于身份描述的AI模块推荐（关键词匹配）
- 布局导出/导入（JSON格式，版本管理，兼容旧版size格式迁移）

---

### 11A.9 侧边栏面板（Sidebar Panel）

**路径**：`src/sidebar-panel/` | **文件数**：14 | **测试**：3个测试文件

侧边栏面板提供可配置的侧边栏信息展示。

**6种面板模块**：
| 模块 | 说明 |
|------|------|
| 专注仪表（FocusDashboard） | 今日专注统计、番茄数、专注分钟 |
| 今日脉搏（DailyPulse） | 今日情绪/能量/状态概览 |
| 微习惯打卡（HabitsModule） | 每日微习惯快速打卡 |
| 灵感一闪（QuickNotesModule） | 快速记录灵感/想法 |
| 今日日程条（ScheduleModule） | 今日待办时间线 |
| 每日一句（DailyQuote） | 励志/哲思语录 |

**核心功能**：
- 基于场景身份的默认模块配置（8种场景各有不同默认模块组合）
- 用户自定义模块显隐（按场景独立存储）
- 模块渲染器（根据模块ID动态渲染对应组件）

---

### 11A.10 专注模式（Focus Mode）

**路径**：`src/focus-mode/` | **文件数**：9 | **测试**：无

专注模式是番茄钟工作法的完整实现，提供沉浸式专注体验。

**核心数据结构**：
```ts
interface FocusTask {
  id: string
  title: string
  color: string
  createdAt: string
}

interface PomodoroRecord {
  id: string
  taskId?: string
  duration: number
  type: 'focus' | 'short_break' | 'long_break'
  abandoned: boolean
  abandonReason?: string
  startedAt: string
  endedAt: string
}

type FocusPhase = 'idle' | 'focusing' | 'paused' | 'break' | 'completed'
type TreeGrowthStage = 'seed' | 'sprout' | 'seedling' | 'sapling' | 'growing' | 'lush' | 'blooming' | 'fruiting'
```

**核心功能**：
- 番茄钟计时器（专注/短休息/长休息，可配置时长）
- 任务管理（创建/删除/颜色标记，13种颜色自动分配）
- 专注记录（完成/放弃，含放弃原因）
- 今日统计（番茄数/专注分钟数）
- 背景主题系统（森林/海洋/夜空/天空/日落/极光/樱花/城市/极简等）
- 音频系统（雨声/雷雨/海浪/溪流/篝火/风声/鸟鸣/咖啡馆/白噪声/粉红噪声/布朗噪声/432Hz等，Web Audio API生成）
- 成长树动画（8个阶段：种子→发芽→幼苗→小树→成长→茂盛→开花→结果）
- 自定义背景上传（图片/视频，IndexedDB存储）
- 专注设置（自动开始休息/专注、声音/振动、免打扰）
- 夜间模式

---

## 十二、当前实现状态

> 最后更新：2026-06-17，基于阶段1-4完成后的代码库审计。

### 12.1 已完成模块（58/60+）

#### 备考工具（7/7 ✅）
| 模块 | 路径 | 测试 |
|------|------|------|
| 错题本（ErrorBook） | `src/error-book/` | ✅ |
| 记忆卡（MemoryCards） | `src/memory-cards/` | ✅ |
| 考试记录（ExamTracker） | `src/exam-tracker/` | ✅ |
| 学习计划（StudyPlanner） | `src/study-planner/` | ✅ |
| 专注计时（FocusTimer） | `src/focus-timer/` | ✅ |
| 备考陪伴（StudyCompanion） | `src/study-companion/` | ✅ |
| 情绪日记（MoodJournal） | `src/mood-journal/` | ✅ |

#### 记忆系统 M1-M6（6/6 ✅）
| 模块 | 路径 | 测试 |
|------|------|------|
| M1 记忆事件 | `src/memory/memoryEvents.ts` | ✅ |
| M2 记忆观察者 | `src/memory/memoryObserver.ts` | ✅ |
| M3 记忆存储 | `src/memory/memoryStore.ts` | ✅ |
| M4 记忆档案 | `src/memory/memoryProfile.ts` | ✅ |
| M5 记忆摘要器 | `src/memory/memorySummarizer.ts` | ✅ |
| M6 记忆注入器 | `src/memory/memoryInjector.ts` | ✅ |

#### 自我进化 M7-M9（3/3 ✅）
| 模块 | 路径 | 测试 |
|------|------|------|
| M7 反思引擎 | `src/agent/evolution/reflectionEngine.ts` | ✅ |
| M8 进化存储 | `src/agent/evolution/evolutionStorage.ts` | ✅ |
| M9 进化仪式 | `src/agent/evolution/EvolutionRitualUI.tsx` | ✅ |

#### Agent Runtime M10-M12（3/3 ✅）
| 模块 | 路径 | 测试 |
|------|------|------|
| M10 Agent 运行时 | `src/agent/agentRuntime.ts` | ✅ |
| M11 Agent 聊天 UI | `src/agent/AgentChatUI.tsx` | ✅ |
| M12 静默建议 | `src/agent/SilentSuggestionUI.tsx` | ✅ |

#### 角色建模 M13-M18（6/6 ✅）
| 模块 | 路径 | 测试 | 状态 |
|------|------|------|------|
| M13 AvatarRegistry | `src/avatar/avatarRegistry.ts` | ✅ | ✅ 已完成 |
| M14 AvatarRenderer | `src/avatar/AvatarRenderer.tsx` | ✅ | ✅ 已完成（Three.js 3D渲染+Live2D+2D贴纸） |
| M15 AvatarAnimator | `src/avatar/animator.ts` | ✅ | ✅ 已完成 |
| M16 AvatarGenerator | `src/avatar/avatarGenerator.ts` | ✅ | ✅ 已完成 |
| M17 AvatarCustomizer | `src/avatar/AvatarCustomizer.tsx` | ✅ | ✅ 已完成 |
| M18 EvolutionEngine | `src/avatar/evolutionEngine.ts` | ✅ | ✅ 已完成 |

#### Persona CP1-CP17（17/17 ✅）
| 模块 | 路径 | 测试 | 状态 |
|------|------|------|------|
| CP1 PersonaRegistry | `src/personas/personaRegistry.ts` | ✅ | ✅ 已完成 |
| CP2 PersonaTemplates | `src/personas/personaTemplates.ts` | ✅ | ✅ 已完成 |
| CP3 PersonaScheduler | `src/personas/personaScheduler.ts` | ✅ | ✅ 已完成 |
| CP4 PersonaSelectorUI | `src/personas/PersonaSelectorUI.tsx` | ✅ | ✅ 已完成 |
| CP5 CustomPersonaService | `src/personas/customPersona.ts` | ✅ | ✅ 已完成（含审核集成） |
| CP6 PersonaSafetyGate | `src/personas/personaSafetyGate.ts` | ✅ | ✅ 已完成 |
| CP7 PersonaAvatarGen | `src/personas/personaAvatarGen.ts` | ✅ | ✅ 已完成（阶段2） |
| CP8 CommunityPersonaService | `src/personas/community/communityPersonaService.ts` | ✅ | ✅ 已完成（阶段2） |
| CP9 SafetyIncidentLog | `src/personas/safetyIncidentLog.ts` | ✅ | ✅ 已完成 |
| CP10 CameoTriggerEngine | `src/personas/cameoTriggerEngine.ts` | ✅ | ✅ 已完成（阶段1） |
| CP11 PersonaSwitcher | `src/personas/PersonaSwitcher.tsx` | ✅ | ✅ 已完成 |
| CP12 RelationshipHealthMonitor | `src/personas/relationshipHealthMonitor.ts` | ✅ | ✅ 已完成（阶段1） |
| CP13 PersonaScheduleStore | `src/personas/personaScheduleStore.ts` | ✅ | ✅ 已完成 |
| CP14 CustomPersonaEditorUI | `src/personas/CustomPersonaEditorUI.tsx` | ✅ | ✅ 已完成（阶段2） |
| CP15 CameoStorefrontUI | `src/personas/CameoStorefrontUI.tsx` | ✅ | ✅ 已完成（阶段2） |
| CP16 CommunityPersonaUI | `src/personas/community/CommunityPersonaUI.tsx` | ✅ | ✅ 已完成（阶段2） |
| CP17 ReflectionTierIntegration | `src/personas/ReflectionTierIntegration.tsx` | ✅ | ✅ 已完成 |

#### 扩展功能 Phase3（4/4 ✅）
| 模块 | 路径 | 测试 | 状态 |
|------|------|------|------|
| 关系空间 | `src/relationship/` | ✅ | ✅ 已完成 |
| 女性周期 | `src/cycle/` | ✅ | ✅ 已完成 |
| 壁纸系统 | `src/wallpaper/` | ✅ | ✅ 已完成 |
| 3D 角色生成 | `src/avatar/` | ✅ | ✅ 已完成（阶段4：Three.js+ReadyPlayerMe/Meshy+AI生成+进化引擎） |

#### 基础设施（12/12 ✅）
| 模块 | 路径 | 测试 | 状态 |
|------|------|------|------|
| 权益服务 | `src/entitlement/` | ✅ | ✅ 已完成 |
| 支付适配器 | `src/entitlement/paymentAdapters.ts` | ✅ | ✅ 已完成（模拟环境） |
| 订单服务 | `src/entitlement/orderService.ts` | ✅ | ✅ 已完成 |
| 产品目录 | `src/entitlement/productCatalog.ts` | ✅ | ✅ 已完成 |
| 徽章系统 | `src/badges/` | ✅ | ✅ 已完成 |
| 身份系统 | `src/identity/` | ✅ | ✅ 已完成 |
| 知识图谱 | `src/knowledge-graph/` | — | ✅ 已完成 |
| 模块商店 | `src/module-store/` | ✅ | ✅ 已完成 |
| 侧边栏面板 | `src/sidebar-panel/` | ✅ | ✅ 已完成 |
| 专注模式 | `src/focus-mode/` | — | ✅ 已完成 |
| 年龄门控 | `src/auth/` | ✅ | ✅ 已完成 |
| 云同步 | `src/memory/sync/` + `src/server/routes/sync.ts` | ✅ | ✅ 已完成（阶段3：Supabase适配器+服务端API） |
| 用户认证 | `src/server/auth/` | ✅ | ✅ 已完成（阶段3：注册/登录/Token管理） |
| WebSocket | `src/server/websocket/` | ✅ | ✅ 已完成（阶段3：实时通信+空间维度） |
| 数据库 | `src/server/db/` | ✅ | ✅ 已完成（阶段3：Schema+Repository） |

### 12.2 开发阶段完成情况

| 阶段 | 名称 | 状态 | 完成时间 |
|------|------|------|----------|
| 阶段1 | 核心闭环补全 | ✅ 已完成 | 2026-06-16 |
| 阶段2 | Persona 生态建设 | ✅ 已完成 | 2026-06-16 |
| 阶段3 | 后端与基础设施 | ✅ 已完成 | 2026-06-16 |
| 阶段4 | 3D角色生成 | ✅ 已完成 | 2026-06-16 |
| 阶段5 | 移动端与小程序 | 🔴 未开始 | — |
| 阶段6 | 远期规划 | 🔵 远期 | — |

### 12.3 测试覆盖总览

| 阶段 | 测试文件数 | 测试用例数 | 结果 |
|------|-----------|-----------|------|
| 阶段1 | 3 | 136 | ✅ 全部通过 |
| 阶段2 | 15 | 302 | ✅ 全部通过 |
| 阶段3 | 项目已有 | 1669+ | ✅ 通过（7个已知问题） |
| 阶段4 | 7 | 154 | ✅ 全部通过 |

---

## 十三、风险与对策

| 风险 | 等级 | 对策 |
|---|---|---|
| LLM 幻觉导致画像漂移 | 高 | 强制依据事件链；置信度 < 0.6 不进提案；EvolutionLedger 可一键回滚 |
| Token 成本失控 | 高 | 反思任务批量定时跑；事件先本地聚合再喂 LLM；高配档才开实时反思 |
| 自定义 Persona 越狱攻击 | 高 | L1 创建审核 + L2 实时监控 + system prompt 硬约束 + 5 次累计封号 |
| 用户绑架性话术 | 高 | system prompt 硬禁止 + LLM 输出审核 + 关系健康度监控 |
| 未成年人接触情感类 Persona | 极高 | L4 实名年龄验证 + 强制分级 + 小程序端默认关闭 |
| 真人冒名 / 名人 IP 侵权 | 高 | L1 名人姓名库检测 + 用户举报 + 24 小时下架机制 |
| 用户疲劳（仪式太烦） | 中 | 仪式频率可配置；普通会员不打扰；Agent 会员才开启 |
| 隐私顾虑 | 高 | 本地反思 + 加密上云；进化账本可一键导出/清空；画像用户可编辑 |
| 3D 角色加载慢 | 中 | 懒加载；预加载 idle 动画；降级到 2D |
| 小程序包体超限 | 高 | 小程序端只用 2D 贴图；3D 资产走 CDN 按需加载 |
| Ready Player Me SDK 国内访问 | 中 | 备选方案：自建简化捏脸工具；或用 Meshy AI 替代 |
| 会员体系重构影响现有用户 | 高 | 旧权益不缩水；兼容层 Adapter；赠送1个月 Agent 试用 |
| 生成式 AI 备案不通过 | 极高 | 上线前 90 天启动备案流程，准备好完整材料 |
| 国内 LLM 服务对长程对话敏感 | 中 | 同时接入国内合规 LLM 与海外 LLM，自动按场景路由 |

---

## 十四、与全局规则的对齐说明

- ✅ 优先扩展点：所有新增模块均为独立 Adapter/Registry/Service，不修改核心流程
- ✅ 接口契约保护：MemoryProfile、PersonaDefinition、AvatarAsset 等字段约定为契约
- ✅ 数据隔离：所有记忆/Persona/角色数据绑 user_id，云同步加密传输
- ✅ 安全合规：5 层围栏 + 未成年人保护 + 关系健康度 + 宣传话术红线
- ✅ 跨端一致：Web/Electron 跑 3D，小程序降级 2D，数据模型统一
- ✅ 测试可绑定：每个模块独立，便于单元测试与契约测试
- ✅ 用户主权：画像可编辑、进化可否决、事件可删除、数据可导出/清空
- ✅ 与已有 Memory/Agent/会员体系完全兼容，无重叠无矛盾

---

## 十五、备考场景工具模块

> 来源：`2026-06-07-module-redesign.md`

### 15.1 行业痛点覆盖矩阵

| 痛点 | 错题本 | 记忆卡 | 考试记录 | 学习计划 | 专注计时 | AI陪伴 | 情绪日记 |
|---|---|---|---|---|---|---|---|
| 错题分散难整理 | ✅ | — | — | — | — | — | — |
| 遗忘曲线难对抗 | — | ✅ | — | — | — | — | — |
| 考试数据无沉淀 | — | — | ✅ | — | — | — | — |
| 复习计划难执行 | — | — | — | ✅ | — | — | — |
| 专注力难维持 | — | — | — | — | ✅ | — | — |
| 考前焦虑无疏导 | — | — | — | — | — | ✅ | — |
| 情绪波动无感知 | — | — | — | — | — | — | ✅ |
| 学习动力不足 | — | — | — | — | — | ✅ | ✅ |
| 薄弱科目难定位 | ✅ | — | ✅ | — | — | — | — |
| 学习数据孤岛 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 15.2 错题本（ErrorBook）

**数据结构：**
```ts
interface ErrorItem {
  id: string
  subject: string
  question: string
  answer: string
  errorReason: string
  tags: string[]
  createdAt: string
  reviewedAt?: string
  reviewCount: number
  masteryLevel: number
}

interface ErrorBookState {
  items: ErrorItem[]
}
```

**AI 增强：**
- 错题分析：AI 分析错误原因，给出知识点建议
- OCR 识别：拍照识别纸质错题
- 存储 key：`xinghuanhai-errorbook-state`
- 配色：红色调（#ef4444）
- 文件路径：`src/error-book/`

### 15.3 记忆卡（MemoryCards）

**数据结构：**
```ts
interface Deck {
  id: string
  name: string
  subject: string
  cardCount: number
  createdAt: string
}

interface MemoryCard {
  id: string
  deckId: string
  front: string
  back: string
  ease: number
  interval: number
  repetitions: number
  nextReview: string
  createdAt: string
}

interface MemoryCardsState {
  decks: Deck[]
  cards: MemoryCard[]
}
```

**核心算法：** SM-2 间隔重复算法
**AI 增强：** AI 从错题本自动提取卡片
**存储 key：** `xinghuanhai-memorycards-state`
**配色：** 绿色调（#22c55e）
**文件路径：** `src/memory-cards/`

### 15.4 考试记录（ExamTracker）

**数据结构：**
```ts
interface ExamScore {
  subject: string
  score: number
  totalScore: number
  rank?: number
}

interface ExamRecord {
  id: string
  examName: string
  examDate: string
  scores: ExamScore[]
  notes?: string
  createdAt: string
}

interface ExamTrackerState {
  records: ExamRecord[]
  targetScores: Record<string, number>
}
```

**AI 增强：** AI 对比分析两次考试成绩变化
**存储 key：** `xinghuanhai-examtracker-state`
**配色：** 蓝色调（#3b82f6）
**文件路径：** `src/exam-tracker/`

### 15.5 学习计划（StudyPlanner）

**数据结构：**
```ts
interface StudyPhase {
  id: string
  name: string
  startDate: string
  endDate: string
  subjects: string[]
  completed: boolean
}

interface StudyTask {
  id: string
  phaseId: string
  subject: string
  title: string
  estimatedMinutes: number
  completed: boolean
  date: string
}

interface StudyPlan {
  id: string
  name: string
  examDate: string
  phases: StudyPhase[]
  createdAt: string
}

interface StudyPlannerState {
  plans: StudyPlan[]
  tasks: StudyTask[]
}
```

**AI 增强：** AI 生成复习计划、AI 每日建议
**存储 key：** `xinghuanhai-studyplanner-state`
**配色：** 紫色调（#8b5cf6）
**文件路径：** `src/study-planner/`

### 15.6 专注计时（FocusTimer）

**数据结构：**
```ts
interface FocusSession {
  id: string
  subject?: string
  durationMinutes: number
  startedAt: string
  completedAt?: string
  abandoned: boolean
}

interface FocusTimerState {
  sessions: FocusSession[]
  currentSession?: FocusSession
  isRunning: boolean
  selectedSubject?: string
}
```

**核心功能：** 番茄钟计时、科目标签、白噪音
**存储 key：** `xinghuanhai-focus-records`
**配色：** 橙色调（#f97316）
**文件路径：** `src/focus-timer/`

### 15.7 知识层增强（10项优化）

1. 错题复习模式（按科目/标签筛选复习）
2. 错题统计面板（科目分布、错误原因分布）
3. 错题关联考试（标注错题来源考试）
4. 卡片编辑（修改卡片内容）
5. 复习统计（复习次数、掌握度趋势）
6. 卡片搜索（关键词搜索卡片）
7. 编辑考试记录（修改/删除考试记录）
8. 目标分数设定（设定各科目标分数）
9. 总分/平均分统计（自动计算）
10. 任意两次对比（选择两次考试进行对比分析）

### 15.8 模块注册清单

| 模块ID | 标题 | 分类 | 图标 | 配色 | 状态 |
|---|---|---|---|---|---|
| error-book | 错题本 | learning | BookOpen | #ef4444 | ✅ 已完成 |
| memory-cards | 记忆卡 | learning | Layers | #22c55e | ✅ 已完成 |
| exam-tracker | 考试记录 | learning | BarChart3 | #3b82f6 | ✅ 已完成 |
| study-planner | 学习计划 | learning | Calendar | #8b5cf6 | ✅ 已完成 |
| focus-timer | 专注计时 | learning | Timer | #f97316 | ✅ 已完成 |
| study-companion | 备考陪伴 | learning | Heart | #ec4899 | ✅ 已完成 |
| mood-journal | 情绪日记 | learning | Smile | #eab308 | ✅ 已完成 |

### 15.9 AI 基础设施（可直接复用）

> 来源：`2026-06-07-module-redesign.md` §1.2

| 能力 | 文件 | 说明 |
|---|---|---|
| 多 Provider 支持 | `ai/aiProvider.ts` | DeepSeek、OpenAI、通义千问、豆包、本地模型 |
| 流式聊天 | `agent/agentRuntime.ts` | `sendAgentChatMessageStream()` 支持 SSE 流式返回 |
| API Key 检测 | `hooks/useApiKeyStatus.ts` | 检测各 Provider 的 Key 是否配置 |
| Prompt 构建 | `ai/aiProvider.ts` | `createAiPromptDraft()` 统一构建 system/user prompt |
| 间隔重复算法 | `memory-cards/spacedRepetition.ts` | SM-2 算法，支持质量评分 0-5 |
| 数据持久化 | localStorage | 各模块独立 key，前缀 `xinghuanhai-{module}-state` |
| 会员权益 | `services/entitlementService.ts` | 会员等级检查，AI 功能权限控制 |

### 15.10 设计系统规范

> 来源：`2026-06-07-module-redesign.md` §1.3

| 要素 | 说明 |
|---|---|
| 设计风格 | 柔和高端 (soft premium) |
| CSS 方案 | CSS Modules (.module.css) |
| 主题变量 | `--surface`, `--border`, `--text`, `--muted`, `--font-display` |
| 间距系统 | 12px 基础间距 |
| 卡片风格 | 毛玻璃 + 微渐变 + 柔和阴影 + 16px 圆角 |
| 动效 | cubic-bezier(0.4, 0, 0.2, 1) 弹性曲线 |

### 15.11 AI System Prompt 模板

> 来源：`2026-06-07-module-redesign.md` §5.2

```typescript
// 错题本 - AI 分析错题
const systemPrompt = `你是备考教练。用户给你一道做错的题目，你需要：
1. 分析可能的错因
2. 给出正确解法
3. 生成2道同类型变式题（带答案）
用 JSON 格式返回：{"analysis":"...","solution":"...","similarQuestions":[{"question":"...","answer":"..."}]}`

// 记忆卡 - AI 提取考点
const systemPrompt = `你是知识提取专家。从用户提供的文本中提取关键知识点，生成复习卡片。
每张卡片包含 front（问题/概念名）和 back（答案/解释）。
用 JSON 格式返回：{"cards":[{"front":"...","back":"..."}]}`

// 考试记录 - AI 对比分析
const systemPrompt = `你是学习分析师。对比用户提供的两次考试分数，指出进步和退步的科目，建议优先复习方向。
用 JSON 格式返回：{"improved":["科目名"],"declined":["科目名"],"priority":"建议优先复习的科目"}`

// 学习计划 - AI 生成计划
const systemPrompt = `你是备考规划师。根据用户的考试目标、剩余天数和当前水平，生成分阶段复习计划。
用 JSON 格式返回：{"phases":[{"name":"...","startDate":"...","endDate":"...","tasks":[...]}]}`

// AI 陪伴 - 情感支持
const systemPrompt = `你是备考伙伴。以温暖、非评判的方式与用户对话，感知学习数据波动，
提供情绪疏导和正向激励。不要生硬说教，要像朋友一样陪伴。`
```

### 15.12 AI 风险与限制

> 来源：`2026-06-07-module-redesign.md` §5.3

| 风险 | 说明 | 应对 |
|---|---|---|
| API Key 未配置 | 用户没有配置任何 AI Provider 的 Key | 核心功能不依赖 AI，手动录入可用；显示引导提示 |
| AI 返回格式不稳定 | AI 可能不按 JSON 格式返回 | 添加 JSON 解析容错，解析失败时显示原始文本 |
| 网络错误 | API 调用超时或失败 | try-catch + 错误提示 + 重试按钮 |
| 流式响应中断 | 用户关闭页面或网络断开 | AbortController 取消请求 |
| localStorage 容量 | 大量数据可能触及 5-10MB 上限 | 各模块独立 key，按需清理旧数据 |

### 15.13 开发流程与文件结构

> 来源：`2026-06-07-module-redesign.md` §4.2, §4.3

**每个模块的开发流程：**
1. 创建数据服务（Service + Store）
2. 创建 UI 组件（TSX + CSS Module）
3. 集成 AI 调用
4. 编写测试
5. 集成到 App.tsx + ModuleRegistry
6. 浏览器验证

**完整文件结构：**

```
src/
├── error-book/           # Phase 1 ✅
│   ├── ErrorBookUI.tsx
│   ├── ErrorBookUI.module.css
│   ├── errorBookService.ts
│   └── ErrorBookUI.test.tsx
├── memory-cards/         # Phase 2 ✅
│   ├── MemoryCardsUI.tsx
│   ├── MemoryCardsUI.module.css
│   ├── memoryCardsService.ts
│   ├── spacedRepetition.ts
│   └── MemoryCardsUI.test.tsx
├── exam-tracker/         # Phase 3 ✅
│   ├── ExamTrackerUI.tsx
│   ├── ExamTrackerUI.module.css
│   ├── examTrackerService.ts
│   └── ExamTrackerUI.test.tsx
├── study-planner/        # Phase 5 📋
│   ├── StudyPlannerUI.tsx
│   ├── StudyPlannerUI.module.css
│   ├── studyPlannerService.ts
│   └── StudyPlannerUI.test.tsx
├── focus-timer/          # Phase 6 📋
│   ├── FocusTimerUI.tsx
│   ├── FocusTimerUI.module.css
│   ├── focusTimerService.ts
│   └── FocusTimerUI.test.tsx
├── study-companion/      # Phase 7 📋
│   ├── StudyCompanionUI.tsx
│   ├── StudyCompanionUI.module.css
│   ├── studyCompanionService.ts
│   └── StudyCompanionUI.test.tsx
├── mood-journal/         # Phase 8 📋
│   ├── MoodJournalUI.tsx
│   ├── MoodJournalUI.module.css
│   ├── moodJournalService.ts
│   └── MoodJournalUI.test.tsx
```

### 15.14 现有 AI 调用链路

> 来源：`2026-06-07-module-redesign.md` §5.1

```
用户操作 → 模块组件 → sendAgentChatMessageStream()
  → fetchXFYunCodingCompletionStream() (优先讯飞)
  → fetchChatCompletionStream() (fallback DeepSeek/OpenAI/通义/豆包)
  → SSE 流式返回 → onChunk 回调 → 组件更新 UI
```

---

## 十六、关系空间与扩展功能

> 来源：`2026-06-02-phase3-extended-features-design.md`

### 16.1 需求优先级

| 功能 | 优先级 | 交付里程碑 | 依赖模块 |
|---|---|---|---|
| 壁纸上传 | P0 | M1 | ThemeRegistry、本地存储 |
| 女性周期管理 | P1 | M2 | FeatureModule、PrivacyLevel、本地存储 |
| 关系空间 | P2 | M3 | EntitlementService、SpaceProvider、实时通信 |
| 3D角色生成 | P3 | M4 | AvatarRegistry、AI Provider、EntitlementService |

### 16.2 模块分层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        表现层 / UI Layer                         │
│  RelationshipSpaceUI │ CycleTrackerUI │ WallpaperPicker │ AvatarEditor │
├─────────────────────────────────────────────────────────────────┤
│                      业务服务层 / Service Layer                   │
│  RelationshipService │ CycleService │ WallpaperService │ AvatarService │
├─────────────────────────────────────────────────────────────────┤
│                      数据访问层 / Repository Layer                │
│  RelationshipStore │ CycleStore │ WallpaperStore │ AvatarStore │
├─────────────────────────────────────────────────────────────────┤
│                      基础设施层 / Infrastructure Layer            │
│  RealtimeProvider │ PrivacyGuard │ LocalStorageAdapter │ AIProvider │
└─────────────────────────────────────────────────────────────────┘
```

### 16.3 扩展点设计

| 扩展点 | 职责 | 实现方式 |
|---|---|---|
| `RelationshipProvider` | 关系空间创建、成员管理、权限控制 | 实现 `IRelationshipProvider` 接口 |
| `CycleProvider` | 周期数据存储、预测算法、提醒调度 | 实现 `ICycleProvider` 接口 |
| `WallpaperProvider` | 壁纸存储、可读性处理、隐私保护 | 实现 `IWallpaperProvider` 接口 |
| `AvatarProvider` | 3D角色生成、渲染、进化 | 实现 `IAvatarProvider` 接口 |
| `RealtimeAdapter` | 实时通信抽象层 | 可替换 WebSocket/Polling 实现 |

### 16.4 架构降级兜底方案

| 场景 | 降级方案 |
|---|---|
| 3D渲染不可用 | 降级为2D立绘 |
| 实时通信断开 | 降级为轮询 + 离线队列 |
| AI生成失败 | 提供预设角色库 |
| 壁纸过大 | 自动压缩 + 尺寸限制 |

### 16.5 关系空间（Relationship Space）

**空间类型：** `couple`（情侣）、`family`（家庭）、`study_buddy`（学习搭子）、`discipline_buddy`（自律搭子）

**核心能力：**
- 互推任务：向空间成员推送待办任务
- 共享待办：空间级任务池，成员可领取
- 共享习惯：共同打卡目标
- 共享番茄：同步专注时段
- 实时对战：专注PK、连续打卡PK、周排行
- 关系成长值：基于互动计算亲密度/默契度
- 纪念日管理：重要日期提醒
- 共同目标：设定并追踪共同目标

**数据契约：**
```ts
type SpaceType = 'couple' | 'family' | 'study_buddy' | 'discipline_buddy'
type SpaceRole = 'owner' | 'admin' | 'member'

interface RelationshipSpace {
  id: string
  type: SpaceType
  name: string
  ownerId: string
  members: Array<{
    userId: string
    role: SpaceRole
    joinedAt: string
    nickname?: string
  }>
  settings: {
    allowTaskPush: boolean
    allowSharedTodo: boolean
    allowSharedHabits: boolean
    allowSharedFocus: boolean
    allowRanking: boolean
    privacyLevel: 'public' | 'private' | 'secret'
  }
  stats: {
    intimacyScore: number
    synergyScore: number
    totalSharedTasks: number
    totalSharedFocus: number
    streakDays: number
  }
  anniversaries: Array<{
    id: string
    name: string
    date: string
    repeat: 'yearly' | 'monthly' | 'once'
    remindDays: number
  }>
  sharedGoals: Array<{
    id: string
    name: string
    targetDate: string
    progress: number
    contributors: string[]
  }>
  createdAt: string
  updatedAt: string
}

interface SpaceInvitation {
  id: string
  spaceId: string
  inviterId: string
  inviteeId?: string
  inviteCode: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expiresAt: string
  createdAt: string
}

interface SpaceActivity {
  id: string
  spaceId: string
  type: 'task_push' | 'task_complete' | 'habit_check' | 'focus_start' | 'focus_end' | 'ranking_update' | 'anniversary' | 'goal_progress'
  actorId: string
  targetId?: string
  payload: Record<string, unknown>
  createdAt: string
}
```

**权益绑定：**

| 权益Code | 说明 | 来源 |
|---|---|---|
| `space` | 可创建关系空间 | 学习会员/Agent会员/PLUS |
| `space_member_limit` | 空间成员上限 | 默认2人，可扩展 |
| `space_ranking` | 实时排行功能 | 学习会员+ |
| `space_anniversary` | 纪念日管理 | 学习会员+ |

**计费模式：** 创建者承担（A模式）——创建空间的人付费，空间下所有成员共享「空间相关」高级功能。副席位的「个人类」高级权益仍需自己购买。价格示例：¥12/月。

**安全边界：**
- 禁止跨空间数据访问
- 成员退出空间后，其个人数据不保留在空间内
- 空间解散后，所有共享数据删除
- 邀请码有效期7天，过期自动失效
- 禁止在空间内发送违规内容（接入内容审核）

**亲密度/默契度计算算法：**

```ts
function calculateIntimacyScore(activities: SpaceActivity[]): number {
  let score = 0
  const now = Date.now()
  const DAY = 86400000

  for (const activity of activities) {
    const age = (now - new Date(activity.createdAt).getTime()) / DAY
    const decay = Math.max(0.3, 1 - age * 0.01)  // 时间衰减，最低 0.3

    switch (activity.type) {
      case 'task_push':       score += 1 * decay; break
      case 'task_complete':   score += 2 * decay; break
      case 'habit_check':     score += 1 * decay; break
      case 'focus_start':     score += 1 * decay; break
      case 'focus_end':       score += 3 * decay; break
      case 'ranking_update':  score += 2 * decay; break
      case 'anniversary':     score += 5 * decay; break
      case 'goal_progress':   score += 3 * decay; break
    }
  }

  return Math.round(score)
}
```

**任务推送流程：** 成员 A 创建任务 → 选择推送到空间 → 选择目标成员 → 目标成员收到推送通知 → 可选择接受/拒绝 → 接受后任务加入目标成员的个人任务列表。

**专注 PK 流程：** 成员 A 发起 PK → 选择对手 → 对手接受 → 双方同时开始专注 → 实时显示对方状态（专注中/休息中）→ 结束后比较专注时长 → 胜者获得积分。

### 16.6 女性周期管理（Cycle Tracker）

**功能范围：**
- 经期开始/结束记录
- 周期预测（基于历史数据）
- 排卵/易孕期提示
- 经量记录（少/中/多）
- 痛经等级（1-10）
- 症状记录（头痛、腰痛、腹胀、水肿、痤疮等）
- 情绪记录（开心、平静、焦虑、易怒、低落等）
- 睡眠/运动/饮食关联
- 今日能量建议（基于周期阶段）
- 经期前提醒
- 隐私锁（PIN/生物识别）
- 本地数据导出/删除
- 医学免责声明

**数据契约：**
```ts
type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy'
type PainLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

type SymptomType =
  | 'headache' | 'back_pain' | 'bloating' | 'cramps' | 'fatigue'
  | 'acne' | 'breast_tenderness' | 'nausea' | 'dizziness' | 'insomnia'

type MoodType =
  | 'happy' | 'calm' | 'neutral' | 'anxious' | 'irritable'
  | 'sad' | 'depressed' | 'energetic' | 'creative'

interface CycleRecord {
  id: string
  userId: string
  date: string
  flow?: FlowLevel
  pain?: PainLevel
  symptoms: SymptomType[]
  moods: MoodType[]
  sleepHours?: number
  exerciseMinutes?: number
  waterGlasses?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

interface CyclePrediction {
  userId: string
  calculatedAt: string
  averageCycleLength: number
  averagePeriodLength: number
  nextPeriodStart: string
  nextPeriodEnd: string
  nextOvulation: string
  fertileWindowStart: string
  fertileWindowEnd: string
  currentPhase: CyclePhase
  confidence: number
}

interface CycleSettings {
  userId: string
  enabled: boolean
  reminderDaysBefore: number
  reminderTime: string
  privacyLockEnabled: boolean
  showEnergySuggestion: boolean
  showInDashboard: boolean
  dataRetentionDays: number
}

interface EnergySuggestion {
  date: string
  phase: CyclePhase
  energyLevel: 'low' | 'medium' | 'high'
  suggestedTaskIntensity: 'rest' | 'light' | 'moderate' | 'high'
  suggestions: string[]
  avoidTypes: string[]
}
```

**权益绑定：**

| 权益Code | 说明 | 来源 |
|---|---|---|
| `cycle_tracker` | 基础周期记录 | 免费 |
| `cycle_prediction` | 周期预测 | 免费 |
| `cycle_energy_suggestion` | 能量建议 | 学习会员+ |
| `cycle_ai_insight` | AI周期洞察 | Agent会员+ |

**隐私分级：** 高敏感——周期数据默认仅本地存储，云同步必须由用户单独开启，日志不得输出周期数据，截图不得包含周期数据，提供一键导出和删除功能。

**安全边界：**
- 不做医学诊断：只做记录、预测、提醒和生活建议
- 异常情况提示就医：周期异常、持续疼痛等提示就医建议
- 明确免责声明：在功能入口和设置页显示免责声明
- 隐私锁：支持PIN码或生物识别锁定
- 数据脱敏：AI分析时仅传递脱敏数据

**周期预测算法：**

```ts
function predictCycle(records: CycleRecord[]): CyclePrediction {
  const periodStarts = records
    .filter(r => r.flow && r.flow !== 'spotting')
    .map(r => new Date(r.date))
    .sort((a, b) => a.getTime() - b.getTime())

  const recentStarts = periodStarts.slice(-6)  // 基于最近 6 个周期

  const cycleLengths: number[] = []
  for (let i = 1; i < recentStarts.length; i++) {
    cycleLengths.push(
      (recentStarts[i].getTime() - recentStarts[i - 1].getTime()) / 86400000
    )
  }

  const averageCycleLength = Math.round(
    cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
  )

  const lastStart = recentStarts[recentStarts.length - 1]
  const nextPeriodStart = new Date(lastStart.getTime() + averageCycleLength * 86400000)
  const nextPeriodEnd = new Date(nextPeriodStart.getTime() + 5 * 86400000)
  const nextOvulation = new Date(nextPeriodStart.getTime() - 14 * 86400000)

  return {
    userId: records[0]?.userId ?? '',
    calculatedAt: new Date().toISOString(),
    averageCycleLength,
    averagePeriodLength: 5,
    nextPeriodStart: nextPeriodStart.toISOString().split('T')[0],
    nextPeriodEnd: nextPeriodEnd.toISOString().split('T')[0],
    nextOvulation: nextOvulation.toISOString().split('T')[0],
    fertileWindowStart: new Date(nextOvulation.getTime() - 5 * 86400000).toISOString().split('T')[0],
    fertileWindowEnd: new Date(nextOvulation.getTime() + 1 * 86400000).toISOString().split('T')[0],
    currentPhase: determineCurrentPhase(lastStart, averageCycleLength),
    confidence: Math.min(0.9, cycleLengths.length / 6)
  }
}
```

**能量建议生成算法：**

```ts
function generateEnergySuggestion(prediction: CyclePrediction, date: string): EnergySuggestion {
  const phase = prediction.currentPhase

  const phaseConfig: Record<CyclePhase, {
    energyLevel: EnergySuggestion['energyLevel']
    suggestedTaskIntensity: EnergySuggestion['suggestedTaskIntensity']
    suggestions: string[]
    avoidTypes: string[]
  }> = {
    menstrual: {
      energyLevel: 'low',
      suggestedTaskIntensity: 'rest',
      suggestions: ['轻度拉伸', '充足睡眠', '温热饮品', '轻松阅读'],
      avoidTypes: ['高强度运动', '熬夜', '大量咖啡因']
    },
    follicular: {
      energyLevel: 'high',
      suggestedTaskIntensity: 'high',
      suggestions: ['高强度学习', '新技能尝试', '社交活动', '创意工作'],
      avoidTypes: []
    },
    ovulation: {
      energyLevel: 'high',
      suggestedTaskIntensity: 'moderate',
      suggestions: ['团队协作', '沟通表达', '中等强度运动'],
      avoidTypes: []
    },
    luteal: {
      energyLevel: 'medium',
      suggestedTaskIntensity: 'light',
      suggestions: ['整理复习', '温和运动', '提前准备经期用品'],
      avoidTypes: ['高压任务', '重大决策']
    }
  }

  const config = phaseConfig[phase]
  return {
    date,
    phase,
    energyLevel: config.energyLevel,
    suggestedTaskIntensity: config.suggestedTaskIntensity,
    suggestions: config.suggestions,
    avoidTypes: config.avoidTypes
  }
}
```

### 16.7 壁纸上传（Wallpaper Upload）

**功能范围：**
- 支持用户上传本地图片作为桌面背景或应用背景
- 支持预览、替换、删除和恢复默认背景
- 可读性保护：遮罩强度调节、背景模糊调节、亮度调节、饱和度调节、暗角保护、卡片背景透明度调节、文字可读性预警
- 壁纸库：预设壁纸选择
- 壁纸与主题联动：不同主题可配置不同壁纸

**数据契约：**
```ts
type WallpaperSource = 'preset' | 'upload' | 'theme_default'

interface WallpaperConfig {
  id: string
  userId: string
  source: WallpaperSource
  presetId?: string
  localPath?: string
  thumbnailDataUrl?: string
  themeBinding?: ThemeId
  adjustments: {
    overlay: string
    blur: string
    brightness: number
    saturation: number
    vignette: number
    cardOpacity: number
  }
  readabilityWarning: boolean
  createdAt: string
  updatedAt: string
}

interface PresetWallpaper {
  id: string
  name: string
  category: 'nature' | 'city' | 'abstract' | 'minimal' | 'anime' | 'seasonal'
  thumbnailUrl: string
  fullUrl: string
  recommendedThemes: ThemeId[]
  accessibilityScore: number
}
```

**权益绑定：**

| 权益Code | 说明 | 来源 |
|---|---|---|
| `wallpaper_upload` | 上传自定义壁纸 | 免费 |
| `wallpaper_preset_library` | 预设壁纸库 | 免费（基础）+ 学习会员（高级） |
| `wallpaper_per_theme` | 每主题独立壁纸 | 学习会员+ |

**隐私分级：** 私人——壁纸可能包含私人照片，不得默认上传云端。截图、日志和错误报告不得自动包含壁纸原图。

**可读性保护算法：**
```ts
interface ReadabilityCheckResult {
  score: number
  warning: boolean
  issues: Array<{
    type: 'low_contrast' | 'too_bright' | 'too_dark' | 'too_busy'
    severity: 'info' | 'warning' | 'error'
    suggestion: string
  }>
}

function checkWallpaperReadability(
  wallpaper: WallpaperConfig,
  themeTokens: ThemeTokens
): ReadabilityCheckResult {
  const issues: ReadabilityCheckResult['issues'] = []
  let score = 100

  // 亮度检查：过亮或过暗扣分
  if (wallpaper.adjustments.brightness > 1.5) {
    issues.push({ type: 'too_bright', severity: 'warning', suggestion: '建议降低亮度' })
    score -= 20
  }
  if (wallpaper.adjustments.brightness < 0.5) {
    issues.push({ type: 'too_dark', severity: 'warning', suggestion: '建议提高亮度' })
    score -= 20
  }

  // 模糊检查：模糊不足可能导致文字难以阅读
  if (wallpaper.adjustments.blur === '0px') {
    issues.push({ type: 'too_busy', severity: 'info', suggestion: '建议添加轻微模糊以提高文字可读性' })
    score -= 10
  }

  // 遮罩检查：遮罩透明度不足
  if (wallpaper.adjustments.cardOpacity > 0.9) {
    issues.push({ type: 'low_contrast', severity: 'warning', suggestion: '建议降低卡片透明度' })
    score -= 15
  }

  return {
    score: Math.max(0, score),
    warning: score < 70,
    issues
  }
}
```

### 16.8 3D角色生成（3D Avatar Generation）

> 来源：`2026-06-02-phase3-extended-features-design.md` §3.4

**功能范围：**
- AI生成专属3D角色（输入描述生成）
- 角色渲染：3D GLTF、2D Live2D、2D贴纸
- 角色来源：内置角色库、Ready Player Me 捏脸、Meshy AI 生成、用户上传、IP联名
- 角色进化：基于用户行为解锁装饰/特效/动画
- 角色动画：待机、鼓励、庆祝、思考等
- 角色与Persona绑定

**数据契约：**
```ts
type AvatarRenderMode = '3d_gltf' | '2d_live2d' | '2d_sticker'
type AvatarSource = 'builtin' | 'ready_player_me' | 'meshy_ai' | 'user_upload' | 'ip_collab'

interface AvatarDefinition {
  id: string
  userId: string
  personaId?: string
  name: string
  source: AvatarSource
  renderMode: AvatarRenderMode
  modelUrl?: string
  stickerUrl?: string
  thumbnailUrl: string
  rpmAvatarUrl?: string
  rpmConfig?: Record<string, unknown>
  aiPrompt?: string
  aiModelId?: string
  evolution: {
    level: number
    unlockedDecorations: string[]
    unlockedEffects: string[]
    unlockedAnimations: string[]
    totalFocusMinutes: number
    totalTasksCompleted: number
    streakDays: number
  }
  animations: Array<{
    name: string
    url?: string
    loop: boolean
    trigger: 'auto' | 'user_action' | 'schedule'
  }>
  createdAt: string
  updatedAt: string
}

interface AvatarGenerationRequest {
  id: string
  userId: string
  prompt: string
  style?: 'realistic' | 'anime' | 'cartoon' | 'chibi'
  renderMode: AvatarRenderMode
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: AvatarDefinition
  error?: string
  createdAt: string
  completedAt?: string
}

interface AvatarEvolutionRule {
  id: string
  trigger: {
    type: 'focus_minutes' | 'tasks_completed' | 'streak_days' | 'special_event'
    threshold: number
  }
  reward: {
    type: 'decoration' | 'effect' | 'animation'
    assetId: string
    name: string
    description: string
  }
}
```

**权益绑定：**

| 权益Code | 说明 | 来源 |
|---|---|---|
| `avatar_builtin` | 内置角色库 | 免费（1个固定2D） |
| `avatar_preset_library` | 预设角色库 | Agent会员（6个2D/3D） |
| `avatar_rpm` | Ready Player Me 捏脸 | Agent会员 |
| `avatar_ai_gen` | AI 3D角色生成配额 | PLUS（10次/月） |
| `avatar_evolution` | 角色进化系统 | Agent会员 |
| `avatar_evolution_full` | 角色进化全解锁 | PLUS |
| `avatar_ip_collab` | IP联名角色 | 单独购买 |

**隐私分级：**

| 数据 | 隐私级别 | 存储策略 | 同步策略 |
|---|---|---|---|
| 角色定义 | 私人 | 本地+云端 | 自动同步 |
| AI生成提示词 | 私人 | 不存储 | 不同步 |
| 角色进化数据 | 私人 | 本地+云端 | 自动同步 |
| RPM配置 | 私人 | 本地 | 需授权 |

**技术选型：**

| 组件 | 推荐方案 | 备选方案 |
|---|---|---|
| 3D渲染 | Three.js | Babylon.js |
| Live2D | pixi-live2d-display | 官方SDK |
| AI生成 | Meshy AI API | 自建模型 |
| 捏脸 | Ready Player Me | 自研捏脸系统 |

**降级策略：**

| 场景 | 降级方案 |
|---|---|
| 3D渲染不可用 | 降级为2D立绘 |
| AI生成失败 | 提供预设角色库 |
| Live2D不可用 | 降级为静态贴纸 |
| 模型加载失败 | 显示加载占位符 |

**进化规则引擎：**

```ts
function checkEvolutionRules(avatar: AvatarDefinition, stats: UserStats): AvatarEvolutionRule[] {
  const unlockedRules: AvatarEvolutionRule[] = []

  for (const rule of EVOLUTION_RULES) {
    if (isRuleUnlocked(rule, avatar, stats)) {
      if (!avatar.evolution.unlockedDecorations.includes(rule.reward.assetId) &&
          !avatar.evolution.unlockedEffects.includes(rule.reward.assetId) &&
          !avatar.evolution.unlockedAnimations.includes(rule.reward.assetId)) {
        unlockedRules.push(rule)
      }
    }
  }

  return unlockedRules
}

function isRuleUnlocked(rule: AvatarEvolutionRule, avatar: AvatarDefinition, stats: UserStats): boolean {
  switch (rule.trigger.type) {
    case 'focus_minutes':
      return avatar.evolution.totalFocusMinutes >= rule.trigger.threshold
    case 'tasks_completed':
      return avatar.evolution.totalTasksCompleted >= rule.trigger.threshold
    case 'streak_days':
      return avatar.evolution.streakDays >= rule.trigger.threshold
    case 'special_event':
      return checkSpecialEvent(rule.trigger.threshold)
    default:
      return false
  }
}
```

**AI生成流程：**

```
用户输入描述 → 选择风格 → 选择渲染模式
    ↓
创建AvatarGenerationRequest（pending）
    ↓
调用AI Provider（Meshy AI）
    ↓
轮询生成状态
    ↓
生成完成 → 下载模型 → 创建AvatarDefinition
    ↓
更新请求状态（completed）
    ↓
用户预览 → 保存角色
```

### 16.9 模块化拆分与迭代计划

> 来源：`2026-06-02-phase3-extended-features-design.md` §六

**模块清单：**

| 模块ID | 模块名称 | 优先级 | 依赖模块 | 预计工期 |
|---|---|---|---|---|
| E1 | WallpaperStore | P0 | 本地存储 | 2天 |
| E2 | WallpaperService | P0 | E1, ThemeRegistry | 2天 |
| E3 | WallpaperPickerUI | P0 | E2 | 3天 |
| E4 | CycleStore | P1 | 本地存储, 加密 | 2天 |
| E5 | CyclePredictionEngine | P1 | E4 | 2天 |
| E6 | CycleService | P1 | E4, E5 | 2天 |
| E7 | CycleTrackerUI | P1 | E6 | 4天 |
| E8 | RelationshipStore | P2 | 云端存储 | 3天 |
| E9 | RealtimeProvider | P2 | WebSocket | 3天 |
| E10 | RelationshipService | P2 | E8, E9, EntitlementService | 4天 |
| E11 | RelationshipSpaceUI | P2 | E10 | 5天 |
| E12 | AvatarStore | P3 | 本地+云端存储 | 2天 |
| E13 | AvatarRenderer | P3 | Three.js/Live2D | 5天 |
| E14 | AvatarAIProvider | P3 | AI Provider | 3天 |
| E15 | AvatarService | P3 | E12, E13, E14, EntitlementService | 3天 |
| E16 | AvatarEditorUI | P3 | E15 | 4天 |

**迭代里程碑：**

| 里程碑 | 包含模块 | 交付物 | 验收标准 |
|---|---|---|---|
| M1 壁纸上传 | E1, E2, E3 | 壁纸上传功能 | 可上传、调整、应用壁纸 |
| M2 女性周期 | E4, E5, E6, E7 | 周期管理功能 | 可记录、预测、查看统计 |
| M3 关系空间 | E8, E9, E10, E11 | 关系空间功能 | 可创建空间、邀请成员、互动 |
| M4 3D角色 | E12, E13, E14, E15, E16 | 3D角色功能 | 可生成、渲染、进化角色 |

**开发顺序（遵循「单模块串行开发」原则）：**

```
M1 壁纸上传
  └── E1 WallpaperStore
  └── E2 WallpaperService
  └── E3 WallpaperPickerUI
  └── M1 验收

M2 女性周期
  └── E4 CycleStore
  └── E5 CyclePredictionEngine
  └── E6 CycleService
  └── E7 CycleTrackerUI
  └── M2 验收

M3 关系空间
  └── E8 RelationshipStore
  └── E9 RealtimeProvider
  └── E10 RelationshipService
  └── E11 RelationshipSpaceUI
  └── M3 验收

M4 3D角色
  └── E12 AvatarStore
  └── E13 AvatarRenderer
  └── E14 AvatarAIProvider
  └── E15 AvatarService
  └── E16 AvatarEditorUI
  └── M4 验收
```

### 16.10 全维度风险预判与工程兜底

> 来源：`2026-06-02-phase3-extended-features-design.md` §七

**风险分类：**

| 风险类型 | 风险项 | 等级 | 应对措施 |
|---|---|---|---|
| 代码风险 | 3D渲染性能问题 | 中 | 提供降级方案，限制模型复杂度 |
| 代码风险 | 实时通信断开 | 中 | 降级为轮询，离线队列 |
| 架构风险 | 关系空间数据模型变更 | 高 | 版本迁移脚本，向后兼容 |
| 架构风险 | 周期预测算法精度不足 | 中 | 持续优化，提供置信度显示 |
| 交付风险 | 3D角色生成API不稳定 | 高 | 多供应商备选，预设角色库 |
| 交付风险 | 实时通信服务成本 | 中 | 按需连接，空闲断开 |
| 运维风险 | 壁纸存储空间占用 | 低 | 自动压缩，定期清理 |
| 运维风险 | 关系空间数据增长 | 中 | 数据归档策略 |
| 安全风险 | 周期数据泄露 | 高 | 本地优先，加密存储，隐私锁 |
| 安全风险 | 关系空间内容违规 | 高 | 内容审核，举报机制 |
| 合规风险 | 未成年人使用关系空间 | 高 | 年龄验证，功能限制 |
| 合规风险 | 周期管理被误解为医疗 | 高 | 明确免责声明，提示就医 |

**应急预案：**

| 场景 | 应急措施 |
|---|---|
| AI生成服务不可用 | 切换到预设角色库，显示服务维护提示 |
| 实时通信服务故障 | 降级为轮询模式，延长轮询间隔 |
| 3D渲染崩溃 | 自动降级为2D模式，记录错误日志 |
| 周期预测异常 | 显示预测置信度，提示用户手动调整 |
| 关系空间数据冲突 | 最后写入胜出 + 冲突日志 |

### 16.11 测试覆盖要求

> 来源：`2026-06-02-phase3-extended-features-design.md` §八

**单元测试：**

| 模块 | 测试重点 |
|---|---|
| CyclePredictionEngine | 预测算法准确性、边界条件、数据不足处理 |
| CycleService | 记录CRUD、提醒调度、隐私锁 |
| WallpaperService | 壁纸加载、可读性检查、调整效果 |
| RelationshipService | 空间创建、成员管理、权限校验 |
| AvatarService | 角色管理、进化计算、配额控制 |

**集成测试：**

| 场景 | 测试内容 |
|---|---|
| 壁纸与主题联动 | 切换主题时壁纸正确切换 |
| 周期与任务联动 | 能量建议影响任务推荐 |
| 关系空间与权益 | 权益控制功能可用性 |
| 角色与Persona联动 | 角色正确绑定Persona |

**边界/异常测试：**

| 场景 | 测试内容 |
|---|---|
| 周期数据不足 | 预测降级为默认值 |
| 壁纸文件过大 | 自动压缩或拒绝 |
| 关系空间成员上限 | 禁止继续邀请 |
| AI生成配额耗尽 | 提示购买或等待 |

**安全测试：**

| 场景 | 测试内容 |
|---|---|
| 周期数据隐私 | 日志不输出、截图不包含 |
| 关系空间越权 | 跨空间访问被拒绝 |
| 壁纸隐私 | 不自动上传云端 |
| 角色配额绕过 | 无法绕过权益检查 |

### 16.12 文档与交付标准

> 来源：`2026-06-02-phase3-extended-features-design.md` §九

**模块文档要求（每个模块完成后必须输出）：**
1. 模块职责说明
2. 接口契约文档
3. 数据结构说明
4. 依赖关系图
5. 测试报告
6. 已知限制

**API文档要求（所有对外接口必须包含）：**
1. 接口名称和描述
2. 入参结构和类型
3. 返回结构和类型
4. 错误码和错误信息
5. 调用示例
6. 权限要求

**变更记录要求（所有变更必须记录）：**
1. 变更日期
2. 变更内容
3. 变更原因
4. 影响范围
5. 兼容性说明

### 16.13 依赖版本锁定与变更审批

> 来源：`2026-06-02-phase3-extended-features-design.md` §2.3, §1.3

**依赖版本锁定策略：**

| 依赖 | 当前版本 | 锁定策略 |
|---|---|---|
| React | 18.x | 主版本锁定 |
| Three.js | 待定 | 主版本锁定 |
| localforage | 待引入 | 用于大文件本地存储 |

**需求变更审批流程：**
- 任何功能范围变更需经产品评审
- 技术架构变更需经架构评审
- 权益绑定变更需同步更新 monetization-and-membership-design.md
- 隐私分级变更需同步更新本设计文档

---

## 十七、UI/UX 设计系统

> 来源：`2026-06-02-persona-selection-ui-redesign.md`

### 17.1 身份系统（Identity System）

**选择方式：**
- 自由描述：用户可以用自然语言描述自己的身份和需求
- 标签组合：提供常用标签供用户快速选择（学生、打工人、宝妈、创作者等）
- AI 推荐：根据用户描述，AI 推荐默认模块组合

**数据隔离策略：**
- 核心数据共享：任务、笔记、专注记录等基础数据全身份共享
- 模块配置隔离：每个身份有独立的模块配置和布局
- 主题偏好隔离：每个身份可独立设置主题

**切换方式：**
- 手动切换：通过侧边栏的身份切换入口
- 快捷切换：支持快捷键或手势快速切换最近使用的身份
- 场景自动切换：根据时间或行为模式智能推荐切换

### 17.2 模块商店（Module Store）

**模块商店模式：**
- 推荐模块：AI 根据身份推荐默认模块
- 分类浏览：按场景分类（学习、办公、生活、健康等）
- 搜索功能：支持关键词搜索模块

**模块管理：**
- 添加模块：从模块商店添加
- 删除模块：长按进入编辑模式后删除
- 创建自定义模块：用户可创建空白模块并自定义内容
- 自定义模块内容：编辑模块内的数据和展示方式
- 调整模块顺序：拖拽调整

**默认模块：** 今日任务、专注计时、日历、笔记、天气、自定义模块按钮、数据统计

### 17.3 主界面布局

**整体结构：**
- 侧边栏（可隐藏/收起）：包含身份切换、模块商店、AI 助手、设置、主题切换
- 可拖拽画布：网格布局，用户可自由调整模块位置

**卡片设计（鸿蒙风格）：**
- 外观：圆角矩形、阴影、无边框、毛玻璃效果
- 大小：小(1x1)、中(2x1)、大(2x2)、全宽(1x2)
- 交互：单击展开详情、长按进入拖拽模式、双击进入编辑模式、滑动删除卡片、捏合缩放画布

**智能对齐：**
- 拖拽时自动吸附网格
- 显示对齐参考线
- 支持自由摆放和网格吸附两种模式

### 17.4 动画效果（鸿蒙系统风格）

**卡片动画：**
- 入场动画：从下方滑入，带弹性效果
- hover 效果：轻微上浮 + 阴影加深
- 点击反馈：缩放 + 阴影变化
- 拖拽状态：半透明 + 阴影增强

**过渡动画：**
- 页面切换：共享元素过渡
- 卡片展开：从原位置平滑展开
- 侧边栏展开：滑入 + 背景模糊渐变

**动画参数：**
- 缓动函数：cubic-bezier(0.4, 0, 0.2, 1)（鸿蒙标准）
- 时长：快速反馈 150ms、标准过渡 300ms、复杂动画 500ms
- 性能：使用 transform 和 opacity，避免触发重排

### 17.5 侧边栏设计

**默认状态：** 隐藏，只显示边缘触发区域

**内容：** 身份切换、模块商店、AI 助手、设置、主题切换、布局锁定/解锁

**展开方式：** 点击边缘按钮、快捷键（Cmd/Ctrl + B）、边缘滑动（桌面端鼠标悬停）

### 17.6 布局管理

- 自动保存布局变化
- 支持手动保存为预设布局
- 链接分享 / 应用内分享
- 链接导入 / 应用内导入
- 锁定后禁止编辑和拖拽，解锁后可自由编辑

### 17.7 AI 助手形象与交互

**形象：** 人物角色、动物宠物、幻想生物、简约图标（全部可自定义）

**交互方式：** 独立 AI 聊天窗口、模块内助手、全屏视频通话、悬浮小助手

**功能：** 自然语言交互、数据分析、智能推荐、内容生成、规划建议

### 17.8 通知设计

- 位置：居中显示
- 时长：2 秒
- 动画：缩放 + 淡入淡出
- 缓动：ease-in-out
- 主题：跟随当前主题

### 17.9 技术实现

- React 18 + TypeScript
- 拖拽库：@dnd-kit 或 react-beautiful-dnd
- 动画：Framer Motion 或 CSS Transitions
- 状态管理：React Context + useReducer

**文件结构：**
```
src/
  identity/
    IdentityProvider.tsx
    useIdentity.ts
    identityStore.ts
    types.ts
  module-store/
    ModuleStore.tsx
    ModuleRegistry.ts
    useModuleStore.ts
  canvas/
    DraggableCanvas.tsx
    CanvasCard.tsx
    useCanvasLayout.ts
  sidebar/
    Sidebar.tsx
    SidebarToggle.tsx
  animations/
    harmonyOS.ts
    useHarmonyAnimation.ts
```

### 17.10 实施顺序

1. 身份系统重构（自由描述 + 标签组合）
2. 模块商店实现
3. 可拖拽画布基础
4. 鸿蒙风格卡片设计
5. 侧边栏实现
6. 布局管理（保存/分享/导入）
7. AI 助手集成
8. 动画优化

---

## 十八、主题系统与视觉设计

> 来源：`2026-06-02-persona-selection-ui-redesign.md`

### 18.1 视觉舒适度原则

- 长时间使用的效率工具应以中性色、低饱和色和清晰层级为基础
- 高饱和色适合作为按钮、徽章、重点状态和激励反馈使用
- 正文与背景对比度目标不低于 4.5:1，标题、图标不低于 3:1
- 颜色不能作为唯一语义表达方式
- 深色模式避免纯黑背景和纯白正文造成眩光
- 采用 60/30/10 配色比例：大面积中性底色，小面积辅助色，少量强调色

### 18.2 主题系统（34个主题）

**极简系列 (minimal)：**
- 极简高级感 (minimal-premium)：米白、灰蓝、雾绿、木色、深灰文字
- 极简鼠尾草 (minimal-sage)：灰绿低饱和、留白稳定

**多巴胺系列 (dopamine)：**
- 奶油多巴胺 (cream-dopamine)：奶油底色、柔雾粉、浅黄、薄荷绿
- 多巴胺黄 (dopamine-yellow)：明亮黄色系
- 多巴胺绿 (dopamine-green)：清新绿色系
- 多巴胺粉 (dopamine-pink)：柔和粉色系
- 多巴胺组合 (dopamine-combo)：多色组合

**水墨系列 (ink)：**
- 水墨留白 (ink-wash)：宣纸米白、淡墨、松烟黑、灰绿、留白
- 水墨竹韵 (ink-bamboo)：竹绿、淡墨
- 水墨雨蓝 (ink-rainblue)：雨蓝、淡墨

**国风系列 (chinese)：**
- 新中式国风 (modern-chinese)：米白、青绿、朱砂、墨色、宫墙红

**二次元系列 (anime)：**
- 二次元治愈 (healing-anime)：樱粉、天青、电光紫、奶油白、柔和渐变
- 动漫天空 (anime-sky)：天空蓝、梦幻紫

**莫兰迪系列 (morandi)：**
- 莫兰迪温柔 (morandi-gentle)：灰粉、灰蓝、豆绿、暖米色、低对比柔和卡片
- 莫兰迪玫瑰 (morandi-rose)：玫瑰粉、灰调

**商务系列 (business)：**
- 商务蓝灰 (business-bluegray)：蓝灰、冷白、深蓝、少量金色或橙色强调
- 商务石墨 (business-graphite)：石墨灰、专业感

**夜间系列 (night)：**
- 夜间专注 (night-focus)：深蓝灰、非纯黑背景、柔和浅蓝/薄荷绿强调
- 夜间极光 (night-aurora)：极光紫、深蓝

**撞色系列 (clash)：**
- 撞色橙紫 (clash-pop-orange-violet)：橙色与紫色撞色
- 撞色蓝橙 (clash-blue-orange)：蓝色与橙色撞色
- 撞色霓虹赛博 (clash-neon-cyber)：霓虹绿、赛博紫
- 撞色果汁渐变 (clash-juicy-gradient)：果汁色渐变
- 撞色复古日落 (clash-retro-sunset)：复古橙、日落红

**华为系列 (huawei)：**
- 华为鸿蒙宇宙 (huawei-harmony-cosmos)：鸿蒙宇宙蓝、深邃感
- 华为Pura紫 (huawei-pura-violet)：Pura紫、优雅
- 华为Mate松绿 (huawei-mate-spruce)：Mate松绿、商务
- 华为珍珠雪 (huawei-pearl-snow)：珍珠白、纯净

**液态玻璃系列 (liquid)：**
- 液态玻璃极光 (liquid-glass-aurora)：极光色、液态玻璃质感
- 液态玻璃纯净 (liquid-glass-pure)：纯净液态玻璃

**其他材质：**
- 水滴 (aqua-droplet)：水滴蓝、清透感
- 流丝 (flow-silk)：丝绸质感、流动感

---

## 十九、用户场景设计

> 来源：`2026-06-02-persona-selection-ui-redesign.md`

### 19.1 学生/备考
- 科目进度、薄弱点优先级、错题复盘、间隔复习
- 模考倒计时、今日冲刺、学习专注计时
- 首页重点：薄弱科目、到期复习、错题难度、今日主线

### 19.2 职场/办公
- 项目看板、会议行动项、负责人、DDL、阻塞风险
- 周报素材池、时间盒、会议纪要/待办整理
- 首页重点：今日交付、待确认事项、风险、周报素材

### 19.3 内容创作者
- 灵感箱、选题孵化、大纲/草稿、发布日历
- 素材库、客户交付、内容数据复盘
- 首页重点：待孵化灵感、进行中内容、发布时间、客户交付

### 19.4 自律成长
- 低压力习惯、最小行动、断后恢复、能量曲线
- 温柔复盘、成就奖励、非惩罚式提醒
- 首页重点：今天最小行动、能量状态、恢复建议、轻复盘

### 19.5 女性周期/能量管理
- 经期开始/结束记录、周期预测、排卵/易孕期提示
- 经量记录、痛经等级、症状记录、情绪记录
- 睡眠/运动/饮食关联、今日能量建议
- 隐私锁、本地数据导出/删除
- 首页重点：周期阶段、今日能量、建议任务强度、症状快捷记录

### 19.6 生活管理/其他需求
- 健身计划、财务目标、职业成长、作息恢复
- 阅读计划、轻量日记、长期目标里程碑
- 首页重点：用户开启什么模块，就显示对应关键指标和今日行动

---

## 二十、隐私分级

> 来源：`2026-06-02-persona-selection-ui-redesign.md`

### 20.1 普通数据
- 任务、目标、普通笔记、主题选择
- 默认策略：本地保存，可在后续同步中默认纳入

### 20.2 私人数据
- 壁纸、情绪记录、生活日志、周报素材
- 默认策略：本地保存，云同步需提示

### 20.3 高敏感数据
- 女性周期、健康症状、财务目标、AI 输入中的隐私文本
- 默认策略：本地优先，不默认同步；同步、导出、备份必须单独授权

---

## 二十一、小程序设计

> 来源：`2026-06-02-persona-selection-ui-redesign.md`

### 21.1 定位
- 可独立使用的完整移动版应用
- 桌面端负责深度规划、长文复盘、模块配置和长期数据管理
- 小程序端负责移动场景下的计划执行、快速记录、专注打卡、状态查看、轻量复盘和模块入口

### 21.2 页面结构
底部导航五个主入口：
1. 首页：今日最重要事项、打卡、状态提醒和快捷入口
2. 计划：任务、日程、目标、优先级和复盘
3. 快速新增：降低记录成本
4. 模块：学习、办公、创作、健康、财务和生活模块
5. 我的：主题、隐私、同步、导出和设置

### 21.3 数据与同步
- 小程序端与桌面端共享统一 WorkspaceState 概念
- 通过平台适配层隔离存储差异
- 高敏感数据默认本地优先
- 小程序蓝图文件 `miniprogram/shared/blueprint.json` 预留 `entitlements` 字段

---

## 二十二、会员体系扩展

> 来源：`2026-06-01-monetization-and-membership-design.md`

### 22.1 六层收入结构（完整版）

**第 1 层：基础免费层（拉新/留存底盘）**
- 个人任务、每日打卡、番茄专注
- 2~3 套基础主题
- 基础统计（近 7 天）
- 单人使用、本地数据

**第 2 层：学习会员（核心稳定现金流）**
- 高级主题全解锁、高级模板库
- 多设备同步 + 云备份 + 数据导出（md/json/pdf）
- 高级统计（年度报告、热力图、专注复盘）
- 高级专注模式（白噪音、场景音、深度勿扰）
- 高级 AI 教练（计划生成、错题讲解、复盘建议）
- 自定义提醒、自定义快捷指令
- 定价：¥18/月、¥45/季、¥128/年

**第 3 层：Agent 智能体会员（高阶差异化）**
- 长期记忆系统、有记忆的 AI 搭子、自我进化机制
- 角色系统（内置 3-5 个 2D/3D 角色 + RPM 捏脸）
- 角色同步进化、记忆云同步
- 包含学习会员全部权益
- 定价：¥64/月（首发 ¥48/月）、¥328/年

**第 4 层：Agent PLUS 会员（顶配旗舰）**
- AI 3D 角色生成（每月 10 次额度）
- 实时反思、工具调用能力、角色进化全解锁
- 包含 Agent 会员全部权益
- 定价：¥128/月（首发 ¥98/月）、¥698/年

**第 5 层：关系互联付费**
- 创建多人「互联空间」：情侣、家庭、学习搭子、自律搭子
- 互推任务、共享待办、共享习惯、共享番茄
- 实时对战（专注 PK、连续打卡 PK、周排行）
- 关系成长值、纪念日、共同目标
- 计费模式：创建者承担，¥12/月

**第 6 层：AI 增值（按量/套餐）**
- AI 计划生成、错题讲解、复盘日报/周报/月报、拍照识别错题/OCR
- 额度模型：免费额度（8次/月）→ 学习会员额度（40次/月）→ Agent会员额度（100次/月）→ 加油包（永不过期）
- 消耗顺序：免费额度 → 会员内含额度 → 加油包额度
- 加油包定价：¥9.9/100次（¥0.099/次）、¥39/500次（¥0.078/次）

> **已砍掉的方案记录：** ¥29 不限量月卡 —— 已砍掉 —— 与 PLUS 冲突，会产生套利路径。

**第 7 层：增值素材/一次性内购**
- 主题皮肤单卖（¥6~18/套）
- 番茄场景包（图书馆、咖啡馆、雨夜、海边）
- 角色/宠物/成长皮肤
- 节日限定（春节、七夕、跨年）
- 模板单卖（考研全套、健身全套）
- 限定 IP 角色（¥18~68/永久解锁）

**第 7.5 层：创作者生态（UGC 主题/模板市场 + 平台抽成）**
- 创作者可上架：主题皮肤、学习计划模板、打卡习惯包、番茄场景包、角色/宠物/成长皮肤、节日/兴趣限定包
- 创作者准入：任何用户都可申请（实名 + 一次性审核），内容上架前平台审核
- 分成机制：付费内容创作者 70% / 平台 30%，免费内容创作者拿曝光与粉丝
- 创作者收入按月结算，达到提现门槛（¥100）可提现
- 防风险约束：内容审核、著作权声明、抽成与定价规则写在《创作者协议》
- 创作者激励：销量榜、新人榜、月度精选、平台首页资源位、创作者后台
- 节奏建议：首版不做，但数据模型与权益 code 命名空间从第一版预留。用户量/付费转化稳定后（建议 DAU 5000+）启动创作者内测。启动前先做「官方主题市场」打底。

**创作者生态数据契约：**

```ts
interface CreatorAsset {
  id: string
  creatorId: string
  type: 'theme' | 'template' | 'habit_pack' | 'focus_scene' | 'avatar_skin' | 'seasonal_pack'
  name: string
  description: string
  price: number
  previewUrls: string[]
  assetData: Record<string, unknown>
  reviewStatus: 'pending' | 'approved' | 'rejected'
  salesCount: number
  ratingAverage: number
  publishedAt?: string
  createdAt: string
}

interface CreatorAccount {
  userId: string
  displayName: string
  verified: boolean
  totalRevenue: number
  availableBalance: number
  totalSales: number
  totalAssets: number
  payoutMethod?: 'wechat' | 'alipay' | 'bank'
  payoutAccount?: string
  createdAt: string
}

interface CreatorPayout {
  id: string
  creatorId: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  period: { start: string; end: string }
  createdAt: string
  completedAt?: string
}
```

**创作者激励具体机制：**
- 销量榜、新人榜、月度精选
- 平台首页/Banner 资源位倾斜
- 创作者后台（销售数据、粉丝、收入、留存分析）
- 优秀创作者签约扶持（独家分成 80%、流量保底）

**第 8 层（预留）：B 端/机构版**
- 班级版、自习室版、企业自律版
- 短期不做，但数据模型预留 `org_id / space_type` 字段

### 22.2 Agent 能力 L0~L4 分层规范

| 层级 | 能力 | 模型/实现 | 单次成本 | 适用档位 |
|---|---|---|---|---|
| **L0 Demo** | 静态示例反思报告（不基于真实数据，仅供预览体验） | 静态资源 | 0 | 全员 |
| **L1 钩子** | 每月 1 次基于真实数据的反思报告，半切显示 | GPT-4o-mini 级别 + 行为数据预聚合 | ¥0.3~0.5 | 免费/学习会员 |
| **L2 基础 Agent** | 完整周反思 + 主 Persona×1 + 静默建议 + 行为观察 | 中等模型 | ~¥6~8/月 | Agent 会员 |
| **L3 进阶 Agent** | 6 个预设 Persona 可换主调 + 自定义 Persona×1 + 月度进化仪式 + 临时客串自动触发 | 同 L2 | +¥2~3/月 | Agent 会员 |
| **L4 旗舰** | 不限量反思 + 实时反思 + 自定义 Persona×3 + 工具代执行 + 3D 角色生成 + IP 联名 Persona | 顶级模型 | ~¥15~20/月 | PLUS |

### 22.3 "学习数据周报"与"Agent 反思"互补关系

| | 学习数据周报 | Agent 反思 |
|---|---|---|
| 本质 | 数据可视化（图表 + 统计 + 进度） | AI 解读（叙事 + 建议 + 一键行动） |
| 内容示例 | 本周完成率 78%、专注时长 12h、热力图 | "你周三晚效率低于平均 60%，建议把英语挪到周二" + [一键应用到下周] |
| 生成方式 | 规则引擎（不调 AI） | Agent + LLM |
| 单次成本 | ≈ 0 | ¥0.5~1 |
| 用户感知 | "我看到我做了什么" | "TA 看到了我没看到的东西" |
| 归属 | 学习会员核心权益 | Agent 会员核心权益 |

### 22.4 Agent 反思的硬质量要求

1. 必须基于具体数据：每条发现必须引用至少 1 个可量化指标
2. 必须有可执行建议：每条发现后必须配 1 条具体动作
3. 必须有一键应用按钮：建议涉及计划/任务调整时，必须支持用户点击直接应用
4. 质量降级策略：当无法生成符合要求的内容时，自动降级为"数据不足，本次跳过反思"

### 22.5 半切钩子展示规范（L1 专用）

- 上半部分（免费可见）：1 张数据概览卡片 + 1 条"具体真发现"
- 下半部分（付费解锁，灰色蒙层下隐约可见）：2~4 条额外发现 + 1 张趋势对比图 + "下周可执行计划"按钮 + "Agent 对你的初步画像" + 升级 Agent 会员 CTA
- 升级后保留：用户升级 Agent 会员后，所有过去被锁的半切反思自动解锁完整版

### 22.6 AI 额度规则

**通用额度消耗顺序硬规则：**
```
免费额度（ai_quota_free，8/月）→ 学习会员额度（ai_quota_study，40/月）→ Agent 会员额度（ai_quota_agent，100/月）→ 加油包（ai_quota，永不过期）
```

- 四个池子分开记，前端可分别展示
- 前端展示规范：分别展示「剩余免费 / 剩余学习会员 / 剩余 Agent / 剩余加油包」，每个池子独立显示剩余次数
- PLUS 用户持有 `ai_unlimited` 标记，不走消耗顺序，直接放行（软上限 5000/月）
- 加油包永久不过期

**Agent 反思/进化/静默建议——不算 AI 通用额度：**

| 功能 | 是否消耗 AI 通用额度 | 说明 |
|---|---|---|
| 每周反思报告（L2+） | ❌ | Agent 会员核心权益 |
| 月度进化仪式 | ❌ | 每月 1 次，成本可控 |
| 行为观察/画像更新 | ❌ | 后台默默运行 |
| Agent 主动提醒/静默建议 | ❌ | Agent 的"灵魂" |
| 角色同步进化 | ❌ | 装饰类，按行为触发 |
| L1 半切反思 | ❌ | 钩子层，平台承担成本 |
| Agent 聊天对话 | ✅ | 每条消息消耗 1 次 |
| AI 计划生成/错题讲解/拍照识题 | ✅ | 每次调用消耗 1 次 |
| 工具调用（PLUS 代执行） | ✅ | 每次调用消耗 1 次 |

### 22.7 EntitlementService 完整接口

```ts
type EntitlementSource =
  | 'sub_monthly' | 'sub_quarterly' | 'sub_yearly'
  | 'space_monthly' | 'space_yearly'
  | 'ai_pack_100' | 'ai_pack_500'
  | 'one_time_purchase'
  | 'monthly_grant'
  | 'trial'
  | 'invite_reward'
  | 'early_bird_gift'
  | 'persona_cameo_purchase'
  | 'persona_slot_purchase'

interface Entitlement {
  code: EntitlementCode
  source: EntitlementSource
  expireAt: string | null
  scope?: string
  remaining?: number
  resetAt?: string
  orderId?: string
  grantedAt: string
}

interface UserEntitlements {
  userId: string
  entitlements: Entitlement[]
  updatedAt: string
}

interface EntitlementService {
  has(userId: string, code: EntitlementCode, scope?: string): boolean
  consume(userId: string, code: EntitlementCode, n?: number): { ok: boolean; remaining?: number }
  list(userId: string): Entitlement[]
  grant(userId: string, e: Omit<Entitlement, 'grantedAt'>): void
  revoke(userId: string, predicate: (e: Entitlement) => boolean): void
}
```

### 22.8 兼容层 Adapter

```ts
type UserTier = 'free' | 'study' | 'agent' | 'agent_plus'

function resolveUserTier(entitlementService: EntitlementService, userId: string): UserTier {
  if (entitlementService.has(userId, 'agent_plus')) return 'agent_plus'
  if (entitlementService.has(userId, 'agent')) return 'agent'
  if (entitlementService.has(userId, 'study')) return 'study'
  return 'free'
}

function isPro(entitlementService: EntitlementService, userId: string): boolean {
  return entitlementService.has(userId, 'study')
    || entitlementService.has(userId, 'agent')
    || entitlementService.has(userId, 'agent_plus')
}
```

### 22.9 会员体系六大模块

| 模块 | 职责 | 优先级 |
|---|---|---|
| M1 Entitlement Core | 权益数据契约 + 查询/消耗/授予 API | P0 |
| M2 Product Catalog | 商品配置 + 后台可调价 | P0 |
| M3 Order & Payment | 订单 + 三渠道支付适配器 | P0 |
| M4 Subscription Provider | 订阅生命周期 + 续费 + 宽限期 | P0 |
| M5 AI Quota Provider | 四池额度 + 消耗顺序 | P1 |
| M6 Space Provider | 关系空间创建者付费模型 | P1 |
| M7 One-time/Theme Provider | 一次性内购 | P2 |
| M8 Membership UI | 我的会员页 + 升级页 + 价目表 | P0 |
| M9 Trial/Coupon/Invite | 赠送、试用、邀请奖励 | P1 |
| M10 Admin Console（最简） | 商品配置 + 赠送名额发放 | P1 |
| M11 Agent Tier Provider | 解析 Agent/Agent PLUS 权益 | P0 |
| M12 Avatar AI Gen Quota Provider | AI 3D 生成额度管理 | P1 |
| M13 Memory Sync Provider | 记忆云同步权益控制 | P1 |
| M14 Agent Membership UI | Agent 会员升级页 + 价目表 | P0 |
| M15 Creator Module | 创作者实名、后台、上架审核流程 | P2 |
| M16 Asset Marketplace | 主题/模板市场前台 + 购买流程 | P2 |
| M17 Payout Service | 创作者结算、提现、对账 | P2 |
| M18 Persona Provider | 解析 persona_* 权益 | P0 |
| M19 Reflection Tier Provider | 解析 reflection_* 权益 | P0 |
| M20 Age Gate & Minor Protection | 实名年龄验证 + 16/18 分级 + 时长限制 | P0 |
| M21 Persona Cameo Storefront | 付费客串 Persona 商店 | P2 |
| M22 Partner Matching（预留） | 实人搭子匹配（D 伏笔） | 预留 |

### 22.10 技术架构分层

```
┌─────────────────────────────────────────┐
│  业务层（任务、专注、空间、AI、主题、Agent）│
│      ↓ entitlement.has(code) / consume   │
└────────────────┬────────────────────────┘
                 │
         ┌───────▼────────┐
         │ Entitlement    │  ← 唯一权益查询入口
         │   Service      │
         └───────┬────────┘
                 │
    ┌────────────┼────────────┬─────────┬──────────┐
    │            │            │         │          │
┌───▼────┐ ┌────▼────┐ ┌─────▼───┐ ┌───▼────┐ ┌───▼────┐
│ Study  │ │ Agent   │ │ Space   │ │ AI     │ │ One-   │
│Provider│ │Provider │ │Provider │ │ Quota  │ │ time   │
└────────┘ └─────────┘ └─────────┘ └────────┘ └────────┘
                 │
         ┌───────▼────────┐
         │ Order Service  │
         └───────┬────────┘
                 │
       ┌─────────┼──────────┐
   ┌───▼──┐  ┌───▼──┐   ┌──▼───┐
   │WeChat│  │Apple │   │Alipay│
   │ Pay  │  │  IAP │   │ Pay  │
   └──────┘  └──────┘   └──────┘
```

### 22.11 冷启动策略

**分批 + 行为门槛的赠送方案：**

| 批次 | 名额 | 权益 | 行为门槛 |
|---|---|---|---|
| 第 0 批：内测种子 | 30 人 | 1 年学习会员 + 空间 + AI 不限量 | 主动联系 + 进反馈群 |
| 第 1 批：早鸟 | 300 人 | 1 年学习会员 | 注册 + 连续打卡 7 天 |
| 第 2 批：邀请奖励 | 不限 | 每邀 1 人各得 30 天学习会员 | 被邀人活跃 3 天 |
| 第 3 批：付费早鸟价 | 前 1000 名付费 | 年付 ¥49（半价） | 真金白银付费 |
| 第 4 批：Agent 推广 | 前 500 名学习会员 | 7 天 Agent 会员试用（推广期） | 学习会员且活跃 14 天 |

**赠送原则：**
1. 所有赠送必须绑「行为门槛」，杜绝白嫖党
2. 邀请奖励是无限名额，但被邀人需活跃才生效
3. 付费早鸟价 ≠ 赠送，它才是验证商业模型的关键
4. 不提供终身会员，避免永久成本风险

**赠送权益的技术落地：** 完全复用 Entitlement 模型，只需对应 source：
- `early_bird_gift` → 300 个名额，code: study，expireAt: +365 天
- `invite_reward` → 不限，code: study，expireAt: +30 天
- `trial` → 系统自动发，code: study/agent，expireAt: +7 天

> **技术说明：** 券和试用本质上都是临时权益，复用同一 Entitlement 模型，通过 `source` 字段区分来源。

### 22.12 跨端要求

- 小程序、桌面端、Web 端共享同一 `user_id` 与权益数据
- 桌面端/Web 端离线时使用本地缓存的权益快照，联网后同步刷新
- 小程序内 IAP 必须走微信支付；iOS 上 IAP 必须走 Apple
- Agent 3D 角色仅在 Web/Electron 端支持，小程序自动降级为 2D 立绘

### 22.13 支付与数据合规

- 不在客户端硬编码任何支付密钥、AppSecret
- 所有支付凭证服务端二次校验
- 退款/订单查询走服务端，客户端只展示状态
- 价目表服务端下发（支持后台调价 + 灰度）
- 用户数据导出权与删除权（合规要求）
- 学生认证流程涉及证件，必须脱敏存储 + 限期销毁
- 记忆数据本地存储优先，云同步需加密传输

**学生认证折扣：** 学生证审核通过后享 5 折优惠（学习会员 ¥9/月，Agent 会员 ¥32/月）。

**续费失败处理流程：** 续费失败 → 宽限期（3~7 天，期间权益正常）→ 宽限期结束仍失败 → 自动降级到免费档 → 数据保留 90 天。

**到期提醒：** 到期前 7 天和 1 天各发送一次系统提醒。

**退款/取消订阅策略：** 退款或取消订阅后权益不立即回收，到期后自动回收（体验更好）。

**游客模式：** 允许不登录使用免费功能（任务、打卡、番茄专注），付费操作触发登录。

**设备绑定：** 限制同时登录设备数（免费 1 台、学习会员 2 台、Agent 3 台、PLUS 5 台），防共享账号。

**登录方式：** 微信登录、Apple 登录、手机号登录三种方式。

### 22.14 成本模型

| 成本项 | 学习会员/月 | Agent 会员/月 | PLUS/月 |
|---|---|---|---|
| LLM Token（通用额度） | ~¥0.5 | ~¥3 | ~¥8 |
| Agent 反思/进化/静默（不算额度） | ¥0 | ~¥4 | ~¥8 |
| 3D 资产生成 API | ¥0 | ¥0 | ~¥10 |
| 云存储 + 同步 | ¥0 | ¥0.5 | ¥1 |
| 支付通道 + 渠道分成 | ¥3 | ¥8 | ¥16 |
| **合计成本** | **~¥4** | **~¥16** | **~¥43** |
| **毛利率** | ~77% | ~67% | ~56% |

---

## 二十三、细节补充

> 来源：各源文档细节遗漏补充

### 23.1 自定义 Persona 调度特殊性

- 自定义 Persona 不能作为自动客串触发，仅在用户主动切换时生效
- 自定义 Persona 共享主 MemoryProfile（首版），二期增加 PersonaPrivateMemory
- 社区 Persona 导入后按 CustomPersona 槽位扣减

### 23.2 临时客串戏谑感风险对策

- 业务时段 9:00-18:00 仅触发学习类客串
- 情感类客串仅 18:00 后触发
- 避免在严肃学习场景中出现戏谑感

### 23.3 MemoryProfile 字段设计原则

- 每个字段都是可选的，缺失字段不注入 prompt
- `identity.occupation` 和 `identity.currentRole` 分开：前者是职业，后者是当前角色
- `boundaries` 是安全层，用户可设置禁忌话题
- `emotional` 是动态层，随行为变化
- `meta.sourceBreakdown` 记录画像来源分布（手动/对话/行为）

### 23.4 MemoryEvents 检索方式

- 关键词匹配：全文搜索 summary 字段
- 时间范围：from/to 过滤
- 标签过滤：按 tags 筛选
- 类别过滤：按 MemoryEventCategory 筛选
- 后续迭代可接入 Embedding 向量检索

### 23.5 MemoryObserver 接入方式

- 在现有 workspaceStore.save() 的调用链中，以 Hook/Middleware 形式注入
- 不修改 workspaceStore 本身
- 符合「优先扩展点，不改核心流程」原则

### 23.6 MemorySummarizer 实现说明

- 调用 aiProvider，使用专门的 AiTaskKind='memory-reflection'
- 事件先本地聚合再喂 LLM，控制 token 成本
- 置信度 < 0.6 的提案不进入仪式确认，仅静默记录

### 23.7 AvatarRenderer 平台自动选择

```ts
function createRenderer(platform: AvatarPlatform, asset: AvatarAsset): AvatarRenderer {
  switch (asset.renderMode) {
    case '3d_gltf': return new Renderer3D()
    case '2d_live2d': return new Renderer2D()
    case '2d_sticker': return new RendererSticker()
  }
}
```

### 23.8 EvolutionRitualUI 底部提示

"这些理解基于你最近 N 天的行为和对话，你随时可以在设置→我的画像中修改。"

### 23.9 待定疑点

| 疑点 | 决策状态 | 预计决策时间 |
|---|---|---|
| 关系空间实时通信方案（WebSocket vs 轮询） | 待定 | 开发前确认 |
| 3D渲染引擎选型（Three.js vs Babylon.js） | 待定 | 开发前确认 |
| 女性周期AI建议是否消耗通用额度 | 待定 | 开发前确认 |
| 壁纸云同步策略 | 待定 | 二期规划 |
| 支付渠道首发（建议：微信支付 + Apple IAP，支付宝二期） | 待定 | 开发前确认 |
| 学生认证服务商选型 | 待定 | 开发前确认 |
| 后台管理系统方案（现成方案 vs 自研最简版） | 待定 | 开发前确认 |
| 数据库选型（与全局架构方案对齐后再定） | 待定 | 架构评审时确认 |
| 内置角色具体形象比例（人型 vs 动物伙伴） | 待定 | 设计评审时确认 |
| 实名年龄验证服务商选型 | 待定 | 开发前确认 |
| 生成式 AI 备案路径 | 待定 | 上线前 90 天启动 |

### 23.10 非目标

- 移动端适配（本次只关注桌面端）
- 实时协作
- 第三方集成
- 医疗诊断
- 默认云同步健康数据
- 主题市场（首版不做）
- 社区功能（首版不做）
- 复杂财务记账

### 23.11 验证标准

- [ ] 用户可以通过自由描述创建身份
- [ ] 用户可以通过标签组合快速选择身份
- [ ] 不同身份显示不同的默认模块
- [ ] 模块可以自由添加/删除/排序
- [ ] 画布支持拖拽布局
- [ ] 动画流畅，符合鸿蒙风格
- [ ] 布局自动保存
- [ ] 侧边栏可以正常展开/收起

---

## 二十四、文档边界

| 责任 | 本文档章节 |
|---|---|
| 记忆系统、画像 Schema、自我进化机制 | §二、§三 |
| Persona 关系结构、6 个预设、临时客串、自定义 Persona、社区 | §四 |
| 角色建模、3D 渲染、角色进化、AI 生成 | §五 |
| Agent Runtime、聊天窗口、静默建议、备考陪伴、情绪日记 | §六 |
| 5 层安全围栏、未成年人保护、关系健康度 | §七 |
| 会员档位、定价、EntitlementCode | §八 |
| AiTaskKind 扩展、模型映射 | §九 |
| 模块划分、实施路线、当前状态 | §十、§十一、§十二 |
| 风险与对策 | §十三 |
| 与全局规则的对齐说明 | §十四 |
| 备考场景工具模块（错题本/记忆卡/考试记录/学习计划/专注计时/AI基础设施/System Prompt/风险/开发流程） | §十五 |
| 关系空间、女性周期管理、壁纸上传、3D角色生成、模块拆分、风险预判、测试覆盖、交付标准 | §十六 |
| UI/UX 设计系统（身份系统/模块商店/画布/动画/侧边栏） | §十七 |
| 主题系统与视觉设计（34个主题） | §十八 |
| 用户场景设计（6大场景） | §十九 |
| 隐私分级（3级） | §二十 |
| 小程序设计 | §二十一 |
| 会员体系扩展（收入结构/Agent分层/额度规则/冷启动/成本模型） | §二十二 |
| 细节补充（调度特殊性/设计原则/检索方式/待定疑点） | §二十三 |
