# 阶段3扩展功能设计规格

> 本文档定义星寰海项目「阶段3：扩展功能」的完整产品规格、技术架构、模块边界、数据契约、权益绑定、隐私分级和实施计划，作为后续开发的唯一权威依据。
>
> 包含功能：关系空间（情侣/家庭/学习搭子）、女性周期管理、壁纸上传、3D角色生成。

***

## 一、需求澄清与边界锁定

### 1.1 功能概述

| 功能模块   | 终端类型         | 使用角色              | 核心价值                     |
| ------ | ------------ | ----------------- | ------------------------ |
| 关系空间   | 全端           | 情侣、家庭成员、学习搭子、自律搭子 | 多人协作、互推任务、共享习惯、实时PK、关系成长 |
| 女性周期管理 | 全端           | 女性用户（可开启）         | 周期记录、预测、能量管理、低压力任务建议     |
| 壁纸上传   | 桌面端优先        | 所有用户              | 个性化背景、可读性保护、隐私本地优先       |
| 3D角色生成 | Web/Electron | Agent PLUS会员      | AI生成专属3D角色、角色进化、IP联名     |

### 1.2 需求优先级分级

| 功能     | 优先级 | 交付里程碑 | 依赖模块                                          |
| ------ | --- | ----- | --------------------------------------------- |
| 壁纸上传   | P0  | M1    | ThemeRegistry、本地存储                            |
| 女性周期管理 | P1  | M2    | FeatureModule、PrivacyLevel、本地存储               |
| 关系空间   | P2  | M3    | EntitlementService、SpaceProvider、实时通信         |
| 3D角色生成 | P3  | M4    | AvatarRegistry、AI Provider、EntitlementService |

### 1.3 需求变更审批流程

* 任何功能范围变更需经产品评审

* 技术架构变更需经架构评审

* 权益绑定变更需同步更新 monetization-and-membership-design.md

* 隐私分级变更需同步更新本设计文档

### 1.4 待定疑点

| 疑点                               | 决策状态 | 预计决策时间 |
| -------------------------------- | ---- | ------ |
| 关系空间实时通信方案（WebSocket vs 轮询）      | 待定   | 开发前确认  |
| 3D渲染引擎选型（Three.js vs Babylon.js） | 待定   | 开发前确认  |
| 女性周期AI建议是否消耗通用额度                 | 待定   | 开发前确认  |
| 壁纸云同步策略                          | 待定   | 二期规划   |

***

## 二、技术架构标准化设计

### 2.1 模块分层架构

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

### 2.2 扩展点设计

遵循全局「优先扩展点」原则，各功能通过 Provider/Adapter 模式接入：

| 扩展点                    | 职责               | 实现方式                          |
| ---------------------- | ---------------- | ----------------------------- |
| `RelationshipProvider` | 关系空间创建、成员管理、权限控制 | 实现 `IRelationshipProvider` 接口 |
| `CycleProvider`        | 周期数据存储、预测算法、提醒调度 | 实现 `ICycleProvider` 接口        |
| `WallpaperProvider`    | 壁纸存储、可读性处理、隐私保护  | 实现 `IWallpaperProvider` 接口    |
| `AvatarProvider`       | 3D角色生成、渲染、进化     | 实现 `IAvatarProvider` 接口       |
| `RealtimeAdapter`      | 实时通信抽象层          | 可替换 WebSocket/Polling 实现      |

### 2.3 依赖版本锁定策略

| 依赖          | 当前版本 | 锁定策略      |
| ----------- | ---- | --------- |
| React       | 18.x | 主版本锁定     |
| Three.js    | 待定   | 主版本锁定     |
| localforage | 待引入  | 用于大文件本地存储 |

### 2.4 架构降级兜底方案

| 场景      | 降级方案         |
| ------- | ------------ |
| 3D渲染不可用 | 降级为2D立绘      |
| 实时通信断开  | 降级为轮询 + 离线队列 |
| AI生成失败  | 提供预设角色库      |
| 壁纸过大    | 自动压缩 + 尺寸限制  |

***

## 三、功能模块详细设计

### 3.1 关系空间（Relationship Space）

#### 3.1.1 功能范围

* 创建多人「互联空间」：情侣、家庭、学习搭子、自律搭子

* 空间类型：`couple`（情侣）、`family`（家庭）、`study_buddy`（学习搭子）、`discipline_buddy`（自律搭子）

