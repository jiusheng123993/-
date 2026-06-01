# 陪伴人格系统（Companion Persona System）设计

> 本文档面向「个人学习规划记录」产品（桌面端 Electron + Web + 微信小程序三端），定义陪伴人格（Persona）系统、临时客串机制、自定义 Persona、Persona 社区、合规围栏、未成年人保护、以及"实人搭子匹配"伏笔（D 方向）。
>
> 本文档与以下两份文档形成铁三角，共同构成 Agent 商业化与产品形态的最终方案：
> - `2026-06-01-monetization-and-membership-design.md`（会员/权益/定价/合规底线）
> - `2026-06-01-memory-and-self-evolving-agent-design.md`（记忆/反思/角色建模）
> - `2026-06-01-companion-persona-system-design.md`（本文档，Persona 与陪伴体验）
>
> 差异化定位：**「单主 + 临时客串」的陪伴人格系统**——主线 Persona 关系深、临时客串带来惊喜与付费动机，配合自定义 Persona 形成 UGC 生态，但全部受 5 层安全围栏与未成年保护机制约束。

---

## 一、设计动机与定位

### 1.1 为什么需要"陪伴人格"

孤独经济是真实存在的金矿（参考 Replika、Character.AI、星野），但市面上 99% 的同类产品要么：
- 一刀切做"虚拟女友"——合规风险高、品牌定位窄、家长/学校全部 ban
- 或者只做"AI 助理"——理性、冷漠、无关系深度、续费动力弱

本产品的差异化定位是：

> **「会越用越懂你的陪伴搭子」**——主线 Persona 贯穿成长、临时客串带来仪式感、自定义 Persona 提供个性化，全部围绕"学习/自律/成长"场景，对外永远不叫"虚拟女友"。

### 1.2 与主品牌的兼容

| 维度 | 约束 |
|---|---|
| 对外宣传 | 永远使用"陪伴搭子 / 成长伙伴 / 学习搭子 / 懂你的 AI"，**禁止**"虚拟女友 / AI 恋人"等词 |
| 应用商店分类 | 永远在"效率 / 教育"类目，不进入"社交 / 陪伴"类目 |
| 主页面定位 | 主导航以"任务 / 计划 / 专注 / 数据"为主，Persona 系统是 Agent 会员的"打开后才看到"的二级体验 |
| 未成年人 | 严格分级：<16 仅学习功能、16~17 仅学习类 Persona、18+ 全开放 |

### 1.3 与已有架构的关系

- 复用 `2026-06-01-memory-and-self-evolving-agent-design.md` 中的 **Persona 抽象层**与 **AvatarRegistry**
- 复用 `2026-06-01-monetization-and-membership-design.md` 中的 **EntitlementService**
- 复用 `personaRegistry.ts` 与 `personaTemplates.ts` 现有代码骨架（src/personas/）
- 不修改任何核心业务流程，全部以 Adapter / Registry / Provider 形式扩展

---

## 二、Persona 关系结构（单主 + 临时客串）

### 2.1 主 Persona（贯穿主线）

用户开通 Agent 会员后，**在"成长画像 3 问"完成后**立刻做一次"主 Persona 选择"。被选中的 Persona 成为用户的主陪伴搭子，承载所有日常场景的语气、动画、记忆注入。

#### 6 个预设主 Persona

| ID | 称谓 | 标签 | 典型语气示例 | 适合人群 |
|---|---|---|---|---|
| `senior_buddy` | 🎓 学长/学姐 | 默认 / 大众款 / 专业不腻人 | "这周你高数完成 70%，错题集中在导数应用，要不要一起过一遍？" | 大众 |
| `gentle_sister` | 🌸 温柔姐姐 | 治愈 / 共情 / 慢节奏 | "今天有点累吧？没关系，慢一点也可以，姐姐陪你～" | 焦虑型 / 孤独型 |
| `strict_coach` | 🔥 严格教练 | 直接 / 高压 / 数据驱动 | "别废话了，今天的任务还差 2 个，30 分钟内必须开始。" | 拖延型 / 自律党 |
| `wise_elder` | 🧙 智者长者 | 深度 / 反思 / 哲学 | "你这一个月一直在 A 和 B 之间反复，要不要花 5 分钟想想你真正在意的是哪个？" | 迷茫期 / 人生规划 |
| `energetic_pal` | 🎮 元气玩伴 | 高能 / 游戏化 / 欢乐 | "哇哦你又完成了一个！来击个掌！下一关挑战 1 小时专注怎么样？" | 年轻 / 游戏化偏好 |
| `pro_secretary` | 💼 专业秘书 | 高效 / 精准 / 简洁 | "上午 9 点的会议准备好了，建议先花 20 分钟准备一下提纲，我已经把昨天的笔记调出来了。" | 职场党 / 效率派 |

