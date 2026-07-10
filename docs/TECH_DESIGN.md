# 星寰海 — 技术设计文档

> 版本：v1.0  
> 更新日期：2026-06-26  
> 状态：已确认

---

## 一、技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite |
| 状态管理 | Zustand |
| 样式方案 | Tailwind CSS |
| 后端 | Express.js |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | JWT + Supabase Auth |
| 实时通信 | WebSocket |
| 桌面端 | Electron |
| 移动端 | Capacitor (Android) |
| 测试 | Vitest |
| 代码规范 | ESLint + Prettier |
| CI/CD | GitHub Actions |

---

## 二、数据库设计

### 用户与账户

```sql
-- 用户表
users (
  id            UUID PRIMARY KEY
  email         TEXT UNIQUE NOT NULL
  password_hash TEXT NOT NULL
  created_at    TIMESTAMP DEFAULT NOW()
)

-- 用户档案
profiles (
  id          UUID PRIMARY KEY REFERENCES users(id)
  nickname    TEXT
  avatar_url  TEXT
  bio         TEXT
  updated_at  TIMESTAMP
)

-- 会员信息
memberships (
  id         UUID PRIMARY KEY
  user_id    UUID REFERENCES users(id)
  tier       TEXT  -- 'free' | 'premium'
  expires_at TIMESTAMP
  created_at TIMESTAMP
)
```

### AI 伙伴

```sql
-- AI 人格配置
ai_personas (
  id          UUID PRIMARY KEY
  user_id     UUID REFERENCES users(id)
  name        TEXT NOT NULL        -- AI 名字
  gender      TEXT                 -- 'male' | 'female' | 'neutral'
  personality TEXT                 -- 性格描述
  created_at  TIMESTAMP
)

-- AI 记忆
ai_memories (
  id          UUID PRIMARY KEY
  user_id     UUID REFERENCES users(id)
  content     TEXT NOT NULL        -- 记忆内容
  category    TEXT                 -- 分类
  importance  INTEGER DEFAULT 0    -- 重要性
  decay_rate  FLOAT DEFAULT 0.01   -- 衰减率
  created_at  TIMESTAMP
  updated_at  TIMESTAMP
)

-- 对话记录
ai_conversations (
  id         UUID PRIMARY KEY
  user_id    UUID REFERENCES users(id)
  role       TEXT NOT NULL         -- 'user' | 'ai'
  content    TEXT NOT NULL
  emotion    TEXT                  -- AI 情绪
  created_at TIMESTAMP
)
```

### 个人成长

```sql
-- 专注记录
focus_sessions (
  id            UUID PRIMARY KEY
  user_id       UUID REFERENCES users(id)
  duration      INTEGER NOT NULL   -- 专注时长（秒）
  task_name     TEXT
  completed     BOOLEAN DEFAULT TRUE
  created_at    TIMESTAMP
)

-- 习惯
habits (
  id          UUID PRIMARY KEY
  user_id     UUID REFERENCES users(id)
  name        TEXT NOT NULL
  icon        TEXT
  color       TEXT
  frequency   TEXT                 -- 'daily' | 'weekly'
  created_at  TIMESTAMP
)

-- 习惯打卡
habit_logs (
  id         UUID PRIMARY KEY
  habit_id   UUID REFERENCES habits(id)
  date       DATE NOT NULL
  completed  BOOLEAN DEFAULT TRUE
)

-- 情绪记录
mood_entries (
  id          UUID PRIMARY KEY
  user_id     UUID REFERENCES users(id)
  score       INTEGER NOT NULL     -- 1-10
  tags        TEXT[]               -- 情绪标签
  note        TEXT
  created_at  TIMESTAMP
)

-- 日记
journal_entries (
  id          UUID PRIMARY KEY
  user_id     UUID REFERENCES users(id)
  title       TEXT
  content     TEXT NOT NULL
  tags        TEXT[]
  created_at  TIMESTAMP
)

-- 目标
goals (
  id          UUID PRIMARY KEY
  user_id     UUID REFERENCES users(id)
  title       TEXT NOT NULL
  description TEXT
  deadline    TIMESTAMP
  status      TEXT DEFAULT 'active' -- 'active' | 'completed' | 'abandoned'
  progress    FLOAT DEFAULT 0
  created_at  TIMESTAMP
)
```

### 双人空间

