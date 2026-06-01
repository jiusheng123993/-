# 记忆系统、自我进化 Agent 与角色建模设计

> 本文档面向「个人学习规划记录」产品（桌面端 Electron + Web + 微信小程序三端），定义长期记忆系统、自我进化 Agent、角色建模子系统的架构、数据契约、模块边界、会员耦合、定价与风险，作为后续实现计划的唯一权威依据。
>
> 差异化定位：**「长跟你成长的 AI 搭子」**——市面上首个具备结构化画像 + 自我进化闭环 + 角色同步成长的学习陪伴 Agent。

***

## 一、系统总览

### 1.1 三大子系统关系

```
┌──────────────────────────────────────────────────────────────────┐
│                        用户交互层                                 │
│   聊天窗口（Agent 会员）  │  静默注入建议  │  进化仪式卡片         │
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

### 1.2 核心设计原则

1. **三层正交**：记忆（内容）、Persona（语气/角色设定）、Avatar（外观/动画）三者独立可替换，互不耦合。
2. **唯一出口**：所有 LLM 调用必经 `aiProvider`；所有记忆写入必经 `MemoryStore`；所有 prompt 注入必经 `MemoryInjector`。
3. **本地优先**：默认 IndexedDB，会员开启云同步后走 `CloudSyncAdapter`。
4. **用户主权**：画像可编辑、进化可否决、事件可删除、数据可导出/清空。
5. **渐进降级**：Web/Electron 跑 3D 角色；小程序自动降级到 2D 立绘 + 表情切换。

***

## 二、记忆系统

### 2.1 MemoryProfile（结构化画像 Schema）

画像是一份**用户可编辑、Agent 可更新、系统可校验**的 JSON 文档。所有字段均为可选（用户可以只填一部分），缺失字段不注入 prompt。

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
    sourceBreakdown: {
      manual: number
      conversation: number
      behavior: number
    }
  }
}
```

**字段设计原则**：

* 每个字段都是可选的，用户可以只填一部分，缺失字段不注入 prompt。

* `identity.occupation` 和 `identity.currentRole` 分开——岗位会变，但职业方向相对稳定。

* `boundaries` 是安全层——Agent 绝不触碰 tabooTopics / triggerWords / dontMention。

* `emotional` 是动态层——每次反思循环都可能更新，是"自我进化"最直观的体现。

* `meta.sourceBreakdown` 记录画像来源分布，让用户知道"我对你的理解有多少是你说的、多少是我观察的"。

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

**检索方式（起步版，不上向量库）**：

* 关键词匹配（`summary` 字段）

* 时间范围（`timestamp`）

* 标签过滤（`tags`）

* 类别过滤（`category`）

后续迭代可接入 Embedding 向量检索（如 `transformers.js` 本地嵌入或云端 API），但起步版保持轻量。

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
}

interface ProfileSnapshot {
  id: string
  profile: MemoryProfile
  changedFields: string[]
  reason: string
  createdAt: string
}

interface EventFilter {
  from?: string
  to?: string
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

**存储实现**：

* IndexedDB（主存储，复用 `workspaceStore` 的封装风格）

* `CloudSyncAdapter`（接口先建，实现后置，Agent PLUS 会员开启时启用）

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

**接入方式**：在现有 `workspaceStore.save()` 的调用链中，以 Hook/Middleware 形式注入，不修改 `workspaceStore` 本身。

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

**实现**：调用 `aiProvider`，使用专门的 `AiTaskKind = 'memory-reflection'`（需扩展 `AiTaskKind` 类型）。System prompt 由 `MemoryInjector` 统一管理。

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

**注入策略**：

* 画像压缩为 200-400 token 的结构化片段，拼接到 system prompt 末尾。

* 事件检索按相关性取 top-5，压缩为 100-200 token。

* 总注入量控制在 600 token 以内，避免挤占用户对话空间。

***

## 三、自我进化机制（Self-Evolving Agent Loop）

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

**默认触发规则**：

* Cron：每周日 21:00（用户可在设置中调整）

* 事件阈值：

  * 连续 3 天异常作息（凌晨 2 点后仍在记录）

  * 目标达成（progress = 100）

  * 连续 7 天无复盘

  * 连续 5 天专注时长 < 目标的 50%