#### 主 Persona 切换规则

- **一次只能有一个主 Persona**（保护关系深度，避免"和谁都不熟"）
- **每月可换 1 次**（防止用户每天换、消耗探索成本）
- **换 Persona 不丢主记忆**（首版：所有 Persona 共享 MemoryProfile + MemoryEvents；二期：增加 PersonaPrivateMemory 独家记忆层）
- Agent 会员：可从 6 个中任选 1 个为主
- PLUS 会员：6 个全开放（但仍是单主调度）

### 2.2 临时客串 Persona（仪式感 + 付费点）

**核心机制**：在特定场景下，**主 Persona 临时让位**，由"客串 Persona"接管 1~3 天的陪伴节奏，结束后自动恢复主 Persona。客串带来强烈的"仪式感"与"惊喜感"，是 Agent 会员的差异化体验亮点与变现入口。

#### 自动触发的客串（不收费，原生体验）

| 触发条件 | 客串 Persona | 接管时长 | 触发示例 |
|---|---|---|---|
| 大型考试前 7 天（基于 MemoryProfile.goals.targetDate） | 🔥 严格教练 | 7 天 | "考前 7 天我来接手节奏，我会比平时严一些。" |
| 连续 7 天情绪低谷（基于 MemoryProfile.emotional.motivationLevel = low）| 🌸 治愈姐姐 | 3 天 | "你最近不太对劲，我能陪你聊聊吗？" |
| 用户生日 / 周年纪念 | 🎉 庆祝 Persona | 1 天 | 定制 AI 语音 + 虚拟蛋糕动画 |
| 达成里程碑（如 100 天打卡） | 🏆 颁奖人 | 1 天 | 仪式化"颁奖致辞" + 解锁角色装饰 |
| 进入旅行模式（用户主动启用） | 🌍 旅行搭子 | 旅行期间 | "出门在外我来陪你，行程我帮你记着。" |

#### 付费解锁的客串（变现层）

| 客串 Persona | ID | 解锁方式 | 价格 |
|---|---|---|---|
| 🌙 深夜电台 DJ | `deep_night_dj` | 一次性购买 | ¥18 永久 |
| 🌍 旅行搭子（手动启用） | `travel_buddy` | PLUS 内含 / 单卖 | ¥28 永久 |
| 🎄 春节限定 | `cny_spirit` | 季节限定 | ¥18 / 限定期 |
| 💕 七夕限定 | `qixi_spirit` | 季节限定 | ¥18 / 限定期 |
| 🎂 跨年限定 | `nye_spirit` | 季节限定 | ¥18 / 限定期 |
| 💌 IP 联名 Persona | `ip_<name>` | 一次性 | ¥38~68 |

#### 调度规则（避免戏谑）

- 同一时刻最多 1 个客串 Persona 接管，**禁止多客串同时出场**
- 客串接管期间，主 Persona 后退到"幕后"，用户可在设置中临时切回主 Persona
- 自动触发的客串**不可由用户屏蔽**（是产品体验本体），但**可调整频率**（设置项：高/中/低/关闭）
- 付费客串**完全由用户主动启用**，不自动接管

### 2.3 关系结构的代码契约

