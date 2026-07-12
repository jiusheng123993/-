# 星寰海 — 技术设计文档

> 版本：v2.0  
> 更新日期：2026-07-12  
> 状态：草案  
> 变更说明：v1.0 → v2.0 适配小程序优先策略，重构数据模型，新增情绪急救引擎、AI主动引擎、事前干预引擎

---

## 一、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 小程序框架 | Taro 3 + React 19 + TypeScript | 一套代码跑小程序+H5 |
| 构建工具 | Vite | 开发体验好 |
| 状态管理 | Zustand | 轻量 |
| 样式方案 | Tailwind CSS + CSS Modules | 小程序兼容 |
| 后端 | Supabase (PostgreSQL + Auth + Realtime) | BaaS，省后端开发 |
| 云函数 | 微信云开发 / Supabase Edge Functions | 轻量AI逻辑 |
| 记忆引擎 | memory-body（自研，18模块） | 核心壁垒 |
| AI服务 | 规则引擎 → 小模型 → 大模型（分阶段） | 成本可控 |
| 推送 | 微信订阅消息 | 主动触达 |
| 后期App | Capacitor | Web版打包成App |
| 测试 | Vitest | 已有 |
| 代码规范 | ESLint + Prettier | 已有 |

---

## 二、系统架构

```
┌──────────────────────────────────────────────┐
│                  用户端                       │
│  ┌────────────────────────────────────────┐  │
│  │     微信小程序（Taro 3 + React）       │  │
│  │  ┌──────┬──────┬──────┬──────┬──────┐ │  │
│  │  │急救箱│ 树洞  │日历  │记录  │测试  │ │  │
│  │  └──────┴──────┴──────┴──────┴──────┘ │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │     memory-body 引擎（本地优先）        │  │
│  │  ┌──────┬──────┬──────┬──────┬──────┐ │  │
│  │  │存储层│生命周期│安全层│对话层│同步层│ │  │
│  │  └──────┴──────┴──────┴──────┴──────┘ │  │
│  └────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────┘
                   │ HTTPS / WebSocket
┌──────────────────┴───────────────────────────┐
│                  云端                         │
│  ┌────────────────────────────────────────┐  │
│  │           Supabase (PostgreSQL)        │  │
│  │  ┌──────┬──────┬──────┬──────┐         │  │
│  │  │用户表│情绪表│树洞表│日程表│ ...     │  │
│  │  └──────┴──────┴──────┴──────┘         │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │           云函数层                      │  │
│  │  ┌──────┬──────┬──────┬──────┐         │  │
│  │  │AI引擎│推送  │分析  │导流  │         │  │
│  │  └──────┴──────┴──────┴──────┘         │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │           外部服务                      │  │
│  │  ┌──────┬──────┬──────┐                 │  │
│  │  │和风天气│咨询平台│微信API│             │  │
│  │  └──────┴──────┴──────┘                 │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## 三、数据库设计

### 3.1 用户与账户

```sql
-- 用户（微信登录）
users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  openid        TEXT UNIQUE NOT NULL        -- 微信openid
  unionid       TEXT                         -- 微信unionid（可选）
  nickname      TEXT
  avatar_url    TEXT
  created_at    TIMESTAMP DEFAULT NOW()
  last_active   TIMESTAMP DEFAULT NOW()
)

-- 用户档案
profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  display_name  TEXT
  bio           TEXT
  settings      JSONB DEFAULT '{}'::jsonb   -- 用户设置
  created_at    TIMESTAMP DEFAULT NOW()
  updated_at    TIMESTAMP DEFAULT NOW()
)

-- 会员信息
memberships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  tier          TEXT DEFAULT 'free'          -- 'free' | 'premium'
  expires_at    TIMESTAMP
  created_at    TIMESTAMP DEFAULT NOW()
)
```

### 3.2 情绪数据（核心）

```sql
-- 情绪记录
mood_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  mood          TEXT NOT NULL                -- 情绪标签（24个之一）
  intensity     INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 10)
  energy        INTEGER CHECK (energy BETWEEN 0 AND 100)
  context       TEXT                         -- 情境标签
  trigger       TEXT                         -- 具体触发因素
  note          TEXT                         -- 用户写的一句话
  source        TEXT DEFAULT 'manual'        -- 'manual' | 'treehole' | 'behavior' | 'ritual'
  
  -- 外部上下文
  weather       TEXT                         -- 天气
  day_of_week   INTEGER                      -- 星期几 0-6
  is_holiday    BOOLEAN DEFAULT FALSE
  
  -- 行为信号
  app_session   TEXT                         -- 使用时段
  treehole_count INTEGER DEFAULT 0           -- 当天树洞发帖数
  habit_streak   INTEGER DEFAULT 0           -- 习惯连续天数
  focus_minutes  INTEGER DEFAULT 0           -- 今日专注时长
  
  -- AI分析结果
  polarity      FLOAT                        -- 情绪极性 -1到1
  risk_level    TEXT DEFAULT 'low'           -- 'low' | 'medium' | 'high' | 'critical'
  pattern_match TEXT                         -- 匹配到的模式
  
  created_at    TIMESTAMP DEFAULT NOW()
)

