# 宠物头像系统完善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善宠物头像系统，包括类型提取、动画系统、头像定制UI、成就卡分享、首页streakDays修复、日记展示完善

**Architecture:** 基于已有的 expressionEngine/diaryEngine/svgRenderer/seedreamAdapter 引擎代码，提取类型到独立文件，添加CSS动画系统，创建头像定制页面，修复已知bug，完善成就卡分享功能

**Tech Stack:** Taro 3.x + React + TypeScript + Zustand + SCSS + Vitest

---

## File Structure

### 新建文件
- `src/types/avatarTypes.ts` - 头像相关类型定义（从引擎文件提取）
- `src/services/avatarService.ts` - 头像服务（生成/保存/加载）
- `src/pagesPet/avatar-customize/index.tsx` - 头像定制页面
- `src/pagesPet/avatar-customize/index.scss` - 头像定制页面样式
- `src/components/PetAvatarAnimations.scss` - 表情动画CSS
- `src/services/__tests__/avatarService.test.ts` - 头像服务测试

### 修改文件
- `src/engines/petAvatar/expressionEngine.ts` - 类型提取后改为从avatarTypes导入
- `src/engines/petAvatar/diaryEngine.ts` - 类型提取后改为从avatarTypes导入
- `src/engines/petAvatar/svgRenderer.ts` - 类型提取后改为从avatarTypes导入，添加动画class
- `src/engines/petAvatar/seedreamAdapter.ts` - 类型提取后改为从avatarTypes导入
- `src/components/PetAvatar.tsx` - 添加动画class、日记展示完善
- `src/components/PetAvatar.scss` - 引入动画样式
- `src/components/AchievementCard.tsx` - 添加分享功能
- `src/components/AchievementCard.scss` - 分享按钮样式
- `src/components/index.ts` - 新增导出
- `src/pages/index/index.tsx` - 修复streakDays bug
- `src/constants/index.ts` - 添加头像相关常量
- `src/app.config.ts` - 注册头像定制页面路由

---

### Task 1: 提取头像类型到独立文件

**Files:**
- Create: `src/types/avatarTypes.ts`
- Modify: `src/engines/petAvatar/expressionEngine.ts`
- Modify: `src/engines/petAvatar/diaryEngine.ts`
- Modify: `src/engines/petAvatar/svgRenderer.ts`
- Modify: `src/engines/petAvatar/seedreamAdapter.ts`

- [ ] **Step 1: 创建 avatarTypes.ts**

从各引擎文件提取所有公共类型定义到 `src/types/avatarTypes.ts`：

```typescript
export type PetExpression = 'happy' | 'worried' | 'concerned' | 'anxious' | 'sleepy' | 'proud' | 'excited' | 'scared'

export type PetSpecies = 'dog' | 'cat'

export type DiaryTone = 'happy' | 'neutral' | 'tired' | 'sick' | 'proud'

export type AnimationType = 'bounce' | 'pulse' | 'shake' | 'flash' | 'float' | 'glow' | 'jump' | 'tremble'

export type HealthRiskLevel = 'normal' | 'low' | 'medium' | 'high' | 'emergency'

export interface ExpressionConfig {
  expression: PetExpression
  label: string
  color: string
  eyes: string
  mouth: string
  accessory?: string
  animation?: AnimationType
}

export interface ExpressionContext {
  todayEntry?: PetHealthEntry
  hasAnomaly?: boolean
  anomalyCount?: number
  riskLevel?: HealthRiskLevel
  streakDays?: number
  isBirthday?: boolean
  isVaccineComplete?: boolean
  isRecovery?: boolean
  isDeceased?: boolean
}

export interface PetHealthEntry {
  appetiteLevel: string
  spiritLevel: string
  poopLevel: string
  anomalyItems: string[]
  weight?: number
  riskLevel: HealthRiskLevel
  aiFeedback: string
}

export interface DiaryEntry {
  text: string
  tone: DiaryTone
  emoji: string
}

export interface SvgPetFace {
  svg: string
  dataUri: string
  width: number
  height: number
}

export interface PetImageParams {
  species: PetSpecies
  petName: string
  style: 'q_cute' | 'japanese_healing' | 'american_cartoon'
  referenceImageUrl?: string
  color?: string
}

export interface SeedreamGenerateResult {
  imageUrl: string
  style: PetImageParams['style']
  generatedAt: string
  cost: number
}

export interface AchievementConfig {
  type: 'birthday' | 'vaccine_complete' | 'streak_7' | 'streak_30' | 'streak_100' | 'rainbow_bridge' | 'holiday'
  title: string
  subtitle: string
  icon: string
  color: string
}

export interface AvatarCustomization {
  species: PetSpecies
  style: PetImageParams['style']
  baseColor: string
  accessory?: string
  generatedAt?: string
  cartoonUrl?: string
}
```

