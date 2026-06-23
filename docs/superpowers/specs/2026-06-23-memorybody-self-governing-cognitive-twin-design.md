# MemoryBody 自治理认知孪生系统完整设计

> 版本：v1.0 | 日期：2026-06-23 | 状态：完整方案定稿
>
> 本文档用于固化 MemoryBody 后续建设的终局蓝图。目标不是普通记忆列表，也不是简化版 Memory Center，而是构建一个可解释、可纠正、可迁移、可审计、可演化、可治理的个人认知孪生系统。

---

## 一、定位与目标

### 1.1 产品定位

MemoryBody 自治理认知孪生系统是星寰海 AI 伴侣的长期认知基础设施。它的职责不是简单保存聊天偏好，而是持续形成、校准、解释和治理 AI 对用户的长期理解。

系统最终要支持以下体验：

1. AI 越用越懂用户，不需要每次重新说明偏好、边界和目标。
2. 用户可以看见 AI 当前如何理解自己。
3. 用户可以确认、纠正、忘记、保护和回滚记忆。
4. AI 能说明为什么使用某条记忆。
5. AI 能识别自己不确定、可能误解或需要确认的地方。
6. 记忆默认本地优先，敏感内容默认安全隔离。
7. 后续 Agent、AI 伴侣、工程任务和知识图谱可以共享同一套受治理的认知基础。

### 1.2 非目标

本系统不是：

1. 普通 localStorage 偏好缓存。
2. 简单 atoms 列表管理器。
3. 只为 prompt 拼接服务的上下文片段集合。
4. 以 KnowledgeGraph 为核心的图数据库。
5. 不可解释、不可纠错、不可审计的黑箱画像。

### 1.3 核心原则

1. 方案完整，实施分阶段。
2. MemoryBody 是认知底座，Memory Center 是控制台，不得反向耦合。
3. 用户最新明确纠正优先于历史记忆和模型推断。
4. 高价值记忆必须可追溯、可解释、可纠正。
5. 敏感内容默认不记，必要时只保留脱敏状态。
6. 临时情绪、单次偏好和跨场景推断不得永久化。
7. 记忆不是越多越好，要有价值、成本、风险和使用预算。
8. 所有核心行为必须可测试、可回滚、可交接。

---

## 二、方案分层

完整方案采用 C+++ 终局蓝图，同时按可落地程度拆分为 C、C+、C++、C+++ 四级。

### 2.1 C：Memory Center 用户入口

C 层解决用户可见控制问题：

1. 记忆总览。
2. 记忆列表。
3. 记忆详情。
4. 确认、纠正、忘记。
5. 生命周期、敏感级别、置信度、强度展示。
6. 空状态和安全提示。

C 层不是终局，只是第一批用户可见入口。

### 2.2 C+：MemoryBody Cognitive OS

C+ 层解决 AI 伴侣长期认知操作系统问题：

1. CognitiveProfile 综合用户画像。
2. GoalModel 目标模型。
3. RelationshipModel 关系模型。
4. EmotionModel 情绪状态模型。
5. ScenarioMemory 场景记忆。
6. ReflectionEngine 反思引擎。
7. ExplainabilityEngine 可解释引擎。
8. PromptContextComposer prompt 调度器。

### 2.3 C++：Personal Cognitive Twin

C++ 层解决用户认知孪生问题：

1. DecisionModel 用户决策模型。
2. TasteModel 用户品味模型。
3. TrustModel 用户信任模型。
4. MisunderstandingMemory AI 误解记忆。
5. RequirementGravity 需求重力模型。
6. MemoryNegotiation 记忆协商机制。
7. ContextualIdentity 多身份上下文。
8. TemporalUserModel 时间演化用户模型。
9. MemoryQuality 记忆质量评分。
10. MemoryContract 记忆契约。
11. CognitiveEvaluation 认知效果评估。
12. AntiOverfittingPolicy 防过拟合机制。
13. MemorySandbox 记忆沙盒。
14. CognitivePermission 认知权限。

