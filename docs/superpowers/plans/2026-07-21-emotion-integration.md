# 情绪底层融入宠物场景 - 重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将情绪能力从独立模块重构为融入宠物场景的底层感知能力，修复触发逻辑缺陷，实现 PRD 4.8 要求的三个场景（宠物离世悲伤陪伴、宠物生病焦虑干预、新手养宠焦虑缓解），并确保情绪能力隐形化。

**Architecture:** 重构现有 emotion 引擎和 store，修复数据源缺陷（连续异常天数、用户打开频率、时间窗口计数），将 GriefCompanion 从聊天式改为 PRD 要求的四步流程（命名→书写→连接→收尾），将 EmotionResponseCard 从独立卡片改为融入首页打卡区域的内联提示，新增行为信号采集服务统一管理触发条件检测。

**Tech Stack:** Taro 3.x + React + TypeScript + Zustand + Vitest

---

## 文件结构

| 操作 | 文件路径 | 职责 |
|------|---------|------|
| 修改 | `src/engines/emotion.ts` | 重构：修复检测逻辑，新增四步流程配置 |
| 修改 | `src/stores/emotionStore.ts` | 重构：修复数据源，新增行为信号采集 |
| 修改 | `src/utils/usageTracking.ts` | 重构：添加时间窗口计数，添加用户打开频率统计 |
| 修改 | `src/components/GriefCompanion.tsx` | 重构：从聊天式改为四步流程 |
| 修改 | `src/components/GriefCompanion.scss` | 适配四步流程样式 |
| 修改 | `src/components/EmotionResponseCard.tsx` | 重构：从独立卡片改为内联提示 |
| 修改 | `src/components/EmotionResponseCard.scss` | 适配内联提示样式 |
| 修改 | `src/pages/index/index.tsx` | 修复触发逻辑，适配内联提示 |
| 修改 | `src/pages/pet-profile/index.tsx` | 适配 GriefCompanion 四步流程 |
| 修改 | `src/services/checkinService.ts` | 新增连续异常天数计算 |
| 修改 | `src/stores/checkinStore.ts` | 新增 consecutiveAnomalyDays 状态 |
| 修改 | `src/types/emotionTypes.ts` | 新增四步流程类型 |
| 修改 | `src/engines/__tests__/emotion.test.ts` | 更新测试 |
| 修改 | `src/stores/__tests__/emotionStore.test.ts` | 更新测试 |
| 修改 | `src/utils/__tests__/usageTracking.test.ts` | 更新测试 |
| 修改 | `src/components/__tests__/GriefCompanion.test.tsx` | 更新测试 |
| 修改 | `src/components/__tests__/EmotionResponseCard.test.tsx` | 更新测试 |

---

### Task 1: 修复 usageTracking - 添加时间窗口计数和用户打开频率

**Files:**
- Modify: `src/utils/usageTracking.ts`
- Test: `src/utils/__tests__/usageTracking.test.ts`

**问题：** 当前 `getRecentFoodQueryCount` / `getRecentSymptomCheckCount` 返回累计值而非近期值；缺少用户打开频率统计。

- [ ] **Step 1: 写失败测试**

```typescript
// src/utils/__tests__/usageTracking.test.ts - 在现有测试文件末尾追加

describe('time-windowed counting', () => {
  beforeEach(() => {
    mockStorage = {}
  })

  it('getRecentFoodQueryCount returns count within 7-day window', () => {
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000
    mockStorage['xhh_food_query_timestamps'] = JSON.stringify([
      eightDaysAgo,
      sevenDaysAgo + 1000,
      now,
    ])
    expect(getRecentFoodQueryCount()).toBe(2)
  })

  it('getRecentSymptomCheckCount returns count within 7-day window', () => {
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
    mockStorage['xhh_symptom_check_timestamps'] = JSON.stringify([
      sevenDaysAgo + 1000,
      now,
    ])
    expect(getRecentSymptomCheckCount()).toBe(2)
  })

  it('incrementFoodQueryCount appends timestamp and cleans up old entries', () => {
    const now = Date.now()
    const oldTimestamp = now - 30 * 24 * 60 * 60 * 1000
    mockStorage['xhh_food_query_timestamps'] = JSON.stringify([oldTimestamp])
    incrementFoodQueryCount()
    const stored = JSON.parse(mockStorage['xhh_food_query_timestamps'])
    expect(stored).toHaveLength(1)
    expect(stored[0]).toBeGreaterThan(oldTimestamp)
  })
})

describe('user open frequency', () => {
  beforeEach(() => {
    mockStorage = {}
  })

  it('recordAppOpen records timestamp', () => {
    recordAppOpen()
    const stored = JSON.parse(mockStorage['xhh_app_open_timestamps'])
    expect(stored).toHaveLength(1)
  })

  it('getRecentOpenCount returns count within 3-day window', () => {
    const now = Date.now()
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000
    const fourDaysAgo = now - 4 * 24 * 60 * 60 * 1000
    mockStorage['xhh_app_open_timestamps'] = JSON.stringify([
      fourDaysAgo,
      threeDaysAgo + 1000,
      now,
    ])
    expect(getRecentOpenCount()).toBe(2)
  })

  it('getRecentOpenCount returns 0 when no data', () => {
    expect(getRecentOpenCount()).toBe(0)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/utils/__tests__/usageTracking.test.ts`
