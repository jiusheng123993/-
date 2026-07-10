# M1 MemoryProfile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的 MemoryProfile Schema、校验逻辑、合并策略，作为记忆系统的核心数据结构

**Architecture:** 基于设计文档 `2026-06-01-memory-and-self-evolving-agent-design.md` 的 M1 模块，所有字段可选，支持用户手动编辑和 AI 自动更新

**Tech Stack:** TypeScript, Zod（校验）, 现有 memoryTypes.ts

---

## 文件结构

```
src/memory/
├── memoryProfile.ts          # 新建：完整 Schema + 校验 + 合并
├── memoryProfile.test.ts     # 新建：测试
├── memoryTypes.ts            # 修改：扩展类型定义
```

---

### Task 1: 扩展 memoryTypes.ts 添加完整 Schema

**Files:**
- Modify: `src/memory/memoryTypes.ts`

- [ ] **Step 1: 添加 PersonalityTrait 等类型定义**

在 `memoryTypes.ts` 末尾添加：

```typescript
export type PersonalityTrait =
  | 'MBTI_INTJ' | 'MBTI_ENTP' | 'MBTI_INFP' | 'MBTI_ESFJ'
  | 'MBTI_ISTJ' | 'MBTI_ENFP' | 'MBTI_ISFJ' | 'MBTI_ESTP'
  | 'MBTI_INTJ' | 'MBTI_ENTJ' | 'MBTI_ISTP' | 'MBTI_ESFP'
  | 'MBTI_INFJ' | 'MBTI_ENFJ' | 'MBTI_ISFP' | 'MBTI_ESTJ'
  | 'unknown'

export type WorkStyle = 'independent' | 'collaborative' | 'mixed'
export type EnergyPeak = 'morning' | 'afternoon' | 'evening' | 'night_owl' | 'flexible'
export type MotivationStyle = 'achievement' | 'growth' | 'connection' | 'autonomy'
export type FeedbackStyle = 'direct' | 'gentle' | 'humorous' | 'data_driven'
export type StressResponse = 'push_harder' | 'need_break' | 'seek_help' | 'avoid'
export type PlanningStyle = 'structured' | 'flexible' | 'minimal' | 'adaptive'
export type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed'
export type SleepPattern = 'early_bird' | 'night_owl' | 'irregular' | 'stable'
export type BreakPreference = 'pomodoro_25' | 'pomodoro_50' | 'flexible' | 'long_deep'
export type EncouragementStyle = 'cheerleader' | 'coach' | 'philosopher' | 'silent_partner'
export type ReminderFrequency = 'high' | 'medium' | 'low' | 'none'
export type DetailLevel = 'brief' | 'moderate' | 'detailed'
export type LanguageStyle = 'casual' | 'formal' | 'academic' | 'playful'
export type MoodTrend = 'improving' | 'stable' | 'declining' | 'volatile'
export type MotivationLevel = 'high' | 'medium' | 'low' | 'burnout_risk'
export type AgeGroup = 'teen' | 'young_adult' | 'adult' | 'middle_age' | 'senior'

export type ProfileSource = 'manual' | 'conversation' | 'behavior'

export interface MemoryProfileIdentity {
  nickname?: string
  ageGroup?: AgeGroup
  occupation?: string
  currentRole?: string
  organization?: string
  lifeStage?: string
}

export interface MemoryProfilePersonality {
  mbtiTendency?: PersonalityTrait
  workStyle?: WorkStyle
  planningStyle?: PlanningStyle
  motivationStyle?: MotivationStyle
  feedbackStyle?: FeedbackStyle
  stressResponse?: StressResponse
  selfDescription?: string
}

export interface MemoryProfileRhythm {
  energyPeak?: EnergyPeak
  typicalStudyHours?: string
  sleepPattern?: SleepPattern
  preferredSessionLength?: number
  breakPreference?: BreakPreference
  weeklyActiveDays?: number
}

export interface MemoryProfileGoals {
  primaryGoal?: string
  secondaryGoals?: string[]
  targetExams?: string[]
  targetDate?: string
  careerDirection?: string
}

export interface MemoryProfilePreferences {
  encouragementStyle?: EncouragementStyle
  reminderFrequency?: ReminderFrequency
  detailLevel?: DetailLevel
  languageStyle?: LanguageStyle
}

export interface MemoryProfileBoundaries {
  tabooTopics?: string[]
  triggerWords?: string[]
  dontMention?: string[]
  sensitiveAreas?: string[]
}

export interface MemoryProfileLearning {
  strongSubjects?: string[]
  weakSubjects?: string[]
  learningStyle?: LearningStyle
  commonBlockers?: string[]
  effectiveStrategies?: string[]
}

export interface MemoryProfileEmotional {
  currentMoodTrend?: MoodTrend
  motivationLevel?: MotivationLevel
  supportNeeds?: string[]
  recentWins?: string[]
}

export interface MemoryProfileMeta {
  createdAt: string
  updatedAt: string
  lastReflectionAt?: string
  totalEventsProcessed: number
  sourceBreakdown: {
    manual: number
    conversation: number
    behavior: number
  }
}

export interface MemoryProfile {
  version: number
  scope: MemoryScope
  identity: MemoryProfileIdentity
  personality: MemoryProfilePersonality
  rhythm: MemoryProfileRhythm
  goals: MemoryProfileGoals
  preferences: MemoryProfilePreferences
  boundaries: MemoryProfileBoundaries
  learning: MemoryProfileLearning
  emotional: MemoryProfileEmotional
  meta: MemoryProfileMeta
}
```