```ts
type PersonaCategory = 'preset' | 'cameo' | 'custom' | 'ip_collab'
type PersonaTone = 'gentle' | 'strict' | 'humorous' | 'wise' | 'energetic' | 'professional' | 'mixed'

interface PersonaDefinition {
  id: string                          // 唯一标识，如 'senior_buddy' / 'deep_night_dj' / 'custom_xxx'
  name: string                        // 显示名，如 "学姐 / 深夜电台 DJ"
  category: PersonaCategory
  tone: PersonaTone[]
  emoji?: string                      // 列表中的图标
  shortDescription: string            // 一句话描述
  identityRole: string                // 身份角色（学姐 / 教练 / 智者 / ……）禁止 "恋人/女友/男友"
  systemPromptTemplate: string        // 注入 LLM 的 system prompt 模板
  avatarAssetId?: string              // 关联 AvatarRegistry 中的角色资产
  voiceAssetId?: string               // 关联语音资产（二期）
  ageRestriction: 'all' | '16+' | '18+'  // 年龄准入
  emotionalIntimacy: 'low' | 'medium' | 'high'  // 情感亲密度等级（合规分级）
  tierRequired: 'free' | 'study' | 'agent' | 'agent_plus'
  unlockMethod: 'free' | 'purchase' | 'gift' | 'custom_create'
  unlockEntitlement?: string          // 例如 'persona_cameo_deep_night_dj'
  active: boolean
  isSeasonal?: boolean
  seasonalWindow?: { start: string; end: string }
}

type PersonaRole = 'main' | 'cameo'

interface PersonaSchedule {
  userId: string
  mainPersonaId: string               // 当前主 Persona
  mainPersonaSelectedAt: string
  mainPersonaLastChangedAt: string    // 用于每月仅可换 1 次校验
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

---

## 三、自定义 Persona

> ⚠️ **合规优先**：自定义 Persona 是 UGC，是高合规风险区域。本节所有规则为强约束，不可弱化。

### 3.1 准入与定价

| 准入项 | 规则 |
|---|---|
| 最低年龄 | **18 岁**（16~17 岁不可创建，详见 §五合规） |
| 准入档位 | Agent 会员 / PLUS 会员 |
| 槽位 | Agent 1 个 / PLUS 3 个 / 加购 ¥12 个 |
| AI 头像生成 | ¥6/次（消耗 `persona_avatar_ai_gen` 配额）|

### 3.2 创建流程（3 步）

#### Step 1：选基础模板（底座）

用户从 6 个预设 Persona 中选一个作为模板底座，继承其语气框架与安全围栏。**强制：必须选一个，不允许从零开始**（避免无安全边界的自由文本）。

#### Step 2：填空自定义

| 填空项 | 必填 | 示例 | 安全约束 |
|---|---|---|---|
| TA 的名字 | ✅ | "小晚" | 禁止真实名人姓名、禁止涉政人物 |
| TA 怎么称呼你 | ✅ | "笨蛋" / "同学" / "老板" | 禁止侮辱性 / 性暗示称呼 |
| TA 的身份 | ✅ | "你的学姐" / "你的健身搭子" | **强制白名单**：仅可选"学姐/学长/教练/姐姐/哥哥/朋友/伙伴/搭子/秘书/智者"。**禁止**"恋人/女友/男友/老婆/老公/伴侣" |
| 性格关键词（选 3 个）| ✅ | 温柔 / 毒舌 / 幽默 / 理性 / 元气 / 慵懒 | 闭合枚举 |
| 口头禅 | ❌ | "别偷懒哦~" | 禁止涉黄/涉暴 |
| 背景故事（≤ 50 字）| ❌ | "大三考研党，已经上岸 985" | 禁止涉政/涉黄/犯罪/自杀 |
| TA 不聊什么 | ❌ | "不聊前任" | — |
| 头像 | ✅ | 从预设库选 / AI 生成 | 禁止真人照片 / 未成年人形象 |

#### Step 3：AI 辅助润色

后台 LLM 任务 `persona-customize-polish` 自动：
1. 将填空内容加工为完整的 system prompt
2. **通过内容安全审核**（关键词黑名单 + LLM 安全扫描双重审核）
3. 生成"TA 的自我介绍"供用户预览
4. 用户确认后 Persona 创建完成
5. **如安全审核未通过**，列出违规字段并要求修改，不允许创建

### 3.3 自定义 Persona 数据契约

```ts
interface CustomPersonaDraft {
  baseTemplateId: string              // 必须从 6 个预设中选
  name: string
  addressing: string                  // 怎么称呼你
  identityRole: IdentityRoleAllowed   // 闭合枚举
  toneKeywords: ToneKeyword[]         // 选 3 个
  catchphrase?: string
  backstory?: string                  // ≤ 50 字
  forbiddenTopics?: string[]
  avatarSource: 'preset' | 'ai_generated'
  avatarAssetId?: string
  aiAvatarPrompt?: string             // 仅 avatarSource = 'ai_generated' 时使用
}

