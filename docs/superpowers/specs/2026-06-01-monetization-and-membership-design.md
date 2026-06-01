# 付费体系与会员架构设计

> 本文档面向「个人学习规划记录」产品（桌面端 Electron + 小程序双端），定义可持续的商业模式、会员权益体系、技术架构契约、冷启动策略，作为后续实现计划的唯一权威依据。

---

## 一、产品定位与赚钱模型适配

产品具有「工具属性 + 长期使用 + 个人成长 + 关系协作 + 数据沉淀 + 主题系统 + 跨端」的特征，**不适合一次性付费**，最优组合是：

> **免费可用 + 高级订阅 + 关系互联付费 + AI 增值 + 增值素材**

对标已验证盈利的同类应用：潮汐、Forest、滴答清单、Heptabase、Flomo、Cubox、专注森林、Habitica。

---

## 二、五层收入结构

### 第 1 层：基础免费层（拉新 / 留存底盘）

- 个人任务、每日打卡、番茄专注
- 2~3 套基础主题（高级校园、夜间专注）
- 基础统计（近 7 天）
- 单人使用、本地数据
- 目标：0 摩擦养成习惯，是后面所有付费的前提

### 第 2 层：Pro 会员订阅（核心稳定现金流）

权益清单：

- 高级主题全解锁（多巴胺、水墨、商务、二次元、节日限定）
- 高级模板库（考研、考公、雅思、健身、自媒体、自律 30 天）
- 多设备同步 + 云备份 + 数据导出（md / json / pdf）
- 高级统计（年度报告、热力图、专注复盘）
- 高级专注模式（白噪音、场景音、深度勿扰）
- 高级 AI 教练（计划生成、错题讲解、复盘建议）—— 含每月免费额度
- 自定义提醒、自定义快捷指令

**定价（中端档，所有价格在后台配置，可随时调）：**

| 周期 | 价格 |
|---|---|
| 月度 | ¥18 / 月 |
| 季度 | ¥45 |
| 年度 | ¥98 |
| 终身 | ¥298 |

### 第 3 层：关系互联付费（差异化最强）

权益清单：

- 创建多人「互联空间」：情侣、家庭、学习搭子、自律搭子
- 互推任务、共享待办、共享习惯、共享番茄
- 实时对战（专注 PK、连续打卡 PK、周排行）
- 关系成长值、情侣等级、搭子默契度
- 纪念日、共同目标、共同基金（虚拟）

**计费模式：A 模式 —— 创建者承担**

- 创建空间的人付费，空间下所有成员共享「空间相关」高级功能
- 副席位的「个人类」高级权益（如高级主题、个人 AI 额度）仍需自己 Pro
- 优点：转化高、决策简单、被拉的人零门槛
- 价格示例：¥12/月 或作为 Pro 附加包

### 第 4 层：AI 增值（按量 / 套餐）

权益清单：

- AI 计划生成（输入目标 → 自动 30 天计划）
- AI 错题讲解 / 学习答疑
- AI 复盘日报、周报、月报
- AI 拍照识别错题 / OCR

**额度模型：**

| 额度类型 | 来源 | 周期 | 是否累积 |
|---|---|---|---|
| 免费额度 | 每月系统发放（如 8 次） | 月清零 | 否 |
| Pro 内含额度 | Pro 用户每月发放（如 50 次） | 月清零 | 否 |
| 加油包额度 | 用户购买 | 永不过期 | 是 |

**消耗顺序（关键）：免费额度 → Pro 内含额度 → 加油包额度**
（让付费购买的额度最后用，避免「付费的反而先过期」的负面体验）

**加油包定价：** ¥9.9 / 100 次 或 ¥29 / 月 不限量加油包

### 第 5 层：增值素材 / 一次性内购

- 主题皮肤单卖（¥6~¥18 一套）—— 给不爱订阅的人台阶
- 番茄场景包（图书馆、咖啡馆、雨夜、海边）
- 角色 / 宠物 / 成长皮肤
- 节日限定（春节、七夕、跨年）
- 模板单卖（考研全套、健身全套）

### 第 5.5 层：创作者生态（UGC 主题 / 模板市场 + 平台抽成）