Expected: FAIL - `getRecentFoodQueryCount` returns 3 (total) not 2 (windowed), `recordAppOpen` / `getRecentOpenCount` not defined

- [ ] **Step 3: 实现 usageTracking 改动**

```typescript
// src/utils/usageTracking.ts - 完整替换

import Taro from '@tarojs/taro'

const KEYS = {
  FIRST_SEEN: 'xhh_first_seen_at',
  FOOD_QUERY_TIMESTAMPS: 'xhh_food_query_timestamps',
  SYMPTOM_CHECK_TIMESTAMPS: 'xhh_symptom_check_timestamps',
  APP_OPEN_TIMESTAMPS: 'xhh_app_open_timestamps',
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

function getTimestamps(key: string): number[] {
  const raw = Taro.getStorageSync(key)
  if (!raw) return []
  try {
    return JSON.parse(raw as string)
  } catch {
    return []
  }
}

function saveTimestamps(key: string, timestamps: number[]): void {
  Taro.setStorageSync(key, JSON.stringify(timestamps))
}

function filterRecent(timestamps: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs
  return timestamps.filter(t => t > cutoff)
}

export function incrementFoodQueryCount(): void {
  const timestamps = filterRecent(getTimestamps(KEYS.FOOD_QUERY_TIMESTAMPS), SEVEN_DAYS_MS)
  timestamps.push(Date.now())
  saveTimestamps(KEYS.FOOD_QUERY_TIMESTAMPS, timestamps)
}

export function incrementSymptomCheckCount(): void {
  const timestamps = filterRecent(getTimestamps(KEYS.SYMPTOM_CHECK_TIMESTAMPS), SEVEN_DAYS_MS)
  timestamps.push(Date.now())
  saveTimestamps(KEYS.SYMPTOM_CHECK_TIMESTAMPS, timestamps)
}

export function recordAppOpen(): void {
  const timestamps = filterRecent(getTimestamps(KEYS.APP_OPEN_TIMESTAMPS), THREE_DAYS_MS)
  timestamps.push(Date.now())
  saveTimestamps(KEYS.APP_OPEN_TIMESTAMPS, timestamps)
}

export function isNewUser(): boolean {
  const firstSeen = Taro.getStorageSync(KEYS.FIRST_SEEN)
  if (!firstSeen) {
    Taro.setStorageSync(KEYS.FIRST_SEEN, new Date().toISOString())
    return true
  }
  const daysSince = (Date.now() - new Date(firstSeen as string).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince <= 7
}

export function getRecentFoodQueryCount(): number {
  return filterRecent(getTimestamps(KEYS.FOOD_QUERY_TIMESTAMPS), SEVEN_DAYS_MS).length
}

export function getRecentSymptomCheckCount(): number {
  return filterRecent(getTimestamps(KEYS.SYMPTOM_CHECK_TIMESTAMPS), SEVEN_DAYS_MS).length
}

export function getRecentOpenCount(): number {
  return filterRecent(getTimestamps(KEYS.APP_OPEN_TIMESTAMPS), THREE_DAYS_MS).length
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/utils/__tests__/usageTracking.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/utils/usageTracking.ts src/utils/__tests__/usageTracking.test.ts
git commit -m "fix(usageTracking): add time-windowed counting and app open frequency tracking"
```

---