### 2.4 C+++：Self-Governing Cognitive Twin

C+++ 层解决长期可信、自治理和可审计问题：

1. MetaCognitionModel 元认知模型。
2. CognitiveBudget 认知预算。
3. MemoryEconomy 记忆经济系统。
4. CognitiveBoundary 认知边界。
5. MemoryProvenance 记忆血统。
6. TrustRepairProtocol 信任修复协议。
7. CognitiveRegressionTest 认知回归测试。
8. MultiAgentContinuity 多 Agent 接续能力。
9. OverrideHierarchy 覆盖优先级。
10. CognitiveDiff 认知差异视图。
11. CognitiveTimeMachine 认知时间机。
12. MemoryConstitution 记忆宪章。
13. CognitiveThreatModel 认知安全威胁模型。
14. LocalFirstCloudOptional 本地优先云可选策略。
15. MemoryProductMetrics 产品指标体系。

---

## 三、总体架构

```text
MemoryBody Self-Governing Cognitive Twin
├─ Cognitive Core 认知核心层
│  ├─ MemoryBody Core
│  ├─ CognitiveProfile
│  ├─ DecisionModel
│  ├─ TasteModel
│  ├─ TrustModel
│  ├─ GoalModel
│  ├─ EmotionModel
│  ├─ RelationshipModel
│  ├─ TemporalUserModel
│  └─ RequirementGravity
├─ Governance & Safety 治理与安全层
│  ├─ MemoryConstitution
│  ├─ CognitivePolicy
│  ├─ CognitivePermission
│  ├─ AntiOverfittingPolicy
│  ├─ CognitiveBoundary
│  ├─ CognitiveThreatModel
│  ├─ TrustRepairProtocol
│  ├─ MemoryEconomy
│  └─ CognitiveBudget
├─ Experience & Explainability 体验与可解释层
│  ├─ MemoryCenter
│  ├─ MemoryReviewQueue
│  ├─ ExplainabilityEngine
│  ├─ ReflectionEngine
│  ├─ CognitiveDiff
│  ├─ CognitiveTimeMachine
│  ├─ MemoryStarMap
│  ├─ MemoryAuditLog
│  ├─ MetricsDashboard
│  └─ SyncMigrationVersioning
└─ Integration 适配层
   ├─ AgentChatMemoryAdapter
   ├─ PromptContextComposer
   ├─ KnowledgeGraphAdapter
   ├─ BrowserMemoryBodyStore
   ├─ CloudSyncAdapter
   └─ LegacyMemoryMigrationAdapter
```

### 3.1 MemoryBody Core

MemoryBody Core 保存原子记忆和图结构，是系统的事实底座。

已有基础类型包括：

1. MemoryAtom。
2. MemoryEntity。
3. MemoryRelation。
4. UserBelief。
5. MemoryEvidence。
6. MemoryBodyMeta。

后续需要扩展：

1. 记忆质量评分。
2. 记忆血统。
3. 认知权限。
4. 审计引用。
5. review 状态。
6. stale 状态。
7. protected 的用户可见流程。

### 3.2 CognitiveProfile

CognitiveProfile 是从原子记忆升维后的综合用户画像，不直接替代 MemoryAtom。

建议结构：

```text
CognitiveProfile
├─ identityModel
├─ preferenceModel
├─ decisionModel
├─ tasteModel
├─ goalModel
├─ trustModel
├─ relationshipModel
├─ emotionModel
├─ temporalUserModel
├─ scenarioModel
├─ safetyBoundary
├─ reflectionSummary
└─ evolutionHistory
```

CognitiveProfile 只保存可解释的综合判断，每个判断必须能回溯到 MemoryAtom、Evidence 或 AuditLog。

### 3.3 PromptContextComposer

PromptContextComposer 负责决定哪些记忆进入当前请求上下文。

输入：

