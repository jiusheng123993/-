# 星寰海 — 开发任务计划 (DEV_PLAN)

> 版本：v2.0  
> 更新日期：2026-07-12  
> 状态：待执行  
> 依据：PRD.md v2.0、TECH_DESIGN.md v2.0  
> 主载体：微信小程序（Taro 3 + React 19 + TypeScript）

---

## 一、总体路线图

```
MVP阶段（3周）        第二阶段（验证后）      第三阶段（规模化）
─────────────────    ─────────────────     ─────────────────
P0 核心体验           P2 个性化记忆          P3 晚安交换
P0 安全机制           P2 情绪故事月报        P3 情绪伙伴
P0 AI主动引擎基础     P2 晨间/晚间仪式       P3 深夜电台
P1 感官干预           P2 情绪年轮            P3 咨询导流
P1 第二天跟进         P2 情绪测试            P3 会员付费
P1 树洞基础版         P2 3天拆解干预完整版   P3 B端EAP
P1 情绪风险日历
P1 情绪记录
```

### 验证节点（来自PRD）

| 时间 | 指标 | 继续 | 调整 | 止损 |
|------|------|------|------|------|
| 第2周 | 种子用户7日留存 | >20% | 10-20% | <10% |
| 第4周 | 用户量 | >500 | 200-500 | <200 |
| 第8周 | 30日留存 | >12% | 8-12% | <8% |
| 第12周 | 付费转化 | >3% | 1-3% | <1% |
| 第24周 | 综合评估 | 达标 | 调整方向 | 放弃 |

---

## 二、MVP阶段任务拆分（3周）

### 任务依赖关系图

```
T0 项目搭建
  ├─→ T1 memory-body迁移
  │     ├─→ T3 急救箱-入口和状态机
  │     │     ├─→ T4 5条急救流程
  │     │     ├─→ T5 高危检测和安全机制
  │     │     └─→ T6 呼吸动画+白噪音
  │     ├─→ T7 情绪记录3秒打卡
  │     ├─→ T8 树洞基础版
  │     ├─→ T9 情绪风险日历基础版
  │     └─→ T10 AI主动引擎基础版
  │           ├─→ T11 第二天跟进推送
  │           └─→ T12 联调测试和发布
  └─→ T2 微信登录认证
```

### 任务优先级和工时估算

| 任务ID | 任务名称 | 优先级 | 估时 | 依赖 | 状态 |
|--------|---------|--------|------|------|------|
| T0 | 项目基础搭建 | P0 | 1天 | 无 | ⏳未开始 |
| T1 | memory-body数据层迁移 | P0 | 2天 | T0 | ⏳未开始 |
| T2 | 微信登录认证 | P0 | 1天 | T0 | ⏳未开始 |
| T3 | 急救箱-入口和状态机 | P0 | 2天 | T1, T2 | ⏳未开始 |
| T4 | 5条急救流程实现 | P0 | 3天 | T3 | ⏳未开始 |
| T5 | 高危检测和安全机制 | P0 | 1天 | T3 | ⏳未开始 |
| T6 | 呼吸动画+白噪音组件 | P1 | 1天 | T3 | ⏳未开始 |
| T7 | 情绪记录3秒打卡 | P1 | 1天 | T1, T2 | ⏳未开始 |
| T8 | 树洞基础版 | P1 | 2天 | T1, T2 | ⏳未开始 |
| T9 | 情绪风险日历基础版 | P1 | 2天 | T1, T2 | ⏳未开始 |
| T10 | AI主动引擎基础版 | P0 | 2天 | T1 | ⏳未开始 |
| T11 | 第二天跟进推送 | P1 | 1天 | T10 | ⏳未开始 |
| T12 | 个人中心 | P1 | 1天 | T2 | ⏳未开始 |
| T13 | 分包优化和性能调优 | P1 | 1天 | 所有 | ⏳未开始 |
| T14 | 联调测试和发布准备 | P0 | 2天 | 所有 | ⏳未开始 |