> **战略意义**：把产品从「工具」升级为「平台」。一个人的经历是有限的，但全网创作者的经历是无限的。这一层是产品长期护城河，也是后期估值想象空间最大的一层。对标 Figma 社区、Notion 模板市场、潮汐场景市场。

#### 创作者可上架的内容

- **主题皮肤**（最高频）：颜色、字体、卡片样式、背景图、声音
- **学习计划模板**（最有价值）：考研全套、雅思 90 天、健身 30 天、戒烟 21 天、备婚 365 天
- **打卡习惯包**：早起、阅读、冥想、运动等成套习惯配置
- **番茄场景包**：白噪音、场景图、专属音效
- **角色 / 宠物 / 成长皮肤**（搭配游戏化主题）
- **节日 / 兴趣限定包**：动漫、二次元、潮玩、文艺向

#### 创作者准入

- 任何用户都可申请成为创作者（实名 + 一次性审核）
- 内容上架前平台审核（合规、版权、质量）
- 设置「认证创作者」徽章，提升排序和曝光

#### 分成机制

- **付费内容分成比例：创作者 70% / 平台 30%**（对标 Apple App Store 与 Notion 模板市场行业惯例）
- **免费内容**：创作者拿曝光与粉丝，平台可选择性给创作激励（流量分成或打赏分成 90/10）
- 平台支付通道、客服、退款、合规由平台承担，30% 抽成覆盖这部分成本
- 创作者收入按月结算，达到提现门槛（如 ¥100）可提现

#### 防风险约束

- 内容审核：禁止涉政、涉黄、抄袭、版权侵权、违法激励
- 著作权声明：上架即默认授予平台分发权，可下架但已售内容保持有效
- **抽成与定价规则写在《创作者协议》**，平台保留调整权但需提前 30 天公告
- 涉及 AI 生成内容（如 AI 生成主题图）需创作者声明并承担风险
- 实名认证 + 反洗钱合规（高额提现需补充材料）

#### 创作者激励

- 销量榜、新人榜、月度精选
- 平台首页/Banner 资源位倾斜
- 创作者后台：销售数据、粉丝、收入、留存分析
- 优秀创作者签约扶持（独家分成 80%、流量保底）

#### 技术契约预留

```ts
interface CreatorAsset {
  id: string
  creatorId: string
  type: 'theme' | 'template' | 'habit_pack' | 'pomodoro_scene' | 'avatar_pack'
  name: string
  description: string
  coverUrl: string
  contentRef: string              // 资源指针（CDN URL 或 ID）
  price: number                   // 单位分；0 = 免费
  status: 'draft' | 'reviewing' | 'published' | 'offline' | 'rejected'
  reviewNotes?: string
  shareRatio: number              // 创作者分成比例，默认 0.7
  publishedAt?: string
  salesCount: number
  rating: number
}

interface CreatorAccount {
  userId: string
  realNameVerified: boolean
  certifiedAt?: string
  payoutAccount?: { type: 'wechat' | 'alipay'; mask: string }
  totalRevenue: number
  pendingRevenue: number
  withdrawnRevenue: number
}

interface CreatorPayout {
  id: string
  creatorId: string
  amount: number
  status: 'pending' | 'processing' | 'paid' | 'failed'
  period: string                  // YYYY-MM
  createdAt: string
}
```

- 创作者内容购买仍走 `Product` + `Order` + `EntitlementService`，购买后授予 `theme_<id>` / `template_<id>` 权益
- 复用整套支付与权益体系，**不新建独立链路**，符合「优先扩展点」原则
- 新增 `M11 Creator Module`、`M12 Asset Marketplace`、`M13 Payout Service` 三个模块

#### 节奏建议

- 首版不做（避免太重），但**数据模型与权益 code 命名空间从第一版预留**
- 用户量 / 付费转化稳定后（建议 DAU 5000+）启动创作者内测
- 启动前先做「官方主题市场」打底，验证用户对「市场化主题」的接受度

---

### 第 6 层（预留）：B 端 / 机构版

- 班级版、自习室版、企业自律版
- 短期不做，**但数据模型现在就预留 `org_id / space_type` 字段**

---

## 三、免费 vs 付费边界（宽松策略）

> 核心原则：基础功能不限量，只有「高级」功能付费。口碑优先、拉新优先。