1. 当前用户消息。
2. 当前场景。
3. 可用 token budget。
4. MemoryBody active atoms。
5. CognitiveProfile。
6. CognitivePermission。
7. forbidden / private / sensitive 策略。
8. 最近纠错和冲突。

输出：

1. 必须注入的安全边界。
2. 当前任务相关目标。
3. 当前用户偏好。
4. 当前情绪或关系提示。
5. 禁止使用的记忆摘要。
6. 可解释的使用理由。

PromptContextComposer 不允许简单把所有记忆拼进 prompt。

---

## 四、核心模型设计

### 4.1 DecisionModel

DecisionModel 描述用户如何做决策。

```text
DecisionModel
├─ qualityBar
├─ tradeoffPreference
├─ riskTolerance
├─ confirmationStyle
├─ implementationBias
├─ rejectionPatterns
└─ decisionEvidenceAtomIds
```

示例：

```text
用户偏好完整方案优先，允许分阶段实现，但不接受方案本身缩水。
```

该模型用于产品设计、架构建议、实现路线、询问策略和自动推进策略。

### 4.2 TasteModel

TasteModel 描述用户审美、交互和架构品味。

```text
TasteModel
├─ visualTaste
├─ interactionTaste
├─ productTaste
├─ writingTaste
├─ architectureTaste
└─ unacceptablePatterns
```

该模型用于 UI 设计、文档风格、方案深度和交互节奏。

### 4.3 TrustModel

TrustModel 描述用户对 AI 的信任状态。

```text
TrustModel
├─ trustLevel
├─ trustBreakEvents
├─ trustRepairActions
├─ sensitiveFailureModes
├─ userPatienceSignals
└─ requiredProofStyle
```

如果用户指出 AI 遗忘、误解、简化或没有真正修改，系统必须进入 TrustRepairProtocol。

### 4.4 MisunderstandingMemory

MisunderstandingMemory 保存 AI 曾经如何误解用户，以及如何避免重复错误。

```text
MisunderstandingMemory
├─ userSaid
├─ assistantInterpreted
├─ userCorrection
├─ lesson
├─ futureGuard
├─ createdAt
└─ relatedTaskIds
```

示例：

```text
用户纠正“不是最完整阶段，而是最完整方案”。后续遇到“完全体”“完整方案”时，优先理解为终局方案完整性，而不是单阶段范围。
```

### 4.5 RequirementGravity

RequirementGravity 用于区分普通偏好和高权重原则。

```text
RequirementGravity
├─ casualPreference
├─ repeatedPreference
├─ hardBoundary
├─ productPrinciple
├─ engineeringPrinciple
├─ correctionSignal
└─ trustCriticalSignal
```

高重力需求需要更高 retention、review 和 protected 倾向。

### 4.6 TemporalUserModel

TemporalUserModel 记录用户理解随时间变化。

```text
TemporalUserModel
├─ stableTraits
├─ recentChanges
├─ oldPreferences
├─ emergingPatterns
├─ decayedPatterns
└─ changeEvents
```

系统必须避免把短期状态永久化，也必须能识别用户偏好变化。

### 4.7 MetaCognitionModel

MetaCognitionModel 记录系统对自己认知状态的判断。

```text
MetaCognitionModel
├─ knownFacts
├─ uncertainAssumptions
├─ confidenceCalibration
├─ missingContext
├─ ambiguitySignals
├─ shouldAskUser
└─ shouldActDirectly
```

该模型用于决定是继续执行、询问用户、降低置信还是进入信任修复。

---

## 五、记忆生命周期

### 5.1 基础生命周期

当前系统已有生命周期：

1. draft。
2. active。
3. confirmed。
4. stable。
5. weakening。
6. archived。
7. contradicted。
8. protected。
9. forbidden。

### 5.2 建议扩展生命周期

新增：