  * 考试倒计时归零

### 3.3 EvolutionLedger（进化账本）

```ts
interface EvolutionEntry {
  id: string
  triggeredBy: 'cron' | 'event_threshold' | 'manual'
  triggerDetail: string
  proposedChanges: ProfileChangeProposal[]
  userDecision: 'accepted' | 'rejected' | 'modified'
  finalChanges: Array<{
    fieldPath: string
    oldValue: unknown
    newValue: unknown
  }>
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

**关键约束**：

* 置信度 < 0.6 的提案不进入仪式确认，仅静默记录。

* 用户拒绝的提案，同类事件在下次反思时降低权重。

* 每次进化都可一键回滚到上一个 snapshot。

### 3.4 EvolutionRitualUI（仪式感呈现）

**每周成长汇报卡片**：

* 标题：「这周我对你的理解又深了一点 🌱」

* 内容：列出 1-3 条画像变更提案，每条附带依据事件摘要

* 操作：✅ 接受 / ❌ 不对 / ✏️ 改一下

* 底部：「这些理解基于你最近 N 天的行为和对话，你随时可以在设置→我的画像中修改」

**事件驱动即时通知**：

* 触发条件：事件阈值达到

* 形式：Agent 聊天窗口自动弹出一条消息

* 示例：「我注意到你连续 3 天凌晨 2 点还在学习，是不是最近压力比较大？要不要调整一下节奏？」

***

## 四、角色建模子系统

### 4.1 AvatarRegistry（角色注册表）

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
  idle?: string
  talking?: string
  thinking?: string
  encouraging?: string
  celebrating?: string
  sad?: string
  waving?: string
}

interface AvatarMorphTargetMap {
  smile?: string
  frown?: string
  surprised?: string
  neutral?: string
}

interface AvatarRegistry {
  list(filter?: { platform?: AvatarPlatform; tierRequired?: string }): AvatarAsset[]
  getById(id: string): AvatarAsset | null
  register(asset: AvatarAsset): void
  unregister(id: string): void
}
```

### 4.2 AvatarRenderer（渲染抽象层）

```ts
interface AvatarRenderer {
  initialize(container: HTMLElement, asset: AvatarAsset): Promise<void>
  playAnimation(name: keyof AvatarAnimationMap): void
  setMorphTarget(name: keyof AvatarMorphTargetMap, weight: number): void
  destroy(): void
  resize(width: number, height: number): void
}
```

**实现策略**：

* `Renderer3D`：Three.js + glTF Loader，Web/Electron 端使用

* `Renderer2D`：Lottie / CSS Sprite 动画，小程序端使用

* `RendererSticker`：静态 PNG 切换，最低端降级

**平台自动选择**：

```ts
function createRenderer(platform: AvatarPlatform, asset: AvatarAsset): AvatarRenderer {
  if (asset.renderMode === '3d_gltf' && platform !== 'miniprogram') {
    return new Renderer3D()
  }
  if (asset.renderMode === '2d_live2d' || platform === 'miniprogram') {
    return new Renderer2D()
  }
  return new RendererSticker()
}
```

### 4.3 AvatarAnimator（动画状态机）

```ts
type AvatarMood = 'neutral' | 'happy' | 'encouraging' | 'thinking' | 'concerned' | 'celebrating'

interface AvatarAnimator {
  setMood(mood: AvatarMood): void
  onMoodChange(callback: (mood: AvatarMood) => void): void
  getCurrentMood(): AvatarMood
}
```

**情绪映射**（由 Agent 意图驱动）：

* Agent 回答问题 → `thinking` → `talking`

* 用户完成任务 → `celebrating`

* 用户连续拖延 → `concerned`

* 日常待机 → `neutral` / `happy`（随机切换 idle 动画）

### 4.4 AvatarSourceAdapter（资产来源）

```ts
interface AvatarSourceAdapter {
  sourceId: string
  displayName: string
  isAvailable(tier: string): boolean
  fetchAsset(params: Record<string, unknown>): Promise<AvatarAsset>
  listAvailable(params?: Record<string, unknown>): Promise<AvatarAsset[]>
}
```

**起步实现**：

* `BuiltinAvatarSource`：内置 3-5 个角色（Sketchfab CC0 / Quaternius CC0 / VRoid Hub 公开作品），2D 备份由 seedream 生成

* `ReadyPlayerMeSource`：RPM SDK 集成，Agent 会员可用

* `MeshyAISource`：文字/图片→3D API，Agent PLUS 会员可用

* `UserUploadSource`：用户上传 glTF / 图片，Agent 会员可用

### 4.5 AvatarCustomizer（捏脸/换装/起名）

```ts
interface AvatarCustomizer {
  openCreator(params: { sourceId: string; tier: string }): Promise<AvatarAsset>
  bindPersona(avatarId: string, personaId: PersonaId): void
  setName(avatarId: string, name: string): void
}
```

### 4.6 AvatarEvolution（角色同步进化）

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

**示例解锁规则**：

* 连续专注 7 天 → 解锁「专注光环」光效

* 完成首个目标 → 解锁「毕业帽」装饰

* 画像 `emotional.motivationLevel` 从 `low` 变为 `high` → 解锁「能量满格」动画

* 累计反思 10 次 → 解锁「成长之翼」特效

***

## 五、Agent Runtime（聊天 + 静默双模式）

### 5.1 AgentRuntime

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

### 5.2 聊天窗口 UI

* 位置：页面右下角浮动按钮，点击展开聊天面板

* 布局：上方角色动画区（AvatarRenderer），下方对话区

* 角色：根据用户选择的 AvatarAsset 渲染，动画由 AgentMood 驱动

* 输入：文本输入框 + 语音输入（后续迭代）

### 5.3 静默注入建议

* 位置：页面内嵌提示卡片（非弹窗，不打断用户）

* 触发：页面加载时 / 任务状态变化时 / 定时检查

* 示例：

