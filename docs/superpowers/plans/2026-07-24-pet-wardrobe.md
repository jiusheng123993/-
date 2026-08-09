# 宠物换装(衣橱)功能实施计划

> ⚠️ **已砍（2026-08）**：该功能因产品范围调整被移除，本文件仅作历史归档，不再实施。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有宠物形象系统上新增换装功能，支持 SVG 饰品 5 槽位叠加（免费全用户）+ AI 主题套装生成（会员/付费）。

**Architecture:** 独立衣橱页面（pagesPet/wardrobe），通过 wardrobeStore + wardrobeService 管理状态，后端新增 /api/wardrobe/* RESTful 路由，数据库新增 6 张表 + 2 个扩展字段，SVG 渲染器扩展 outfitLayers 图层叠加。

**Tech Stack:** TypeScript (strict) / Taro / Zustand / PostgreSQL / Express / Seedream API / Vitest

---

## 文件结构

### 新建文件

| 文件 | 职责 |
|------|------|
| `miniapp/src/types/wardrobeTypes.ts` | 换装类型定义（OutfitSlot/Accessory/ThemeSuite/OutfitLayer 等） |
| `miniapp/src/constants/wardrobe.ts` | 槽位枚举/错误码常量 |
| `miniapp/src/data/wardrobe/accessories.ts` | 首批 40 件饰品元数据 |
| `miniapp/src/data/wardrobe/themeSuites.ts` | 首批 10 套主题元数据 |
| `miniapp/src/engines/petAvatar/outfitRenderer.ts` | SVG 饰品图层合成器 |
| `miniapp/src/services/wardrobeService.ts` | 衣橱 API 调用层 |
| `miniapp/src/services/themeSuiteService.ts` | AI 主题生成 API 调用层 |
| `miniapp/src/stores/wardrobeStore.ts` | 衣橱状态（库存/装备/试穿态） |
| `miniapp/src/hooks/useWardrobe.ts` | 衣橱组合式 Hook |
| `miniapp/src/utils/outfitComposition.ts` | 套装组合计算+槽位冲突检测 |
| `miniapp/src/utils/outfitShare.ts` | 套装分享卡片生成 |
| `miniapp/src/pagesPet/wardrobe/index.tsx` | 衣橱主页 |
| `miniapp/src/pagesPet/wardrobe/index.scss` | 衣橱主页样式 |
| `miniapp/src/pagesPet/wardrobe/index.config.ts` | 衣橱页面配置 |
| `miniapp/src/components/Wardrobe/OutfitPreview.tsx` | 5 槽位实时叠加预览 |
| `miniapp/src/components/Wardrobe/AccessoryPicker.tsx` | 饰品选择栏 |
| `miniapp/src/components/Wardrobe/ThemeSuiteGallery.tsx` | AI 主题套装卡片列表 |
| `miniapp/src/components/Wardrobe/MyWardrobe.tsx` | 我的衣橱（已拥有+历史） |
| `miniapp/src/components/Wardrobe/AccessoryUnlockModal.tsx` | 解锁条件弹窗 |
| `miniapp/src/components/Wardrobe/SaveOutfitBar.tsx` | 底部固定栏 |
| `miniapp/src/components/Wardrobe/ThemeSuiteProgress.tsx` | AI 生成进度 |
| `server/src/routes/wardrobe.ts` | /api/wardrobe/* RESTful 路由 |
| `server/src/services/wardrobeService.ts` | 库存/装备/解锁业务逻辑 |
| `server/src/services/themeSuiteService.ts` | 主题 AI 生成编排+内容审核 |
| `server/src/services/accessoryUnlockSvc.ts` | 解锁条件判定 |
| `server/src/services/wardrobeRepository.ts` | 饰品/库存/装备 SQL 封装 |
| `server/src/services/themeSuiteRepository.ts` | 主题任务 SQL 封装 |
| `server/src/services/contentModerationAdapter.ts` | 腾讯云内容安全适配 |
| `server/migrations/004_wardrobe_tables.sql` | 数据库迁移 |

### 修改文件

| 文件 | 改动 |
|------|------|
| `miniapp/src/types/avatarTypes.ts` | 保留现有类型；新增 `outfitSlots?` / `outfitLayers?` 可选字段 |
| `miniapp/src/engines/petAvatar/svgRenderer.ts` | `buildSvgFace` 增加 `outfitLayers?` 参数，渲染末尾按 z-order 叠加 |
| `miniapp/src/components/PetAvatar.tsx` | Props 加 `outfitSlots?`，传递给 svgRenderer，加入 useMemo 依赖 |
| `miniapp/src/pages/pet-profile/index.tsx` | emoji 替换为 PetAvatar 组件 + "换装"入口按钮 |
| `miniapp/src/app.config.ts` | pagesPet 分包加 `wardrobe/index` |
| `miniapp/src/types/avatarTypes.ts` | TaskType 加 `'theme_suite'` |
| `server/src/services/taskQueue.ts` | TaskType 加 `'theme_suite'` |
| `server/src/index.ts` | 注册 wardrobe 路由 |

---

## Task 1: 类型定义与常量

**Files:**
- Create: `miniapp/src/types/wardrobeTypes.ts`
- Create: `miniapp/src/constants/wardrobe.ts`
- Modify: `miniapp/src/types/avatarTypes.ts`
- Test: `miniapp/src/types/wardrobeTypes.test.ts`

- [ ] **Step 1: 写 wardrobeTypes.ts 类型定义**

```typescript
// miniapp/src/types/wardrobeTypes.ts

export type AccessorySlot = 'head' | 'neck' | 'back' | 'body' | 'feet'

export type UnlockSource = 'default' | 'achievement' | 'paid' | 'member'

export type ThemeCategory = 'festival' | 'season' | 'birthday' | 'special'

export type ModerationResult = 'pass' | 'review' | 'block'

export type OutfitSlotMap = Partial<Record<AccessorySlot, string>>

export interface OutfitLayer {
  slot: AccessorySlot
  accessoryId: string | null
  svgPath: string
  zIndex: number
  transform?: string
}

export interface AccessoryDef {
  id: string
  name: string
  slot: AccessorySlot
  svgPath: string
  speciesCompat: PetSpecies[]
  unlockSource: UnlockSource
  unlockCondition: Record<string, unknown>
  sortOrder: number
  isActive: boolean
}

export interface UserAccessoryInventory {
  id: number
  userId: string
  accessoryId: string
  unlockedAt: string
  unlockSource: string
}

export interface PetOutfit {
  petId: string
  outfitSlots: OutfitSlotMap
  updatedAt: string
}

export interface ThemeSuiteDef {
  id: string
  name: string
  category: ThemeCategory
  promptTemplate: string
  festivalDate: string | null
  previewUrl: string | null
  sortOrder: number
  isActive: boolean
}

export interface ThemeSuiteTask {
  id: string
  userId: string
  petId: string
  suiteId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  resultUrl: string | null
  moderationResult: ModerationResult | null
  quotaConsumed: boolean
  retryCount: number
  createdAt: string
  updatedAt: string
}

export interface TryOnHistoryEntry {
  id: number
  userId: string
  petId: string
  outfitSnapshot: OutfitSlotMap
  createdAt: string
}

export interface ThemeQuotaInfo {
  monthlyLimit: number
  usedThisMonth: number
  remaining: number
}

export interface WardrobeError {
  code: string
  message: string
  httpStatus: number
}
```

- [ ] **Step 2: 写 wardrobe.ts 常量**

```typescript
// miniapp/src/constants/wardrobe.ts

export const ACCESSORY_SLOTS = ['head', 'neck', 'back', 'body', 'feet'] as const

export const SLOT_Z_INDEX: Record<AccessorySlot, number> = {
  feet: 1,
  body: 2,
  back: 3,
  neck: 5,
  head: 10,
}

export const SLOT_LABELS: Record<AccessorySlot, string> = {
  head: '头部',
  neck: '颈部',
  back: '背部',
  body: '身体',
  feet: '足部',
}

export const WARDROBE_ERROR_CODES = {
  ACCESSORY_NOT_FOUND: 'WARDROBE_001',
  SLOT_MISMATCH: 'WARDROBE_002',
  SPECIES_INCOMPATIBLE: 'WARDROBE_003',
  NOT_OWNED: 'WARDROBE_010',
  MEMBERSHIP_EXPIRED: 'WARDROBE_011',
  LIMITED_EXPIRED: 'WARDROBE_012',
  NO_BASE_AVATAR: 'WARDROBE_020',
  QUOTA_EXCEEDED: 'WARDROBE_021',
  THEME_INACTIVE: 'WARDROBE_022',
  MODERATION_BLOCKED: 'WARDROBE_023',
  PET_NOT_FOUND: 'WARDROBE_030',
  TASK_NOT_FOUND: 'WARDROBE_031',
  TASK_IN_PROGRESS: 'WARDROBE_040',
  RATE_LIMITED: 'WARDROBE_050',
  SYSTEM_ERROR: 'WARDROBE_099',
} as const

export const MAX_TRY_ON_HISTORY = 20

export const THEME_GENERATION_POLL_INTERVAL = 2000

export const THEME_MAX_RETRIES = 2

export const OUTFIT_SAVE_DEBOUNCE_MS = 300
```

- [ ] **Step 3: 扩展 avatarTypes.ts — 新增可选字段**

在 `avatarTypes.ts` 的 `ExpressionConfig` 接口中新增 `outfitSlots?`，在 `SvgPetFace` 接口中新增 `outfitLayers?`，扩展 `TaskType`：

```typescript
// avatarTypes.ts — 仅展示新增/修改部分

// 在 ExpressionConfig 接口中新增（保留 accessory 不变）:
export interface ExpressionConfig {
  expression: PetExpression
  label: string
  color: string
  eyes: string
  mouth: string
  accessory: string
  animation: AnimationType
  outfitSlots?: OutfitSlotMap  // 新增:可选饰品槽位
}

// 在 SvgPetFace 接口中新增（保留 accessory 不变）:
export interface SvgPetFace {
  body: string
  ears: string
  eyes: string
  mouth: string
  accessory: string
  animation: string
  outfitLayers?: OutfitLayer[]  // 新增:可选饰品图层
}

// TaskType 扩展:
export type TaskType = '2d' | '3d' | 'theme_suite'
```

在文件顶部新增 import：

```typescript
import type { OutfitSlotMap, OutfitLayer } from './wardrobeTypes'
```

- [ ] **Step 4: 写类型测试**

```typescript
// miniapp/src/types/wardrobeTypes.test.ts
import { describe, it, expectTypeOf } from 'vitest'
import type {
  AccessorySlot, UnlockSource, OutfitSlotMap, OutfitLayer,
  AccessoryDef, ThemeSuiteDef, ThemeSuiteTask, ThemeQuotaInfo,
} from './wardrobeTypes'

describe('wardrobeTypes', () => {
  it('AccessorySlot 应为 5 个槽位联合类型', () => {
    type Slots = AccessorySlot
    const slots: Slots[] = ['head', 'neck', 'back', 'body', 'feet']
    expect(slots).toHaveLength(5)
  })

  it('OutfitSlotMap 应允许部分槽位赋值', () => {
    const partial: OutfitSlotMap = { head: 'hat_bowler' }
    const full: OutfitSlotMap = { head: 'hat_bowler', neck: 'scarf_red', back: null, body: null, feet: null }
    expect(partial).toBeDefined()
    expect(full).toBeDefined()
  })

  it('OutfitLayer 应含 slot/accessoryId/svgPath/zIndex', () => {
    const layer: OutfitLayer = {
      slot: 'head',
      accessoryId: 'hat_bowler',
      svgPath: '<g>...</g>',
      zIndex: 10,
    }
    expect(layer.zIndex).toBe(10)
  })
})
```

- [ ] **Step 5: 运行测试确认通过**

Run: `cd e:\星河宠记\03-源代码\小程序\miniapp && npx vitest run src/types/wardrobeTypes.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/types/wardrobeTypes.ts src/constants/wardrobe.ts src/types/avatarTypes.ts src/types/wardrobeTypes.test.ts
git commit -m "feat(wardrobe): add wardrobe type definitions and constants"
```

---

## Task 2: 饰品元数据与 SVG 片段

**Files:**
- Create: `miniapp/src/data/wardrobe/accessories.ts`
- Create: `miniapp/src/data/wardrobe/themeSuites.ts`
- Create: `miniapp/src/data/wardrobe/svgFragments/` (15 个本地 SVG 内嵌文件)
- Test: `miniapp/src/data/wardrobe/accessories.test.ts`

- [ ] **Step 1: 写 accessories.ts 饰品元数据**

文件内容包含 40 件饰品的完整元数据定义，每件含 id/name/slot/svgPath/speciesCompat/unlockSource/unlockCondition/sortOrder/isActive。默认饰品 8 件（每槽位 ~1.6 件），成就 8 件，付费 12 件，会员 12 件。

```typescript
// miniapp/src/data/wardrobe/accessories.ts
import type { AccessoryDef } from '../../types/wardrobeTypes'
import { PetSpecies } from '../../types/avatarTypes'

export const ACCESSORIES: AccessoryDef[] = [
  // ===== 默认饰品(8件) =====
  { id: 'hat_bowler', name: '小礼帽', slot: 'head', svgPath: 'svgFragments/hat_bowler.svg', speciesCompat: [], unlockSource: 'default', unlockCondition: {}, sortOrder: 100, isActive: true },
  { id: 'hat_baseball', name: '棒球帽', slot: 'head', svgPath: 'svgFragments/hat_baseball.svg', speciesCompat: [], unlockSource: 'default', unlockCondition: {}, sortOrder: 101, isActive: true },
  { id: 'scarf_red', name: '红围巾', slot: 'neck', svgPath: 'svgFragments/scarf_red.svg', speciesCompat: [], unlockSource: 'default', unlockCondition: {}, sortOrder: 200, isActive: true },
  { id: 'bell_small', name: '小铃铛', slot: 'neck', svgPath: 'svgFragments/bell_small.svg', speciesCompat: [], unlockSource: 'default', unlockCondition: {}, sortOrder: 201, isActive: true },
  { id: 'backpack_small', name: '小背包', slot: 'back', svgPath: 'svgFragments/backpack_small.svg', speciesCompat: [], unlockSource: 'default', unlockCondition: {}, sortOrder: 300, isActive: true },
  { id: 'tshirt_blue', name: '蓝T恤', slot: 'body', svgPath: 'svgFragments/tshirt_blue.svg', speciesCompat: [], unlockSource: 'default', unlockCondition: {}, sortOrder: 400, isActive: true },
  { id: 'socks_small', name: '小袜子', slot: 'feet', svgPath: 'svgFragments/socks_small.svg', speciesCompat: [], unlockSource: 'default', unlockCondition: {}, sortOrder: 500, isActive: true },
  // ===== 成就饰品(8件) =====
  { id: 'crown_gold', name: '皇冠', slot: 'head', svgPath: 'https://cdn.example.com/wardrobe/crown_gold.svg', speciesCompat: [], unlockSource: 'achievement', unlockCondition: { achievementId: 'streak_30' }, sortOrder: 110, isActive: true },
  { id: 'bow_ribbon', name: '蝴蝶结', slot: 'head', svgPath: 'https://cdn.example.com/wardrobe/bow_ribbon.svg', speciesCompat: [], unlockSource: 'achievement', unlockCondition: { achievementId: 'streak_7' }, sortOrder: 111, isActive: true },
  { id: 'medal_star', name: '勋章', slot: 'neck', svgPath: 'https://cdn.example.com/wardrobe/medal_star.svg', speciesCompat: [], unlockSource: 'achievement', unlockCondition: { achievementId: 'vaccine_complete' }, sortOrder: 210, isActive: true },
  { id: 'chain_star', name: '星之链', slot: 'neck', svgPath: 'https://cdn.example.com/wardrobe/chain_star.svg', speciesCompat: [], unlockSource: 'achievement', unlockCondition: { achievementId: 'streak_100' }, sortOrder: 211, isActive: true },
  { id: 'wings_butterfly', name: '蝴蝶翅膀', slot: 'back', svgPath: 'https://cdn.example.com/wardrobe/wings_butterfly.svg', speciesCompat: [], unlockSource: 'achievement', unlockCondition: { achievementId: 'birthday' }, sortOrder: 310, isActive: true },
  { id: 'balloon_red', name: '气球', slot: 'back', svgPath: 'https://cdn.example.com/wardrobe/balloon_red.svg', speciesCompat: [], unlockSource: 'achievement', unlockCondition: { achievementId: 'streak_7' }, sortOrder: 311, isActive: true },
  { id: 'suit_superhero', name: '超人战衣', slot: 'body', svgPath: 'https://cdn.example.com/wardrobe/suit_superhero.svg', speciesCompat: [], unlockSource: 'achievement', unlockCondition: { achievementId: 'streak_30' }, sortOrder: 410, isActive: true },
  { id: 'shoes_sport', name: '运动鞋', slot: 'feet', svgPath: 'https://cdn.example.com/wardrobe/shoes_sport.svg', speciesCompat: [], unlockSource: 'achievement', unlockCondition: { achievementId: 'streak_7' }, sortOrder: 510, isActive: true },
  // ===== 付费饰品(12件) =====
  { id: 'hat_christmas', name: '圣诞帽', slot: 'head', svgPath: 'https://cdn.example.com/wardrobe/hat_christmas.svg', speciesCompat: [], unlockSource: 'paid', unlockCondition: { price: 600 }, sortOrder: 120, isActive: true },
  { id: 'hat_graduation', name: '学位帽', slot: 'head', svgPath: 'https://cdn.example.com/wardrobe/hat_graduation.svg', speciesCompat: [], unlockSource: 'paid', unlockCondition: { price: 600 }, sortOrder: 121, isActive: true },
  { id: 'hat_lady', name: '淑女帽', slot: 'head', svgPath: 'https://cdn.example.com/wardrobe/hat_lady.svg', speciesCompat: [], unlockSource: 'paid', unlockCondition: { price: 800 }, sortOrder: 122, isActive: true },
  { id: 'scarf_christmas', name: '圣诞围巾', slot: 'neck', svgPath: 'https://cdn.example.com/wardrobe/scarf_christmas.svg', speciesCompat: [], unlockSource: 'paid', unlockCondition: { price: 500 }, sortOrder: 220, isActive: true },
  { id: 'bowtie', name: '领结', slot: 'neck', svgPath: 'https://cdn.example.com/wardrobe/bowtie.svg', speciesCompat: [], unlockSource: 'paid', unlockCondition: { price: 500 }, sortOrder: 221, isActive: true },
  { id: 'necklace_gem', name: '宝石项链', slot: 'neck', svgPath: 'https://cdn.example.com/wardrobe/necklace_gem.svg', speciesCompat: [], unlockSource: 'paid', unlockCondition: { price: 1000 }, sortOrder: 222, isActive: true },
  { id: 'backpack_rocket', name: '火箭背包', slot: 'back', svgPath: 'https://cdn.example.com/wardrobe/backpack_rocket.svg', speciesCompat: [], unlockSource: 'paid', unlockCondition: { price: 1200 }, sortOrder: 320, isActive: true },
  { id: 'guitar_small', name: '小吉他', slot: 'back', svgPath: 'https://cdn.example.com/wardrobe/guitar_small.svg', speciesCompat: [], unlockSource: 'paid', unlockCondition: { price: 800 }, sortOrder: 321, isActive: true },
  { id: 'wings_angel', name: '天使翅膀', slot: 'back', svgPath: 'https://cdn.example.com/wardrobe/wings_angel.svg', speciesCompat: [], unlockSource: 'paid', unlockCondition: { price: 1500 }, sortOrder: 322, isActive: true },
  { id: 'kimono', name: '和服', slot: 'body', svgPath: 'https://cdn.example.com/wardrobe/kimono.svg', speciesCompat: [], unlockSource: 'paid', unlockCondition: { price: 1200 }, sortOrder: 420, isActive: true },
  { id: 'boots_hiking', name: '登山靴', slot: 'feet', svgPath: 'https://cdn.example.com/wardrobe/boots_hiking.svg', speciesCompat: [], unlockSource: 'paid', unlockCondition: { price: 600 }, sortOrder: 520, isActive: true },
  { id: 'shoes_princess', name: '公主鞋', slot: 'feet', svgPath: 'https://cdn.example.com/wardrobe/shoes_princess.svg', speciesCompat: [], unlockSource: 'paid', unlockCondition: { price: 800 }, sortOrder: 521, isActive: true },
  // ===== 会员饰品(12件) =====
  { id: 'horn_unicorn', name: '独角兽角', slot: 'head', svgPath: 'https://cdn.example.com/wardrobe/horn_unicorn.svg', speciesCompat: [], unlockSource: 'member', unlockCondition: {}, sortOrder: 130, isActive: true },
  { id: 'hairpin_sakura', name: '樱花发饰', slot: 'head', svgPath: 'https://cdn.example.com/wardrobe/hairpin_sakura.svg', speciesCompat: [], unlockSource: 'member', unlockCondition: {}, sortOrder: 131, isActive: true },
  { id: 'hat_pumpkin', name: '南瓜帽', slot: 'head', svgPath: 'https://cdn.example.com/wardrobe/hat_pumpkin.svg', speciesCompat: [], unlockSource: 'member', unlockCondition: {}, sortOrder: 132, isActive: true },
  { id: 'ribbon_rainbow', name: '彩虹丝带', slot: 'neck', svgPath: 'https://cdn.example.com/wardrobe/ribbon_rainbow.svg', speciesCompat: [], unlockSource: 'member', unlockCondition: {}, sortOrder: 230, isActive: true },
  { id: 'pendant_moon', name: '月光吊坠', slot: 'neck', svgPath: 'https://cdn.example.com/wardrobe/pendant_moon.svg', speciesCompat: [], unlockSource: 'member', unlockCondition: {}, sortOrder: 231, isActive: true },
  { id: 'scarf_snowflake', name: '雪花围巾', slot: 'neck', svgPath: 'https://cdn.example.com/wardrobe/scarf_snowflake.svg', speciesCompat: [], unlockSource: 'member', unlockCondition: {}, sortOrder: 232, isActive: true },
  { id: 'wings_bat', name: '蝙蝠翼', slot: 'back', svgPath: 'https://cdn.example.com/wardrobe/wings_bat.svg', speciesCompat: [], unlockSource: 'member', unlockCondition: {}, sortOrder: 330, isActive: true },
  { id: 'wings_fairy', name: '精灵翅膀', slot: 'back', svgPath: 'https://cdn.example.com/wardrobe/wings_fairy.svg', speciesCompat: [], unlockSource: 'member', unlockCondition: {}, sortOrder: 331, isActive: true },
  { id: 'wings_dragon', name: '龙翼', slot: 'back', svgPath: 'https://cdn.example.com/wardrobe/wings_dragon.svg', speciesCompat: [], unlockSource: 'member', unlockCondition: {}, sortOrder: 332, isActive: true },
  { id: 'suit_rainbow', name: '彩虹衣', slot: 'body', svgPath: 'https://cdn.example.com/wardrobe/suit_rainbow.svg', speciesCompat: [], unlockSource: 'member', unlockCondition: {}, sortOrder: 430, isActive: true },
  { id: 'suit_starry', name: '星空衣', slot: 'body', svgPath: 'https://cdn.example.com/wardrobe/suit_starry.svg', speciesCompat: [], unlockSource: 'member', unlockCondition: {}, sortOrder: 431, isActive: true },
  { id: 'paws_glow', name: '发光爪套', slot: 'feet', svgPath: 'https://cdn.example.com/wardrobe/paws_glow.svg', speciesCompat: [], unlockSource: 'member', unlockCondition: {}, sortOrder: 530, isActive: true },
]

export function getAccessoriesBySlot(slot: AccessorySlot): AccessoryDef[] {
  return ACCESSORIES.filter(a => a.slot === slot && a.isActive)
}

export function getDefaultAccessories(): AccessoryDef[] {
  return ACCESSORIES.filter(a => a.unlockSource === 'default' && a.isActive)
}

export function getAccessoryById(id: string): AccessoryDef | undefined {
  return ACCESSORIES.find(a => a.id === id && a.isActive)
}
```

- [ ] **Step 2: 写 themeSuites.ts 主题元数据**

```typescript
// miniapp/src/data/wardrobe/themeSuites.ts
import type { ThemeSuiteDef } from '../../types/wardrobeTypes'

export const THEME_SUITES: ThemeSuiteDef[] = [
  { id: 'christmas', name: '圣诞套装', category: 'festival', promptTemplate: 'a cute {species} {breed} wearing a Santa Claus outfit with red hat and white fur trim, Christmas theme, festive, full body, centered, white background, high quality, pet photography', festivalDate: '12-25', previewUrl: null, sortOrder: 100, isActive: true },
  { id: 'spring_festival', name: '新春套装', category: 'festival', promptTemplate: 'a cute {species} {breed} wearing traditional Chinese New Year outfit with red and gold decorations, spring festival theme, festive, full body, centered, white background, high quality, pet photography', festivalDate: null, previewUrl: null, sortOrder: 101, isActive: true },
  { id: 'halloween', name: '万圣套装', category: 'festival', promptTemplate: 'a cute {species} {breed} wearing a Halloween costume with pumpkin and spooky elements, Halloween theme, playful, full body, centered, white background, high quality, pet photography', festivalDate: '10-31', previewUrl: null, sortOrder: 102, isActive: true },
  { id: 'birthday', name: '生日套装', category: 'birthday', promptTemplate: 'a cute {species} {breed} wearing a birthday party hat with colorful confetti and balloons, birthday celebration theme, joyful, full body, centered, white background, high quality, pet photography', festivalDate: null, previewUrl: null, sortOrder: 200, isActive: true },
  { id: 'sakura', name: '樱花和服', category: 'season', promptTemplate: 'a cute {species} {breed} wearing a Japanese kimono with cherry blossom pattern, spring sakura theme, elegant, full body, centered, white background, high quality, pet photography', festivalDate: null, previewUrl: null, sortOrder: 300, isActive: true },
  { id: 'summer_beach', name: '夏日海滩', category: 'season', promptTemplate: 'a cute {species} {breed} wearing a Hawaiian shirt with sunglasses at the beach, summer beach theme, sunny, full body, centered, white background, high quality, pet photography', festivalDate: null, previewUrl: null, sortOrder: 301, isActive: true },
  { id: 'autumn_maple', name: '秋日枫叶', category: 'season', promptTemplate: 'a cute {species} {breed} wearing an autumn scarf surrounded by maple leaves, fall maple theme, cozy, full body, centered, white background, high quality, pet photography', festivalDate: null, previewUrl: null, sortOrder: 302, isActive: true },
  { id: 'winter_snow', name: '冬日雪景', category: 'season', promptTemplate: 'a cute {species} {breed} wearing a warm winter coat and snow boots in a snowy scene, winter snow theme, cozy, full body, centered, white background, high quality, pet photography', festivalDate: null, previewUrl: null, sortOrder: 303, isActive: true },
  { id: 'astronaut', name: '太空探险', category: 'special', promptTemplate: 'a cute {species} {breed} wearing a space astronaut suit with helmet, outer space theme, adventurous, full body, centered, white background, high quality, pet photography', festivalDate: null, previewUrl: null, sortOrder: 400, isActive: true },
  { id: 'hanfu', name: '汉服古风', category: 'special', promptTemplate: 'a cute {species} {breed} wearing traditional Chinese Hanfu with flowing sleeves and elegant patterns, ancient Chinese theme, graceful, full body, centered, white background, high quality, pet photography', festivalDate: null, previewUrl: null, sortOrder: 401, isActive: true },
]

export function getThemeById(id: string): ThemeSuiteDef | undefined {
  return THEME_SUITES.find(t => t.id === id && t.isActive)
}

export function getActiveThemes(): ThemeSuiteDef[] {
  return THEME_SUITES.filter(t => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
}
```

- [ ] **Step 3: 写 7 个默认饰品本地 SVG 内嵌文件**

每个文件导出一个 SVG 字符串常量，对应默认饰品（本地打包）。其余 33 件使用 CDN URL 按需加载。

创建 `miniapp/src/data/wardrobe/svgFragments/` 目录，每个文件如：

```typescript
// miniapp/src/data/wardrobe/svgFragments/hat_bowler.svg.ts
export const SVG_HAT_BOWLER = `<g transform="translate(30, 5)"><ellipse cx="20" cy="8" rx="20" ry="5" fill="#333"/><rect x="10" y="0" width="20" height="8" rx="2" fill="#333"/><ellipse cx="20" cy="0" rx="12" ry="4" fill="#444"/></g>`
```

7 个默认文件：`hat_bowler.svg.ts`, `hat_baseball.svg.ts`, `scarf_red.svg.ts`, `bell_small.svg.ts`, `backpack_small.svg.ts`, `tshirt_blue.svg.ts`, `socks_small.svg.ts`

- [ ] **Step 4: 写饰品元数据测试**

```typescript
// miniapp/src/data/wardrobe/accessories.test.ts
import { describe, it, expect } from 'vitest'
import { ACCESSORIES, getAccessoriesBySlot, getDefaultAccessories, getAccessoryById } from './accessories'
import { getActiveThemes, getThemeById } from './themeSuites'

describe('accessories metadata', () => {
  it('应有 40 件饰品', () => {
    expect(ACCESSORIES).toHaveLength(40)
  })

  it('每件饰品应有合法 slot', () => {
    const validSlots = ['head', 'neck', 'back', 'body', 'feet']
    ACCESSORIES.forEach(a => {
      expect(validSlots).toContain(a.slot)
    })
  })

  it('默认饰品应为 8 件', () => {
    expect(getDefaultAccessories()).toHaveLength(8)
  })

  it('getAccessoriesBySlot 应按槽位筛选', () => {
    const headItems = getAccessoriesBySlot('head')
    headItems.forEach(a => expect(a.slot).toBe('head'))
    expect(headItems.length).toBeGreaterThan(0)
  })

  it('getAccessoryById 应能查找饰品', () => {
    const hat = getAccessoryById('hat_bowler')
    expect(hat).toBeDefined()
    expect(hat!.name).toBe('小礼帽')
  })

  it('所有 id 应唯一', () => {
    const ids = ACCESSORIES.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('themeSuites metadata', () => {
  it('应有 10 套主题', () => {
    expect(getActiveThemes()).toHaveLength(10)
  })

  it('getThemeById 应能查找主题', () => {
    const christmas = getThemeById('christmas')
    expect(christmas).toBeDefined()
    expect(christmas!.category).toBe('festival')
  })
})
```

- [ ] **Step 5: 运行测试**

Run: `cd e:\星河宠记\03-源代码\小程序\miniapp && npx vitest run src/data/wardrobe/accessories.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/data/wardrobe/ src/data/wardrobe/accessories.test.ts
git commit -m "feat(wardrobe): add accessories and theme suites metadata"
```

---

## Task 3: SVG 渲染器扩展 — outfitLayers 图层叠加

**Files:**
- Create: `miniapp/src/engines/petAvatar/outfitRenderer.ts`
- Modify: `miniapp/src/engines/petAvatar/svgRenderer.ts`
- Test: `miniapp/src/engines/petAvatar/outfitRenderer.test.ts`
- Test: `miniapp/src/engines/petAvatar/__tests__/svgRenderer.outfit.test.ts`

- [ ] **Step 1: 写 outfitRenderer.ts 测试**

```typescript
// miniapp/src/engines/petAvatar/outfitRenderer.test.ts
import { describe, it, expect } from 'vitest'
import { composeOutfitLayers, resolveOutfitLayers } from './outfitRenderer'
import type { OutfitLayer, OutfitSlotMap } from '../../types/wardrobeTypes'
import { SLOT_Z_INDEX } from '../../constants/wardrobe'

describe('outfitRenderer', () => {
  const mockLayers: OutfitLayer[] = [
    { slot: 'feet', accessoryId: 'socks_small', svgPath: '<g id="feet"/>', zIndex: 1 },
    { slot: 'body', accessoryId: 'tshirt_blue', svgPath: '<g id="body"/>', zIndex: 2 },
    { slot: 'head', accessoryId: 'hat_bowler', svgPath: '<g id="head"/>', zIndex: 10 },
  ]

  describe('composeOutfitLayers', () => {
    it('应按 zIndex 升序排列并拼接 SVG 片段', () => {
      const result = composeOutfitLayers(mockLayers)
      expect(result).toContain('<g id="feet"/>')
      expect(result).toContain('<g id="body"/>')
      expect(result).toContain('<g id="head"/>')
      const feetPos = result.indexOf('<g id="feet"/>')
      const bodyPos = result.indexOf('<g id="body"/>')
      const headPos = result.indexOf('<g id="head"/>')
      expect(feetPos).toBeLessThan(bodyPos)
      expect(bodyPos).toBeLessThan(headPos)
    })

    it('空数组应返回空字符串', () => {
      expect(composeOutfitLayers([])).toBe('')
    })

    it('应支持 transform 属性', () => {
      const layerWithTransform: OutfitLayer[] = [
        { slot: 'head', accessoryId: 'hat_bowler', svgPath: '<g id="hat"/>', zIndex: 10, transform: 'scale(0.85)' },
      ]
      const result = composeOutfitLayers(layerWithTransform)
      expect(result).toContain('transform="scale(0.85)"')
    })
  })

  describe('resolveOutfitLayers', () => {
    it('应将 OutfitSlotMap 转换为按 zIndex 排序的 OutfitLayer 数组', () => {
      const slots: OutfitSlotMap = {
        head: 'hat_bowler',
        feet: 'socks_small',
      }
      const layers = resolveOutfitLayers(slots, 'dog')
      expect(layers).toHaveLength(2)
      expect(layers[0].slot).toBe('feet')
      expect(layers[1].slot).toBe('head')
    })

    it('猫物种应应用缩放 transform', () => {
      const slots: OutfitSlotMap = { head: 'hat_bowler' }
      const layers = resolveOutfitLayers(slots, 'cat')
      expect(layers[0].transform).toContain('scale')
    })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd e:\星河宠记\03-源代码\小程序\miniapp && npx vitest run src/engines/petAvatar/outfitRenderer.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: 写 outfitRenderer.ts 实现**

```typescript
// miniapp/src/engines/petAvatar/outfitRenderer.ts
import type { OutfitLayer, OutfitSlotMap, AccessorySlot } from '../../types/wardrobeTypes'
import type { PetSpecies } from '../../types/avatarTypes'
import { SLOT_Z_INDEX } from '../../constants/wardrobe'
import { getAccessoryById } from '../../data/wardrobe/accessories'

const CAT_SCALE = 'scale(0.85, 0.9)'

export function composeOutfitLayers(layers: OutfitLayer[]): string {
  if (layers.length === 0) return ''
  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex)
  return sorted.map(layer => {
    const transformAttr = layer.transform ? ` transform="${layer.transform}"` : ''
    return `<g${transformAttr}>${layer.svgPath}</g>`
  }).join('')
}

export function resolveOutfitLayers(slots: OutfitSlotMap, species: PetSpecies): OutfitLayer[] {
  const layers: OutfitLayer[] = []
  for (const [slot, accessoryId] of Object.entries(slots)) {
    if (!accessoryId) continue
    const slotKey = slot as AccessorySlot
    const def = getAccessoryById(accessoryId)
    if (!def) continue
    const transform = species === 'cat' ? CAT_SCALE : undefined
    layers.push({
      slot: slotKey,
      accessoryId,
      svgPath: def.svgPath,
      zIndex: SLOT_Z_INDEX[slotKey],
      transform,
    })
  }
  return layers.sort((a, b) => a.zIndex - b.zIndex)
}
```

- [ ] **Step 4: 运行 outfitRenderer 测试**

Run: `cd e:\星河宠记\03-源代码\小程序\miniapp && npx vitest run src/engines/petAvatar/outfitRenderer.test.ts`
Expected: PASS

- [ ] **Step 5: 写 svgRenderer 扩展测试**

```typescript
// miniapp/src/engines/petAvatar/__tests__/svgRenderer.outfit.test.ts
import { describe, it, expect } from 'vitest'
import { buildSvgFace } from '../svgRenderer'
import type { ExpressionConfig } from '../../../types/avatarTypes'
import type { OutfitLayer } from '../../../types/wardrobeTypes'

const baseExpression: ExpressionConfig = {
  expression: 'happy', label: '开心', color: '#FFD93D',
  eyes: 'happy', mouth: 'smile', accessory: '', animation: 'bounce',
}

describe('svgRenderer outfitLayers', () => {
  it('无 outfitLayers 时应保持原有渲染', () => {
    const svg = buildSvgFace(baseExpression, 'dog', 120)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })

  it('有 outfitLayers 时应在 SVG 末尾叠加图层', () => {
    const layers: OutfitLayer[] = [
      { slot: 'head', accessoryId: 'hat_bowler', svgPath: '<g id="hat_test"/>', zIndex: 10 },
    ]
    const svg = buildSvgFace(baseExpression, 'dog', 120, layers)
    expect(svg).toContain('<g id="hat_test"/>')
  })

  it('outfitLayers 应在 accessory 之后叠加', () => {
    const expressionWithAccessory: ExpressionConfig = {
      ...baseExpression, accessory: 'crown',
    }
    const layers: OutfitLayer[] = [
      { slot: 'body', accessoryId: 'tshirt_blue', svgPath: '<g id="body_test"/>', zIndex: 2 },
    ]
    const svg = buildSvgFace(expressionWithAccessory, 'dog', 120, layers)
    const accessoryPos = svg.indexOf('crown')
    const outfitPos = svg.indexOf('<g id="body_test"/>')
    expect(accessoryPos).toBeGreaterThan(-1)
    expect(outfitPos).toBeGreaterThan(-1)
    expect(accessoryPos).toBeLessThan(outfitPos)
  })
})
```

- [ ] **Step 6: 修改 svgRenderer.ts — 增加 outfitLayers 参数**

在 `buildSvgFace` 函数签名中增加 `outfitLayers?: OutfitLayer[]` 参数，在 SVG 拼接的 `</g></svg>` 之前插入 `composeOutfitLayers(outfitLayers)` 输出。`getPetFaceDataUri` 也同步增加参数透传。

- [ ] **Step 7: 运行 svgRenderer 扩展测试**

Run: `cd e:\星河宠记\03-源代码\小程序\miniapp && npx vitest run src/engines/petAvatar/__tests__/svgRenderer.outfit.test.ts`
Expected: PASS

- [ ] **Step 8: 运行现有 svgRenderer 测试确保无回归**

Run: `cd e:\星河宠记\03-源代码\小程序\miniapp && npx vitest run src/engines/petAvatar/__tests__/svgRenderer.test.ts`
Expected: PASS（原有测试仍通过）

- [ ] **Step 9: Commit**

```bash
git add src/engines/petAvatar/outfitRenderer.ts src/engines/petAvatar/svgRenderer.ts src/engines/petAvatar/outfitRenderer.test.ts src/engines/petAvatar/__tests__/svgRenderer.outfit.test.ts
git commit -m "feat(wardrobe): extend SVG renderer with outfitLayers support"
```

---

## Task 4: PetAvatar 组件扩展 + pet-profile 页面入口

**Files:**
- Modify: `miniapp/src/components/PetAvatar.tsx`
- Modify: `miniapp/src/pages/pet-profile/index.tsx`
- Modify: `miniapp/src/app.config.ts`
- Test: `miniapp/src/components/__tests__/PetAvatar.outfit.test.tsx`

- [ ] **Step 1: 写 PetAvatar outfit 测试**

```typescript
// miniapp/src/components/__tests__/PetAvatar.outfit.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import PetAvatar from '../PetAvatar'
import type { ExpressionContext } from '../../types/avatarTypes'
import type { OutfitSlotMap } from '../../types/wardrobeTypes'

const mockContext: ExpressionContext = {
  todayEntry: null, hasAnomaly: false, anomalyCount: 0,
  riskLevel: null, streakDays: 0, isBirthday: false,
  isVaccineComplete: false, isRecovery: false, isDeceased: false,
}

describe('PetAvatar with outfit', () => {
  it('无 outfitSlots 时应正常渲染', () => {
    const { container } = render(
      <PetAvatar species="dog" petName="Buddy" expressionContext={mockContext} />
    )
    expect(container.querySelector('img')).toBeTruthy()
  })

  it('有 outfitSlots 时应传递给渲染器', () => {
    const outfitSlots: OutfitSlotMap = { head: 'hat_bowler' }
    const { container } = render(
      <PetAvatar species="dog" petName="Buddy" expressionContext={mockContext} outfitSlots={outfitSlots} />
    )
    expect(container.querySelector('img')).toBeTruthy()
  })
})
```

- [ ] **Step 2: 修改 PetAvatar.tsx — 增加 outfitSlots Props**

在 `PetAvatarProps` 中增加 `outfitSlots?: OutfitSlotMap`，在 `useMemo` 的依赖数组中加入 `outfitSlots`，在调用 `getPetFaceDataUri` 时传入 `resolveOutfitLayers(outfitSlots, species)` 的结果。

- [ ] **Step 3: 修改 pet-profile/index.tsx — 替换 emoji + 加入口**

将 emoji 显示区域替换为 `<PetAvatar>` 组件，传入 `outfitSlots={currentPet?.outfitSummary as OutfitSlotMap | undefined}`。在"形象定制"入口旁新增"换装"入口按钮，跳转 `/pagesPet/wardrobe/index`。

- [ ] **Step 4: 修改 app.config.ts — 加路由**

在 pagesPet 分包 pages 数组末尾加 `'wardrobe/index'`。

- [ ] **Step 5: 创建衣橱页面配置文件**

```typescript
// miniapp/src/pagesPet/wardrobe/index.config.ts
export default definePageConfig({ navigationBarTitleText: '宠物衣橱' })
```

- [ ] **Step 6: 运行测试确认通过**

Run: `cd e:\星河宠记\03-源代码\小程序\miniapp && npx vitest run src/components/__tests__/PetAvatar.outfit.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/PetAvatar.tsx src/pages/pet-profile/ src/app.config.ts src/pagesPet/wardrobe/index.config.ts src/components/__tests__/PetAvatar.outfit.test.tsx
git commit -m "feat(wardrobe): extend PetAvatar with outfitSlots and add wardrobe entry"
```

---

## Task 5: 后端数据库迁移

**Files:**
- Create: `server/migrations/004_wardrobe_tables.sql`
- Test: `server/src/services/wardrobeRepository.test.ts`（手动验证迁移）

- [ ] **Step 1: 创建迁移脚本**

文件内容为设计文档 5.1 节的完整 DDL（已在审查中补全），包含 6 张表 + 1 个索引 + 1 个触发器 + 1 个 CHECK 约束迁移 + pet_profiles 扩展字段。

- [ ] **Step 2: 在开发环境执行迁移**

Run: `cd e:\星河宠记\03-源代码\server && npx tsx src/migrate.ts`
Expected: 所有表创建成功

- [ ] **Step 3: Commit**

```bash
git add migrations/004_wardrobe_tables.sql
git commit -m "feat(wardrobe): add database migration for wardrobe tables"
```

---

## Task 6: 后端 Repository 层

**Files:**
- Create: `server/src/services/wardrobeRepository.ts`
- Create: `server/src/services/themeSuiteRepository.ts`
- Test: `server/src/services/wardrobeRepository.test.ts`

- [ ] **Step 1: 写 wardrobeRepository 测试**

测试以下函数：
- `getAccessories(slot?)` — 获取饰品列表
- `getUserInventory(userId)` — 获取用户库存
- `grantDefaultAccessories(userId)` — 授予默认饰品
- `unlockAccessory(userId, accessoryId, source)` — 解锁饰品
- `getPetOutfit(petId)` — 获取宠物装备
- `upsertPetOutfit(petId, outfitSlots)` — 保存装备
- `resetPetOutfit(petId)` — 还原默认
- `ownsAccessory(userId, accessoryId)` — 校验拥有权
- `recordTryOn(userId, petId, snapshot)` — 记录试穿
- `getTryOnHistory(userId, limit, offset)` — 获取试穿历史

- [ ] **Step 2: 运行测试确认失败**

Run: `cd e:\星河宠记\03-源代码\server && npx vitest run src/services/wardrobeRepository.test.ts`
Expected: FAIL

- [ ] **Step 3: 写 wardrobeRepository.ts 实现**

使用 `pool.query` 封装所有 SQL 操作，关键函数包含归属校验（WHERE user_id = $1）、并发保护（SELECT FOR UPDATE）、参数化查询（防注入）。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd e:\星河宠记\03-源代码\server && npx vitest run src/services/wardrobeRepository.test.ts`
Expected: PASS

- [ ] **Step 5: 写 themeSuiteRepository 测试+实现**

测试+实现以下函数：
- `getActiveThemes()` — 获取可用主题
- `getThemeById(id)` — 查找主题
- `createThemeTask(userId, petId, suiteId)` — 创建任务
- `getThemeTask(taskId, userId)` — 查询任务（含 userId 校验）
- `updateThemeTaskStatus(taskId, status, result?)` — 更新状态
- `getActiveTaskByPet(petId)` — 查询进行中任务
- `getThemeHistory(userId, limit, offset)` — 历史记录

- [ ] **Step 6: 运行测试确认通过**

- [ ] **Step 7: Commit**

```bash
git add src/services/wardrobeRepository.ts src/services/themeSuiteRepository.ts src/services/wardrobeRepository.test.ts
git commit -m "feat(wardrobe): add repository layer for wardrobe data access"
```

---

## Task 7: 后端 Service 层 + Adapter

**Files:**
- Create: `server/src/services/wardrobeService.ts`
- Create: `server/src/services/themeSuiteService.ts`
- Create: `server/src/services/accessoryUnlockSvc.ts`
- Create: `server/src/services/contentModerationAdapter.ts`
- Modify: `server/src/services/taskQueue.ts` — TaskType 扩展
- Test: `server/src/services/wardrobeService.test.ts`

- [ ] **Step 1: 写 wardrobeService 测试**

测试关键业务逻辑：
- `saveOutfit(userId, petId, slots)` — 校验归属+拥有权+槽位匹配后保存
- `resetOutfit(userId, petId)` — 校验归属后还原
- `unlockAccessory(userId, accessoryId, source)` — 校验条件后解锁
- `getInventory(userId)` — 首次访问自动授予默认饰品

- [ ] **Step 2: 运行测试确认失败**

- [ ] **Step 3: 写 wardrobeService.ts 实现**

核心安全逻辑：
- 保存装备时校验 `petId` 归属 + 每个饰品的拥有权 + 槽位匹配 + 物种兼容
- 使用 `SELECT FOR UPDATE` 防并发
- 返回标准化 WardrobeError

- [ ] **Step 4: 写 accessoryUnlockSvc.ts 实现**

判定解锁条件：
- `default` → 自动授予
- `achievement` → 查询用户成就记录
- `paid` → 查询支付订单
- `member` → 查询会员状态

- [ ] **Step 5: 写 themeSuiteService.ts 实现**

AI 主题生成编排：
- `createTask(userId, petId, suiteId)` — 校验会员+配额+基础形象 → 原子扣减配额 → 创建任务
- `runGeneration(taskId)` — 读取宠物现照 → seedream 生成 → 内容审核 → 保存/重试/退款
- `applyTheme(userId, petId, taskId)` — 校验审核通过 → 更新 pet_profiles.theme_suite_url

- [ ] **Step 6: 写 contentModerationAdapter.ts 实现**

腾讯云图片内容安全 API 调用，返回 pass/review/block。

- [ ] **Step 7: 修改 taskQueue.ts — TaskType 扩展**

```typescript
export type TaskType = '2d' | '3d' | 'theme_suite'
```

- [ ] **Step 8: 运行所有后端测试确认通过**

Run: `cd e:\星河宠记\03-源代码\server && npx vitest run`
Expected: ALL PASS

- [ ] **Step 9: Commit**

```bash
git add src/services/wardrobeService.ts src/services/themeSuiteService.ts src/services/accessoryUnlockSvc.ts src/services/contentModerationAdapter.ts src/services/taskQueue.ts src/services/wardrobeService.test.ts
git commit -m "feat(wardrobe): add service layer with business logic and content moderation"
```

---

## Task 8: 后端路由层

**Files:**
- Create: `server/src/routes/wardrobe.ts`
- Modify: `server/src/index.ts` — 注册路由
- Test: `server/src/routes/wardrobe.test.ts`

- [ ] **Step 1: 写路由测试**

测试所有 12 个端点的正常场景和错误场景，重点验证：
- 未登录返回 401
- 越权操作返回 403
- 参数校验失败返回 400
- 配额超限返回 403

- [ ] **Step 2: 运行测试确认失败**

- [ ] **Step 3: 写 wardrobe.ts 路由实现**

使用 Express Router，所有路由挂 `authMiddleware`。12 个端点按设计文档 6.1-6.4 节定义。请求参数校验使用白名单+正则。

- [ ] **Step 4: 修改 index.ts — 注册路由**

```typescript
import wardrobeRoutes from './routes/wardrobe.js'
app.use('/api/wardrobe', wardrobeRoutes)
```

- [ ] **Step 5: 运行测试确认通过**

- [ ] **Step 6: 运行后端安全测试**

Run: `cd e:\星河宠记\03-源代码\server && npx vitest run src/routes/wardrobe.test.ts`
Expected: PASS — 安全边界校验通过

- [ ] **Step 7: Commit**

```bash
git add src/routes/wardrobe.ts src/index.ts src/routes/wardrobe.test.ts
git commit -m "feat(wardrobe): add wardrobe REST API routes with auth and validation"
```

---

## Task 9: 前端 Service 层

**Files:**
- Create: `miniapp/src/services/wardrobeService.ts`
- Create: `miniapp/src/services/themeSuiteService.ts`
- Create: `miniapp/src/utils/outfitComposition.ts`
- Test: `miniapp/src/services/__tests__/wardrobeService.test.ts`

- [ ] **Step 1: 写 wardrobeService 测试**

测试 API 调用函数（mock HTTP 层）：
- `fetchAccessories(slot?)` → GET /api/wardrobe/accessories
- `fetchInventory()` → GET /api/wardrobe/inventory
- `unlockAccessory(accessoryId, source)` → POST /api/wardrobe/accessory/unlock
- `fetchOutfit(petId)` → GET /api/wardrobe/outfit/:petId
- `saveOutfit(petId, slots)` → POST /api/wardrobe/outfit
- `resetOutfit(petId)` → POST /api/wardrobe/outfit/reset
- `recordTryOn(petId, snapshot)` → POST /api/wardrobe/try-on/record
- `fetchTryOnHistory(limit, offset)` → GET /api/wardrobe/try-on/history

- [ ] **Step 2: 运行测试确认失败**

- [ ] **Step 3: 写 wardrobeService.ts 实现**

使用现有 `request` 封装层（来自 `services/api.ts`），所有调用走统一拦截器。

- [ ] **Step 4: 写 themeSuiteService.ts 实现**

- `fetchThemes()` → GET /api/wardrobe/themes
- `fetchQuota()` → GET /api/wardrobe/themes/quota
- `createThemeTask(petId, suiteId)` → POST /api/wardrobe/themes/generate
- `pollTaskProgress(taskId)` → 轮询 GET /api/wardrobe/themes/task/:taskId
- `fetchThemeHistory(limit, offset)` → GET /api/wardrobe/themes/history
- `applyTheme(petId, taskId)` → POST /api/wardrobe/themes/apply

- [ ] **Step 5: 写 outfitComposition.ts 工具函数**

- `validateOutfitSlots(slots)` — 校验槽位+饰品匹配
- `detectSlotConflicts(layers)` — 检测槽位冲突
- `getOutfitSummary(slots)` — 生成装备摘要文本

- [ ] **Step 6: 运行测试确认通过**

- [ ] **Step 7: Commit**

```bash
git add src/services/wardrobeService.ts src/services/themeSuiteService.ts src/utils/outfitComposition.ts src/services/__tests__/wardrobeService.test.ts
git commit -m "feat(wardrobe): add frontend service layer and utility functions"
```

---

## Task 10: 前端 Store + Hook

**Files:**
- Create: `miniapp/src/stores/wardrobeStore.ts`
- Create: `miniapp/src/hooks/useWardrobe.ts`
- Test: `miniapp/src/stores/__tests__/wardrobeStore.test.ts`

- [ ] **Step 1: 写 wardrobeStore 测试**

测试状态管理逻辑：
- 初始状态：空库存/空装备/非试穿态
- `fetchInventory()` — 加载库存
- `equipAccessory(slot, accessoryId)` — 本地试穿（即时预览）
- `unequipAccessory(slot)` — 卸下饰品
- `saveOutfit()` — 提交后端保存
- `resetOutfit()` — 还原默认
- 试穿态与保存态分离

- [ ] **Step 2: 运行测试确认失败**

- [ ] **Step 3: 写 wardrobeStore.ts 实现**

使用 Zustand create，状态包含：
- `inventory: UserAccessoryInventory[]`
- `currentOutfit: PetOutfit | null`
- `tryOnSlots: OutfitSlotMap` (试穿态，本地即时)
- `isLoading: boolean`
- `error: string | null`

Actions：
- `fetchInventory()`
- `equipAccessory(slot, accessoryId)` — 更新 tryOnSlots
- `unequipAccessory(slot)` — 清除 tryOnSlots 对应槽位
- `saveOutfit()` — tryOnSlots → wardrobeService.saveOutfit → 更新 currentOutfit
- `resetOutfit()` — 清空 tryOnSlots + 调用 wardrobeService.resetOutfit

- [ ] **Step 4: 写 useWardrobe.ts Hook**

组合 wardrobeStore + wardrobeService + themeSuiteService，提供：
- `outfitSlots` — 当前装备（优先试穿态）
- `isDirty` — 试穿态与保存态是否不同
- `equipAccessory` / `unequipAccessory` / `saveOutfit` / `resetOutfit`
- `themeTasks` — AI 主题任务状态
- `quotaInfo` — 配额信息

- [ ] **Step 5: 运行测试确认通过**

- [ ] **Step 6: Commit**

```bash
git add src/stores/wardrobeStore.ts src/hooks/useWardrobe.ts src/stores/__tests__/wardrobeStore.test.ts
git commit -m "feat(wardrobe): add wardrobe store and composable hook"
```

---

## Task 11: 前端 UI 组件（7 个 Wardrobe 组件）

**Files:**
- Create: `miniapp/src/components/Wardrobe/OutfitPreview.tsx`
- Create: `miniapp/src/components/Wardrobe/AccessoryPicker.tsx`
- Create: `miniapp/src/components/Wardrobe/ThemeSuiteGallery.tsx`
- Create: `miniapp/src/components/Wardrobe/MyWardrobe.tsx`
- Create: `miniapp/src/components/Wardrobe/AccessoryUnlockModal.tsx`
- Create: `miniapp/src/components/Wardrobe/SaveOutfitBar.tsx`
- Create: `miniapp/src/components/Wardrobe/ThemeSuiteProgress.tsx`
- Test: `miniapp/src/components/Wardrobe/__tests__/` (7 个测试文件)

- [ ] **Step 1: 写 OutfitPreview 组件 + 测试**

5 槽位实时叠加预览组件。使用 PetAvatar + outfitSlots 渲染，下方 5 个槽位徽章，已装备显示金色脉冲。

- [ ] **Step 2: 写 AccessoryPicker 组件 + 测试**

饰品选择栏。横向滚动槽位筛选 + 4 列网格。4 种状态视觉。点击已拥有调用 `equipAccessory`，点击锁定弹出 `AccessoryUnlockModal`。

- [ ] **Step 3: 写 ThemeSuiteGallery 组件 + 测试**

AI 主题套装卡片列表。配额提示 + 主题卡片 + 状态流转（可用→生成中→已完成）。

- [ ] **Step 4: 写 MyWardrobe 组件 + 测试**

饰品统计 + 试穿历史时间线 + 已生成主题网格。

- [ ] **Step 5: 写 AccessoryUnlockModal 组件 + 测试**

解锁条件弹窗。按 unlockSource 显示不同内容：成就→跳转任务页 / 付费→微信支付 / 会员→PaywallPopup。

- [ ] **Step 6: 写 SaveOutfitBar 组件 + 测试**

底部固定栏。还原默认 / 保存形象 / 分享。isDirty 时保存按钮高亮。

- [ ] **Step 7: 写 ThemeSuiteProgress 组件 + 测试**

AI 生成进度展示。复用现有 GenerationProgress 组件的样式，增加轮询逻辑。

- [ ] **Step 8: 运行所有组件测试**

Run: `cd e:\星河宠记\03-源代码\小程序\miniapp && npx vitest run src/components/Wardrobe/`
Expected: ALL PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/Wardrobe/
git commit -m "feat(wardrobe): add all 7 wardrobe UI components"
```

---

## Task 12: 衣橱主页面

**Files:**
- Create: `miniapp/src/pagesPet/wardrobe/index.tsx`
- Create: `miniapp/src/pagesPet/wardrobe/index.scss`
- Test: `miniapp/src/pagesPet/wardrobe/index.test.tsx`

- [ ] **Step 1: 写衣橱页面测试**

测试 3 Tab 切换、组件组合、导航返回。

- [ ] **Step 2: 写衣橱页面实现**

页面结构：顶部导航 + OutfitPreview + Tab 栏 + Tab 内容区 + SaveOutfitBar。3 Tab：饰品库(AccessoryPicker) / 主题套装(ThemeSuiteGallery) / 我的衣橱(MyWardrobe)。

- [ ] **Step 3: 写衣橱页面样式**

温馨渐变主题，4px 间距体系，BEM 类名。

- [ ] **Step 4: 运行测试确认通过**

- [ ] **Step 5: 运行全量测试确认无回归**

Run: `cd e:\星河宠记\03-源代码\小程序\miniapp && npx vitest run`
Expected: ALL PASS

- [ ] **Step 6: Commit**

```bash
git add src/pagesPet/wardrobe/
git commit -m "feat(wardrobe): add wardrobe main page with 3 tabs"
```

---

## Task 13: 集成测试 + 后端安全审查

**Files:**
- Create: `server/src/routes/wardrobe.security.test.ts`
- Test: 全量测试

- [ ] **Step 1: 写后端安全测试**

逐接口验证设计文档第 10 节安全边界：
- 越权装备他人饰品 → 403
- 跨宠物修改装备 → 403
- 非会员调用 AI → 403
- 未支付就装备 → 403
- Prompt 注入 → 400
- 装备数据篡改 → 400
- SQL 注入尝试 → 参数化查询防护

- [ ] **Step 2: 运行全量后端测试**

Run: `cd e:\星河宠记\03-源代码\server && npx vitest run`
Expected: ALL PASS

- [ ] **Step 3: 运行全量前端测试**

Run: `cd e:\星河宠记\03-源代码\小程序\miniapp && npx vitest run`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add src/routes/wardrobe.security.test.ts
git commit -m "test(wardrobe): add security integration tests for all API endpoints"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** 设计文档 1-15 节全部覆盖
  - §1 需求概述 → Task 1-12
  - §2 架构映射 → Task 1-8, 9-12
  - §3 数据流 → Task 9-10
  - §4 UI 交互 → Task 11-12
  - §5 数据库 → Task 5-6
  - §6 API 契约 → Task 7-8
  - §7 SVG 渲染 → Task 3
  - §8 AI 生成 → Task 7, 9
  - §9 数据一致性 → Task 5-7
  - §10 安全边界 → Task 13
  - §11 错误处理 → Task 7-9
  - §12 性能 → Task 3 (懒加载)
  - §13-14 预设 → Task 2
  - §15 审查记录 → 已在设计文档中
- [x] **Placeholder scan:** 无 TBD/TODO/implement later
- [x] **Type consistency:** OutfitSlotMap/OutfitLayer/AccessorySlot 等类型在所有 Task 中使用一致命名
