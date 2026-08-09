# 宠物换装功能(衣橱) - 设计规格

> ⚠️ **已砍（2026-08）**：该功能因产品范围调整被移除，本文件仅作历史归档，不再实施。

> 版本: v1.0 | 日期: 2026-07-24 | 状态: 待实施

## 一、需求概述

为星寰海 AI 宠物管家小程序新增宠物换装(衣橱)功能,采用**混合方案**:
- **SVG 饰品叠加**:5槽位(头/颈/背/身/足),40-60件预设饰品,即时切换,全用户免费
- **AI 主题套装生成**:8-12个节日主题,AI生成带服装整体形象,会员专属,按次扣费

### 获取方式
- 默认解锁(8件)
- 成就解锁(8件,与现有 AchievementCard 联动)
- 付费购买(12件,接入微信支付)
- 会员专属(12件,与 useMembership 联动)

### 架构方案
新建独立 `pagesPet/wardrobe` 页面,从 pet-profile 入口跳转。

---

## 二、七层架构映射

```
表现层 (UI)
  pagesPet/wardrobe/index.tsx          衣橱主页(容器,3 Tab 切换)
  pagesPet/wardrobe/index.scss
  components/Wardrobe/
    ├── OutfitPreview.tsx              5槽位实时叠加预览+触摸交互
    ├── AccessoryPicker.tsx            饰品选择栏(按槽位Tab分类)
    ├── ThemeSuiteGallery.tsx          AI主题套装卡片列表+生成入口
    ├── MyWardrobe.tsx                 已拥有饰品网格+试穿历史时间线
    ├── AccessoryUnlockModal.tsx       解锁条件弹窗(成就/付费/会员)
    ├── SaveOutfitBar.tsx              底部固定栏(保存/还原/分享)
    └── ThemeSuiteProgress.tsx         AI生成进度(复用现有组件)

接口层 (Controller)
  server/src/routes/wardrobe.ts        /api/wardrobe/* RESTful
  server/src/middleware/auth.ts        复用:身份校验
  server/src/middleware/error.ts       复用:统一错误处理

业务服务层 (Service)
  小程序:
    services/wardrobeService.ts        装备/卸下/保存/查询库存
    services/themeSuiteService.ts      AI主题生成调用+轮询
    hooks/useWardrobe.ts               衣橱状态组合式 Hook
    stores/wardrobeStore.ts            衣橱状态(库存/装备/试穿态)
  后端:
    server/.../wardrobeService.ts      库存/装备/解锁业务逻辑
    server/.../themeSuiteService.ts    主题AI生成编排+内容审核
    server/.../accessoryUnlockSvc.ts   解锁条件判定(成就/付费/会员)

数据访问层 (Repository)
  后端:
    server/.../wardrobeRepository.ts   饰品/库存/装备SQL封装
    server/.../themeSuiteRepository.ts 主题任务SQL封装
  小程序:
    engines/petAvatar/outfitRenderer.ts SVG饰品图层合成器

第三方集成层 (Adapter)
  server/.../seedreamAdapter.ts        复用:AI图像生成
  server/.../photoUploadService.ts     复用:照片上传
  server/.../paymentAdapter.ts         复用:微信支付
  server/.../contentModerationAdapter.ts 新增:AI主题结果内容审核

工具层 (Utils)
  src/constants/wardrobe.ts            饰品枚举常量/槽位定义/类型
  src/utils/outfitComposition.ts       套装组合计算+槽位冲突检测
  src/utils/outfitShare.ts             套装分享卡片生成

配置层 (Config)
  src/data/wardrobe/accessories.ts     饰品元数据(SVG/槽位/解锁)
  src/data/wardrobe/themeSuites.ts     AI主题元数据(节日/提示词)
  server/migrations/004_wardrobe_tables.sql  数据库迁移
```

---

## 三、模块依赖关系

```
[wardrobe 页面]
   ↓ 调用
[useWardrobe Hook] ← [wardrobeStore]
   ↓                    ↓
[wardrobeService]    [本地缓存]
   ↓                    ↓
[api 封装层]         [Storage]
   ↓
[后端 /api/wardrobe]
   ↓
[wardrobeService(后端)]
   ├─→ [wardrobeRepository] → [PostgreSQL]
   ├─→ [accessoryUnlockSvc] → [achievementService(已有)]
   ├─→ [paymentAdapter(已有)]
   └─→ [themeSuiteService] → [seedreamAdapter(已有)]
                              ↓
                           [taskQueue(已有)]
                              ↓
                           [contentModerationAdapter(新增)]
```

---

## 四、核心数据流

### 流 A:装备 SVG 饰品(免费/全用户)

```
用户点击饰品 → useWardrobe.equipAccessory(slot, accessoryId)
  → wardrobeStore 更新"试穿态"(本地即时预览,零延迟)
  → 用户点"保存"
  → wardrobeService.saveOutfit(petId, slots) → POST /api/wardrobe/outfit
  → 后端校验:身份/宠物归属/饰品拥有权/槽位匹配
  → wardrobeRepository.upsertPetOutfit()
  → pet_profiles.outfit_summary 更新(冗余字段,避免每次join)
  → 返回成功 → 前端 storage 同步 → PetAvatar 组件下次渲染读 outfit
```