| 功能 | 免费版 | Pro 会员 |
|---|---|---|
| 任务、打卡、番茄 | 不限量 | 不限量 |
| 基础主题 | 2~3 套 | 全部高级主题 |
| 基础统计 | 近 7 天 | 全部历史 + 年度报告 + 热力图 |
| 数据存储 | 本地 | 本地 + 云同步 + 云备份 |
| 数据导出 | 否 | md / json / pdf |
| AI 功能 | 每月 8 次免费额度 | 每月 50 次内含 + 可买加油包 |
| 关系空间 | 否 | 可创建 1 个空间（创建者付费模式） |
| 高级专注模式 | 否 | 白噪音 / 场景音 / 深度勿扰 |
| 模板库 | 基础几套 | 全部高级模板 |

---

## 四、Entitlement 权益体系（架构核心）

### 4.1 为什么不用 `isPro` 布尔字段

三条独立付费线意味着一个用户的状态空间巨大：

> 例：张三 = Pro 年付有效 + 空间 2 人月付有效 + AI 加油包剩 47 次
> 例：李四 = Pro 已过期 + 被朋友拉进空间（被动权益）+ 免费 AI 还剩 8 次
> 例：王五 = 终身 Pro + 7 天空间体验券 + AI 走 Pro 内含额度

必须用统一的「权益账户」表达，否则业务代码会散落大量 `if (isPro || hasSpace || ...)` 的判断。

### 4.2 权益数据契约

```ts
type EntitlementCode =
  | 'pro'              // Pro 会员
  | 'space'            // 关系空间
  | 'ai_quota'         // AI 付费额度
  | 'ai_quota_pro'     // AI Pro 内含额度
  | 'ai_quota_free'    // AI 免费额度
  | 'theme_<id>'       // 单个主题
  | 'template_<id>'    // 单个模板
  | 'org'              // 机构版（预留）

type EntitlementSource =
  | 'sub_monthly' | 'sub_quarterly' | 'sub_yearly' | 'sub_lifetime'
  | 'space_monthly' | 'space_yearly'
  | 'ai_pack' | 'ai_unlimited_monthly'
  | 'one_time_purchase'
  | 'monthly_grant'           // 免费额度月度发放
  | 'trial'                   // 试用
  | 'invite_reward'           // 邀请奖励
  | 'early_bird_gift'         // 早鸟赠送
  | 'lifetime_seed'           // 内测种子终身

interface Entitlement {
  code: EntitlementCode
  source: EntitlementSource
  expireAt: string | null         // null = 永久
  scope?: string                  // 例如 space_id
  remaining?: number              // 用于计次型权益
  resetAt?: string                // 用于周期重置型
  orderId?: string                // 关联订单
  grantedAt: string
}

interface UserEntitlements {
  userId: string
  entitlements: Entitlement[]
  updatedAt: string
}
```

### 4.3 唯一查询入口

业务代码**只能**通过 `EntitlementService` 查询权益，不得直接读取订单或订阅记录：

```ts
interface EntitlementService {
  has(userId: string, code: EntitlementCode, scope?: string): boolean
  consume(userId: string, code: EntitlementCode, n?: number): { ok: boolean; remaining?: number }
  list(userId: string): Entitlement[]
  grant(userId: string, e: Omit<Entitlement, 'grantedAt'>): void
  revoke(userId: string, predicate: (e: Entitlement) => boolean): void
}
```

---

## 五、会员体系六大模块

### 模块 1：身份与账户（Identity）

- 跨端统一 `user_id`（小程序、桌面端、未来 H5）
- 登录方式：微信、Apple、手机号
- 设备绑定（限制同时登录设备数，防共享账号）
- 游客模式：允许不登录使用免费功能，付费操作触发登录

### 模块 2：权益（Entitlement）

见第四节，体系心脏。

### 模块 3：商品与订单（Product & Order）

