# 星寰海小程序 - 项目状态

## 当前阶段: Phase 1.5 — 宠物 v2.0 AI深度融合（设计完成，待编码）

### 最后更新: 2026-07-23

### PRD版本: v4.0 (2026-07-23)
### 技术设计版本: v4.0 (2026-07-23)
### 设计规格: 宠物方向v2.0-设计规格.md (2026-07-23)

---

## 产品定位

**星寰海 — 以AI对话为唯一交互入口、memory-body记忆引擎为核心壁垒的"有记忆的AI宠物管家"。宠物向+职业向在一个小程序内分两个独立分包，职业向推迟到Phase 3。**

---

## v4.0 架构重构摘要（2026-07-23）

### 重大设计决策

1. **单小程序 + 双入口 + 分包**：宠物(pagesPet)和职业(pagesCareer)在一个小程序，首页分发
2. **AI对话为唯一交互入口**：用户不找功能菜单，只和AI聊天，AI分发到引擎层
3. **Guard双守卫**：规则Guard(0成本) + AI Guard(~0.0005元/次) 防守对话安全
4. **五大引擎**：健康引擎/时光引擎/家庭引擎/取名引擎/对话引擎
5. **职向推迟**：职业方向推迟到Phase 3，Phase 1.5及Phase 2聚焦宠物方向

### 新增模块（待开发）

| 模块 | 核心能力 | AI集成 |
|------|---------|--------|
| AI对话层 | 唯一用户入口，意图识别+分发 | DeepSeek/GLM-4 |
| Guard双守卫 | 规则+AI语义双保险 | 分类模型 |
| 宠物家庭 | family/member/lineage/看板/日历 | AI取名/周报 |
| 取名引擎 | 解读模式+推荐模式 | AI五行/星象/诗词解读 |
| 时光引擎 | 时间线/回忆录/里程碑/旧时光 | AI描述/避伤心 |

### 新增数据库表（6张）

pet_families, pet_family_members, pet_lineage, pet_moments, pet_milestones, pet_names

---

## 当前质量指标

| 指标 | 数值 |
|------|------|
| TypeScript 错误 | **0** |
| 测试文件 | **80** |
| 测试用例 | **1538** |
| 构建状态 | ✅ 成功 (22.42s) |
| 测试通过率 | **100%** |
| 主包体积 | **661 KB** (限制 2048KB，占 32.3%) |
| pagesPet 分包 | **972 KB** (限制 2048KB) |
| pagesUser 分包 | **96 KB** (限制 2048KB) |
| console.*残留 | **0** (仅logger模块内部) |
| 死代码 | **0** (无debugger/@ts-ignore/空catch) |

---

## 构建体积优化记录（2026-07-21）

### 优化前 vs 优化后

| 包 | 优化前 | 优化后 | 变化 |
|---|---|---|---|
| 主包 | 1367 KB | 661 KB | **-706 KB (-51.7%)** |
| pagesPet | 382 KB | 972 KB | +590 KB (含pdf-libs) |
| pagesUser | 96 KB | 96 KB | 不变 |

### 优化措施

1. **CryptoJS 按需引入**：`import CryptoJS from 'crypto-js'` → `import AES from 'crypto-js/aes'` + `import SHA256 from 'crypto-js/sha256'` + `import Utf8 from 'crypto-js/enc-utf8'` + `import Base64 from 'crypto-js/enc-base64'`
   - crypto-core.js: 18KB（仅 AES + SHA256 + enc）
   - 注意：7157.js (118KB) 仍包含 CryptoJS cipher-core 的 legacy ciphers 依赖链（DES/TripleDES/RC4/Rabbit），这是 CryptoJS 内部模块设计导致的，无法通过 tree-shake 消除。后续可考虑替换为更轻量的加密库（tweetnacl 或 Web Crypto API）

2. **PDF 生成功能移到分包**：
   - 从 `reportService.ts` 分离 PDF 功能到 `pagesPet/services/healthReportPdfService.ts`
   - jspdf + html2canvas + pako 打包为 `pagesPet/pdf-libs.js` (681KB)
   - 主包不再包含 PDF 相关依赖

3. **splitChunks 配置优化**：
   - `pdfLibs` cacheGroup: 匹配 jspdf/html2canvas/pako，输出到 `pagesPet/pdf-libs`
   - `cryptoCore` cacheGroup: 匹配 crypto-js，输出为独立 chunk

---

## 技术栈

- **框架**: Taro 3 + React 17 + TypeScript (strict)
- **构建**: Webpack (Taro内置)
- **状态管理**: Zustand
- **样式**: Sass + CSS Modules
- **后端**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **记忆引擎**: memory-body（5层架构，精简为宠物健康类型）
- **AI策略**: MVP纯规则引擎（0成本），后续小模型→大模型
- **推送**: 微信订阅消息
- **宠物形象**: Seedream API (环境变量驱动，自动stub回退)
- **测试**: Vitest + jsdom