- [ ] **Step 2: 修改 expressionEngine.ts - 删除内联类型，改为从 avatarTypes 导入**

在文件顶部添加：
```typescript
import type { PetExpression, ExpressionConfig, ExpressionContext, HealthRiskLevel, AnimationType } from '../../types/avatarTypes'
```

删除文件中所有内联的 `type PetExpression = ...`、`interface ExpressionConfig`、`interface ExpressionContext`、`type HealthRiskLevel = ...`、`type AnimationType = ...` 定义。

- [ ] **Step 3: 修改 diaryEngine.ts - 删除内联类型，改为从 avatarTypes 导入**

在文件顶部添加：
```typescript
import type { DiaryTone, DiaryEntry, PetHealthEntry, HealthRiskLevel } from '../../types/avatarTypes'
```

删除文件中所有内联的 `type DiaryTone = ...`、`interface DiaryEntry`、`interface PetHealthEntry`、`type HealthRiskLevel = ...` 定义。

- [ ] **Step 4: 修改 svgRenderer.ts - 删除内联类型，改为从 avatarTypes 导入**

在文件顶部添加：
```typescript
import type { PetExpression, PetSpecies, SvgPetFace, AnimationType } from '../../types/avatarTypes'
```

删除文件中所有内联的 `type PetExpression = ...`、`type PetSpecies = ...`、`interface SvgPetFace`、`type AnimationType = ...` 定义。

- [ ] **Step 5: 修改 seedreamAdapter.ts - 删除内联类型，改为从 avatarTypes 导入**

在文件顶部添加：
```typescript
import type { PetSpecies, PetImageParams, SeedreamGenerateResult } from '../../types/avatarTypes'
```

删除文件中所有内联的 `type PetSpecies = ...`、`interface PetImageParams`、`interface SeedreamGenerateResult` 定义。

- [ ] **Step 6: 运行类型检查确认无错误**

Run: `npx tsc --noEmit 2>&1 | Select-String "avatarTypes|expressionEngine|diaryEngine|svgRenderer|seedreamAdapter"`
Expected: 无输出（无错误）

- [ ] **Step 7: 运行现有测试确认无回归**

Run: `npx vitest run src/engines/ 2>&1`
Expected: 所有测试通过

---

### Task 2: 添加头像相关常量

**Files:**
- Modify: `src/constants/index.ts`

- [ ] **Step 1: 在 constants/index.ts 末尾添加头像常量**

