# 星河宠记 — 技术设计文档

> 版本：v4.7
> 更新日期：2026-07-30
> 状态：已确认
> 变更说明：v4.7 架构审查修复——修正技术栈从Supabase BaaS到自建Express后端的描述不一致，修复SQL语法错误，补充SQL注入防护策略、WebSocket身份验证、限流标注、同步冲突字段级合并、测试策略完善等P0-P3共12项问题
> v4.6 补充Phase 1.5全部API接口契约（11个子模块，60+路由，完整请求/响应类型定义），新增前后端交互方案（数据流、WebSocket实时推送、三层缓存策略、异步任务队列）

---

## 一、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 小程序框架 | Taro 3 + React 19 + TypeScript | 一套代码跑小程序+H5 |
| 构建工具 | Vite | 开发体验好 |
| 状态管理 | Zustand | 轻量 |
| 样式方案 | Tailwind CSS + CSS Modules | 小程序兼容 |
| 后端框架 | Express 4 + TypeScript (ESM) | 自建后端，RESTful API |
| 数据库 | PostgreSQL 16 | 直连访问，参数化查询，无ORM |
| 认证 | JWT (jsonwebtoken) + 微信小程序登录 | 自建认证体系 |
| 实时通信 | ws (WebSocket) | 自建实时推送，替代Supabase Realtime |
| 文件存储 | 本地/对象存储 (S3兼容) | 宠物照片、视频、分享卡片存储 |
| 记忆引擎 | memory-body（自研，5层架构，18模块） | 核心壁垒，70%复用 |
| AI策略 | 规则引擎 → 小模型 → 大模型（分阶段） | MVP纯规则0成本 |
| 推送 | 微信订阅消息 | 疫苗提醒+异常预警+召回 |
| 宠物形象 | Seedream API | 照片→3种风格卡通形象 |
| 测试 | Vitest | 单元+组件+集成 |
| 代码规范 | ESLint + Prettier | 已有 |

> **架构变更说明**：项目早期设计基于 Supabase BaaS，后因数据隔离、权限控制、SQL注入防护等安全需求升级，迁移至自建 Express + PostgreSQL 后端。原 Supabase Realtime 由自建 WebSocket 服务替代，原 Supabase Edge Functions 由 Express 路由 + 异步任务队列替代。

---

## 二、系统架构

```
┌──────────────────────────────────────────────────┐
│                     用户端                        │
│  ┌────────────────────────────────────────────┐  │
│  │       微信小程序（Taro 3 + React）         │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  🗣️ AI对话层（唯一用户交互入口）     │  │  │
│  │  │  ├── 意图识别 + Guard（规则+AI双守卫）│  │  │
│  │  │  └── 分发：健康/时光/家庭/取名引擎    │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  引擎层                               │  │  │
│  │  │  ├── 健康引擎（打卡/症状/疫苗/趋势）  │  │  │
│  │  │  ├── 时光引擎（时间线/回忆/里程碑）   │  │  │
│  │  │  ├── 家庭引擎（家庭/族谱/看板/日历）  │  │  │
│  │  │  └── 取名引擎（解读/推荐）            │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  memory-body 引擎（本地优先）         │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────┴───────────────────────────┐
│                   自建后端                        │
│  ┌────────────────────────────────────────────┐  │
│  │       Express 4 + TypeScript (ESM)         │  │
│  │  ├── RESTful API（60+路由）                │  │
│  │  ├── JWT 认证中间件                        │  │
│  │  ├── 参数校验中间件（Zod）                  │  │
│  │  ├── 限流中间件（express-rate-limit）       │  │
│  │  ├── WebSocket 服务（ws）                   │  │
│  │  └── 异步任务队列（bullmq + Redis）         │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │          PostgreSQL 16                     │  │
│  │  ├── pet_families/moments/milestones/      │  │
│  │  ├── lineage/names/calendar/feeds/         │  │
│  │  ├── memoir/share_cards/yearly_reviews     │  │
│  │  └── 参数化查询（防SQL注入）                │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │          外部AI服务                         │  │
│  │  ├── DeepSeek/GLM-4（宠物对话）            │  │
│  │  ├── GLM-4v（照片描述）                    │  │
│  │  ├── 分类模型（Guard语义检测）              │  │
│  │  └── Seedream（宠物形象）                   │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │          文件存储                           │  │
│  │  └── S3兼容对象存储（照片/视频/卡片）       │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

情绪底层隐形化：不出现在功能列表和Tab Bar中，通过场景行为被动触发（宠物离世→悲伤陪伴，宠物生病→焦虑干预，新手频繁查询→焦虑缓解）。

---

## 三、数据库设计

### 3.1 用户与账户

```sql
users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  openid        TEXT UNIQUE NOT NULL
  unionid       TEXT
  nickname      TEXT
  avatar_url    TEXT
  created_at    TIMESTAMP DEFAULT NOW()
  last_active   TIMESTAMP DEFAULT NOW()
)

profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  display_name  TEXT
  bio           TEXT
  settings      JSONB DEFAULT '{}'::jsonb
  created_at    TIMESTAMP DEFAULT NOW()
  updated_at    TIMESTAMP DEFAULT NOW()
)

memberships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  tier          TEXT DEFAULT 'free'
  plan          TEXT
  price         DECIMAL
  payment_order_id TEXT
  expires_at    TIMESTAMP
  created_at    TIMESTAMP DEFAULT NOW()
  updated_at    TIMESTAMP DEFAULT NOW()
)
```

### 3.2 宠物数据（核心）

```sql
pet_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE
  name                TEXT NOT NULL
  species             TEXT NOT NULL
  breed               TEXT
  gender              TEXT
  birth_date          DATE
  weight              NUMERIC(5,2)
  avatar_photo_url    TEXT
  avatar_cartoon_url  TEXT
  avatar_style        TEXT
  avatar_generated_at TIMESTAMP
  is_deceased         BOOLEAN DEFAULT FALSE
  deceased_date       DATE
  created_at          TIMESTAMP DEFAULT NOW()
  updated_at          TIMESTAMP DEFAULT NOW()
)

CREATE INDEX idx_pet_profiles_user ON pet_profiles(user_id);

pet_health_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  pet_id          UUID REFERENCES pet_profiles(id) ON DELETE CASCADE
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE
  poop_level      INTEGER NOT NULL CHECK (poop_level BETWEEN 1 AND 5)
  appetite_level  INTEGER NOT NULL CHECK (appetite_level BETWEEN 1 AND 5)
  spirit_level    INTEGER NOT NULL CHECK (spirit_level BETWEEN 1 AND 5)
  exercise_level  INTEGER NOT NULL CHECK (exercise_level BETWEEN 1 AND 3)
  weight          NUMERIC(5,2)
  has_anomaly     BOOLEAN DEFAULT FALSE
  anomaly_items   TEXT[]
  ai_feedback     TEXT
  risk_level      TEXT DEFAULT 'low'
  note            TEXT
  created_at      TIMESTAMP DEFAULT NOW()
)

CREATE INDEX idx_health_entries_pet_date ON pet_health_entries(pet_id, created_at DESC);
CREATE INDEX idx_health_entries_anomaly ON pet_health_entries(has_anomaly) WHERE has_anomaly = TRUE;

pet_vaccinations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
  pet_id           UUID REFERENCES pet_profiles(id) ON DELETE CASCADE
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE
  vaccine_name     TEXT NOT NULL
  vaccine_type     TEXT NOT NULL
  scheduled_date   DATE NOT NULL
  completed_date   DATE
  is_overdue       BOOLEAN DEFAULT FALSE
  reminder_enabled BOOLEAN DEFAULT TRUE
  created_at       TIMESTAMP DEFAULT NOW()
)

CREATE INDEX idx_vaccinations_pet ON pet_vaccinations(pet_id, scheduled_date);
CREATE INDEX idx_vaccinations_overdue ON pet_vaccinations(is_overdue) WHERE is_overdue = TRUE;

pet_symptom_checks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
  pet_id            UUID REFERENCES pet_profiles(id) ON DELETE CASCADE
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE
  symptoms          TEXT[] NOT NULL
  duration          TEXT
  severity          TEXT
  additional_info   TEXT
  ai_urgency_level  TEXT NOT NULL
  ai_suggestion     TEXT
  knowledge_match   JSONB
  created_at        TIMESTAMP DEFAULT NOW()
)

CREATE INDEX idx_symptom_checks_pet ON pet_symptom_checks(pet_id, created_at DESC);

pet_food_queries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE
  food_name       TEXT NOT NULL
  safety_level    TEXT NOT NULL
  detail          JSONB
  breed_warnings  JSONB
  is_member_query BOOLEAN DEFAULT FALSE
  created_at      TIMESTAMP DEFAULT NOW()
)

CREATE INDEX idx_food_queries_user ON pet_food_queries(user_id, created_at DESC);
```

### 3.2b 宠物家庭（新增）

```sql
pet_families (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

pet_family_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  pet_id     UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  role       TEXT,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, pet_id)
);

pet_lineage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  child_id     UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  litter_date  DATE,
  UNIQUE(parent_id, child_id)
);

### 3.2c 时光引擎（新增）

```sql
pet_moments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id   UUID REFERENCES pet_families(id),
  pet_id      UUID REFERENCES pet_profiles(id),
  type        TEXT NOT NULL,
  content     JSONB NOT NULL,
  photos      TEXT[],
  ai_summary  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_moments_family ON pet_moments(family_id, created_at DESC);
CREATE INDEX idx_moments_pet ON pet_moments(pet_id, created_at DESC);
CREATE INDEX idx_moments_user ON pet_moments(user_id, created_at DESC);

pet_milestones (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id    UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  title     TEXT NOT NULL,
  date      DATE NOT NULL,
  type      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_milestones_pet ON pet_milestones(pet_id, date DESC);

### 3.2d 取名引擎（新增）

```sql
pet_names (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id    UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  chosen    BOOLEAN DEFAULT FALSE,
  analysis  JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pet_id, name)
);

### 3.2e 家庭日历（新增）

```sql
-- 家庭日历事件表
pet_calendar_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  pet_id        UUID REFERENCES pet_profiles(id),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  event_date    DATE NOT NULL,
  end_date      DATE,
  reminder_config JSONB DEFAULT '{}'::jsonb,
  source        TEXT DEFAULT 'manual',
  source_ref    TEXT,
  status        TEXT DEFAULT 'pending',
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_calendar_events_family ON pet_calendar_events(family_id, event_date);
CREATE INDEX idx_calendar_events_pet ON pet_calendar_events(pet_id, event_date);
CREATE INDEX idx_calendar_events_status ON pet_calendar_events(status) WHERE status = 'pending';

-- 日历提醒记录
pet_calendar_reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES pet_calendar_events(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  sent          BOOLEAN DEFAULT FALSE,
  sent_at       TIMESTAMPTZ,
  channel       TEXT DEFAULT 'subscribe_msg',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_calendar_reminders_date ON pet_calendar_reminders(reminder_date) WHERE sent = FALSE;
```

### 3.2f 家族图谱与角色（新增）

```sql
-- 宠物关系（血缘+非血缘）
pet_relationships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  pet_id_a      UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  pet_id_b      UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  direction     TEXT,
  label_a       TEXT,
  label_b       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pet_id_a, pet_id_b, relation_type)
);
CREATE INDEX idx_relationships_family ON pet_relationships(family_id);

-- 家族图谱快照（分享和版本追溯）
pet_family_graph_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  layout_type   TEXT NOT NULL,
  graph_data    JSONB NOT NULL,
  thumbnail_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 宠物角色
pet_roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id        UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  role_type     TEXT NOT NULL,
  assignment    TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pet_id, role_type)
);
CREATE INDEX idx_roles_family ON pet_roles(family_id);
```

### 3.2g 家庭动态墙与周报（新增）

```sql
-- 家庭动态墙
pet_family_feeds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  pet_id        UUID REFERENCES pet_profiles(id),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feed_type     TEXT NOT NULL,
  content       TEXT NOT NULL,
  photos        TEXT[],
  ai_generated  BOOLEAN DEFAULT FALSE,
  source_ref    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_feeds_family ON pet_family_feeds(family_id, created_at DESC);
CREATE INDEX idx_feeds_type ON pet_family_feeds(family_id, feed_type);

-- 家庭周报
pet_family_weekly_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE,
  week_number   INTEGER NOT NULL,
  year          INTEGER NOT NULL,
  report_data   JSONB NOT NULL,
  ai_insight    TEXT,
  share_card_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, year, week_number)
);
CREATE INDEX idx_weekly_reports_family ON pet_family_weekly_reports(family_id, year DESC, week_number DESC);
```

### 3.2h Guard守卫日志（新增）

```sql
-- 守卫拦截日志（脱敏存储 + 自动清理）
guard_intercept_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  pet_id        UUID,
  input_text    TEXT NOT NULL,           -- 脱敏后存储，见下方说明
  input_hash    TEXT NOT NULL,           -- SHA256哈希，用于去重和溯源
  guard_layer   TEXT NOT NULL,
  rule_category TEXT,
  risk_scores   JSONB,
  action        TEXT NOT NULL,
  response      TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')  -- 30天自动清理
);
CREATE INDEX idx_guard_logs_time ON guard_intercept_logs(created_at DESC);
CREATE INDEX idx_guard_logs_user ON guard_intercept_logs(user_id);
CREATE INDEX idx_guard_logs_category ON guard_intercept_logs(rule_category);
CREATE INDEX idx_guard_logs_expires ON guard_intercept_logs(expires_at) WHERE expires_at IS NOT NULL;
```

> **隐私保护说明**：
> 1. `input_text` 存储前必须脱敏：替换手机号、身份证号、银行卡号为 `***`，保留文本语义供审计
> 2. 30天后由定时任务自动删除原文，仅保留 `input_hash` 和 `rule_category` 用于统计分析
> 3. 脱敏函数：`maskSensitiveData(inputText)` → 替换正则匹配的敏感信息后存储
> 4. 审计需要查看原文时，需管理员权限 + 操作日志记录

### 3.2i 取名引擎扩展（新增）

```sql
-- 取名历史
pet_name_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode            TEXT NOT NULL,
  input_params    JSONB NOT NULL,
  candidates      JSONB NOT NULL,
  selected_name   TEXT,
  interpretation  JSONB,
  couplet         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 取名知识库缓存
pet_name_knowledge_cache (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key         TEXT UNIQUE NOT NULL,
  five_elements_analysis JSONB,
  star_mapping      JSONB,
  recommended_names JSONB[],
  usage_count       INTEGER DEFAULT 1,
  last_used_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2j 宠物回忆录（新增）

```sql
-- 回忆录记录
pet_memoir_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id        UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  memoir_type   TEXT NOT NULL,
  status        TEXT DEFAULT 'pending',
  source_photos TEXT[] NOT NULL,
  source_text   TEXT,
  narrative_structure JSONB,
  video_url     TEXT,
  preview_url   TEXT,
  cost_credits  INTEGER,
  payment_id    UUID,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);
CREATE INDEX idx_memoir_records_user ON pet_memoir_records(user_id, created_at DESC);
CREATE INDEX idx_memoir_records_status ON pet_memoir_records(status) WHERE status = 'pending';
```

### 3.2k 分享卡片（新增）

```sql
-- 分享卡片记录
share_cards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_type     TEXT NOT NULL,
  card_data     JSONB NOT NULL,
  card_url      TEXT,
  share_channel TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_share_cards_user ON share_cards(user_id, created_at DESC);
CREATE INDEX idx_share_cards_type ON share_cards(card_type, created_at DESC);
```

### 3.2l 年度回忆图集（新增）

```sql
-- 年度回忆图集
pet_yearly_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id        UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE,
  year          INTEGER NOT NULL,
  status        TEXT DEFAULT 'draft',
  review_data   JSONB NOT NULL,
  cover_url     TEXT,
  video_url     TEXT,
  paid          BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pet_id, year)
);
CREATE INDEX idx_yearly_reviews_user ON pet_yearly_reviews(user_id, year DESC);
```

### 3.3 情绪底层（隐形化）

```sql
emotion_triggers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  pet_id        UUID REFERENCES pet_profiles(id)
  scene         TEXT NOT NULL
  trigger_type  TEXT NOT NULL
  user_action   TEXT
  created_at    TIMESTAMP DEFAULT NOW()
)

pet_grief_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  pet_id        UUID REFERENCES pet_profiles(id)
  step_naming   JSONB
  step_writing  JSONB
  step_connect  JSONB
  step_closing  JSONB
  mood_before   INTEGER
  mood_after    INTEGER
  created_at    TIMESTAMP DEFAULT NOW()
)
```

### 3.4 会员与付费

```sql
usage_quotas (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE
  date                 DATE NOT NULL
  food_queries_count   INTEGER DEFAULT 0
  symptom_checks_count INTEGER DEFAULT 0
  trend_days_viewed    INTEGER DEFAULT 0
  UNIQUE(user_id, date)
)
```

### 3.5 基础设施

```sql
behavior_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  action        TEXT NOT NULL
  page          TEXT
  timestamp     TIMESTAMP DEFAULT NOW()
  metadata      JSONB
)

sync_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  table_name    TEXT NOT NULL
  record_id     UUID NOT NULL
  action        TEXT NOT NULL
  data          JSONB
  synced        BOOLEAN DEFAULT FALSE
  created_at    TIMESTAMP DEFAULT NOW()
)

pet_knowledge_base (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  type          TEXT NOT NULL
  version       TEXT NOT NULL
  updated_at    TIMESTAMP DEFAULT NOW()
  source        TEXT
)

hospital_referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  pet_id        UUID REFERENCES pet_profiles(id)
  urgency_level TEXT
  source        TEXT
  clicked_at    TIMESTAMP DEFAULT NOW()
)
```

---

## 四、memory-body引擎改造方案

### 4.1 现有18模块映射

| 现有模块 | 新用途 | 改造说明 |
|---------|--------|---------|
| memoryBodyTypes | 扩展宠物相关类型 | 新增PetHealthEntry、PetProfile、PetVaccination等类型 |
| memoryBodyConfig | 更新配置 | 新增宠物健康分析、推送频率、安全阈值等配置 |
| memoryBodyGuards | 更新校验 | 新增宠物数据校验（poop_level 1-5等） |
| memoryBodyStore | 不变 | 直接复用 |
| inMemoryMemoryBodyStore | 不变 | 直接复用 |
| browserMemoryBodyStore | 适配小程序存储 | 从localStorage改为Taro.setStorage |
| memoryIngestor | 扩展摄入源 | 新增健康打卡、症状初筛、食物查询摄入 |
| memoryGraph | 扩展节点类型 | 新增宠物健康节点、症状关联节点、品种特征节点 |
| memoryRetrieval | 扩展查询 | 新增健康趋势查询、症状历史查询、品种关联查询 |
| memoryEvolution | 扩展演化逻辑 | 新增健康模式演化、疫苗提醒触发、异常模式学习 |
| memoryDecay | 不变 | 直接复用 |
| contradictionDetector | 扩展检测 | 新增健康矛盾检测（说"正常"但连续3天食欲下降） |
| memoryPrivacyGuard | 保留 | 直接复用，新增宠物健康数据分级 |
| sensitiveMemoryClassifier | 扩展分类 | 新增宠物健康数据敏感分级（悲伤记录=encrypted） |
| forbiddenMemoryFilter | 不变 | 直接复用 |
| agentChatMemoryAdapter | 改造 | 从对话适配改为宠物健康对话适配 |
| promptContextComposer | 改造 | 从提示词组合改为宠物健康上下文组合 |
| memoryFeedback | 扩展 | 新增干预效果反馈（就医后追踪恢复情况） |
| localFirstCloudOptional | 适配小程序 | 同步逻辑适配微信小程序 |

### 4.2 新增模块

| 新模块 | 功能 | 说明 |
|--------|------|------|
| petSafetyHandler | P0阻断项 | 有毒建议拦截、红色预警触发、医疗边界声明 |
| healthTrendAnalyzer | 健康趋势分析 | 体重/食欲/便便趋势、异常检测、月度总结 |
| vaccineReminderEngine | 疫苗提醒引擎 | 到期检测、推送调度、完成追踪 |
| symptomRuleEngine | 症状规则引擎 | 症状→紧急度映射、知识图谱匹配、保守策略 |
| petAvatarEngine | 宠物形象引擎 | Seedream API调用、SVG表情叠加、状态映射 |

### 4.3 数据流

```
用户打卡
  ↓