**总估时：23人天（约3周）**

---

## 三、任务详细描述

### T0：项目基础搭建（P0，1天）

**目标**：创建Taro 3小程序项目骨架，配置基础工具链。

**前置条件**：
- 已安装 Node.js 18+
- 已安装 Taro CLI

**具体任务**：
1. 初始化Taro 3项目（React + TypeScript + Sass）
2. 配置 `tsconfig.json`（严格模式、路径别名 `@/`）
3. 配置 ESLint + Prettier
4. 配置 Zustand（状态管理）
5. 创建目录结构（按TECH_DESIGN 7.1节）
6. 配置 Supabase 客户端
7. 配置小程序 `app.config.ts`（页面路由、tabBar）
8. 创建基础样式系统（色彩心理学配色变量）

**交付文件清单**：
```
src/
├── app.tsx
├── app.config.ts
├── app.scss
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── taro.config.ts
└── src/
    ├── pages/（空目录占位）
    ├── components/
    ├── engines/
    ├── memory-body/
    ├── hooks/
    ├── stores/
    ├── services/
    ├── data/
    └── utils/
```

**验收标准**：
- `npm run dev:weapp` 能成功编译
- 小程序开发者工具能预览空白首页
- TypeScript严格模式无错误
- ESLint无错误

---

### T1：memory-body数据层迁移（P0，2天）

**目标**：迁移现有memory-body引擎到小程序，适配小程序存储。

**前置条件**：T0完成

**具体任务**：
1. 从 `src/ai-partner/memory-body/` 迁移核心代码
2. 适配小程序存储 API（`Taro.setStorageSync` / `Taro.getStorageSync`）
3. 实现 `BrowserMemoryBodyStore` → `MiniProgramMemoryBodyStore` 适配器
4. 迁移核心模块（按TECH_DESIGN 4.1节18模块映射）：
   - core/types/guards/config
   - ingestion/memoryIngestor
   - retrieval/memoryRetrieval
   - graph/memoryGraph
   - decay/memoryDecay
   - evolution/memoryEvolution
   - feedback/memoryFeedback
   - safety/privacyGuard/forbiddenFilter
   - sync/localFirstCloudOptional
5. 迁移单元测试（适配小程序环境）
6. 新增5个模块（TECH_DESIGN 4.2节）：
   - emotionIndex（情绪索引）
   - interventionTracker（干预追踪）
   - crisisSafetyNet（安全网）
   - outreachCoordinator（主动协调）
   - patternDiscovery（模式发现）

**交付文件清单**：
```
src/memory-body/
├── types/
│   ├── memoryBodyTypes.ts
│   └── emotionTypes.ts
├── store/
│   ├── memoryBodyStore.ts
│   ├── miniProgramMemoryBodyStore.ts  ← 新增
│   └── inMemoryMemoryBodyStore.ts
├── core/
│   ├── memoryBodyConfig.ts
│   └── memoryBodyGuards.ts
├── ingestion/
│   └── memoryIngestor.ts
├── retrieval/
│   └── memoryRetrieval.ts
├── graph/
│   ├── memoryGraph.ts
│   └── contradictionDetector.ts
├── decay/
│   └── memoryDecay.ts
├── evolution/
│   └── memoryEvolution.ts
├── feedback/
│   └── memoryFeedback.ts
├── safety/
│   ├── memoryPrivacyGuard.ts
│   ├── forbiddenMemoryFilter.ts
│   └── sensitiveMemoryClassifier.ts
├── sync/
│   └── localFirstCloudOptional.ts
├── adapters/
│   ├── emotionIndexAdapter.ts        ← 新增
│   ├── interventionTrackerAdapter.ts ← 新增
│   ├── crisisSafetyNetAdapter.ts     ← 新增
│   ├── outreachCoordinatorAdapter.ts ← 新增
│   └── patternDiscoveryAdapter.ts    ← 新增
├── context/
│   └── promptContextComposer.ts
└── index.ts
```

