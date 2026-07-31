# 记忆引擎深化 — 实现计划

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 health-only memory-body 引擎上扩展饮食/行为/里程碑三类记忆，并新增聚合器和AI注入器。

**Architecture:** 新增5个模块（3适配器+1聚合器+1注入器），只新增不修改现有文件（除 index.ts 导出和 chatService.ts 注入点），100%向后兼容。

**Tech Stack:** TypeScript, Taro/React, localStorage持久化

---

## 文件结构

```
src/memory-body/
├── types/memoryBodyTypes.ts          ← 追加新类型（不覆盖）
├── adapters/
│   ├── dietMemoryAdapter.ts          ← 创建
│   ├── behaviorAdapter.ts            ← 创建
│   └── milestoneAdapter.ts           ← 创建
├── aggregator/memoryAggregator.ts    ← 创建
├── injectors/aiMemoryInjector.ts     ← 创建
├── index.ts                          ← 追加导出
src/services/chatService.ts           ← 追加AI注入调用
```

---

### Task 1: 追加记忆类型定义

**Files:**
- Modify: `src/memory-body/types/memoryBodyTypes.ts` — 在文件末尾追加新类型

- [ ] **Step 1: 追加饮食记忆类型**

追加以下代码到 `memoryBodyTypes.ts` 末尾（`VaccineReminder` 接口之后）：

```typescript

// ===== 记忆引擎深化 v2 - 新增类型 =====

export interface FoodMemory {
  foodName: string
  petId: string
  safetyLevel: 'safe' | 'caution' | 'dangerous' | 'toxic'
  feedings: FeedingEvent[]
  totalFeedings: number
  lastFedDate: string | null
  preference: 'likes' | 'neutral' | 'dislikes' | 'unknown'
}

export interface FeedingEvent {
  date: string
  amount?: number
  reaction?: 'good' | 'normal' | 'refused' | 'upset_stomach'
}

export interface DietProfile {
  petId: string
  safeFoods: string[]
  dangerousFoods: string[]
  allergies: string[]
  diversityScore: number
  preferenceSummary: string
}
```

- [ ] **Step 2: 追加行为记忆类型**

```typescript
export interface BehaviorObservation {
  date: string
  category: 'energy' | 'social' | 'sleep' | 'appetite_behavior' | 'other'
  description: string
  severity?: 'normal' | 'notable' | 'concern'
}

export interface BehavioralBaseline {
  petId: string
  personalityTraits: string[]
  dailyBaseline: {
    sleepHours?: number
    activityLevel?: 'low' | 'medium' | 'high'
    socialWithHumans?: 'friendly' | 'shy' | 'aggressive'
    socialWithPets?: 'friendly' | 'shy' | 'aggressive'
  }
  recentConcerns: BehaviorObservation[]
  behaviorSummary: string
}
```

- [ ] **Step 3: 追加里程碑记忆类型**

```typescript
export interface PetMilestone {
  id: string
  petId: string
  type: 'adoption' | 'birthday' | 'first_checkin' | 'vaccine_complete'
       | 'recovery' | 'achievement' | 'custom'
  title: string
  date: string
  description?: string
  icon?: string
}
```

- [ ] **Step 4: 追加聚合器和注入器类型**

```typescript
export interface UnifiedPetMemory {
  petId: string
  profile: {
    name: string
    species: string
    breed: string
    age: string
    gender: string
  }
  health: import('../types/memoryBodyTypes').HealthProfile | null
  diet: DietProfile | null
  behavior: BehavioralBaseline | null
  milestones: PetMilestone[]
  summary: string
}

export interface MemoryFragment {
  type: 'health' | 'diet' | 'behavior' | 'milestone'
  date: string
  content: string
  relevance: number
}
```

- [ ] **Step 5: 提交**

```bash
git add src/memory-body/types/memoryBodyTypes.ts
git commit -m "feat(memory): add diet/behavior/milestone memory types"
```

---

### Task 2: 创建饮食记忆适配器

**Files:**
- Create: `src/memory-body/adapters/dietMemoryAdapter.ts`

- [ ] **Step 1: 创建 DietMemoryAdapter**

