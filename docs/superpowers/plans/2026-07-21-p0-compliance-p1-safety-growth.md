# P0 合规 + P1 安全/增长 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 P0 医疗免责声明全页面覆盖 + P1 极端情绪用户转介 + P1 成就纪念卡全场景集成

**Architecture:** MedicalDisclaimer 引擎已存在但未接入页面，需扩展 context 类型并替换硬编码文本；情绪引擎需增加 severe 级别危机转介逻辑；成就服务需在疫苗/首页/宠物档案页触发

**Tech Stack:** Taro 3.x + React + TypeScript + Zustand + Vitest

---

## 文件结构

| 操作 | 文件路径 | 职责 |
|------|----------|------|
| 修改 | `src/engines/petSafety/MedicalDisclaimer.ts` | 新增 trend/vaccine context |
| 修改 | `src/pagesPet/food-query/index.tsx` | 替换硬编码免责声明 |
| 修改 | `src/pagesPet/symptom-check/index.tsx` | 替换硬编码免责声明 |
| 修改 | `src/pagesPet/checkin/index.tsx` | 替换硬编码免责声明 |
| 修改 | `src/pagesPet/trends/index.tsx` | 替换硬编码免责声明 |
| 修改 | `src/pagesPet/vaccine/index.tsx` | 替换硬编码免责声明 |
| 修改 | `src/pages/index/index.tsx` | 新增免责声明 |
| 修改 | `src/engines/emotion.ts` | 新增危机转介逻辑 |
| 修改 | `src/components/EmotionResponseCard.tsx` | 新增危机转介按钮 |
| 修改 | `src/stores/emotionStore.ts` | 新增 checkGriefCrisis |
| 修改 | `src/pages/index/index.tsx` | 集成危机转介 |
| 修改 | `src/pagesPet/vaccine/index.tsx` | 集成成就卡 |
| 修改 | `src/pages/index/index.tsx` | 集成成就卡 |
| 修改 | `src/pagesPet/checkin/index.tsx` | 成就卡分享接入 |
| 新建 | `src/components/CrisisReferralCard.tsx` | 危机转介卡片 |
| 新建 | `src/components/CrisisReferralCard.scss` | 危机转介样式 |
| 新建 | `src/components/__tests__/CrisisReferralCard.test.tsx` | 危机转介测试 |
| 修改 | `src/components/index.ts` | 导出 CrisisReferralCard |

---

### Task 1: 扩展 MedicalDisclaimer 引擎，新增 trend/vaccine context

**Files:**
- Modify: `src/engines/petSafety/MedicalDisclaimer.ts`
- Test: `src/engines/petSafety/__tests__/MedicalDisclaimer.test.ts`

- [ ] **Step 1: 读取现有 MedicalDisclaimer.ts，了解 DisclaimerContext 类型定义**

当前 `DisclaimerContext` 类型为 `'food' | 'symptom' | 'checkin'`，需扩展为 `'food' | 'symptom' | 'checkin' | 'trend' | 'vaccine'`。

- [ ] **Step 2: 修改 DisclaimerContext 类型并新增方法**

在 `MedicalDisclaimer.ts` 中：

1. 将 `DisclaimerContext` 类型扩展为 `'food' | 'symptom' | 'checkin' | 'trend' | 'vaccine'`
2. 新增 `getTrendDisclaimer()` 方法：
```typescript
getTrendDisclaimer(): string {
  return '⚠️ 健康趋势分析仅供参考，不替代兽医诊断。如发现异常请及时就医。'
}
```
3. 新增 `getVaccineDisclaimer()` 方法：
```typescript
getVaccineDisclaimer(): string {
  return '⚠️ 疫苗提醒仅供参考，请遵循兽医建议按时接种。具体接种方案请咨询专业兽医。'
}
```
4. 更新 `getDisclaimer(context)` 方法的 switch 分支，新增 `'trend'` 和 `'vaccine'` case

- [ ] **Step 3: 运行现有测试确认不破坏**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp"; npx vitest run src/engines/petSafety 2>&1`
Expected: PASS

---

### Task 2: 6 个页面替换硬编码免责声明为 MedicalDisclaimer 引擎调用

**Files:**
- Modify: `src/pagesPet/food-query/index.tsx`
- Modify: `src/pagesPet/symptom-check/index.tsx`
- Modify: `src/pagesPet/checkin/index.tsx`
- Modify: `src/pagesPet/trends/index.tsx`
- Modify: `src/pagesPet/vaccine/index.tsx`
- Modify: `src/pages/index/index.tsx`