### Task 2: 新增连续异常天数计算

**Files:**
- Modify: `src/services/checkinService.ts`
- Modify: `src/stores/checkinStore.ts`

**问题：** 当前没有真正的"连续异常打卡天数"检测逻辑，首页传给 checkSickAnxiety 的是单日异常项数量。

- [ ] **Step 1: 在 checkinService 中新增 calculateConsecutiveAnomalyDays**

```typescript
// src/services/checkinService.ts - 在文件末尾追加

export function calculateConsecutiveAnomalyDays(
  entries: Array<{ date: string; hasAnomaly: boolean }>,
): number {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  let count = 0
  for (const entry of sorted) {
    if (entry.hasAnomaly) {
      count++
    } else {
      break
    }
  }
  return count
}
```

- [ ] **Step 2: 在 checkinStore 中新增 consecutiveAnomalyDays 状态**

在 `checkinStore.ts` 的 state interface 中新增：

```typescript
consecutiveAnomalyDays: number
```

在 store 初始值中新增：

```typescript
consecutiveAnomalyDays: 0,
```

在 `fetchStats` action 中，获取 stats 后计算连续异常天数：

```typescript
// 在 fetchStats 的成功回调中，计算后 set
const days = calculateConsecutiveAnomalyDays(recentEntries)
set({ stats, consecutiveAnomalyDays: days })
```

注意：需要从 checkinService 导入 `calculateConsecutiveAnomalyDays`，并在 fetchStats 中获取最近 7 天的打卡记录来计算。如果 checkinService 的 fetchStats 已经返回了 recentEntries，直接使用；否则需要新增查询。

- [ ] **Step 3: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: 提交**

```bash
git add src/services/checkinService.ts src/stores/checkinStore.ts
git commit -m "feat(checkin): add consecutive anomaly days calculation"
```

---

### Task 3: 重构 emotion 引擎 - 修复检测逻辑和新增四步流程配置

**Files:**
- Modify: `src/engines/emotion.ts`
- Modify: `src/types/emotionTypes.ts`
- Test: `src/engines/__tests__/emotion.test.ts`

**问题：** 检测逻辑中 `userOpenFrequency >= 5` 条件过于严格（首页硬编码传 0）；缺少四步流程配置。

- [ ] **Step 1: 在 emotionTypes.ts 中新增四步流程类型**

```typescript
// src/types/emotionTypes.ts - 追加

export type GriefStep = 'name' | 'write' | 'connect' | 'close'

export interface GriefStepConfig {
  step: GriefStep
  title: string
  prompt: string
  options?: string[]
  placeholder?: string
}

export interface GriefFlowState {
  currentStep: GriefStep
  selectedFeeling: string
  userMessage: string
  connectedCount: number
}
```

- [ ] **Step 2: 重构 emotion.ts 中的检测逻辑**

修改 `detectSickAnxiety`：降低 userOpenFrequency 阈值，因为有了真实的打开频率数据后 3 天内打开 3 次即可触发：

```typescript
export function detectSickAnxiety(context: SickAnxietyContext): boolean {
  return context.consecutiveAnomalyDays >= 3 && context.userOpenFrequency >= 3
}
```

新增四步流程配置：

```typescript
export const GRIEF_FLOW_STEPS: GriefStepConfig[] = [
  {
    step: 'name',
    title: '你现在是什么感觉？',
    prompt: '给这种感觉一个名字，不需要准确',
    options: ['空虚', '愤怒', '自责', '平静', '想念'],
  },
  {
    step: 'write',
    title: '想对TA说些什么？',
    prompt: '任何话都可以，这里只有你',
    placeholder: '想对TA说的话...',
  },
  {
    step: 'connect',
    title: '你不是一个人',
    prompt: '',
  },
  {
    step: 'close',
    title: '',
    prompt: '',
  },
]

export function getGriefStepMessage(step: GriefStep, petName: string, selectedFeeling?: string): string {
  switch (step) {
    case 'name':
      return `💜 听说了这个消息，很难过，但你现在不需要坚强`
    case 'write':
      return `感受到${selectedFeeling || '这种情绪'}很正常，想说说吗？`
    case 'connect':
      return `过去1个月，有2,847人也经历了同样的失去。你不是一个人。`
    case 'close':
      return `${petName}有你这样的家人，是${petName}的幸运。`
  }
}
```

