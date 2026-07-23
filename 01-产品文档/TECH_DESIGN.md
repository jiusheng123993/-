# 星寰海 — 技术设计文档

> 版本：v4.0
> 更新日期：2026-07-23
> 状态：草案
> 变更说明：v4.0 架构重构：AI对话为唯一入口层，新增Guard双守卫/取名引擎/时光引擎/家庭引擎，数据库新增6张表，职业方向推迟到Phase 3

---

## 一、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 小程序框架 | Taro 3 + React 19 + TypeScript | 一套代码跑小程序+H5 |
| 构建工具 | Vite | 开发体验好 |
| 状态管理 | Zustand | 轻量 |
| 样式方案 | Tailwind CSS + CSS Modules | 小程序兼容 |
| 后端 | Supabase (PostgreSQL + Auth + Realtime + Storage) | BaaS，省后端开发 |
| 云函数 | Supabase Edge Functions | 轻量AI逻辑+推送调度 |
| 记忆引擎 | memory-body（自研，5层架构，18模块） | 核心壁垒，70%复用 |
| AI策略 | 规则引擎 → 小模型 → 大模型（分阶段） | MVP纯规则0成本 |
| 推送 | 微信订阅消息 | 疫苗提醒+异常预警+召回 |
| 宠物形象 | Seedream API | 照片→3种风格卡通形象 |
| 测试 | Vitest | 单元+组件+集成 |
| 代码规范 | ESLint + Prettier | 已有 |

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
│                     云端                          │
│  ┌────────────────────────────────────────────┐  │
│  │          Supabase (PostgreSQL)             │  │
│  │  + new: pet_families/moments/milestones/   │  │
│  │         lineage/names 表                   │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │          外部AI服务                         │  │
│  │  ├── DeepSeek/GLM-4（宠物对话）            │  │
│  │  ├── GLM-4v（照片描述）                    │  │
│  │  ├── 分类模型（Guard语义检测）              │  │
│  │  └── Seedream（宠物形象）                   │  │
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
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  name       TEXT NOT NULL
  avatar_url TEXT
  created_at TIMESTAMPTZ DEFAULT NOW()
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

pet_family_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
  family_id  UUID NOT NULL REFERENCES pet_families(id) ON DELETE CASCADE
  pet_id     UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE
  role       TEXT
  joined_at  TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(family_id, pet_id)
);

pet_lineage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
  parent_id    UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE
  child_id     UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE
  litter_date  DATE
  UNIQUE(parent_id, child_id)
);

### 3.2c 时光引擎（新增）

```sql
pet_moments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  family_id   UUID REFERENCES pet_families(id)
  pet_id      UUID REFERENCES pet_profiles(id)
  type        TEXT NOT NULL
  content     JSONB NOT NULL
  photos      TEXT[]
  ai_summary  TEXT
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_moments_family ON pet_moments(family_id, created_at DESC);
CREATE INDEX idx_moments_pet ON pet_moments(pet_id, created_at DESC);
CREATE INDEX idx_moments_user ON pet_moments(user_id, created_at DESC);

pet_milestones (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  pet_id    UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE
  title     TEXT NOT NULL
  date      DATE NOT NULL
  type      TEXT NOT NULL
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_milestones_pet ON pet_milestones(pet_id, date DESC);

### 3.2d 取名引擎（新增）

```sql
pet_names (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid()
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
  pet_id    UUID NOT NULL REFERENCES pet_profiles(id) ON DELETE CASCADE
  name      TEXT NOT NULL
  chosen    BOOLEAN DEFAULT FALSE
  analysis  JSONB
  created_at TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(pet_id, name)
);
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

---

## 七、前端架构

### 7.1 目录结构

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

### 7.2 页面路由

```typescript
export default {
  pages: [
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
    'pagesPet/chat/index',
    'pagesPet/timeline/index',
    'pagesPet/family/index',
    'pagesPet/family/tree',
    'pagesPet/family/calendar',
    'pagesPet/naming/index',
  ],
  tabBar: {
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/pet-profile/index', text: '我的宠物' },
      { pagePath: 'pages/member/index', text: '会员' },
      { pagePath: 'pages/mine/index', text: '我的' },
    ]
  }
}
```

---

## 八、AI实现策略

### 8.1 三阶段实现

| 阶段 | 用户量 | AI能力 | 实现 | 月成本 |
|------|--------|--------|------|--------|
| 冷启动 | 0-1000 | 纯规则引擎 | 健康打卡→5级选择→预设反馈模板；食物查询→知识图谱精确匹配；症状初筛→规则引擎+紧急度映射 | 0元 |
| 成长 | 1000-1万 | +小模型 | +简单健康趋势分析；+模板化月度报告 | ~500元 |
| 成熟 | 1万+ | +大模型 | +个性化健康建议；+叙事化月度报告 | ~5000元 |