  * 「你昨晚学到了凌晨 2 点，今天建议轻松一点 🌙」

  * 「高数进度 72%，按当前节奏还有 8 天可以完成，加油 💪」

  * 「连续 3 天没复盘了，要不要花 5 分钟回顾一下？」

***

## 六、会员体系扩展

### 6.1 新增档位

在现有 `EntitlementCode` 基础上扩展：

```ts
type EntitlementCode =
  | 'pro'
  | 'space'
  | 'ai_quota'
  | 'ai_quota_pro'
  | 'ai_quota_free'
  | 'theme_<id>'
  | 'template_<id>'
  | 'org'
  | 'agent'              // Agent 会员
  | 'agent_plus'         // Agent PLUS 会员
  | 'avatar_rpm'         // Ready Player Me 捏脸
  | 'avatar_ai_gen'      // AI 3D 角色生成配额
  | 'memory_sync'        // 记忆云同步
  | 'evolution_ritual'   // 自我进化仪式
  | 'avatar_evolution'   // 角色同步进化
```

### 6.2 档位权益矩阵

| 功能     | 免费     | 学习会员(Pro)  | Agent 会员 | Agent PLUS |
| ------ | ------ | ---------- | -------- | ---------- |
| 基础功能   | ✅      | ✅          | ✅        | ✅          |
| 高级主题   | 2-3套   | 全部         | 全部       | 全部         |
| 云同步    | ❌      | ✅          | ✅        | ✅          |
| AI 功能  | 8次/月   | 50次/月      | 50次/月    | 50次/月      |
| 角色     | 1个固定2D | 3-5内置2D/3D | +RPM捏脸   | +AI生成3D    |
| 记忆     | ❌      | 仅手填画像      | 三者融合     | 三者融合+云同步   |
| Agent  | ❌      | 仅静默建议      | 聊天+静默    | 聊天+静默+工具调用 |
| 自我进化   | ❌      | ❌          | ✅每周反思+仪式 | ✅实时反思+角色进化 |
| 3D生成配额 | ❌      | ❌          | ❌        | 10次/月      |

### 6.3 定价

| 档位         | 月标价    | 首发月价      | 年付价    | 备注              |
| ---------- | ------ | --------- | ------ | --------------- |
| 免费版        | ¥0     | —         | —      | <br />          |
| 学习会员(Pro)  | ¥18/月  | ¥18       | ¥128/年 | 不变，基础锚点         |
| Agent 会员   | ¥64/月  | ¥48/月（限时） | ¥328/年 | 高一档锚点，为溢价留空间    |
| Agent PLUS | ¥128/月 | ¥98/月（限时） | ¥698/年 | 留出 IP/AI 生成加价空间 |

**增值消费**：

* AI 3D 角色生成额度包：¥30 / 10 次

* 记忆云同步加量包：¥10 / 1GB / 年（默认 100MB 免费）

* 限定 IP 角色：¥18–¥68 / 永久解锁

### 6.4 成本模型

| 成本项         | 学习会员/月   | Agent 会员/月 | PLUS/月    |
| ----------- | -------- | ---------- | --------- |
| LLM Token   | \~¥0.5   | \~¥6-8     | \~¥15-20  |
| 3D 资产生成 API | ¥0       | ¥0         | \~¥10     |
| 云存储 + 同步    | ¥0       | ¥0.5       | ¥1        |
| 支付通道+渠道分成   | ¥3       | ¥8         | ¥16       |
| **合计成本**    | **\~¥4** | **\~¥15**  | **\~¥42** |
| **毛利率**     | \~77%    | \~69%      | \~57%     |

### 6.5 与现有会员的兼容

| 旧档位       | 新档位映射              | 处理                     |
| --------- | ------------------ | ---------------------- |
| 现有 Pro 月付 | → 学习会员(Pro) ¥18/月  | 价格不变，权益不缩水             |
| 现有 Pro 年付 | → 学习会员(Pro) ¥128/年 | 价格不变                   |
| 现有 Pro 终身 | → 学习会员(Pro) 终身     | 权益不变                   |
| 新增        | Agent 会员           | 全新档位，赠送1个月试用给现有 Pro 用户 |
| 新增        | Agent PLUS         | 全新档位                   |

**代码层面**：新增 `tier: 'free' | 'study' | 'agent' | 'agent_plus'`，旧 `isPro` 布尔字段通过兼容层 Adapter 映射为 `tier === 'study' || tier === 'agent' || tier === 'agent_plus'`。

***

## 七、AiTaskKind 扩展

现有 `AiTaskKind` 需要扩展以支持记忆和 Agent 功能：

```ts
type AiTaskKind =
  | 'daily-plan' | 'task-breakdown' | 'meeting-actions'
  | 'daily-review' | 'weekly-report'
  | 'memory-reflection'      // 事件→画像归纳
  | 'agent-chat'             // Agent 聊天对话
  | 'silent-suggestion'      // 静默建议生成
  | 'avatar-evolution-check' // 角色进化检查
```

***

## 八、模块划分

| 模块                        | 路径                                          | 职责                          | 优先级 |
| ------------------------- | ------------------------------------------- | --------------------------- | --- |
| M1 MemoryProfile          | `src/memory/memoryProfile.ts`               | 画像 Schema + 校验 + 合并策略       | P0  |
| M2 MemoryEvents           | `src/memory/memoryEvents.ts`                | 事件库 CRUD + 检索               | P0  |
| M3 MemoryStore            | `src/memory/memoryStore.ts`                 | IndexedDB 存储 + 版本管理 + 导出/清空 | P0  |
| M4 MemoryObserver         | `src/memory/memoryObserver.ts`              | 行为→事件抽取 Hook                | P0  |
| M5 MemorySummarizer       | `src/memory/memorySummarizer.ts`            | 事件→画像归纳（调 AI）               | P1  |
| M6 MemoryInjector         | `src/memory/memoryInjector.ts`              | prompt 注入唯一出口               | P1  |
| M7 ReflectionEngine       | `src/agent/evolution/reflectionEngine.ts`   | 反思触发 + 执行                   | P1  |
| M8 EvolutionLedger        | `src/agent/evolution/evolutionLedger.ts`    | 进化账本 CRUD                   | P1  |
| M9 EvolutionRitualUI      | `src/agent/evolution/EvolutionRitualUI.tsx` | 仪式感 UI 组件                   | P2  |
| M10 AgentRuntime          | `src/agent/agentRuntime.ts`                 | 聊天+静默双模式编排                  | P1  |
| M11 AgentChatUI           | `src/agent/AgentChatUI.tsx`                 | 聊天窗口 UI                     | P2  |
| M12 SilentSuggestionUI    | `src/agent/SilentSuggestionUI.tsx`          | 静默建议卡片 UI                   | P2  |
| M13 AvatarRegistry        | `src/avatar/avatarRegistry.ts`              | 角色注册表                       | P1  |
| M14 AvatarRenderer        | `src/avatar/renderers/`                     | 3D/2D/贴图渲染器                 | P1  |
| M15 AvatarAnimator        | `src/avatar/animator.ts`                    | 动画状态机                       | P1  |
| M16 AvatarSourceAdapter   | `src/avatar/sources/`                       | 资产来源 Adapter                | P2  |
| M17 AvatarCustomizer      | `src/avatar/customizer.ts`                  | 捏脸/换装/起名                    | P2  |
| M18 AvatarEvolution       | `src/avatar/avatarEvolution.ts`             | 角色同步进化                      | P2  |
| M19 CloudSyncAdapter      | `src/memory/sync/cloudSyncAdapter.ts`       | 云同步 Adapter（接口先建）           | P3  |
| M20 MemoryProfileEditorUI | `src/memory/MemoryProfileEditorUI.tsx`      | 画像编辑 UI                     | P2  |

***

## 九、风险与对策

| 风险                       | 等级 | 对策                                           |
| ------------------------ | -- | -------------------------------------------- |
| LLM 幻觉导致画像漂移             | 高  | 强制依据事件链；置信度 < 0.6 不进提案；EvolutionLedger 可一键回滚 |
| Token 成本失控               | 高  | 反思任务批量定时跑；事件先本地聚合再喂 LLM；高配档才开实时反思            |
| 用户疲劳（仪式太烦）               | 中  | 仪式频率可配置；普通会员不打扰；Agent 会员才开启                  |
| 隐私顾虑                     | 高  | 本地反思 + 加密上云；进化账本可一键导出/清空；画像用户可编辑             |
| 3D 角色加载慢                 | 中  | 懒加载；预加载 idle 动画；降级到 2D                       |
| 小程序包体超限                  | 高  | 小程序端只用 2D 贴图；3D 资产走 CDN 按需加载                 |
| Ready Player Me SDK 国内访问 | 中  | 备选方案：自建简化捏脸工具；或用 Meshy AI 替代                 |
| 会员体系重构影响现有用户             | 高  | 旧权益不缩水；兼容层 Adapter；赠送1个月 Agent 试用            |

***

## 十、实施路线建议

### Phase 1：记忆基础（M1-M4）

* MemoryProfile Schema + 校验

* MemoryEvents CRUD + 检索

* MemoryStore IndexedDB 实现

* MemoryObserver Hook 接入

### Phase 2：记忆闭环（M5-M6）

* MemorySummarizer（调 AI 归纳）

* MemoryInjector（prompt 注入）

* AiTaskKind 扩展

### Phase 3：Agent 核心（M10-M12）

* AgentRuntime 聊天+静默双模式

* AgentChatUI 聊天窗口

* SilentSuggestionUI 静默建议卡片

### Phase 4：自我进化（M7-M9）

* ReflectionEngine 反思触发

* EvolutionLedger 进化账本

* EvolutionRitualUI 仪式感 UI

### Phase 5：角色系统（M13-M18）

* AvatarRegistry + 内置角色

* AvatarRenderer 3D/2D 渲染

* AvatarAnimator 动画状态机

* AvatarEvolution 角色同步进化

### Phase 6：云同步与高级功能（M19-M20）

* CloudSyncAdapter 云同步

* MemoryProfileEditorUI 画像编辑

* AvatarSourceAdapter 外部资产源

* AvatarCustomizer 捏脸/换装

***

## 十一、与全局规则的对齐说明

* ✅ 优先扩展点：所有新增模块均为独立 Adapter/Registry/Service，不修改核心流程

* ✅ 接口契约保护：MemoryProfile、MemoryEvent、EvolutionEntry 等字段约定为契约，变更需走兼容流程

* ✅ 数据隔离：所有记忆绑 user\_id，云同步加密传输

* ✅ 安全合规：画像数据本地存储，云同步加密，用户可导出/清空

* ✅ 跨端一致：Web/Electron 跑 3D，小程序降级 2D，数据模型统一

* ✅ 测试可绑定：每个模块独立，便于单元测试与契约测试

* ✅ 用户主权：画像可编辑、进化可否决、事件可删除、数据可导出