**验收标准**：
- 所有迁移的单元测试通过
- 能在小程序环境写入/读取记忆
- 本地优先策略生效（离线可用）
- 存储大小 < 2MB（核心数据）

---

### T2：微信登录认证（P0，1天）

**目标**：实现微信小程序登录流程，对接Supabase用户表。

**前置条件**：T0完成

**具体任务**：
1. 实现微信登录（`Taro.login` → code → 后端换 openid）
2. 创建 Supabase `users` 和 `profiles` 表
3. 实现JWT签发和验证
4. 创建 `authStore`（Zustand）
5. 实现 `useAuth` Hook
6. 创建登录页面（简洁，无注册流程）
7. 实现 token 持久化和自动续期

**交付文件清单**：
```
src/
├── pages/
│   └── login/
│       ├── index.tsx
│       └── index.scss
├── stores/
│   └── authStore.ts
├── hooks/
│   └── useAuth.ts
├── services/
│   ├── api.ts
│   └── authService.ts
└── utils/
    └── storage.ts
```

**数据库变更**：
- 创建 `users` 表
- 创建 `profiles` 表
- 创建 `memberships` 表
- 配置 RLS 策略（用户只能访问自己的数据）

**验收标准**：
- 微信开发者工具能完成登录
- token 能持久化存储
- 未登录用户被重定向到登录页
- 登录后能获取到用户信息

---

### T3：情绪急救箱-入口和状态机（P0，2天）

**目标**：实现急救箱首页入口（"你怎么了？"5选项）和急救流程状态机。

**前置条件**：T1、T2完成

**具体任务**：
1. 创建首页（`pages/index/`）：
   - 全屏"你怎么了？"问题
   - 5个情绪选项按钮（难过/焦虑/累/孤独/说不出来）
   - 色彩心理学背景（根据选择变化）
2. 实现急救状态机（`EmergencyEngine`）：
   - 10种状态（idle/entry/naming/writing/action/connect/closing/crisis/completed/followup）
   - 状态转换逻辑
   - 步骤配置加载
3. 创建 `emergencyStore`（Zustand）
4. 实现 `useEmergency` Hook
5. 创建急救流程页面骨架（`pages/emergency/`）
6. 实现 `emergencyService`（API调用）

**交付文件清单**：
```
src/
├── pages/
│   ├── index/
│   │   ├── index.tsx
│   │   └── index.scss
│   └── emergency/
│       ├── index.tsx
│       └── index.scss
├── engines/
│   └── emergency/
│       ├── EmergencyEngine.ts
│       ├── types.ts
│       └── index.ts
├── stores/
│   └── emergencyStore.ts
├── hooks/
│   └── useEmergency.ts
├── services/
│   └── emergencyService.ts
└── data/
    └── emergencyFlows.ts
```

**数据库变更**：
- 创建 `emergency_sessions` 表
- 创建 `emergency_followups` 表

**验收标准**：
- 首页显示"你怎么了？"和5选项
- 点击选项能进入急救流程
- 状态机能正确转换
- 急救会话能保存到数据库
- 背景色根据情绪选择变化

---

### T4：5条急救流程实现（P0，3天）

**目标**：实现5条完整的急救流程（难过/焦虑/累/孤独/说不出来）。

**前置条件**：T3完成

**具体任务**：
1. 实现"我好难过"流程（5步：命名→书写→行动→连接→收尾）
2. 实现"我好焦虑"流程（5步：身体→书写→区分→控制圈→收尾）
3. 实现"我好累"流程（4步：允许→归因→行动→收尾）
4. 实现"我好孤独"流程（4步：接住→连接→互动→收尾）
5. 实现"说不出来"流程（5步：接住→非语言→回应→感官→收尾）
6. 实现各步骤组件：
   - `Naming.tsx`（命名步骤，颜色选择器）
   - `Writing.tsx`（书写步骤，文本输入）
   - `Action.tsx`（行动步骤，选项卡片）
   - `Connect.tsx`（连接步骤，社会认同数字）
   - `Closing.tsx`（收尾步骤，仪式感总结）