* 核心能力：

  * 互推任务：向空间成员推送待办任务

  * 共享待办：空间级任务池，成员可领取

  * 共享习惯：共同打卡目标

  * 共享番茄：同步专注时段

  * 实时对战：专注PK、连续打卡PK、周排行

  * 关系成长值：基于互动计算亲密度/默契度

  * 纪念日管理：重要日期提醒

  * 共同目标：设定并追踪共同目标

#### 3.1.2 数据契约

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
    intimacyScore: number      // 亲密度（情侣）
    synergyScore: number       // 默契度（搭子）
    totalSharedTasks: number
    totalSharedFocus: number   // 分钟
    streakDays: number         // 连续互动天数
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

#### 3.1.3 权益绑定

| 权益Code               | 说明      | 来源                |
| -------------------- | ------- | ----------------- |
| `space`              | 可创建关系空间 | 学习会员/Agent会员/PLUS |
| `space_member_limit` | 空间成员上限  | 默认2人，可扩展          |
| `space_ranking`      | 实时排行功能  | 学习会员+             |
| `space_anniversary`  | 纪念日管理   | 学习会员+             |

**计费模式**：创建者承担（A模式）

* 创建空间的人付费，空间下所有成员共享「空间相关」高级功能

* 副席位的「个人类」高级权益仍需自己购买

#### 3.1.4 隐私分级

| 数据      | 隐私级别 | 存储策略   | 同步策略 |
| ------- | ---- | ------ | ---- |
| 空间成员列表  | 私人   | 云端（必须） | 自动同步 |
| 共享任务/习惯 | 私人   | 云端     | 自动同步 |
| 互动记录    | 私人   | 云端     | 自动同步 |
| 亲密度/默契度 | 私人   | 云端     | 自动同步 |
| 纪念日     | 私人   | 云端     | 自动同步 |

#### 3.1.5 安全边界

* 禁止跨空间数据访问

* 成员退出空间后，其个人数据不保留在空间内

* 空间解散后，所有共享数据删除

* 邀请码有效期7天，过期自动失效

* 禁止在空间内发送违规内容（接入内容审核）

#### 3.1.6 模块边界

| 模块                    | 职责             | 禁止             |
| --------------------- | -------------- | -------------- |
| `RelationshipSpaceUI` | 空间展示、成员管理、活动流  | 直接访问数据库、直接调用AI |
| `RelationshipService` | 空间创建、成员邀请、权限校验 | 直接渲染UI、直接操作存储  |
| `RelationshipStore`   | 空间数据CRUD、缓存管理  | 业务逻辑、UI渲染      |
| `RealtimeProvider`    | 实时通信、在线状态、消息推送 | 业务逻辑、数据持久化     |

***

### 3.2 女性周期管理（Cycle Tracker）

#### 3.2.1 功能范围

* 经期开始/结束记录

* 周期预测（基于历史数据）

* 排卵/易孕期提示

* 经量记录（少/中/多）

* 痛经等级（1-10）

* 症状记录（头痛、腰痛、腹胀、水肿、痤疮等）

* 情绪记录（开心、平静、焦虑、易怒、低落等）

* 睡眠/运动/饮食关联

* 今日能量建议（基于周期阶段）

* 经期前提醒

* 隐私锁（PIN/生物识别）

* 本地数据导出/删除

* 医学免责声明

#### 3.2.2 数据契约

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
  date: string              // YYYY-MM-DD
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
  averageCycleLength: number   // 平均周期天数
  averagePeriodLength: number  // 平均经期天数
  nextPeriodStart: string      // 预测下次经期开始
  nextPeriodEnd: string        // 预测下次经期结束
  nextOvulation: string        // 预测排卵日
  fertileWindowStart: string   // 易孕期开始
  fertileWindowEnd: string     // 易孕期结束
  currentPhase: CyclePhase     // 当前周期阶段
  confidence: number           // 预测置信度 0-1
}