---

## 已实现模块（PRD v3.1 匹配）

### 引擎层
- [x] PetSafetyHandler 安全拦截器（P0）
- [x] ToxicFoodFilter 有毒食物过滤
- [x] MedicalDisclaimer 医疗免责声明
- [x] expressionEngine 宠物表情引擎
- [x] svgRenderer SVG面部渲染
- [x] diaryEngine 日记模板引擎
- [x] seedreamAdapter Seedream图片适配器（环境变量驱动，自动stub回退）
- [x] emotion 哀伤陪伴引擎（自包含，仅保留宠物哀伤场景）

### 数据层
- [x] data/petKnowledge/breeds.ts 品种数据
- [x] data/petKnowledge/foodSafety.ts 食物安全数据
- [x] data/petKnowledge/symptoms.ts 症状数据
- [x] data/petKnowledge/vaccineSchedule.ts 疫苗排程数据
- [x] data/petKnowledge/urgencyRules.ts 紧急规则数据

### 页面层
- [x] pages/index/ 首页
- [x] pages/login/ 登录页
- [x] pages/mine/ 我的页面
- [x] pages/profile/ 个人资料
- [x] pages/settings/ 设置页面
- [x] pages/agreement/ 用户协议
- [x] pages/onboarding/ 引导页
- [x] pages/member/ 会员页面
- [x] pagesPet/checkin/ 3秒健康打卡
- [x] pagesPet/food-query/ 食物安全查询
- [x] pagesPet/symptom-check/ AI症状初筛
- [x] pagesPet/trends/ 健康趋势图
- [x] pagesPet/vaccine/ 疫苗驱虫日历
- [x] pagesPet/breed/ 品种百科
- [x] pagesPet/profile/ 宠物档案
- [x] pagesPet/profile/add/ 添加宠物
- [x] pagesPet/profile/edit/ 编辑宠物

### Store层
- [x] petStore 宠物状态管理
- [x] checkinStore 打卡状态管理
- [x] foodQueryStore 食物查询状态管理
- [x] symptomStore 症状初筛状态管理
- [x] trendStore 健康趋势状态管理
- [x] vaccineStore 疫苗日历状态管理
- [x] membershipStore 会员状态管理
- [x] authStore 认证状态管理
- [x] subscribeStore 订阅状态管理
- [x] settingsStore 设置状态管理
- [x] reminderStore 提醒状态管理
- [x] cloudSyncStore 云同步状态管理

### Service层
- [x] petService 宠物服务
- [x] checkinService 打卡服务
- [x] foodService 食物查询服务
- [x] symptomService 症状初筛服务
- [x] trendService 健康趋势服务
- [x] vaccineService 疫苗日历服务
- [x] membershipService 会员服务
- [x] subscribeService 订阅服务
- [x] notificationService 通知服务
- [x] reminderService 提醒服务
- [x] reportService 健康报告服务（纯文本功能）
- [x] healthReportPdfService PDF报告服务（分包专用）
- [x] authService 认证服务
- [x] syncService 同步服务
- [x] syncHelper 同步辅助
- [x] supabaseClient Supabase客户端
- [x] api HTTP请求封装
- [x] shareService 分享服务
- [x] npsService NPS服务
- [x] dataPrivacyService 数据隐私服务
- [x] frequencyControlService 频率控制服务
- [x] avatarService 宠物头像服务

### Hook层
- [x] usePet 宠物Hook
- [x] useCheckin 打卡Hook
- [x] useFoodQuery 食物查询Hook
- [x] useSymptom 症状初筛Hook
- [x] useTrend 健康趋势Hook
- [x] useVaccine 疫苗日历Hook
- [x] useReminder 提醒Hook
- [x] useAuth 认证Hook
- [x] useUserStats 用户统计Hook
- [x] useMembership 会员Hook

### 组件层
- [x] PetAvatar 宠物头像（表情+日记）
- [x] AchievementCard 成就卡片
- [x] PaywallPopup 付费墙弹窗
- [x] UsageCounter 用量计数器
- [x] PlanSelector 套餐选择器
- [x] PetCard 宠物卡片
- [x] PetSwitcher 宠物切换器
- [x] PetDeceasedModal 宠物离世弹窗
- [x] PrivacyPopup 隐私弹窗
- [x] PageError 错误页面
- [x] PageLoading 加载页面
- [x] AccountDeletionConfirm 账号注销确认
- [x] HealthReportPreview 健康报告预览
- [x] FoodShareCard 食物分享卡片
- [x] AnomalyMarker 异常标记
- [x] GriefCompanion 哀伤伤陪伴（自包含，不依赖EmotionEngine）
- [x] FloatingNav 浮动导航
- [x] NpsSurvey NPS调查
- [x] VaccineCalendar 疫苗日历
- [x] VaccineAddModal 疫苗添加弹窗
- [x] VaccineRecordCard 疫苗记录卡片
- [x] HealthTrendShareCard 健康趋势分享卡片
- [x] VaccineShareCard 疫苗分享卡片