```typescript
export const AVATAR_STYLES = {
  q_cute: { label: 'Q萌风', key: 'q_cute' },
  japanese_healing: { label: '日系治愈风', key: 'japanese_healing' },
  american_cartoon: { label: '美式卡通风', key: 'american_cartoon' },
} as const

export const AVATAR_FREE_GENERATIONS = 1
export const AVATAR_MEMBER_GENERATIONS = -1

export const AVATAR_BASE_COLORS = [
  { label: '暖黄', value: '#FFD93D' },
  { label: '奶白', value: '#FFF8E7' },
  { label: '浅棕', value: '#D4A574' },
  { label: '深棕', value: '#8B6914' },
  { label: '灰色', value: '#B0B0B0' },
  { label: '黑色', value: '#333333' },
  { label: '橘色', value: '#FF8C42' },
  { label: '奶油', value: '#FFFDD0' },
] as const

export const ACHIEVEMENT_TYPES = {
  birthday: { title: '生日快乐', subtitle: '毛孩子又长大一岁啦', icon: '🎂', color: '#FF6B9D' },
  vaccine_complete: { title: '疫苗卫士', subtitle: '全部疫苗接种完成', icon: '🛡️', color: '#52C41A' },
  streak_7: { title: '坚持一周', subtitle: '连续打卡7天', icon: '🔥', color: '#FF8C42' },
  streak_30: { title: '月度之星', subtitle: '连续打卡30天', icon: '⭐', color: '#FAAD14' },
  streak_100: { title: '百日守护', subtitle: '连续打卡100天', icon: '💎', color: '#722ED1' },
  rainbow_bridge: { title: '彩虹桥纪念', subtitle: '永远在心中', icon: '🌈', color: '#B37FEB' },
  holiday: { title: '节日快乐', subtitle: '和毛孩子一起过节', icon: '🎄', color: '#F5222D' },
} as const
```

- [ ] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit 2>&1 | Select-String "constants"`
Expected: 无输出

---

### Task 3: 创建头像服务 avatarService

**Files:**
- Create: `src/services/avatarService.ts`
- Create: `src/services/__tests__/avatarService.test.ts`

- [ ] **Step 1: 创建 avatarService.ts**

```typescript
import Taro from '@tarojs/taro'
import { getPetFaceDataUri } from '../engines/petAvatar/svgRenderer'
import { calculateExpression } from '../engines/petAvatar/expressionEngine'
import { generateDiaryEntry } from '../engines/petAvatar/diaryEngine'
import { seedreamAdapter } from '../engines/petAvatar/seedreamAdapter'
import { supabaseClient } from './supabaseClient'
import type { ExpressionContext, AvatarCustomization, PetSpecies, PetImageParams, SeedreamGenerateResult } from '../types/avatarTypes'
import { AVATAR_FREE_GENERATIONS, AVATAR_MEMBER_GENERATIONS } from '../constants'

const STORAGE_KEYS = {
  AVATAR_CUSTOM: 'xhh_avatar_custom',
  AVATAR_GEN_COUNT: 'xhh_avatar_gen_count',
  DIARY_CACHE: 'xhh_diary_cache',
}

export async function generateAvatarImage(
  species: PetSpecies,
  petName: string,
  style: PetImageParams['style'],
  referenceImageUrl?: string,
  baseColor?: string,
): Promise<SeedreamGenerateResult | null> {
  const genCount = getGenerationCount()
  const isMember = await checkMemberStatus()

  if (!isMember && genCount >= AVATAR_FREE_GENERATIONS) {
    return null
  }

  const result = await seedreamAdapter.generatePetImage({
    species,
    petName,
    style,
    referenceImageUrl,
    color: baseColor,
  })

  if (result) {
    incrementGenerationCount()
    await saveAvatarCustomization({
      species,
      style,
      baseColor: baseColor || '#FFD93D',
      generatedAt: new Date().toISOString(),
      cartoonUrl: result.imageUrl,
    })
  }

  return result
}

export function getAvatarFaceUri(
  species: PetSpecies,
  expressionContext: ExpressionContext,
  size: number = 100,
): string {
  const config = calculateExpression(expressionContext)
  return getPetFaceDataUri(config.expression, species, size)
}

export function getPetDiary(
  petName: string,
  expressionContext: ExpressionContext,
): string | null {
  const cached = Taro.getStorageSync(STORAGE_KEYS.DIARY_CACHE)
  if (cached && typeof cached === 'string') {
    const parsed = JSON.parse(cached) as { date: string; text: string }
    if (parsed.date === new Date().toISOString().slice(0, 10)) {
      return parsed.text
    }
  }

  const entry = generateDiaryEntry(expressionContext)
  if (!entry) return null

  const diaryText = `${entry.emoji} "${entry.text}" —— ${petName}`
  Taro.setStorageSync(STORAGE_KEYS.DIARY_CACHE, JSON.stringify({
    date: new Date().toISOString().slice(0, 10),
    text: diaryText,
  }))

  return diaryText
}