```ts
interface Product {
  id: string
  name: string
  type: 'subscription' | 'one_time' | 'pack'
  period?: 'month' | 'quarter' | 'year' | 'lifetime'
  price: number                  // 单位：分
  originalPrice?: number
  grants: Array<{
    code: EntitlementCode
    durationDays?: number        // 订阅期长
    quantity?: number            // 计次型权益数量
    scope?: string
  }>
  channel: ('wechat' | 'apple' | 'alipay')[]
  active: boolean
  visibleFrom?: string
  visibleTo?: string
}

interface Order {
  id: string
  userId: string
  productId: string
  amount: number
  channel: 'wechat' | 'apple' | 'alipay'
  status: 'pending' | 'paid' | 'refunded' | 'failed'
  channelTradeNo?: string
  rawReceipt?: string            // 原始凭证存档
  createdAt: string
  paidAt?: string
  refundedAt?: string
}
```

**关键约束：商品配置必须能在后台调，不能写死在客户端代码里。**

### 模块 4：续费与生命周期

- 自动续费 vs 一次性买断分开存储
- 续费失败 → 宽限期（3~7 天）→ 自动降级
- 到期前 7 天 / 1 天系统提醒
- 退款 / 取消订阅 → **到期回收（不立即），体验更好**

### 模块 5：试用、优惠券、活动

- 新人 7 天 Pro 试用
- 邀请好友双方各得 30 天
- 节日券、限时折扣
- 学生认证（学生证审核 → 5 折）
- **券和试用本质上都是临时权益，复用同一 Entitlement 模型**

### 模块 6：我的会员页

一页清楚：

- 我有哪些权益、什么时候过期
- 历史订单、续费记录
- 续费 / 升级 / 退款入口
- 客服与发票

---

## 六、AI 额度规则（防踩坑）

消耗顺序硬规则：

```
免费额度（ai_quota_free）→ Pro 内含额度（ai_quota_pro）→ 加油包（ai_quota）
```

- 三个池子分开记，前端可分别展示「剩余免费 / 剩余 Pro / 剩余加油包」
- 加油包永久不过期，给用户「越买越值」的心理预期
- 任何 AI 调用前必须先调 `entitlementService.consume('ai_quota_*', 1)`，按上述顺序尝试

---

## 七、技术架构分层

```
┌─────────────────────────────────────────┐
│  业务层（任务、专注、空间、AI、主题）       │
│      ↓ entitlement.has(code) / consume   │
└────────────────┬────────────────────────┘
                 │
         ┌───────▼────────┐
         │ Entitlement    │  ← 唯一权益查询入口
         │   Service      │
         └───────┬────────┘
                 │
    ┌────────────┼────────────┬─────────┐
    │            │            │         │
┌───▼────┐ ┌────▼────┐ ┌─────▼───┐ ┌───▼────┐
│ Sub    │ │ Space   │ │ AI Quota│ │ One-   │
│Provider│ │Provider │ │Provider │ │ time   │
└────────┘ └─────────┘ └─────────┘ └────────┘
                 │
         ┌───────▼────────┐
         │ Order Service  │
         └───────┬────────┘
                 │
       ┌─────────┼──────────┐
   ┌───▼──┐  ┌───▼──┐   ┌──▼───┐
   │WeChat│  │Apple │   │Alipay│
   │ Pay  │  │  IAP │   │ Pay  │
   └──────┘  └──────┘   └──────┘
```

**核心契约：**

- 业务层只调 `EntitlementService`，不知道订阅/订单/支付的存在
- 新增任何付费类型 = 新增一个 Provider + 新增几个 EntitlementCode，**不改业务层**
- 支付渠道是 Adapter，新增支付方式不影响订单逻辑
- 完全符合「优先扩展点，不改核心流程」的全局规则

---

## 八、冷启动策略（前期换数据、不裸推付费）

### 8.1 「赠送名额」真实漏斗认知

```
看到推广 10000 人
  → 点击进入 500 人（5%）
  → 完成首用 150 人（30%）
  → 次日留存 37 人（25%）
  → 7日活跃种子 5~7 人（15%）
```

**结论：前 100 名注册赠送只能换到约 10 个真种子；前 10 名终身大概率换不到 1 个长期用户。**

### 8.2 分批 + 行为门槛的赠送方案