7. 实现急救信生成（保存到memory-body）
8. 实现急救前/后情绪强度评分

**交付文件清单**：
```
src/
├── pages/
│   └── emergency/
│       └── steps/
│           ├── Naming.tsx
│           ├── Writing.tsx
│           ├── Action.tsx
│           ├── Connect.tsx
│           └── Closing.tsx
├── engines/
│   └── emergency/
│       └── flows/
│           ├── sadFlow.ts
│           ├── anxiousFlow.ts
│           ├── tiredFlow.ts
│           ├── lonelyFlow.ts
│           └── unclearFlow.ts
├── components/
│   ├── MoodSelector.tsx
│   ├── ColorPicker.tsx
│   └── EmergencySummary.tsx
└── data/
    ├── moodTags.ts
    └── contextTags.ts
```

**验收标准**：
- 5条流程都能完整走通
- 每个步骤的心理学技术正确实现
- 急救前/后情绪强度被记录
- 急救信能生成并保存
- 流程能中途退出并恢复

---

### T5：高危检测和安全机制（P0，1天）

**目标**：实现高危关键词检测和分级干预机制。

**前置条件**：T3完成

**具体任务**：
1. 创建高危关键词库（3级：mild/moderate/severe）
2. 实现 `CrisisDetector`（关键词检测引擎）
3. 实现 `CrisisAlert` 组件（全屏干预弹窗）
4. 实现分级响应逻辑：
   - 轻度：正常流程 + 结尾追加24h热线
   - 中度：中断流程，全屏关怀+热线+选择
   - 重度：立即弹出热线+120/110
5. 集成到所有用户输入点（书写步骤、树洞发帖）
6. 高危记录加密存储
7. 热线信息：400-161-9995（希望24热线）

**交付文件清单**：
```
src/
├── engines/
│   └── emergency/
│       └── CrisisDetector.ts
├── components/
│   └── CrisisAlert.tsx
├── data/
│   └── crisisKeywords.ts
└── utils/
    └── crypto.ts
```

**验收标准**：
- 输入"想死"能触发中度干预
- 输入"已经吃了药"能触发重度干预
- 热线信息正确显示
- 高危记录被加密存储
- 绝不向高危用户推荐付费咨询

---

### T6：呼吸动画+白噪音组件（P1，1天）

**目标**：实现感官干预组件（呼吸动画、白噪音播放）。

**前置条件**：T3完成

**具体任务**：
1. 实现4-7-8呼吸动画组件（缓慢膨胀/收缩的圆）
2. 实现白噪音播放组件（5-10个预置音频）
3. 准备音频文件（雨声、篝火、海浪、风声等）
4. 实现音频本地播放（不需要流媒体）
5. 集成到急救流程的"行动"步骤
6. 支持后台播放控制

**交付文件清单**：
```
src/
├── components/
│   ├── BreathingAnimation.tsx
│   └── WhiteNoise.tsx
└── public/
    └── audio/
        ├── rain.mp3
        ├── bonfire.mp3
        ├── ocean.mp3
        ├── wind.mp3
        └── README.txt
```

**验收标准**：
- 呼吸动画跟随4-7-8节奏
- 白噪音能播放/暂停
- 音频文件总大小 < 500KB
- 在急救流程中能正确调用

---

### T7：情绪记录3秒打卡（P1，1天）

**目标**：实现快速情绪记录功能（3秒完成打卡）。

**前置条件**：T1、T2完成

**具体任务**：
1. 创建情绪记录页面（`pages/mood/`）
2. 实现24个情绪标签选择器
3. 实现情绪强度滑块（1-10）
4. 实现情境标签选择（可选）
5. 实现一句话备注（可选）
6. 数据写入memory-body和数据库
7. 创建情绪报告页面（简单趋势图）
8. 实现 `useMood` Hook