- [ ] **Step 1: 修改 food-query 页面**

在 `src/pagesPet/food-query/index.tsx` 中：

1. 新增 import：
```typescript
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
```

2. 在组件内，新增 disclaimer 计算逻辑（在 `lastResult` 相关逻辑附近）：
```typescript
const disclaimerText = useMemo(() => {
  if (!lastResult) return new MedicalDisclaimer().getFoodDisclaimer()
  return new MedicalDisclaimer().getFoodDisclaimer(lastResult.safetyLevel)
}, [lastResult])
```

3. 替换硬编码免责声明文本（约第 377 行）：
```tsx
// 旧: <Text className='food-query__disclaimer-text'>⚠️ 食物安全信息仅供参考，不替代兽医诊断。如有疑问请咨询专业兽医。</Text>
// 新:
<Text className='food-query__disclaimer-text'>{disclaimerText}</Text>
```

- [ ] **Step 2: 修改 symptom-check 页面**

在 `src/pagesPet/symptom-check/index.tsx` 中：

1. 新增 import：
```typescript
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
```

2. 在组件内，新增 disclaimer 计算逻辑（在 `currentResult` 相关逻辑附近）：
```typescript
const disclaimerText = useMemo(() => {
  if (!currentResult) return new MedicalDisclaimer().getSymptomDisclaimer()
  return new MedicalDisclaimer().getSymptomDisclaimer(currentResult.urgencyLevel)
}, [currentResult])
```

3. 替换硬编码免责声明文本（约第 536 行）：
```tsx
// 旧: <Text className='symptom-check__disclaimer-text'>⚠️ 以上建议仅供参考，不替代兽医诊断。如症状持续或加重，请及时就医。</Text>
// 新:
<Text className='symptom-check__disclaimer-text'>{disclaimerText}</Text>
```

- [ ] **Step 3: 修改 checkin 页面**

在 `src/pagesPet/checkin/index.tsx` 中：

1. 新增 import：
```typescript
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
```

2. 在组件内，新增 disclaimer 计算逻辑：
```typescript
const disclaimerText = useMemo(() => {
  const md = new MedicalDisclaimer()
  return todayEntry?.hasAnomaly ? md.getCheckinDisclaimer('anomaly') : md.getCheckinDisclaimer()
}, [todayEntry])
```

3. 替换硬编码免责声明文本（约第 444 行）：
```tsx
// 旧: <Text className='pet-checkin__disclaimer-text'>⚠️ 健康数据仅供参考，不替代兽医诊断。如发现异常请及时就医。</Text>
// 新:
<Text className='pet-checkin__disclaimer-text'>{disclaimerText}</Text>
```

- [ ] **Step 4: 修改 trends 页面**

在 `src/pagesPet/trends/index.tsx` 中：

1. 新增 import：
```typescript
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
```

2. 在组件内，新增 disclaimer：
```typescript
const disclaimerText = new MedicalDisclaimer().getTrendDisclaimer()
```

3. 替换硬编码免责声明文本（约第 774 行）：
```tsx
// 旧: <Text className='pet-trends__disclaimer-text'>⚠️ 健康趋势分析仅供参考，不替代兽医诊断。如发现异常请及时就医。</Text>
// 新:
<Text className='pet-trends__disclaimer-text'>{disclaimerText}</Text>
```

- [ ] **Step 5: 修改 vaccine 页面**

在 `src/pagesPet/vaccine/index.tsx` 中：

1. 新增 import：
```typescript
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
```

2. 在组件内，新增 disclaimer：
```typescript
const disclaimerText = new MedicalDisclaimer().getVaccineDisclaimer()
```

3. 替换硬编码免责声明文本（约第 370 行）：
```tsx
// 旧: <Text className='pet-vaccine__disclaimer-text'>⚠️ 疫苗提醒仅供参考，请遵循兽医建议按时接种。具体接种方案请咨询专业兽医。</Text>
// 新:
<Text className='pet-vaccine__disclaimer-text'>{disclaimerText}</Text>
```

- [ ] **Step 6: 修改首页，新增免责声明**

在 `src/pages/index/index.tsx` 中：

1. 新增 import：
```typescript
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
```

2. 在组件内，新增 disclaimer：
```typescript
const disclaimerText = new MedicalDisclaimer().getDisclaimer('checkin')
```