interface CycleSettings {
  userId: string
  enabled: boolean
  reminderDaysBefore: number   // 经期前提醒天数
  reminderTime: string         // 提醒时间 HH:mm
  privacyLockEnabled: boolean
  showEnergySuggestion: boolean
  showInDashboard: boolean
  dataRetentionDays: number    // 数据保留天数，0=永久
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

#### 3.2.3 权益绑定

| 权益Code                    | 说明     | 来源       |
| ------------------------- | ------ | -------- |
| `cycle_tracker`           | 基础周期记录 | 免费       |
| `cycle_prediction`        | 周期预测   | 免费       |
| `cycle_energy_suggestion` | 能量建议   | 学习会员+    |
| `cycle_ai_insight`        | AI周期洞察 | Agent会员+ |

#### 3.2.4 隐私分级

| 数据   | 隐私级别 | 存储策略 | 同步策略  |
| ---- | ---- | ---- | ----- |
| 周期记录 | 高敏感  | 本地优先 | 需单独授权 |
| 周期预测 | 高敏感  | 本地优先 | 需单独授权 |
| 周期设置 | 私人   | 本地   | 需单独授权 |
| 能量建议 | 私人   | 本地   | 需单独授权 |

**关键约束**：

* 周期数据默认仅本地存储

* 云同步必须由用户单独开启

* 日志不得输出周期数据

* 截图不得包含周期数据

* 提供一键导出和删除功能

#### 3.2.5 安全边界

* **不做医学诊断**：只做记录、预测、提醒和生活建议

* **异常情况提示就医**：周期异常、持续疼痛等提示就医建议

* **明确免责声明**：在功能入口和设置页显示免责声明

* **隐私锁**：支持PIN码或生物识别锁定

* **数据脱敏**：AI分析时仅传递脱敏数据

#### 3.2.6 模块边界

| 模块                      | 职责             | 禁止            |
| ----------------------- | -------------- | ------------- |
| `CycleTrackerUI`        | 周期日历、记录表单、统计图表 | 直接访问存储、直接调用AI |
| `CycleService`          | 记录管理、预测计算、提醒调度 | 直接渲染UI、直接操作存储 |
| `CycleStore`            | 周期数据CRUD、本地加密  | 业务逻辑、UI渲染     |
| `CyclePredictionEngine` | 周期预测算法、能量计算    | 数据持久化、网络请求    |

***

### 3.3 壁纸上传（Wallpaper Upload）

#### 3.3.1 功能范围

* 支持用户上传本地图片作为桌面背景或应用背景

* 支持预览、替换、删除和恢复默认背景

* 可读性保护：

  * 遮罩强度调节

  * 背景模糊调节

  * 亮度调节

  * 饱和度调节

  * 暗角保护

  * 卡片背景透明度调节

  * 文字可读性预警

* 壁纸库：预设壁纸选择

* 壁纸与主题联动：不同主题可配置不同壁纸

#### 3.3.2 数据契约

```ts
type WallpaperSource = 'preset' | 'upload' | 'theme_default'

interface WallpaperConfig {
  id: string
  userId: string
  source: WallpaperSource
  presetId?: string           // 预设壁纸ID
  localPath?: string          // 本地存储路径（上传壁纸）
  thumbnailDataUrl?: string   // 缩略图（用于预览）
  themeBinding?: ThemeId      // 绑定到特定主题
  adjustments: {
    overlay: string           // 遮罩颜色和透明度
    blur: string              // 模糊程度 px
    brightness: number        // 亮度 0-2
    saturation: number        // 饱和度 0-2
    vignette: number          // 暗角强度 0-1
    cardOpacity: number       // 卡片透明度 0-1
  }
  readabilityWarning: boolean // 可读性预警
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
  accessibilityScore: number  // 可读性评分 0-100
}
```

#### 3.3.3 权益绑定

| 权益Code                     | 说明      | 来源               |
| -------------------------- | ------- | ---------------- |
| `wallpaper_upload`         | 上传自定义壁纸 | 免费               |
| `wallpaper_preset_library` | 预设壁纸库   | 免费（基础）+ 学习会员（高级） |
| `wallpaper_per_theme`      | 每主题独立壁纸 | 学习会员+            |

#### 3.3.4 隐私分级

| 数据     | 隐私级别 | 存储策略 | 同步策略  |
| ------ | ---- | ---- | ----- |
| 上传壁纸原图 | 私人   | 本地   | 需单独授权 |
| 壁纸配置   | 私人   | 本地   | 可同步   |
| 预设壁纸选择 | 普通   | 本地   | 可同步   |

**关键约束**：

* 壁纸可能包含私人照片，不得默认上传云端

* 截图、日志和错误报告不得自动包含壁纸原图

* 后续如支持同步，必须由用户单独开启

#### 3.3.5 可读性保护算法

```ts
interface ReadabilityCheckResult {
  score: number              // 0-100
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
  // 基于主题文字颜色和壁纸背景计算对比度
  // 检测过亮/过暗区域
  // 检测复杂纹理区域
  // 返回评分和建议
}
```

#### 3.3.6 模块边界

| 模块                  | 职责              | 禁止              |
| ------------------- | --------------- | --------------- |
| `WallpaperPickerUI` | 壁纸选择、预览、调整控件    | 直接操作文件系统、直接调用存储 |
| `WallpaperService`  | 壁纸加载、保存、可读性检查   | 直接渲染UI、直接操作文件   |
| `WallpaperStore`    | 壁纸配置CRUD、本地文件管理 | 业务逻辑、UI渲染       |
| `WallpaperRenderer` | 壁纸渲染、效果应用       | 数据持久化           |

***

### 3.4 3D角色生成（3D Avatar Generation）

#### 3.4.1 功能范围

* AI生成专属3D角色（输入描述生成）

* 角色渲染：3D GLTF、2D Live2D、2D贴纸

* 角色来源：