export function getAvatarCustomization(): AvatarCustomization | null {
  const stored = Taro.getStorageSync(STORAGE_KEYS.AVATAR_CUSTOM)
  if (!stored) return null
  return stored as AvatarCustomization
}

export async function saveAvatarCustomization(custom: AvatarCustomization): Promise<void> {
  Taro.setStorageSync(STORAGE_KEYS.AVATAR_CUSTOM, custom)
  await supabaseClient.update('pets', {
    avatar_style: custom.style,
    avatar_cartoon_url: custom.cartoonUrl,
    avatar_generated_at: custom.generatedAt,
  }, { id: 'eq.current' })
}

export function getGenerationCount(): number {
  const count = Taro.getStorageSync(STORAGE_KEYS.AVATAR_GEN_COUNT)
  return typeof count === 'number' ? count : 0
}

export function incrementGenerationCount(): void {
  const count = getGenerationCount()
  Taro.setStorageSync(STORAGE_KEYS.AVATAR_GEN_COUNT, count + 1)
}

export function canGenerateAvatar(isMember: boolean): boolean {
  if (isMember) return true
  return getGenerationCount() < AVATAR_FREE_GENERATIONS
}

async function checkMemberStatus(): Promise<boolean> {
  try {
    const { data } = await supabaseClient.selectOne('memberships', {
      user_id: 'eq.current',
      status: 'eq.active',
    })
    return !!data
  } catch {
    return false
  }
}
```

- [ ] **Step 2: 创建 avatarService.test.ts**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const memoryStore = new Map<string, unknown>()

const { mockSelectOne, mockUpdate, mockGeneratePetImage } = vi.hoisted(() => ({
  mockSelectOne: vi.fn<() => Promise<{ data: unknown; error: string | null; status: number }>>(),
  mockUpdate: vi.fn<() => Promise<{ data: unknown; error: string | null; status: number }>>(),
  mockGeneratePetImage: vi.fn<() => Promise<{ imageUrl: string; style: string; generatedAt: string; cost: number } | null>>(),
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    getStorageSync: vi.fn((key: string) => memoryStore.get(key) ?? ''),
    setStorageSync: vi.fn((key: string, value: unknown) => { memoryStore.set(key, value) }),
    removeStorageSync: vi.fn((key: string) => { memoryStore.delete(key) }),
    clearStorageSync: vi.fn(),
    request: vi.fn(() => Promise.resolve({ statusCode: 200, data: {} })),
  },
}))

vi.mock('../supabaseClient', () => ({
  supabaseClient: {
    selectOne: mockSelectOne,
    update: mockUpdate,
    isMock: true,
  },
}))

vi.mock('../../engines/petAvatar/seedreamAdapter', () => ({
  seedreamAdapter: {
    generatePetImage: mockGeneratePetImage,
  },
}))

vi.mock('../../config/supabase', () => ({
  ENV: {
    development: {
      apiBaseUrl: 'http://localhost:3000',
      supabaseUrl: 'http://localhost:54321',
      supabaseKey: 'mock-key',
      useMock: true,
    },
  },
  STORAGE_KEYS: { TOKEN: 'xhh_token' },
}))

vi.mock('../../constants', () => ({
  AVATAR_FREE_GENERATIONS: 1,
  AVATAR_MEMBER_GENERATIONS: -1,
}))

import {
  getGenerationCount,
  canGenerateAvatar,
  getAvatarCustomization,
  saveAvatarCustomization,
  generateAvatarImage,
  getPetDiary,
} from '../avatarService'

describe('avatarService', () => {
  beforeEach(() => {
    memoryStore.clear()
    vi.clearAllMocks()
    mockSelectOne.mockResolvedValue({ data: null, error: null, status: 200 })
    mockUpdate.mockResolvedValue({ data:ResolvedValue({ data: null, error: null, status: 200 })
    mockGeneratePetImage.mockResolvedValue(null)
  })

  describe('getGenerationCount', () => {
    it('returns 0 when no count stored', () => {
      expect(getGenerationCount()).toBe(0)
    })

    it('returns stored count', () => {
      memoryStore.set('xhh_avatar_gen_count', 3)
      expect(getGenerationCount()).toBe(3)
    })
  })

  describe('canGenerateAvatar', () => {
    it('allows member to generate', () => {
      expect(canGenerateAvatar(true)).toBe(true)
    })

    it('allows free user with 0 generations', () => {
      expect(canGenerateAvatar(false)).toBe(true)
    })

    it('blocks free user after using free quota', () => {
      memoryStore.set('xhh_avatar_gen_count', 1)
      expect(canGenerateAvatar(false)).toBe(false)
    })
  })

  describe('getAvatarCustomization', () => {
    it('returns null when no customization stored', () => {
      expect(getAvatarCustomization()).toBeNull()
    })

    it('returns stored customization', () => {
      const custom = { species: 'dog' as const, style: 'q_cute' as const, baseColor: '#FFD93D' }
      memoryStore.set('xhh_avatar_custom', custom)
      expect(getAvatarCustomization()).toEqual(custom)
    })
  })

  describe('saveAvatarCustomization', () => {
    it('saves to local storage and DB', async () => {
      const custom = {
        species: 'cat' as const,
        style: 'japanese_healing' as const,
        baseColor: '#FFF8E7',
        generatedAt: '2025-01-01',
        cartoonUrl: 'https://example.com/avatar.png',
      }
      await saveAvatarCustomization(custom)
      expect(memoryStore.get('xhh_avatar_custom')).toEqual(custom)
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  describe('generateAvatarImage', () => {
    it('returns null when free quota exceeded and not member', async () => {
      memoryStore.set('xhh_avatar_gen_count', 1)
      mockSelectOne.mockResolvedValue({ data: null, error: null, status: 200 })
      const result = await generateAvatarImage('dog', '旺财', 'q_cute')
      expect(result).toBeNull()
      expect(mockGeneratePetImage).not.toHaveBeenCalled()
    })

    it('generates avatar for free user within quota', async () => {
      mockSelectOne.mockResolvedValue({ data: null, error: null, status: 200 })
      mockGeneratePetImage.mockResolvedValue({
        imageUrl: 'https://example.com/avatar.png',
        style: 'q_cute',
        generatedAt: '2025-01-01',
        cost: 0.3,
      })
      const result = await generateAvatarImage('dog', '旺财', 'q_cute')
      expect(result).not.toBeNull()
      expect(result!.imageUrl).toBe('https://example.com/avatar.png')
      expect(getGenerationCount()).toBe(1)
    })
  })

  describe('getPetDiary', () => {
    it('returns cached diary for today', () => {
      const today = new Date().toISOString().slice(0, 10)
      memoryStore.set('xhh_diary_cache', JSON.stringify({ date: today, text: 'cached diary' }))
      const result = getPetDiary('旺财', {})
      expect(result).toBe('cached diary')
    })

    it('generates new diary when no cache', () => {
      const result = getPetDiary('旺财', { streakDays: 7 })
      expect(result).toContain('旺财')
    })
  })
})
```