3. 在 JSX 的 `home-page__footer` 区域（约第 330-332 行），在 footer-text 之前添加：
```tsx
<View className='home-page__disclaimer'>
  <Text className='home-page__disclaimer-text'>{disclaimerText}</Text>
</View>
```

- [ ] **Step 7: 运行全量测试确认**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp"; npx vitest run 2>&1`
Expected: ALL PASS

---

### Task 3: 创建 CrisisReferralCard 危机转介组件

**Files:**
- Create: `src/components/CrisisReferralCard.tsx`
- Create: `src/components/CrisisReferralCard.scss`
- Create: `src/components/__tests__/CrisisReferralCard.test.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: 创建 CrisisReferralCard 组件**

文件 `src/components/CrisisReferralCard.tsx`：
```tsx
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useCallback } from 'react'
import { HOTLINE_NUMBER } from '../constants'
import './CrisisReferralCard.scss'

interface CrisisReferralCardProps {
  message: string
  onDismiss: () => void
}

export default function CrisisReferralCard({ message, onDismiss }: CrisisReferralCardProps) {
  const handleCallHotline = useCallback(() => {
    Taro.makePhoneCall({ phoneNumber: HOTLINE_NUMBER.replace(/-/g, '') })
  }, [])

  const handleDismiss = useCallback(() => {
    onDismiss()
  }, [onDismiss])

  return (
    <View className='crisis-referral'>
      <View className='crisis-referral__card'>
        <Text className='crisis-referral__icon'>🆘</Text>
        <Text className='crisis-referral__message'>{message}</Text>
        <View className='crisis-referral__hotline' onClick={handleCallHotline}>
          <Text className='crisis-referral__hotline-icon'>📞</Text>
          <Text className='crisis-referral__hotline-number'>{HOTLINE_NUMBER}</Text>
          <Text className='crisis-referral__hotline-label'>24h心理援助热线</Text>
        </View>
        <View className='crisis-referral__actions'>
          <View className='crisis-referral__call-btn' onClick={handleCallHotline}>
            <Text className='crisis-referral__call-text'>拨打热线</Text>
          </View>
          <View className='crisis-referral__dismiss-btn' onClick={handleDismiss}>
            <Text className='crisis-referral__dismiss-text'>我知道了</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
```

- [ ] **Step 2: 创建 CrisisReferralCard 样式**

文件 `src/components/CrisisReferralCard.scss`：
```scss
.crisis-referral {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 32px;

  &__card {
    background: #fff;
    border-radius: 24px;
    padding: 48px 32px 32px;
    width: 100%;
    max-width: 600px;
    text-align: center;
  }

  &__icon {
    font-size: 64px;
    display: block;
    margin-bottom: 24px;
  }

  &__message {
    font-size: 28px;
    color: #333;
    line-height: 1.6;
    display: block;
    margin-bottom: 32px;
  }

  &__hotline {
    background: #FFF3E0;
    border: 2px solid #FF9800;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 32px;
  }

  &__hotline-icon {
    font-size: 32px;
    display: block;
    margin-bottom: 8px;
  }

  &__hotline-number {
    font-size: 40px;
    font-weight: bold;
    color: #FF6F00;
    display: block;
    margin-bottom: 4px;
  }

  &__hotline-label {
    font-size: 22px;
    color: #999;
    display: block;
  }

  &__actions {
    display: flex;
    gap: 16px;
  }

  &__call-btn {
    flex: 1;
    background: #FF6F00;
    border-radius: 40px;
    padding: 20px 0;
  }

  &__call-text {
    color: #fff;
    font-size: 28px;
    font-weight: bold;
  }

  &__dismiss-btn {
    flex: 1;
    background: #f5f5f5;
    border-radius: 40px;
    padding: 20px 0;
  }

  &__dismiss-text {
    color: #666;
    font-size: 28px;
  }
}
```

- [ ] **Step 3: 创建 CrisisReferralCard 测试**

文件 `src/components/__tests__/CrisisReferralCard.test.tsx`：
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CrisisReferralCard from '../CrisisReferralCard'

const { mockMakePhoneCall, mockDismiss } = vi.hoisted(() => ({
  mockMakePhoneCall: vi.fn(),
  mockDismiss: vi.fn(),
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    makePhoneCall: mockMakePhoneCall,
  },
}))

describe('CrisisReferralCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders crisis message and hotline number', () => {
    render(<CrisisReferralCard message='你看起来非常焦虑' onDismiss={mockDismiss} />)
    expect(screen.getByText('你看起来非常焦虑')).toBeTruthy()
    expect(screen.getByText('400-161-9995')).toBeTruthy()
  })

  it('calls makePhoneCall on call button click', () => {
    render(<CrisisReferralCard message='test' onDismiss={mockDismiss} />)
    const callBtn = screen.getByText('拨打热线')
    fireEvent.click(callBtn)
    expect(mockMakePhoneCall).toHaveBeenCalledWith({ phoneNumber: '4001619995' })
  })

  it('calls onDismiss on dismiss button click', () => {
    render(<CrisisReferralCard message='test' onDismiss={mockDismiss} />)
    const dismissBtn = screen.getByText('我知道了')
    fireEvent.click(dismissBtn)
    expect(mockDismiss).toHaveBeenCalled()
  })

  it('calls makePhoneCall on hotline area click', () => {
    render(<CrisisReferralCard message='test' onDismiss={mockDismiss} />)
    const hotlineArea = screen.getByText('400-161-9995')
    fireEvent.click(hotlineArea)
    expect(mockMakePhoneCall).toHaveBeenCalledWith({ phoneNumber: '4001619995' })
  })
})
```

- [ ] **Step 4: 导出 CrisisReferralCard**

在 `src/components/index.ts` 中新增：
```typescript
export { default as CrisisReferralCard } from './CrisisReferralCard'
```

- [ ] **Step 5: 运行测试确认**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp"; npx vitest run src/components/__tests__/CrisisReferralCard 2>&1`
Expected: 4 tests PASS

---

### Task 4: 扩展情绪引擎，新增危机转介逻辑

**Files:**
- Modify: `src/engines/emotion.ts`
- Modify: `src/stores/emotionStore.ts`
- Modify: `src/types/emotionTypes.ts`

- [ ] **Step 1: 扩展 EmotionIntervention 类型**

在 `src/engines/emotion.ts` 中，给 `EmotionIntervention` 接口新增字段：
```typescript
export interface EmotionIntervention {
  id: string
  type: EmotionSceneType
  userId: string
  message: string
  context: SickAnxietyContext | NewOwnerAnxietyContext | Record<string, unknown>
  petId?: string
  createdAt: number
  userResponded: boolean
  anxietyLevel?: AnxietyLevel
  requiresCrisisReferral: boolean
}
```

- [ ] **Step 2: 新增危机转介判断函数**

在 `src/engines/emotion.ts` 中新增：
```typescript
export function requiresCrisisReferral(type: EmotionSceneType, level?: AnxietyLevel): boolean {
  if (type === 'grief') return true
  if (type === 'sick_anxiety' && level === 'severe') return true
  return false
}
```

- [ ] **Step 3: 更新 createIntervention 函数**

修改 `createIntervention` 函数签名和实现，新增 `anxietyLevel` 参数：
```typescript
export function createIntervention(
  type: EmotionSceneType,
  userId: string,
  message: string,
  context: SickAnxietyContext | NewOwnerAnxietyContext | Record<string, unknown>,
  petId?: string,
  anxietyLevel?: AnxietyLevel,
): EmotionIntervention {
  return {
    id: `intv_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    userId,
    message,
    context,
    petId,
    createdAt: Date.now(),
    userResponded: false,
    anxietyLevel,
    requiresCrisisReferral: requiresCrisisReferral(type, anxietyLevel),
  }
}
```

- [ ] **Step 4: 更新 emotionStore 中的 createIntervention 调用**

在 `src/stores/emotionStore.ts` 中：

1. 新增 import `getSickAnxietyLevel`（需先在 emotion.ts 中导出）：
```typescript
import { detectSickAnxiety, getSickAnxietyMessage, getSickAnxietyLevel, detectNewOwnerAnxiety, getNewOwnerAnxietyMessage, createIntervention } from '../engines/emotion'
```

2. 在 `checkSickAnxiety` action 中，传递 anxietyLevel：
```typescript
const level = getSickAnxietyLevel(context)
const intervention = createIntervention('sick_anxiety', userId, message, context, petId, level)
```

3. 在 `checkNewOwnerAnxiety` action 中，传递 anxietyLevel：
```typescript
const queryTotal = context.foodQueryCount + context.symptomCheckCount
const level: AnxietyLevel = queryTotal >= 15 ? 'severe' : queryTotal >= 8 ? 'moderate' : 'mild'
const intervention = createIntervention('new_owner_anxiety', userId, message, context, undefined, level)
```

4. 新增 import `AnxietyLevel`：
```typescript
import type { EmotionIntervention, EmotionSceneType, AnxietyLevel } from '../engines/emotion'
```

- [ ] **Step 5: 在 emotion.ts 中导出 getSickAnxietyLevel**

在 `src/engines/emotion.ts` 中新增：
```typescript
export function getSickAnxietyLevel(context: SickAnxietyContext): AnxietyLevel {
  return context.consecutiveAnomalyDays >= 7 ? 'severe' : context.consecutiveAnomalyDays >= 5 ? 'moderate' : 'mild'
}
```

- [ ] **Step 6: 更新 emotionTypes.ts 导出**

在 `src/types/emotionTypes.ts` 中，确保导出新增的类型：
```typescript
export type { GriefStage, EmotionSceneType, AnxietyLevel, SickAnxietyContext, NewOwnerAnxietyContext, EmotionIntervention } from '../engines/emotion'
```
（当前已导出，无需修改）

- [ ] **Step 7: 运行测试确认**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp"; npx vitest run src/engines/emotion src/stores/emotionStore 2>&1`
Expected: ALL PASS