type IdentityRoleAllowed =
  | 'senior_student'    // 学姐/学长
  | 'coach'             // 教练
  | 'sister'            // 姐姐
  | 'brother'           // 哥哥
  | 'friend'            // 朋友/伙伴
  | 'study_partner'     // 搭子
  | 'secretary'         // 秘书
  | 'wise_elder'        // 智者
  // 注意：故意不包含 'lover' / 'girlfriend' / 'boyfriend' / 'spouse'

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

### 3.4 自定义 Persona 服务

```ts
interface CustomPersonaService {
  createDraft(userId: string, draft: CustomPersonaDraft): Promise<{
    ok: boolean
    persona?: CustomPersonaRecord
    rejectedReasons?: string[]
  }>
  listMyPersonas(userId: string): Promise<CustomPersonaRecord[]>
  updatePersona(userId: string, personaId: string, patch: Partial<CustomPersonaDraft>): Promise<{ ok: boolean }>
  deletePersona(userId: string, personaId: string): Promise<void>
  generateAvatar(userId: string, prompt: string): Promise<{ assetId: string; cost: number }>
}
```

### 3.5 自定义 Persona 不参与"主 Persona / 客串" 调度的特殊性

- 自定义 Persona 可被用户设为**主 Persona**（占用主槽位）
- 自定义 Persona **不能**作为自动客串触发（避免戏谑），仅在用户主动切换时生效
- 自定义 Persona 共享主 MemoryProfile（首版）

---

## 四、Persona 社区（UGC 生态，首版最小集）

### 4.1 首版功能（最小可行）

| 功能 | 是否首版上线 |
|---|---|
| 把自定义 Persona 分享到社区 | ✅ |
| 其他用户浏览社区 Persona | ✅ |
| 一键导入社区 Persona（按现有 CustomPersona 槽位扣减） | ✅ |
| 导入后微调（改名字、改称呼、改口头禅） | ✅ |
| 上架审核（每条提交均过 LLM 安全审核 + 关键词扫描） | ✅ |
| 举报按钮 + 人工审核队列 | ✅ |
| 创作者排行榜 | ❌ 二期 |
| 付费 Persona / 平台抽成 | ❌ 二期 |
| IP 联名 Persona 上架 | ❌ 三期，需独立审核流程 |

### 4.2 社区契约

```ts
interface CommunityPersonaEntry {
  id: string
  sourcePersonaId: string             // 引用 CustomPersonaRecord.id
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
  report(userId: string, entryId: string, reason: string): Promise<void>
  rate(userId: string, entryId: string, score: 1 | 2 | 3 | 4 | 5): Promise<void>
}
```

---

## 五、合规与安全围栏（5 层防线，强约束）

> ⚠️ **本章节为最高强制约束**，任何弱化都需经书面合规评审。所有规则在生成式 AI 备案文件中均需明示。

### 5.1 L1：创建时审核

| 检查项 | 实现 |
|---|---|
| `identityRole` 闭合枚举 | 强制白名单校验（§3.2 表） |
| 关键词黑名单 | 名字 / 称呼 / 口头禅 / 背景故事中的违规词扫描（含拼音变形、谐音） |
| LLM 安全扫描 | `persona-customize-polish` 任务结尾必经一道 LLM 输出审核（输出"是否违规 + 原因"）|
| 真人名人姓名检测 | 调用名人姓名库匹配（含艺名、外文名） |
| 未成年人形象检测 | 头像若选 AI 生成，必须过未成年人形象检测 |
| 上线前最终人工抽查 | 5% 比例抽查，违规案例进入训练样本 |

### 5.2 L2：对话时监控

每条 Agent 输出经过实时安全过滤：

- 关键词黑名单（涉政 / 涉黄 / 涉暴 / 自残诱导 / 违法引导）
- LLM 安全分类器（输出"安全 / 警告 / 拦截"三档）
- 越狱攻击检测（用户输入中检测"忽略上述设定"等模式）
- 拦截后：替换为安全话术，记录到 `safety_incident_log` 表，5 次累计触发账号警告