- [ ] **Step 3: 更新 emotion.test.ts**

更新 `detectSickAnxiety` 测试中的阈值断言：

```typescript
it('detects sick anxiety when consecutiveAnomalyDays >= 3 and userOpenFrequency >= 3', () => {
  expect(detectSickAnxiety({
    petId: 'p1', petName: '咪咪', consecutiveAnomalyDays: 3,
    userOpenFrequency: 3, lastAnomalyItems: ['呕吐'],
    previousRecoveryCount: 0,
  })).toBe(true)
})

it('does not detect sick anxiety when userOpenFrequency < 3', () => {
  expect(detectSickAnxiety({
    petId: 'p1', petName: '咪咪', consecutiveAnomalyDays: 3,
    userOpenFrequency: 2, lastAnomalyItems: ['呕吐'],
    previousRecoveryCount: 0,
  })).toBe(false)
})
```

新增四步流程测试：

```typescript
describe('GriefFlowSteps', () => {
  it('has 4 steps in correct order', () => {
    expect(GRIEF_FLOW_STEPS).toHaveLength(4)
    expect(GRIEF_FLOW_STEPS.map(s => s.step)).toEqual(['name', 'write', 'connect', 'close'])
  })

  it('name step has options', () => {
    expect(GRIEF_FLOW_STEPS[0].options).toBeDefined()
    expect(GRIEF_FLOW_STEPS[0].options!.length).toBeGreaterThan(0)
  })

  it('write step has placeholder', () => {
    expect(GRIEF_FLOW_STEPS[1].placeholder).toBeDefined()
  })
})

describe('getGriefStepMessage', () => {
  it('returns opening message for name step', () => {
    expect(getGriefStepMessage('name', '咪咪')).toContain('不需要坚强')
  })

  it('returns feeling-based message for write step', () => {
    expect(getGriefStepMessage('write', '咪咪', '空虚')).toContain('空虚')
  })

  it('returns connection message for connect step', () => {
    expect(getGriefStepMessage('connect', '咪咪')).toContain('2,847')
  })

  it('returns closing message for close step', () => {
    expect(getGriefStepMessage('close', '咪咪')).toContain('咪咪')
  })
})
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/engines/__tests__/emotion.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/engines/emotion.ts src/types/emotionTypes.ts src/engines/__tests__/emotion.test.ts
git commit -m "refactor(emotion): fix detection logic and add grief four-step flow"
```

---

### Task 4: 重构 GriefCompanion - 从聊天式改为四步流程

**Files:**
- Modify: `src/components/GriefCompanion.tsx`
- Modify: `src/components/GriefCompanion.scss`
- Test: `src/components/__tests__/GriefCompanion.test.tsx`

**问题：** 当前 GriefCompanion 是聊天式交互，PRD 要求"命名→书写→连接→收尾"四步流程。

- [ ] **Step 1: 重写 GriefCompanion.tsx**