---

### Task 5: 首页集成危机转介 + 成就卡

**Files:**
- Modify: `src/pages/index/index.tsx`

- [ ] **Step 1: 新增 import**

在 `src/pages/index/index.tsx` 中新增：
```typescript
import { MedicalDisclaimer } from '../../engines/petSafety/MedicalDisclaimer'
import { CrisisReferralCard, AchievementCard } from '../../components'
import { checkAllAchievements } from '../../services/achievementService'
import type { AchievementConfig } from '../../components/AchievementCard'
```

- [ ] **Step 2: 新增状态变量**

在组件内新增：
```typescript
const [showCrisisReferral, setShowCrisisReferral] = useState(false)
const [crisisMessage, setCrisisMessage] = useState('')
const [achievement, setAchievement] = useState<AchievementConfig | null>(null)
const disclaimerText = new MedicalDisclaimer().getDisclaimer('checkin')
```

- [ ] **Step 3: 修改 handleEmotionAction 回调**

替换现有的 `handleEmotionAction`：
```typescript
const handleEmotionAction = useCallback((intervention: EmotionIntervention) => {
  respondToIntervention()
  if (intervention.requiresCrisisReferral) {
    setCrisisMessage(intervention.message)
    setShowCrisisReferral(true)
  } else {
    Taro.showToast({ title: '我们在一起 ❤️', icon: 'none' })
  }
}, [respondToIntervention])
```

