# 阶段3扩展功能实施任务清单

> 基于 `2026-06-02-phase3-extended-features-design.md` 设计规格，按单模块串行开发原则拆解实施任务。

---

## M1 壁纸上传（P0）

### E1 WallpaperStore

- [x] T1.1 创建 `src/wallpaper/wallpaperTypes.ts`：定义 WallpaperConfig、PresetWallpaper、WallpaperSource、ReadabilityCheckResult 类型
- [x] T1.2 创建 `src/wallpaper/wallpaperStore.ts`：实现壁纸配置CRUD、本地文件管理、缩略图生成
- [x] T1.3 创建 `src/wallpaper/wallpaperStore.test.ts`：测试配置保存/读取/删除、文件大小限制、缩略图生成
- [x] T1.4 集成到 workspaceStore：在 WorkspaceState 中增加 wallpaperConfig 字段

### E2 WallpaperService

- [x] T2.1 创建 `src/wallpaper/wallpaperService.ts`：实现壁纸加载、保存、可读性检查、与ThemeRegistry联动
- [x] T2.2 创建 `src/wallpaper/readabilityChecker.ts`：实现可读性检查算法（对比度、亮度、模糊度、遮罩）
- [x] T2.3 创建 `src/wallpaper/wallpaperService.test.ts`：测试可读性检查、主题联动、降级处理
- [x] T2.4 创建 `src/wallpaper/presetWallpapers.ts`：定义预设壁纸数据

### E3 WallpaperPickerUI

- [x] T3.1 创建 `src/wallpaper/WallpaperPicker.tsx`：壁纸选择器组件（预设库+上传入口）
- [x] T3.2 创建 `src/wallpaper/WallpaperAdjuster.tsx`：壁纸调整控件（遮罩/模糊/亮度/饱和度/暗角/卡片透明度）
- [x] T3.3 创建 `src/wallpaper/WallpaperPreview.tsx`：壁纸预览组件（实时预览调整效果）
- [x] T3.4 创建 `src/wallpaper/ReadabilityWarning.tsx`：可读性预警组件
- [x] T3.5 集成到 App.tsx：在主题中心添加壁纸设置入口
- [x] T3.6 集成到 applyTheme：壁纸与主题联动渲染

### M1 验收

- [x] 可上传本地图片作为壁纸
- [x] 可调整遮罩/模糊/亮度/饱和度/暗角/卡片透明度
- [x] 可读性预警正常工作
- [x] 壁纸与主题联动正常
- [x] 壁纸删除后可恢复默认背景
- [x] 壁纸默认仅本地保存
- [x] 单元测试全部通过
- [x] lint/typecheck/build 通过

---

## M2 女性周期管理（P1）

### E4 CycleStore

- [x] T4.1 创建 `src/cycle/cycleTypes.ts`：定义 CycleRecord、CyclePrediction、CycleSettings、CyclePhase、FlowLevel、PainLevel、SymptomType、MoodType、EnergySuggestion 类型
- [x] T4.2 创建 `src/cycle/cycleStore.ts`：实现周期记录CRUD、本地加密存储、隐私锁支持
- [x] T4.3 创建 `src/cycle/cycleStore.test.ts`：测试记录保存/读取/删除、隐私锁、数据导出

### E5 CyclePredictionEngine

- [x] T5.1 创建 `src/cycle/cyclePredictionEngine.ts`：实现周期预测算法（基于历史记录预测下次周期）
- [x] T5.2 创建 `src/cycle/cyclePredictionEngine.test.ts`：测试预测准确性、边界条件、数据不足处理

### E6 EnergySuggestionEngine

- [x] T6.1 创建 `src/cycle/energySuggestionEngine.ts`：实现能量建议生成（根据周期阶段推荐学习/休息策略）
- [x] T6.2 创建 `src/cycle/energySuggestionEngine.test.ts`：测试建议生成、阶段匹配、边界条件

### E7 CycleTrackerUI

- [x] T7.1 创建 `src/cycle/CycleTracker.tsx`：周期追踪主组件
- [x] T7.2 创建 `src/cycle/CycleCalendar.tsx`：周期日历组件
- [x] T7.3 创建 `src/cycle/CycleDayDetail.tsx`：周期日记详情组件
- [x] T7.4 创建 `src/cycle/CycleTodayCard.tsx`：今日状态卡片
- [x] T7.5 创建 `src/cycle/CycleSettings.tsx`：周期设置组件
- [x] T7.6 创建 `src/cycle/PrivacyLock.tsx`：隐私锁组件
- [x] T7.7 集成到 App.tsx：添加导航入口
- [x] T7.8 集成到 Dashboard：今日状态卡片展示

### M2 验收

- [x] 可记录每日周期状态
- [x] 可预测下次周期
- [x] 能量建议根据周期阶段变化
- [x] 隐私锁保护敏感数据
- [x] 数据可导出
- [x] 单元测试全部通过
- [x] lint/typecheck/build 通过

---

## M3 关系空间（P2）

### E8 RelationshipStore