- [ ] **Step 3: 运行测试确认通过**

Run: `npx vitest run src/services/__tests__/avatarService.test.ts`
Expected: 所有测试通过

---

### Task 4: 添加表情动画系统

**Files:**
- Create: `src/components/PetAvatarAnimations.scss`
- Modify: `src/engines/petAvatar/svgRenderer.ts`
- Modify: `src/components/PetAvatar.tsx`
- Modify: `src/components/PetAvatar.scss`

- [ ] **Step 1: 创建 PetAvatarAnimations.scss**

```scss
@keyframes pet-avatar-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes pet-avatar-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes pet-avatar-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

@keyframes pet-avatar-flash {
  0%, 50%, 100% { opacity: 1; }
  25% { opacity: 0.6; }
}

@keyframes pet-avatar-float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33% { transform: translateY(-4px) rotate(2deg); }
  66% { transform: translateY(-2px) rotate(-1deg); }
}

@keyframes pet-avatar-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.15); }
}

@keyframes pet-avatar-jump {
  0%, 100% { transform: translateY(0) scale(1); }
  40% { transform: translateY(-10px) scale(1.02); }
  60% { transform: translateY(-10px) scale(1.02); }
}

@keyframes pet-avatar-tremble {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-1px, -1px); }
  20% { transform: translate(1px, 0); }
  30% { transform: translate(-1px, 1px); }
  40% { transform: translate(1px, -1px); }
  50% { transform: translate(-1px, 1px); }
  60% { transform: translate(1px, 0); }
  70% { transform: translate(0, -1px); }
  80% { transform: translate(-1px, 0); }
  90% { transform: translate(1px, 1px); }
}

.pet-avatar--animate-bounce { animation: pet-avatar-bounce 1.2s ease-in-out infinite; }
.pet-avatar--animate-pulse { animation: pet-avatar-pulse 2s ease-in-out infinite; }
.pet-avatar--animate-shake { animation: pet-avatar-shake 0.5s ease-in-out infinite; }
.pet-avatar--animate-flash { animation: pet-avatar-flash 1.5s ease-in-out infinite; }
.pet-avatar--animate-float { animation: pet-avatar-float 3s ease-in-out infinite; }
.pet-avatar--animate-glow { animation: pet-avatar-glow 2s ease-in-out infinite; }
.pet-avatar--animate-jump { animation: pet-avatar-jump 1.5s ease-in-out infinite; }
.pet-avatar--animate-tremble { animation: pet-avatar-tremble 0.3s linear infinite; }
```