- [ ] **Step 4: 新增成就检查逻辑**

在 `loadHomeData` 的 finally 块之后，新增 useEffect：
```typescript
useEffect(() => {
  if (!currentPet?.id || !user?.id) return
  const result = checkAllAchievements({
    petId: currentPet.id,
    birthDate: currentPet.birthDate,
    streakDays: stats?.streak ?? 0,
    isDeceased: currentPet.isDeceased || false,
  })
  if (result) setAchievement(result)
}, [currentPet?.id, currentPet?.birthDate, currentPet?.isDeceased, stats?.streak, user?.id])
```

- [ ] **Step 5: 在 JSX 中添加新组件**

1. 在 `home-page__footer` 之前添加免责声明：
```tsx
<View className='home-page__disclaimer'>
  <Text className='home-page__disclaimer-text'>{disclaimerText}</Text>
</View>
```

2. 在 NpsSurvey 之后添加危机转介卡片：
```tsx
{showCrisisReferral && (
  <CrisisReferralCard
    message={crisisMessage}
    onDismiss={() => setShowCrisisReferral(false)}
  />
)}
```

3. 在 member-banner 之后添加成就卡：
```tsx
{achievement && currentPet && (
  <View className='home-page__achievement'>
    <AchievementCard
      achievement={achievement}
      petName={currentPet.name}
      species={currentPet.species as 'dog' | 'cat'}
      onClose={() => setAchievement(null)}
    />
  </View>
)}
```

- [ ] **Step 6: 运行测试确认**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp"; npx vitest run 2>&1`
Expected: ALL PASS

---

### Task 6: 疫苗页面集成成就卡