### 8.2 规则引擎核心

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

### 8.3 知识图谱数据结构

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

## 九、安全设计

### 9.1 PetSafetyHandler（P0）

| 安全场景 | 检测条件 | 响应动作 | 弹窗行为 |
|---------|---------|---------|---------|
| 有毒食物拦截 | 食物查询结果为toxic | 强制弹窗+免责声明+就医建议 | 不可关闭，3秒延迟 |
| 红色预警触发 | 打卡出现血便/不吃+萎靡 | 不可关闭弹窗+立即就医建议 | 不可关闭，3秒延迟 |
| 症状红色评估 | 症状初筛AI评估为🔴 | 不可关闭弹窗+急诊建议 | 不可关闭，3秒延迟 |
| 医疗边界声明 | 所有AI建议 | 附加"仅供参考，不替代兽医诊断" | 常规展示 |

保守策略：宁可误报不可漏报。红色预警弹窗展示≥3秒后按钮才可点击，防止误触快速关闭。

### 9.1b AI Guard 双守卫（P0新增）

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

### 9.2 数据隐私

| 数据类型 | 隐私级别 | 存储方式 |
|---------|---------|---------|
| 宠物健康数据 | private | 本地优先+云端加密备份 |
| 宠物照片 | private | Supabase Storage |
| 情绪触发记录 | encrypted | 端到端加密 |
| 宠物离世悲伤记录 | encrypted | 端到端加密 |
| 食物查询记录 | public（不含用户身份） | 云端 |

### 9.3 合规边界

| 定位 | 能做 | 不能做 |
|------|------|--------|
| 宠物=分诊≠诊断 | "检测到异常信号，建议就医" | "你的猫得了肠胃炎" |
| 症状初筛=健康参考≠医疗建议 | 评估紧急程度、提供观察建议 | 开处方/推荐具体药品 |
| 情绪=隐形化≠心理服务 | 场景化情绪支持（呼吸、书写） | 心理诊断/治疗 |

---

## 十、性能与限制

### 10.1 小程序限制应对

| 限制 | 应对 |
|------|------|
| 包大小2MB | 分包加载：主包+宠物包+数据包+情绪包 |
| 本地存储10MB | 只存近期打卡数据+宠物档案，历史上传云端 |
| 网络请求10个并发 | 请求合并+缓存 |
| setData性能 | 虚拟列表+减少更新频率 |

### 10.2 分包策略

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

---

## 十一、测试策略

| 类型 | 范围 | 工具 |
|------|------|------|
| 单元测试 | PetSafetyHandler（不能漏拦截）、症状规则引擎、健康趋势分析、异常检测 | Vitest |
| 组件测试 | 打卡组件、食物查询组件、症状初筛组件、宠物形象组件 | Vitest + Testing Library |
| 集成测试 | 打卡→AI反馈→症状初筛流程、付费限制流程、疫苗提醒流程 | Vitest |
| E2E测试 | 核心打卡流程、食物查询流程、症状初筛流程 | 手动（小程序限制） |

**重点测试**：
- PetSafetyHandler有毒食物拦截（不能漏）
- 红色预警触发（血便/不吃+萎靡必须触发）
- 症状规则引擎紧急度评估（宁可误报不可漏报）
- 打卡异常检测（连续3天偏离基线）
- 付费限制流程（免费用户配额控制）
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

## 十三、现有代码迁移方案

### 13.1 迁移步骤

```
1. 保留memory-body引擎（70%复用）
2. 保留Supabase集成和Auth系统
3. 保留加密模块
4. 删除情绪专用页面（treehole, emergency, calendar, mood, test, ritual, growth）
5. 删除情绪专用组件（BreathingAnimation, WhiteNoisePlayer, MoodSelector, TreeholePostCard等）
6. 删除情绪专用引擎（EmergencyEngine, Day3InterventionEngine, EmotionTestEngine等）
7. 新建宠物模块页面和组件
8. 新建宠物安全引擎（PetSafetyHandler P0优先）
9. 新建宠物知识图谱数据
10. 联调测试
```

### 13.2 代码复用清单

| 现有代码 | 迁移方式 | 改造量 |
|---------|---------|--------|
| memory-body/ | 直接复用+扩展宠物类型 | 10% |
| 情绪记录框架 | → 3秒健康打卡 | 30% |
| 风险日历 | → 疫苗驱虫日历 | 40% |
| 风险评估引擎 | → 症状初筛 | 30% |
| 安全过滤引擎 | → 宠物安全过滤 | 20% |
| 主动触达引擎 | → 疫苗提醒+异常预警 | 15% |
| 急救箱流程 | → 情绪底层悲伤陪伴 | 10% |
| Supabase集成 | 直接复用 | 0% |
| Auth系统 | 直接复用 | 0% |
| 加密模块 | 直接复用 | 0% |

---

## 十四、非功能需求

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