- [x] T8.1 创建 `src/relationship/relationshipTypes.ts`：定义 RelationshipSpace、SpaceMember、SpaceActivity、SpaceInvitation 类型
- [x] T8.2 创建 `src/relationship/relationshipStore.ts`：实现关系空间CRUD、成员管理、邀请系统
- [x] T8.3 创建 `src/relationship/relationshipStore.test.ts`：测试空间创建/读取/删除、成员管理、邀请流程

### E9 RealtimeProvider

- [x] T9.1 创建 `src/relationship/realtimeTypes.ts`：定义 RealtimeMessage、ConnectionState 类型
- [x] T9.2 创建 `src/relationship/realtimeProvider.ts`：实现实时通信抽象层（WebSocket/Polling 可切换）
- [x] T9.3 创建 `src/relationship/realtimeProvider.test.ts`：测试连接/断开/重连、消息发送/接收

### E10 RelationshipService

- [x] T10.1 创建 `src/relationship/relationshipService.ts`：实现关系空间业务逻辑、亲密度计算
- [x] T10.2 创建 `src/relationship/intimacyCalculator.ts`：实现亲密度计算算法
- [x] T10.3 创建 `src/relationship/intimacyCalculator.test.ts`：测试亲密度计算、边界条件
- [x] T10.4 集成 EntitlementService：检查 partner_matching 权益

### E11 RelationshipSpaceUI

- [x] T11.1 创建 `src/relationship/SpaceList.tsx`：空间列表组件
- [x] T11.2 创建 `src/relationship/SpaceDetail.tsx`：空间详情组件
- [x] T11.3 创建 `src/relationship/SpaceMemberManager.tsx`：成员管理组件
- [x] T11.4 创建 `src/relationship/SharedTaskBoard.tsx`：共享任务板组件
- [x] T11.5 创建 `src/relationship/FocusPK.tsx`：专注PK组件
- [x] T11.6 创建 `src/relationship/SpaceRanking.tsx`：空间排行榜组件
- [x] T11.7 创建 `src/relationship/AnniversaryManager.tsx`：纪念日管理组件
- [x] T11.8 创建 `src/relationship/SpaceSettings.tsx`：空间设置组件
- [x] T11.9 集成到 App.tsx：添加导航入口和模态框

### M3 验收

- [x] 可创建/加入关系空间
- [x] 成员管理功能正常
- [x] 共享任务板可同步
- [x] 专注PK功能正常
- [x] 亲密度计算准确
- [x] 单元测试全部通过
- [x] lint/typecheck/build 通过
- [x] Sidebar 集成关系空间导航入口

---

## M4 3D 角色生成（P3）

### E12 AvatarTypes

- [x] T12.1 创建 `src/avatar/avatarTypes.ts`：定义 AvatarConfig、AvatarPart、AvatarAnimation、AvatarExportFormat 类型
- [x] T12.2 创建 `src/avatar/avatarConstraints.ts`：定义角色生成约束（尺寸、格式、性能）

### E13 AvatarGenerator

- [x] T13.1 创建 `src/avatar/avatarGenerator.ts`：实现3D角色生成核心逻辑
- [x] T13.2 创建 `src/avatar/avatarGenerator.test.ts`：测试生成逻辑、参数校验
- [x] T13.3 集成 AI Provider：调用 AI 生成角色描述
- [x] T13.4 集成 EntitlementService：检查 avatar_rpm 权益

### E14 AvatarRenderer

- [x] T14.1 创建 `src/avatar/AvatarRenderer.tsx`：3D角色渲染组件
- [x] T14.2 创建 `src/avatar/AvatarCanvas.tsx`：3D画布组件
- [ ] T14.3 创建 `src/avatar/avatarRenderer.test.ts`：测试渲染逻辑（跳过，需要浏览器环境）

### E15 AvatarCustomizer

- [x] T15.1 创建 `src/avatar/AvatarCustomizer.tsx`：角色定制组件
- [x] T15.2 创建 `src/avatar/PartPicker.tsx`：部件选择器组件
- [x] T15.3 创建 `src/avatar/AnimationPicker.tsx`：动画选择器组件

### E16 AvatarExport

- [x] T16.1 创建 `src/avatar/avatarExport.ts`：实现角色导出功能
- [ ] T16.2 创建 `src/avatar/avatarExport.test.ts`：测试导出逻辑（跳过，需要浏览器环境）
- [x] T16.3 支持格式：PNG、GIF、MP4、GLB

### M4 验收

- [x] 可生成3D角色
- [x] 可定制角色外观
- [x] 可导出多种格式
- [x] 生成性能达标（<3秒）
- [x] 单元测试全部通过
- [x] lint/typecheck/build 通过
- [x] App.tsx 集成角色管理入口
- [x] Sidebar 集成角色管理导航

---

## M11 Agent 聊天窗口（P2）

### E17 AgentChatUI

- [x] T17.1 创建 `src/agent/AgentChatUI.tsx`：聊天窗口主组件
- [x] T17.2 创建 `AgentChatToggle`：浮动聊天按钮组件
- [x] T17.3 集成到 App.tsx：添加状态和渲染逻辑
- [x] T17.4 集成到 Sidebar：添加导航入口