| 批次 | 名额 | 权益 | 行为门槛（关键） |
|---|---|---|---|
| 第 0 批：内测种子 | **30 人** | 终身 Pro + 空间 + AI 不限量 | 主动联系 + 进反馈群 |
| 第 1 批：早鸟 | **300 人** | 1 年 Pro | 注册 + 连续打卡 7 天 |
| 第 2 批：邀请奖励 | 不限 | 每邀 1 人各得 30 天 Pro | 被邀人活跃 3 天 |
| 第 3 批：付费早鸟价 | **前 1000 名付费** | 年付 ¥49（半价） | 真金白银付费 |

### 8.3 赠送原则

1. **终身会员是永久成本，30 个封顶**（用户量到 10 万时，100 个终身相当于每年损失 ¥9800 续费 + 持续云存储/AI 成本）
2. **所有赠送必须绑「行为门槛」**，杜绝白嫖党
3. **邀请奖励是无限名额**，但被邀人需活跃才生效
4. **付费早鸟价 ≠ 赠送**，它才是验证商业模型的关键

### 8.4 赠送权益的技术落地

赠送的权益**完全复用 Entitlement 模型**，只需对应 source：

- `lifetime_seed` → 30 个名额，code: pro/space/ai_quota，expireAt: null
- `early_bird_gift` → 300 个名额，code: pro，expireAt: +365 天
- `invite_reward` → 不限，code: pro，expireAt: +30 天
- `trial` → 系统自动发，code: pro，expireAt: +7 天

---

## 九、跨端要求

- 小程序、桌面端共享同一 `user_id` 与权益数据
- 桌面端离线时使用本地缓存的权益快照，联网后同步刷新
- 小程序蓝图（`miniprogram/shared/blueprint.json`）预留 `entitlements` 字段
- 小程序内 IAP 必须走微信支付；iOS 上 IAP 必须走 Apple，否则会被拒

---

## 十、合规与安全

- 不在客户端硬编码任何支付密钥、AppSecret
- 所有支付凭证服务端二次校验
- 退款 / 订单查询走服务端，客户端只展示状态
- 价目表服务端下发（支持后台调价 + 灰度）
- 用户数据导出权与删除权（合规要求）
- 学生认证流程涉及证件，必须脱敏存储 + 限期销毁

---

## 十一、模块划分（供 writing-plans 拆解实施）

| 模块 | 职责 | 优先级 |
|---|---|---|
| M1 Entitlement Core | 权益数据契约 + 查询 / 消耗 / 授予 API | P0 |
| M2 Product Catalog | 商品配置 + 后台可调价 | P0 |
| M3 Order & Payment | 订单 + 三渠道支付适配器 | P0 |
| M4 Subscription Provider | 订阅生命周期 + 续费 + 宽限期 | P0 |
| M5 AI Quota Provider | 三池额度 + 消耗顺序 | P1 |
| M6 Space Provider | 关系空间创建者付费模型 | P1 |
| M7 One-time / Theme Provider | 一次性内购 | P2 |
| M8 Membership UI | 我的会员页 + 升级页 + 价目表 | P0 |
| M9 Trial / Coupon / Invite | 赠送、试用、邀请奖励 | P1 |
| M10 Admin Console（最简） | 商品配置 + 赠送名额发放 | P1 |
| M11 Creator Module | 创作者实名、后台、上架审核流程 | P2 |
| M12 Asset Marketplace | 主题/模板市场前台 + 购买流程 | P2 |
| M13 Payout Service | 创作者结算、提现、对账 | P2 |

---

## 十二、待后续决策（不阻塞首版）

- 各价格档具体数值的最终拍板（首版按中端档默认，后台可调）
- 支付渠道首发哪两个（建议：微信支付 + Apple IAP，支付宝二期）
- 学生认证服务商选型
- 后台管理系统使用现成方案还是自研最简版
- 数据库选型（与全局架构方案对齐后再定）

---

## 十三、本设计与全局规则的对齐说明

- ✅ 优先扩展点：Entitlement / Provider / Adapter 架构，新增付费类型不动业务层
- ✅ 接口契约保护：EntitlementCode、Product、Order 字段约定为契约，变更需走兼容流程
- ✅ 数据隔离：所有权益绑 user_id，空间权益绑 scope
- ✅ 安全合规：密钥、凭证、价格、学生证件按全局安全规则处理
- ✅ 跨端一致：与小程序蓝图、桌面端共享数据契约
- ✅ 测试可绑定：每个 Provider 都是独立模块，便于单元测试与契约测试