- [ ] **Step 2: 修改 PetAvatar.tsx - 添加动画class**

在 PetAvatar 组件中，根据 `expression.animation` 添加动画 class：

找到 `<View className={`pet-avatar...`}>` 的外层容器，修改为：
```typescript
const animationClass = expression.animation ? ` pet-avatar--animate-${expression.animation}` : ''

// 在 return 的最外层 View
<View className={`pet-avatar${props.className ? ` ${props.className}` : ''}${animationClass}`}>
```

- [ ] **Step 3: 修改 PetAvatar.scss - 引入动画样式**

在文件顶部添加：
```scss
@import './PetAvatarAnimations.scss';
```

- [ ] **Step 4: 运行类型检查**

Run: `npx tsc --noEmit 2>&1 | Select-String "PetAvatar"`
Expected: 无输出

---

### Task 5: 修复首页 streakDays bug

**Files:**
- Modify: `src/pages/index/index.tsx`

- [ ] **Step 1: 找到首页 PetAvatar 的 expressionContext 构建**

在 `src/pages/index/index.tsx` 中，找到构建 `expressionContext` 的代码。当前代码硬编码 `streakDays: entry ? 1 : 0`。

- [ ] **Step 2: 修复 streakDays 使用实际数据**

需要从 checkin stats 中获取实际的 streak 数据。查看首页是否已有 stats 数据，如果没有，需要从 useCheckin hook 中获取。

修改 expressionContext 构建代码，将 `streakDays: entry ? 1 : 0` 改为使用实际的 streak 数据：
```typescript
streakDays: stats?.streak ?? 0,
```

如果首页没有 stats 数据，需要在首页组件中添加 `const { stats } = useCheckin()` 调用。

- [ ] **Step 3: 运行类型检查确认修复**

Run: `npx tsc --noEmit 2>&1 | Select-String "index/index"`
Expected: 无输出

---

### Task 6: 完善成就卡分享功能

**Files:**
- Modify: `src/components/AchievementCard.tsx`
- Modify: `src/components/AchievementCard.scss`

- [ ] **Step 1: 修改 AchievementCard.tsx - 添加分享功能**

当前 AchievementCard 的"分享"按钮只调用 `onClose`。需要添加实际的分享逻辑：

1. 添加 `shareService` 导入
2. 添加 `handleShare` 方法，调用 `Taro.showShareMenu` 或生成分享卡片
3. 修改分享按钮的 onClick 为 `handleShare`

```typescript
import Taro from '@tarojs/taro'

const handleShare = useCallback(() => {
  Taro.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'] as any,
  })
}, [])
```

将分享按钮的 onClick 从 `onClose` 改为 `handleShare`。