1. needs_review：需要用户确认。
2. stale：可能过期。
3. sandboxed：候选记忆，暂不影响 prompt。
4. rollbackable：可恢复的历史状态。
5. policy_blocked：被认知策略阻断。

### 5.3 状态流转原则

```text
chat/workspace input
  ↓
privacy guard
  ↓
sandboxed / draft
  ↓
review / reinforcement / contradiction check
  ↓
active / confirmed / stable / forbidden
  ↓
decay / correction / archive / rollback
```

关键规则：

1. 敏感内容不进入 draft，直接 forbidden 或 policy_blocked。
2. 单次低置信偏好先 sandboxed，不直接 active。
3. 用户确认后可进入 confirmed。
4. 多次稳定证据后可进入 stable。
5. 用户明确要求长期保留后可进入 protected。
6. 用户纠正后旧记忆进入 archived 或 contradicted，新记忆保留 contradictionOf。
7. 用户忘记后进入 forbidden，不进入 prompt。

---

## 六、治理与安全

### 6.1 MemoryConstitution

MemoryConstitution 是系统记忆宪章。

```text
MemoryConstitution
├─ 用户拥有记忆所有权
├─ 用户可以查看、纠正、删除、导出
├─ 敏感内容默认不记
├─ 高风险推断必须确认
├─ 临时情绪不得永久化
├─ 项目记忆和个人记忆隔离
├─ 记忆使用必须可解释
├─ 用户最新纠正优先
├─ 系统必须避免过度拟合
└─ forbidden 记忆不得进入 prompt
```

### 6.2 CognitivePermission

CognitivePermission 控制记忆在哪些场景可用。

```text
CognitivePermission
├─ usableInChat
├─ usableInPlanning
├─ usableInCoding
├─ usableInRecommendation
├─ usableInEmotionalSupport
├─ excludedScenarios
└─ requiresConfirmation
```

示例：生活偏好可用于聊天推荐，但不得影响支付、安全、权限判断。

### 6.3 CognitiveBoundary

CognitiveBoundary 定义系统不应该推断或跨场景使用的内容。

1. 不把单次情绪推断成长期性格。
2. 不把项目偏好扩展成全局偏好，除非用户确认。
3. 不把授权某次 Git 提交扩展成永久授权。
4. 不把产品完整性偏好误解为所有事情都要复杂化。
5. 不跨用户、跨租户、跨项目泄露记忆。

### 6.4 CognitiveThreatModel

认知安全威胁包括：

1. memoryInjection：恶意文本污染记忆。
2. falseBeliefPersistence：错误信念长期存在。
3. crossContextLeakage：跨场景泄露记忆。
4. sensitiveInference：敏感推断。
5. staleMemoryHijack：过期记忆影响新任务。
6. overPersonalization：过度个性化。
7. unauthorizedMemoryUse：未授权使用记忆。
8. promptLeakage：prompt 泄露敏感记忆。

### 6.5 AntiOverfittingPolicy

防过拟合策略：

1. 低证据记忆不能直接 stable。
2. 单次偏好默认有场景边界。
3. 临时情绪默认短期有效。
4. 冲突出现时降低相关记忆置信度。
5. 用户确认优先于模型强化。
6. 用户纠正必须触发旧记忆隔离。

### 6.6 Local-first Cloud-optional

长期同步策略：

1. 默认本地优先。
2. 云同步必须用户显式开启。
3. private / sensitive 默认不同步或加密同步。
4. forbidden 不进入 prompt，也不应作为可恢复明文跨设备传播。
5. 多设备冲突必须可解释。
6. 用户可导出、删除和迁移认知数据。

---

## 七、反馈闭环

### 7.1 反馈类型

基础反馈：

1. confirm：确认记忆。
2. correct：纠正记忆。
3. forget：忘记记忆。
4. protect：长期保护。
5. restore：恢复归档记忆。
6. reject：拒绝候选记忆。

### 7.2 反馈入口