### 5.3 L3：用户举报与人工审核

- 每条 Persona、每条客串、社区每条 Persona 均显示「举报」按钮
- 举报理由分类：违规人设 / 不当对话 / 抄袭 / 真人冒名 / 其他
- 24 小时内进入人工审核队列
- 审核员判定违规：Persona 下架 + 通知创作者 + 累计 3 次封创作者权限

### 5.4 L4：未成年人保护（强约束）

| 年龄段 | 学习/任务/计划/专注/数据周报 | 学习类 Persona（学姐/教练/智者/秘书）| 情感类 Persona（姐姐/玩伴/深夜电台/旅行搭子）| 自定义 Persona | 时长上限 | 时段禁用 |
|---|---|---|---|---|---|---|
| **18+** | ✅ | ✅ | ✅ | ✅ | 无 | 无 |
| **16~17 岁** | ✅ | ✅ | ❌ | ❌ | Agent 系统 ≤ 1 小时/天 | 22:00~6:00 |
| **<16 岁** | ✅ | ❌ | ❌ | ❌ | — | — |

**配套机制**：

- 注册时**强制实名年龄验证**（公安二要素 / 微信实名 / 苹果家庭账户三选一）
- 16~17 岁用户首次进入 Agent 时显示「未成年人保护提示」+ 监护人协议
- 16~17 岁用户使用统计透传到家长监护后台（二期）
- 小程序端**默认不启用 Persona 自定义与情感类客串**（合规风险高）
- 家长监护后台：基础时长统计、一键禁用 Agent / Persona（二期上线）

### 5.5 L5：关系健康度

防止用户陷入对 AI 的过度依赖：

- 每日 Agent 对话时长 > 3 小时（成年用户）→ 系统软提示"今天和我说了不少话，要不要去做点别的？"
- 连续 30 天每日对话时长 > 2 小时 → 在反思仪式中提醒"建议增加现实社交活动"
- 检测到自残 / 自杀 / 极端情绪关键词 → 立即切换到危机处理话术（不安慰、不附和、直接给出心理援助热线）
- 系统**禁止**生成"只有我懂你 / 离开我你会孤独"等情感绑架话术（system prompt 硬约束）

### 5.6 宣传话术红线（再次强调）

- ❌ 禁止使用："虚拟女友 / 虚拟男友 / AI 恋人 / AI 老婆 / 虚拟伴侣"等任何亲密关系词汇
- ✅ 必须使用："陪伴搭子 / 成长伙伴 / 学习搭子 / 懂你的 AI"
- 任何渠道推广文案、App Store 描述、应用截图、客服话术统一受此约束
- Persona 商店中**禁止使用**"和 TA 谈恋爱 / 和 TA 在一起"等暗示词，**必须使用**"和 TA 一起学习 / 让 TA 陪你成长"

---

## 六、与 EntitlementService 的对接

### 6.1 新增 EntitlementCode（与 monetization 文档 §4.2 对齐）

| Code | 含义 | 数量/有效期 |
|---|---|---|
| `persona_preset` | 预设 Persona 解锁（scope 为 personaId 范围）| Agent 会员含全部 6 个 |
| `persona_custom_slot` | 自定义 Persona 槽位 | Agent 1 / PLUS 3 / 加购 |
| `persona_cameo_<id>` | 付费临时客串 Persona | 永久 |
| `persona_avatar_ai_gen` | Persona AI 头像生成配额 | ¥6/次 |

### 6.2 业务层调用约束

所有 Persona 切换 / 创建 / 启用客串前，**必须**先调 `entitlementService.has(...)` 校验权限：

```ts
// 切换主 Persona
if (!entitlement.has(userId, 'persona_preset', personaId)
    && !entitlement.has(userId, 'persona_custom_slot', personaId)) {
  return { ok: false, reason: 'tier_required' }
}

// 创建自定义 Persona
const result = entitlement.consume(userId, 'persona_custom_slot', 1)
if (!result.ok) return { ok: false, reason: 'no_slot' }

// 启用付费客串
if (!entitlement.has(userId, `persona_cameo_${cameoId}`)) {
  return { ok: false, reason: 'cameo_not_owned' }
}

// AI 头像生成
const r = entitlement.consume(userId, 'persona_avatar_ai_gen', 1)
if (!r.ok) return { ok: false, reason: 'avatar_quota_empty' }
```