-- 情绪索引（用于快速查询）
CREATE INDEX idx_mood_user_date ON mood_entries(user_id, created_at DESC);
CREATE INDEX idx_mood_risk ON mood_entries(risk_level) WHERE risk_level != 'low';
```

### 3.3 急救记录

```sql
-- 急救会话
emergency_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  trigger_type  TEXT NOT NULL                -- 'sad' | 'anxious' | 'tired' | 'lonely' | 'unclear'
  started_at    TIMESTAMP DEFAULT NOW()
  completed_at  TIMESTAMP
  
  -- 急救步骤记录
  step_naming   JSONB                        -- 命名步骤数据
  step_writing  JSONB                        -- 书写步骤数据（加密）
  step_action   JSONB                        -- 行动步骤数据
  step_connect  JSONB                        -- 连接步骤数据
  
  -- 结果
  mood_before   INTEGER                      -- 急救前情绪强度
  mood_after    INTEGER                      -- 急救后情绪强度
  effectiveness TEXT                         -- 'effective' | 'partial' | 'ineffective'
  
  -- 生成物
  rescue_letter TEXT                         -- 急救信内容
  
  -- 安全
  is_high_risk  BOOLEAN DEFAULT FALSE        -- 是否触发高危干预
  encrypted     BOOLEAN DEFAULT FALSE        -- 内容是否加密
)

-- 急救跟进记录
emergency_followups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  session_id    UUID REFERENCES emergency_sessions(id) ON DELETE CASCADE
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  followup_date DATE NOT NULL
  mood_response TEXT                         -- 'better' | 'okay' | 'worse'
  note          TEXT
  created_at    TIMESTAMP DEFAULT NOW()
)
```

### 3.4 日程与干预

```sql
-- 情绪风险日历事件
schedule_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  title         TEXT NOT NULL                -- 事件名称
  event_date    TIMESTAMP NOT NULL           -- 事件时间
  emotion_tag   TEXT                         -- 用户标记的情绪
  intensity     INTEGER CHECK (intensity BETWEEN 1 AND 10)
  
  -- AI分析
  risk_level    TEXT DEFAULT 'unknown'       -- 'low' | 'medium' | 'high'
  predicted_anxiety INTEGER                  -- 预估焦虑强度
  
  -- 干预状态
  intervention_status TEXT DEFAULT 'pending' -- 'pending' | 'active' | 'completed' | 'failed'
  
  created_at    TIMESTAMP DEFAULT NOW()
)

-- 干预记录
intervention_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  event_id      UUID REFERENCES schedule_events(id) ON DELETE CASCADE
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  step_day      INTEGER NOT NULL             -- T-3, T-2, T-1, T, T+1
  step_type     TEXT NOT NULL                -- 'naming' | 'worst_case' | 'rehearsal' | 'empower' | 'tracking'
  step_data     JSONB                        -- 步骤数据
  anxiety_before INTEGER                     -- 干预前焦虑
  anxiety_after  INTEGER                     -- 干预后焦虑
  effectiveness  TEXT                        -- 'effective' | 'partial' | 'ineffective'
  created_at    TIMESTAMP DEFAULT NOW()
)
```

### 3.5 树洞与社区

```sql
-- 树洞帖子
treehole_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE  -- 关联用户但前端匿名
  content       TEXT NOT NULL                -- 帖子内容（1-500字）
  mood_tag      TEXT                         -- AI自动打的情绪标签
  intensity     INTEGER                      -- 情绪强度
  
  -- 互动
  empathy_count INTEGER DEFAULT 0            -- "懂你"数量
  reply_count   INTEGER DEFAULT 0
  
  -- 安全
  is_high_risk  BOOLEAN DEFAULT FALSE
  is_hidden     BOOLEAN DEFAULT FALSE        -- 被隐藏（违规或高危）
  
  -- 时间
  created_at    TIMESTAMP DEFAULT NOW()
  
  -- 索引
  -- 按时间倒序，过滤隐藏的
)

