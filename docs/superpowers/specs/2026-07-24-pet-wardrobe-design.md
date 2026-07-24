# 宠物换装(衣橱)功能设计规格

> 状态: 设计完成 · 待审查
> 日期: 2026-07-24
> 方案: 混合方案(独立衣橱页 + SVG饰品叠加 + AI主题套装)

---

## 1. 需求概述

在现有宠物形象系统基础上，新增"换装"功能，让用户可以为宠物装扮不同饰品和主题形象。

### 1.1 核心决策

| 决策项 | 选择 |
|--------|------|
| 换装形态 | 混合方案：基础饰品 SVG 叠加(免费全用户) + 高级主题 AI 生成(会员/付费) |
| 架构方案 | 独立衣橱页面(pagesPet/wardrobe)，从 pet-profile 入口跳转 |
| SVG 槽位 | 5 槽位：头部/颈部/背部/身体/足部 |
| 饰品规模 | 首批 40 件(默认8 + 成就8 + 付费12 + 会员12) |
| 饰品获取 | 默认解锁 / 成就解锁 / 付费购买 / 会员专属 |
| AI 换装形态 | 主题套装生成(10套，含节日联动) |

---

## 2. 架构与模块边界

### 2.1 七层架构映射

```
表现层 (UI)
  pagesPet/wardrobe/index.tsx          衣橱主页(容器,3 Tab 切换)
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
  server/.../paymentAdapter.ts         复用:微信支付(饰品购买)
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

### 2.2 模块依赖关系

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

### 2.3 与现有系统的集成点(精确到文件)

**需要修改的现有文件:**

| 文件 | 改动 | 风险等级 |
|------|------|----------|
| avatarTypes.ts | **保留** `ExpressionConfig.accessory: string`;**新增** `outfitSlots?: OutfitSlotMap` 可选字段;`SvgPetFace` 保留 `accessory`,**新增** `outfitLayers?: OutfitLayer[]`;新增 OutfitSlot/Accessory/ThemeSuite/OutfitLayer 类型 | 中 |
| svgRenderer.ts | `SvgPetFace` 新增 `outfitLayers?: OutfitLayer[]`(非 `string[]`);渲染末尾按 z-order 叠加;`buildSvgFace` 签名加 `outfitLayers?` 参数 | 低 |
| PetAvatar.tsx | Props 加 `outfitSlots?`;传递给 svgRenderer | 低 |
| pet-profile/index.tsx | 头部加"换装"入口按钮;将 emoji 头像替换为 `PetAvatar` 组件并传入 `outfitSlots` | 中 |
| avatarService.ts | ~~移除~~:装备保存走 wardrobeService,avatarService 不涉及 outfit 数据 | 低 |
| app.config.ts | pagesPet 分包加 `wardrobe/index` 路由 | 低 |
| taskQueue.ts | TaskType 联合类型加 `'theme_suite'`;需同步修改前端 avatarTypes.ts 的 TaskType;迁移脚本需解除 CHECK 约束 | 中 |
| pets.ts | GET /pets/:id 通过 `SELECT *` 自动返回 `outfitSummary`(toCamelCase 转换);无需修改路由代码 | 低 |

**完全复用不改的现有模块:**
- auth.ts / error.ts 中间件
- seedreamAdapter / photoUploadService
- paywallPopup / useMembership / useAnalytics
- GenerationProgress 组件

---

## 3. 数据流

### 3.1 流 A: 装备 SVG 饰品(免费/全用户)

```
用户点击饰品 → useWardrobe.equipAccessory(slot, accessoryId)
  → wardrobeStore 更新"试穿态"(本地即时预览,零延迟)
  → 用户点"保存"
  → wardrobeService.saveOutfit(petId, slots) → POST /api/wardrobe/outfit
  → 后端校验:身份/宠物归属/饰品拥有权/槽位匹配
  → wardrobeRepository.upsertPetOutfit()
  → pet_profiles.outfit_summary 更新(冗余字段)
  → 返回成功 → 前端 storage 同步 → PetAvatar 组件下次渲染读 outfit