### 流 B:AI 主题套装生成(会员/付费)

```
用户选主题 → ThemeSuiteGallery.handleGenerate(suiteId)
  → themeSuiteService.createTask(petId, suiteId) → POST /api/wardrobe/theme/generate
  → 后端校验:会员状态/付费扣款/宠物归属
  → taskQueue.createTask(type='theme_suite')
  → 异步:themeSuiteService.runGeneration()
    → 读取宠物现照(avatar_cartoon_url 或 avatar_photo_url)
    → seedreamAdapter.generate({ referenceImageUrl, prompt: suite.prompt })
    → contentModerationAdapter.check(resultUrl)
    → 通过 → themeSuiteRepository.save(themeSuiteTask)
    → 不通过 → 重新生成(最多2次),仍失败则退款
  → 前端轮询 /api/wardrobe/theme/task/:taskId(复用现有轮询组件)
  → 完成 → 用户保存为形象(覆盖 theme_suite_url)
```

---

## 五、UI 与交互

### 5.1 页面结构

```
┌─────────────────────────────────────────────┐
│  ← 返回    宠物衣橱              ⋯ 更多      │
├─────────────────────────────────────────────┤
│         ┌─────────────────────┐            │
│         │   OutfitPreview     │            │
│         │   (5槽位叠加显示)    │            │
│         └─────────────────────┘            │
│   [头]  [颈]  [背]  [身]  [足]              │
├─────────────────────────────────────────────┤
│  ┌─────────┬─────────┬─────────┐           │
│  │饰品库   │主题套装  │我的衣橱  │           │
│  └─────────┴─────────┴─────────┘           │
├─────────────────────────────────────────────┤
│  [当前 Tab 内容区,可滚动]                    │
├─────────────────────────────────────────────┤
│  [还原默认]    [保存形象]    [分享]          │
└─────────────────────────────────────────────┘
```

### 5.2 三 Tab 内容

**Tab 1:饰品库(默认)**
- 槽位筛选:横向滚动 Tab(全部/头部/颈部/背部/身体/足部)
- 饰品网格 4 列,4 种状态视觉:已装备(金边+✓)、已拥有、锁定(成就/付费/会员)
- 点击已拥有→即时试穿;点击锁定→弹出解锁弹窗

**Tab 2:主题套装**
- 8-12 个主题卡片,含预览图+描述
- 状态:可用→"生成我的XX形象" | 生成中→进度条 | 已生成→[应用][重生成][保存]
- 先校验宠物基础形象,无则阻断引导

**Tab 3:我的衣橱**
- 饰品统计:已拥有/按槽位分布
- 试穿历史时间线(最近 20 条)
- 已生成主题网格

### 5.3 核心交互流程

1. **首次进入**:加载库存,无库存则自动授予 default 饰品
2. **试穿饰品**:本地即时预览,零延迟,允许多槽位同时试穿
3. **保存装备**:调接口保存,同步 pet_profiles.outfit_summary
4. **解锁饰品**:成就/付费/会员三种路径
5. **AI 主题生成**:校验→扣配额→异步生成→轮询→内容审核→应用
6. **分享套装**:canvas 生成分享卡片→微信分享

### 5.4 状态管理(wardrobeStore)

```typescript
interface WardrobeState {
  inventory: Accessory[]                    // 已拥有饰品
  outfit: OutfitSlots                       // 正式装备(已保存)
  trialOutfit: OutfitSlots                  // 试穿态(未保存)
  isDirty: boolean                          // 试穿态与正式态是否不一致
  themeSuites: ThemeSuite[]                 // 可用主题
  activeThemeTask: ThemeSuiteTask | null    // 当前生成任务
  generatedThemes: ThemeSuiteHistory[]      // 历史
  tryOnHistory: TryOnRecord[]               // 最近20条
  activeTab: 'accessory' | 'theme' | 'mine'
  activeSlotFilter: AccessorySlot | 'all'
  isLoading: boolean
  error: string | null
}
```

### 5.5 视觉与动效

遵循用户偏好的温馨家庭风格:
- 背景:暖阳金→奶白渐变
- 预览区:圆形舞台+柔和阴影+浮动光点粒子
- 试穿:饰品飘落+弹性缩放(300ms)
- 槽位徽章:呼吸光晕,已装备金色脉冲
- 主题卡片:错落入场(staggered 50ms)
- 保存成功:形象跳跃+星星迸发

---

## 六、数据库表设计

### 6.1 accessories(饰品定义表)

```sql
CREATE TABLE accessories (
  id              VARCHAR(64) PRIMARY KEY,
  slot            VARCHAR(20) NOT NULL,              -- head/neck/back/body/feet
  name            VARCHAR(50) NOT NULL,