- [ ] **Step 2: 修改 AchievementCard.scss - 添加分享按钮样式**

确保分享按钮有合适的样式（绿色渐变背景，与 VaccineShareCard 的分享按钮风格一致）。

- [ ] **Step 3: 运行类型检查**

Run: `npx tsc --noEmit 2>&1 | Select-String "AchievementCard"`
Expected: 无输出

---

### Task 7: 创建头像定制页面

**Files:**
- Create: `src/pagesPet/avatar-customize/index.tsx`
- Create: `src/pagesPet/avatar-customize/index.scss`
- Modify: `src/app.config.ts`
- Modify: `src/components/index.ts`

- [ ] **Step 1: 创建 avatar-customize/index.tsx**

头像定制页面，包含：
- 当前头像预览（使用 PetAvatar 组件）
- 风格选择（3种风格：Q萌风/日系治愈风/美式卡通风）
- 基础颜色选择（8种颜色）
- 生成按钮（调用 avatarService.generateAvatarImage）
- 会员权益提示（免费1次，会员无限）
- 保存按钮

```typescript
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { PetAvatar } from '../../components'
import { avatarService } from '../../services/avatarService'
import { useMembership } from '../../hooks/useMembership'
import { PaywallPopup } from '../../components'
import type { PetSpecies, PetImageParams, AvatarCustomization } from '../../types/avatarTypes'
import { AVATAR_STYLES, AVATAR_BASE_COLORS, AVATAR_FREE_GENERATIONS } from '../../constants'
import './index.scss'

interface AvatarCustomizeProps {}

export default function AvatarCustomize() {
  const { isMember } = useMembership()
  const [selectedStyle, setSelectedStyle] = useState<PetImageParams['style']>('q_cute')
  const [selectedColor, setSelectedColor] = useState('#FFD93D')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [customization, setCustomization] = useState<AvatarCustomization | null>(
    avatarService.getAvatarCustomization()
  )

  const petInfo = Taro.getStorageSync('xhh_current_pet') as { species: PetSpecies; name: string } | null
  const species = petInfo?.species || 'dog'
  const petName = petInfo?.name || '毛孩子'

  const canGenerate = avatarService.canGenerateAvatar(isMember)
  const genCount = avatarService.getGenerationCount()

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) {
      setShowPaywall(true)
      return
    }

    setIsGenerating(true)
    try {
      const result = await avatarService.generateAvatarImage(
        species,
        petName,
        selectedStyle,
        undefined,
        selectedColor,
      )
      if (result) {
        setCustomization({
          species,
          style: selectedStyle,
          baseColor: selectedColor,
          generatedAt: result.generatedAt,
          cartoonUrl: result.imageUrl,
        })
        Taro.showToast({ title: '头像生成成功', icon: 'success' })
      } else {
        Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '生成失败', icon: 'none' })
    } finally {
      setIsGenerating(false)
    }
  }, [canGenerate, species, petName, selectedStyle, selectedColor])

  return (
    <View className='avatar-customize'>
      <View className='avatar-customize__preview'>
        <PetAvatar
          species={species}
          petName={petName}
          expressionContext={{ isBirthday: false }}
          size={150}
          showLabel
          showDiary
        />
      </View>

      <View className='avatar-customize__section'>
        <Text className='avatar-customize__section-title'>选择风格</Text>
        <View className='avatar-customize__styles'>
          {Object.values(AVATAR_STYLES).map((style) => (
            <View
              key={style.key}
              className={`avatar-customize__style-item${selectedStyle === style.key ? ' avatar-customize__style-item--active' : ''}`}
              onClick={() => setSelectedStyle(style.key)}
            >
              <Text className='avatar-customize__style-label'>{style.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className='avatar-customize__section'>
        <Text className='avatar-customize__section-title'>选择颜色</Text>
        <View className='avatar-customize__colors'>
          {AVATAR_BASE_COLORS.map((color) => (
            <View
              key={color.value}
              className={`avatar-customize__color-item${selectedColor === color.value ? ' avatar-customize__color-item--active' : ''}`}
              style={{ backgroundColor: color.value }}
              onClick={() => setSelectedColor(color.value)}
            >
              {selectedColor === color.value && <Text className='avatar-customize__color-check'>✓</Text>}
            </View>
          ))}
        </View>
      </View>

      <View className='avatar-customize__quota'>
        {!isMember && (
          <Text className='avatar-customize__quota-text'>
            免费生成 {AVATAR_FREE_GENERATIONS - genCount}/{AVATAR_FREE_GENERATIONS} 次 | 会员无限生成
          </Text>
        )}
        {isMember && (
          <Text className='avatar-customize__quota-text avatar-customize__quota-text--member'>
            🌟 会员无限生成
          </Text>
        )}
      </View>

      <View
        className={`avatar-customize__generate${isGenerating ? ' avatar-customize__generate--disabled' : ''}`}
        onClick={isGenerating ? undefined : handleGenerate}
      >
        <Text>{isGenerating ? '生成中...' : '生成头像'}</Text>
      </View>

      {showPaywall && (
        <PaywallPopup
          featureName='avatar_generation'
          onClose={() => setShowPaywall(false)}
        />
      )}
    </View>
  )
}
```