- [ ] **Step 2: 运行 TypeScript 编译验证**

Run: `npm run build`
Expected: 编译成功

- [ ] **Step 3: Commit**

```bash
git add src/memory/memoryTypes.ts
git commit -m "feat(memory): add complete MemoryProfile schema types"
```

---

### Task 2: 创建 memoryProfile.ts 校验与合并逻辑

**Files:**
- Create: `src/memory/memoryProfile.ts`
- Test: `src/memory/memoryProfile.test.ts`

- [ ] **Step 1: 创建 memoryProfile.ts 基础结构**

```typescript
import type {
  MemoryProfile,
  MemoryScope,
  ProfileSource,
  PersonalityTrait,
  WorkStyle,
  EnergyPeak,
  MotivationStyle,
  FeedbackStyle,
  StressResponse,
  PlanningStyle,
  LearningStyle,
  SleepPattern,
  BreakPreference,
  EncouragementStyle,
  ReminderFrequency,
  DetailLevel,
  LanguageStyle,
  MoodTrend,
  MotivationLevel,
  AgeGroup,
} from './memoryTypes'

export const PROFILE_VERSION = 1

export function createEmptyProfile(scope: MemoryScope): MemoryProfile {
  const now = new Date().toISOString()
  return {
    version: PROFILE_VERSION,
    scope,
    identity: {},
    personality: {},
    rhythm: {},
    goals: {},
    preferences: {},
    boundaries: {},
    learning: {},
    emotional: {},
    meta: {
      createdAt: now,
      updatedAt: now,
      totalEventsProcessed: 0,
      sourceBreakdown: {
        manual: 0,
        conversation: 0,
        behavior: 0,
      },
    },
  }
}

export function validateProfile(profile: unknown): profile is MemoryProfile {
  if (!profile || typeof profile !== 'object') return false
  const p = profile as Record<string, unknown>
  if (typeof p.version !== 'number') return false
  if (!p.scope || typeof p.scope !== 'object') return false
  return true
}

export function mergeProfiles(
  existing: MemoryProfile,
  updates: Partial<MemoryProfile>,
  source: ProfileSource
): MemoryProfile {
  const now = new Date().toISOString()
  const merged = { ...existing }
  
  const sections = ['identity', 'personality', 'rhythm', 'goals', 'preferences', 'boundaries', 'learning', 'emotional'] as const
  
  for (const section of sections) {
    if (updates[section]) {
      merged[section] = { ...existing[section], ...updates[section] }
    }
  }
  
  merged.meta = {
    ...existing.meta,
    updatedAt: now,
    totalEventsProcessed: existing.meta.totalEventsProcessed + 1,
    sourceBreakdown: {
      ...existing.meta.sourceBreakdown,
      [source]: existing.meta.sourceBreakdown[source] + 1,
    },
  }
  
  return merged
}

export function getProfileSummary(profile: MemoryProfile): string {
  const parts: string[] = []
  
  if (profile.identity.nickname) {
    parts.push(`昵称: ${profile.identity.nickname}`)
  }
  if (profile.personality.mbtiTendency) {
    parts.push(`MBTI: ${profile.personality.mbtiTendency}`)
  }
  if (profile.goals.primaryGoal) {
    parts.push(`目标: ${profile.goals.primaryGoal}`)
  }
  if (profile.rhythm.energyPeak) {
    parts.push(`高效时段: ${profile.rhythm.energyPeak}`)
  }
  if (profile.emotional.motivationLevel) {
    parts.push(`动力: ${profile.emotional.motivationLevel}`)
  }
  
  return parts.join(' | ') || '暂无画像信息'
}

export function compressProfileToPrompt(profile: MemoryProfile, maxTokens = 400): string {
  const summary = getProfileSummary(profile)
  const charCount = Math.floor(maxTokens * 0.25)
  return summary.slice(0, charCount)
}
```

- [ ] **Step 2: 创建 memoryProfile.test.ts**

