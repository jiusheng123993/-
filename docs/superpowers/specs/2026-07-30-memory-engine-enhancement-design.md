# 记忆引擎深化 — 设计文档

> 版本：v1.0
> 日期：2026-07-30
> 状态：已确认设计

---

## 一、目标

在现有 memory-body 引擎（仅健康类型记忆）基础上，**扩展记忆维度**并**增强AI对话的记忆注入能力**，使AI能更自然地理解宠物的历史、习惯和偏好。

---

## 二、架构

```
┌─────────────────────────────────────────┐
│             Memory Aggregator           │  聚合层
│          跨域记忆聚合+画像构建            │
└────┬──────┬──────┬──────┬───────────────┘
     │      │      │      │
┌────┴┐ ┌──┴──┐ ┌─┴───┐ ┌┴────────┐     适配器层
│健康 │ │饮食 │ │行为 │ │里程碑   │
│记忆 │ │记忆 │ │记忆 │ │记忆     │
└─────┘ └─────┘ └─────┘ └─────────┘
     │      │      │      │
┌────┴──────┴──────┴──────┴─────────┐     注入器层
│         AI Memory Injector        │
│     记忆 → AI prompt 智能注入      │
└───────────────────────────────────┘
```

### 设计原则

- **零侵入**：不修改现有代码（healthIndexAdapter、vaccineTrackerAdapter等）
- **增量扩展**：每个新适配器独立文件、独立测试
- **本地优先**：与现有框架一致，使用 localStorage 持久化
- **渐进注入**：AI prompt 分层注入（固定层/动态层/按需层）

---

## 三、新增记忆适配器

### 3.1 饮食记忆适配器 (DietMemoryAdapter)

**文件**：`src/memory-body/adapters/dietMemoryAdapter.ts`

**职责**：记录食物偏好/禁忌/过敏历史，供AI在对话和食物查询时引用。

**核心接口**：

```typescript
interface FoodMemory {
  foodName: string
  petId: string
  safetyLevel: 'safe' | 'caution' | 'dangerous' | 'toxic'
  feedings: FeedingEvent[]
  totalFeedings: number
  lastFedDate: string | null
  preference: 'likes' | 'neutral' | 'dislikes' | 'unknown'
}

interface FeedingEvent {
  date: string
  amount?: number
  reaction?: 'good' | 'normal' | 'refused' | 'upset_stomach'
}

class DietMemoryAdapter {
  constructor(userId: string)
  recordFeeding(petId: string, foodName: string, event: FeedingEvent): void
  getDietProfile(petId: string): DietProfile
  getFoodPreference(petId: string, foodName: string): FoodMemory | null
}
```

### 3.2 行为记忆适配器 (BehaviorAdapter)

**文件**：`src/memory-body/adapters/behaviorAdapter.ts`

**职责**：记录性格特征、行为基线、异常行为模式。

**核心接口**：

```typescript
interface BehaviorObservation {
  date: string
  category: 'energy' | 'social' | 'sleep' | 'appetite_behavior' | 'other'
  description: string
  severity?: 'normal' | 'notable' | 'concern'
}

class BehaviorAdapter {
  constructor(userId: string)
  recordObservation(petId: string, observation: BehaviorObservation): void
  buildBaseline(petId: string): BehavioralBaseline
  detectAnomalies(petId: string): BehaviorObservation[]
  getPersonalitySummary(petId: string): string
}
```

### 3.3 里程碑记忆适配器 (MilestoneAdapter)

**文件**：`src/memory-body/adapters/milestoneAdapter.ts`

**职责**：记录重要日期和成就。

**核心接口**：

```typescript
interface PetMilestone {
  id: string
  petId: string
  type: 'adoption' | 'birthday' | 'first_checkin' | 'vaccine_complete'
       | 'recovery' | 'achievement' | 'custom'
  title: string
  date: string
  description?: string
  icon?: string
}

class MilestoneAdapter {
  constructor(userId: string)
  addMilestone(petId: string, milestone: PetMilestone): void
  getTimeline(petId: string): PetMilestone[]
  getUpcomingMilestone(petId: string): { type: string; date: string; daysUntil: number } | null
  syncFromCheckins(petId: string, checkins: any[]): void  // 从打卡记录自动同步
}
```

---

## 四、记忆聚合器 (MemoryAggregator)

**文件**：`src/memory-body/aggregator/memoryAggregator.ts`

**职责**：从所有适配器收集数据，生成宠物综合画像。

```typescript
interface UnifiedPetMemory {
  petId: string
  profile: { name: string; species: string; breed: string; age: string; gender: string }
  health: HealthProfile | null
  diet: DietProfile | null
  behavior: BehavioralBaseline | null
  milestones: PetMilestone[]
  summary: string
}

interface CompactMemoryContext {
  petId: string
  systemPrompt: string      // ~600 tokens
  fragments: MemoryFragment[]
}

class MemoryAggregator {
  constructor(userId: string)
  getPetMemory(petId: string): UnifiedPetMemory
  getCompactContext(petId: string, maxTokens?: number): CompactMemoryContext
  getRelevantMemories(petId: string, query: string): MemoryFragment[]
}
```

**缓存策略**：聚合结果缓存5分钟，过期自动重建。

---

## 五、AI注入器 (AiMemoryInjector)

**文件**：`src/memory-body/injectors/aiMemoryInjector.ts`

**职责**：将聚合记忆智能注入 AI 对话 prompt。

**注入分层**：

| 层级 | 内容 | Token预算 |
|------|------|-----------|
| 固定层 | 宠物基本信息 + 性格 | ~100 tokens |
| 动态层 | 近日健康/饮食/行为摘要 | ~200 tokens |
| 按需层 | 用户问题触发的相关历史 | ~300 tokens |

```typescript
class AiMemoryInjector {
  constructor(userId: string)
  buildSystemPrompt(petId: string): Promise<string>
  buildContext(petId: string, maxTokens?: number): Promise<MemoryContext>
  getRelevantForQuery(petId: string, userQuery: string): Promise<MemoryFragment[]>
}
```

**集成点**：在 `chatService.ts` 中，发送AI请求前调用 `buildSystemPrompt()` 追加到 system prompt。

---

## 六、集成清单

| 操作 | 文件 | 改动类型 |
|------|------|---------|
| 新增 | `adapters/dietMemoryAdapter.ts` | 创建 |
| 新增 | `adapters/behaviorAdapter.ts` | 创建 |
| 新增 | `adapters/milestoneAdapter.ts` | 创建 |
| 新增 | `aggregator/memoryAggregator.ts` | 创建 |
| 新增 | `injectors/aiMemoryInjector.ts` | 创建 |
| 修改 | `memory-body/index.ts` | 追加导出 |
| 修改 | `services/chatService.ts` | 追加注入调用 |
| 追加 | `types/memoryBodyTypes.ts` | 追加新类型（不覆盖） |

---

## 七、风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| localStorage 存储上限 | P2 | 每个适配器限制最多500条，超出自动裁剪 |
| 聚合性能 | P3 | 缓存5分钟 + 延迟加载非关键数据 |
| AI prompt 超长 | P2 | 分层注入 + maxTokens硬限制 |
| 旧版本兼容 | P1 | 只新增不删改，100%向后兼容 |