### Utils层
- [x] storage 存储封装（加密/解密/敏感key检测）
- [x] crypto 加密工具（AES + SHA256，按需引入crypto-js子模块）
- [x] jwt JWT解析工具
- [x] pdfGenerator PDF生成
- [x] usageTracking 行为计数工具（食物查询/症状初筛计数）

### Logger层
- [x] logger 日志模块（debug/info/warn/error）

---

## 旧方向代码清理记录（2026-07-21 完成）

### 已删除文件（30+）
- 5 memory-body adapters: emotionIndexAdapter, crisisSafetyNetAdapter, outreachCoordinatorAdapter, interventionTrackerAdapter, patternDiscoveryAdapter
- 11 memory-body core: memoryEvolution, memoryRetrieval, memoryIngestor, promptContextComposer, memoryBodyConfig, memoryBodyGuards, memoryGraph, contradictionDetector, sensitiveMemoryClassifier, forbiddenMemoryFilter, memoryFeedback, memoryDecay
- 1 memory-body test: MemoryBodyHealth.test.ts
- 1 memory-body safety: memoryPrivacyGuard.ts
- 9 emotion files: emotionStore.ts, emotionStore.test.ts, EmotionResponseCard.tsx, EmotionResponseCard.scss, EmotionEngine.ts, EmotionEngine.test.ts, emotion/index.ts, emotionScenes.ts, emotionScenes.test.ts
- 2 moodHelper files: moodHelper.ts, moodHelper.test.ts
- 1 types file: emotionTypes.ts

### 术语替换（P1-P3 全部完成）
- login/index.tsx: "情绪急救箱"→"宠物健康守护", "3秒情绪打卡"→"3秒健康打卡", "情绪急救箱"→"健康急救指南", "深夜树洞"→"深夜陪伴"
- subscribeService.ts: "干预任务提醒"→"护理任务提醒", "3天拆解干预每日任务提醒"→"3天护理计划每日任务提醒", "情绪打卡提醒"→"健康打卡提醒", "定时情绪记录提醒"→"定时健康记录提醒"
- 常量重命名: INTERVENTION_REMINDER_TEMPLATE_ID→CARE_PLAN_REMINDER_TEMPLATE_ID, MOOD_CHECKIN_TEMPLATE_ID→HEALTH_CHECKIN_TEMPLATE_ID, requestInterventionSubscribe→requestCarePlanSubscribe
- notificationService.ts: mood→healthStatus, interventionPlanId→carePlanId, sendInterventionReminder→sendCarePlanReminder
- AccountDeletionConfirm.tsx: "情绪记录等"→"行为记录等"
- app.config.ts: mood.png→health.png, mood-active.png→health-active.png
- symptoms.ts: "情绪变化"→"行为变化"
- global.scss/app.scss: 移除6个legacy emotion颜色变量
- storage.ts: 移除9个legacy敏感key模式

### 页面重构
- checkin/index.tsx: 移除emotionStore/EmotionResponseCard依赖
- food-query/index.tsx: 替换emotionStore为usageTracking
- symptom-check/index.tsx: 替换emotionStore为usageTracking
- index/index.tsx: 移除useEmotionStore/EmotionResponseCard/情绪干预逻辑
- GriefCompanion.tsx: 自包含实现，内联哀伤关键词匹配逻辑

### 类型清理
- memoryBodyTypes.ts: 移除28个legacy类型，保留20+宠物健康类型
- avatarTypes.ts: style类型从'q_cute'/'japanese_healing'/'american_cartoon'→'cartoon'/'realistic'

---

## 下一步行动

1. **Phase 1.5 宠物 v2.0 编码**：按实施计划逐任务开发（AI对话/Guard/家庭/取名/时光）
2. 后续优化: 替换 CryptoJS 为更轻量加密库（tweetnacl/Web Crypto API），可再减 ~118KB
3. 后端代理服务搭建: /api/share/grant-reward, /api/pet-avatar/generate, /api/subscribe/send
4. Supabase RLS 策略部署: 在 Supabase Dashboard 执行 init.sql
5. Phase 2（Phase 1.5验证后）：AI对话深化 + 家庭周报AI + 年度回忆 + 分享卡片
6. Phase 3（Phase 2验证后）：职业方向MVP