**交付文件清单**：
```
src/
├── pages/
│   └── mood/
│       ├── index.tsx
│       ├── report.tsx
│       └── index.scss
├── components/
│   └── MoodSelector.tsx
├── stores/
│   └── moodStore.ts
├── hooks/
│   └── useMood.ts
├── services/
│   └── moodService.ts
└── data/
    ├── moodTags.ts
    └── contextTags.ts
```

**数据库变更**：
- 创建 `mood_entries` 表
- 创建索引 `idx_mood_user_date`

**验收标准**：
- 3秒内能完成一次情绪打卡
- 情绪记录保存到数据库
- 情绪报告能显示7天趋势
- 数据同步到memory-body

---

### T8：树洞基础版（P1，2天）

**目标**：实现深夜树洞信息流（发帖、浏览、共情）。

**前置条件**：T1、T2完成

**具体任务**：
1. 创建树洞信息流页面（`pages/treehole/index`）
2. 创建发帖页面（`pages/treehole/post`）
3. 创建帖子详情页面（`pages/treehole/detail`）
4. 实现1-500字发帖（含高危检测）
5. 实现"懂你"互动（代替点赞）
6. 实现短回信功能（50字以内）
7. 实现 `useTreehole` Hook
8. AI自动打情绪标签（规则引擎）
9. 匿名机制（前端匿名，后端关联用户）

**交付文件清单**：
```
src/
├── pages/
│   └── treehole/
│       ├── index.tsx
│       ├── post.tsx
│       ├── detail.tsx
│       └── index.scss
├── components/
│   ├── TreeholeCard.tsx
│   └── EmpathyButton.tsx
├── stores/
│   └── treeholeStore.ts
├── hooks/
│   └── useTreehole.ts
└── services/
    └── treeholeService.ts
```

**数据库变更**：
- 创建 `treehole_posts` 表
- 创建 `treehole_replies` 表
- 配置 RLS 策略（所有人可读，登录可写）

**验收标准**：
- 能发布1-500字的帖子
- 信息流按时间倒序显示
- "懂你"能正确计数
- 高危内容被检测和隐藏
- 帖子数据同步到memory-body

---

### T9：情绪风险日历基础版（P1，2天）

**目标**：实现情绪风险日历（添加事件、日历视图、基础干预提示）。

**前置条件**：T1、T2完成

**具体任务**：
1. 创建日历主页面（`pages/calendar/index`）
2. 实现月历视图（标注风险等级：☀️☁️⚠️）
3. 创建添加事件页面（事件名、时间、情绪标记）
4. 实现AI补充分析（基于历史数据预估焦虑强度）
5. 创建事件详情页面（`pages/calendar/event`）
6. 实现基础干预提示（事件前3天开始提醒）
7. 实现 `useSchedule` Hook
8. 注：完整3天拆解干预流程在第二阶段实现

**交付文件清单**：
```
src/
├── pages/
│   └── calendar/
│       ├── index.tsx
│       ├── event.tsx
│       └── index.scss
├── components/
│   ├── CalendarGrid.tsx
│   ├── EventCard.tsx
│   └── RiskBadge.tsx
├── stores/
│   └── scheduleStore.ts
├── hooks/
│   └── useSchedule.ts
└── services/
    └── scheduleService.ts
```

**数据库变更**：
- 创建 `schedule_events` 表
- 创建 `intervention_records` 表

**验收标准**：
- 能添加事件并标记情绪
- 日历视图正确显示风险等级
- 事件详情能查看
- 基础干预提示能触发
- 数据同步到memory-body

---

### T10：AI主动引擎基础版（P0，2天）

**目标**：实现基于规则引擎的AI主动推送（冷启动期AI）。

**前置条件**：T1完成

**具体任务**：
1. 创建预设建议库（`suggestionLibrary.ts`）
2. 实现 `OutreachScheduler`（推送调度器）
3. 实现5种基础触发条件：
   - 沉默预警（3天未活跃）
   - 模式发现（基于情绪记录）
   - 跟进提醒（急救后第二天）
   - 好消息推送（情绪趋势上升）
   - 日程提醒（事件前3天）