```typescript
import { getStorage, setStorage } from '../../utils/storage'
import type { FoodMemory, FeedingEvent, DietProfile } from '../types/memoryBodyTypes'

const STORAGE_KEY = 'diet_memories'

export class DietMemoryAdapter {
  private userId: string

  constructor(userId: string) {
    if (!userId) throw new Error('[DietMemoryAdapter] userId is required')
    this.userId = userId
  }

  private userKey(key: string): string {
    return `${key}_${this.userId}`
  }

  private getAll(): FoodMemory[] {
    return getStorage<FoodMemory[]>(this.userKey(STORAGE_KEY)) || []
  }

  private saveAll(items: FoodMemory[]): void {
    // 限制总量最多500条
    if (items.length > 500) items = items.slice(-500)
    setStorage(this.userKey(STORAGE_KEY), items)
  }

  recordFeeding(petId: string, foodName: string, event: FeedingEvent): void {
    const all = this.getAll()
    const key = `${petId}_${foodName.toLowerCase()}`
    const existing = all.find(m => `${m.petId}_${m.foodName.toLowerCase()}` === key)

    if (existing) {
      existing.feedings.push(event)
      existing.totalFeedings++
      existing.lastFedDate = event.date
      if (event.reaction === 'refused' || event.reaction === 'upset_stomach') {
        existing.preference = 'dislikes'
      } else if (event.reaction === 'good' && existing.preference === 'unknown') {
        existing.preference = 'likes'
      }
    } else {
      all.push({
        foodName: foodName.toLowerCase(),
        petId,
        safetyLevel: 'safe',
        feedings: [event],
        totalFeedings: 1,
        lastFedDate: event.date,
        preference: 'unknown',
      })
    }

    this.saveAll(all)
  }

  getDietProfile(petId: string): DietProfile {
    const all = this.getAll().filter(m => m.petId === petId)
    const safeFoods: string[] = []
    const dangerousFoods: string[] = []
    const allergies: string[] = []

    for (const m of all) {
      if (m.safetyLevel === 'safe' || m.safetyLevel === 'caution') {
        safeFoods.push(m.foodName)
      } else {
        dangerousFoods.push(m.foodName)
      }
      if (m.preference === 'dislikes' && m.feedings.some(f => f.reaction === 'upset_stomach')) {
        allergies.push(m.foodName)
      }
    }

    // 饮食多样性：过去7天吃了多少种不同食物
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const recentFoods = new Set(
      all.filter(m => m.lastFedDate && m.lastFedDate >= sevenDaysAgo).map(m => m.foodName)
    )
    const diversityScore = Math.min(100, recentFoods.size * 10)

    const liked = all.filter(m => m.preference === 'likes').map(m => m.foodName)
    const preferenceSummary = liked.length > 0
      ? `偏好食物: ${liked.join('、')}`
      : '暂无明显的饮食偏好数据'

    return {
      petId,
      safeFoods: [...new Set(safeFoods)],
      dangerousFoods: [...new Set(dangerousFoods)],
      allergies: [...new Set(allergies)],
      diversityScore,
      preferenceSummary,
    }
  }

  getFoodPreference(petId: string, foodName: string): FoodMemory | null {
    const all = this.getAll()
    return all.find(m => m.petId === petId && m.foodName === foodName.toLowerCase()) || null
  }

  clear(): void {
    setStorage(this.userKey(STORAGE_KEY), [])
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/memory-body/adapters/dietMemoryAdapter.ts
git commit -m "feat(memory): create DietMemoryAdapter"
```

---

### Task 3: 创建行为记忆适配器

**Files:**
- Create: `src/memory-body/adapters/behaviorAdapter.ts`

- [ ] **Step 1: 创建 BehaviorAdapter**