---

## Phase 1.5 真实服务集成记录（2026-07-21）

### 模块1: 数据库 Schema 重写
- 重写 `04-数据库/supabase/init.sql`：17张表 + RLS策略 + 存储桶 + 归属验证触发器
- 核心设计：`pet_profiles.id` 为 TEXT（前端生成），`users.id` 为 UUID（Supabase Auth）
- RLS 使用 `auth.uid() = user_id` 模式，所有用户数据表启用 RLS

### 模块2: Supabase Client 集成
- `supabaseClient.ts` 添加 camelCase ↔ snake_case 自动映射
- `syncService.ts` 修复字段映射（userId/syncedAt 改为 camelCase）
- `config/supabase.ts` 改进环境解析（开发环境自动启用 mock）
- 创建 `.env.example`（Phase 1.5 全部环境变量）

### 模块3: Seedream API 真实集成
- `seedreamAdapter.ts` 重写：真实 API 调用 + 自动 SVG stub 回退
- `avatarService.ts` 修复：移除硬编码 ID，使用真实 pet/user ID
- 环境变量驱动 stub 开关：`shouldUseStub = !(process.env.TARO_APP_API_BASE_URL)`

### 模块4: 微信订阅消息模板ID统一管理
- 创建 `constants/templateIds.ts`：4个模板ID集中管理，环境变量读取
- `subscribeService.ts`：移除本地模板ID定义，改为从 constants 导入
- `frequencyControlService.ts`：DEFAULT_RULES 引用 constants 常量（修复循环依赖）
- `reminderService.ts`：VACCINE_REMINDER_TEMPLATE_ID 改为从 constants 导入

### 安全审查修复（P0+P1）

**P0-1: JWT 签名验证缺失**
- `jwt.ts`：`verifyToken` 重命名为 `isTokenFormatValid`（仅本地过期检查），保留别名兼容
- 新增 `validateTokenWithServer`：通过 Supabase Auth API 真实验证 token
- `authGuard.ts`：新增 `requireAuthAsync`（服务端验证），`requireAuth` 保留本地快速检查

**P0-2: 奖励值无后端校验**
- `shareService.ts`：`grantShareReward` 改为调用后端代理 `/api/share/grant-reward`
- 移除直接向 Supabase 插入 reward_value 的代码

**P1-1: 加密盐值硬编码**
- `crypto.ts`：`APP_SALT` 改为从环境变量 `TARO_APP_CRYPTO_SALT` 读取，开发环境 fallback

**P1-2: Token 明文存储**
- `storage.ts`：`SENSITIVE_KEY_PATTERNS` 新增 `token`、`refresh_token`、`user`

**P1-3/P1-4: 宠物归属校验缺失**
- 新增 `utils/petOwnership.ts`：`requirePetOwnership` + `isPetOwnerLocal`
- `checkinService.ts`：createCheckin/getCheckins/getCheckinsByDateRange 添加归属校验
- `foodService.ts`：queryFood/getQueryHistory 添加归属校验
- `reportService.ts`：generateHealthReport 添加归属校验

---

## 安全审查记录（2026-07-21）

### P0 风险修复（6项，全部已修复）

1. **API请求传递userId可伪造** → 移除所有API请求中的userId参数，后端从JWT token提取
2. **Supabase RLS未配置** → 前端SupabaseClient已携带Authorization header，需在Supabase侧配置RLS策略 `user_id = auth.uid()`
3. **生产环境Mock模式回退** → supabase.ts添加生产环境硬禁用检查
4. **会员/订单接口userId可伪造** → membershipService移除所有API请求中的userId参数
5. **宠物数据归属校验** → petService API路径不含userId，后端从token提取
6. **支付回调userId验证** → confirmPayment移除userId参数，后端从token提取

### 新增安全模块

- `src/utils/authGuard.ts` — 统一认证守卫（getAuthenticatedUserId/requireAuth/isAuthenticated）
- `src/utils/__tests__/authGuard.test.ts` — 12个测试用例

### P1 风险修复

- SupabaseClient添加baseUrl/anonKey配置检查
- api.ts添加403状态码处理
- api.ts错误信息长度限制（<100字符），防止泄露内部堆栈
- authGuard catch块区分AuthenticationError和JSON解析错误

### 用户流程走查结果

- ✅ 路由完整性：18个页面全部注册，TabBar 4项配置正确
- ✅ 页面入口可达性：所有功能页面都有导航入口
- ✅ 功能闭环：8个核心流程完整
- ⚠️ 分享功能：vaccine/checkin页面已补充useShareAppMessage
- ✅ 错误处理：关键页面都有PageLoading/PageError