-- 树洞回复
treehole_replies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  post_id       UUID REFERENCES treehole_posts(id) ON DELETE CASCADE
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  content       TEXT NOT NULL                -- 回复内容
  is_ai         BOOLEAN DEFAULT FALSE        -- 是否AI回复
  created_at    TIMESTAMP DEFAULT NOW()
)

-- 晚安交换
goodnight_matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_a        UUID REFERENCES users(id)
  user_b        UUID REFERENCES users(id)
  message_a     TEXT                         -- A给B的晚安
  message_b     TEXT                         -- B给A的晚安
  matched_at    TIMESTAMP DEFAULT NOW()
  status        TEXT DEFAULT 'matched'       -- 'pending' | 'matched' | 'completed'
)

-- 情绪伙伴匹配
emotion_buddies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_a        UUID REFERENCES users(id)
  user_b        UUID REFERENCES users(id)
  status        TEXT DEFAULT 'active'        -- 'active' | 'ended'
  matched_at    TIMESTAMP DEFAULT NOW()
  last_letter_at TIMESTAMP
)
```

### 3.6 AI主动引擎

```sql
-- AI主动推送记录
ai_outreaches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  type          TEXT NOT NULL                -- 'prediction' | 'silence_warning' | 'pattern_discovery' | 'followup' | 'good_news' | 'high_risk'
  title         TEXT
  content       TEXT NOT NULL
  trigger_reason TEXT                        -- 触发原因
  sent_at       TIMESTAMP DEFAULT NOW()
  opened_at     TIMESTAMP
  user_response TEXT                         -- 'opened' | 'ignored' | 'replied'
  response_data JSONB                        -- 用户回复数据
  
  -- 效果追踪
  effectiveness TEXT                         -- 'effective' | 'neutral' | 'ineffective'
)

-- 情绪模式记录
emotion_patterns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  pattern_type  TEXT NOT NULL                -- 'weekly_cycle' | 'trigger_association' | 'behavior_correlation' | 'intervention_effect'
  pattern_data  JSONB NOT NULL               -- 模式数据
  confidence    FLOAT                        -- 置信度 0-1
  discovered_at TIMESTAMP DEFAULT NOW()
  is_active     BOOLEAN DEFAULT TRUE         -- 是否仍然有效
)

-- 推送频率控制
outreach_quota (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  date          DATE NOT NULL
  count         INTEGER DEFAULT 0
  last_push_at  TIMESTAMP
  UNIQUE(user_id, date)
)
```

### 3.7 情绪测试

```sql
-- 测试记录
test_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  test_type     TEXT NOT NULL                -- 'health_check' | 'loneliness' | 'social_energy' | 'burnout'
  answers       JSONB NOT NULL               -- 答题数据
  score         INTEGER NOT NULL
  result_text   TEXT NOT NULL                -- 结果文案
  result_emoji  TEXT                         -- 结果表情
  share_card_url TEXT                        -- 分享卡片URL
  created_at    TIMESTAMP DEFAULT NOW()
)
```

### 3.8 咨询导流

```sql
-- 咨询导流记录
referral_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  platform      TEXT NOT NULL                -- 'jiandan' | 'yixinli' | 'other'
  counselor_id  TEXT                         -- 咨询师ID
  counselor_name TEXT
  counselor_specialty TEXT                   -- 擅长领域
  referral_code TEXT                         -- 专属推广码
  trigger_reason TEXT                        -- 触发原因
  clicked_at    TIMESTAMP DEFAULT NOW()
  registered_at TIMESTAMP                    -- 用户注册时间
  consulted_at  TIMESTAMP                    -- 完成咨询时间
  commission    DECIMAL                      -- 分成金额
  status        TEXT DEFAULT 'clicked'       -- 'clicked' | 'registered' | 'consulted' | 'commissioned'
)
```

### 3.9 基础设施

```sql
-- 行为日志（被动采集）
behavior_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  action        TEXT NOT NULL                -- 'app_open' | 'page_view' | 'treehole_post' | 'habit_check' | 'focus_start'
  page          TEXT                         -- 当前页面
  timestamp     TIMESTAMP DEFAULT NOW()
  metadata      JSONB                        -- 附加数据
)

-- 同步队列
sync_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE
  table_name    TEXT NOT NULL
  record_id     UUID NOT NULL
  action        TEXT NOT NULL                -- 'create' | 'update' | 'delete'
  data          JSONB
  synced        BOOLEAN DEFAULT FALSE
  created_at    TIMESTAMP DEFAULT NOW()
)