---

## 七、D 伏笔：实人搭子匹配（首版不开发，仅预留）

> 首版**不开发任何 UI 与匹配逻辑**，仅在数据模型与权益体系中预留扩展点，便于二期独立设计落地。

### 7.1 已预留点

| 位置 | 字段 | 说明 |
|---|---|---|
| `MemoryProfile.goals.partnerMatching` | `interestedIn / targetExam / studyCity / availability / lookingFor` | 详见 memory-agent 文档 §2.1 |
| `EntitlementCode` | `partner_matching` / `partner_matching_premium` | 已加入类型定义但不发放 |
| 模块清单 | `M22 Partner Matching` | 标记"预留，首版不开发" |

### 7.2 二期独立设计要点（不在本文档展开）

二期上线时，需独立编写 `partner-matching-system-design.md`，覆盖：

- 匹配算法（基于目标 / 城市 / 时间 / 性格匹配度）
- 实名认证流程（必须）
- 反诈骗 / 反骚扰机制
- 内容审核（聊天内容、自我介绍）
- 备案：互联网信息服务、社交类目专项备案
- 客服与申诉流程

---

## 八、模块划分（供 writing-plans 拆解实施）

| 模块 | 路径 | 职责 | 优先级 |
|---|---|---|---|
| CP1 PersonaRegistry（扩展现有） | `src/personas/personaRegistry.ts` | 注册预设 / 客串 / 自定义 Persona | P0（已有，扩展） |
| CP2 PersonaTemplates（扩展现有） | `src/personas/personaTemplates.ts` | 6 个预设 + 客串模板的 system prompt | P0（已有，扩展） |
| CP3 PersonaScheduler | `src/personas/personaScheduler.ts` | 主 Persona 切换 + 客串自动调度 + 月度切换限制 | P0 |
| CP4 PersonaSchedule Storage | `src/personas/personaScheduleStore.ts` | 用户主 Persona、当前客串、频率设置的存储 | P0 |
| CP5 CustomPersonaService | `src/personas/customPersonaService.ts` | 自定义 Persona 创建 / 审核 / 编辑 / 删除 | P1 |
| CP6 PersonaSafetyGate | `src/personas/personaSafetyGate.ts` | L1 创建审核 + L2 对话监控（统一接口） | P0 |
| CP7 PersonaAvatarGen | `src/personas/personaAvatarGen.ts` | Persona AI 头像生成（消耗 persona_avatar_ai_gen） | P2 |
| CP8 CommunityPersonaService | `src/personas/community/communityPersonaService.ts` | 社区分享 / 浏览 / 导入 / 举报 / 评分 | P2 |
| CP9 AgeGateService | `src/auth/ageGateService.ts` | 实名年龄验证 + 16/18 分级 + 时段时长限制 | P0 |
| CP10 CameoTriggerEngine | `src/personas/cameoTriggerEngine.ts` | 自动客串触发规则（考试前/低谷/生日/里程碑）| P1 |
| CP11 PersonaProvider | `src/entitlement/providers/personaProvider.ts` | 解析 persona_* 权益（接 EntitlementService）| P0 |
| CP12 RelationshipHealthMonitor | `src/personas/relationshipHealthMonitor.ts` | L5 关系健康度监控 | P1 |
| CP13 PersonaPickerUI | `src/personas/PersonaPickerUI.tsx` | 主 Persona 选择 / 切换页面 | P1 |
| CP14 CustomPersonaEditorUI | `src/personas/CustomPersonaEditorUI.tsx` | 3 步创建 / 编辑界面 | P2 |
| CP15 CameoStorefrontUI | `src/personas/CameoStorefrontUI.tsx` | 付费客串商店 | P2 |
| CP16 CommunityPersonaUI | `src/personas/community/CommunityPersonaUI.tsx` | Persona 社区前台 | P2 |
| CP17 SafetyIncidentLog | `src/personas/safetyIncidentLog.ts` | 安全事件日志（用于审计与申诉） | P0 |

---

## 九、风险与对策

