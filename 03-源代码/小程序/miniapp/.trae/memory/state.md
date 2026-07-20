# 星寰海小程序 - 项目状态

## 当前阶段: Phase 1 AI宠物管家 MVP 开发中

### 最后更新: 2026-07-18

### PRD版本: v3.1 (2026-07-17)
### 技术设计版本: v3.1 (2026-07-17)

---

## 产品定位

**星寰海 — 以memory-body记忆引擎为核心壁垒，先做"有记忆的AI宠物管家"，后做"有记忆的AI职业顾问"，情绪感知作为底层能力融入双场景的微信小程序。**

---

## Phase 1 开发排期（14天 MVP）

| 天数 | 任务 | 交付物 | 依赖 | 代码状态 |
|------|------|--------|------|----------|
| Day 1-2 | PetSafetyHandler安全拦截器（P0阻断项） | 安全过滤引擎+测试用例 | 无 | ✅ 已有代码 |
| Day 3-4 | memory-body引擎扩展（PetHealthEntry） | 数据类型+存储+同步 | Day 2 | ✅ 已有代码 |
| Day 5-6 | 宠物档案（多宠管理） | 档案CRUD+品种关联 | Day 4 | ✅ 已有代码 |
| Day 7-8 | 3秒健康打卡+食物安全查询 | 打卡组件+知识库查询 | Day 6 | ✅ 已有代码 |
| Day 9-10 | AI症状初筛（规则引擎版） | 症状选择+评估+结果 | Day 8 | ✅ 已有代码 |
| Day 11 | 疫苗驱虫日历 | 日历组件+提醒 | Day 8 | ✅ 已有代码 |
| Day 12 | 健康趋势图+情绪底层 | 图表+场景触发 | Day 10 | ✅ 已有代码 |
| Day 13 | 会员体系+付费流程 | 权益+支付+限制 | Day 8 | ✅ M7已完成 |
| Day 14 | 集成测试+Bug修复+提交审核 | 测试报告+提审 | Day 13 | ✅ M7已完成 |

---

## 关键里程碑

- Day 2：安全拦截器就绪（P0解除）→ ✅ 已有代码
- Day 8：核心功能闭环（打卡+食物+症状）→ ✅ 已有代码
- Day 14：提审上线 → ✅ M7已完成

---

## 技术栈

- **框架**: Taro 3 + React 19 + TypeScript
- **构建**: Vite
- **状态管理**: Zustand
- **样式**: Tailwind CSS + CSS Modules + Sass
- **后端**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **记忆引擎**: memory-body（5层架构，18模块，70%复用自情绪项目）
- **AI策略**: MVP纯规则引擎（0成本），后续小模型→大模型
- **推送**: 微信订阅消息
- **宠物形象**: Seedream API
- **测试**: Vitest

---

## 已实现的新方向模块（PRD v3.1 匹配）

### 引擎层
- [x] PetSafetyHandler 安全拦截器（P0）
- [x] ToxicFoodFilter 有毒食物过滤
- [x] MedicalDisclaimer 医疗免责声明

### 数据层
- [x] data/petKnowledge/breeds.ts 品种数据
- [x] data/petKnowledge/foodSafety.ts 食物安全数据
- [x] data/petKnowledge/symptoms.ts 症状数据
- [x] data/petKnowledge/vaccineSchedule.ts 疫苗排程数据

### 页面层
- [x] pages/pet-checkin/ 3秒健康打卡
- [x] pages/pet-food-query/ 食物安全查询
- [x] pages/pet-profile/ 宠物档案
- [x] pages/pet-profile/add/ 添加宠物
- [x] pages/pet-symptom-check/ AI症状初筛
- [x] pages/pet-trends/ 健康趋势图
- [x] pages/pet-vaccine/ 疫苗驱虫日历

### Store层
- [x] petStore 宠物状态管理
- [x] checkinStore 打卡状态管理
- [x] foodQueryStore 食物查询状态管理
- [x] symptomStore 症状初筛状态管理
- [x] trendStore 健康趋势状态管理
- [x] vaccineStore 疫苗日历状态管理