```typescript
import { getStorage, setStorage } from '../../utils/storage'
import type { BehaviorObservation, BehavioralBaseline } from '../types/memoryBodyTypes'

const STORAGE_KEY = 'behavior_observations'

export class BehaviorAdapter {
  private userId: string

  constructor(userId: string) {
    if (!userId) throw new Error('[BehaviorAdapter] userId is required')
    this.userId = userId
  }

  private userKey(key: string): string {
    return `${key}_${this.userId}`
  }

  private getAll(): BehaviorObservation[] {
    return getStorage<BehaviorObservation[]>(this.userKey(STORAGE_KEY)) || []
  }

  private saveAll(items: BehaviorObservation[]): void {
    if (items.length > 500) items = items.slice(-500)
    setStorage(this.userKey(STORAGE_KEY), items)
  }

  recordObservation(petId: string, observation: BehaviorObservation): void {
    const all = this.getAll()
    all.push({ ...observation, date: observation.date || new Date().toISOString().split('T')[0] })
    this.saveAll(all)
  }

  buildBaseline(petId: string): BehavioralBaseline {
    const obs = this.getAll().filter(o => o.date >= this.daysAgo(90))
    const petObs = obs.filter(o => this.isForPet(o, petId))

    // 提炼性格标签
    const traits: string[] = []
    const energyLevels = petObs.filter(o => o.category === 'energy')
    if (energyLevels.length >= 3) {
      const highEnergy = energyLevels.filter(o => o.description.includes('活跃') || o.description.includes('兴奋'))
      if (highEnergy.length > energyLevels.length * 0.6) traits.push('精力充沛')
      else traits.push('安静温和')
    }

    const socialObs = petObs.filter(o => o.category === 'social')
    if (socialObs.length >= 2) {
      const friendly = socialObs.filter(o => o.description.includes('友好') || o.description.includes('亲人'))
      if (friendly.length > socialObs.length * 0.6) traits.push('亲人友善')
    }

    if (traits.length === 0) traits.push('待观察')

    // 检测近7天异常
    const recentConcerns = petObs.filter(
      o => o.severity === 'concern' && o.date >= this.daysAgo(7)
    ).slice(-10)

    return {
      petId,
      personalityTraits: traits,
      dailyBaseline: {
        activityLevel: energyLevels.length >= 5 ? 'medium' : undefined,
        socialWithHumans: traits.includes('亲人友善') ? 'friendly' : undefined,
      },
      recentConcerns,
      behaviorSummary: traits.length > 0
        ? `${petObs.length > 10 ? '有充足观察数据' : '观察数据有限'}。性格倾向：${traits.join('、')}。`
        : '暂无足够行为数据',
    }
  }

  detectAnomalies(petId: string): BehaviorObservation[] {
    return this.getAll().filter(
      o => o.severity === 'concern' && this.isForPet(o, petId) && o.date >= this.daysAgo(14)
    )
  }

  getPersonalitySummary(petId: string): string {
    const baseline = this.buildBaseline(petId)
    return baseline.behaviorSummary
  }

  private isForPet(obs: BehaviorObservation, petId: string): boolean {
    return true // 同一userId下的观察都属于该宠物
  }

  private daysAgo(n: number): string {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }

  clear(): void {
    setStorage(this.userKey(STORAGE_KEY), [])
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/memory-body/adapters/behaviorAdapter.ts
git commit -m "feat(memory): create BehaviorAdapter"
```

---

### Task 4: 创建里程碑记忆适配器

**Files:**
- Create: `src/memory-body/adapters/milestoneAdapter.ts`

- [ ] **Step 1: 创建 MilestoneAdapter**