```tsx
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { useState, useCallback } from 'react'
import {
  GRIEF_FLOW_STEPS,
  getGriefStepMessage,
  getDisclaimer,
} from '../engines/emotion'
import type { GriefStep, GriefFlowState } from '../types/emotionTypes'
import './GriefCompanion.scss'

interface GriefCompanionProps {
  petId: string
  petName: string
  petAvatar?: string
  species: 'dog' | 'cat'
  deceasedDate: string
  onComplete: () => void
}

const INITIAL_STATE: GriefFlowState = {
  currentStep: 'name',
  selectedFeeling: '',
  userMessage: '',
  connectedCount: 2847,
}

export default function GriefCompanion({
  petName,
  species,
  deceasedDate,
  onComplete,
}: GriefCompanionProps) {
  const [flowState, setFlowState] = useState<GriefFlowState>(INITIAL_STATE)
  const [inputText, setInputText] = useState('')

  const disclaimer = getDisclaimer('grief')
  const stepIndex = GRIEF_FLOW_STEPS.findIndex(s => s.step === flowState.currentStep)
  const stepConfig = GRIEF_FLOW_STEPS[stepIndex]
  const message = getGriefStepMessage(flowState.currentStep, petName, flowState.selectedFeeling)

  const handleSelectFeeling = useCallback((feeling: string) => {
    setFlowState(prev => ({ ...prev, selectedFeeling: feeling, currentStep: 'write' }))
  }, [])

  const handleSendMessage = useCallback(() => {
    if (!inputText.trim()) return
    setFlowState(prev => ({ ...prev, userMessage: inputText.trim(), currentStep: 'connect' }))
    setInputText('')
  }, [inputText])

  const handleSkipWrite = useCallback(() => {
    setFlowState(prev => ({ ...prev, currentStep: 'connect' }))
  }, [])

  const handleClose = useCallback(() => {
    setFlowState(prev => ({ ...prev, currentStep: 'close' }))
  }, [])

  const petLabel = species === 'cat' ? '猫咪' : '狗狗'

  return (
    <View className='grief-companion'>
      <View className='grief-companion__header'>
        <Text className='grief-companion__title'>🤍 纪念{petName}</Text>
        <Text className='grief-companion__subtitle'>
          {petLabel}·{deceasedDate ? `离开于${deceasedDate}` : '已离世'}
        </Text>
      </View>

      <View className='grief-companion__progress'>
        {GRIEF_FLOW_STEPS.map((s, i) => (
          <View
            key={s.step}
            className={`grief-companion__progress-dot ${i <= stepIndex ? 'grief-companion__progress-dot--active' : ''}`}
          />
        ))}
      </View>

      <View className='grief-companion__content'>
        <Text className='grief-companion__message'>{message}</Text>

        {flowState.currentStep === 'name' && stepConfig.options && (
          <View className='grief-companion__options'>
            {stepConfig.options.map(option => (
              <View
                key={option}
                className={`grief-companion__option ${flowState.selectedFeeling === option ? 'grief-companion__option--selected' : ''}`}
                onClick={() => handleSelectFeeling(option)}
              >
                <Text className='grief-companion__option-text'>{option}</Text>
              </View>
            ))}
          </View>
        )}

        {flowState.currentStep === 'write' && (
          <View className='grief-companion__write'>
            <Input
              className='grief-companion__input'
              value={inputText}
              onInput={e => setInputText(e.detail.value)}
              placeholder={stepConfig.placeholder || '说说你的感受...'}
              confirmType='send'
              onConfirm={handleSendMessage}
            />
            <View className='grief-companion__write-actions'>
              <View className='grief-companion__send-btn' onClick={handleSendMessage}>
                <Text className='grief-companion__send-text'>发送</Text>
              </View>
              <View className='grief-companion__skip-btn' onClick={handleSkipWrite}>
                <Text className='grief-companion__skip-text'>暂时不想</Text>
              </View>
            </View>
          </View>
        )}

        {flowState.currentStep === 'connect' && (
          <View className='grief-companion__connect'>
            <Text className='grief-companion__connect-count'>
              过去1个月，{flowState.connectedCount}人也经历了同样的失去
            </Text>
            <View className='grief-companion__connect-btn' onClick={handleClose}>
              <Text className='grief-companion__connect-btn-text'>继续</Text>
            </View>
          </View>
        )}

        {flowState.currentStep === 'close' && (
          <View className='grief-companion__close'>
            <Text className='grief-companion__close-message'>
              {petName}有你这样的家人，是{petName}的幸运。
            </Text>
            <Text className='grief-companion__close-sub'>
              如果需要，这里一直有
            </Text>
            <View className='grief-companion__complete-btn' onClick={onComplete}>
              <Text className='grief-companion__complete-text'>关闭</Text>
            </View>
          </View>
        )}
      </View>

      <Text className='grief-companion__disclaimer'>{disclaimer}</Text>
    </View>
  )
}
```

- [ ] **Step 2: 更新 GriefCompanion.scss**

保留现有样式，新增四步流程相关样式：