```sql
-- 关系
relationships (
  id          UUID PRIMARY KEY
  type        TEXT NOT NULL        -- 'couple' | 'friend'
  user_a      UUID REFERENCES users(id)
  user_b      UUID REFERENCES users(id)
  status      TEXT DEFAULT 'active'
  created_at  TIMESTAMP
)

-- 共享目标
shared_goals (
  id              UUID PRIMARY KEY
  relationship_id UUID REFERENCES relationships(id)
  title           TEXT NOT NULL
  description     TEXT
  deadline        TIMESTAMP
  status          TEXT DEFAULT 'active'
  created_at      TIMESTAMP
)

-- 悄悄话
private_messages (
  id              UUID PRIMARY KEY
  relationship_id UUID REFERENCES relationships(id)
  sender_id       UUID REFERENCES users(id)
  content         TEXT NOT NULL
  is_encrypted    BOOLEAN DEFAULT TRUE
  created_at      TIMESTAMP
)

-- 共享日记
shared_journals (
  id              UUID PRIMARY KEY
  relationship_id UUID REFERENCES relationships(id)
  author_id       UUID REFERENCES users(id)
  content         TEXT NOT NULL
  created_at      TIMESTAMP
)

-- 共享相册
shared_albums (
  id              UUID PRIMARY KEY
  relationship_id UUID REFERENCES relationships(id)
  image_url       TEXT NOT NULL
  caption         TEXT
  uploaded_by     UUID REFERENCES users(id)
  created_at      TIMESTAMP
)

-- 纪念日
anniversaries (
  id              UUID PRIMARY KEY
  relationship_id UUID REFERENCES relationships(id)
  title           TEXT NOT NULL
  date            DATE NOT NULL
  type            TEXT              -- 'first_meet' | 'together' | 'custom'
  created_at      TIMESTAMP
)
```

### 基础设施

```sql
-- 同步队列
sync_queue (
  id          UUID PRIMARY KEY
  user_id     UUID REFERENCES users(id)
  table_name  TEXT NOT NULL
  record_id   UUID NOT NULL
  action      TEXT NOT NULL         -- 'create' | 'update' | 'delete'
  data        JSONB
  synced      BOOLEAN DEFAULT FALSE
  created_at  TIMESTAMP
)

-- 支付记录
payments (
  id          UUID PRIMARY KEY
  user_id     UUID REFERENCES users(id)
  amount      DECIMAL NOT NULL
  currency    TEXT DEFAULT 'CNY'
  status      TEXT                  -- 'pending' | 'completed' | 'failed'
  order_id    TEXT UNIQUE
  created_at  TIMESTAMP
)
```

---

## 三、接口设计

### Auth（4 个）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/refresh` | 刷新 Token |
| POST | `/api/auth/logout` | 登出 |

### AI 伙伴（4 个）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/chat` | 发送消息 |
| GET | `/api/ai/conversations` | 对话历史 |
| GET | `/api/ai/personas` | AI 人格列表 |
| PUT | `/api/ai/personas/:id` | 更新人格配置 |

### 个人成长（8 个）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/focus/sessions` | 记录专注 |
| GET | `/api/focus/stats` | 专注统计 |
| POST | `/api/habits` | 创建习惯 |
| PUT | `/api/habits/:id/check` | 打卡 |
| POST | `/api/moods` | 记录情绪 |
| GET | `/api/moods/trends` | 情绪趋势 |
| POST | `/api/journals` | 写日记 |
| GET | `/api/journals` | 日记列表 |

### 双人空间（6 个）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/relationships` | 创建关系 |
| POST | `/api/relationships/:id/goals` | 共享目标 |
| POST | `/api/relationships/:id/messages` | 悄悄话 |
| POST | `/api/relationships/:id/journals` | 共享日记 |
| POST | `/api/relationships/:id/albums` | 共享相册 |
| GET | `/api/relationships/:id/anniversaries` | 纪念日 |

### 支付（3 个）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/payment/create` | 创建支付 |
| POST | `/api/payment/callback` | 支付回调 |
| GET | `/api/payment/status` | 支付状态 |

### 同步（2 个）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/sync/push` | 推送数据 |
| GET | `/api/sync/pull` | 拉取数据 |

---

## 四、前端架构

### 目录结构（精简后）

```
src/
├── App.tsx                    主入口
├── main.tsx
│
├── ai-partner/                AI 伙伴（核心板块）
│   ├── AIChat.tsx             AI 对话主界面
│   ├── AIPersona.tsx          AI 人格选择/定制
│   ├── AIMemory.tsx           AI 记忆查看
│   └── AIChatInput.tsx        聊天输入
│
├── growth/                    个人成长
│   ├── FocusMode.tsx          专注模式
│   ├── HabitTracker.tsx       习惯追踪
│   ├── MoodJournal.tsx        情绪记录
│   └── Journal.tsx            日记
│
├── duo/                       双人空间
│   ├── DuoSpace.tsx           双人空间主页
│   ├── SharedGoals.tsx        共享目标
│   ├── Whisper.tsx            悄悄话
│   ├── SharedJournal.tsx      共享日记
│   └── SharedAlbum.tsx        共享相册
│
├── shared/                    共享组件
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   └── Modal.tsx
│
├── hooks/                     Hooks
│   ├── useAuth.ts
│   ├── useAIChat.ts
│   └── useFocus.ts
│
├── stores/                    状态管理
│   ├── authStore.ts
│   └── aiStore.ts
│
├── services/                  API 调用
│   ├── api.ts
│   └── aiService.ts
│
├── memory-body/               记忆引擎（精简到 18 个）
│   ├── types/                 类型定义
│   ├── store/                 存储实现
│   ├── lifecycle/             记忆生命周期
│   ├── security/              安全与隐私
│   ├── chat/                  对话集成
│   └── sync/                  同步
│
└── server/                    后端
    ├── index.ts
    ├── routes/
    └── middleware/
```