1. 聊天自然语言命令。
2. Memory Center 操作。
3. Review Queue 确认卡片。
4. 记忆详情页纠错。
5. Trust Repair 流程。
6. Cognitive Diff 页面。

### 7.3 MemoryNegotiation

记忆协商流程：

```text
AI 发现候选长期记忆
  ↓
进入 MemoryReviewQueue
  ↓
用户确认 / 修改 / 拒绝 / 只在当前项目使用
  ↓
写入 AuditLog
  ↓
更新 MemoryBody 与 CognitiveProfile
```

### 7.4 TrustRepairProtocol

当用户指出误解、遗忘或错误个性化时，系统必须执行：

1. acknowledgeError：承认具体误解。
2. identifyWrongMemory：定位错误或缺失记忆。
3. correctMemory：修正或新增记忆。
4. recordLesson：写入 MisunderstandingMemory。
5. reduceConfidence：降低相关推断置信度。
6. showWhatChanged：向用户说明改了什么。
7. preventRepeat：后续同类场景前检查 futureGuard。

---

## 八、可解释体验

### 8.1 Memory Center 五大视图

Memory Center 最终不是单列表，而是五个主视图。

#### 8.1.1 Overview 总览

展示：

1. 记忆成熟度。
2. 记忆总数。
3. 待确认数。
4. 最近纠正数。
5. 近期变化。
6. 风险记忆。
7. AI 当前理解摘要。

#### 8.1.2 Profile 我的画像

展示 AI 当前如何理解用户：

1. 偏好。
2. 决策模型。
3. 品味。
4. 目标。
5. 边界。
6. 关系和信任状态。
7. 可确认、纠正、删除。

#### 8.1.3 Memories 记忆库

展示 MemoryAtom：

1. 搜索。
2. 过滤。
3. 详情。
4. 证据。
5. 生命周期。
6. 敏感级别。
7. 置信度。
8. 强度。
9. 操作按钮。

#### 8.1.4 Evolution 演化

展示：

1. 最近增强的记忆。
2. 正在弱化的记忆。
3. 被纠正的记忆。
4. 冲突。
5. 反思摘要。
6. CognitiveDiff。

#### 8.1.5 StarMap 星图

展示 MemoryBody graph：

1. 用户实体。
2. 目标实体。
3. 偏好实体。
4. 项目实体。
5. 情绪实体。
6. 强弱边。
7. 冲突边。
8. forbidden / protected 特殊状态。

### 8.2 ExplainabilityEngine

每条高价值记忆必须可解释：

1. 它来自哪里。
2. 它被强化了几次。
3. 它是否被用户确认。
4. 它是否影响过回答。
5. 它是否和其他记忆冲突。
6. 它为何进入或未进入 prompt。

### 8.3 CognitiveDiff

每次会话或任务结束后可生成认知差异：

1. 新增理解。
2. 强化理解。
3. 降低置信。
4. 归档理解。
5. 需要确认。
6. 触发信任修复的事件。

### 8.4 CognitiveTimeMachine

长期支持：

1. 查看任意时间点 AI 如何理解用户。
2. 比较两个时间点的认知差异。
3. 回滚错误记忆版本。
4. 追踪某次误解如何发生。

---

## 九、记忆经济与认知预算

### 9.1 MemoryEconomy

每条记忆都有价值、成本和风险。

```text
MemoryEconomy
├─ valueScore
├─ costScore
├─ riskScore
├─ usageFrequency
├─ correctionCost
├─ retentionPolicy
└─ deletionPriority
```

高价值、低风险、稳定证据的记忆可以长期保留；低价值、高风险、低证据的记忆应进入 sandbox、review 或快速衰减。

### 9.2 CognitiveBudget

认知预算控制系统不要过度记忆、过度确认或过度注入。

```text
CognitiveBudget
├─ memoryStorageBudget
├─ promptTokenBudget
├─ attentionBudget
├─ reviewBudget
├─ syncBudget
└─ privacyBudget
```

默认策略：