```scss
// 在 GriefCompanion.scss 末尾追加

.grief-companion__progress {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px 0;
}

.grief-companion__progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #e0e0e0;
  transition: background-color 0.3s;

  &--active {
    background-color: #9b59b6;
  }
}

.grief-companion__content {
  padding: 16px;
  min-height: 200px;
}

.grief-companion__message {
  font-size: 16px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 16px;
}

.grief-companion__options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.grief-companion__option {
  padding: 8px 16px;
  border-radius: 20px;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;

  &--selected {
    background-color: #f0e6f6;
    border-color: #9b59b6;
  }
}

.grief-companion__option-text {
  font-size: 14px;
  color: #333;
}

.grief-companion__write {
  margin-top: 12px;
}

.grief-companion__write-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.grief-companion__skip-btn {
  padding: 8px 16px;
  border-radius: 20px;
  background-color: transparent;
  border: 1px solid #e0e0e0;
}

.grief-companion__skip-text {
  font-size: 14px;
  color: #999;
}

.grief-companion__connect {
  margin-top: 12px;
  text-align: center;
}

.grief-companion__connect-count {
  font-size: 14px;
  color: #9b59b6;
  margin-bottom: 16px;
}

.grief-companion__connect-btn {
  display: inline-block;
  padding: 10px 32px;
  border-radius: 20px;
  background-color: #9b59b6;
}

.grief-companion__connect-btn-text {
  color: #fff;
  font-size: 14px;
}

.grief-companion__close {
  text-align: center;
  margin-top: 12px;
}

.grief-companion__close-message {
  font-size: 16px;
  color: #333;
  line-height: 1.6;
}

.grief-companion__close-sub {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
  margin-bottom: 16px;
}
```

- [ ] **Step 3: 更新 GriefCompanion.test.tsx**

重写测试以适配四步流程：

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import GriefCompanion from '../GriefCompanion'

vi.mock('@tarojs/components', () => ({
  View: ({ children, className, onClick }: any) => (
    <div className={className} onClick={onClick}>{children}</div>
  ),
  Text: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  ),
  Input: ({ value, onInput, placeholder }: any) => (
    <input value={value} onInput={onInput} placeholder={placeholder} />
  ),
  ScrollView: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}))

describe('GriefCompanion', () => {
  const defaultProps = {
    petId: 'pet1',
    petName: '咪咪',
    species: 'cat' as const,
    deceasedDate: '2026-01-01',
    onComplete: vi.fn(),
  }

  it('renders name step initially', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    expect(container.textContent).toContain('不需要坚强')
  })

  it('shows feeling options in name step', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    expect(container.textContent).toContain('空虚')
    expect(container.textContent).toContain('愤怒')
  })

  it('advances to write step when feeling is selected', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    const options = container.querySelectorAll('.grief-companion__option')
    fireEvent.click(options[0])
    expect(container.textContent).toContain('想说说')
  })

  it('shows disclaimer', () => {
    const { container } = render(<GriefCompanion {...defaultProps} />)
    expect(container.textContent).toContain('400-161-9995')
  })
})
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/components/__tests__/GriefCompanion.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/components/GriefCompanion.tsx src/components/GriefCompanion.scss src/components/__tests__/GriefCompanion.test.tsx
git commit -m "refactor(GriefCompanion): replace chat UI with four-step grief flow"
```

---

### Task 5: 重构 EmotionResponseCard - 从独立卡片改为内联提示

**Files:**
- Modify: `src/components/EmotionResponseCard.tsx`
- Modify: `src/components/EmotionResponseCard.scss`
- Test: `src/components/__tests__/EmotionResponseCard.test.tsx`

**问题：** 当前 EmotionResponseCard 作为独立卡片出现在首页，不符合"情绪能力隐形化"要求。应改为融入打卡区域的内联提示。

- [ ] **Step 1: 重写 EmotionResponseCard.tsx**

```tsx
import { View, Text } from '@tarojs/components'
import { useCallback } from 'react'
import type { EmotionIntervention } from '../engines/emotion'
import './EmotionResponseCard.scss'

interface EmotionResponseCardProps {
  intervention: EmotionIntervention
  onAction: (intervention: EmotionIntervention) => void
  onDismiss: (intervention: EmotionIntervention) => void
}

const SCENE_CONFIG: Record<string, { icon: string; actionLabel: string }> = {
  sick_anxiety: { icon: '💜', actionLabel: '深呼吸' },
  new_owner_anxiety: { icon: '🌟', actionLabel: '看看建议' },
}