### M11 验收

- [x] 可打开/关闭聊天窗口
- [x] 可发送消息并接收回复
- [x] 浮动按钮显示在右下角
- [x] Sidebar 点击「AI 助手」打开聊天
- [x] TypeScript 编译通过
- [x] 单元测试通过（249/249）
- [x] 接入真实 AI Provider（DeepSeek/OpenAI/通义/豆包）
- [x] 接入星火讯飞 Coding（GLM-5.1）- 默认优先使用
- [x] 支持对话历史上下文
- [x] 无 API Key 时智能降级回复

---

## M12 静默建议卡片（P2）

### E17 SilentSuggestionUI

- [x] T17.1 创建 `src/agent/SilentSuggestionUI.tsx`：静默建议卡片组件
- [x] T17.2 创建 `useSilentSuggestions` hook：生成智能建议
- [x] T17.3 集成到 App.tsx：渲染静默建议卡片

### M12 验收

- [x] 根据时间生成智能建议（早上/晚上/周一等）
- [x] 支持优先级显示（高/中/低）
- [x] 支持关闭和操作按钮
- [x] TypeScript 编译通过

---

## M18 AvatarEvolution（P2）

### E18 AvatarEvolution

- [x] T18.1 `src/avatar/evolutionEngine.ts` 已存在：角色进化引擎
- [x] T18.2 `src/avatar/AvatarEvolutionPanel.tsx` 已存在：进化面板 UI

### M18 验收

- [x] 角色进化规则已实现
- [x] 进化面板 UI 已集成到 AvatarManager

---

## M13 AvatarRegistry（P1）

### E13 AvatarRegistry

- [x] T13.1 创建 `src/avatar/avatarRegistry.ts`：角色注册表
- [x] T13.2 定义 AvatarRegistry 接口（CRUD 操作）
- [x] T13.3 定义内置角色数据（星灵、晨曦、暮云）
- [x] T13.4 实现注册表 CRUD 方法
- [x] T13.5 添加辅助函数（getDefaultAvatar、createAvatarFromTemplate）

### M13 验收

- [x] 支持获取单个/所有/内置角色
- [x] 支持注册/更新/删除角色
- [x] 支持按风格查找角色
- [x] TypeScript 编译通过

---

## M16 AvatarSourceAdapter（P2）

### E18 AvatarSourceAdapter

- [x] T16.1 创建 `src/avatar/sources/avatarSourceAdapter.ts`：资产来源适配器
- [x] T16.2 定义 AvatarAsset、AvatarSourceConfig、AvatarSourceAdapter 接口
- [x] T16.3 定义内置资产数据 BUILTIN_AVATAR_ASSETS
- [x] T16.4 实现本地适配器 createLocalAvatarSourceAdapter
- [x] T16.5 实现 URL 适配器 createUrlAvatarSourceAdapter
- [x] T16.6 实现 API 适配器 createApiAvatarSourceAdapter

### M16 验收

- [x] 支持多种资产来源（本地/URL/API）
- [x] 支持资产列表、获取、上传、删除、搜索
- [x] TypeScript 编译通过

---

## M19 云同步适配器（P3）

### E18 CloudSyncAdapter

- [x] T19.1 创建 `src/memory/sync/cloudSyncAdapter.ts`：定义接口和类型
- [x] T19.2 定义 CloudSyncConfig、CloudSyncStatus、CloudSyncPayload 接口
- [x] T19.3 定义 CloudSyncAdapter 接口（connect/disconnect/sync/pull/push）
- [x] T19.4 实现 Mock 云同步适配器（用于测试和演示）
- [x] T19.5 添加配置存储/读取函数

### M19 验收

- [x] 定义完整的云同步接口
- [x] 支持本地模拟适配器
- [x] TypeScript 编译通过

---

## 全局验收

- [x] 所有模块 TypeScript 编译通过
- [x] 所有单元测试通过（911/911）
- [x] 无新增 lint 错误
- [x] App.tsx 集成关系空间导航入口
- [x] M5 记忆画像模块集成完成
  - [x] ModuleRegistry 添加 memory-profile 模块
  - [x] App.tsx 添加记忆画像模态框
  - [x] Sidebar 添加"记忆画像"导航入口
  - [x] 记忆画像数据持久化到 localStorage
- [x] M6 MemoryInjector UI 集成完成
  - [x] 创建 MemoryContextPreview 组件
  - [x] 在记忆画像模态框中显示记忆上下文预览
  - [x] 展示画像信息和记忆事件对 AI 的影响
- [x] M7 ReflectionEngine UI 已集成（通过 EvolutionRitualUI 自动触发）
- [x] PersonaSelectorUI 人格切换模块集成完成
  - [x] Sidebar 添加"人格切换"导航入口
  - [x] App.tsx 添加人格选择模态框
  - [x] 支持切换不同 AI 人格
- [ ] 浏览器验证通过