1. 每次 prompt 只注入当前任务最相关的高价值记忆。
2. 每次 review 最多展示少量高重力候选记忆。
3. 安全边界优先级高于偏好记忆。
4. 工程规则类长期偏好优先于普通生活偏好。
5. forbidden 记忆不参与预算竞争，直接排除。

---

## 十、审计、版本与迁移

### 10.1 MemoryAuditLog

所有核心记忆变更都应写入审计账本。

审计事件包括：

1. memory_created。
2. memory_confirmed。
3. memory_corrected。
4. memory_forgotten。
5. memory_protected。
6. memory_restored。
7. memory_archived。
8. memory_used_in_prompt。
9. cognitive_profile_updated。
10. trust_repair_triggered。
11. policy_blocked_memory。
12. migration_completed。

审计事件不得保存密钥、Token、密码、私有证书、数据库连接串或生产敏感配置。

### 10.2 MemoryProvenance

MemoryProvenance 描述一条记忆的完整血统。

```text
MemoryProvenance
├─ originEvent
├─ evidenceChain
├─ reinforcementEvents
├─ correctionEvents
├─ usageEvents
├─ migrationEvents
├─ rollbackEvents
└─ trustImpactEvents
```

高价值记忆必须能追溯来源、强化、纠错、使用和迁移历史。

### 10.3 SyncMigrationVersioning

长期演进层需要支持：

1. legacy memory migration。
2. MemoryBody schema version。
3. CognitiveProfile schema version。
4. 本地备份。
5. 用户导出。
6. 用户清空。
7. 云同步适配。
8. 多设备冲突解释。
9. 错误迁移回滚。

### 10.4 OverrideHierarchy

覆盖优先级固定为：

```text
1. 用户最新明确指令
2. 用户明确纠正
3. 用户确认记忆
4. 项目规则
5. 全局规则
6. 历史记忆
7. 模型推断
```

任何模块不得用历史记忆覆盖用户最新明确纠正。

---

## 十一、KnowledgeGraph 与 MemoryStarMap

### 11.1 关系原则

MemoryBody 是认知核心，KnowledgeGraph / MemoryStarMap 是展示和探索适配层。

禁止：

1. 让 KnowledgeGraph 成为记忆事实源。
2. 让可视化层直接修改 MemoryBody 内部结构。
3. 用图展示需求反向决定核心数据结构。

允许：

1. MemoryAtom 映射为记忆节点。
2. MemoryEntity 映射为实体节点。
3. MemoryRelation 映射为关系边。
4. lifecycle、strength、confidence 影响视觉样式。
5. contradiction、forbidden、protected 显示特殊状态。

### 11.2 MemoryStarMap 视图

MemoryStarMap 展示：

1. 用户节点。
2. 目标节点。
3. 偏好节点。
4. 项目节点。
5. 情绪节点。
6. 边界节点。
7. 证据节点。
8. 冲突边。
9. 强化边。
10. 衰减边。

### 11.3 图谱交互

用户可以：

1. 点击节点查看记忆详情。
2. 查看证据链。
3. 对节点执行确认、纠正、忘记。
4. 查看冲突解释。
5. 过滤敏感、归档、禁止记忆。

---

## 十二、实施路线

### 12.1 第一阶段：Cognitive Core Foundation

目标：补齐认知核心基础，不做表面 UI 堆叠。

交付：

1. CognitiveProfile 类型与构建器。
2. DecisionModel / TasteModel / TrustModel 基础模型。
3. RequirementGravity 评分。
4. MemoryQuality 评分。
5. MemoryAuditLog 基础事件。
6. PromptContextComposer 替代简单 prompt 拼接。
7. 对应单元测试。

验收：

1. 用户纠正能更新 MisunderstandingMemory。
2. 高重力需求能被识别。
3. forbidden 记忆不进入 prompt。
4. prompt context 能说明使用了哪些记忆。
5. 核心模型可通过测试独立验证。