4. 实现 `QuotaManager`（频率控制：每天最多2条）
5. 实现 `OutreachMessage` 组件（消息卡片）
6. 实现推送记录存储
7. 实现 `useOutreach` Hook

**交付文件清单**：
```
src/
├── engines/
│   └── outreach/
│       ├── OutreachScheduler.ts
│       ├── QuotaManager.ts
│       ├── types.ts
│       └── triggers/
│           ├── silenceTrigger.ts
│           ├── patternTrigger.ts
│           ├── followupTrigger.ts
│           ├── goodNewsTrigger.ts
│           └── scheduleTrigger.ts
├── components/
│   └── OutreachMessage.tsx
├── stores/
│   └── outreachStore.ts
├── hooks/
│   └── useOutreach.ts
├── services/
│   └── outreachService.ts
└── data/
    └── suggestionLibrary.ts
```

**数据库变更**：
- 创建 `ai_outreaches` 表
- 创建 `emotion_patterns` 表
- 创建 `outreach_quota` 表

**验收标准**：
- 沉默3天能触发预警推送
- 急救后第二天能触发跟进推送
- 频率控制生效（每天最多2条）
- 推送记录能保存
- 推送内容从预设建议库匹配

---

### T11：第二天跟进推送（P1，1天）

**目标**：实现急救后第二天的微信订阅消息推送。

**前置条件**：T10完成

**具体任务**：
1. 配置微信订阅消息模板
2. 实现订阅消息发送服务（后端）
3. 实现用户订阅授权流程
4. 实现第二天早上推送逻辑
5. 实现跟进回复页面（好一点了/还行/还是不好）
6. 实现差异化后续处理：
   - 好一点了 → 记录有效
   - 还行 → 简单回应
   - 还是不好 → 连续3天触发咨询推荐
7. 跟进数据写入memory-body

**交付文件清单**：
```
src/
├── pages/
│   └── emergency/
│       └── followup.tsx
├── services/
│   ├── subscribeService.ts
│   └── notificationService.ts
└── hooks/
    └── useFollowup.ts
```

**验收标准**：
- 能获取微信订阅授权
- 第二天早能收到推送
- 跟进页面能正确显示
- 回复数据能保存
- 连续3天"不好"能触发升级

---

### T12：个人中心（P1，1天）

**目标**：实现个人中心页面（设置、数据管理）。

**前置条件**：T2完成

**具体任务**：
1. 创建个人中心页面（`pages/profile/`）
2. 实现用户信息展示
3. 实现设置页面（隐私、通知、关于）
4. 实现数据导出功能
5. 实现清除数据功能
6. 实现隐私设置（本地/云端同步开关）

**交付文件清单**：
```
src/
├── pages/
│   └── profile/
│       ├── index.tsx
│       ├── settings.tsx
│       └── index.scss
└── components/
    └── SettingsList.tsx
```

**验收标准**：
- 能查看用户信息
- 能修改设置
- 能导出个人数据
- 能清除本地数据
- 隐私设置生效

---

### T13：分包优化和性能调优（P1，1天）

**目标**：小程序分包加载、性能优化、包大小控制。

**前置条件**：所有功能模块完成

**具体任务**：
1. 配置分包策略（主包+3个分包）：
   - 主包：急救核心（首页、急救流程、登录）
   - 分包1：社区（树洞）
   - 分包2：日历
   - 分包3：成长（情绪记录、报告）
2. 优化图片资源（压缩、CDN）
3. 优化音频资源（压缩、按需加载）
4. 实现虚拟列表（树洞信息流）
5. 优化 `setData` 性能
6. 包大小控制（主包 < 2MB）