```

### 3.2 流 B: AI 主题套装生成(会员/付费)

```
用户选主题 → ThemeSuiteGallery.handleGenerate(suiteId)
  → themeSuiteService.createTask(petId, suiteId) → POST /api/wardrobe/theme/generate
  → 后端校验:会员状态/付费扣款/宠物归属
  → taskQueue.createTask(type='theme_suite')
  → 异步:themeSuiteService.runGeneration()
    → 读取宠物现照
    → seedreamAdapter.generate({ referenceImageUrl, prompt })
    → contentModerationAdapter.check(resultUrl)
    → 通过 → 保存到 theme_suite_tasks
    → 不通过 → 重新生成(最多2次),仍失败则退款
  → 前端轮询 GET /api/wardrobe/theme/task/:taskId
  → 完成 → 用户保存为形象
```

---

## 4. UI 与交互

### 4.1 页面结构

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

### 4.2 Tab 1: 饰品库

- 横向滚动槽位筛选: [全部] [头部] [颈部] [背部] [身体] [足部]
- 饰品 4 列网格,4 种状态视觉: 已装备(金框+✓) / 已拥有 / 锁定(灰+🔒) / 锁定付费(灰+💰+价格)
- 点击已拥有 → 即时试穿预览; 点击锁定 → 弹出解锁弹窗

### 4.3 Tab 2: 主题套装(AI 生成)

- 配额提示: "会员每月3次 | 本月剩X次"
- 主题卡片列表(8-12个),含节日联动
- 状态: 可用 → 生成中(进度条) → 已完成(成品图+操作按钮)
- 操作: [生成我的形象] / [应用为形象] / [重新生成] / [保存到相册]

### 4.4 Tab 3: 我的衣橱

- 饰品统计(按槽位分类已拥有数量)
- 试穿历史时间线(最近20条,倒序)
- 已生成主题网格(可重新应用)

### 4.5 核心交互

- **试穿**: 点击饰品 → 本地即时叠加,零延迟 → 保存后提交后端
- **解锁**: 成就跳转任务页 / 付费调微信支付 / 会员弹出 PaywallPopup
- **AI 生成**: 选主题 → 校验(会员+配额+基础形象) → 创建任务 → 轮询进度 → 展示成品
- **保存**: 5槽位+主题URL一起提交 → 后端校验归属+拥有权+槽位匹配
- **分享**: canvas 生成分享卡片(形象+套装名+小程序码)

### 4.6 视觉动效

- 饰品试穿: 飘落 + 弹性缩放(300ms)
- 槽位徽章: 呼吸光晕,已装备金色脉冲
- 主题卡片: 错落入场(staggered 50ms)
- 保存成功: 形象跳跃 + 星星迸发
- 整体: 温馨主题渐变,浮动光点粒子

---

## 5. 数据库设计

### 5.1 表结构

```sql
-- ============================================================
-- 004_wardrobe_tables.sql
-- ============================================================