-- 高危关键词库
crisis_keywords (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  keyword       TEXT NOT NULL
  level         TEXT NOT NULL                -- 'mild' | 'moderate' | 'severe'
  category      TEXT                         -- 分类
  is_active     BOOLEAN DEFAULT TRUE
)

-- 预设建议库
suggestion_library (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
  mood          TEXT NOT NULL                -- 对应的情绪标签
  context       TEXT                         -- 对应的情境
  suggestion    TEXT NOT NULL                -- 建议内容
  action_type   TEXT                         -- 'breathing' | 'writing' | 'physical' | 'social' | 'sensory'
  is_active     BOOLEAN DEFAULT TRUE
)
```

---

## 四、memory-body引擎改造方案

### 4.1 现有18模块映射

| 现有模块 | 新用途 | 改造说明 |
|---------|--------|---------|
| memoryBodyTypes | 扩展情绪相关类型 | 新增EmergencySession、InterventionRecord等类型 |
| memoryBodyConfig | 更新配置 | 新增情绪分析、推送频率等配置 |
| memoryBodyGuards | 更新校验 | 新增情绪数据校验 |
| memoryBodyStore | 不变 | 直接复用 |
| inMemoryMemoryBodyStore | 不变 | 直接复用 |
| browserMemoryBodyStore | 适配小程序存储 | 从localStorage改为Taro.setStorage |
| memoryIngestor | 扩展摄入源 | 新增情绪记录、急救记录、行为日志摄入 |
| memoryGraph | 扩展节点类型 | 新增情绪节点、事件节点、干预节点 |
| memoryRetrieval | 扩展查询 | 新增情绪模式查询、历史对比查询 |
| memoryEvolution | 扩展演化逻辑 | 新增情绪模式演化、干预效果演化 |
| memoryDecay | 不变 | 直接复用 |
| contradictionDetector | 扩展检测 | 新增情绪矛盾检测（说"好了"但行为信号显示低落） |
| memoryPrivacyGuard | 强化 | 新增高危内容加密 |
| sensitiveMemoryClassifier | 扩展分类 | 新增急救内容敏感分级 |
| forbiddenMemoryFilter | 不变 | 直接复用 |
| agentChatMemoryAdapter | 改造 | 从对话适配改为急救流程适配 |
| promptContextComposer | 改造 | 从提示词组合改为情绪分析上下文组合 |
| memoryFeedback | 扩展 | 新增干预效果反馈 |
| localFirstCloudOptional | 适配小程序 | 同步逻辑适配微信小程序 |

### 4.2 新增模块

| 新模块 | 功能 | 说明 |
|--------|------|------|
| emotionAnalyzer | 情绪分析引擎 | 分析情绪趋势、模式识别、风险预判 |
| interventionEngine | 干预引擎 | 3天拆解干预流程管理 |
| outreachScheduler | 主动推送调度 | 管理推送频率、时机、内容 |
| crisisDetector | 高危检测 | 实时检测高危关键词，触发安全流程 |
| suggestionMatcher | 建议匹配 | 基于情绪+情境匹配预设建议 |

### 4.3 数据流

```
用户行为
  ↓
memoryIngestor（摄入）
  ↓
memoryGraph（构建图谱）
  ↓
emotionAnalyzer（分析）
  ├── emotionPatterns（模式识别）
  ├── riskAssessment（风险评估）
  └── interventionEffectiveness（干预效果）
  ↓
outreachScheduler（决策是否主动触达）
  ↓
是 → 微信订阅消息推送
否 → 继续监测
  ↓
用户响应 → memoryFeedback（反馈）→ memoryEvolution（优化）
```

---

## 五、核心引擎设计

### 5.1 情绪急救引擎

```typescript
// 急救流程状态机
type EmergencyState = 
  | 'idle'           // 初始状态
  | 'entry'          // 显示5选项
  | 'naming'         // 命名步骤
  | 'writing'        // 书写步骤
  | 'action'         // 行动步骤
  | 'connect'        // 连接步骤
  | 'closing'        // 收尾步骤
  | 'crisis'         // 高危干预
  | 'completed'      // 完成
  | 'followup'       // 第二天跟进

// 急救流程配置
interface EmergencyFlow {
  type: 'sad' | 'anxious' | 'tired' | 'lonely' | 'unclear'
  steps: EmergencyStep[]
  crisisCheckpoints: number[]  // 在哪些步骤检查高危
}