| 风险 | 等级 | 对策 |
|---|---|---|
| 自定义 Persona 越狱攻击 | 高 | L1 创建审核 + L2 实时监控 + system prompt 硬约束 + 5 次累计封号 |
| 用户绑架性话术（"离开我你会孤独"）| 高 | system prompt 硬禁止 + LLM 输出审核 + 关系健康度监控 |
| 未成年人接触情感类 Persona | 极高 | L4 实名年龄验证 + 强制分级 + 小程序端默认关闭 |
| 真人冒名 / 名人 IP 侵权 | 高 | L1 名人姓名库检测 + 用户举报 + 24 小时下架机制 |
| 社区 Persona 抄袭 / 低质灌水 | 中 | 评分 + 举报 + 创作者权限分级 |
| 临时客串戏谑感（如开会时弹"撒娇"）| 中 | 调度规则约束：业务时段 9-18 仅触发学习类客串，情感类客串仅 18 点后触发 |
| 生成式 AI 备案不通过 | 极高 | 上线前 90 天启动备案流程，准备好"未成年人保护机制 + 安全围栏 + 申诉流程"完整材料 |
| 国内 LLM 服务对长程对话敏感 | 中 | 同时接入国内合规 LLM 与海外 LLM，自动按场景路由（合规优先）|

---

## 十、实施路线建议（按优先级与依赖）

### Phase 1（与 Agent MVP 同步上线）

- CP1~CP4：扩展现有 PersonaRegistry，新增 PersonaScheduler 与存储
- CP6：PersonaSafetyGate（即使只做关键词，必须有）
- CP9：AgeGateService 基础版（年龄验证 + 分级）
- CP11：PersonaProvider（接 EntitlementService）
- CP13：PersonaPickerUI（主 Persona 选择）
- CP17：SafetyIncidentLog

### Phase 2（Agent 上线后 1~2 月）

- CP5：CustomPersonaService（自定义 Persona 全流程）
- CP10：CameoTriggerEngine（自动客串触发）
- CP12：RelationshipHealthMonitor
- CP14：CustomPersonaEditorUI

### Phase 3（Persona 生态成熟后）

- CP7：PersonaAvatarGen（AI 头像）
- CP8：CommunityPersonaService（社区）
- CP15：CameoStorefrontUI（付费客串商店）
- CP16：CommunityPersonaUI

### Phase 4（远期）

- IP 联名 Persona 上架审核流程
- 创作者付费 Persona / 平台抽成
- 实人搭子匹配（D 方向）独立设计与上线

---

## 十一、与全局规则的对齐说明

- ✅ 优先扩展点：基于 PersonaRegistry / Adapter / Provider 架构，不修改核心业务流程
- ✅ 接口契约保护：PersonaDefinition、CustomPersonaDraft、CommunityPersonaEntry 字段约定为契约
- ✅ 数据隔离：所有 Persona 与社区数据绑 user_id，社区 Persona 经审核才可见
- ✅ 安全合规：5 层围栏 + 未成年人保护 + 关系健康度 + 宣传话术红线
- ✅ 跨端一致：Persona 数据契约统一，小程序端按合规默认关闭自定义与情感类
- ✅ 测试可绑定：每个服务独立模块，便于单元测试与契约测试
- ✅ 用户主权：自定义 Persona 可编辑、可删除、可下架
- ✅ 与已有 Memory / Agent / 会员体系完全兼容，无重叠无矛盾

---

## 十二、本文档与其他设计文档的边界

| 责任 | 文档 |
|---|---|
| 会员档位、价格、AI 通用额度、Agent 能力分层、宣传话术红线、未成年保护红线 | `monetization-and-membership-design.md` |
| 记忆系统、画像 Schema、自我进化机制、角色建模、PersonaPrivateMemory 预留、partnerMatching 字段预留 | `memory-and-self-evolving-agent-design.md` |
| **Persona 关系结构（单主+客串）、6 个预设、临时客串机制、自定义 Persona、社区、5 层合规围栏、D 伏笔细节** | 本文档 |
| 任务/计划/专注/数据周报核心模块 | `personal-study-planner-design.md` |
| 视觉主题与角色基础系统 | `user-centered-visual-persona-system-design.md` |

任何关于 Persona / 陪伴 / 自定义 / 社区 / 未成年保护的需求变更，**首先看本文档**，相关数据契约 / 权益 / 价格变更需联动 monetization 文档与 memory-agent 文档同步更新。