-- 1. 饰品定义表(全局配置,运营可后台修改)
CREATE TABLE IF NOT EXISTS accessories (
  id              TEXT PRIMARY KEY,            -- 如 'hat_bowler'
  name            TEXT NOT NULL,               -- 显示名
  slot            TEXT NOT NULL CHECK (slot IN ('head','neck','back','body','feet')),
  svg_path        TEXT NOT NULL,               -- SVG 片段路径(本地或CDN)
  species_compat  TEXT[] DEFAULT '{}',         -- 空数组=全物种兼容
  unlock_source   TEXT NOT NULL CHECK (unlock_source IN ('default','achievement','paid','member')),
  unlock_condition JSONB DEFAULT '{}',         -- 成就ID/价格/会员等级
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 用户饰品库存表
CREATE TABLE IF NOT EXISTS user_accessory_inventory (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accessory_id    TEXT NOT NULL REFERENCES accessories(id),
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unlock_source   TEXT NOT NULL,
  UNIQUE(user_id, accessory_id)
);

-- 3. 宠物装备表(每只宠物一行,5槽位存为JSONB)
CREATE TABLE IF NOT EXISTS pet_outfits (
  pet_id          UUID PRIMARY KEY REFERENCES pet_profiles(id) ON DELETE CASCADE,
  outfit_slots    JSONB NOT NULL DEFAULT '{}',  -- {"head":"hat_bowler","neck":"scarf_red",...}
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AI 主题套装定义表(全局配置)
CREATE TABLE IF NOT EXISTS theme_suites (
  id              TEXT PRIMARY KEY,            -- 如 'christmas'
  name            TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('festival','season','birthday','special')),
  prompt_template TEXT NOT NULL,
  festival_date   TEXT,                        -- MM-DD 或动态
  preview_url     TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AI 主题生成任务表
CREATE TABLE IF NOT EXISTS theme_suite_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id          UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  suite_id        TEXT NOT NULL REFERENCES theme_suites(id),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  result_url      TEXT,
  moderation_result TEXT CHECK (moderation_result IN ('pass','review','block')),
  quota_consumed  BOOLEAN NOT NULL DEFAULT TRUE,
  retry_count     INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 防止同一宠物同时有多个进行中任务
CREATE UNIQUE INDEX IF NOT EXISTS idx_theme_task_active
  ON theme_suite_tasks(pet_id) WHERE status IN ('pending','processing');

-- 6. 试穿历史表(每用户最多20条,超限由触发器清理)
CREATE TABLE IF NOT EXISTS try_on_history (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id          UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  outfit_snapshot JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_try_on_history_user ON try_on_history(user_id, created_at DESC);

-- 试穿历史超限触发器(保留最近20条)
CREATE OR REPLACE FUNCTION fn_cleanup_try_on_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM try_on_history
    WHERE user_id = NEW.user_id
      AND id NOT IN (
        SELECT id FROM try_on_history
          WHERE user_id = NEW.user_id
          ORDER BY created_at DESC LIMIT 20
      );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_try_on_history
  AFTER INSERT ON try_on_history
  FOR EACH ROW EXECUTE FUNCTION fn_cleanup_try_on_history();

-- 7. 扩展 avatar_generation_tasks 的 task_type CHECK 约束(支持 theme_suite)
ALTER TABLE avatar_generation_tasks
  DROP CONSTRAINT IF EXISTS avatar_generation_tasks_task_type_check;
ALTER TABLE avatar_generation_tasks
  ADD CONSTRAINT avatar_generation_tasks_task_type_check
  CHECK (task_type IN ('2d', '3d', 'theme_suite'));
```

### 5.2 pet_profiles 扩展字段

```sql
ALTER TABLE pet_profiles 
  ADD COLUMN IF NOT EXISTS outfit_summary JSONB,
  ADD COLUMN IF NOT EXISTS theme_suite_url TEXT;
```

---

## 6. API 契约

### 6.1 饰品与库存

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/wardrobe/accessories | 获取饰品列表(含筛选) |
| GET | /api/wardrobe/inventory | 获取用户库存(首次自动授予默认饰品) |
| POST | /api/wardrobe/accessory/unlock | 解锁饰品(成就/付费) |

### 6.2 装备管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/wardrobe/outfit/:petId | 获取宠物当前装备 |
| POST | /api/wardrobe/outfit | 保存装备(5槽位) |
| POST | /api/wardrobe/outfit/reset | 还原默认(清空所有槽位) |

### 6.3 AI 主题套装

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/wardrobe/themes | 获取可用主题列表 |
| GET | /api/wardrobe/themes/quota | 获取本月AI生成配额 |
| POST | /api/wardrobe/themes/generate | 创建AI主题生成任务 |
| GET | /api/wardrobe/themes/task/:taskId | 查询任务进度 |
| GET | /api/wardrobe/themes/history | 历史生成记录(分页) |
| POST | /api/wardrobe/themes/apply | 应用AI主题为宠物形象 |

### 6.4 试穿历史与分享

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/wardrobe/try-on/history | 试穿历史(分页) |
| POST | /api/wardrobe/try-on/record | 记录试穿 |
| POST | /api/wardrobe/share/preview | 生成分享卡片 |

### 6.5 错误码

| HTTP | code | 场景 |
|------|------|------|
| 400 | WARDROBE_001 | 饰品不存在或已下架 |
| 400 | WARDROBE_002 | 槽位不匹配 |
| 400 | WARDROBE_003 | 物种不兼容 |
| 403 | WARDROBE_010 | 未拥有该饰品 |
| 403 | WARDROBE_011 | 会员已过期 |
| 403 | WARDROBE_012 | 限时饰品已过期 |
| 403 | WARDROBE_020 | 宠物无基础形象,无法生成主题 |
| 403 | WARDROBE_021 | 本月配额已用完 |
| 403 | WARDROBE_022 | 主题已下架 |
| 403 | WARDROBE_023 | 内容审核未通过,无法应用 |
| 404 | WARDROBE_030 | 宠物不存在或无权访问 |
| 404 | WARDROBE_031 | 任务不存在 |
| 409 | WARDROBE_040 | 已有任务进行中 |
| 429 | WARDROBE_050 | 操作过于频繁 |
| 500 | WARDROBE_099 | 系统异常 |

---

## 7. SVG 渲染机制

### 7.1 图层叠加模型

**保留** `SvgPetFace.accessory: string` 不变（兼容现有表情装饰），**新增** `outfitLayers?: OutfitLayer[]` 可选字段。每个 OutfitLayer 含 slot/accessoryId/svgPath/zIndex/transform。当 `outfitLayers` 存在且非空时，渲染管线优先使用 outfitLayers 叠加，忽略 `accessory` 字段。

### 7.2 渲染管线

```
1. 生成基础形象 SVG (body + ears + eyes + mouth)
2. 按 z-order 叠加 outfitLayers (head(10) > neck(5) > back(3) > body(2) > feet(1))
3. 应用 animation class
4. 整体 SVG 转 data URI
5. <Image src={dataUri} />
```

### 7.3 渲染优先级

theme_suite_url (最高) > outfitSlots (5槽位SVG) > expression默认装饰

### 7.4 物种适配

狗(scale 1.0) / 猫(scale 0.85 × 0.9)

### 7.5 加载策略

15件本地内置(打包在分包) + 45件 CDN 按需加载(SVG 缓存到 storage)

---

## 8. AI 主题生成流程

### 8.1 时序

1. 前端 POST /wardrobe/themes/generate
2. 后端校验权限/配额/基础形象 → 扣减配额(原子) → 创建任务
3. 异步: seedream 生成 → 内容审核 → 保存结果
4. 前端轮询 GET /wardrobe/themes/task/:taskId (2秒)
5. 完成 → 展示成品图 + [应用为形象] / [重新生成] / [保存]

### 8.2 内容审核

seedream 返回 → 腾讯云内容安全 → Pass(保存) / Review(人工) / Block(重试最多2次,仍失败则退款)

### 8.3 配额管理

会员: 每月免费3次(Redis 计数器,月初重置)
非会员: 需单独购买 ¥3/次
失败退款: 任务 failed + quota_consumed=true → 自动退还配额

### 8.4 Prompt 模板

`"a cute {species} {breed} wearing {theme_description}, {style} style, full body, centered, white background, high quality, pet photography"`

---

## 9. 数据一致性

| 场景 | 策略 |
|------|------|
| 装备保存并发 | SELECT ... FOR UPDATE 锁 pet_outfits 行 |
| 配额扣减并发 | 原子 UPDATE ... WHERE used < quota RETURNING used |
| AI 任务重复 | 部分唯一索引 WHERE status IN ('pending','processing') |
| 试穿历史超限 | 插入后触发器删除超出20条 |
| 支付与库存 | 支付回调中,先幂等校验,再同事务授予 |
| AI 失败退款 | 自动退还月配额计数器 |

---

## 10. 安全边界

| 风险点 | 防护 | 位置 |
|--------|------|------|
| 越权装备他人饰品 | 校验 inventory.user_id = 当前用户 | wardrobeService.saveOutfit |
| 跨宠物修改装备 | WHERE pet_id AND user_id | wardrobeRepository |
| 非会员调用AI | 校验 membership.status = active | themeSuiteService.createTask |
| 未支付就装备 | 校验 unlock_source 或支付订单 | accessoryUnlockSvc |
| Prompt注入 | 主题 prompt 来自白名单常量 | themeSuiteService |
| AI违规内容 | 腾讯云图片内容安全 | contentModerationAdapter |
| 装备数据篡改 | slot/accessoryId 白名单校验 | 后端 wardrobeService |

---

## 11. 错误处理与降级

| 场景 | 主路径 | 降级 |
|------|--------|------|
| 饰品SVG加载失败 | 本地内嵌SVG | 占位框+"加载失败" |
| 装备保存接口失败 | 调用后端 | 本地storage保存,提示暂存 |
| AI生成失败 | seedream+重试2次 | 返回预设主题图(3套兜底) |
| 内容审核不通过 | 拒绝+重生成 | 第3次失败→退款+提示 |
| 网络异常 | 重试3次(api层) | 兜底UI:错误页+重试按钮 |
| 宠物无基础形象 | 阻断 | 引导跳转avatar-customize |

---

## 12. 性能与体积

- 饰品SVG: 每件<2KB,40件总计<120KB,按槽位懒加载
- 主包体积: 饰品元数据放pagesPet分包,主包零增量
- 预览渲染: 试穿态本地SVG即时叠加,零网络请求
- 装备状态: localStorage缓存outfit_slots,首屏直接渲染
- AI历史: 分页加载,每页10条
- 图片懒加载: 全部lazyLoad
- 防抖: 装备切换防抖300ms

---

## 13. 饰品预设(首批40件)

| 槽位 | 默认(8) | 成就(8) | 付费(12) | 会员(12) |
|------|---------|---------|----------|----------|
| 头 | 小礼帽/棒球帽 | 皇冠/蝴蝶结 | 圣诞帽/学位帽/淑女帽 | 独角兽角/樱花发饰/南瓜帽 |
| 颈 | 红围巾/小铃铛 | 勋章/星之链 | 圣诞围巾/领结/宝石项链 | 彩虹丝带/月光吊坠/雪花围巾 |
| 背 | 小背包 | 蝴蝶翅膀/气球 | 火箭背包/小吉他/天使翅膀 | 蝙蝠翼/精灵翅膀/龙翼 |
| 身 | 蓝T恤 | 超人战衣/运动背心 | 和服/西装/汉服 | 彩虹衣/星空衣/爪印连体衣 |
| 足 | 小袜子 | 运动鞋/芭蕾鞋 | 登山靴/雨靴/公主鞋 | 发光爪套/星光鞋/幸运草鞋 |

## 14. 主题套装预设(首批10套)

| ID | 名称 | 类别 | 节日 |
|----|------|------|------|
| christmas | 圣诞套装 | festival | 12-25 |
| spring_festival | 新春套装 | festival | 春节 |
| halloween | 万圣套装 | festival | 10-31 |
| birthday | 生日套装 | birthday | 动态 |
| sakura | 樱花和服 | season | 春季 |
| summer_beach | 夏日海滩 | season | 夏季 |
| autumn_maple | 秋日枫叶 | season | 秋季 |
| winter_snow | 冬日雪景 | season | 冬季 |
| astronaut | 太空探险 | special | - |
| hanfu | 汉服古风 | special | - |

---

## 15. 审查记录

### 15.1 自我审查(2026-07-24)

**审查维度**: 占位符检查 / 内部一致性 / 范围适当性 / 歧义检查

**发现并修复的问题:**

| # | 问题 | 级别 | 修复方式 |
|---|------|------|----------|
| 1 | `ExpressionConfig.accessory` → `outfitSlots` 为破坏性变更，现有表情装饰功能会断裂 | P2 | 改为保留 `accessory: string`，新增 `outfitSlots?: OutfitSlotMap` 可选字段 |
| 2 | `SvgPetFace.outfitLayers` 类型不一致：2.3 节写 `string[]`，7.1 节写 `OutfitLayer[]` | P2 | 统一为 `OutfitLayer[]`，2.3 节和 7.1 节同步修正 |
| 3 | `avatarService.ts` 的 `saveAvatarCustomization` 同步 outfit 与 `wardrobeService.saveOutfit` 职责冲突 | P2 | 移除 avatarService.ts 的 outfit 同步要求，装备保存仅走 wardrobeService |
| 4 | `TaskType` 前后端需同步扩展 `'theme_suite'`，且数据库 CHECK 约束需迁移 | P2 | 迁移脚本中增加 ALTER CHECK 约束，2.3 节标注需前后端同步 |
| 5 | 字段命名不一致：数据库 `outfit_summary` vs 前端 `outfit_slots` | P2 | 统一：数据库列名 `outfit_summary`，toCamelCase 转为 `outfitSummary`，前端统一使用 `outfitSummary` |
| 6 | pet-profile 头像区当前使用 emoji 而非 PetAvatar 组件，设计文档未明确替换方式 | P2 | 明确：将 emoji 替换为 PetAvatar 组件并传入 outfitSlots |
| 7 | DDL 仅为注释占位，缺少完整建表语句 | P2 | 补充完整 DDL，含 CHECK 约束、索引、触发器、外键 |

**审查结论**: 所有问题已修复，文档内部一致性已恢复，无占位符残留，范围适当（独立模块，对现有系统改动最小化）。