export default function EmotionResponseCard({ intervention, onAction, onDismiss }: EmotionResponseCardProps) {
  const config = SCENE_CONFIG[intervention.type] || SCENE_CONFIG.sick_anxiety

  const handleAction = useCallback(() => {
    onAction(intervention)
  }, [intervention, onAction])

  const handleDismiss = useCallback(() => {
    onDismiss(intervention)
  }, [intervention, onDismiss])

  return (
    <View className={`emotion-inline emotion-inline--${intervention.type}`}>
      <Text className='emotion-inline__icon'>{config.icon}</Text>
      <Text className='emotion-inline__message'>{intervention.message}</Text>
      <View className='emotion-inline__action' onClick={handleAction}>
        <Text className='emotion-inline__action-text'>{config.actionLabel}</Text>
      </View>
      <View className='emotion-inline__dismiss' onClick={handleDismiss}>
        <Text className='emotion-inline__dismiss-text'>✕</Text>
      </View>
    </View>
  )
}
```

- [ ] **Step 2: 重写 EmotionResponseCard.scss**

```scss
.emotion-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f0ff, #fff5f5);
  margin: 8px 16px;

  &--sick_anxiety {
    background: linear-gradient(135deg, #f0f0ff, #f8f0ff);
  }

  &--new_owner_anxiety {
    background: linear-gradient(135deg, #fff8f0, #fff5f0);
  }
}

.emotion-inline__icon {
  font-size: 16px;
  flex-shrink: 0;
}

.emotion-inline__message {
  flex: 1;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.emotion-inline__action {
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 12px;
  background-color: #9b59b6;
}

.emotion-inline__action-text {
  font-size: 12px;
  color: #fff;
}

.emotion-inline__dismiss {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emotion-inline__dismiss-text {
  font-size: 12px;
  color: #ccc;
}
```

- [ ] **Step 3: 更新 EmotionResponseCard.test.tsx**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import EmotionResponseCard from '../EmotionResponseCard'
import type { EmotionIntervention } from '../../engines/emotion'

vi.mock('@tarojs/components', () => ({
  View: ({ children, className, onClick }: any) => (
    <div className={className} onClick={onClick}>{children}</div>
  ),
  Text: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  ),
}))

const mockIntervention: EmotionIntervention = {
  id: 'intv_sick_anxiety_123_abc',
  type: 'sick_anxiety',
  userId: 'user1',
  message: '你最近很担心毛孩子的健康吧？',
  context: { petId: 'p1', petName: '咪咪', consecutiveAnomalyDays: 3, userOpenFrequency: 5, lastAnomalyItems: ['呕吐'], previousRecoveryCount: 0 },
  petId: 'p1',
  createdAt: Date.now(),
  userResponded: false,
}

describe('EmotionResponseCard', () => {
  it('renders inline message', () => {
    const { container } = render(
      <EmotionResponseCard
        intervention={mockIntervention}
        onAction={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    expect(container.querySelector('.emotion-inline')).toBeTruthy()
    expect(container.textContent).toContain('你最近很担心')
  })

  it('calls onAction when action button clicked', () => {
    const onAction = vi.fn()
    const { container } = render(
      <EmotionResponseCard
        intervention={mockIntervention}
        onAction={onAction}
        onDismiss={vi.fn()}
      />,
    )
    const actionBtn = container.querySelector('.emotion-inline__action')
    fireEvent.click(actionBtn!)
    expect(onAction).toHaveBeenCalledWith(mockIntervention)
  })

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn()
    const { container } = render(
      <EmotionResponseCard
        intervention={mockIntervention}
        onAction={vi.fn()}
        onDismiss={onDismiss}
      />,
    )
    const dismissBtn = container.querySelector('.emotion-inline__dismiss')
    fireEvent.click(dismissBtn!)
    expect(onDismiss).toHaveBeenCalledWith(mockIntervention)
  })
})
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/components/__tests__/EmotionResponseCard.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/components/EmotionResponseCard.tsx src/components/EmotionResponseCard.scss src/components/__tests__/EmotionResponseCard.test.tsx
git commit -m "refactor(EmotionResponseCard): change from standalone card to inline prompt"
```

---

### Task 6: 修复首页触发逻辑

**Files:**
- Modify: `src/pages/index/index.tsx`

**问题：** 首页传给 checkSickAnxiety 的 `consecutiveAnomalyDays` 是单日异常项数量，`userOpenFrequency` 硬编码为 0；缺少 recordAppOpen 调用。

- [ ] **Step 1: 修改首页触发逻辑**

关键修改点：

1. 导入 `recordAppOpen` 和 `getRecentOpenCount`
2. 在 `loadHomeData` 成功后调用 `recordAppOpen()`
3. 修复 `checkSickAnxiety` 调用：使用 `consecutiveAnomalyDays` 从 checkinStore 获取，使用 `getRecentOpenCount()` 获取用户打开频率
4. 修复 `checkNewOwnerAnxiety` 调用：使用时间窗口计数的 `getRecentFoodQueryCount()` 和 `getRecentSymptomCheckCount()`

```typescript
// 修改导入
import { isNewUser, getRecentFoodQueryCount, getRecentSymptomCheckCount, recordAppOpen, getRecentOpenCount } from '../../utils/usageTracking'

// 新增从 checkinStore 获取 consecutiveAnomalyDays
const consecutiveAnomalyDays = useCheckinStore(s => s.consecutiveAnomalyDays)

// 在 loadHomeData 成功后添加 recordAppOpen
const loadHomeData = useCallback(async () => {
  if (!user?.id) return
  setError('')
  setIsLoading(true)
  try {
    await Promise.all([
      initPetUser(user.id),
      initCheckinUser(user.id),
      fetchPets(),
    ])
    recordAppOpen()
  } catch (err) {
    setError(err instanceof Error ? err.message : '加载失败，请重试')
  } finally {
    setIsLoading(false)
  }
}, [user?.id, initPetUser, initCheckinUser, fetchPets])

// 修复 checkSickAnxiety 调用
useEffect(() => {
  if (!user?.id || !currentPet?.id || activeIntervention) return
  if (consecutiveAnomalyDays < 3) return
  checkSickAnxiety(
    currentPet.id,
    currentPet.name,
    consecutiveAnomalyDays,
    getRecentOpenCount(),
    useCheckinStore.getState().todayEntry?.anomalyItems || [],
    0,
    user.id,
  )
}, [user?.id, currentPet?.id, currentPet?.name, activeIntervention, checkSickAnxiety, consecutiveAnomalyDays])
```

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: 提交**

```bash
git add src/pages/index/index.tsx
git commit -m "fix(home): use real consecutive anomaly days and app open frequency for emotion triggers"
```

---

### Task 7: 适配 pet-profile 页面

**Files:**
- Modify: `src/pages/pet-profile/index.tsx`

**问题：** pet-profile 页面中 GriefCompanion 的 props 需要适配四步流程（已不需要 petAvatar prop，但其他 prop 保持兼容）。

- [ ] **Step 1: 确认 pet-profile 中 GriefCompanion 的使用**

当前代码已经正确传递了 `petId`, `petName`, `species`, `deceasedDate`, `onComplete` props，与重构后的 GriefCompanion 接口兼容。无需修改。

但需要确认：标记离世确认后是否应该自动触发悲伤陪伴流程。PRD 18.3.4 要求"确认后→触发悲伤陪伴流程"。

修改 `handleDeceasedConfirm`：

```typescript
const handleDeceasedConfirm = useCallback(
  async (date: string) => {
    if (!deceasedPet) return
    try {
      await markPetDeceased(deceasedPet.id, date)
      setGriefPet(deceasedPet)
      setShowGriefCompanion(true)
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setDeceasedModalVisible(false)
      setDeceasedPet(null)
    }
  },
  [deceasedPet, markPetDeceased],
)
```

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: 提交**

```bash
git add src/pages/pet-profile/index.tsx
git commit -m "fix(pet-profile): auto-trigger grief companion after marking pet deceased"
```

---

### Task 8: 全量验证

**Files:** 无新增/修改

- [ ] **Step 1: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: 运行全量测试**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 3: 运行构建**

Run: `npm run build:weapp`
Expected: Build success

- [ ] **Step 4: 更新看板**

Run: `E:\update-board.bat "E:\星寰海" "情绪底层融入宠物场景重构完成" "修复触发逻辑缺陷（连续异常天数、用户打开频率、时间窗口计数），GriefCompanion改为四步流程，EmotionResponseCard改为内联提示，标记离世后自动触发悲伤陪伴" "src/engines/emotion.ts,src/stores/emotionStore.ts,src/utils/usageTracking.ts,src/components/GriefCompanion.tsx,src/components/GriefCompanion.scss,src/components/EmotionResponseCard.tsx,src/components/EmotionResponseCard.scss,src/pages/index/index.tsx,src/pages/pet-profile/index.tsx,src/services/checkinService.ts,src/stores/checkinStore.ts,src/types/emotionTypes.ts"`

- [ ] **Step 5: 更新项目记忆**

记录情绪底层重构完成，包括修复的缺陷和新增的四步流程。