**Files:**
- Modify: `src/pagesPet/vaccine/index.tsx`

- [ ] **Step 1: 新增 import**

在 `src/pagesPet/vaccine/index.tsx` 中新增：
```typescript
import { AchievementCard } from '../../components'
import { checkVaccineCompleteAchievement } from '../../services/achievementService'
import type { AchievementConfig } from '../../components/AchievementCard'
```

- [ ] **Step 2: 新增状态变量**

在组件内新增：
```typescript
const [achievement, setAchievement] = useState<AchievementConfig | null>(null)
```

- [ ] **Step 3: 在疫苗完成回调中触发成就检查**

找到疫苗完成标记的逻辑（`handleVaccineComplete` 或类似函数），在标记完成后添加：
```typescript
const vaccineAchievement = checkVaccineCompleteAchievement(petId, true)
if (vaccineAchievement) setAchievement(vaccineAchievement)
```

- [ ] **Step 4: 在 JSX 中添加成就卡**

在 FloatingNav 之前添加：
```tsx
{achievement && currentPet && (
  <View className='pet-vaccine__achievement'>
    <AchievementCard
      achievement={achievement}
      petName={currentPet.name}
      species={currentPet.species as 'dog' | 'cat'}
      onClose={() => setAchievement(null)}
    />
  </View>
)}
```

- [ ] **Step 5: 运行测试确认**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp"; npx vitest run 2>&1`
Expected: ALL PASS

---

### Task 7: 打卡页面成就卡分享接入 AchievementShareCard

**Files:**
- Modify: `src/pagesPet/checkin/index.tsx`

- [ ] **Step 1: 新增 import**

在 `src/pagesPet/checkin/index.tsx` 中新增：
```typescript
import { AchievementShareCard } from '../../components'
import type { AchievementShareData } from '../../types/shareTypes'
```

- [ ] **Step 2: 新增状态变量**

在组件内新增：
```typescript
const [showAchievementShare, setShowAchievementShare] = useState(false)
```

- [ ] **Step 3: 修改 AchievementCard 的 onShare 回调**

将现有的 AchievementCard（约第 432-440 行）修改为：
```tsx
{achievement && currentPet && (
  <View className='pet-checkin__achievement'>
    <AchievementCard
      achievement={achievement}
      petName={currentPet.name}
      species={currentPet.species as 'dog' | 'cat'}
      onClose={() => setAchievement(null)}
      onShare={() => setShowAchievementShare(true)}
    />
  </View>
)}
```

- [ ] **Step 4: 在 JSX 中添加 AchievementShareCard**

在 AchievementCard 之后添加：
```tsx
{showAchievementShare && achievement && currentPet && (
  <AchievementShareCard
    petName={currentPet.name}
    petAvatar={currentPet.avatarUrl || ''}
    achievementType={achievement.type}
    achievementTitle={achievement.title}
    achievementSubtitle={achievement.subtitle}
    achievementIcon={achievement.icon}
    achievementColor={achievement.color}
    onClose={() => setShowAchievementShare(false)}
  />
)}
```

- [ ] **Step 5: 运行全量测试确认**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp"; npx vitest run 2>&1`
Expected: ALL PASS

---

### Task 8: 全量验证 + 看板更新

**Files:**
- Modify: `.board/index.html` (via update-board.bat)

- [ ] **Step 1: 运行类型检查**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp"; npx tsc --noEmit 2>&1`
Expected: 0 errors

- [ ] **Step 2: 运行全量测试**

Run: `cd "e:\星寰海\03-源代码\小程序\miniapp"; npx vitest run 2>&1`
Expected: ALL PASS

- [ ] **Step 3: 更新看板**

Run: `E:\update-board.bat "E:\星寰海" "P0合规+P1安全/增长完成" "MedicalDisclaimer全页面覆盖、危机转介卡片、成就纪念卡全场景集成" "src/engines/petSafety/MedicalDisclaimer.ts,src/pagesPet/food-query/index.tsx,src/pagesPet/symptom-check/index.tsx,src/pagesPet/checkin/index.tsx,src/pagesPet/trends/index.tsx,src/pagesPet/vaccine/index.tsx,src/pages/index/index.tsx,src/engines/emotion.ts,src/components/CrisisReferralCard.tsx,src/stores/emotionStore.ts"`

- [ ] **Step 4: 同步项目记忆**

Run: `node "E:\sync-memory-to-board.cjs" "E:\星寰海"`