```typescript
import { getStorage, setStorage } from '../../utils/storage'
import type { PetMilestone } from '../types/memoryBodyTypes'

const STORAGE_KEY = 'pet_milestones'

export class MilestoneAdapter {
  private userId: string

  constructor(userId: string) {
    if (!userId) throw new Error('[MilestoneAdapter] userId is required')
    this.userId = userId
  }

  private userKey(key: string): string {
    return `${key}_${this.userId}`
  }

  private getAll(): PetMilestone[] {
    return getStorage<PetMilestone[]>(this.userKey(STORAGE_KEY)) || []
  }

  private saveAll(items: PetMilestone[]): void {
    if (items.length > 200) items = items.slice(-200)
    setStorage(this.userKey(STORAGE_KEY), items)
  }

  addMilestone(petId: string, milestone: Omit<PetMilestone, 'id'>): void {
    const all = this.getAll()
    all.push({
      ...milestone,
      id: `ms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    })
    this.saveAll(all)
  }

  getTimeline(petId: string): PetMilestone[] {
    return this.getAll()
      .filter(m => m.petId === petId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  getUpcomingMilestone(petId: string): { type: string; date: string; daysUntil: number } | null {
    const today = new Date().toISOString().split('T')[0]
    const future = this.getAll()
      .filter(m => m.petId === petId && m.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))

    if (future.length === 0) return null
    const next = future[0]
    const daysUntil = Math.ceil(
      (new Date(next.date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    )
    return { type: next.type, date: next.date, daysUntil }
  }

  syncFromCheckins(petId: string, checkinCount: number): void {
    const all = this.getAll()
    // 首次打卡里程碑
    if (checkinCount >= 1 && !all.some(m => m.petId === petId && m.type === 'first_checkin')) {
      this.addMilestone(petId, {
        petId,
        type: 'first_checkin',
        title: '第一次健康打卡',
        date: new Date().toISOString().split('T')[0],
        icon: '📝',
      })
    }
  }

  clear(): void {
    setStorage(this.userKey(STORAGE_KEY), [])
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/memory-body/adapters/milestoneAdapter.ts
git commit -m "feat(memory): create MilestoneAdapter"
```

---

### Task 5: 创建记忆聚合器

**Files:**
- Create: `src/memory-body/aggregator/memoryAggregator.ts`

- [ ] **Step 1: 创建 MemoryAggregator**

```typescript
import { HealthIndexAdapter } from '../adapters/healthIndexAdapter'
import { DietMemoryAdapter } from '../adapters/dietMemoryAdapter'
import { BehaviorAdapter } from '../adapters/behaviorAdapter'
import { MilestoneAdapter } from '../adapters/milestoneAdapter'
import type {
  UnifiedPetMemory,
  DietProfile,
  BehavioralBaseline,
  PetMilestone,
  MemoryFragment,
} from '../types/memoryBodyTypes'

interface PetBasicInfo {
  id: string
  name: string
  species: string
  breed: string
  gender: string
  birthDate?: string
}

// 缓存：5分钟有效期
const cache = new Map<string, { data: UnifiedPetMemory; expiresAt: number }>()
const CACHE_TTL = 5 * 60 * 1000

export class MemoryAggregator {
  private healthAdapter: HealthIndexAdapter
  private dietAdapter: DietMemoryAdapter
  private behaviorAdapter: BehaviorAdapter
  private milestoneAdapter: MilestoneAdapter

  constructor(userId: string) {
    this.healthAdapter = new HealthIndexAdapter(userId)
    this.dietAdapter = new DietMemoryAdapter(userId)
    this.behaviorAdapter = new BehaviorAdapter(userId)
    this.milestoneAdapter = new MilestoneAdapter(userId)
  }

  getPetMemory(pet: PetBasicInfo): UnifiedPetMemory {
    const cacheKey = `memory_${pet.id}`
    const cached = cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }

    const health = this.healthAdapter.buildHealthProfile(pet.id, 30)
    const diet: DietProfile | null = this.dietAdapter.getDietProfile(pet.id)
    const behavior: BehavioralBaseline | null = this.behaviorAdapter.buildBaseline(pet.id)
    const milestones: PetMilestone[] = this.milestoneAdapter.getTimeline(pet.id)

    // 计算年龄
    const age = pet.birthDate
      ? this.calcAge(pet.birthDate)
      : '未知'

    // 生成综合摘要
    const summary = this.buildSummary(pet, health, diet, behavior, milestones)

    const result: UnifiedPetMemory = {
      petId: pet.id,
      profile: {
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        age,
        gender: pet.gender,
      },
      health,
      diet,
      behavior,
      milestones,
      summary,
    }

    cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL })
    return result
  }

  getCompactContext(pet: PetBasicInfo): { systemPrompt: string; fragments: MemoryFragment[] } {
    const memory = this.getPetMemory(pet)
    const fragments: MemoryFragment[] = []
    const lines: string[] = [`【关于 ${pet.name}】`]

    // 基本信息（固定层 ~100 tokens）
    lines.push(`${pet.species === 'dog' ? '狗狗' : '猫咪'}，${pet.breed}，${memory.profile.age}`)

    // 健康摘要（动态层 ~200 tokens）
    if (memory.health && memory.health.totalEntries > 0) {
      const s = memory.health.summary
      lines.push(`健康：打卡${memory.health.totalEntries}天，异常${s.totalAnomalies}次`)
      fragments.push({ type: 'health', date: memory.health.dateRange.end || '', content: s.totalAnomalies > 0 ? '近期有异常记录' : '近期健康稳定', relevance: 0.8 })
    }

    // 饮食摘要
    if (memory.diet && memory.diet.safeFoods.length > 0) {
      lines.push(memory.diet.preferenceSummary)
      fragments.push({ type: 'diet', date: '', content: memory.diet.preferenceSummary, relevance: 0.6 })
    }

    // 行为摘要
    if (memory.behavior && memory.behavior.personalityTraits.length > 0) {
      lines.push(`性格：${memory.behavior.personalityTraits.join('、')}`)
    }

    // 里程碑摘要
    if (memory.milestones.length > 0) {
      const recent = memory.milestones.slice(0, 2)
      lines.push(`重要时刻：${recent.map(m => `${m.title}(${m.date})`).join('、')}`)
    }

    return {
      systemPrompt: lines.join('\n'),
      fragments,
    }
  }

  getRelevantMemories(pet: PetBasicInfo, query: string): MemoryFragment[] {
    const memory = this.getPetMemory(pet)
    const fragments: MemoryFragment[] = []
    const q = query.toLowerCase()

    // 按关键词匹配相关记忆
    if (/吃|食|食物|喂|餐/.test(q) && memory.diet) {
      fragments.push({
        type: 'diet',
        date: '',
        content: memory.diet.preferenceSummary,
        relevance: 0.9,
      })
    }

    if (/健康|精神|食欲|便便|体重/.test(q) && memory.health) {
      const s = memory.health.summary
      fragments.push({
        type: 'health',
        date: memory.health.dateRange.end || '',
        content: `近30天打卡${memory.health.totalEntries}次，异常${s.totalAnomalies}次`,
        relevance: 0.85,
      })
    }

    if (/性格|行为|活泼|安静|乖/.test(q) && memory.behavior) {
      fragments.push({
        type: 'behavior',
        date: '',
        content: memory.behavior.behaviorSummary,
        relevance: 0.85,
      })
    }

    return fragments
  }

  private buildSummary(
    pet: PetBasicInfo,
    health: any,
    diet: DietProfile | null,
    behavior: BehavioralBaseline | null,
    milestones: PetMilestone[],
  ): string {
    const parts: string[] = [`${pet.name}是一只${pet.breed}`]
    if (health?.totalEntries > 0) {
      parts.push(health.summary.totalAnomalies > 0 ? '近期健康状况需要关注' : '近期健康状况良好')
    }
    if (behavior?.personalityTraits.length) {
      parts.push(`性格${behavior.personalityTraits.join('、')}`)
    }
    return parts.join('，')
  }

  private calcAge(birthDate: string): string {
    const birth = new Date(birthDate)
    const now = new Date()
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    if (months < 1) return `${Math.ceil((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))}天`
    if (months < 12) return `${months}个月`
    return `${Math.floor(months / 12)}岁${months % 12}个月`
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/memory-body/aggregator/memoryAggregator.ts
git commit -m "feat(memory): create MemoryAggregator"
```

---

### Task 6: 创建AI注入器

**Files:**
- Create: `src/memory-body/injectors/aiMemoryInjector.ts`

- [ ] **Step 1: 创建 AiMemoryInjector**

```typescript
import { MemoryAggregator } from '../aggregator/memoryAggregator'
import type { UnifiedPetMemory, MemoryFragment } from '../types/memoryBodyTypes'

interface PetBasicInfo {
  id: string
  name: string
  species: string
  breed: string
  gender: string
  birthDate?: string
}

export class AiMemoryInjector {
  private aggregator: MemoryAggregator
  private userId: string

  constructor(userId: string) {
    this.userId = userId
    this.aggregator = new MemoryAggregator(userId)
  }

  /**
   * 构建 AI 对话的 system prompt 片段
   * 约 400-600 tokens
   */
  buildSystemPrompt(pet: PetBasicInfo): string {
    const { systemPrompt } = this.aggregator.getCompactContext(pet)
    return systemPrompt
  }

  /**
   * 构建包含记忆片段的上下文
   */
  buildContext(pet: PetBasicInfo, _maxTokens: number = 600): { systemPrompt: string; fragments: MemoryFragment[] } {
    return this.aggregator.getCompactContext(pet)
  }

  /**
   * 为特定用户问题获取相关记忆
   */
  getRelevantForQuery(pet: PetBasicInfo, userQuery: string): MemoryFragment[] {
    return this.aggregator.getRelevantMemories(pet, userQuery)
  }

  /**
   * 获取完整的宠物记忆画像
   */
  getPetMemory(pet: PetBasicInfo): UnifiedPetMemory {
    return this.aggregator.getPetMemory(pet)
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/memory-body/injectors/aiMemoryInjector.ts
git commit -m "feat(memory): create AiMemoryInjector"
```

---

### Task 7: 集成到现有系统

**Files:**
- Modify: `src/memory-body/index.ts` — 追加导出
- Modify: `src/services/chatService.ts` — 追加AI注入调用

- [ ] **Step 1: 更新 index.ts 导出**

在 `memory-body/index.ts` 末尾追加：

```typescript
export { DietMemoryAdapter } from './adapters/dietMemoryAdapter'
export { BehaviorAdapter } from './adapters/behaviorAdapter'
export { MilestoneAdapter } from './adapters/milestoneAdapter'
export { MemoryAggregator } from './aggregator/memoryAggregator'
export { AiMemoryInjector } from './injectors/aiMemoryInjector'
```

- [ ] **Step 2: 集成到 chatService.ts**

读取 `chatService.ts`，找到发送 AI 请求的位置（构建 prompt/message 的地方），在发送前追加：

```typescript
// 在 chatService.ts 顶部导入
import { AiMemoryInjector } from '../memory-body/injectors/aiMemoryInjector'

// 在发送 AI 请求前（已获取到 currentPet 的位置）
if (userId && currentPet) {
  const injector = new AiMemoryInjector(userId)
  const memoryContext = injector.buildSystemPrompt({
    id: currentPet.id,
    name: currentPet.name,
    species: currentPet.species,
    breed: currentPet.breed || '',
    gender: currentPet.gender || '',
    birthDate: currentPet.birthDate,
  })
  // 追加 memoryContext 到 system prompt
  systemPrompt = systemPrompt ? `${systemPrompt}\n${memoryContext}` : memoryContext
}
```

- [ ] **Step 3: 提交**

```bash
git add src/memory-body/index.ts src/services/chatService.ts
git commit -m "feat(memory): integrate memory injector into chat service"
```

---

### Task 8: 单元测试

**Files:**
- Create: `src/memory-body/__tests__/dietMemoryAdapter.test.ts`
- Create: `src/memory-body/__tests__/behaviorAdapter.test.ts`
- Create: `src/memory-body/__tests__/milestoneAdapter.test.ts`
- Create: `src/memory-body/__tests__/memoryAggregator.test.ts`

- [ ] **Step 1: DietMemoryAdapter 测试**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { DietMemoryAdapter } from '../adapters/dietMemoryAdapter'

describe('DietMemoryAdapter', () => {
  let adapter: DietMemoryAdapter

  beforeEach(() => {
    adapter = new DietMemoryAdapter('test-user')
    adapter.clear()
  })

  it('记录喂食后能查询偏好', () => {
    adapter.recordFeeding('pet-1', '三文鱼', { date: '2026-07-30', reaction: 'good' })
    const pref = adapter.getFoodPreference('pet-1', '三文鱼')
    expect(pref).not.toBeNull()
    expect(pref!.totalFeedings).toBe(1)
  })

  it('多次喂食后更新偏好', () => {
    adapter.recordFeeding('pet-1', '鸡肉', { date: '2026-07-28', reaction: 'good' })
    adapter.recordFeeding('pet-1', '鸡肉', { date: '2026-07-29', reaction: 'good' })
    adapter.recordFeeding('pet-1', '鸡肉', { date: '2026-07-30', reaction: 'refused' })
    const pref = adapter.getFoodPreference('pet-1', '鸡肉')
    expect(pref!.totalFeedings).toBe(3)
    expect(pref!.preference).toBe('dislikes')
  })

  it('获取饮食画像', () => {
    adapter.recordFeeding('pet-1', '鸡胸肉', { date: '2026-07-30', reaction: 'good' })
    const profile = adapter.getDietProfile('pet-1')
    expect(profile.safeFoods).toContain('鸡胸肉')
  })
})
```

- [ ] **Step 2: BehaviorAdapter 测试**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { BehaviorAdapter } from '../adapters/behaviorAdapter'

describe('BehaviorAdapter', () => {
  let adapter: BehaviorAdapter

  beforeEach(() => {
    adapter = new BehaviorAdapter('test-user')
    adapter.clear()
  })

  it('记录观察后可构建基线', () => {
    adapter.recordObservation('pet-1', {
      date: '2026-07-28',
      category: 'energy',
      description: '非常活跃，跑跳不停',
      severity: 'normal',
    })
    adapter.recordObservation('pet-1', {
      date: '2026-07-29',
      category: 'energy',
      description: '兴奋好动',
      severity: 'normal',
    })
    adapter.recordObservation('pet-1', {
      date: '2026-07-30',
      category: 'energy',
      description: '活跃',
      severity: 'normal',
    })
    const baseline = adapter.buildBaseline('pet-1')
    expect(baseline.personalityTraits.length).toBeGreaterThan(0)
  })

  it('检测异常行为', () => {
    adapter.recordObservation('pet-1', {
      date: '2026-07-30',
      category: 'appetite_behavior',
      description: '完全不吃东西',
      severity: 'concern',
    })
    const anomalies = adapter.detectAnomalies('pet-1')
    expect(anomalies.length).toBe(1)
  })
})
```

- [ ] **Step 3: MilestoneAdapter 测试**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { MilestoneAdapter } from '../adapters/milestoneAdapter'

describe('MilestoneAdapter', () => {
  let adapter: MilestoneAdapter

  beforeEach(() => {
    adapter = new MilestoneAdapter('test-user')
    adapter.clear()
  })

  it('添加和查询里程碑', () => {
    adapter.addMilestone('pet-1', {
      petId: 'pet-1',
      type: 'adoption',
      title: '到家啦',
      date: '2026-01-15',
      icon: '🏠',
    })
    const timeline = adapter.getTimeline('pet-1')
    expect(timeline.length).toBe(1)
    expect(timeline[0].title).toBe('到家啦')
  })

  it('syncFromCheckins 自动添加首次打卡', () => {
    adapter.syncFromCheckins('pet-1', 1)
    const timeline = adapter.getTimeline('pet-1')
    expect(timeline.some(m => m.type === 'first_checkin')).toBe(true)
  })
})
```

- [ ] **Step 4: MemoryAggregator 测试**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryAggregator } from '../aggregator/memoryAggregator'

describe('MemoryAggregator', () => {
  let aggregator: MemoryAggregator

  beforeEach(() => {
    aggregator = new MemoryAggregator('test-user')
  })

  it('获取宠物记忆画像', () => {
    const pet = { id: 'pet-1', name: '小橘', species: 'cat', breed: '橘猫', gender: 'female', birthDate: '2023-03-15' }
    const memory = aggregator.getPetMemory(pet)
    expect(memory.profile.name).toBe('小橘')
    expect(memory.profile.species).toBe('cat')
  })

  it('获取精简上下文', () => {
    const pet = { id: 'pet-1', name: '小橘', species: 'cat', breed: '橘猫', gender: 'female' }
    const ctx = aggregator.getCompactContext(pet)
    expect(ctx.systemPrompt).toContain('小橘')
  })
})
```

- [ ] **Step 5: 运行测试并提交**

```bash
npx vitest run src/memory-body/__tests__/
```

```bash
git add src/memory-body/__tests__/
git commit -m "test(memory): add unit tests for diet/behavior/milestone/aggregator"
```

---

## 执行方式

**子Agent驱动（推荐）** — 每个 Task 分配一个独立子 Agent，完成一个审查一个再下一个。

**或内联执行** — 在当前会话中按 Task 顺序执行。

请选择执行方式。