### Service层
- [x] petService 宠物服务
- [x] checkinService 打卡服务
- [x] foodService 食物查询服务
- [x] symptomService 症状初筛服务
- [x] trendService 健康趋势服务
- [x] vaccineService 疫苗日历服务
- [x] quotaManager 配额管理
- [x] subscribeService 订阅服务

### Hook层
- [x] usePet 宠物Hook
- [x] useCheckin 打卡Hook
- [x] useFoodQuery 食物查询Hook
- [x] useSymptom 症状初筛Hook
- [x] useTrend 健康趋势Hook
- [x] useVaccine 疫苗日历Hook
- [x] useReminder 提醒Hook

### 组件层
- [x] VaccineCalendar 疫苗日历组件
- [x] VaccineAddModal 疫苗添加弹窗
- [x] VaccineRecordCard 疫苗记录卡片
- [x] PetCard 宠物卡片
- [x] PetSwitcher 宠物切换器
- [x] PetDeceasedModal 宠物离世弹窗
- [x] PaywallPopup 付费墙弹窗

### 测试层
- [x] services/__tests__/ 新方向服务测试
- [x] stores/__tests__/ 新方向Store测试
- [x] engines/petSafety/PetSafetyHandler.test.ts

### memory-body适配器
- [x] vaccineTrackerAdapter 疫苗追踪适配器

---

## 旧方向代码（PRD v3.1 已废弃/降级，待清理）

### 已废弃（暂不开发）
- engines/emergency/ EmergencyEngine（降级为底层能力，非独立入口）
- engines/outreach/ Day3InterventionEngine, OutreachScheduler, ProactiveEngine
- engines/analysis/EmotionYearRingEngine
- engines/ritual/DailyRitualEngine
- engines/test/EmotionTestEngine（情绪测试暂不开发）
- pages/emergency/ 紧急页面
- pages/mood/ 情绪页面
- pages/calendar/ 情绪日历页面
- pages/ritual/ 仪式页面
- pages/test/ 情绪测试页面
- pages/treehole/ 树洞页面（暂不开发）
- stores/emergencyStore, moodStore, outreachStore, scheduleStore, treeholeStore
- services/emergencyService, moodService, outreachService, treeholeService
- hooks/useEmergency, useMood, useOutreach, useCrisisDetection, useDailyRitual, useDay3Intervention, useEmotionTest, useEmotionYearRing, useFollowup, usePersonalizedMemory
- components/ 旧组件: CrisisAlert, EmergencyAlert, EmergencyStep*, EmotionCalendar, DayDetailModal, MonthlySummary, MoodSelector, IntensitySlider, Treehole*, WhiteNoisePlayer, BreathingAnimation, ContextTagSelector, FloatingNav, AIFeedbackPopup
- data/ 旧数据: crisisKeywords, emergencyFlows, emotionScenes, emotionTests, moodTags, outreachSuggestions, urgencyRules, whiteNoiseTracks

### 降级为底层能力（保留但非独立入口）
- EmergencyEngine → 情绪急救箱降级为底层能力，融入场景触发
- 情绪感知能力 → 隐形化，不出现在功能列表和Tab Bar中

---

## M7 完成记录（2026-07-18）

- M7-1: 会员体系数据层 - membershipService.ts, membershipStore.ts, useMembership.ts
- M7-2: 会员页面+权益对比+支付流程 - PlanSelector.tsx, UsageCounter.tsx, member/index.tsx, mine/index.tsx
- M7-3: 首页重写+引导页+TabBar更新 - index/index.tsx重写, onboarding/index.tsx, app.config.ts TabBar, pet-profile移除FloatingNav
- M7-4: 配额管理集成 - quotaManager升级会员感知, PaywallPopup连接会员页, food-query/symptom-check/trends集成PaywallPopup
- M7-5: 集成测试 - membershipService.test.ts(29用例), quotaManager.test.ts更新(12用例), 全部通过
- 新增文件: 15个, 修改文件: 8个
- TypeScript编译: M7相关文件零错误
- 测试: 41个用例全部通过

---

## 下一步行动

1. M8: 最终集成测试+Bug修复+提交审核
2. 验证完整用户流程
3. 清理旧方向代码（删除或归档）
4. 提交微信小程序审核