// 急救步骤
interface EmergencyStep {
  id: string
  type: 'naming' | 'writing' | 'action' | 'connect' | 'closing'
  title: string
  content: string
  inputType?: 'color' | 'text' | 'choice' | 'breathing' | 'audio'
  options?: string[]
  nextStep: string
}
```

### 5.2 AI主动引擎

```typescript
// 主动触发条件
interface OutreachTrigger {
  type: 'prediction' | 'silence' | 'pattern' | 'followup' | 'good_news' | 'crisis'
  condition: OutreachCondition
  priority: 'low' | 'medium' | 'high' | 'critical'
  cooldownHours: number  // 冷却时间
}

// 触发条件
interface OutreachCondition {
  // 基于时间模式
  timePattern?: {
    dayOfWeek?: number[]
    hourRange?: [number, number]
    frequencyThreshold?: number  // 历史出现次数
  }
  
  // 基于沉默
  silence?: {
    daysSinceLastActive: number
    lastMood: string
  }
  
  // 基于情绪趋势
  moodTrend?: {
    consecutiveNegativeDays: number
    trendDirection: 'declining' | 'improving'
    changePercent: number
  }
  
  // 基于日程
  scheduleEvent?: {
    daysUntilEvent: number
    emotionTag: string
    historicalImpact: number
  }
}

// 推送决策
interface OutreachDecision {
  shouldPush: boolean
  reason: string
  content: string
  timing: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
}
```

### 5.3 3天拆解干预引擎

```typescript
// 干预流程
interface InterventionFlow {
  eventId: string
  userId: string
  startDate: Date  // T-3
  eventDate: Date  // T
  
  steps: InterventionStep[]
  currentStep: number
  status: 'pending' | 'active' | 'completed' | 'failed'
  
  // 效果追踪
  anxietyBaseline: number  // T-3时的焦虑
  anxietyCurrent: number   // 当前焦虑
  effectivenessScore: number
}

// 干预步骤
interface InterventionStep {
  day: number  // -3, -2, -1, 0, +1
  type: 'naming' | 'worst_case' | 'rehearsal' | 'empower' | 'tracking'
  
  // 内容（基于事件类型+情绪类型动态生成）
  title: string
  prompts: string[]
  inputType: 'choice' | 'text' | 'scale'
  options?: string[]
  
  // 个性化（从memory-body读取）
  personalContext?: {
    historicalData?: string    // "上次汇报后情绪回升11分"
    successRecall?: string     // "上次你做到了"
    patternData?: string       // "你的焦虑虚高率100%"
  }
  
  // 结果
  userResponse?: any
  anxietyBefore?: number
  anxietyAfter?: number
}
```

### 5.4 情绪分析引擎

```typescript
// 情绪分析层级
type AnalysisLevel = 
  | 'descriptive'     // 描述性：趋势、分布
  | 'diagnostic'      // 诊断性：触发因素、周期
  | 'predictive'      // 预测性：预警、风险
  | 'prescriptive'    // 指导性：建议、行动

// 情绪模式
interface EmotionPattern {
  type: 'weekly_cycle' | 'trigger_association' | 'behavior_correlation' | 'intervention_effect'
  
  // 模式数据
  pattern: {
    trigger?: string         // 触发因素
    effect?: string          // 影响
    correlation?: number     // 相关性 0-1
    frequency?: number       // 出现频率
  }
  
  // 置信度
  confidence: number         // 0-1，基于数据量
  
  // 例子
  example: string            // "每次和家人通话后第二天情绪低1.8分"
}
```

---

## 六、接口设计

### 6.1 认证（微信登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/wx-login` | 微信登录（code换openid） |
| GET | `/api/auth/profile` | 获取用户信息 |
| PUT | `/api/auth/profile` | 更新用户信息 |

### 6.2 情绪急救

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/emergency/start` | 开始急救会话 |
| POST | `/api/emergency/:sessionId/step` | 提交急救步骤数据 |
| POST | `/api/emergency/:sessionId/complete` | 完成急救 |
| GET | `/api/emergency/:sessionId/letter` | 获取急救信 |
| POST | `/api/emergency/:sessionId/followup` | 提交第二天跟进 |
| GET | `/api/emergency/history` | 急救历史 |

### 6.3 情绪记录

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/moods` | 记录情绪 |
| GET | `/api/moods/today` | 今日情绪 |
| GET | `/api/moods/trends` | 情绪趋势 |
| GET | `/api/moods/patterns` | 情绪模式 |
| GET | `/api/moods/report` | 情绪报告（周/月） |