- [ ] **Step 2: 创建 avatar-customize/index.scss**

```scss
.avatar-customize {
  min-height: 100vh;
  padding: 32rpx;
  background: #F5F5F5;

  &__preview {
    display: flex;
    justify-content: center;
    padding: 48rpx 0;
    background: #fff;
    border-radius: 24rpx;
    margin-bottom: 32rpx;
  }

  &__section {
    background: #fff;
    border-radius: 24rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
  }

  &__section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 24rpx;
    display: block;
  }

  &__styles {
    display: flex;
    gap: 20rpx;
  }

  &__style-item {
    flex: 1;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16rpx;
    background: #F0F0F0;
    border: 2rpx solid transparent;
    transition: all 0.2s;

    &--active {
      border-color: #1890ff;
      background: #E6F7FF;
    }
  }

  &__style-label {
    font-size: 26rpx;
    color: #333;
  }

  &__colors {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }

  &__color-item {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4rpx solid transparent;
    transition: all 0.2s;

    &--active {
      border-color: #1890ff;
      transform: scale(1.1);
    }
  }

  &__color-check {
    font-size: 28rpx;
    color: #1890ff;
    font-weight: bold;
  }

  &__quota {
    text-align: center;
    padding: 16rpx 0;
  }

  &__quota-text {
    font-size: 24rpx;
    color: #999;

    &--member {
      color: #FAAD14;
    }
  }

  &__generate {
    height: 96rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 48rpx;
    background: linear-gradient(135deg, #1890ff, #36CFC9);
    color: #fff;
    font-size: 32rpx;
    font-weight: 600;
    margin-top: 32rpx;

    &--disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  }
}
```

- [ ] **Step 3: 在 app.config.ts 中注册路由**

在 pages 数组中添加：
```typescript
'pagesPet/avatar-customize/index',
```

- [ ] **Step 4: 在 components/index.ts 中确认导出**

确认 `PetAvatar`、`PaywallPopup` 已在 components/index.ts 中导出。

- [ ] **Step 5: 运行类型检查**

Run: `npx tsc --noEmit 2>&1 | Select-String "avatar-customize"`
Expected: 无输出

---

### Task 8: 最终验证

**Files:** 无新文件

- [ ] **Step 1: 运行完整类型检查**

Run: `npx tsc --noEmit 2>&1`
Expected: 仅预存在错误（jwt.test.ts Buffer, AchievementCard.test.tsx petAvatar module）

- [ ] **Step 2: 运行全量测试**

Run: `npx vitest run 2>&1`
Expected: 所有测试通过（排除预存在的2个失败文件）

- [ ] **Step 3: 更新看板**

Run: `E:\update-board.bat "E:\星寰海" "宠物头像系统完善" "完成头像类型提取、动画系统、头像服务、定制页面、成就卡分享、首页streakDays修复" "涉及文件列表"`

- [ ] **Step 4: 更新项目记忆**

使用 MCP local-project-memory 记录完成状态。