**分包配置**：
```typescript
// app.config.ts
{
  pages: [
    'pages/index/index',
    'pages/emergency/index',
    'pages/login/index',
    'pages/profile/index',
  ],
  subPackages: [
    {
      root: 'subpackages/community',
      pages: ['treehole/index', 'treehole/post', 'treehole/detail']
    },
    {
      root: 'subpackages/calendar',
      pages: ['calendar/index', 'calendar/event']
    },
    {
      root: 'subpackages/growth',
      pages: ['mood/index', 'mood/report']
    }
  ]
}
```

**验收标准**：
- 主包 < 2MB
- 分包能按需加载
- 首屏加载时间 < 2秒
- 树洞信息流滚动流畅
- 无性能警告

---

### T14：联调测试和发布准备（P0，2天）

**目标**：全流程联调测试，准备小程序提审发布。

**前置条件**：所有功能模块完成

**具体任务**：
1. 端到端测试（核心流程）：
   - 登录 → 首页 → 急救流程 → 完成 → 第二天跟进
   - 登录 → 情绪记录 → 报告
   - 登录 → 树洞发帖 → 收到共情
   - 登录 → 添加日程 → 收到干预提示
2. 安全测试：
   - 高危关键词检测
   - 数据加密验证
   - 隐私设置验证
3. 性能测试：
   - 包大小检查
   - 加载时间测试
   - 弱网测试
4. 兼容性测试：
   - iOS微信
   - Android微信
   - 不同屏幕尺寸
5. 修复测试发现的bug
6. 准备提审材料：
   - 小程序名称、简介
   - 类目选择
   - 隐私政策
   - 用户协议
7. 提交微信审核

**验收标准**：
- 所有核心流程能走通
- 无P0/P1 bug
- 包大小符合要求
- 通过微信审核

---

## 四、第二阶段任务（验证后）

### T15：个性化记忆（P2）

**目标**：急救流程随使用次数进化（第1/3/7/15次差异化体验）。

**依赖**：T1、T4完成，MVP验证通过

**具体任务**：
1. 实现使用次数追踪
2. 实现历史数据回溯（从memory-body读取）
3. 实现差异化文案生成
4. 实现"你第一次来的时候..."对比

---

### T16：3天拆解干预完整版（P2）

**目标**：实现完整的3天拆解干预流程（T-3/T-2/T-1/T/T+1）。

**依赖**：T9完成，MVP验证通过

**具体任务**：
1. 实现T-3天：评估+命名
2. 实现T-2天：最坏情况分析（去灾难化）
3. 实现T-1天：成功回忆+心理预演
4. 实现T当天：简短赋能
5. 实现T+1天：效果追踪+模式记录
6. 实现干预失败升级策略
7. 实现基于事件类型的差异化干预（焦虑/恐惧/愤怒/回避/紧张）

---

### T17：情绪测试（P2）

**目标**：实现情绪测试功能（4个测试：健康分/孤独指数/社交能量/倦怠）。

**依赖**：MVP验证通过

**具体任务**：
1. 创建4个测试题库
2. 实现测试流程页面
3. 实现结果计算和文案生成
4. 实现分享卡片生成
5. 数据写入memory-body

---

### T18：晨间/晚间仪式（P2）

**目标**：实现日常仪式功能（数据采集入口）。

**依赖**：T7完成

**具体任务**：
1. 实现晨间仪式页面（定基调）
2. 实现晚间仪式页面（回顾今天）
3. 数据写入memory-body

---

### T19：情绪年轮（P2）

**目标**：实现情绪年轮可视化（长期价值）。

**依赖**：T7完成

**具体任务**：
1. 实现年轮可视化组件
2. 实现年度情绪报告
3. 实现情绪故事月报

---

## 五、第三阶段任务（规模化）

### T20：晚安交换（P3）

**目标**：实现晚安交换匹配功能。

**依赖**：T8完成，用户量 > 500

---

### T21：情绪伙伴（P3）

**目标**：实现匿名笔友匹配功能。

**依赖**：T8完成，用户量 > 500

---

### T22：深夜电台（P3）