### 6.4 日程与干预

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/schedule/events` | 添加日程事件 |
| GET | `/api/schedule/calendar` | 获取日历视图 |
| GET | `/api/schedule/events/:id/intervention` | 获取干预流程 |
| POST | `/api/schedule/events/:id/intervention/:stepId` | 提交干预步骤 |
| GET | `/api/schedule/events/:id/tracking` | 事件后追踪 |

### 6.5 树洞

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/treehole/feed` | 树洞信息流 |
| POST | `/api/treehole/posts` | 发布树洞 |
| POST | `/api/treehole/posts/:id/empathy` | 点"懂你" |
| POST | `/api/treehole/posts/:id/reply` | 回复树洞 |
| POST | `/api/treehole/goodnight` | 晚安交换 |

### 6.6 AI主动

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/ai/outreaches` | 获取主动推送列表 |
| POST | `/api/ai/outreaches/:id/respond` | 回应推送 |
| PUT | `/api/ai/settings` | 更新推送设置 |
| GET | `/api/ai/insights` | AI发现的模式 |

### 6.7 测试

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tests` | 获取测试列表 |
| POST | `/api/tests/:type/submit` | 提交测试 |
| GET | `/api/tests/:type/result` | 获取结果 |
| POST | `/api/tests/:resultId/share` | 生成分享卡片 |

### 6.8 咨询导流

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/referral/counselors` | 获取推荐咨询师 |
| POST | `/api/referral/click` | 记录点击 |
| GET | `/api/referral/history` | 导流历史 |

### 6.9 同步

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/sync/push` | 推送本地数据 |
| GET | `/api/sync/pull` | 拉取云端数据 |

---

## 七、前端架构

### 7.1 目录结构

```
src/
├── app.tsx                       小程序入口
├── app.config.ts                 小程序配置
├── app.scss
│
├── pages/                        页面
│   ├── index/                    首页（急救箱入口）
│   │   ├── index.tsx
│   │   └── index.scss
│   ├── emergency/                急救流程页
│   │   ├── index.tsx
│   │   └── steps/                各步骤组件
│   │       ├── Naming.tsx
│   │       ├── Writing.tsx
│   │       ├── Action.tsx
│   │       ├── Connect.tsx
│   │       └── Closing.tsx
│   ├── treehole/                 树洞页
│   │   ├── index.tsx             信息流
│   │   ├── detail.tsx            帖子详情
│   │   └── post.tsx              发帖
│   ├── calendar/                 情绪日历页
│   │   ├── index.tsx             日历视图
│   │   ├── event.tsx             事件详情
│   │   └── intervention.tsx      干预流程
│   ├── mood/                     情绪记录页
│   │   ├── index.tsx             记录入口
│   │   └── report.tsx            情绪报告
│   ├── test/                     测试页
│   │   ├── index.tsx             测试列表
│   │   └── result.tsx            测试结果
│   ├── growth/                   成长追踪页
│   │   ├── index.tsx             情绪年轮
│   │   └── story.tsx             情绪故事
│   ├── ritual/                   日常仪式
│   │   ├── morning.tsx           晨间仪式
│   │   └── evening.tsx           晚间仪式
│   └── profile/                  个人中心
│       ├── index.tsx
│       └── settings.tsx
│
├── components/                   通用组件
│   ├── BreathingAnimation.tsx    呼吸动画
│   ├── WhiteNoise.tsx            白噪音播放
│   ├── MoodSelector.tsx          情绪选择器
│   ├── ShareCard.tsx             分享卡片
│   ├── CrisisAlert.tsx           高危干预弹窗
│   └── OutreachMessage.tsx       AI主动消息卡片
│
├── engines/                      核心引擎
│   ├── emergency/                急救引擎
│   │   ├── EmergencyEngine.ts    状态机
│   │   ├── flows/                5条急救流程配置
│   │   └── CrisisDetector.ts     高危检测
│   ├── intervention/             干预引擎
│   │   ├── InterventionEngine.ts 3天拆解管理
│   │   └── steps/                干预步骤配置
│   ├── outreach/                 主动推送引擎
│   │   ├── OutreachScheduler.ts  推送调度
│   │   ├── triggers/             触发条件
│   │   └── QuotaManager.ts       频率控制
│   └── analysis/                 分析引擎
│       ├── EmotionAnalyzer.ts    情绪分析
│       ├── PatternRecognizer.ts  模式识别
│       └── RiskAssessor.ts       风险评估
│
├── memory-body/                  记忆引擎（复用+改造）
│   ├── types/
│   ├── store/
│   ├── lifecycle/
│   ├── security/
│   ├── adapters/
│   └── sync/
│
├── hooks/                        Hooks
│   ├── useEmergency.ts           急救流程
│   ├── useMood.ts                情绪记录
│   ├── useTreehole.ts            树洞
│   ├── useSchedule.ts            日程
│   ├── useOutreach.ts            AI主动
│   └── useTest.ts                测试
│
├── stores/                       状态管理（Zustand）
│   ├── authStore.ts
│   ├── emergencyStore.ts
│   ├── moodStore.ts
│   ├── treeholeStore.ts
│   └── outreachStore.ts
│
├── services/                     API调用
│   ├── api.ts                    基础请求
│   ├── authService.ts
│   ├── emergencyService.ts
│   ├── moodService.ts
│   ├── treeholeService.ts
│   ├── scheduleService.ts
│   ├── outreachService.ts
│   └── referralService.ts
│
├── data/                         静态数据
│   ├── moodTags.ts               24个情绪标签
│   ├── contextTags.ts            情境标签
│   ├── crisisKeywords.ts         高危关键词库
│   ├── suggestionLibrary.ts      预设建议库
│   ├── emergencyFlows.ts         5条急救流程配置
│   ├── interventionSteps.ts      干预步骤配置
│   └── tests/                    测试题库
│       ├── healthCheck.ts
│       ├── loneliness.ts
│       ├── socialEnergy.ts
│       └── burnout.ts
│
└── utils/                        工具
    ├── storage.ts                小程序存储适配
    ├── crypto.ts                 加密
    ├── date.ts                   日期处理
    └── share.ts                  分享
```