memoryIngestor（摄入）
  ↓
memoryGraph（构建图谱）
  ↓
healthTrendAnalyzer（趋势分析）
  ↓
petSafetyHandler（安全拦截）
  ├── 正常 → AI反馈弹窗（绿色提示）
  ├── 1项异常 → AI反馈弹窗（黄色关注）
  ├── 2项异常 → AI反馈弹窗（橙色建议）
  └── 3项+异常/血便 → 红色预警弹窗（不可关闭）

用户症状初筛
  ↓
symptomRuleEngine（规则评估）
  ↓
petSafetyHandler（安全拦截）
  ├── 🟢绿色 → 继续观察
  ├── 🟡黄色 → 家庭观察+护理建议
  ├── 🟠橙色 → 24小时内就医
  └── 🔴红色 → 立即去急诊

疫苗到期
  ↓
vaccineReminderEngine（到期检测）
  ↓
微信订阅消息推送
  ├── 到期前7天提醒
  ├── 到期当天提醒
  └── 逾期3天提醒
```

---

## 五、核心引擎设计

### 5.1 PetSafetyHandler（P0阻断项，最优先开发）

```typescript
type SafetyAction = 'allow' | 'warn' | 'block' | 'emergency'

interface SafetyResult {
  action: SafetyAction
  message: string
  disclaimer: string
  canDismiss: boolean
  delaySeconds: number
}

interface PetSafetyHandler {
  checkFoodSafety(safetyLevel: FoodSafetyLevel): SafetyResult
  checkHealthAnomaly(entry: PetHealthEntry): SafetyResult
  checkSymptomUrgency(urgency: UrgencyLevel): SafetyResult
  attachDisclaimer(content: string): string
}

const MEDICAL_DISCLAIMER = '⚠️ 以上建议仅供参考，不替代兽医诊断。宠物出现健康问题请及时就医。'

function checkFoodSafety(safetyLevel: FoodSafetyLevel): SafetyResult {
  if (safetyLevel === 'toxic') {
    return {
      action: 'block',
      message: '🚫 绝对不能吃！如果已经食用，请立即联系宠物医院。',
      disclaimer: MEDICAL_DISCLAIMER,
      canDismiss: false,
      delaySeconds: 3
    }
  }
  if (safetyLevel === 'dangerous') {
    return {
      action: 'warn',
      message: '⚠️ 有风险，需特别注意。',
      disclaimer: MEDICAL_DISCLAIMER,
      canDismiss: true,
      delaySeconds: 0
    }
  }
  return {
    action: 'allow',
    message: '',
    disclaimer: MEDICAL_DISCLAIMER,
    canDismiss: true,
    delaySeconds: 0
  }
}

function checkHealthAnomaly(entry: PetHealthEntry): SafetyResult {
  const hasBloodyStool = entry.poop_level === 5
  const hasNoAppetite = entry.appetite_level === 4
  const isLethargic = entry.spirit_level === 5
  const anomalyCount = [entry.poop_level > 2, entry.appetite_level > 2, entry.spirit_level > 2, entry.exercise_level === 1].filter(Boolean).length

  if (hasBloodyStool || (hasNoAppetite && isLethargic)) {
    return {
      action: 'emergency',
      message: '🔴 检测到严重异常信号，建议立即带毛孩子去急诊医院！',
      disclaimer: MEDICAL_DISCLAIMER,
      canDismiss: false,
      delaySeconds: 3
    }
  }
  if (anomalyCount >= 3) {
    return {
      action: 'emergency',
      message: '🟠 多个指标异常，建议尽快带毛孩子去医院检查。',
      disclaimer: MEDICAL_DISCLAIMER,
      canDismiss: false,
      delaySeconds: 3
    }
  }
  if (anomalyCount >= 2) {
    return {
      action: 'warn',
      message: '🟡 有2个指标不太对，建议关注。如果持续2天建议就医。',
      disclaimer: MEDICAL_DISCLAIMER,
      canDismiss: true,
      delaySeconds: 0
    }
  }
  if (anomalyCount >= 1) {
    return {
      action: 'warn',
      message: '注意到异常项，继续观察，如果明天还这样告诉我。',
      disclaimer: MEDICAL_DISCLAIMER,
      canDismiss: true,
      delaySeconds: 0
    }
  }
  return {
    action: 'allow',
    message: '毛孩子今天状态不错👍',
    disclaimer: '',
    canDismiss: true,
    delaySeconds: 0
  }
}
```

保守策略原则：宁可误报不可漏报。所有AI建议必须附带医疗边界声明。红色预警弹窗不可关闭，展示≥3秒后按钮才可点击。

### 5.2 症状规则引擎

```typescript
type UrgencyLevel = 'green' | 'yellow' | 'orange' | 'red'

interface SymptomRule {
  symptoms: string[]
  conditions: {
    duration?: string
    severity?: string
    species?: string
    breed?: string
    ageRange?: [number, number]
  }
  urgency: UrgencyLevel
  suggestion: string
  knowledgeRef: string
}

interface SymptomCheckResult {
  urgency: UrgencyLevel
  suggestion: string
  personalContext: string
  knowledgeMatch: object
  disclaimer: string
}

interface SymptomRuleEngine {
  evaluate(symptoms: string[], petProfile: PetProfile, recentEntries: PetHealthEntry[], additionalInfo: string): SymptomCheckResult
}

const RED_TRIGGERS = ['bloody_stool', 'seizure', 'difficulty_breathing', 'toxic_ingestion']
const ORANGE_TRIGGERS = ['persistent_vomiting', 'not_eating_3days', 'multiple_symptoms_3days']
const YELLOW_TRIGGERS = ['vomiting', 'diarrhea', 'lethargy', 'not_eating']

function evaluateUrgency(symptoms: string[], duration: string, severity: string, petProfile: PetProfile, recentEntries: PetHealthEntry[]): UrgencyLevel {
  if (symptoms.some(s => RED_TRIGGERS.includes(s))) return 'red'
  if (symptoms.some(s => ORANGE_TRIGGERS.includes(s)) || (symptoms.length >= 2 && duration === '3days+')) return 'orange'
  if (symptoms.some(s => YELLOW_TRIGGERS.includes(s)) || symptoms.length >= 2) return 'yellow'
  return 'green'
}
```

4步流程状态机：选择症状 → 补充信息 → AI评估 → 结果展示。每步可返回上一步。评估结果基于记忆的个性化判断（调取宠物档案+近7天打卡+知识图谱匹配）。

### 5.3 健康趋势分析引擎

```typescript
interface TrendData {
  type: 'weight' | 'appetite' | 'poop'
  dataPoints: { date: string; value: number }[]
  baseline: number
  anomalies: { date: string; description: string }[]
}

interface MonthlyReport {
  petId: string
  month: string
  weightChange: { from: number; to: number; percent: number; inRange: boolean }
  appetiteSummary: { normalDays: number; abnormalDays: number; pattern: string }
  poopSummary: { normalDays: number; abnormalDays: number; pattern: string }
  anomalies: { date: string; items: string[]; resolution: string }[]
  aiInsight: string
}

interface HealthTrendAnalyzer {
  getTrend(petId: string, type: string, days: number): TrendData
  detectAnomaly(petId: string, recentEntries: PetHealthEntry[]): boolean
  generateMonthlyReport(petId: string, month: string): MonthlyReport
}

function detectAnomaly(recentEntries: PetHealthEntry[]): boolean {
  if (recentEntries.length < 3) return false
  const baseline = calculateBaseline(recentEntries.slice(0, -3))
  const recent = recentEntries.slice(-3)
  const deviation = recent.filter(e => Math.abs(e.appetite_level - baseline.appetite) > 1).length
  return deviation >= 3
}
```

异常检测算法：连续3天偏离基线→标记异常。体重偏离品种范围±15%→关注。月度健康总结由规则引擎模板生成（MVP阶段0 AI成本）。

### 5.4 疫苗提醒引擎

```typescript
interface VaccineSchedule {
  species: string
  schedule: { age: string; vaccine: string; type: string }[]
}

interface VaccineReminder {
  petId: string
  petName: string
  vaccineName: string
  scheduledDate: Date
  status: 'upcoming' | 'due' | 'overdue'
  daysUntilDue: number
}

interface VaccineReminderEngine {
  generateSchedule(petProfile: PetProfile): PetVaccination[]
  checkDue(petId: string): VaccineReminder[]
  markComplete(vaccineId: string, completedDate: Date): PetVaccination
  scheduleReminder(reminder: VaccineReminder): void
}

function checkDueStatus(scheduledDate: Date): 'upcoming' | 'due' | 'overdue' {
  const now = new Date()
  const diffDays = Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'due'
  return 'upcoming'
}
```

WSAVA模板自动排期：添加宠物后根据品种+年龄自动生成疫苗计划。到期检测分3档：逾期/7天内/30天内。微信订阅消息推送调度：到期前7天、到期当天、逾期3天各推送1次。

### 5.5 宠物形象引擎

```typescript
type AvatarStyle = 'q_cute' | 'japanese_healing' | 'american_cartoon'
type PetExpression = 'happy' | 'concerned' | 'worried' | 'anxious' | 'sleepy' | 'proud' | 'excited' | 'sad' | 'celebrating'

interface PetAvatarEngine {
  generateCartoon(photoUrl: string, style: AvatarStyle): Promise<string>
  getExpression(healthStatus: HealthStatus): PetExpression
  getExpressionSvg(expression: PetExpression): string
  getStatusMapping(entry: PetHealthEntry): PetExpression
}