**目标**：实现深夜电台功能（音频内容）。

**依赖**：用户量 > 1000

---

### T23：咨询导流（P3）

**目标**：实现心理咨询精准导流（变现核心）。

**依赖**：用户量 > 1000，与咨询平台达成合作

**具体任务**：
1. 对接简单心理/壹心理API
2. 实现咨询师推荐算法
3. 实现导流追踪和分成结算
4. 实现导流触发条件（连续3天低落等）

---

### T24：会员付费系统（P3）

**目标**：实现会员订阅功能。

**依赖**：用户量 > 1000

---

### T25：B端EAP（P3）

**目标**：实现企业员工援助计划后台。

**依赖**：与B端客户达成合作

---

## 六、开发规范

### 6.1 分支策略

```
main          → 生产分支
develop       → 开发主分支
feature/T*    → 任务分支（如 feature/T0-project-setup）
hotfix/*      → 紧急修复分支
```

### 6.2 提交规范

```
<type>(<scope>): <subject>

feat(emergency): 实现急救流程状态机
fix(mood): 修复情绪记录保存失败
refactor(memory-body): 重构存储适配器
test(treehole): 添加树洞发帖测试
docs(plan): 更新开发计划
```

### 6.3 代码规范

- TypeScript 严格模式
- ESLint + Prettier 强制
- 函数复杂度 < 15
- 文件行数 < 300
- 测试覆盖率 > 80%

### 6.4 测试规范

每个任务必须包含：
- 单元测试（核心逻辑）
- 集成测试（API调用）
- 端到端测试（关键流程）

### 6.5 任务完成标准

每个任务完成需满足：
1. 代码通过 lint + typecheck
2. 单元测试通过
3. 功能验收标准达成
4. 更新项目记忆
5. 更新看板
6. 提交 PR（或合并到 develop）

---

## 七、风险和应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 小程序包大小超限 | 中 | 高 | 分包加载+资源压缩 |
| memory-body迁移复杂度 | 中 | 高 | 优先迁移核心模块，非核心延后 |
| 微信订阅消息限制 | 高 | 中 | 设计多重提醒机制，不依赖单一通道 |
| 高危关键词遗漏 | 低 | 极高 | 持续更新关键词库+用户举报机制 |
| Supabase免费额度限制 | 中 | 中 | 监控用量，准备迁移方案 |
| 3周工期紧张 | 高 | 中 | 严格按优先级开发，P1可延后 |

---

## 八、执行检查清单

### MVP发布前必须完成

- [ ] T0 项目基础搭建
- [ ] T1 memory-body数据层迁移
- [ ] T2 微信登录认证
- [ ] T3 急救箱-入口和状态机
- [ ] T4 5条急救流程实现
- [ ] T5 高危检测和安全机制
- [ ] T6 呼吸动画+白噪音组件
- [ ] T7 情绪记录3秒打卡
- [ ] T8 树洞基础版
- [ ] T9 情绪风险日历基础版
- [ ] T10 AI主动引擎基础版
- [ ] T11 第二天跟进推送
- [ ] T12 个人中心
- [ ] T13 分包优化和性能调优
- [ ] T14 联调测试和发布准备

### MVP发布前必须验证

- [ ] 所有P0功能可用
- [ ] 高危检测100%覆盖
- [ ] 数据加密生效
- [ ] 离线模式可用
- [ ] 包大小符合要求
- [ ] 通过微信审核
- [ ] 隐私政策上线
- [ ] 用户协议上线

---

## 附录：技术栈清单

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Taro | 3.x |
| UI | React | 19 |
| 语言 | TypeScript | 5.x |
| 状态管理 | Zustand | 4.x |
| 后端 | Supabase | latest |
| 样式 | Sass | latest |
| 测试 | Vitest | latest |
| Lint | ESLint | latest |
| 格式化 | Prettier | latest |
| 图表 | ECharts for Taro | latest |
| 加密 | crypto-js | latest |