### 7.2 页面路由

```typescript
// app.config.ts
export default {
  pages: [
    'pages/index/index',              // 首页（急救箱入口）
    'pages/emergency/index',          // 急救流程
    'pages/treehole/index',           // 树洞信息流
    'pages/treehole/detail',          // 帖子详情
    'pages/treehole/post',            // 发帖
    'pages/calendar/index',           // 情绪日历
    'pages/calendar/event',           // 事件详情
    'pages/calendar/intervention',    // 干预流程
    'pages/mood/index',               // 情绪记录
    'pages/mood/report',              // 情绪报告
    'pages/test/index',               // 测试列表
    'pages/test/result',              // 测试结果
    'pages/growth/index',             // 情绪年轮
    'pages/growth/story',             // 情绪故事
    'pages/ritual/morning',           // 晨间仪式
    'pages/ritual/evening',           // 晚间仪式
    'pages/profile/index',            // 个人中心
    'pages/profile/settings',         // 设置
  ],
  window: {
    navigationBarBackgroundColor: '#1a1a2e',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0f0f1e',
  },
  tabBar: {
    list: [
      { pagePath: 'pages/index/index', text: '急救' },
      { pagePath: 'pages/treehole/index', text: '树洞' },
      { pagePath: 'pages/calendar/index', text: '日历' },
      { pagePath: 'pages/growth/index', text: '成长' },
    ]
  }
}
```

---

## 八、AI实现策略

### 8.1 分阶段实现

| 阶段 | 用户量 | AI能力 | 实现 | 月成本 |
|------|--------|--------|------|--------|
| 冷启动 | 0-1000 | 规则引擎 | 情绪标签→预设建议库匹配 | 0元 |
| 成长 | 1000-1万 | +小模型 | +简单情感分析+模板化回复 | ~500元 |
| 成熟 | 1万+ | +大模型 | +个性化分析+叙事化报告 | ~5000元 |

### 8.2 冷启动期AI实现

```typescript
// 规则引擎示例
function generateResponse(mood: string, context: string, intensity: number): string {
  const suggestions = suggestionLibrary
    .filter(s => s.mood === mood && s.context === context)
    .sort((a, b) => Math.random() - 0.5)  // 随机排序
  
  if (intensity >= 8) {
    return highIntensityTemplates[mood]
  }
  
  return suggestions[0]?.suggestion || defaultResponse
}
```

### 8.3 预设建议库结构

```typescript
const suggestionLibrary = {
  anxiety: {
    work: [
      "你的焦虑说明你在乎。先停一下，做4次深呼吸。",
      "上次你在工作焦虑时散步了15分钟，之后情绪提升了20分。要不要现在试试？",
    ],
    social: [...],
    none: [...]
  },
  sadness: {
    work: [...],
    relationship: [...],
    alone: [...],
  },
  // ...
}
```

---

## 九、安全设计

### 9.1 高危关键词检测