```typescript
import { describe, it, expect } from 'vitest'
import { createEmptyProfile, validateProfile, mergeProfiles, getProfileSummary, compressProfileToPrompt } from './memoryProfile'

const testScope = { userId: 'user-1', projectId: 'test' }

describe('MemoryProfile', () => {
  describe('createEmptyProfile', () => {
    it('should create profile with default values', () => {
      const profile = createEmptyProfile(testScope)
      
      expect(profile.version).toBe(1)
      expect(profile.scope).toEqual(testScope)
      expect(profile.identity).toEqual({})
      expect(profile.meta.totalEventsProcessed).toBe(0)
      expect(profile.meta.sourceBreakdown).toEqual({ manual: 0, conversation: 0, behavior: 0 })
    })
  })

  describe('validateProfile', () => {
    it('should return true for valid profile', () => {
      const profile = createEmptyProfile(testScope)
      expect(validateProfile(profile)).toBe(true)
    })

    it('should return false for null', () => {
      expect(validateProfile(null)).toBe(false)
    })

    it('should return false for missing version', () => {
      expect(validateProfile({ scope: testScope })).toBe(false)
    })
  })

  describe('mergeProfiles', () => {
    it('should merge identity updates', () => {
      const existing = createEmptyProfile(testScope)
      const updates = { identity: { nickname: '小明' } }
      
      const merged = mergeProfiles(existing, updates, 'manual')
      
      expect(merged.identity.nickname).toBe('小明')
      expect(merged.meta.sourceBreakdown.manual).toBe(1)
    })

    it('should preserve existing data when merging', () => {
      const existing: MemoryProfile = {
        ...createEmptyProfile(testScope),
        identity: { nickname: '小红' },
        personality: { mbtiTendency: 'MBTI_INTJ' },
      }
      const updates = { identity: { occupation: '学生' } }
      
      const merged = mergeProfiles(existing, updates, 'manual')
      
      expect(merged.identity.nickname).toBe('小红')
      expect(merged.identity.occupation).toBe('学生')
      expect(merged.personality.mbtiTendency).toBe('MBTI_INTJ')
    })
  })

  describe('getProfileSummary', () => {
    it('should return empty message for blank profile', () => {
      const profile = createEmptyProfile(testScope)
      expect(getProfileSummary(profile)).toBe('暂无画像信息')
    })

    it('should include filled fields', () => {
      const profile: MemoryProfile = {
        ...createEmptyProfile(testScope),
        identity: { nickname: '测试' },
        personality: { mbtiTendency: 'MBTI_ENFP' },
        goals: { primaryGoal: '考研' },
        rhythm: { energyPeak: 'morning' },
        emotional: { motivationLevel: 'high' },
      }
      
      const summary = getProfileSummary(profile)
      expect(summary).toContain('测试')
      expect(summary).toContain('MBTI_ENFP')
      expect(summary).toContain('考研')
    })
  })

  describe('compressProfileToPrompt', () => {
    it('should truncate long profiles', () => {
      const profile: MemoryProfile = {
        ...createEmptyProfile(testScope),
        identity: { nickname: 'A'.repeat(500) },
        personality: { mbtiTendency: 'MBTI_INTJ', selfDescription: 'B'.repeat(500) },
      }
      
      const compressed = compressProfileToPrompt(profile, 100)
      expect(compressed.length).toBeLessThan(200)
    })
  })
})
```

- [ ] **Step 3: 运行测试验证**

Run: `npm test -- --run src/memory/memoryProfile.test.ts`
Expected: 全部测试通过

- [ ] **Step 4: Commit**

```bash
git add src/memory/memoryProfile.ts src/memory/memoryProfile.test.ts
git commit -m "feat(memory): add MemoryProfile validation and merge logic"
```

---

### Task 3: 集成到现有 memoryStore

**Files:**
- Modify: `src/memory/memoryStore.ts`

- [ ] **Step 1: 导入并使用新的 MemoryProfile**

在 memoryStore.ts 中添加：

```typescript
import { createEmptyProfile, validateProfile, mergeProfiles, type MemoryProfile } from './memoryProfile'
```

- [ ] **Step 2: 更新 deriveMemoryProfile 函数**

将现有的 deriveMemoryProfile 改为使用新的 MemoryProfile 类型

- [ ] **Step 3: 运行测试验证**

Run: `npm test -- --run src/memory/`
Expected: 全部测试通过

- [ ] **Step 4: Commit**

```bash
git add src/memory/memoryStore.ts
git commit -m "refactor(memory): integrate new MemoryProfile schema"
```

---

### Task 4: 最终验证

**Files:**
- No file changes

- [ ] **Step 1: 运行 Lint**

Run: `npm run lint`
Expected: 通过

- [ ] **Step 2: 运行完整测试**

Run: `npm test -- --run`
Expected: 全部通过

- [ ] **Step 3: 运行构建**

Run: `npm run build`
Expected: 成功

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(memory): complete M1 MemoryProfile implementation"
```

---

## Plan Complete

**M1 MemoryProfile 完成，包含：**
- 完整的 MemoryProfile Schema（identity, personality, rhythm, goals, preferences, boundaries, learning, emotional, meta）
- 校验函数 validateProfile
- 合并函数 mergeProfiles
- 摘要生成 getProfileSummary
- Prompt 压缩 compressProfileToPrompt
- 完整测试覆盖

**下一步：** M2 MemoryEvents（事件库 CRUD + 检索）