function getStatusMapping(entry: PetHealthEntry): PetExpression {
  const anomalyCount = countAnomalies(entry)
  if (entry.poop_level === 5 || (entry.appetite_level === 4 && entry.spirit_level === 5)) return 'anxious'
  if (anomalyCount >= 3) return 'worried'
  if (anomalyCount >= 2) return 'concerned'
  if (anomalyCount >= 1) return 'concerned'
  return 'happy'
}
```

Seedream API调用：用户上传照片→生成3种风格卡通→用户选1种。SVG表情叠加层：6种基础表情（开心/关注/担心/焦急/打瞌睡/骄傲）+3种特殊表情（兴奋/悲伤/庆祝），0 AI成本纯前端。状态映射：健康打卡结果→自动切换表情。

### 5.6 AI Guard（P0 - 双层守卫）

**规则 Guard（0成本）**：
- P0关键词阻断：毒品/自杀/虐待动物
- 宠物安全规则：500+有毒物质匹配
- 隐私泄露：手机号/身份证正则
- 输出清洗：<100字符限制

**AI Guard（~0.0005元/次）**：
- 输入前：分类模型判断有害意图（0-10分）
- 输出后：检查AI回答是否包含不安全医疗建议
- 情绪检测：用户是否处于危机状态

**危机响应**：极危→阻断AI+危机弹窗+热线；中等→不阻断+温暖验证

### 5.7 取名引擎

**方式A（用户有想法）**：输入名字→调用AI模型→从五行/星象/诗词/典故分析
**方式B（用户没想法）**：提供品种+出生日期+季节→调用AI模型→推荐3-5个名字

**数据源**：五行八卦、二十八星宿、古诗词/楚辞/诗经、山川地名、文化典故

### 5.8 时光引擎

**时间线统一存储**：所有回忆事件存入 pet_moments 表
**与健康数据隔离**：时间线只包含用户主动发布的内容，不混入打卡数据
**AI辅助**：照片上传→AI自动生成描述文案；旧时光→AI智能选择+避免伤心回忆

---

## 六、接口设计

### 6.0 API 限流策略（全局）

> 所有接口限流通过 `express-rate-limit` 中间件实现，按IP+用户ID维度限流。

| 接口分类 | 路径前缀 | 限流规则 | 说明 |
|---------|---------|---------|------|
| 照片上传 | `/api/photo/upload` | 10次/分钟 | 防止滥用存储 |
| 2D形象生成 | `/api/pet-avatar/generate` | 5次/分钟 | AI算力资源限制 |
| 3D形象生成 | `/api/pet-avatar/generate-3d` | 5次/分钟 | AI算力资源限制 |
| AI对话 | `/api/chat/message` | 30次/分钟 | 防止刷接口 |
| 回忆录生成 | `/api/memoir/create` | 3次/分钟 | 视频生成资源限制 |
| 取名引擎 | `/api/naming/generate` | 10次/分钟 | AI算力资源限制 |
| 症状初筛 | `/api/pets/:id/symptom-check` | 10次/分钟 | 防止滥用AI |
| 食物查询 | `/api/food/query` | 30次/分钟 | 查询类接口 |
| 同步接口 | `/api/sync/push` | 10次/分钟 | 防止批量冲击 |
| 通用读写 | `/api/*`（其他） | 60次/分钟 | 全局限流兜底 |

> 限流触发后返回 HTTP 429，错误码 `100003`，响应头包含 `X-RateLimit-Remaining` 和 `X-RateLimit-Reset`。

### 6.1 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/wx-login` | 微信登录（code换openid） |
| GET | `/api/auth/profile` | 获取用户信息 |
| PUT | `/api/auth/profile` | 更新用户信息 |

### 6.2 宠物档案 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/pets` | 添加宠物 |
| GET | `/api/pets` | 获取宠物列表 |
| GET | `/api/pets/:id` | 获取宠物详情 |
| PUT | `/api/pets/:id` | 更新宠物信息 |
| DELETE | `/api/pets/:id` | 删除宠物 |
| POST | `/api/pets/:id/deceased` | 标记宠物离世 |

### 6.3 健康打卡

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/pets/:id/checkin` | 提交打卡 |
| GET | `/api/pets/:id/checkin/today` | 今日打卡 |
| GET | `/api/pets/:id/checkin/history` | 打卡历史 |

### 6.4 食物安全查询

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/food/query?keyword=xxx` | 查询食物安全 |
| GET | `/api/food/history` | 查询历史 |

### 6.5 症状初筛

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/pets/:id/symptom-check` | 提交症状初筛 |
| GET | `/api/pets/:id/symptom-check/history` | 初筛历史 |

### 6.6 疫苗驱虫

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/pets/:id/vaccines` | 获取疫苗计划 |
| POST | `/api/pets/:id/vaccines` | 添加疫苗记录 |
| PUT | `/api/pets/:id/vaccines/:vaccineId/complete` | 标记完成 |
| PUT | `/api/pets/:id/vaccines/:vaccineId/reminder` | 设置提醒 |

### 6.7 健康趋势

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/pets/:id/trends?type=weight\|appetite\|poop&days=7\|30\|90` | 趋势数据 |
| GET | `/api/pets/:id/trends/report` | 月度报告 |

### 6.8 宠物形象

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/pet-avatar/generate` | 生成卡通形象 |
| POST | `/api/pet-avatar/select` | 选择风格 |
| GET | `/api/pet-avatar/expression` | 获取表情SVG |

### 6.9 会员与付费

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/membership/status` | 会员状态 |
| POST | `/api/membership/subscribe` | 订阅 |
| POST | `/api/membership/cancel` | 取消 |
| GET | `/api/membership/usage` | 使用配额 |

### 6.10 情绪底层

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/emotion/trigger` | 记录情绪触发 |
| POST | `/api/pets/:id/grief` | 宠物离世悲伤陪伴 |

### 6.11 同步

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/sync/push` | 推送本地数据 |
| GET | `/api/sync/pull` | 拉取云端数据 |

### 6.12 Phase 1.5 新增模块接口

#### 6.12.1 家庭管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/families` | 创建家庭 |
| GET | `/api/families` | 获取家庭列表 |
| GET | `/api/families/:id` | 获取家庭详情 |
| PUT | `/api/families/:id` | 更新家庭信息 |
| DELETE | `/api/families/:id` | 删除家庭 |
| POST | `/api/families/:id/members` | 添加家庭成员（宠物） |
| DELETE | `/api/families/:id/members/:petId` | 移除家庭成员 |
| GET | `/api/families/:id/members` | 获取家庭成员列表 |
| PUT | `/api/families/:id/members/:petId/role` | 更新成员角色 |

```typescript
// 请求类型
interface CreateFamilyRequest {
  name: string
  avatar_url?: string
}

interface UpdateFamilyRequest {
  name?: string
  avatar_url?: string
}

interface AddMemberRequest {
  pet_id: string
  role?: 'parent' | 'child' | 'sibling' | 'companion' | 'guardian'
}

interface UpdateMemberRoleRequest {
  role: string
}

// 响应类型
interface FamilyResponse {
  id: string
  name: string
  avatar_url: string | null
  member_count: number
  pet_count: number
  created_at: string
  updated_at: string
}

interface FamilyMemberResponse {
  id: string
  pet_id: string
  pet_name: string
  pet_avatar_url: string | null
  species: string
  breed: string | null
  role: string | null
  joined_at: string
}
```

#### 6.12.2 家族图谱

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/families/:id/tree` | 获取家族图谱数据 |
| POST | `/api/families/:id/relationships` | 创建宠物关系 |
| DELETE | `/api/families/:id/relationships/:relId` | 删除关系 |
| PUT | `/api/families/:id/relationships/:relId` | 更新关系标签 |
| POST | `/api/families/:id/lineage` | 添加血缘关系 |
| GET | `/api/families/:id/lineage/:petId` | 获取某宠物的血亲树 |
| POST | `/api/families/:id/tree/snapshot` | 保存图谱快照 |
| GET | `/api/families/:id/tree/snapshots` | 获取历史快照列表 |

```typescript
// 请求类型
interface CreateRelationshipRequest {
  pet_id_a: string
  pet_id_b: string
  relation_type: 'friend' | 'rival' | 'companion' | 'parent_child' | 'sibling' | 'mate' | 'other'
  direction?: 'a_to_b' | 'b_to_a' | 'mutual'  // 方向性关系
  label_a?: string  // pet_a视角的称呼
  label_b?: string  // pet_b视角的称呼
}

interface CreateLineageRequest {
  parent_id: string
  child_id: string
  litter_date?: string  // 同胎日期
}

interface UpdateRelationshipRequest {
  label_a?: string
  label_b?: string
}

// 响应类型
interface RelationshipResponse {
  id: string
  pet_id_a: string
  pet_id_b: string
  pet_a_name: string
  pet_b_name: string
  relation_type: string
  direction: string | null
  label_a: string | null
  label_b: string | null
  created_at: string
}

interface FamilyTreeResponse {
  nodes: TreeNode[]
  edges: RelationshipEdge[]
}

interface TreeNode {
  id: string        // pet_id
  name: string
  avatar_url: string | null
  species: string
  role: string | null  // 在家庭中的角色
  is_deceased: boolean
  metadata?: {
    birth_date?: string
    breed?: string
  }
}

interface RelationshipEdge {
  id: string
  source: string    // pet_id_a
  target: string    // pet_id_b
  type: string      // relation_type
  label: string     // 显示标签
  direction: 'forward' | 'backward' | 'mutual'
}

interface LineageTreeResponse {
  pet: TreeNode
  parents: TreeNode[]
  children: TreeNode[]
  siblings: TreeNode[]
  mates: TreeNode[]
}

interface GraphSnapshotResponse {
  id: string
  layout_type: string
  thumbnail_url: string | null
  created_at: string
}
```

#### 6.12.3 家庭日历

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/families/:id/calendar` | 获取日历事件列表（支持日期范围） |
| POST | `/api/families/:id/calendar` | 创建日历事件 |
| GET | `/api/families/:id/calendar/:eventId` | 获取事件详情 |
| PUT | `/api/families/:id/calendar/:eventId` | 更新事件 |
| DELETE | `/api/families/:id/calendar/:eventId` | 删除事件 |
| PUT | `/api/families/:id/calendar/:eventId/complete` | 标记事件完成 |
| GET | `/api/families/:id/calendar/upcoming` | 获取即将到来事件 |
| GET | `/api/families/:id/calendar/timeline` | 获取时间线视图数据 |

```typescript
// 请求类型
interface CreateCalendarEventRequest {
  pet_id?: string
  event_type: 'vaccine' | 'deworm' | 'birthday' | 'anniversary' | 'vet_visit' | 'grooming' | 'adoption' | 'other'
  title: string
  description?: string
  event_date: string        // YYYY-MM-DD
  end_date?: string         // 跨天事件
  reminder_config?: {
    advance_days: number[]  // 提前天数，如 [7, 3, 1]
    quiet_hours?: { start: string; end: string }  // 免打扰时段
    channel?: 'subscribe_msg' | 'in_app'
  }
}

interface UpdateCalendarEventRequest {
  title?: string
  description?: string
  event_date?: string
  end_date?: string
  event_type?: string
  reminder_config?: object
  status?: 'pending' | 'completed' | 'cancelled'
}

// 查询参数
interface CalendarQueryParams {
  start_date?: string   // YYYY-MM-DD，默认当月1号
  end_date?: string     // YYYY-MM-DD，默认当月最后一天
  event_type?: string   // 筛选事件类型
  status?: string       // 筛选状态
  pet_id?: string       // 筛选某宠物
}

// 响应类型
interface CalendarEventResponse {
  id: string
  family_id: string
  pet_id: string | null
  pet_name: string | null
  user_id: string
  event_type: string
  title: string
  description: string | null
  event_date: string
  end_date: string | null
  reminder_config: {
    advance_days: number[]
    quiet_hours?: { start: string; end: string }
    channel: string
  }
  source: 'manual' | 'vaccine_auto' | 'deworm_auto' | 'birthday_auto'
  status: 'pending' | 'completed' | 'cancelled'
  completed_at: string | null
  created_at: string
}

interface UpcomingEventsResponse {
  today: CalendarEventResponse[]
  tomorrow: CalendarEventResponse[]
  this_week: CalendarEventResponse[]
  overdue: CalendarEventResponse[]  // 已过期未完成
}

interface CalendarTimelineResponse {
  year: number
  month: number
  weeks: {
    week_number: number    // 当月第几周
    start_date: string
    end_date: string
    events: CalendarEventResponse[]
    summary: {
      vaccine_count: number
      birthday_count: number
      vet_count: number
      total: number
    }
  }[]
}
```

#### 6.12.4 家庭动态墙

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/families/:id/feeds` | 获取动态列表（分页） |
| POST | `/api/families/:id/feeds` | 发布动态 |
| DELETE | `/api/families/:id/feeds/:feedId` | 删除动态 |
| PUT | `/api/families/:id/feeds/:feedId` | 编辑动态 |
| GET | `/api/families/:id/feeds/highlight` | 获取精选动态 |

```typescript
// 请求类型
interface CreateFeedRequest {
  pet_id?: string
  feed_type: 'moment' | 'achievement' | 'health_milestone' | 'family_event'
  content: string
  photos?: string[]
}

interface UpdateFeedRequest {
  content?: string
  photos?: string[]
}

// 查询参数
interface FeedQueryParams {
  page?: number
  page_size?: number
  feed_type?: string
  pet_id?: string
  date_from?: string
  date_to?: string
}

// 响应类型
interface FeedResponse {
  id: string
  family_id: string
  pet_id: string | null
  pet_name: string | null
  pet_avatar_url: string | null
  user_id: string
  feed_type: string
  type_label: string    // 展示用中文标签
  content: string
  photos: string[]
  ai_generated: boolean
  like_count: number
  comment_count: number
  created_at: string
}

interface FeedListResponse {
  items: FeedResponse[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

interface HighlightFeedResponse {
  items: FeedResponse[]
  summary: {
    total_count: number
    this_month_count: number
    top_type: string
  }
}
```

#### 6.12.5 家庭周报

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/families/:id/weekly-reports` | 获取周报列表 |
| GET | `/api/families/:id/weekly-reports/latest` | 获取最新周报 |
| POST | `/api/families/:id/weekly-reports/generate` | 手动生成周报 |
| GET | `/api/families/:id/weekly-reports/:reportId` | 获取周报详情 |

```typescript
// 响应类型
interface WeeklyReportResponse {
  id: string
  family_id: string
  week_number: number
  year: number
  report_data: {
    health: {
      checkin_count: number          // 本周打卡次数
      avg_poop: number               // 平均便便评分
      avg_appetite: number           // 平均食欲评分
      avg_spirit: number             // 平均精神评分
      anomaly_count: number          // 异常次数
      best_day: string               // 状态最好的一天
    }
    activities: {
      symptom_checks: number         // 症状初筛次数
      food_queries: number           // 食物查询次数
      new_moments: number            // 新增回忆数
      new_milestones: number         // 新增里程碑数
    }
    family: {
      feed_count: number             // 动态数
      new_events: number             // 新增日历事件
      active_pets: number            // 活跃宠物数
      interactions: {                // 宠物互动统计
        pet_id: string
        pet_name: string
        attention_count: number      // 被关注次数
      }[]
    }
    hot_topic: string                // 本周热门话题（AI生成）
  }
  ai_insight: string | null         // AI洞察总结
  share_card_url: string | null
  created_at: string
}

interface WeeklyReportListResponse {
  items: {
    id: string
    week_number: number
    year: number
    summary: string                  // 简短摘要
    share_card_url: string | null
    created_at: string
  }[]
  total: number
}
```

#### 6.12.6 排行与角色

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/families/:id/leaderboard` | 获取家庭排行 |
| GET | `/api/families/:id/roles` | 获取角色分配 |
| POST | `/api/families/:id/roles` | 分配角色 |
| PUT | `/api/families/:id/roles/:roleId` | 更新角色 |
| DELETE | `/api/families/:id/roles/:roleId` | 移除角色 |

```typescript
// 请求类型
interface AssignRoleRequest {
  pet_id: string
  role_type: 'guardian' | 'comedian' | 'sleepyhead' | 'gourmet' | 'athlete' | 'princess' | 'explorer' | 'baby'
  assignment: string   // 自定义角色描述，如"家里最懂事的姐姐"
}

interface UpdateRoleRequest {
  assignment?: string
  role_type?: string
}

// 响应类型
interface LeaderboardResponse {
  period: 'weekly' | 'monthly' | 'all_time'
  rankings: {
    rank: number
    pet_id: string
    pet_name: string
    pet_avatar_url: string | null
    score: number
    metrics: {
      checkin_count: number
      feed_count: number
      moment_count: number
      health_score: number
    }
    badges: string[]        // 本周获得的徽章
  }[]
  updated_at: string
}

interface RoleResponse {
  id: string
  pet_id: string
  pet_name: string
  pet_avatar_url: string | null
  role_type: string
  role_label: string        // 角色中文名
  assignment: string
  created_at: string
}

interface FamilyRolesResponse {
  roles: RoleResponse[]
  available_types: {
    type: string
    label: string
    description: string
    icon: string
  }[]
}
```

#### 6.12.7 取名引擎

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/naming/analyze` | 分析名字寓意 |
| POST | `/api/naming/recommend` | 推荐名字（AI生成） |
| GET | `/api/naming/history` | 取名历史 |
| POST | `/api/naming/select` | 选定名字 |
| GET | `/api/naming/knowledge` | 获取知识库内容 |

```typescript
// 请求类型
interface AnalyzeNameRequest {
  pet_id: string
  name: string
}

interface RecommendNameRequest {
  pet_id: string
  species: string
  breed?: string
  birth_date?: string      // 出生日期，用于五行分析
  birth_season?: string    // 出生季节
  gender?: string
  preferences?: {
    style?: 'traditional' | 'modern' | 'poetic' | 'funny'
    element?: 'metal' | 'wood' | 'water' | 'fire' | 'earth'  // 期望补的五行
    length?: 1 | 2         // 名字字数
    avoid_chars?: string[]  // 避讳字
  }
}

interface SelectNameRequest {
  history_id: string
  selected_name: string
}

// 响应类型
interface NameAnalysisResponse {
  name: string
  five_elements: {
    element: string
    score: number
    description: string
  }
  star: {
    constellation: string
    meaning: string
  } | null
  poetry: {
    source: string          // 出处（诗经/楚辞/唐诗等）
    verse: string
    meaning: string
  } | null
  cultural: {
    allusion: string
    description: string
  } | null
  overall_score: number
  suggestion: string
}

interface NameRecommendationResponse {
  names: {
    name: string
    reason: string
    five_elements: string
    score: number
    tags: string[]
  }[]
  couplet?: string         // 对联/诗句
  analysis: {
    missing_element: string | null   // 缺什么五行
    recommended_element: string      // 建议补什么
    birth_info: {
      zodiac: string       // 生肖
      constellation: string // 星座
      five_elements: string // 五行
    }
  }
}

interface NameHistoryResponse {
  items: {
    id: string
    pet_id: string
    pet_name: string
    mode: 'analyze' | 'recommend'
    input_params: object
    candidates: object[]
    selected_name: string | null
    created_at: string
  }[]
  total: number
}

interface KnowledgeResponse {
  five_elements: {
    elements: { name: string; chars: string[]; description: string }[]
    relationships: { generate: string; generate_by: string; overcome: string; overcome_by: string }[]
  }
  constellations: {
    name: string
    date_range: string
    element: string
    lucky_chars: string[]
  }[]
  poetry_sources: {
    book: string
    verses: { verse: string; meaning: string; suitable_for: string }[]
  }[]
}
```

#### 6.12.8 宠物回忆录

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/pets/:id/memoir` | 创建回忆录任务 |
| GET | `/api/pets/:id/memoir/status` | 查询回忆录状态 |
| GET | `/api/pets/:id/memoir/list` | 获取回忆录列表 |
| DELETE | `/api/pets/:id/memoir/:memoirId` | 删除回忆录 |
| POST | `/api/pets/:id/memoir/preview` | 获取预览视频 |

```typescript
// 请求类型
interface CreateMemoirRequest {
  memoir_type: 'daily' | 'memorial' | 'seasonal' | 'milestone' | 'custom'
  source_photos: string[]          // 用户选择的照片URL列表
  source_text?: string             // 用户提供的文字描述
  music_style?: 'warm' | 'nostalgic' | 'cheerful' | 'peaceful'
  duration?: number                // 目标时长（秒），默认15s
  style_preset?: string            // 视觉风格预设
}

// 响应类型
interface MemoirTaskResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number                 // 0-100
  estimated_wait_seconds: number
  created_at: string
}

interface MemoirStatusResponse {
  id: string
  status: string
  progress: number
  video_url: string | null         // 完成后的视频URL
  preview_url: string | null       // 预览图URL
  narrative_structure: {
    title: string
    chapters: { title: string; photo_index: number[]; text: string }[]
  } | null
  cost_credits: number | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

interface MemoirListResponse {
  items: {
    id: string
    memoir_type: string
    type_label: string
    status: string
    cover_url: string | null
    video_url: string | null
    duration_seconds: number
    created_at: string
  }[]
  total: number
  has_more: boolean
}
```

#### 6.12.9 分享卡片

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/share-cards/generate` | 生成分享卡片 |
| GET | `/api/share-cards` | 获取卡片列表 |
| GET | `/api/share-cards/:id` | 获取卡片详情 |
| DELETE | `/api/share-cards/:id` | 删除卡片 |
| POST | `/api/share-cards/:id/share` | 记录分享行为 |

```typescript
// 请求类型
interface GenerateShareCardRequest {
  card_type: 'health_report' | 'weekly_summary' | 'milestone' | 'family_tree' | 'memoir' | 'naming' | 'birthday' | 'achievement' | 'daily_moment' | 'yearly_review'
  source_data: {
    // 各类卡片的数据源
    report_id?: string       // 周报/年报ID
    memoir_id?: string       // 回忆录ID
    pet_id?: string          // 宠物ID
    milestone_id?: string    // 里程碑ID
    snapshot_id?: string     // 图谱快照ID
    name_history_id?: string // 取名历史ID
    feed_id?: string         // 动态ID
    custom_text?: string     // 自定义文字
    custom_photos?: string[] // 自定义图片
  }
  style?: {
    theme?: 'warm' | 'elegant' | 'cute' | 'minimal'
    background_color?: string
    font_family?: string
  }
}

// 响应类型
interface ShareCardResponse {
  id: string
  card_type: string
  type_label: string
  card_url: string             // 卡片图片URL
  card_data: {
    title: string
    content: string
    pet_name?: string
    date: string
    style: object
  }
  created_at: string
}

interface ShareCardListResponse {
  items: {
    id: string
    card_type: string
    type_label: string
    thumbnail_url: string
    title: string
    share_count: number
    created_at: string
  }[]
  total: number
}

interface ShareRecordRequest {
  channel: 'wechat_friend' | 'wechat_moment' | 'save_image' | 'other'
}
```

#### 6.12.10 年度回忆图集

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/pets/:id/yearly-review` | 创建年度回忆 |
| GET | `/api/pets/:id/yearly-review/:year` | 获取年度回忆详情 |
| GET | `/api/pets/:id/yearly-review/list` | 获取年度列表 |
| PUT | `/api/pets/:id/yearly-review/:reviewId` | 更新年度回忆 |
| POST | `/api/pets/:id/yearly-review/:reviewId/generate-video` | 生成年度视频 |

```typescript
// 请求类型
interface CreateYearlyReviewRequest {
  year: number
  auto_select?: boolean      // 是否自动选片，默认true
  custom_photos?: string[]   // 手动指定照片
  title?: string             // 自定义标题
}

interface UpdateYearlyReviewRequest {
  title?: string
  review_data?: {
    sections: {
      type: 'monthly' | 'milestone' | 'health' | 'growth'
      photos: string[]
      title: string
      description: string
    }[]
  }
  cover_url?: string
}

// 响应类型
interface YearlyReviewResponse {
  id: string
  pet_id: string
  pet_name: string
  pet_avatar_url: string | null
  year: number
  status: 'draft' | 'completed' | 'generating_video'
  review_data: {
    title: string
    summary: string            // AI摘要
    stats: {
      total_photos: number
      total_checkins: number
      total_milestones: number
      health_avg_score: number
      best_month: string
      vet_visits: number
    }
    monthly_highlights: {
      month: number
      month_label: string
      highlight: string
      photos: string[]
      key_event: string | null
    }[]
    milestones: {
      date: string
      title: string
      description: string
      photo: string | null
    }[]
    growth_timeline: {
      date: string
      weight: number | null
      note: string
    }[]
  }
  cover_url: string | null
  video_url: string | null
  paid: boolean
  created_at: string
}

interface YearlyReviewListResponse {
  items: {
    id: string
    year: number
    status: string
    cover_url: string | null
    summary: string
    photo_count: number
    paid: boolean
    created_at: string
  }[]
  total: number
}
```

#### 6.12.11 AI对话

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/chat` | 发送对话消息 |
| GET | `/api/ai/chat/history` | 获取对话历史 |
| DELETE | `/api/ai/chat/history` | 清空对话历史 |
| POST | `/api/ai/chat/feedback` | 对话反馈 |

```typescript
// 请求类型
interface ChatRequest {
  message: string
  pet_id?: string            // 指定对话宠物，不传则由AI识别
  context?: {
    page?: string            // 当前页面
    selected_pet_id?: string
    recent_action?: string
  }
}

interface ChatFeedbackRequest {
  message_id: string
  rating: 'helpful' | 'unhelpful' | 'inappropriate'
  comment?: string
}

// 响应类型
interface ChatResponse {
  reply: string
  message_id: string
  intent: {
    type: 'health' | 'food' | 'symptom' | 'emotion' | 'naming' | 'family' | 'memoir' | 'general' | 'unknown'
    confidence: number
  }
  actions?: {
    type: 'navigate' | 'show_card' | 'open_modal' | 'trigger_checkin'
    payload: object
  }[]
  guard_info?: {
    blocked: boolean
    reason?: string
  }
}

interface ChatHistoryResponse {
  messages: {
    id: string
    role: 'user' | 'assistant'
    content: string
    intent?: string
    created_at: string
  }[]
  has_more: boolean
}
```

---

## 七、前后端交互方案

### 7.1 数据流架构

```
┌──────────────────────────────────────────────────────────────┐
│                        用户操作                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ 健康打卡  │  │ 症状初筛  │  │ 家庭操作  │  │ AI对话/取名  │  │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └──────┬──────┘  │
│        ↓             ↓             ↓              ↓          │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   前端Zustand Store                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │  │
│  │  │ petStore │  │checkinSt │  │familySt  │  │chatSt  │  │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │  │
│  │       └──────────────┴─────────────┴──────────────┘      │  │
│  │                         ↓                                │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │             本地缓存层（Taro Storage）              │  │  │
│  │  │  ├── 宠物档案缓存（24h有效期）                      │  │  │
│  │  │  ├── 今日打卡缓存（立即读，5min过期）               │  │  │
│  │  │  ├── 家庭数据缓存（实时读，60min过期）              │  │  │
│  │  │  └── 最新对话缓存（保留最近20条）                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                        ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Service层（统一API封装）                     │  │
│  │  ├── 请求拦截器（Token注入 + 签名）                      │  │
│  │  ├── 响应拦截器（错误码映射 + 401自动刷新）              │  │
│  │  ├── 请求去重（相同请求pending时自动合并）               │  │
│  │  ├── 请求重试（网络异常，最多3次，指数退避）             │  │
│  │  └── 请求取消（页面切换自动abort）                       │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTPS / WebSocket
┌──────────────────────────┴───────────────────────────────────┐
│                        云端                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           Express 4 + PostgreSQL 16                      │  │
│  │  ├── REST API（常规CRUD，60+路由）                        │  │
│  │  └── WebSocket 服务（ws库，自建实时推送）                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │          异步任务队列                                     │  │
│  │  ├── 回忆录视频生成（外部API调用）                        │  │
│  │  ├── 家庭周报自动生成（每周一凌晨）                       │  │
│  │  ├── 年度回忆生成（每年1月1日）                           │  │
│  │  └── 疫苗提醒推送调度（到期前7天/3天/1天）               │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 数据流分场景

#### 7.2.1 常规CRUD流（打卡/症状/宠物档案）

```
用户提交 → Store更新（乐观UI） → 本地缓存写入 → API请求
  ↓
成功 → 云端确认 → 更新Store状态 → 更新缓存
  ↓
失败 → 回滚Store → 清除缓存 → 显示错误提示 → 可选择重试
```

**乐观更新策略**：用户提交后立即更新UI，无需等待API响应。失败时回滚并提示。适用于：打卡、症状初筛、发布动态、创建日历事件。

#### 7.2.2 实时数据流（家庭动态墙/日历更新）

```
服务端数据变更
  ↓
自建 WebSocket 服务推送
  ↓
WebSocket接收 → Service层解析 → Store更新
  ↓
触发UI重渲染 → 更新本地缓存（后台静默）
```

**订阅范围**：用户所属家庭的动态墙、日历事件变更。页面活跃时实时接收，切后台时暂停。

#### 7.2.3 AI对话流

```
用户输入 → Guard规则校验（P0阻断） → 本地缓存消息
  ↓
API请求 → 后端AI服务 → 流式响应（SSE）
  ↓
逐块解析 → Store追加消息 → 渲染对话气泡
  ↓
完成 → 缓存完整对话 → 更新意图识别结果
```

**SSE替代方案**：微信小程序不支持原生SSE，使用HTTP长轮询或WebSocket模拟流式输出。每次请求携带最近20条消息作为上下文。

#### 7.2.4 异步任务流（回忆录视频/周报生成）

```
用户发起任务 → 返回task_id + 预估等待时间
  ↓
轮询（每5秒）: GET /api/pets/:id/memoir/status
  ↓
┌─────────────────────────────────────────────┐
│  polling × 3 → 仍 pending → 显示进度条动画  │
│  status=processing → 展示"生成中..."        │
│  status=completed → 展示视频/分享按钮        │
│  status=failed → 显示重试按钮 + 错误原因     │
└─────────────────────────────────────────────┘
```

**轮询策略**：前3次快速轮询（每2秒），后续降频（每5秒），60秒后降为每10秒。最大等待时间：回忆录视频120秒，周报生成30秒。

### 7.3 WebSocket实时推送

#### 7.3.0 身份验证与连接安全

> WebSocket 连接必须在建立时完成 JWT 身份验证，未认证连接一律拒绝。

**连接建立流程**：

```
1. 客户端 → WebSocket连接请求（携带JWT token）
   ws://api.example.com/ws?token=<JWT_TOKEN>

2. 服务端 → 验证JWT token
   ├── 验证通过：升级为WebSocket连接，绑定userId
   └── 验证失败：返回HTTP 401，拒绝连接

3. 连接建立后 → 客户端发送订阅消息
   { type: 'subscribe', channel: 'family:xxx:feeds' }

4. 服务端 → 验证频道订阅权限
   ├── 用户是该家庭成员：订阅成功，返回 { type: 'subscribed', channel: '...' }
   └── 用户不是该家庭成员：订阅拒绝，返回 { type: 'error', code: '403', message: '无权订阅此频道' }
```

**服务端实现**：

```typescript
// WebSocket服务端身份验证中间件
wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  // 1. 从URL查询参数提取token
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(4001, '缺少认证token');
    return;
  }

  // 2. 验证JWT
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    ws.userId = payload.userId;
  } catch (err) {
    ws.close(4003, 'token无效或已过期');
    return;
  }

  // 3. 监听订阅请求，验证频道权限
  ws.on('message', (data: Buffer) => {
    const msg = JSON.parse(data.toString());

    if (msg.type === 'subscribe') {
      const channel = msg.channel;
      // 验证用户是否有权订阅此频道
      if (!canSubscribe(ws.userId, channel)) {
        ws.send(JSON.stringify({ type: 'error', code: '403', message: '无权订阅此频道' }));
        return;
      }
      ws.channels = ws.channels || new Set();
      ws.channels.add(channel);
      ws.send(JSON.stringify({ type: 'subscribed', channel }));
    }

    if (msg.type === 'unsubscribe') {
      ws.channels?.delete(msg.channel);
    }
  });
});

// 频道权限验证
async function canSubscribe(userId: string, channel: string): Promise<boolean> {
  const [type, id, subType] = channel.split(':');

  switch (type) {
    case 'family':
      // 验证用户是否为该家庭成员
      const member = await pool.query(
        'SELECT 1 FROM pet_family_members WHERE family_id = $1 AND EXISTS (SELECT 1 FROM pet_profiles WHERE id = pet_family_members.pet_id AND user_id = $2)',
        [id, userId]
      );
      return member.rows.length > 0;

    case 'user':
      // 用户频道只能订阅自己的
      return id === userId;

    case 'pet':
      // 验证用户是否为宠物主人
      const owner = await pool.query(
        'SELECT 1 FROM pet_profiles WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      return owner.rows.length > 0;

    default:
      return false;
  }
}
```

**安全措施**：
1. JWT token 过期后 WebSocket 连接自动关闭（心跳时检查）
2. 单用户连接数限制（最多3个并发连接，防止滥用）
3. 心跳超时60秒自动断开
4. 切后台后小程序自动断开，切回前台用最新token重连
5. 频道订阅权限在服务端验证，不信任客户端

#### 7.3.1 频道设计

| 频道 | 订阅条件 | 推送事件 | 数据量 |
|------|---------|---------|--------|
| `family:{id}:feeds` | 用户是家庭成员 | 新动态、动态更新、动态删除 | 小 |
| `family:{id}:calendar` | 用户是家庭成员 | 新事件、事件更新、提醒触发 | 小 |
| `family:{id}:roles` | 用户是家庭成员 | 角色变更、排行更新 | 极小 |
| `user:{id}:notifications` | 用户身份 | 周报就绪、回忆录完成、疫苗提醒 | 中 |
| `pet:{id}:memoir` | 宠物主人 | 视频生成进度更新 | 极小 |

#### 7.3.2 连接管理

```typescript
// WebSocket连接管理
interface RealtimeManager {
  // 连接生命周期
  connect(): void
  disconnect(): void
  reconnect(): void

  // 频道订阅
  subscribe(channel: string, event: string, callback: Function): void
  unsubscribe(channel: string, event: string): void

  // 状态管理
  getStatus(): 'connected' | 'disconnected' | 'reconnecting'
  getActiveChannels(): string[]
}

// 连接策略
const REALTIME_CONFIG = {
  autoReconnect: true,
  reconnectInterval: 3000,     // 3秒重连
  maxReconnectAttempts: 10,    // 最多重连10次
  heartbeatInterval: 30000,    // 30秒心跳
  pageFocusReconnect: true,    // 切回前台时主动重连
  backgroundPause: true,       // 切后台时暂停（节省资源）
}
```

**页面切换行为**：
- 首页/宠物页：订阅全部频道
- 子页面：只订阅当前页相关频道
- 后台：暂停所有订阅，切回前台后恢复
- 退出小程序：断开连接，下次启动重新订阅

### 7.4 缓存策略（三层架构）

#### 7.4.1 缓存层级

| 层级 | 存储 | 容量 | 速度 | 持久化 |
|------|------|------|------|--------|
| L1: 内存缓存 | Zustand Store | 当前页面数据 | 0ms | 否 |
| L2: 本地存储 | Taro Storage | ~5MB | 10ms | 是 |
| L3: 云端 | Express API + PostgreSQL | 无限 | 100-500ms | 是 |

#### 7.4.2 缓存规则

```typescript
interface CacheRule {
  key: string
  ttl: number          // 过期时间（秒）
  staleWhileRevalidate: boolean  // 是否允许使用过期数据同时刷新
  priority: 'critical' | 'normal' | 'low'
  syncOnWrite: boolean  // 写入时是否同步到云端
}

const CACHE_RULES: Record<string, CacheRule> = {
  // 宠物档案 - 长期缓存
  'pet_profile':     { ttl: 86400, staleWhileRevalidate: true, priority: 'critical', syncOnWrite: true },
  'pet_list':        { ttl: 3600,  staleWhileRevalidate: true, priority: 'critical', syncOnWrite: true },

  // 打卡数据 - 短期缓存
  'today_checkin':   { ttl: 300,   staleWhileRevalidate: false, priority: 'normal', syncOnWrite: true },

  // 家庭数据 - 中等缓存
  'family_list':     { ttl: 3600,  staleWhileRevalidate: true, priority: 'normal', syncOnWrite: true },
  'family_members':  { ttl: 1800,  staleWhileRevalidate: true, priority: 'normal', syncOnWrite: true },
  'family_tree':     { ttl: 3600,  staleWhileRevalidate: true, priority: 'normal', syncOnWrite: false },

  // 日历事件 - 随查随用
  'calendar_events': { ttl: 600,   staleWhileRevalidate: true, priority: 'normal', syncOnWrite: true },

  // 动态墙 - 频繁刷新
  'feeds':           { ttl: 300,   staleWhileRevalidate: false, priority: 'normal', syncOnWrite: false },

  // 取名结果 - 长期保留
  'naming_history':  { ttl: 86400, staleWhileRevalidate: true, priority: 'low', syncOnWrite: true },

  // 知识库数据 - 几乎不变
  'knowledge_base':  { ttl: 604800, staleWhileRevalidate: true, priority: 'low', syncOnWrite: false },  // 7天

  // 共享卡片 - 按需生成
  'share_cards':     { ttl: 3600,  staleWhileRevalidate: true, priority: 'low', syncOnWrite: false },
}
```

#### 7.4.3 缓存读写策略

```typescript
// 读策略：Cache-Aside
async function readWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const rule = CACHE_RULES[key]
  if (!rule) return fetcher()  // 无缓存规则，直接请求

  // L1: 内存缓存
  const memoryData = memoryCache.get(key)
  if (memoryData && !isExpired(memoryData, rule.ttl)) return memoryData.value

  // L2: 本地存储
  const storageData = await storage.get(key)
  if (storageData && !isExpired(storageData, rule.ttl)) {
    // stale-while-revalidate：后台刷新
    if (rule.staleWhileRevalidate && isNearExpiry(storageData, rule.ttl)) {
      refreshCache(key, fetcher)  // 后台静默刷新，不阻塞返回
    }
    memoryCache.set(key, storageData)  // 提升到L1
    return storageData.value
  }

  // L3: 云端请求
  const freshData = await fetcher()
  cacheWrite(key, freshData, rule)
  return freshData
}

// 写策略：Write-Through
async function writeWithCache<T>(key: string, data: T, syncFn: () => Promise<void>): Promise<void> {
  // 立即更新L1和L2
  memoryCache.set(key, { value: data, cachedAt: Date.now() })
  await storage.set(key, { value: data, cachedAt: Date.now() })

  // 同步到云端
  if (CACHE_RULES[key]?.syncOnWrite) {
    try {
      await syncFn()
    } catch {
      // 云端失败，标记为待同步
      await syncQueue.add({ key, data, retryCount: 0 })
      // 用户可见"已保存本地，待同步"提示
    }
  }
}
```

#### 7.4.4 离线支持

| 功能 | 离线可用 | 离线范围 | 同步时机 |
|------|---------|---------|---------|
| 健康打卡 | 是 | 当日打卡数据 | 恢复网络后自动同步 |
| 查看宠物档案 | 是 | 最近同步的档案 | 后台静默刷新 |
| 查看家庭 | 是 | 最近同步的家庭数据 | 后台静默刷新 |
| 日历事件 | 是 | 最近30天 | 打开页面时刷新 |
| AI对话 | 否 | - | - |
| 取名引擎 | 否 | - | - |
| 回忆录视频 | 否 | - | - |
| 症状初筛 | 是 | 本地知识库缓存 | 后台静默更新 |

**同步队列**：离线期间的操作写入 `sync_queue` 表，恢复网络后按顺序执行。

**冲突解决策略（字段级 Last-Write-Wins）**：

整行覆盖会导致并发修改不同字段时丢失数据（如用户A离线修改宠物名字，用户B在线修改宠物体重）。采用字段级合并策略：

```typescript
interface SyncConflict {
  resourceType: 'pet_profile' | 'family' | 'calendar_event';
  resourceId: string;
  field: string;              // 冲突字段
  localValue: unknown;        // 本地值
  localUpdatedAt: number;     // 本地更新时间戳
  cloudValue: unknown;        // 云端值
  cloudUpdatedAt: number;     // 云端更新时间戳
}

// 字段级合并：取每个字段的最后更新时间戳更大的值
function mergeFields(local: Record<string, any>, cloud: Record<string, any>): Record<string, any> {
  const merged: Record<string, any> = { ...cloud };
  for (const [key, cloudValue] of Object.entries(cloud)) {
    const localValue = local[key];
    const localTs = local._fieldTimestamps?.[key] ?? 0;
    const cloudTs = cloud._fieldTimestamps?.[key] ?? 0;
    merged[key] = localTs > cloudTs ? localValue : cloudValue;
  }
  return merged;
}
```

| 冲突场景 | 解决策略 |
|---------|---------|
| 同一记录不同字段 | 字段级合并，各字段取最新时间戳的值 |
| 同一字段不同值 | Last-Write-Wins，取最后更新时间戳的值 |
| 同一资源被删除 vs 被修改 | 删除优先（安全侧） |
| 数组类型字段（如photos） | 合并去重，取并集 |
| 关系型字段（如family_id） | 云端优先，防止跨家庭数据错乱 |

### 7.5 异步任务队列

#### 7.5.1 任务类型

| 任务 | 触发方式 | 处理时间 | 失败重试 | 通知方式 |
|------|---------|---------|---------|---------|
| 回忆录视频生成 | 用户主动触发 | 30-120秒 | 最多3次 | WebSocket推送 + 轮询 |
| 家庭周报生成 | 系统定时（每周一0:00） | 5-15秒 | 最多2次 | 订阅消息 |
| 年度回忆图集 | 系统定时（每年1月1日） | 30-60秒 | 最多3次 | 订阅消息 |
| 疫苗提醒推送 | 系统定时（每日8:00） | 批量处理 | 最多2次 | 微信订阅消息 |
| 分享卡片生成 | 用户主动触发 | 2-5秒 | 最多2次 | 同步返回 |

#### 7.5.2 任务状态机

```
pending → processing → completed
  ↓           ↓
  failed → retry → processing → completed
  ↓
  failed（永久） → 人工介入
```

**重试策略**：
- 网络错误：立即重试，最多3次，间隔递增（2s → 5s → 15s）
- API限流：等待30秒后重试，最多2次
- 数据错误：不重试，记录错误日志
- 超时：重试1次，若仍超时则标记为失败

#### 7.5.3 任务队列实现

```typescript
interface TaskQueue {
  // 核心方法
  enqueue(task: Task): Promise<string>     // 返回task_id
  getStatus(taskId: string): TaskStatus
  cancel(taskId: string): boolean
  retry(taskId: string): Promise<string>

  // 回调
  onProgress(taskId: string, callback: (progress: number) => void): void
  onComplete(taskId: string, callback: (result: any) => void): void
  onError(taskId: string, callback: (error: Error) => void): void
}

interface Task {
  id: string
  type: 'memoir_video' | 'weekly_report' | 'yearly_review' | 'share_card' | 'vaccine_reminder'
  priority: 'high' | 'normal' | 'low'
  payload: Record<string, any>
  created_at: number
  max_retries: number
  timeout_seconds: number
}

interface TaskStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number         // 0-100
  result?: any
  error?: string
  retry_count: number
  estimated_completion: number  // 预计完成时间戳
}
```

---

## 八、前端架构

### 8.1 目录结构

```
src/
├── app.tsx
├── app.config.ts
├── app.scss
├── pages/
│   ├── index/
│   ├── checkin/
│   ├── food-query/
│   ├── symptom-check/
│   ├── pet-profile/
│   ├── pet-add/
│   ├── vaccine-calendar/
│   ├── health-trend/
│   ├── member/
│   ├── mine/
│   ├── login/
│   └── onboarding/
├── components/
│   ├── pet/
│   │   ├── PetAvatar.tsx
│   │   ├── PetSwitcher.tsx
│   │   ├── PetCard.tsx
│   │   └── PetDeceasedModal.tsx
│   ├── checkin/
│   │   ├── CheckinButton.tsx
│   │   ├── LevelSelector.tsx
│   │   └── AIFeedbackPopup.tsx
│   ├── food/
│   │   ├── FoodSearchBar.tsx
│   │   ├── FoodResultCard.tsx
│   │   └── FoodShareCard.tsx
│   ├── symptom/
│   │   ├── SymptomSelector.tsx
│   │   ├── StepIndicator.tsx
│   │   └── UrgencyResult.tsx
│   ├── vaccine/
│   │   ├── VaccineTimeline.tsx
│   │   └── VaccineReminder.tsx
│   ├── trend/
│   │   ├── TrendChart.tsx
│   │   └── AnomalyMarker.tsx
│   ├── member/
│   │   ├── PlanSelector.tsx
│   │   └── UsageCounter.tsx
│   ├── common/
│   │   ├── EmergencyAlert.tsx
│   │   ├── PaywallPopup.tsx
│   │   └── ShareCard.tsx
│   └── emotion/
│       └── GriefCompanion.tsx
├── engines/
│   ├── petSafety/
│   │   ├── PetSafetyHandler.ts
│   │   ├── ToxicFoodFilter.ts
│   │   └── MedicalDisclaimer.ts
│   ├── symptom/
│   │   ├── SymptomRuleEngine.ts
│   │   ├── UrgencyClassifier.ts
│   │   └── KnowledgeMatcher.ts
│   ├── health/
│   │   ├── HealthTrendAnalyzer.ts
│   │   ├── AnomalyDetector.ts
│   │   └── MonthlyReportGenerator.ts
│   ├── vaccine/
│   │   ├── VaccineScheduler.ts
│   │   └── ReminderManager.ts
│   ├── avatar/
│   │   ├── PetAvatarEngine.ts
│   │   ├── ExpressionOverlay.tsx
│   │   └── StatusMapper.ts
│   └── emotion/
│       ├── EmotionTriggerEngine.ts
│       └── GriefCompanionEngine.ts
├── memory-body/
│   ├── types/
│   ├── store/
│   ├── lifecycle/
│   ├── security/
│   ├── adapters/
│   └── sync/
├── hooks/
│   ├── usePet.ts
│   ├── useCheckin.ts
│   ├── useFoodQuery.ts
│   ├── useSymptomCheck.ts
│   ├── useVaccine.ts
│   ├── useHealthTrend.ts
│   ├── usePetAvatar.ts
│   ├── useMembership.ts
│   ├── useEmotionTrigger.ts
│   └── useAuth.ts
├── stores/
│   ├── petStore.ts
│   ├── checkinStore.ts
│   ├── foodQueryStore.ts
│   ├── symptomCheckStore.ts
│   ├── vaccineStore.ts
│   ├── membershipStore.ts
│   ├── authStore.ts
│   └── settingsStore.ts
├── services/
│   ├── api.ts
│   ├── petService.ts
│   ├── checkinService.ts
│   ├── foodService.ts
│   ├── symptomService.ts
│   ├── vaccineService.ts
│   ├── healthTrendService.ts
│   ├── petAvatarService.ts
│   ├── membershipService.ts
│   ├── emotionService.ts
│   └── authService.ts
├── data/
│   ├── petKnowledge/
│   │   ├── symptoms.json
│   │   ├── foodSafety.json
│   │   ├── breeds.json
│   │   └── vaccineSchedule.json
│   ├── urgencyRules.json
│   └── emotionScenes.json
├── types/
│   ├── PetType.ts
│   ├── HealthType.ts
│   ├── FoodType.ts
│   ├── SymptomType.ts
│   ├── VaccineType.ts
│   ├── MemberType.ts
│   └── EmotionType.ts
└── utils/
    ├── storage.ts
    ├── crypto.ts
    ├── date.ts
    ├── share.ts
    └── quotaManager.ts
```

### 8.2 页面路由

```typescript
export default {
  pages: [
    // 主包
    'pages/index/index',
    'pages/checkin/index',
    'pages/food-query/index',
    'pages/symptom-check/index',
    'pages/pet-profile/index',
    'pages/pet-add/index',
    'pages/vaccine-calendar/index',
    'pages/health-trend/index',
    'pages/member/index',
    'pages/mine/index',
    'pages/login/index',
    'pages/onboarding/index',
    // 宠物分包（pagesPet）
    'pagesPet/chat/index',
    'pagesPet/timeline/index',
    'pagesPet/family/index',
    'pagesPet/family/tree',
    'pagesPet/family/calendar',
    'pagesPet/family/feeds',
    'pagesPet/family/weekly-report',
    'pagesPet/naming/index',
    'pagesPet/naming/result',
    'pagesPet/memoir/index',
    'pagesPet/memoir/create',
    'pagesPet/memoir/detail',
    'pagesPet/share-card/preview',
    'pagesPet/yearly-review/index',
    'pagesPet/yearly-review/detail',
    'pagesPet/leaderboard/index',
  ],
  tabBar: {
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/pet-profile/index', text: '我的宠物' },
      { pagePath: 'pages/member/index', text: '会员' },
      { pagePath: 'pages/mine/index', text: '我的' },
    ]
  },
  subPackages: [
    {
      root: 'pagesPet',
      pages: [
        'chat/index',
        'timeline/index',
        'family/index',
        'family/tree',
        'family/calendar',
        'family/feeds',
        'family/weekly-report',
        'naming/index',
        'naming/result',
        'memoir/index',
        'memoir/create',
        'memoir/detail',
        'share-card/preview',
        'yearly-review/index',
        'yearly-review/detail',
        'leaderboard/index',
      ]
    }
  ]
}

### 8.3 Phase 1.5 组件树设计

#### 8.3.1 家庭管理组件树

```
FamilyPage
├── FamilyHeader（家庭头像+名称+编辑按钮）
├── FamilyMemberList
│   ├── FamilyMemberCard（宠物头像+名字+角色标签）
│   └── AddMemberButton（+添加成员）
├── FamilyActionBar
│   ├── GoToTreeButton（查看族谱）
│   ├── GoToCalendarButton（查看日历）
│   └── GoToFeedsButton（查看动态）
└── FamilySettingsDrawer（底部弹出）
    ├── EditFamilyName
    ├── EditFamilyAvatar
    └── DeleteFamilyButton（红字+二次确认）
```

#### 8.3.2 家族图谱组件树

```
FamilyTreePage
├── TreeHeader
│   ├── Title（"XX的家族图谱"）
│   ├── LayoutSwitcher（graph / radial / timeline）
│   └── SnapshotButton（保存快照）
├── TreeCanvas（可视化画布，核心）
│   ├── TreeNode（圆形/方形头像+名字+角色标签）
│   │   ├── AvatarImage
│   │   ├── PetName
│   │   ├── RoleBadge（如"守护者"）
│   │   └── DeceasedMark（已故标记）
│   ├── TreeEdge（连线+关系标签）
│   │   └── RelationLabel（"母子"/"好友"）
│   └── TreeInteractionLayer
│       ├── PinchZoom（双指缩放）
│       ├── DragPan（拖拽平移）
│       └── NodeTap（点击节点弹出详情）
├── NodeDetailModal（点击节点弹出）
│   ├── PetPhoto
│   ├── PetInfo（品种/生日/性别）
│   ├── RelationshipList（与其他宠物的关系）
│   └── ActionButtons（编辑关系/查看血亲树）
├── RelationshipEditor
│   ├── PetSelectorA（选择宠物A）
│   ├── RelationTypePicker（关系类型选择器）
│   ├── PetSelectorB（选择宠物B）
│   └── ConfirmButton
├── LineageTree（血亲树视图）
│   ├── ParentNode（上方：父母）
│   ├── CurrentNode（中间：当前宠物）
│   ├── ChildrenNodes（下方：子女）
│   └── SiblingNodes（两侧：兄弟姐妹）
└── SnapshotHistory
    ├── SnapshotCard（缩略图+时间）
    └── ShareButton（分享快照）
```

#### 8.3.3 家庭日历组件树

```
FamilyCalendarPage
├── CalendarHeader
│   ├── MonthNavigator（← 2026年7月 →）
│   └── ViewSwitcher（month / week / timeline）
├── CalendarGrid（月视图）
│   ├── WeekdayHeader（一二三四五六日）
│   ├── DayCell
│   │   ├── DateNumber（日期数字）
│   │   ├── EventDot（事件标记点，颜色按类型）
│   │   └── TodayMarker（今天高亮）
│   └── EventCountBadge（事件数量角标）
├── WeekView（周视图）
│   ├── HourColumn（时间轴）
│   └── EventBar（事件条，按时间定位）
├── TimelineView（时间线视图）
│   ├── WeekGroup（周分组）
│   │   ├── WeekLabel（"第3周"）
│   │   └── EventCard（事件卡片）
│   │       ├── PetAvatar（宠物头像）
│   │       ├── EventTitle
│   │       ├── EventTypeIcon（疫苗/生日/就医等）
│   │       └── StatusBadge（已完成/待办/已逾期）
│   └── SummaryBar（本周统计）
├── EventCreateModal（创建事件）
│   ├── EventTypePicker（类型选择器，图标+文字）
│   ├── PetSelector（关联宠物，多选）
│   ├── TitleInput
│   ├── DatePicker（日期选择器，支持跨天）
│   ├── ReminderConfig
│   │   ├── AdvanceDaysPicker（提前天数）
│   │   ├── QuietHoursToggle（免打扰时段）
│   │   └── ChannelSelector（提醒方式）
│   └── SubmitButton
├── EventDetailModal
│   ├── EventInfo（标题/类型/日期/宠物）
│   ├── ReminderInfo（提醒配置）
│   ├── CompleteButton（标记完成，带√动画）
│   ├── EditButton
│   └── DeleteButton
└── UpcomingWidget（首页嵌入组件）
    ├── TodaySection（今日事件）
    ├── OverdueBadge（逾期警告）
    └── ViewAllLink（查看全部）
```

#### 8.3.4 家庭动态墙组件树

```
FamilyFeedPage
├── FeedHeader
│   ├── FilterTabs（全部 / 瞬间 / 成就 / 健康里程碑 / 家庭事件）
│   └── PetFilterDropdown（按宠物筛选）
├── FeedList（虚拟滚动列表）
│   └── FeedCard
│       ├── FeedHeader
│       │   ├── PetAvatar（发起者头像）
│       │   ├── PetName
│       │   ├── FeedTypeLabel（类型标签，彩色）
│       │   └── TimeAgo（"3小时前"）
│       ├── FeedContent（文字内容）
│       ├── FeedPhotos（图片墙，最多9张）
│       │   └── PhotoGrid（2/3/4列自适应）
│       ├── AIGeneratedBadge（AI生成标记，小机器人图标）
│       └── FeedActions
│           ├── LikeButton（心形+计数）
│           └── CommentButton（评论+计数）
├── FeedCreateFAB（浮动发布按钮）
│   └── FeedCreateModal
│       ├── FeedTypeSelector（类型选择）
│       ├── PetSelector（关联宠物）
│       ├── ContentTextarea（文字输入）
│       ├── PhotoPicker（图片选择，最多9张）
│       └── SubmitButton
└── HighlightSection（精选动态区）
    ├── HighlightCard（大图展示）
    └── AutoScroll（自动轮播）
```

#### 8.3.5 家庭周报组件树

```
WeeklyReportPage
├── ReportHeader
│   ├── WeekSelector（"第27周" ← 2026年 →）
│   └── ShareButton（分享为卡片）
├── ReportScoreCard（顶部评分卡片）
│   ├── HealthScore（健康分，环形进度条）
│   ├── ActivityScore（活跃度，环形进度条）
│   └── OverallScore（综合评分，大圆环）
├── ReportSections
│   ├── HealthSection
│   │   ├── TrendMiniChart（小型趋势图）
│   │   ├── CheckinCount（打卡次数）
│   │   ├── AvgScoreRow（便便/食欲/精神平均分）
│   │   └── BestDayHighlight（"周四状态最好"）
│   ├── ActivitySection
│   │   ├── ActivityStats（症状初筛/食物查询/回忆数）
│   │   └── PetInteractionRank（宠物互动排行）
│   └── FamilySection
│       ├── FeedCount（动态数）
│       ├── NewEvents（新增日历事件）
│       └── HotTopic（AI生成的热门话题）
├── AIInsightCard（AI洞察区域）
│   ├── AIInsightContent（如"本周花花食欲明显提升"）
│   └── AIGeneratedTag（AI生成标记）
└── LoadingSkeleton（加载骨架屏）
    ├── ScoreSkeleton（环形进度条骨架）
    ├── ChartSkeleton（图表骨架）
    └── TextSkeleton（文字骨架）
```

#### 8.3.6 排行与角色组件树

```
LeaderboardPage
├── LeaderboardTabs（周榜 / 月榜 / 总榜）
├── LeaderboardList
│   └── LeaderboardItem
│       ├── RankBadge（🥇🥈🥉 或数字）
│       ├── PetAvatar（带头像）
│       ├── PetName
│       ├── ScoreDisplay（分数+上升/下降趋势箭头）
│       ├── MetricsRow（打卡/动态/健康分）
│       └── BadgesRow（徽章行，如"打卡王""健康之星"）
└── RoleSection
    ├── RoleHeader（"角色分配"）
    ├── RoleCard
    │   ├── RoleIcon（角色图标，如盾牌/星星/月亮）
    │   ├── PetAvatar
    │   ├── RoleName（如"守护者"）
    │   └── AssignmentText（"家里最懂事的姐姐"）
    └── RoleEditButton（编辑角色）
        └── RolePickerModal
            ├── RoleTypeGrid（8种角色类型，图标+名称+描述）
            └── AssignmentInput（自定义描述）
```

#### 8.3.7 取名引擎组件树

```
NamingPage
├── ModeSwitcher
│   ├── AnalyzeMode（分析名字）
│   └── RecommendMode（推荐名字）
├── AnalyzeModeView
│   ├── NameInput（输入要分析的名字）
│   ├── PetSelector（选择宠物）
│   ├── AnalyzeButton
│   └── AnalysisResult
│       ├── OverallScoreCard（总分，大数字+星级）
│       ├── FiveElementsSection（五行分析）
│       │   ├── ElementChart（五行雷达图）
│       │   └── ElementScore（各五行评分）
│       ├── StarSection（星象分析）
│       │   ├── ConstellationDisplay（星座图标）
│       │   └── MeaningText（寓意解读）
│       ├── PoetrySection（诗词出处）
│       │   ├── SourceText（"出自《诗经·小雅》"）
│       │   └── VerseText（诗句原文+释义）
│       └── CulturalSection（文化典故）
│           └── AllusionText（典故解读）
├── RecommendModeView
│   ├── InfoForm
│   │   ├── SpeciesPicker（品种）
│   │   ├── BreedPicker（具体品种，可选）
│   │   ├── BirthDatePicker（出生日期）
│   │   ├── GenderPicker（性别）
│   │   └── PreferencePanel（折叠面板）
│   │       ├── StyleSelector（风格：传统/现代/诗意/搞笑）
│   │       ├── ElementSelector（期望补五行）
│   │       ├── LengthSelector（字数：1字/2字）
│   │       └── AvoidCharsInput（避讳字）
│   ├── RecommendButton
│   └── RecommendationResult
│       ├── NameCardList
│       │   └── NameCard
│       │       ├── NameText（大号名字）
│       │       ├── ScoreBadge（分数）
│       │       ├── ReasonText（推荐理由）
│       │       ├── ElementTag（五行标签）
│       │       ├── TagsRow（风格标签）
│       │       └── SelectButton（选择此名字）
│       ├── CoupletDisplay（对联/诗句，如有）
│       └── BirthInfoPanel（出生信息解读）
│           ├── ZodiacDisplay（生肖）
│           ├── ConstellationDisplay（星座）
│           └── FiveElementsBirth（生辰五行）
├── HistorySection
│   ├── HistoryList
│   │   └── HistoryItem（宠物名+模式+时间+选定的名字）
│   └── ClearHistoryButton
└── KnowledgeSection（底部知识库入口）
    ├── FiveElementsKnowledge（五行知识）
    ├── ConstellationKnowledge（星宿知识）
    └── PoetryKnowledge（诗词库）
```

#### 8.3.8 宠物回忆录组件树

```
MemoirPage
├── MemoirTypeSelector（回忆录类型选择）
│   ├── DailyType（日常回忆，快速生成）
│   ├── MemorialType（纪念回忆，高质量）
│   ├── SeasonalType（季节回忆）
│   ├── MilestoneType（里程碑回忆）
│   └── CustomType（自定义）
├── PhotoSelector（照片选择器）
│   ├── PhotoGrid（照片网格，可多选）
│   ├── PhotoCount（已选数量）
│   ├── AIRecommendToggle（AI推荐照片开关）
│   └── MinPhotoWarning（最少3张提示）
├── ConfigPanel（配置面板）
│   ├── MusicStylePicker（BGM风格：温馨/怀旧/欢快/宁静）
│   ├── DurationSlider（时长滑块：10s/15s/30s）
│   ├── StylePresetPicker（视觉风格预设选择）
│   └── TextInput（可选：用户提供文字描述）
├── GenerateButton（生成按钮，带价格标签）
├── TaskStatus（任务状态展示）
│   ├── ProgressBar（进度条）
│   ├── StatusText（"排队中…"/"生成中…"）
│   ├── EstimatedTime（预计等待时间）
│   └── CancelButton（取消生成）
├── ResultView
│   ├── VideoPlayer（视频播放器）
│   │   ├── PlayButton
│   │   ├── ProgressBar
│   │   └── FullscreenToggle
│   ├── NarrativeStructure（叙事结构展示）
│   │   ├── ChapterCard（章节卡片，可点击跳转）
│   │   └── PhotoIndex（当前照片位置）
│   ├── ActionButtons
│   │   ├── ShareButton（分享）
│   │   ├── SaveButton（保存到相册）
│   │   ├── RegenerateButton（重新生成）
│   │   └── DeleteButton（删除）
│   └── RetryButton（失败时显示）
└── MemoirList（历史回忆录列表）
    └── MemoirCard（封面+类型+时长+创建时间）
```

#### 8.3.9 分享卡片组件树

```
ShareCardPage
├── CardTypeGrid（卡片类型选择）
│   ├── HealthReportCard（健康报告）
│   ├── WeeklySummaryCard（周报）
│   ├── MilestoneCard（里程碑）
│   ├── FamilyTreeCard（族谱）
│   ├── MemoirCard（回忆录）
│   ├── NamingCard（取名）
│   ├── BirthdayCard（生日）
│   ├── AchievementCard（成就）
│   ├── DailyMomentCard（日常瞬间）
│   └── YearlyReviewCard（年度回顾）
├── CardPreview（卡片预览）
│   ├── CardCanvas（SVG渲染卡片）
│   │   ├── BackgroundLayer（背景图/渐变）
│   │   ├── PhotoLayer（照片区域）
│   │   ├── TextLayer（标题+内容）
│   │   └── BrandLayer（品牌水印+二维码）
│   ├── ThemeSelector（主题切换：温馨/优雅/可爱/简约）
│   └── StyleControls（样式微调）
│       ├── BackgroundColorPicker
│       └── FontFamilyPicker
├── CardActions
│   ├── ShareToWechat（分享到微信好友）
│   ├── ShareToMoment（分享到朋友圈）
│   ├── SaveImage（保存到相册）
│   └── CopyLink（复制链接）
└── CardHistory（历史卡片）
    ├── CardHistoryItem（缩略图+类型+分享次数）
    └── ShareCount（分享统计）
```

#### 8.3.10 年度回忆图集组件树

```
YearlyReviewPage
├── YearSelector（年份选择器，左右箭头）
├── ReviewHeader
│   ├── CoverPhoto（封面大图）
│   ├── Title（"2026年，和花花的365天"）
│   └── SummaryText（AI摘要，如"这一年你记录了…"）
├── StatsSection（年度数据统计）
│   ├── StatCard（照片总数，大数字+图标）
│   ├── StatCard（打卡天数）
│   ├── StatCard（里程碑数）
│   └── StatCard（健康平均分）
├── MonthlyHighlights（月度亮点时间线）
│   └── MonthRow
│       ├── MonthLabel（"1月"）
│       ├── HighlightText（"花花第一次打疫苗"）
│       ├── PhotoThumbnail（缩略图）
│       └── ExpandButton（展开更多）
├── MilestoneTimeline（里程碑时间线）
│   └── MilestoneItem（竖线时间线）
│       ├── DateBadge（日期标签）
│       ├── MilestoneIcon（里程碑图标）
│       ├── Title
│       └── Description
├── GrowthTimeline（成长轨迹）
│   └── GrowthChart（体重变化折线图）
│       ├── WeightLine（折线）
│       ├── DataPoint（数据点，可点击查看详情）
│       └── YAxisLabel（体重标签）
├── ReviewActions
│   ├── GenerateVideoButton（生成年度视频）
│   ├── ShareButton（分享）
│   └── EditButton（编辑）
└── YearList（所有年份列表）
    ├── YearCard（年份+封面+摘要）
    └── LockedYearCard（未付费年份，带锁图标）
```

#### 8.3.11 AI对话组件树

```
ChatPage
├── ChatHeader
│   ├── PetAvatar（当前对话宠物头像）
│   ├── PetName（宠物名字）
│   ├── StatusDot（在线/离线状态）
│   └── PetSwitcher（切换宠物，下拉菜单）
├── MessageList（虚拟滚动）
│   ├── UserMessage（右对齐，蓝色气泡）
│   │   ├── MessageText
│   │   └── TimeStamp
│   ├── AIMessage（左对齐，白色气泡）
│   │   ├── AvatarIcon（宠物头像小图标）
│   │   ├── MessageText（支持markdown渲染）
│   │   ├── ActionCard（内嵌操作卡片，如"查看健康趋势"）
│   │   └── TimeStamp
│   ├── TypingIndicator（AI正在输入动画）
│   │   └── DotAnimation（三个跳动圆点）
│   └── GuardBlockedMessage（守卫拦截提示）
│       ├── BlockedIcon（⚠️图标）
│       └── ExplainText（"这个话题我暂时无法回答"）
├── QuickReplies（快捷提问栏，滑动）
│   └── QuickReplyChip（快捷问题标签）
├── ChatInput
│   ├── TextInput（输入框，支持换行）
│   ├── VoiceInputButton（语音输入，长按）
│   └── SendButton（发送，带loading状态）
├── FeedbackModal（对话反馈）
│   ├── RatingButtons（有用/没用/不合适）
│   └── CommentInput（可选补充说明）
└── EmptyState（空对话状态）
    ├── PetAvatarLarge（大号宠物头像）
    ├── GreetingText（"你好，我是花花！"）
    └── SuggestionChips（建议提问，如"我今天怎么样？"）
```

### 8.4 Store扩展方案（Phase 1.5）

#### 8.4.1 familyStore

```typescript
interface FamilyState {
  // 数据
  families: FamilyResponse[]
  currentFamily: FamilyResponse | null
  members: FamilyMemberResponse[]
  currentMemberRole: string | null

  // 家族图谱
  familyTree: FamilyTreeResponse | null
  lineageTree: LineageTreeResponse | null
  snapshots: GraphSnapshotResponse[]

  // 加载状态
  loading: boolean
  treeLoading: boolean
  error: string | null

  // 操作
  fetchFamilies: () => Promise<void>
  createFamily: (data: CreateFamilyRequest) => Promise<void>
  updateFamily: (id: string, data: UpdateFamilyRequest) => Promise<void>
  deleteFamily: (id: string) => Promise<void>
  setCurrentFamily: (family: FamilyResponse) => void

  // 成员操作
  fetchMembers: (familyId: string) => Promise<void>
  addMember: (familyId: string, data: AddMemberRequest) => Promise<void>
  removeMember: (familyId: string, petId: string) => Promise<void>
  updateMemberRole: (familyId: string, petId: string, role: string) => Promise<void>

  // 图谱操作
  fetchTree: (familyId: string) => Promise<void>
  createRelationship: (familyId: string, data: CreateRelationshipRequest) => Promise<void>
  deleteRelationship: (familyId: string, relId: string) => Promise<void>
  createLineage: (familyId: string, data: CreateLineageRequest) => Promise<void>
  fetchLineage: (familyId: string, petId: string) => Promise<void>
  saveSnapshot: (familyId: string) => Promise<void>
  fetchSnapshots: (familyId: string) => Promise<void>
}
```

#### 8.4.2 calendarStore

```typescript
interface CalendarState {
  // 数据
  currentMonth: { year: number; month: number }
  events: CalendarEventResponse[]
  selectedEvent: CalendarEventResponse | null
  upcomingEvents: UpcomingEventsResponse | null
  timelineView: CalendarTimelineResponse | null

  // 加载状态
  loading: boolean
  eventLoading: boolean
  error: string | null

  // 操作
  fetchEvents: (familyId: string, params: CalendarQueryParams) => Promise<void>
  createEvent: (familyId: string, data: CreateCalendarEventRequest) => Promise<void>
  updateEvent: (familyId: string, eventId: string, data: UpdateCalendarEventRequest) => Promise<void>
  deleteEvent: (familyId: string, eventId: string) => Promise<void>
  completeEvent: (familyId: string, eventId: string) => Promise<void>
  fetchUpcoming: (familyId: string) => Promise<void>
  fetchTimeline: (familyId: string, year: number, month: number) => Promise<void>

  // 导航
  navigateMonth: (direction: 'prev' | 'next') => void
  goToToday: () => void
}
```

#### 8.4.3 feedStore

```typescript
interface FeedState {
  feeds: FeedResponse[]
  highlight: HighlightFeedResponse | null
  filters: {
    feed_type?: string
    pet_id?: string
    date_from?: string
    date_to?: string
  }
  pagination: {
    page: number
    page_size: number
    total: number
    has_more: boolean
  }
  loading: boolean
  submitting: boolean
  error: string | null

  fetchFeeds: (familyId: string, reset?: boolean) => Promise<void>
  createFeed: (familyId: string, data: CreateFeedRequest) => Promise<void>
  updateFeed: (familyId: string, feedId: string, data: UpdateFeedRequest) => Promise<void>
  deleteFeed: (familyId: string, feedId: string) => Promise<void>
  fetchHighlight: (familyId: string) => Promise<void>
  setFilter: (filter: Partial<FeedState['filters']>) => void
  loadMore: (familyId: string) => Promise<void>
}
```

#### 8.4.4 weeklyReportStore

```typescript
interface WeeklyReportState {
  reports: WeeklyReportListResponse['items']
  currentReport: WeeklyReportResponse | null
  loading: boolean
  generating: boolean
  error: string | null

  fetchReports: (familyId: string) => Promise<void>
  fetchLatest: (familyId: string) => Promise<void>
  fetchReport: (familyId: string, reportId: string) => Promise<void>
  generateReport: (familyId: string) => Promise<void>
}
```

#### 8.4.5 leaderboardStore

```typescript
interface LeaderboardState {
  leaderboard: LeaderboardResponse | null
  roles: FamilyRolesResponse | null
  period: 'weekly' | 'monthly' | 'all_time'
  loading: boolean
  roleLoading: boolean
  error: string | null

  fetchLeaderboard: (familyId: string, period?: string) => Promise<void>
  fetchRoles: (familyId: string) => Promise<void>
  assignRole: (familyId: string, data: AssignRoleRequest) => Promise<void>
  updateRole: (familyId: string, roleId: string, data: UpdateRoleRequest) => Promise<void>
  removeRole: (familyId: string, roleId: string) => Promise<void>
  setPeriod: (period: string) => void
}
```

#### 8.4.6 namingStore

```typescript
interface NamingState {
  // 分析模式
  analysisResult: NameAnalysisResponse | null
  // 推荐模式
  recommendation: NameRecommendationResponse | null
  // 历史
  history: NameHistoryResponse['items']
  // 知识库
  knowledge: KnowledgeResponse | null
  // 加载状态
  analyzing: boolean
  recommending: boolean
  error: string | null

  analyzeName: (data: AnalyzeNameRequest) => Promise<void>
  recommendNames: (data: RecommendNameRequest) => Promise<void>
  selectName: (data: SelectNameRequest) => Promise<void>
  fetchHistory: () => Promise<void>
  fetchKnowledge: () => Promise<void>
  clearResults: () => void
}
```

#### 8.4.7 memoirStore

```typescript
interface MemoirState {
  memoirs: MemoirListResponse['items']
  currentTask: MemoirTaskResponse | null
  currentStatus: MemoirStatusResponse | null
  loading: boolean
  polling: boolean
  error: string | null

  createMemoir: (petId: string, data: CreateMemoirRequest) => Promise<void>
  fetchStatus: (petId: string, memoirId: string) => Promise<void>
  fetchMemoirs: (petId: string) => Promise<void>
  deleteMemoir: (petId: string, memoirId: string) => Promise<void>
  startPolling: (petId: string, memoirId: string) => void
  stopPolling: () => void
}
```

#### 8.4.8 shareCardStore

```typescript
interface ShareCardState {
  cards: ShareCardListResponse['items']
  currentCard: ShareCardResponse | null
  generating: boolean
  error: string | null

  generateCard: (data: GenerateShareCardRequest) => Promise<void>
  fetchCards: () => Promise<void>
  fetchCard: (cardId: string) => Promise<void>
  deleteCard: (cardId: string) => Promise<void>
  recordShare: (cardId: string, channel: string) => Promise<void>
}
```

#### 8.4.9 yearlyReviewStore

```typescript
interface YearlyReviewState {
  reviews: YearlyReviewListResponse['items']
  currentReview: YearlyReviewResponse | null
  loading: boolean
  generating: boolean
  error: string | null

  createReview: (petId: string, data: CreateYearlyReviewRequest) => Promise<void>
  fetchReview: (petId: string, year: number) => Promise<void>
  fetchReviews: (petId: string) => Promise<void>
  updateReview: (petId: string, reviewId: string, data: UpdateYearlyReviewRequest) => Promise<void>
  generateVideo: (petId: string, reviewId: string) => Promise<void>
}
```

#### 8.4.10 chatStore

```typescript
interface ChatState {
  messages: ChatMessage[]
  currentIntent: ChatResponse['intent'] | null
  currentPetId: string | null
  typing: boolean
  sending: boolean
  error: string | null

  sendMessage: (data: ChatRequest) => Promise<void>
  fetchHistory: (petId?: string) => Promise<void>
  clearHistory: () => Promise<void>
  sendFeedback: (data: ChatFeedbackRequest) => Promise<void>
  setCurrentPet: (petId: string) => void
  addMessage: (message: ChatMessage) => void  // 乐观更新用
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: string
  actions?: ChatResponse['actions']
  guard_info?: ChatResponse['guard_info']
  created_at: string
}
```

---

## 九、AI实现策略

### 9.1 三阶段实现

| 阶段 | 用户量 | AI能力 | 实现 | 月成本 |
|------|--------|--------|------|--------|
| 冷启动 | 0-1000 | 纯规则引擎 | 健康打卡→5级选择→预设反馈模板；食物查询→知识图谱精确匹配；症状初筛→规则引擎+紧急度映射 | 0元 |
| 成长 | 1000-1万 | +小模型 | +简单健康趋势分析；+模板化月度报告 | ~500元 |
| 成熟 | 1万+ | +大模型 | +个性化健康建议；+叙事化月度报告 | ~5000元 |

### 9.2 规则引擎核心

```typescript
interface UrgencyRule {
  symptoms: string[]
  conditions: Record<string, string>
  urgency: UrgencyLevel
  suggestion: string
}

interface FoodSafetyEntry {
  id: string
  name: string
  safetyLevel: FoodSafetyLevel
  dangerousCompounds: string[]
  toxicDoses: string
  symptoms: string[]
  breedWarnings: { breed: string; note: string }[]
}

interface AnomalyRule {
  metric: string
  consecutiveDays: number
  deviationThreshold: number
  action: string
}

interface BreedEntry {
  id: string
  name: string
  species: string
  geneticDiseases: string[]
  weightRange: { min: number; max: number }
  dietaryRestrictions: string[]
  vaccineSchedule: string
}
```

4类规则映射：
- 症状→紧急度映射（urgencyRules.json）
- 食物→安全等级映射（foodSafety.json）
- 打卡→异常检测（连续3天偏离基线）
- 品种→遗传病易感（breeds.json）

### 9.3 知识图谱数据结构

```json
{
  "id": "vomiting",
  "name": "呕吐",
  "category": "digestive",
  "relatedSymptoms": ["diarrhea", "not_eating", "lethargy"],
  "urgencyBase": "yellow",
  "speciesApplicable": ["cat", "dog"]
}
```

```json
{
  "id": "chocolate",
  "name": "巧克力",
  "safetyLevel": "toxic",
  "dangerousCompounds": ["可可碱", "咖啡因"],
  "toxicDoses": "犬：100-200mg/kg可可碱",
  "symptoms": ["呕吐", "腹泻", "心跳加速", "抽搐"],
  "breedWarnings": []
}
```

```json
{
  "id": "scottish_fold",
  "name": "折耳猫",
  "species": "cat",
  "geneticDiseases": ["骨骼发育不良", "软骨病"],
  "weightRange": { "min": 3, "max": 6 },
  "dietaryRestrictions": ["高钙饮食需谨慎"],
  "vaccineSchedule": "cat_standard"
}
```

```json
{
  "id": "cat_standard",
  "name": "猫标准疫苗计划",
  "species": "cat",
  "schedule": [
    { "age": "8weeks", "vaccine": "猫三联第1针", "type": "vaccine" },
    { "age": "12weeks", "vaccine": "猫三联第2针", "type": "vaccine" },
    { "age": "16weeks", "vaccine": "猫三联第3针", "type": "vaccine" },
    { "age": "6months", "vaccine": "狂犬疫苗", "type": "vaccine" },
    { "age": "yearly", "vaccine": "加强针", "type": "vaccine" }
  ]
}
```

---

## 十、安全设计

### 10.1 PetSafetyHandler（P0）

| 安全场景 | 检测条件 | 响应动作 | 弹窗行为 |
|---------|---------|---------|---------|
| 有毒食物拦截 | 食物查询结果为toxic | 强制弹窗+免责声明+就医建议 | 不可关闭，3秒延迟 |
| 红色预警触发 | 打卡出现血便/不吃+萎靡 | 不可关闭弹窗+立即就医建议 | 不可关闭，3秒延迟 |
| 症状红色评估 | 症状初筛AI评估为🔴 | 不可关闭弹窗+急诊建议 | 不可关闭，3秒延迟 |
| 医疗边界声明 | 所有AI建议 | 附加"仅供参考，不替代兽医诊断" | 常规展示 |

保守策略：宁可误报不可漏报。红色预警弹窗展示≥3秒后按钮才可点击，防止误触快速关闭。

### 10.1b AI Guard 双守卫（P0新增）

| 守卫层 | 检测范围 | 动作 | 成本 |
|--------|---------|------|------|
| 规则Guard | P0关键词、有毒食物500+、隐私正则 | 阻断+弹窗 | 0元 |
| AI Guard | 有害意图、不安全医疗建议、情绪危机 | 阻断/重新生成/安全干预 | ~0.0005元/次 |

**AI对话全流程安全**：
1. 用户输入 → 规则Guard快速筛查 → 通过
2. → AI Guard语义检测 → 通过
3. → AI宠物对话生成回答
4. → AI Guard输出安全过滤 → 安全
5. → 返回用户

### 10.2 数据隐私

| 数据类型 | 隐私级别 | 存储方式 |
|---------|---------|---------|
| 宠物健康数据 | private | 本地优先+云端加密备份 |
| 宠物照片 | private | S3兼容对象存储 |
| 情绪触发记录 | encrypted | 端到端加密 |
| 宠物离世悲伤记录 | encrypted | 端到端加密 |
| 食物查询记录 | public（不含用户身份） | 云端 |

### 10.3 合规边界

| 定位 | 能做 | 不能做 |
|------|------|--------|
| 宠物=分诊≠诊断 | "检测到异常信号，建议就医" | "你的猫得了肠胃炎" |
| 症状初筛=健康参考≠医疗建议 | 评估紧急程度、提供观察建议 | 开处方/推荐具体药品 |
| 情绪=隐形化≠心理服务 | 场景化情绪支持（呼吸、书写） | 心理诊断/治疗 |

### 10.4 微信小程序隐私合规

#### 10.4.1 隐私协议覆盖范围

| 数据类型 | 收集目的 | 授权时机 | 使用范围 |
|---------|---------|---------|---------|
| 微信昵称/头像 | 用户身份展示 | 首次进入小程序 | 仅在本小程序内展示 |
| 用户手机号 | 会员登录/订阅通知 | 首次使用会员功能 | 仅用于会员服务和订阅消息 |
| 宠物照片 | 宠物形象生成/回忆录制作 | 首次上传照片 | 仅用于当前用户的功能生成 |
| 宠物健康数据 | 健康打卡/趋势分析/症状初筛 | 首次使用健康功能 | 本地优先，云端加密存储 |
| 用户位置 | 附近医院推荐 | 首次使用就医推荐 | 仅单次查询，不存储 |
| 用户操作日志 | 功能优化/问题排查 | 首次进入小程序（弹窗说明） | 脱敏后用于分析 |

#### 10.4.2 隐私授权流程

```
用户首次进入小程序
  ↓
隐私协议弹窗（必须同意，否则退出）
├── 标题：用户服务协议 & 隐私政策
├── 内容摘要：收集哪些数据、如何使用、如何保护
├── "查看完整协议"链接（跳转webview）
├── "同意并继续"按钮（必选）
└── "不同意并退出"按钮（灰色，不选中）

用户首次使用功能
  ↓
功能专项授权（按需弹窗，非一次性全部索取）
├── 照片授权：使用宠物回忆录/形象生成时弹窗
│   ├── 说明："我们需要访问您的相册以选择宠物照片"
│   ├── "允许" / "拒绝"
│   └── 拒绝后：显示手动上传替代方案
├── 订阅消息授权：使用疫苗提醒/周报时弹窗
│   ├── 说明："开启后我们会在疫苗到期/周报就绪时通知您"
│   ├── "允许" / "暂不开启"
│   └── 拒绝后：可在设置中重新开启
└── 位置授权：使用附近医院时弹窗
    ├── 说明："获取您的位置以推荐最近的宠物医院"
    ├── "允许" / "拒绝"
    └── 拒绝后：显示热门医院列表（不依赖位置）
```

#### 10.4.3 数据生命周期

| 阶段 | 处理方式 | 技术实现 |
|------|---------|---------|
| 收集时 | 最小化原则，只收集必要数据 | 前端校验，不传多余字段 |
| 存储时 | 敏感数据加密 | 本地：Taro Storage加密；云端：PostgreSQL pgcrypto加密 |
| 使用时 | 仅用于用户授权的目的 | 功能级权限校验 |
| 传输时 | HTTPS加密 | 全站HTTPS |
| 删除时 | 用户可主动删除所有数据 | 设置页面提供"清除所有数据"按钮 |
| 注销时 | 7天内自动清理全部数据 | 定时任务扫描注销用户 |

#### 10.4.4 微信小程序审核注意事项

| 审核项 | 要求 | 实施方案 |
|-------|------|---------|
| 类目选择 | 工具-宠物 > 需提供《动物诊疗许可证》或"仅做参考不替代诊断"声明 | 选择"工具-信息查询"类目，首页加免责声明 |
| 用户隐私保护指引 | 必须填写全部收集字段 | 按10.4.1表格逐项填写 |
| 相册权限 | 必须说明用途 | 弹窗文案："选择宠物照片制作回忆录" |
| 订阅消息 | 不得诱导开启 | 仅功能使用时弹窗，不强制 |
| 虚拟支付 | 小程序需开通微信支付 | 会员服务走微信支付 |
| 用户协议 | 必须包含用户协议和隐私政策链接 | 设置页面底部固定展示 |
| 儿童保护 | 涉及儿童使用需特殊说明 | 隐私政策中注明"14岁以下需监护人同意" |

#### 10.4.5 合规检查清单

```
[ ] 隐私政策已更新并覆盖所有数据收集场景
[ ] 首次启动弹窗明确告知数据收集范围
[ ] 功能授权按需弹窗，非一次性全部索取
[ ] 数据加密存储方案已实现
[ ] 用户数据删除功能已实现
[ ] 用户注销自动清理功能已实现
[ ] 微信小程序类目选择正确
[ ] 订阅消息非诱导开启
[ ] 儿童保护说明已加入隐私政策
[ ] 首页医疗免责声明已展示
```

### 10.5 SQL注入防护策略（P0新增）

> 项目使用 PostgreSQL 直连访问（无ORM），必须严格遵循以下防护策略。

#### 10.5.1 参数化查询（强制）

所有数据库操作必须使用参数化查询，禁止任何形式的字符串拼接SQL。

```typescript
// ✅ 正确：参数化查询
const query = 'SELECT * FROM pet_profiles WHERE user_id = $1 AND id = $2';
const result = await pool.query(query, [userId, petId]);

// ❌ 禁止：字符串拼接
const query = `SELECT * FROM pet_profiles WHERE user_id = '${userId}'`;
```

#### 10.5.2 动态字段安全处理

对于动态排序字段、表名等无法参数化的场景，必须使用白名单校验：

```typescript
// 排序字段白名单
const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'name', 'date'] as const;
type SortField = typeof ALLOWED_SORT_FIELDS[number];

function validateSortField(field: string): SortField {
  if (!ALLOWED_SORT_FIELDS.includes(field as SortField)) {
    throw new ValidationError(`非法排序字段: ${field}`);
  }
  return field as SortField;
}

// 排序方向白名单
const ALLOWED_SORT_DIRECTIONS = ['ASC', 'DESC'] as const;

// 使用
const sortField = validateSortField(req.query.sort_by);
const sortDir = ALLOWED_SORT_DIRECTIONS.includes(req.query.order?.toUpperCase() as any)
  ? req.query.order.toUpperCase() : 'DESC';
const query = `SELECT * FROM pet_moments ORDER BY ${sortField} ${sortDir} LIMIT $1 OFFSET $2`;
```

#### 10.5.3 数据库访问层封装

所有数据库操作必须通过统一的 Repository 层封装，禁止在 Service/Controller 层直接写SQL：

```typescript
// repositories/petRepository.ts
export class PetRepository {
  constructor(private db: Pool) {}

  async findById(id: string, userId: string): Promise<PetProfile | null> {
    const result = await this.db.query(
      'SELECT * FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0] ?? null;
  }

  async create(data: CreatePetInput): Promise<PetProfile> {
    const result = await this.db.query(
      `INSERT INTO pet_profiles (user_id, name, species, breed, gender, birthday)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.userId, data.name, data.species, data.breed, data.gender, data.birthday]
    );
    return result.rows[0];
  }
}
```

#### 10.5.4 注入防护检查清单

| 检查项 | 要求 | 验证方式 |
|-------|------|---------|
| 参数化查询 | 所有WHERE/INSERT/UPDATE条件必须使用$1/$2占位符 | Code Review + ESLint自定义规则 |
| 动态字段白名单 | 排序字段、表名必须白名单校验 | 单元测试覆盖非法字段 |
| Repository层隔离 | 禁止在Service/Controller直接写SQL | 架构层级扫描脚本 |
| 输入校验 | 所有API参数通过Zod schema校验 | 中间件自动校验 |
| 错误信息脱敏 | 数据库错误不得直接返回前端 | 统一错误处理中间件 |

---

## 十一、性能与限制

### 11.1 小程序限制应对

| 限制 | 应对 |
|------|------|
| 包大小2MB | 分包加载：主包+宠物包+数据包+情绪包 |
| 本地存储10MB | 只存近期打卡数据+宠物档案，历史上传云端 |
| 网络请求10个并发 | 请求合并+缓存 |
| setData性能 | 虚拟列表+减少更新频率 |

### 11.2 分包策略

```
主包（<700KB）：
├── 入口页（宠物/职业双入口）
├── 登录/Auth
├── 公共组件+工具+Store
└── memory-body核心

分包pagesPet（<2MB）：
├── AI对话主页（NEW）
├── 时间线视图（NEW）
├── 家族图谱（NEW）
├── 家庭看板/日历（NEW）
├── 取名页面（NEW）
├── 宠物档案/打卡/症状/食物/疫苗/趋势
└── 宠物形象引擎

分包pagesCareer（Phase 3，暂不开发）
```

知识图谱CDN化：symptoms.json、foodSafety.json、breeds.json等大文件放CDN，按需加载，不占包体积。

### 11.3 性能优化详细方案

#### 11.3.1 首屏加载优化

| 优化项 | 方案 | 预期效果 |
|-------|------|---------|
| 分包加载 | 按功能模块分包，首页仅加载主包 | 首屏JS < 700KB |
| 组件按需加载 | 使用React.lazy + Suspense，非首屏组件异步加载 | 减少首屏渲染组件数50%+ |
| 图片懒加载 | 使用Taro原生懒加载属性，配合IntersectionObserver | 图片加载延迟至可见区域 |
| 预加载策略 | 首页加载完成后预加载宠物分包 | 用户跳转时无感知 |
| 骨架屏 | 每个页面提供骨架屏占位 | 消除白屏，LCP体验提升 |
| 关键CSS内联 | 首屏关键样式内联到HTML，非关键样式异步加载 | 减少CSS阻塞渲染时间 |
| 字体按需加载 | 仅加载使用的字体子集，避免全量加载 | 减少字体文件体积80%+ |

**首屏加载流程**：

```
用户打开小程序
  ↓
主包加载（<700KB）
├── app.js + app.wxss（框架核心）
├── pages/index/index（首页）
├── 公共组件（PetAvatar, EmergencyAlert等）
├── Store基础（authStore, petStore）
└── memory-body核心
  ↓
首页渲染完成（< 2.5秒）
  ↓
后台预加载分包pagesPet
  ↓
用户点击进入宠物页 → 分包已加载，立即渲染
```

#### 11.3.2 图片优化策略

| 场景 | 优化方案 | 格式 | 尺寸 |
|------|---------|------|------|
| 宠物头像 | 裁剪为正方形，CDN缩放 | WebP | 120×120px |
| 打卡照片 | 压缩至80%质量，最长边1200px | JPEG | ≤1200px宽 |
| 回忆录照片 | 上传原图，生成多尺寸副本 | WebP/AVIF | 缩略图360px / 展示图1080px |
| 分享卡片 | 服务端渲染为图片，直接返回 | PNG | 750×1334px |
| 家族图谱缩略图 | 截图后压缩 | WebP | 480×360px |
| 表情SVG | 直接使用SVG代码，不加载图片 | SVG | 按需渲染 |

**图片加载优先级**：

```
L0（立即加载）：宠物头像、TabBar图标、首页宠物卡片
  ↓
L1（可见即加载）：打卡照片、日历事件封面
  ↓
L2（滚动加载）：动态墙照片、回忆录历史列表
  ↓
L3（点击加载）：家族图谱大图、年度回忆原图
```

#### 11.3.3 数据获取优化

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| 请求合并 | 同一页面多个请求合并为一个 | 首页同时加载宠物列表+今日打卡+家庭成员 |
| 请求去重 | 相同请求在pending时自动合并 | 多个组件同时请求同一数据 |
| 预加载 | 页面跳转前预加载目标页数据 | 从家庭页→日历页，提前加载日历数据 |
| 缓存优先 | 先读缓存再请求，缓存命中直接渲染 | 宠物档案、知识库数据 |
| 增量更新 | 只请求变更的数据，不拉取全量 | 动态墙新消息、日历新事件 |
| 数据预取 | 首页加载完成后预取下一个可能页面的数据 | 用户行为预测（如常看打卡） |

**请求优先级队列**：

```typescript
interface RequestPriority {
  critical: Request[]     // 必须立刻执行（首页渲染数据）
  high: Request[]         // 尽快执行（用户可见区域数据）
  normal: Request[]       // 正常执行（滚动区域数据）
  low: Request[]          // 空闲执行（预加载、历史数据）
  deferred: Request[]     // 延迟执行（后台同步、日志上报）
}

// 执行策略
const PRIORITY_EXECUTION = {
  critical: { maxConcurrent: 6, timeout: 5000 },
  high:     { maxConcurrent: 4, timeout: 10000 },
  normal:   { maxConcurrent: 2, timeout: 15000 },
  low:      { maxConcurrent: 1, timeout: 30000 },
  deferred: { maxConcurrent: 1, timeout: 60000, idleCallback: true },
}
```

#### 11.3.4 渲染性能优化

| 优化项 | 实现方式 | 预期效果 |
|-------|---------|---------|
| 虚拟滚动 | 动态墙列表、对话历史列表使用虚拟滚动 | 仅渲染可见区域，列表性能提升10倍+ |
| 防抖/节流 | 搜索输入防抖300ms，滚动事件节流100ms | 减少高频触发导致的渲染卡顿 |
| 批量更新 | 多个setState合并为一次 | 减少小程序setData次数 |
| 不可变数据 | 使用Immer或手动不可变更新 | 避免不必要的重渲染 |
| 组件memo | 纯展示组件使用React.memo包裹 | 减少无数据变化的组件重渲染 |
| 避免内联样式 | 使用CSS类名替代内联样式 | 减少样式计算开销 |
| 长列表分页 | 每次加载20条，滚动到底部加载更多 | 减少单次渲染DOM节点数 |

**虚拟滚动配置**：

```typescript
const VIRTUAL_SCROLL_CONFIG = {
  feedList:  { itemHeight: 120, overscan: 3, pageSize: 20 },
  chatList:  { itemHeight: 80,  overscan: 5, pageSize: 30 },
  calendar:  { itemHeight: 60,  overscan: 2, pageSize: 31 },
  memoirList:{ itemHeight: 200, overscan: 2, pageSize: 10 },
  feedCards: { itemHeight: 300, overscan: 2, pageSize: 10 },
}
```

#### 11.3.5 微信小程序分包优化

**分包方案**：

```
主包（~650KB）
├── app.js / app.wxss（框架）
├── pages/index/index（首页）
├── components/common/（公共组件）
├── stores/（基础Store）
├── utils/（工具函数）
├── memory-body/（核心引擎）
└── assets/（公共图标+字体子集）

分包pagesPet（~1.5MB）
├── pagesPet/chat/（AI对话）
├── pagesPet/timeline/（时间线）
├── pagesPet/family/（家庭）
├── pagesPet/naming/（取名）
├── pages/checkin/（打卡）
├── pages/food-query/（食物查询）
├── pages/symptom-check/（症状初筛）
├── pages/vaccine-calendar/（疫苗）
├── pages/health-trend/（健康趋势）
├── pages/pet-profile/（宠物档案）
├── pages/pet-add/（添加宠物）
├── components/pet/（宠物组件）
├── components/checkin/（打卡组件）
├── components/food/（食物组件）
├── components/symptom/（症状组件）
├── components/vaccine/（疫苗组件）
├── components/trend/（趋势组件）
├── components/family/（家庭组件）
├── components/naming/（取名组件）
├── components/chat/（对话组件）
├── engines/（所有引擎）
└── assets/（分包专用图片）

分包pagesMember（~200KB）
├── pages/member/（会员）
├── pages/mine/（我的）
├── pages/login/（登录）
└── components/member/（会员组件）

独立分包（~100KB）
├── pages/onboarding/（引导页）
├── pages/error/（错误页）
└── emotion/（情绪底层，条件加载）
```

**分包加载策略**：

```typescript
const SUBPACKAGE_STRATEGY = {
  // 预加载：首页渲染完成后后台加载
  preload: ['pagesPet'],
  // 按需加载：用户点击时加载
  lazy: ['pagesMember'],
  // 独立分包：入口不依赖主包
  independent: ['pages/onboarding', 'pages/error'],
}

// 预加载时机
const PRELOAD_TIMING = {
  // 首页渲染完成后立即预加载（最快）
  immediate: ['pagesPet'],
  // 首页交互空闲时预加载
  idle: ['pagesMember'],
  // 用户首次操作后预加载
  afterFirstInteraction: [],
}
```

---

## 十二、测试策略

### 12.1 测试分层与覆盖率目标

| 层级 | 范围 | 工具 | 覆盖率目标 | 命名规范 |
|------|------|------|-----------|---------|
| 单元测试 | 纯函数、工具类、Repository、Service | Vitest | ≥80% | `{文件名}.test.ts` |
| 组件测试 | UI组件交互、表单校验、状态展示 | Vitest + Testing Library | ≥70% | `{组件名}.test.tsx` |
| 集成测试 | API路由→Service→Repository全链路 | Vitest + supertest | 核心流程100% | `{模块}.integration.test.ts` |
| E2E测试 | 用户关键路径（打卡→AI反馈→预警） | 微信小程序自动化SDK | 核心流程覆盖 | `e2e/{场景名}.spec.ts` |

### 12.2 测试文件组织

```
src/
├── __tests__/
│   ├── unit/                    # 单元测试
│   │   ├── utils/
│   │   │   ├── formatDate.test.ts
│   │   │   └── validatePhone.test.ts
│   │   ├── services/
│   │   │   ├── petService.test.ts
│   │   │   └── healthService.test.ts
│   │   └── repositories/
│   │       └── petRepository.test.ts
│   ├── component/               # 组件测试
│   │   ├── CheckinForm.test.tsx
│   │   └── FoodQuery.test.tsx
│   ├── integration/             # 集成测试
│   │   ├── checkin.flow.test.ts
│   │   └── membership.flow.test.ts
│   └── e2e/                     # E2E测试
│       ├── core-checkin.spec.ts
│       └── food-query.spec.ts
└── __mocks__/                   # Mock数据
    ├── handlers/
    │   └── api.mock.ts          # MSW请求拦截
    ├── data/
    │   ├── pet.mock.ts          # 宠物假数据
    │   └── checkin.mock.ts      # 打卡假数据
    └── server.ts                # 测试服务器实例
```

### 12.3 Mock策略

| 依赖 | Mock方式 | 说明 |
|------|---------|------|
| 外部AI API（DeepSeek/GLM-4） | MSW拦截HTTP请求 | 返回预设响应，不消耗API额度 |
| PostgreSQL | 内存数据库或pg-mem | 隔离数据库环境，测试速度更快 |
| 微信小程序API（wx.login等） | 手动Mock | `vi.mock('wx')` 替换关键API |
| 文件存储 | 临时目录+清理 | 测试后自动清理临时文件 |
| WebSocket | 内存事件模拟 | 不建立真实连接 |

### 12.4 测试数据管理

```typescript
// 使用工厂函数生成测试数据，避免硬编码
function createMockPet(overrides: Partial<PetProfile> = {}): PetProfile {
  return {
    id: 'pet-001',
    user_id: 'user-001',
    name: '测试宠物',
    species: 'cat',
    breed: '英短',
    gender: 'male',
    birthday: '2020-01-01',
    ...overrides,
  };
}

// 每个测试用例使用独立数据，不共享状态
describe('PetRepository', () => {
  beforeEach(async () => {
    await setupTestDatabase(); // 每次测试前重置数据库
  });

  afterEach(async () => {
    await cleanupTestDatabase(); // 每次测试后清理
  });
});
```

### 12.5 小程序E2E测试方案

使用微信官方 [miniprogram-automator](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/) 自动化测试：

```typescript
// e2e/core-checkin.spec.ts
import automator from 'miniprogram-automator';

describe('核心打卡流程E2E', () => {
  let miniProgram: any;

  beforeAll(async () => {
    miniProgram = await automator.launch({
      cliPath: '/path/to/wechat/devtools',
      projectPath: '/path/to/project',
    });
  });

  afterAll(async () => {
    await miniProgram.close();
  });

  test('用户完成健康打卡并收到AI反馈', async () => {
    const page = await miniProgram.currentPage();
    // 选择食欲等级
    await page.callMethod('selectAppetite', { level: 3 });
    // 选择便便等级
    await page.callMethod('selectPoop', { level: 4 });
    // 提交打卡
    await page.callMethod('submitCheckin');
    // 验证AI反馈
    const feedback = await page.data('aiFeedback');
    expect(feedback).toBeDefined();
    expect(feedback.level).toBe('normal');
  });
});
```

### 12.6 重点测试清单（不可遗漏）

| 测试项 | 测试场景 | 验证标准 |
|-------|---------|---------|
| PetSafetyHandler有毒食物拦截 | 查询葡萄/巧克力/洋葱 | 必须拦截，弹窗不可关闭 |
| 红色预警触发 | 打卡血便/不吃+萎靡 | 必须触发，弹窗≥3秒 |
| 症状紧急度评估 | 猫呕吐+精神萎靡 | 评估为红色，建议就医 |
| 打卡异常检测 | 连续3天偏离基线20% | 触发趋势预警 |
| 会员配额控制 | 免费用户第2次2D生成 | 拒绝并引导升级 |
| 数据同步 | 离线打卡后恢复网络 | 数据不丢失，正确合并 |
| SQL注入防护 | 输入 `' OR 1=1 --` | 返回空结果，不泄露数据 |
| 越权访问 | 用户A访问用户B的宠物 | 返回403 |
| WebSocket未授权连接 | 无token连接WebSocket | 连接被拒绝 |
| 回忆录并发限制 | 同一宠物同时2次生成 | 第2次拒绝 |

---

## 十三、部署与发布

### 13.1 环境

| 环境 | 用途 | 后端 |
|------|------|------|
| 开发 | 本地开发 | Express本地 + PostgreSQL Docker |
| 预发布 | 灰度测试 | Express预发布服务器 + PostgreSQL预发布库 |
| 生产 | 正式 | Express生产集群 + PostgreSQL主从 |

### 13.2 CI/CD

```yaml
on:
  push:
    branches: [main]

jobs:
  build:
    steps:
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build:weapp
```

---

## 十四、现有代码迁移方案

### 14.1 迁移步骤

```
1. 保留memory-body引擎（70%复用）
2. 保留Express后端框架和JWT认证系统
3. 保留加密模块
4. 删除情绪专用页面（treehole, emergency, calendar, mood, test, ritual, growth）
5. 删除情绪专用组件（BreathingAnimation, WhiteNoisePlayer, MoodSelector, TreeholePostCard等）
6. 删除情绪专用引擎（EmergencyEngine, Day3InterventionEngine, EmotionTestEngine等）
7. 新建宠物模块页面和组件
8. 新建宠物安全引擎（PetSafetyHandler P0优先）
9. 新建宠物知识图谱数据
10. 联调测试
```

### 14.2 代码复用清单

| 现有代码 | 迁移方式 | 改造量 |
|---------|---------|--------|
| memory-body/ | 直接复用+扩展宠物类型 | 10% |
| 情绪记录框架 | → 3秒健康打卡 | 30% |
| 风险日历 | → 疫苗驱虫日历 | 40% |
| 风险评估引擎 | → 症状初筛 | 30% |
| 安全过滤引擎 | → 宠物安全过滤 | 20% |
| 主动触达引擎 | → 疫苗提醒+异常预警 | 15% |
| 急救箱流程 | → 情绪底层悲伤陪伴 | 10% |
| Express后端框架 | 直接复用 | 0% |
| JWT认证系统 | 直接复用 | 0% |
| 加密模块 | 直接复用 | 0% |

---

## 十五、非功能需求

- 主载体：微信小程序（Taro 3）
- 后期扩展：App（Capacitor）
- 本地优先，云端可选同步
- 宠物健康数据云端加密
- 端到端加密（悲伤记录、情绪底层记录）
- 离线可用（打卡功能）
- 测试覆盖率 > 80%
- 小程序包大小 < 2MB（主包）
- 首屏加载 < 2.5秒
- 交互响应 < 100毫秒

---

## 十六、国际化（i18n）方案

### 16.1 语言包组织结构

```
src/i18n/
├── index.ts                    # 入口：初始化i18n实例
├── locales/
│   ├── zh-CN/                  # 简体中文（默认）
│   │   ├── common.ts           # 通用文本
│   │   ├── pet.ts              # 宠物模块
│   │   ├── health.ts           # 健康模块
│   │   ├── family.ts           # 家庭模块（Phase 1.5）
│   │   ├── naming.ts           # 取名模块
│   │   ├── memoir.ts           # 回忆录模块
│   │   ├── member.ts           # 会员模块
│   │   ├── emotion.ts          # 情绪底层
│   │   ├── error.ts            # 错误提示
│   │   └── validation.ts       # 表单验证
│   └── en-US/                  # 英文（结构同zh-CN）
│       ├── common.ts
│       └── ...
└── types.ts                    # i18n key类型声明
```

### 16.2 Key命名规范

```
模块.页面.字段.属性

示例：
  common.button.confirm        → "确认"
  pet.profile.name             → "宠物名字"
  health.checkin.poopLevel     → "便便状态"
  family.calendar.title        → "家庭日历"
  naming.analyze.score         → "综合评分"
  error.network.timeout        → "网络超时，请重试"
  validation.required          → "{field}不能为空"
```

### 16.3 按需加载策略

```typescript
// 懒加载语言包，不占主包体积
const i18nConfig = {
  // 默认语言（主包加载）
  defaultLanguage: 'zh-CN',
  defaultNS: 'common',

  // 按模块懒加载
  lazyLoad: {
    pet:     () => import('./locales/zh-CN/pet'),
    health:  () => import('./locales/zh-CN/health'),
    family:  () => import('./locales/zh-CN/family'),
    naming:  () => import('./locales/zh-CN/naming'),
    memoir:  () => import('./locales/zh-CN/memoir'),
    member:  () => import('./locales/zh-CN/member'),
    emotion: () => import('./locales/zh-CN/emotion'),
  },

  // 后备语言
  fallbackLanguage: 'zh-CN',
}

// 使用时自动加载
function useI18n(namespace: string) {
  const { t, i18n } = useTranslation(namespace)
  // 如果namespace未加载，自动触发懒加载
  return { t }
}
```

### 16.4 日期/时间格式化

```typescript
const DATE_FORMATS = {
  // 相对时间
  relative: {
    just_now: '刚刚',
    minutes_ago: '{minutes}分钟前',
    hours_ago: '{hours}小时前',
    yesterday: '昨天',
    days_ago: '{days}天前',
  },
  // 绝对时间
  absolute: {
    date: 'YYYY年M月D日',
    dateTime: 'YYYY年M月D日 HH:mm',
    monthDay: 'M月D日',
    time: 'HH:mm',
  },
  // 日历专用
  calendar: {
    weekDay: '周{day}',
    monthTitle: 'YYYY年M月',
    weekRange: 'M月D日 - M月D日',
  },
}
```

### 16.5 支持语言与扩展

| 语言 | 支持状态 | 优先级 | 说明 |
|------|---------|-------|------|
| zh-CN | MVP支持 | P0 | 默认语言 |
| en-US | 架构预留 | P2 | 上线后配置翻译 |
| 更多语言 | 架构预留 | P3 | 按需扩展 |

**扩展方式**：在 `locales/` 下新增语言目录，复制相同结构翻译即可，无需修改代码。

---

## 十七、错误码统一体系

### 17.1 错误码结构

```
HTTP状态码 + 业务码（6位数字）
格式：AB-CDEFG
  A = 模块标识
  B = 错误级别
  CDEFG = 具体错误编号

模块标识：
  1 = 通用/系统
  2 = 认证
  3 = 宠物
  4 = 健康
  5 = 家庭
  6 = 命名
  7 = 回忆录
  8 = 会员/支付
  9 = 同步

错误级别：
  0 = 信息
  1 = 警告
  2 = 错误
  3 = 严重
```

### 17.2 完整错误码表

| HTTP状态码 | 业务码 | 名称 | 说明 | 处理方式 |
|-----------|--------|------|------|---------|
| **通用/系统** |
| 400 | 100001 | BAD_REQUEST | 请求参数错误 | 前端校验提示 |
| 400 | 100002 | INVALID_PARAM | 参数格式错误 | 显示具体字段错误 |
| 401 | 100003 | UNAUTHORIZED | 未登录或Token过期 | 自动跳转登录页 |
| 403 | 100004 | FORBIDDEN | 无权限访问 | 显示无权限提示 |
| 404 | 100005 | NOT_FOUND | 资源不存在 | 显示404页面 |
| 429 | 100006 | RATE_LIMIT | 请求频率过高 | 显示"操作太快，请稍后再试" |
| 500 | 100007 | INTERNAL_ERROR | 服务器内部错误 | 显示"系统繁忙，请稍后再试" |
| 503 | 100008 | SERVICE_UNAVAILABLE | 服务暂不可用 | 显示维护提示 |
| **认证模块** |
| 401 | 200001 | LOGIN_EXPIRED | 登录态过期 | 自动静默重新登录 |
| 401 | 200002 | INVALID_CODE | 微信code无效 | 重新调用wx.login |
| 403 | 200003 | USER_BANNED | 用户被封禁 | 显示封禁提示，联系客服 |
| 400 | 200004 | PHONE_REQUIRED | 需要手机号 | 弹窗授权手机号 |
| **宠物模块** |
| 400 | 300001 | PET_NAME_REQUIRED | 宠物名字不能为空 | 表单校验提示 |
| 400 | 300002 | INVALID_SPECIES | 无效的宠物品种 | 下拉选择代替输入 |
| 404 | 300003 | PET_NOT_FOUND | 宠物不存在 | 返回列表页 |
| 403 | 300004 | PET_NOT_OWNER | 不是该宠物的主人 | 显示无权操作 |
| 400 | 300005 | PET_LIMIT_EXCEEDED | 免费用户宠物数量上限 | 提示升级会员 |
| 400 | 300006 | PET_ALREADY_DECEASED | 宠物已标记离世 | 操作限制提示 |
| **健康模块** |
| 400 | 400001 | INVALID_POOP_LEVEL | 便便等级超出范围(1-5) | 前端约束 |
| 400 | 400002 | INVALID_APPETITE | 食欲等级超出范围(1-5) | 前端约束 |
| 400 | 400003 | INVALID_SPIRIT | 精神等级超出范围(1-5) | 前端约束 |
| 400 | 400004 | DUPLICATE_CHECKIN | 今日已打卡 | 显示"今日已打卡" |
| 400 | 400005 | SYMPTOM_TOO_MANY | 症状选择过多(最多5个) | 前端限制 |
| 429 | 400006 | FOOD_QUERY_LIMIT | 免费用户每日食物查询上限 | 提示升级会员 |
| 429 | 400007 | SYMPTOM_CHECK_LIMIT | 免费用户每日症状初筛上限 | 提示升级会员 |
| **家庭模块** |
| 400 | 500001 | FAMILY_NAME_REQUIRED | 家庭名称不能为空 | 表单校验 |
| 404 | 500002 | FAMILY_NOT_FOUND | 家庭不存在 | 返回家庭列表 |
| 403 | 500003 | NOT_FAMILY_MEMBER | 不是家庭成员 | 显示无权操作 |
| 400 | 500004 | PET_ALREADY_IN_FAMILY | 宠物已在其他家庭 | 提示先退出原家庭 |
| 400 | 500005 | FAMILY_LIMIT_EXCEEDED | 免费用户家庭数量上限 | 提示升级会员 |
| 400 | 500006 | INVALID_RELATION_TYPE | 无效的关系类型 | 下拉选择 |
| 400 | 500007 | DUPLICATE_RELATIONSHIP | 关系已存在 | 提示已存在 |
| 400 | 500008 | INVALID_EVENT_DATE | 无效的日历事件日期 | 日期选择器约束 |
| **命名模块** |
| 400 | 600001 | NAME_TOO_LONG | 名字过长(最多10字) | 前端限制 |
| 400 | 600002 | NAME_HAS_SPECIAL_CHARS | 名字包含特殊字符 | 提示只允许中文/英文 |
| 429 | 600003 | NAMING_QUERY_LIMIT | 免费用户每日取名次数上限 | 提示升级会员 |
| **回忆录模块** |
| 400 | 700001 | PHOTOS_TOO_FEW | 至少需要3张照片 | 前端提示 |
| 400 | 700002 | PHOTOS_TOO_MANY | 最多选择20张照片 | 前端限制 |
| 400 | 700003 | MEMOIR_IN_PROGRESS | 已有生成中的回忆录 | 提示等待完成 |
| 400 | 700004 | MEMOIR_NOT_FOUND | 回忆录记录不存在 | 返回列表 |
| 402 | 700005 | MEMOIR_PAYMENT_REQUIRED | 需要付费才能生成 | 弹窗付费 |
| 500 | 700006 | VIDEO_GENERATION_FAILED | 视频生成失败 | 显示重试按钮 |
| **会员模块** |
| 402 | 800001 | QUOTA_EXCEEDED | 免费配额已用完 | 弹窗付费升级 |
| 400 | 800002 | SUBSCRIPTION_ACTIVE | 已有有效订阅 | 提示续费逻辑 |
| 400 | 800003 | INVALID_PLAN | 无效的会员方案 | 刷新方案列表 |
| 400 | 800004 | PAYMENT_FAILED | 支付失败 | 提示重新支付 |
| **同步模块** |
| 409 | 900001 | SYNC_CONFLICT | 数据同步冲突 | 字段级合并(LWW) |
| 400 | 900002 | SYNC_DATA_TOO_LARGE | 同步数据过大 | 分批同步 |
| 500 | 900003 | SYNC_FAILED | 同步失败 | 自动重试 |

### 17.3 前端错误处理映射

```typescript
// 统一错误处理
const ERROR_ACTIONS: Record<number, ErrorAction> = {
  // 静默处理
  100006: { type: 'toast', message: '操作太快，请稍后再试', duration: 2000 },
  200001: { type: 'silent_relogin' },  // 静默重新登录
  900001: { type: 'silent_resolve' },  // 自动解决冲突

  // 提示用户
  400004: { type: 'toast', message: '今日已打卡', icon: 'success' },
  800001: { type: 'modal', title: '配额已用完', message: '升级会员解锁更多功能', action: 'navigate_member' },

  // 跳转页面
  100003: { type: 'navigate', page: '/pages/login/index' },
  300003: { type: 'navigate_back' },
  500002: { type: 'navigate', page: '/pages/index/index' },

  // 显示重试
  700006: { type: 'retry', message: '视频生成失败，点击重试' },

  // 默认
  default: { type: 'toast', message: '系统繁忙，请稍后再试' },
}
```

### 17.4 错误码使用规范

1. 后端返回格式：`{ code: 400001, message: "今日已打卡", data: null }`
2. 前端拦截器统一处理，业务代码无需手动处理每个错误
3. 前端错误提示统一使用 i18n 文本，错误码不对外暴露

### 17.5 错误码注册流程（新增）

> 错误码是全局共享资源，必须统一管理避免冲突。

**注册流程**：

```
1. 开发者确定需要新增错误码
   ↓
2. 查询 src/constants/errorCodes.ts，确认错误码未被占用
   ↓
3. 在 errorCodes.ts 中新增错误码定义（含中文描述、HTTP状态码、默认处理动作）
   ↓
4. 在对应的 i18n 语言包中新增错误提示文案（zh-CN 和 en-US）
   ↓
5. 在 TECH_DESIGN.md 17.2 错误码总表 中登记
   ↓
6. Code Review 时审查者确认错误码合理性和格式正确性
```

**错误码定义文件**：

```typescript
// src/constants/errorCodes.ts
export const ERROR_CODES = {
  // ===== 通用/系统模块 (1xxxxx) =====
  100001: { http: 400, message: '参数校验失败', action: 'toast' },
  100002: { http: 401, message: '未登录', action: 'redirect_login' },
  100003: { http: 429, message: '请求过于频繁', action: 'toast_retry' },

  // ===== 认证模块 (2xxxxx) =====
  200001: { http: 401, message: '微信登录失败', action: 'retry_login' },

  // ===== 宠物模块 (3xxxxx) =====
  300001: { http: 404, message: '宠物不存在', action: 'redirect_list' },
  // ... 新增错误码在此追加
} as const satisfies Record<number, ErrorCodeDef>;

// 类型自动推导
export type ErrorCode = keyof typeof ERROR_CODES;
```

**冲突预防**：
- 每个模块有固定的前缀范围（1=通用, 2=认证, 3=宠物...）
- 同一模块内按顺序递增，禁止跳号
- PR审查时必须检查 errorCodes.ts 的变更
- CI脚本自动校验错误码格式和重复

---

## 十八、监控与日志方案

### 18.1 监控层级

| 层级 | 监控内容 | 工具 | 告警阈值 |
|------|---------|------|---------|
| L1: 客户端 | 页面性能、JS错误、用户行为 | 微信小程序监控 + 自研上报 | pageLoadTime > 3s, JS Error > 0.1% |
| L2: 服务端 | API响应时间、错误率、QPS | Express中间件日志 + Prometheus | P95 > 1s, 错误率 > 1% |
| L3: 业务 | 核心功能使用率、转化率、留存 | 自定义事件 | 日活下降 > 20% |
| L4: 基础设施 | 云服务可用性、存储空间 | 云平台监控 | 可用性 < 99.9% |

### 18.2 客户端监控

#### 18.2.1 性能指标采集

```typescript
// 微信小程序性能指标（替代Web标准的LCP/FCP/TTI/TBT）
// 小程序环境无法直接获取Web性能指标，使用wx.getPerformance()和自定义采集
interface MiniProgramPerformanceMetrics {
  // 加载性能（小程序特有）
  appLaunchTime: number       // 小程序冷启动耗时（ms）—— 替代FCP
  pageLoadTime: number        // 页面首次渲染完成耗时（ms）—— 替代LCP
  firstRenderTime: number     // 首次渲染耗时（ms）—— 从navigateTo到首次setData完成
  routeSwitchTime: number     // 页面切换耗时（ms）

  // 运行时性能
  setDataTime: number         // setData耗时（ms）—— 小程序核心性能指标
  setDataSize: number         // setData数据量（KB）—— 防止大数据量阻塞
  renderTime: number          // 渲染层耗时（ms）
  memoryWarning: boolean      // 内存告警（小程序内存不足时触发）

  // 网络性能
  networkTime: number         // API请求平均耗时（ms）
  networkFailRate: number     // 网络请求失败率（%）

  // 用户感知（自定义采集）
  pageInteractiveTime: number // 页面可交互时间（ms）—— 首次setData完成到按钮可点击
  whiteScreenTime: number     // 白屏时间（ms）—— 从navigateTo到首个元素渲染
  tapResponseTime: number     // 点击响应时间（ms）—— 替代INP
}

// 采集实现（基于wx.getPerformance API）
function collectPerformanceMetrics(): MiniProgramPerformanceMetrics {
  const performance = wx.getPerformance()
  const entries = performance.getEntries()

  // 提取关键指标
  const launchEntry = entries.find(e => e.entryType === 'appLaunch')
  const routeEntry = entries.find(e => e.entryType === 'route')

  return {
    appLaunchTime: launchEntry?.duration ?? 0,
    pageLoadTime: routeEntry?.duration ?? 0,
    firstRenderTime: measureFirstRender(),
    // ...其他指标
  }
}
```

> **指标映射说明**：Web标准的LCP/FCP/TTI/TBT在小程序中不可直接获取，上表为小程序环境专用指标。
> - `pageLoadTime` ≈ LCP（页面首次渲染完成）
> - `appLaunchTime` ≈ FCP（冷启动到首次内容）
> - `pageInteractiveTime` ≈ TTI（页面可交互时间）
> - `tapResponseTime` ≈ INP（交互响应时间）

```typescript
// 采集策略
const METRICS_COLLECTION = {
  // 采样率：按用户量动态调整
  sampleRate: 0.1,            // 10%用户采样
  // 上报时机
  reportOn: {
    pageLoad: true,           // 每次页面加载
    appLaunch: true,          // 每次启动
    error: true,              // 每次错误
    custom: 'batch',          // 自定义事件批量上报
  },
  // 批量上报
  batchInterval: 60000,       // 60秒合并上报
  batchSize: 20,              // 每次最多20条
}

// 上报接口
const PERFORMANCE_API = {
  method: 'POST',
  path: '/api/monitor/performance',
  // 数据格式
  body: {
    metrics: PerformanceMetrics[]
    device: { brand, model, system, version }
    network: { type, speed }
    user: { id, isMember }
    timestamp: number
  }
}
```

#### 18.2.2 错误监控

| 错误类型 | 采集内容 | 是否上报 | 处理方式 |
|---------|---------|---------|---------|
| JS运行时错误 | 错误堆栈、行号、列号 | 是 | 立即上报 |
| API请求失败 | 接口路径、状态码、参数 | 是 | 批量上报 |
| 资源加载失败 | 资源URL、类型 | 是 | 立即上报 |
| Promise未捕获 | 错误信息、堆栈 | 是 | 立即上报 |
| 自定义异常 | 业务错误码、上下文 | 是 | 批量上报 |
| console.error | 错误信息 | 开发环境 | 不上报 |

```typescript
// 错误上报格式
interface ErrorReport {
  type: 'js_error' | 'api_error' | 'resource_error' | 'promise_error' | 'business_error'
  message: string
  stack?: string
  timestamp: number
  page: string
  user_id?: string
  metadata?: {
    api_path?: string
    error_code?: number
    http_status?: number
    device_info?: string
    network_type?: string
  }
}
```

#### 18.2.3 用户行为分析

| 事件类型 | 采集事件 | 用途 |
|---------|---------|------|
| 页面浏览 | 每次页面进入/离开 | 页面热度、用户路径分析 |
| 功能使用 | 打卡、症状初筛、食物查询、取名、回忆录等 | 功能使用率、转化漏斗 |
| 点击事件 | 按钮点击、卡片点击 | 交互热点分析 |
| 付费事件 | 进入会员页、点击订阅、支付成功/失败 | 付费转化漏斗 |
| 分享事件 | 分享到微信/朋友圈 | 社交传播分析 |
| AI对话 | 发送消息、意图识别结果 | AI功能使用分析 |

```typescript
// 用户行为事件上报
interface BehaviorEvent {
  event: string               // 事件名，如 'checkin_submit'
  page: string                // 当前页面
  timestamp: number
  duration?: number           // 停留时长
  properties?: Record<string, any>  // 自定义属性
  // 示例：
  // { event: 'memoir_generate', properties: { type: 'daily', photo_count: 5, cost: 2 } }
}

// 重要事件定义
const KEY_EVENTS = {
  // 激活事件
  app_launch:        { importance: 'critical' },
  first_checkin:     { importance: 'critical' },
  first_memoir:      { importance: 'critical' },

  // 转化事件
  view_member_page:  { importance: 'high' },
  subscribe_success: { importance: 'critical' },
  payment_failed:    { importance: 'high' },

  // 留存事件
  day7_retention:    { importance: 'critical' },
  day30_retention:   { importance: 'critical' },
  weekly_report_view:{ importance: 'high' },
}
```

### 18.3 服务端监控

#### 18.3.1 API监控

```typescript
interface APIMetrics {
  path: string
  method: string
  status_code: number
  duration_ms: number
  error_code?: number
  user_id?: string
  timestamp: number
}

// 监控指标
const API_MONITORING = {
  // 慢查询阈值
  slowQuery: {
    warn: 500,      // >500ms 警告
    critical: 2000,  // >2s 严重
  },
  // 错误率告警
  errorRate: {
    warn: 0.05,     // >5% 警告
    critical: 0.1,  // >10% 严重
  },
  // 重点监控接口
  criticalEndpoints: [
    'POST /api/ai/chat',
    'POST /api/pets/:id/memoir',
    'POST /api/auth/wx-login',
    'POST /api/membership/subscribe',
  ],
}
```

#### 18.3.2 日志规范

```typescript
// 日志级别
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

// 日志格式
interface LogEntry {
  level: LogLevel
  module: string          // 模块名，如 'auth', 'pet', 'health'
  action: string          // 操作，如 'login', 'checkin'
  message: string
  timestamp: string
  user_id?: string
  request_id?: string
  duration?: number
  metadata?: Record<string, any>
  error?: {
    message: string
    stack?: string
    code?: number
  }
}

// 日志脱敏规则
const LOG_SANITIZE = {
  // 敏感字段掩码
  masks: {
    phone:     (v: string) => v.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
    openid:    (v: string) => v.substring(0, 8) + '****',
    token:     () => '***',
    password:  () => '***',
    unionid:   (v: string) => v.substring(0, 8) + '****',
  },
  // 禁止记录字段
  blockFields: ['password', 'secret', 'key', 'token'],
  // 日志存储
  retention: {
    debug: '7天',
    info: '30天',
    warn: '90天',
    error: '180天',
    fatal: '365天',
  },
}
```

### 18.4 监控看板与告警

| 指标 | 告警阈值 | 通知方式 | 责任人 |
|------|---------|---------|-------|
| 首页加载时间 | > 3秒持续5分钟 | 企业微信 | 前端 |
| API错误率 | > 5%持续5分钟 | 企业微信 | 后端 |
| 视频生成失败率 | > 10% | 企业微信+短信 | 后端 |
| 日活下降 | > 20%同比 | 企业微信 | 产品 |
| 支付失败率 | > 3% | 企业微信+短信 | 后端 |
| 存储空间 | > 80% | 企业微信 | 运维 |
| 云服务可用性 | < 99.9% | 企业微信+电话 | 运维 |

### 18.5 监控数据使用规范

1. 性能数据仅用于优化，不得用于用户画像
2. 用户行为数据脱敏后使用，不关联具体用户身份
3. 错误日志中的用户信息必须脱敏
4. 监控数据保留期限按18.3.2执行，到期自动清理
5. 监控数据不得对外泄露

---

## 十九、工程化补充（架构审查修复）

### 19.1 API 文档生成方案

> 60+ 路由的手动维护 TypeScript 类型定义在迭代中容易与实现不一致，引入自动化方案。

**方案：tsoa + Swagger**

使用 `tsoa` 从 TypeScript Controller 类和接口自动生成 OpenAPI 3.0 规范文档：

```typescript
// controllers/PetController.ts
import { Controller, Get, Post, Route, Body, Path } from 'tsoa';
import { PetService } from '../services/PetService';
import { CreatePetRequest, PetResponse } from '../types';

@Route('pets')
export class PetController extends Controller {
  @Post('/')
  public async createPet(@Body() body: CreatePetRequest): Promise<PetResponse> {
    return PetService.create(body);
  }

  @Get('{petId}')
  public async getPet(@Path() petId: string): Promise<PetResponse> {
    return PetService.findById(petId);
  }
}
```

**生成流程**：
1. 开发时编写 Controller 类（带 TypeScript 类型注解和 JSDoc）
2. `npm run docs:gen` → tsoa 扫描 Controller，生成 OpenAPI 3.0 JSON
3. `npm run docs:serve` → swagger-ui-express 挂载到 `/api/docs` 路径
4. 前端可从 OpenAPI JSON 自动生成 API 请求代码（使用 openapi-typescript-codegen）

**与现有代码的关系**：
- 后端 Express 路由仍手写，tsoa 仅负责生成文档
- 文档与代码的同步通过 CI 校验：`tsoa` 生成后与 `docs/openapi.json` diff，不一致则报错

### 19.2 功能开关（Feature Flag）方案

> Phase 1.5 新功能通过功能开关控制灰度上线，稳定后移除开关。

**方案：集中式配置 + 数据库存储**

```typescript
// src/config/featureFlags.ts
interface FeatureFlag {
  key: string;
  enabled: boolean;           // 全局开关
  rolloutPercentage: number;  // 灰度百分比 (0-100)
  whitelistUserIds?: string[]; // 白名单用户
  expiresAt: Date;            // 过期时间，稳定后自动移除
}

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    key: 'family_module',
    enabled: true,
    rolloutPercentage: 100,
    expiresAt: new Date('2026-10-01'),
  },
  {
    key: 'memoir_module',
    enabled: true,
    rolloutPercentage: 50,  // 50%灰度
    expiresAt: new Date('2026-11-01'),
  },
  {
    key: 'naming_engine',
    enabled: true,
    rolloutPercentage: 100,
    expiresAt: new Date('2026-09-01'),
  },
];

// 使用
function isFeatureEnabled(flagKey: string, userId?: string): boolean {
  const flag = DEFAULT_FLAGS.find(f => f.key === flagKey);
  if (!flag || !flag.enabled) return false;
  if (flag.expiresAt < new Date()) {
    console.warn(`功能开关 ${flagKey} 已过期，请移除`);
    return true; // 过期后默认开启
  }
  if (userId && flag.whitelistUserIds?.includes(userId)) return true;
  // 灰度百分比：基于 userId hash
  if (userId) {
    const hash = simpleHash(userId);
    return (hash % 100) < flag.rolloutPercentage;
  }
  return flag.rolloutPercentage === 100;
}
```

**管理规则**：
1. 新功能上线时，初始 `rolloutPercentage: 0`，仅白名单可用
2. 逐步提升百分比（10% → 30% → 50% → 100%）
3. 100% 稳定运行 2 周后，移除开关代码（设为默认 true 并删除 flag 定义）
4. 功能开关配置存储在数据库 `feature_flags` 表，支持运行时动态修改
5. 前端通过 `/api/config/feature-flags` 接口获取开关状态

### 19.3 校验层级说明（避免过度防御）

> 根据架构审查，以下校验属于"框架已覆盖"层级，后端 Service 层无需重复校验。

| 校验项 | 已覆盖层 | Service层是否需要 | 说明 |
|-------|---------|------------------|------|
| 便便等级 1-5 | 数据库 CHECK 约束 + 前端 UI | 否 | `CHECK (poop_level BETWEEN 1 AND 5)` 已保障 |
| 食欲等级 1-5 | 数据库 CHECK 约束 + 前端 UI | 否 | 同上 |
| 精神等级 1-5 | 数据库 CHECK 约束 + 前端 UI | 否 | 同上 |
| JSON 字段格式 | PostgreSQL JSONB 类型 | 否 | 非法 JSON 写入时数据库直接报错 |
| UUID 格式 | PostgreSQL UUID 类型 | 否 | 非法 UUID 写入时数据库直接报错 |
| 字段非空 | 数据库 NOT NULL 约束 | 否 | 前端做提示，后端依赖数据库兜底 |

**需要 Service 层保留的校验**：
- 越权检查（用户A不能访问用户B的数据）— 数据库无法覆盖
- 订单状态机校验（如回忆录 pending→processing→completed）— 业务逻辑层职责
- 金额/库存上下限（如照片数量 8-15 张）— 业务规则
- 数据归属校验（宠物是否属于当前用户）— 权限相关
- 文件类型/大小校验（上传安全）— 安全相关