### 12.2 第二阶段：Memory Center 完整控制台

目标：提供用户可见的认知控制台。

交付：

1. 侧边栏入口。
2. MemoryCenter modal。
3. Overview。
4. Profile。
5. Memories。
6. Evolution。
7. Safety。
8. confirm / correct / forget / protect / reject。
9. Review Queue。
10. 组件测试与浏览器验证。

验收：

1. 用户能看到 AI 当前如何理解自己。
2. 用户能修改关键理解。
3. 操作会写入审计事件。
4. 操作后 prompt context 立即变化。
5. 敏感和 forbidden 记忆展示受控。

### 12.3 第三阶段：Reflection & Explainability

目标：让系统能解释和反思。

交付：

1. ReflectionEngine。
2. ExplainabilityEngine。
3. CognitiveDiff。
4. TrustRepairProtocol。
5. MisunderstandingMemory UI。
6. 会话结束认知变化摘要。

验收：

1. 用户能看到本次对话改变了哪些理解。
2. 用户指出误解后系统能定位、修正、记录教训。
3. 高价值记忆能显示证据链。

### 12.4 第四阶段：MemoryStarMap

目标：把认知结构变成可探索图谱。

交付：

1. MemoryBodyGraphAdapter。
2. MemoryStarMap 视图。
3. 节点详情。
4. 冲突边。
5. 强弱状态视觉映射。
6. 与现有 KnowledgeGraph 解耦集成。

验收：

1. 图谱从 MemoryBody 派生。
2. 图谱操作回到 adapter，不直接改核心状态。
3. forbidden / sensitive 状态不被误展示。

### 12.5 第五阶段：Semantic Retrieval & Cognitive Budget

目标：提升记忆使用质量。

交付：

1. 场景感知检索。
2. prompt token budget。
3. review budget。
4. memory economy。
5. semantic retrieval adapter。
6. 认知回归测试。

验收：

1. 同一记忆在不同场景权重不同。
2. prompt 不因记忆增多而污染。
3. 错误旧记忆不会压制用户最新纠正。

### 12.6 第六阶段：Sync / Version / Time Machine

目标：让记忆成为长期可迁移资产。

交付：

1. schema versioning。
2. migration adapter。
3. export / import。
4. local backup。
5. CognitiveTimeMachine。
6. cloud sync adapter 预留。

验收：

1. 用户能导出认知数据。
2. 迁移可回滚。
3. 用户能查看历史理解变化。

---

## 十三、测试策略

### 13.1 单元测试

覆盖：

1. MemoryQuality scoring。
2. RequirementGravity scoring。
3. CognitiveProfile builder。
4. PromptContextComposer。
5. CognitivePermission。
6. AntiOverfittingPolicy。
7. TrustRepairProtocol。
8. MemoryAuditLog reducer。

### 13.2 组件测试

覆盖：

1. Memory Center 展示空状态。
2. Memory Center 展示 atoms。
3. 确认记忆后 UI 和 store 更新。
4. 忘记记忆后 forbidden 不进 active 过滤。
5. 纠正记忆后旧 atom 归档，新 atom 出现。
6. Review Queue 确认和拒绝。
7. Profile 页面展示 AI 当前理解。

### 13.3 认知回归测试

覆盖：

1. 用户纠正喜欢芒果后，西瓜不再进入 prompt。
2. 用户要求完整方案后，后续方案不得降级成简化 MVP。
3. 用户要求不要记某内容后，该内容不得进入 prompt。
4. 项目工程规则类记忆在开发任务中优先级高于普通偏好。
5. 临时情绪不会升级成长期性格。

### 13.4 浏览器验证

Web UI 阶段必须验证：

1. 页面不白屏。
2. Console 无错误。
3. Network 无关键失败请求。
4. Memory Center 能打开。
5. 关键操作可用。
6. 刷新后记忆持久化。

---

## 十四、风险与回滚

### 14.1 主要风险