  * 内置角色库

  * Ready Player Me 捏脸

  * Meshy AI 生成

  * 用户上传

  * IP联名

* 角色进化：基于用户行为解锁装饰/特效/动画

* 角色动画：待机、鼓励、庆祝、思考等

* 角色与Persona绑定

#### 3.4.2 数据契约

```ts
type AvatarRenderMode = '3d_gltf' | '2d_live2d' | '2d_sticker'
type AvatarSource = 'builtin' | 'ready_player_me' | 'meshy_ai' | 'user_upload' | 'ip_collab'

interface AvatarDefinition {
  id: string
  userId: string
  personaId?: string          // 绑定的Persona
  name: string
  source: AvatarSource
  renderMode: AvatarRenderMode
  
  // 3D/2D资源引用
  modelUrl?: string           // GLTF/Live2D模型URL
  stickerUrl?: string         // 2D贴纸URL
  thumbnailUrl: string        // 缩略图
  
  // Ready Player Me 配置
  rpmAvatarUrl?: string
  rpmConfig?: Record<string, unknown>
  
  // AI生成配置
  aiPrompt?: string           // 生成提示词
  aiModelId?: string          // 生成模型ID
  
  // 进化状态
  evolution: {
    level: number
    unlockedDecorations: string[]
    unlockedEffects: string[]
    unlockedAnimations: string[]
    totalFocusMinutes: number
    totalTasksCompleted: number
    streakDays: number
  }
  
  // 动画配置
  animations: Array<{
    name: string              // idle, encourage, celebrate, think
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

#### 3.4.3 权益绑定

| 权益Code                  | 说明                 | 来源               |
| ----------------------- | ------------------ | ---------------- |
| `avatar_builtin`        | 内置角色库              | 免费（1个固定2D）       |
| `avatar_preset_library` | 预设角色库              | Agent会员（6个2D/3D） |
| `avatar_rpm`            | Ready Player Me 捏脸 | Agent会员          |
| `avatar_ai_gen`         | AI 3D角色生成配额        | PLUS（10次/月）      |
| `avatar_evolution`      | 角色进化系统             | Agent会员          |
| `avatar_evolution_full` | 角色进化全解锁            | PLUS             |
| `avatar_ip_collab`      | IP联名角色             | 单独购买             |

#### 3.4.4 隐私分级

| 数据      | 隐私级别 | 存储策略  | 同步策略 |
| ------- | ---- | ----- | ---- |
| 角色定义    | 私人   | 本地+云端 | 自动同步 |
| AI生成提示词 | 私人   | 不存储   | 不同步  |
| 角色进化数据  | 私人   | 本地+云端 | 自动同步 |
| RPM配置   | 私人   | 本地    | 需授权  |

#### 3.4.5 技术选型

| 组件     | 推荐方案                | 备选方案       |
| ------ | ------------------- | ---------- |
| 3D渲染   | Three.js            | Babylon.js |
| Live2D | pixi-live2d-display | 官方SDK      |
| AI生成   | Meshy AI API        | 自建模型       |
| 捏脸     | Ready Player Me     | 自研捏脸系统     |

#### 3.4.6 降级策略

| 场景        | 降级方案    |
| --------- | ------- |
| 3D渲染不可用   | 降级为2D立绘 |
| AI生成失败    | 提供预设角色库 |
| Live2D不可用 | 降级为静态贴纸 |
| 模型加载失败    | 显示加载占位符 |

#### 3.4.7 模块边界

| 模块                 | 职责             | 禁止            |
| ------------------ | -------------- | ------------- |
| `AvatarEditorUI`   | 角色编辑、捏脸、进化展示   | 直接调用AI、直接操作存储 |
| `AvatarRenderer`   | 3D/2D渲染、动画播放   | 业务逻辑、数据持久化    |
| `AvatarService`    | 角色管理、进化计算、配额控制 | 直接渲染、直接操作存储   |
| `AvatarStore`      | 角色数据CRUD、缓存管理  | 业务逻辑、渲染       |
| `AvatarAIProvider` | AI生成调用、结果处理    | 业务逻辑、数据持久化    |

***

## 四、界面与交互工程规范

### 4.1 关系空间UI

#### 4.1.1 页面结构

```
关系空间
├── 空间列表
│   ├── 空间卡片（类型图标、名称、成员头像、亲密度/默契度）
│   └── 创建空间入口
├── 空间详情
│   ├── 成员管理
│   ├── 共享任务
│   ├── 共享习惯
│   ├── 专注PK
│   ├── 排行榜
│   ├── 纪念日
│   └── 共同目标
└── 空间设置
    ├── 隐私设置
    ├── 通知设置
    └── 解散空间
```

#### 4.1.2 交互规范

* 创建空间：选择类型 → 设置名称 → 生成邀请码/链接 → 分享邀请

* 加入空间：输入邀请码 → 确认加入 → 设置昵称

* 互推任务：选择任务 → 选择推送对象 → 确认推送 → 对方收到通知

* 专注PK：发起挑战 → 选择时长 → 对方接受 → 同步开始 → 结束比较

### 4.2 女性周期UI

#### 4.2.1 页面结构

```
周期管理
├── 周期日历
│   ├── 月历视图（标记经期、预测、排卵期）
│   └── 日详情（记录表单）
├── 今日卡片
│   ├── 当前阶段
│   ├── 能量建议
│   └── 快捷记录
├── 统计图表
│   ├── 周期趋势
│   ├── 症状分布
│   └── 情绪趋势
└── 设置
    ├── 提醒设置
    ├── 隐私锁
    ├── 数据导出
    └── 免责声明
```

#### 4.2.2 交互规范

* 记录经期：日历点击日期 → 选择经期开始/结束 → 保存

* 记录症状：点击日期 → 选择症状/情绪 → 保存

* 查看预测：日历上显示预测区域（虚线标记）

* 隐私锁：首次开启时设置PIN → 每次进入模块需验证

### 4.3 壁纸上传UI

#### 4.3.1 页面结构

```
壁纸设置
├── 当前壁纸预览
├── 壁纸来源
│   ├── 预设壁纸库（分类浏览）
│   └── 上传本地图片
├── 调整控件
│   ├── 遮罩强度滑块
│   ├── 模糊程度滑块
│   ├── 亮度滑块
│   ├── 饱和度滑块
│   ├── 暗角滑块
│   └── 卡片透明度滑块
├── 可读性预警
└── 主题绑定选项
```

#### 4.3.2 交互规范

* 选择预设：点击壁纸 → 预览 → 应用

* 上传壁纸：点击上传 → 选择文件 → 预览 → 调整 → 应用

* 调整效果：拖动滑块 → 实时预览 → 满意后保存

* 可读性预警：自动检测 → 显示预警提示 → 提供调整建议

### 4.4 3D角色UI

#### 4.4.1 页面结构

```
角色管理
├── 当前角色展示（3D渲染区域）
│   ├── 角色模型
│   ├── 动画控制
│   └── 进化状态
├── 角色来源
│   ├── 内置角色库
│   ├── AI生成
│   ├── Ready Player Me
│   └── IP联名商店
├── 角色编辑
│   ├── 外观调整
│   ├── 装饰选择
│   └── 动画配置
└── 进化记录
    ├── 已解锁装饰
    ├── 已解锁特效
    └── 进化历程
```

#### 4.4.2 交互规范

* 选择内置：浏览角色库 → 选择角色 → 预览 → 应用

* AI生成：输入描述 → 选择风格 → 生成 → 预览 → 保存

* RPM捏脸：跳转RPM → 创建角色 → 回调 → 应用

* 进化展示：查看已解锁 → 装备装饰/特效 → 保存

***

## 五、核心业务逻辑

### 5.1 关系空间业务逻辑

#### 5.1.1 亲密度/默契度计算

```ts
function calculateIntimacyScore(space: RelationshipSpace, activities: SpaceActivity[]): number {
  // 基于以下因素计算：
  // 1. 互动频率（任务推送、完成、打卡）
  // 2. 共同专注时长
  // 3. 连续互动天数
  // 4. 纪念日庆祝
  // 5. 共同目标进度
  
  const interactionScore = calculateInteractionScore(activities)
  const focusScore = space.stats.totalSharedFocus / 60 // 小时
  const streakScore = space.stats.streakDays * 2
  const anniversaryScore = calculateAnniversaryScore(space.anniversaries)
  const goalScore = calculateGoalScore(space.sharedGoals)
  
  return Math.min(100, interactionScore + focusScore + streakScore + anniversaryScore + goalScore)
}
```

#### 5.1.2 任务推送流程

```
用户A选择任务 → 选择推送对象B → 确认推送
    ↓
创建SpaceActivity（task_push）
    ↓
实时通知B
    ↓
B收到通知 → 查看任务 → 接受/拒绝
    ↓
接受：任务添加到B的任务列表
拒绝：通知A
```

#### 5.1.3 专注PK流程

```
用户A发起PK → 选择时长 → 邀请B
    ↓
B收到邀请 → 接受/拒绝
    ↓
接受：双方同步开始计时
    ↓
计时结束 → 比较结果 → 更新排行
    ↓
创建SpaceActivity（ranking_update）
```

### 5.2 女性周期业务逻辑

#### 5.2.1 周期预测算法

```ts
function predictCycle(records: CycleRecord[]): CyclePrediction {
  // 基于最近6个周期的数据计算
  const recentPeriods = extractRecentPeriods(records, 6)
  
  if (recentPeriods.length < 2) {
    // 数据不足，使用默认值
    return createDefaultPrediction()
  }
  
  const cycleLengths = calculateCycleLengths(recentPeriods)
  const periodLengths = calculatePeriodLengths(recentPeriods)
  
  const avgCycleLength = average(cycleLengths)
  const avgPeriodLength = average(periodLengths)
  
  const lastPeriodStart = recentPeriods[recentPeriods.length - 1].start
  
  const nextPeriodStart = addDays(lastPeriodStart, avgCycleLength)
  const nextPeriodEnd = addDays(nextPeriodStart, avgPeriodLength - 1)
  const nextOvulation = addDays(nextPeriodStart, Math.floor(avgCycleLength / 2))
  
  const fertileWindowStart = addDays(nextOvulation, -5)
  const fertileWindowEnd = addDays(nextOvulation, 1)
  
  const currentPhase = determineCurrentPhase(lastPeriodStart, avgCycleLength, avgPeriodLength)
  
  const confidence = calculateConfidence(recentPeriods.length, cycleLengths)
  
  return {
    averageCycleLength: avgCycleLength,
    averagePeriodLength: avgPeriodLength,
    nextPeriodStart,
    nextPeriodEnd,
    nextOvulation,
    fertileWindowStart,
    fertileWindowEnd,
    currentPhase,
    confidence
  }
}
```

#### 5.2.2 能量建议生成

```ts
function generateEnergySuggestion(prediction: CyclePrediction, date: string): EnergySuggestion {
  const phase = prediction.currentPhase
  
  const phaseConfigs: Record<CyclePhase, EnergySuggestion> = {
    menstrual: {
      phase: 'menstrual',
      energyLevel: 'low',
      suggestedTaskIntensity: 'light',
      suggestions: [
        '适合做轻松的整理工作',
        '可以安排低强度的学习任务',
        '注意休息，多喝温水'
      ],
      avoidTypes: ['高强度运动', '重要决策', '高压任务']
    },
    follicular: {
      phase: 'follicular',
      energyLevel: 'high',
      suggestedTaskIntensity: 'high',
      suggestions: [
        '精力充沛，适合攻坚任务',
        '可以安排重要会议和决策',
        '适合开始新项目'
      ],
      avoidTypes: []
    },
    ovulation: {
      phase: 'ovulation',
      energyLevel: 'high',
      suggestedTaskIntensity: 'moderate',
      suggestions: [
        '社交能力较强',
        '适合沟通协作类任务',
        '适合做展示和汇报'
      ],
      avoidTypes: ['高强度运动']
    },
    luteal: {
      phase: 'luteal',
      energyLevel: 'medium',
      suggestedTaskIntensity: 'moderate',
      suggestions: [
        '适合收尾和总结工作',
        '可以安排复盘和整理',
        '注意情绪波动'
      ],
      avoidTypes: ['重要决策', '高压任务']
    }
  }
  
  return { ...phaseConfigs[phase], date }
}
```

### 5.3 壁纸上传业务逻辑

#### 5.3.1 可读性检查

```ts
function checkReadability(config: WallpaperConfig, theme: StudyTheme): ReadabilityCheckResult {
  const issues: ReadabilityCheckResult['issues'] = []
  let score = 100
  
  // 检查亮度
  if (config.adjustments.brightness < 0.5) {
    issues.push({
      type: 'too_dark',
      severity: 'warning',
      suggestion: '壁纸过暗，建议提高亮度或增加遮罩'
    })
    score -= 20
  }
  
  if (config.adjustments.brightness > 1.5) {
    issues.push({
      type: 'too_bright',
      severity: 'warning',
      suggestion: '壁纸过亮，建议降低亮度或增加遮罩'
    })
    score -= 20
  }
  
  // 检查模糊
  if (config.adjustments.blur < 5) {
    issues.push({
      type: 'too_busy',
      severity: 'info',
      suggestion: '壁纸细节较多，建议增加模糊以提高可读性'
    })
    score -= 10
  }
  
  // 检查遮罩
  const overlayOpacity = parseOverlayOpacity(config.adjustments.overlay)
  if (overlayOpacity < 0.3) {
    issues.push({
      type: 'low_contrast',
      severity: 'warning',
      suggestion: '遮罩较淡，可能影响文字可读性'
    })
    score -= 15
  }
  
  return {
    score: Math.max(0, score),
    warning: score < 70,
    issues
  }
}
```

### 5.4 3D角色业务逻辑

#### 5.4.1 进化规则引擎

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

#### 5.4.2 AI生成流程

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

***

## 六、模块化拆分与迭代计划

### 6.1 模块清单

| 模块ID | 模块名称                  | 优先级 | 依赖模块                              | 预计工期 |
| ---- | --------------------- | --- | --------------------------------- | ---- |
| E1   | WallpaperStore        | P0  | 本地存储                              | 2天   |
| E2   | WallpaperService      | P0  | E1, ThemeRegistry                 | 2天   |
| E3   | WallpaperPickerUI     | P0  | E2                                | 3天   |
| E4   | CycleStore            | P1  | 本地存储, 加密                          | 2天   |
| E5   | CyclePredictionEngine | P1  | E4                                | 2天   |
| E6   | CycleService          | P1  | E4, E5                            | 2天   |
| E7   | CycleTrackerUI        | P1  | E6                                | 4天   |
| E8   | RelationshipStore     | P2  | 云端存储                              | 3天   |
| E9   | RealtimeProvider      | P2  | WebSocket                         | 3天   |
| E10  | RelationshipService   | P2  | E8, E9, EntitlementService        | 4天   |
| E11  | RelationshipSpaceUI   | P2  | E10                               | 5天   |
| E12  | AvatarStore           | P3  | 本地+云端存储                           | 2天   |
| E13  | AvatarRenderer        | P3  | Three.js/Live2D                   | 5天   |
| E14  | AvatarAIProvider      | P3  | AI Provider                       | 3天   |
| E15  | AvatarService         | P3  | E12, E13, E14, EntitlementService | 3天   |
| E16  | AvatarEditorUI        | P3  | E15                               | 4天   |

### 6.2 迭代里程碑

| 里程碑     | 包含模块                    | 交付物    | 验收标准          |
| ------- | ----------------------- | ------ | ------------- |
| M1 壁纸上传 | E1, E2, E3              | 壁纸上传功能 | 可上传、调整、应用壁纸   |
| M2 女性周期 | E4, E5, E6, E7          | 周期管理功能 | 可记录、预测、查看统计   |
| M3 关系空间 | E8, E9, E10, E11        | 关系空间功能 | 可创建空间、邀请成员、互动 |
| M4 3D角色 | E12, E13, E14, E15, E16 | 3D角色功能 | 可生成、渲染、进化角色   |

### 6.3 开发顺序

遵循「单模块串行开发」原则：

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

***

## 七、全维度风险预判与工程兜底

### 7.1 风险分类

| 风险类型 | 风险项          | 等级 | 应对措施           |
| ---- | ------------ | -- | -------------- |
| 代码风险 | 3D渲染性能问题     | 中  | 提供降级方案，限制模型复杂度 |
| 代码风险 | 实时通信断开       | 中  | 降级为轮询，离线队列     |
| 架构风险 | 关系空间数据模型变更   | 高  | 版本迁移脚本，向后兼容    |
| 架构风险 | 周期预测算法精度不足   | 中  | 持续优化，提供置信度显示   |
| 交付风险 | 3D角色生成API不稳定 | 高  | 多供应商备选，预设角色库   |
| 交付风险 | 实时通信服务成本     | 中  | 按需连接，空闲断开      |
| 运维风险 | 壁纸存储空间占用     | 低  | 自动压缩，定期清理      |
| 运维风险 | 关系空间数据增长     | 中  | 数据归档策略         |
| 安全风险 | 周期数据泄露       | 高  | 本地优先，加密存储，隐私锁  |
| 安全风险 | 关系空间内容违规     | 高  | 内容审核，举报机制      |
| 合规风险 | 未成年人使用关系空间   | 高  | 年龄验证，功能限制      |
| 合规风险 | 周期管理被误解为医疗   | 高  | 明确免责声明，提示就医    |

### 7.2 应急预案

| 场景        | 应急措施              |
| --------- | ----------------- |
| AI生成服务不可用 | 切换到预设角色库，显示服务维护提示 |
| 实时通信服务故障  | 降级为轮询模式，延长轮询间隔    |
| 3D渲染崩溃    | 自动降级为2D模式，记录错误日志  |
| 周期预测异常    | 显示预测置信度，提示用户手动调整  |
| 关系空间数据冲突  | 最后写入胜出 + 冲突日志     |

***

## 八、测试覆盖要求

### 8.1 单元测试

| 模块                    | 测试重点                |
| --------------------- | ------------------- |
| CyclePredictionEngine | 预测算法准确性、边界条件、数据不足处理 |
| CycleService          | 记录CRUD、提醒调度、隐私锁     |
| WallpaperService      | 壁纸加载、可读性检查、调整效果     |
| RelationshipService   | 空间创建、成员管理、权限校验      |
| AvatarService         | 角色管理、进化计算、配额控制      |

### 8.2 集成测试

| 场景           | 测试内容          |
| ------------ | ------------- |
| 壁纸与主题联动      | 切换主题时壁纸正确切换   |
| 周期与任务联动      | 能量建议影响任务推荐    |
| 关系空间与权益      | 权益控制功能可用性     |
| 角色与Persona联动 | 角色正确绑定Persona |

### 8.3 边界/异常测试

| 场景       | 测试内容     |
| -------- | -------- |
| 周期数据不足   | 预测降级为默认值 |
| 壁纸文件过大   | 自动压缩或拒绝  |
| 关系空间成员上限 | 禁止继续邀请   |
| AI生成配额耗尽 | 提示购买或等待  |

### 8.4 安全测试

| 场景     | 测试内容        |
| ------ | ----------- |
| 周期数据隐私 | 日志不输出、截图不包含 |
| 关系空间越权 | 跨空间访问被拒绝    |
| 壁纸隐私   | 不自动上传云端     |
| 角色配额绕过 | 无法绕过权益检查    |

***

## 九、文档与交付标准

### 9.1 模块文档要求

每个模块完成后必须输出：

1. 模块职责说明
2. 接口契约文档
3. 数据结构说明
4. 依赖关系图
5. 测试报告
6. 已知限制

### 9.2 API文档要求

所有对外接口必须包含：

1. 接口名称和描述
2. 入参结构和类型
3. 返回结构和类型
4. 错误码和错误信息
5. 调用示例
6. 权限要求

### 9.3 变更记录要求

所有变更必须记录：

1. 变更日期
2. 变更内容
3. 变更原因
4. 影响范围
5. 兼容性说明

***

## 十、与现有设计文档的关系

| 文档                                                         | 关系                 |
| ---------------------------------------------------------- | ------------------ |
| `2026-05-31-xinghuanhai-design.md`                         | 基础产品设计，本设计继承其原则    |
| `2026-06-01-companion-persona-system-design.md`            | Persona系统，3D角色与其绑定 |
| `2026-06-01-memory-and-self-evolving-agent-design.md`      | 记忆系统，Avatar系统继承其设计 |
| `2026-06-01-monetization-and-membership-design.md`         | 会员体系，本设计权益绑定遵循其规范  |
| `2026-06-01-user-centered-visual-persona-system-design.md` | 视觉系统，壁纸上传继承其设计     |

***

## 十一、版本历史

| 版本    | 日期         | 变更内容            | 作者       |
| ----- | ---------- | --------------- | -------- |
| 1.0.0 | 2026-06-02 | 初始版本，定义四大扩展功能设计 | AI Agent |

***

## 十二、下一步行动

1. 用户确认本设计规格
2. 创建详细实施计划（tasks.md）
3. 创建验收检查清单（checklist.md）
4. 开始M1壁纸上传模块开发