---

## 五、差异分析

### 需要保留和增强的功能

| 功能 | 现有代码 | 需要做什么 |
|------|---------|-----------|
| AI 对话 | `AgentChatUI.tsx` | 增强：多面人格自动切换、性别/名字自定义 |
| AI 记忆 | `memory-body/` | 精简：57 → 18 个模块 |
| AI 人格 | `PersonaSelector` | 增强：性别选择、名字自定义 |
| 专注陪伴 | `FocusModeUI.tsx` | 精简：去掉过于复杂的主题系统 |
| 习惯养成 | `HabitTrackerUI.tsx` | 基本可用 |
| 情绪记录 | `MoodJournalUI.tsx` | 基本可用 |
| 成长日记 | `JournalUI.tsx` | 基本可用 |
| 共享目标 | `relationship/` | 改造：单人可用，邀请升级 |
| 悄悄话 | `relationship/` | 改造：单人可用，邀请升级 |
| 账户系统 | `auth/` + `server/` | 基本可用 |

### 需要删除的功能

| 功能 | 文件 | 理由 |
|------|------|------|
| 学习计划 | `study-planner/` | 合并到目标追踪 |
| 考试追踪 | `exam-tracker/` | 合并到目标追踪 |
| 错题本 | `error-book/` | 合并到目标追踪 |
| 学习陪伴 | `study-companion/` | AI 对话已覆盖 |
| 阅读管理 | `reading/` | 合并到习惯养成 |
| 复习调度 | `review/` | 合并到目标追踪 |
| 快捷笔记 | `quicknotes/` | 合并到日记 |
| 时间块 | `timeblock/` | 砍掉 |
| 日程安排 | `schedule/` | 砍掉 |
| 模板 | `templates/` | 砍掉 |
| 布局分享 | `LayoutShareUI.tsx` | 砍掉 |
| 模块商店 | `ModuleStoreUI.tsx` | 砍掉 |
| AI 推荐 | `AIRecommendationUI.tsx` | 砍掉 |
| 生理周期 | `cycle/` | 砍掉 |
| 知识图谱 | `knowledge-graph/` | 和记忆星图重叠 |
| 角色商店 | `CameoStorefrontUI.tsx` | 远期功能 |
| 社区人格 | `CommunityPersonaUI.tsx` | 远期功能 |
| 进化仪式 | `EvolutionRitualUI.tsx` | 砍掉 |
| 全局搜索 | `globalsearch/` | 远期功能 |
| 管理后台 | Admin Console | 砍掉 |

### 需要精简的模块

| 模块 | 当前 | 精简后 |
|------|------|--------|
| memory-body 子模块 | 57 个 | 18 个核心 |
| usePanelState | 42 个 useState | 合并为 activeModal |

---

## 六、memory-body 精简方案

### 保留（18 个）

```
核心类型与配置
├── memoryBodyTypes         类型定义
├── memoryBodyConfig        配置
└── memoryBodyGuards        校验

存储
├── memoryBodyStore         存储接口
├── inMemoryMemoryBodyStore 内存实现
└── browserMemoryBodyStore  浏览器实现

记忆生命周期
├── memoryIngestor          记忆摄入
├── memoryGraph             记忆图谱
├── memoryRetrieval         记忆检索
├── memoryEvolution         记忆演化
├── memoryDecay             记忆衰减
└── contradictionDetector   矛盾检测

安全与隐私
├── memoryPrivacyGuard      隐私保护
├── sensitiveMemoryClassifier 敏感信息分类
└── forbiddenMemoryFilter   禁止记忆过滤

对话集成
├── agentChatMemoryAdapter  对话适配器
├── promptContextComposer   提示词组合
└── memoryFeedback          用户反馈

同步
└── localFirstCloudOptional 本地优先同步
```

### 砍掉（39 个）

```
memoryConstitution, cognitiveTimeMachine, memoryNegotiation,
trustRepairProtocol, cognitiveThreatModel, antiOverfittingPolicy,
overrideHierarchy, cognitiveBudget, memoryEconomy,
cognitivePermission, cognitiveBoundary, explainabilityEngine,
reflectionEngine, cognitiveRegressionTest, multiAgentContinuity,
contextualIdentity, memoryContract, cognitiveEvaluation,
memorySandbox, cognitiveDiff, memoryReviewQueue, cognitivePolicy,
legacyMemoryMigrationAdapter, memoryDecayCycle, memoryAuditLog,
memoryProvenance, requirementGravity, memoryQuality,
syncMigrationVersioning, memoryProfile, memoryStarMap,
knowledgeGraphAdapter, cloudSyncAdapter, metricsDashboard,
memoryProductMetrics, ruleBasedMemoryExtractor,
memoryBodyContextBuilder, memoryFeedbackCommandParser
```

---

## 七、非功能需求

- 支持 Web / Electron / Android
- 本地优先，云端可选同步
- 端到端加密（悄悄话）
- 离线可用（核心功能）
- 响应式设计
- 测试覆盖率 > 80%