1. 范围过大导致一次性实现失控。
2. UI 先行导致核心模型不稳。
3. 记忆过多污染 prompt。
4. 旧记忆覆盖用户最新纠正。
5. 敏感信息进入记忆或审计。
6. KnowledgeGraph 与 MemoryBody 职责混淆。
7. 认知模型过度推断用户。
8. 多设备同步产生冲突。

### 14.2 风险控制

1. 终局方案完整，执行按纵向切片。
2. 核心模型优先于复杂 UI。
3. 所有 prompt 注入经过 PromptContextComposer。
4. OverrideHierarchy 固化为测试。
5. PrivacyGuard 和 ForbiddenFilter 作为硬门禁。
6. Graph 只做派生视图。
7. 低证据记忆进入 sandbox 或 review。
8. 同步功能最后实现，默认本地优先。

### 14.3 回滚策略

1. 每个阶段独立提交。
2. schema 变更必须带 migration 和 rollback。
3. UI 新入口可通过 feature flag 隐藏。
4. prompt composer 可回退到旧 context builder。
5. MemoryAuditLog 只追加，不破坏现有 MemoryBodyState。
6. CloudSyncAdapter 上线前不得影响本地优先行为。

---

## 十五、禁止退化约束

后续实现不得退化为以下形态：

1. 只做 atoms 列表，不做认知模型。
2. 只做 UI，不做审计和反馈闭环。
3. 只保存偏好，不处理纠正、误解和信任修复。
4. 直接把所有记忆塞进 prompt。
5. 用 KnowledgeGraph 替代 MemoryBody 核心。
6. 把临时情绪永久化。
7. 把项目偏好无确认扩展成全局偏好。
8. 忽略用户最新纠正。
9. 在记忆、日志、审计中保存密钥、Token、密码或生产敏感配置。

---

## 十六、当前项目对齐

### 16.1 已有基础

当前项目已有：

1. MemoryBody 类型基础。
2. BrowserMemoryBodyStore。
3. InMemoryMemoryBodyStore。
4. MemoryBody ingestion。
5. retrieval。
6. decay。
7. reinforcement。
8. forbidden filter。
9. explicit feedback。
10. natural language feedback parser。
11. AgentChatMemoryAdapter。
12. AgentChatUI feedback command integration。
13. confirm / correct / forget 组件测试覆盖。

### 16.2 需要补齐

后续重点补齐：

1. CognitiveProfile。
2. DecisionModel。
3. TrustModel。
4. MisunderstandingMemory。
5. RequirementGravity。
6. MemoryQuality。
7. MemoryAuditLog。
8. PromptContextComposer。
9. MemoryCenter。
10. ReviewQueue。
11. ExplainabilityEngine。
12. ReflectionEngine。
13. MemoryStarMap adapter。
14. SemanticRetrieval。
15. Migration / Sync / Versioning。

### 16.3 第一实施计划建议

第一份实施计划应覆盖 Cognitive Core Foundation，不应直接从复杂星图开始。

推荐第一个纵向切片：

1. 新增 MemoryAuditLog 基础类型与 reducer。
2. 新增 RequirementGravity 评分。
3. 新增 MemoryQuality 评分。
4. 新增 PromptContextComposer 最小替代层。
5. 将现有 AgentChatMemoryAdapter 的 buildPromptContext 逐步迁移到 composer。
6. 增加认知回归测试，确保完整方案偏好不会被降级为 MVP。

---

## 十七、交付判定

该完整方案被视为后续 MemoryBody 建设的上位设计。任何实现任务都需要回答：

1. 是否符合 C+++ 终局蓝图。
2. 是否保持 MemoryBody 核心与 UI 解耦。
3. 是否保护用户最新纠正。
4. 是否避免敏感信息入记忆。
5. 是否有测试验证。
6. 是否可回滚。
7. 是否能被后续 Agent 接手。

只有满足以上条件，才算没有偏离“最完整方案”。