```typescript
const crisisKeywords = {
  mild: [
    "活着没意思", "好累想消失", "不想面对", "撑不下去了",
    "没意义", "太痛苦了", "想逃避"
  ],
  moderate: [
    "想死", "不想活了", "活不下去", "想结束一切",
    "没有我在", "消失算了"
  ],
  severe: [
    "已经吃了药", "站在天台", "准备跳", "割腕了",
    "烧炭了", "吃了安眠药"
  ]
}

function detectCrisis(text: string): 'safe' | 'mild' | 'moderate' | 'severe' {
  // 1. 先检查severe
  for (const kw of crisisKeywords.severe) {
    if (text.includes(kw)) return 'severe'
  }
  // 2. 再检查moderate
  for (const kw of crisisKeywords.moderate) {
    if (text.includes(kw)) return 'moderate'
  }
  // 3. 最后检查mild
  for (const kw of crisisKeywords.mild) {
    if (text.includes(kw)) return 'mild'
  }
  return 'safe'
}
```

### 9.2 隐私保护

```typescript
// 数据分级
type DataLevel = 'public' | 'private' | 'encrypted'

// 存储策略
const storageStrategy = {
  public: {
    data: ['treehole_posts.content'],  // 树洞内容（匿名）
    storage: 'cloud',                  // 云端
    encrypted: false,
  },
  private: {
    data: ['mood_entries.note', 'emergency_sessions.step_writing'],
    storage: 'local_first',            // 本地优先
    encrypted: true,                   // 云端备份加密
  },
  encrypted: {
    data: ['emergency_sessions.step_writing'],  // 高危内容
    storage: 'local_only',             // 仅本地
    encrypted: true,                   // 端到端加密
  }
}
```

---

## 十、性能与限制

### 10.1 小程序限制应对

| 限制 | 应对 |
|------|------|
| 包大小2MB | 分包加载：急救核心包+社区包+日历包 |
| 本地存储10MB | 只存核心数据，历史数据上传云端 |
| 网络请求10个并发 | 请求合并+缓存 |
| setData性能 | 虚拟列表+减少更新频率 |

### 10.2 分包策略

```
主包（<2MB）
├── 首页（急救入口）
├── 急救流程
├── 情绪记录
└── 核心组件

分包1：社区（<2MB）
├── 树洞
├── 晚安交换
└── 情绪伙伴

分包2：日历（<2MB）
├── 情绪日历
├── 事件详情
└── 干预流程

分包3：成长（<2MB）
├── 情绪年轮
├── 情绪故事
└── 情绪测试
```

---

## 十一、测试策略

| 类型 | 范围 | 工具 |
|------|------|------|
| 单元测试 | 引擎逻辑、数据处理 | Vitest |
| 组件测试 | UI组件渲染 | Vitest + Testing Library |
| 集成测试 | 页面流程 | Vitest |
| E2E测试 | 核心流程 | 手动（小程序限制） |

**重点测试**：
- 高危关键词检测（不能漏）
- 急救流程状态机（不能卡死）
- 推送频率控制（不能超限）
- 数据同步（不能丢失）

---

## 十二、部署与发布

### 12.1 环境

| 环境 | 用途 | 后端 |
|------|------|------|
| 开发 | 本地开发 | Supabase本地 |
| 预发布 | 灰度测试 | Supabase独立项目 |
| 生产 | 正式 | Supabase生产项目 |

### 12.2 CI/CD

```yaml
# GitHub Actions
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
      - run: npm run build:weapp  # 小程序构建
      # 小程序需通过微信开发者工具上传
```

---

## 十三、现有代码迁移方案

### 13.1 迁移步骤

```
1. 安装Taro 3
2. 创建Taro项目结构
3. 迁移memory-body引擎（适配小程序存储）
4. 迁移核心组件（Tailwind → 小程序兼容CSS）
5. 迁移情绪记录/习惯/专注功能
6. 新建急救引擎/干预引擎/主动引擎
7. 新建树洞/日历/测试页面
8. 联调测试
```

### 13.2 代码复用清单

| 现有代码 | 迁移方式 | 改造量 |
|---------|---------|--------|
| memory-body/ | 直接迁移，适配存储 | 20%改造 |
| MoodJournal | 提取核心逻辑，重写UI | 30%改造 |
| HabitTracker | 提取核心逻辑，重写UI | 20%改造 |
| FocusMode | 提取核心逻辑，重写UI | 20%改造 |
| agentRuntime | 改造为情绪分析引擎 | 50%改造 |
| Supabase集成 | 直接复用 | 0% |
| 安全模块 | 直接复用 | 0% |

---

## 十四、非功能需求

- 主载体：微信小程序（Taro 3）
- 后期扩展：App（Capacitor）、B端Web
- 本地优先，云端可选同步
- 端到端加密（高危内容）
- 离线可用（急救功能）
- 响应式设计
- 测试覆盖率 > 80%
- 小程序包大小 < 2MB（主包）
