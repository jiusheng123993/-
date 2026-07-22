# 分享裂变闭环 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 实现分享裂变完整闭环——分享卡片可生成可保存/可转发的图片、朋友圈分享API接入、分享路径携带邀请码、奖励发放逻辑闭环、邀请码入口UI、NPS after_share/after_export触发。

**Architecture:** 在已有 shareService/npsService 基础上，新增 shareStore (Zustand) 统一管理分享状态，新增 shareCanvasRenderer 复用 reportCanvasRenderer 的 Canvas 2D 绘制模式生成分享图片，重构现有分享卡片组件集成 Canvas 生成能力，在页面层接入 onShareTimeline + 邀请码路径参数，在 mine 页面新增邀请码入口。

**Tech Stack:** Taro 3.x + React + TypeScript + Zustand + Canvas 2D API + Supabase REST API

---

## File Structure

| 文件 | 职责 | 操作 |
|------|------|------|
| `src/stores/shareStore.ts` | 分享状态管理（邀请码、分享统计、奖励状态） | 新建 |
| `src/stores/__tests__/shareStore.test.ts` | shareStore 测试 | 新建 |
| `src/utils/shareCanvasRenderer.ts` | 分享卡片 Canvas 渲染器（4种卡片类型） | 新建 |
| `src/utils/__tests__/shareCanvasRenderer.test.ts` | shareCanvasRenderer 测试 | 新建 |
| `src/components/FoodShareCard.tsx` | 食物分享卡片（集成Canvas生成+保存/分享按钮） | 修改 |
| `src/components/HealthTrendShareCard.tsx` | 健康趋势分享卡片（集成Canvas生成+保存/分享按钮） | 修改 |
| `src/components/VaccineShareCard.tsx` | 疫苗分享卡片（集成Canvas生成+保存/分享按钮） | 修改 |
| `src/components/AchievementShareCard.tsx` | 成就分享卡片（新组件，Canvas生成+保存/分享按钮） | 新建 |
| `src/components/AchievementShareCard.scss` | 成就分享卡片样式 | 新建 |
| `src/components/__tests__/AchievementShareCard.test.tsx` | 成就分享卡片测试 | 新建 |
| `src/components/index.ts` | 导出 AchievementShareCard | 修改 |
| `src/services/shareService.ts` | 新增 grantShareReward 函数 | 修改 |
| `src/services/__tests__/shareService.test.ts` | grantShareReward 测试 | 修改 |
| `src/pages/mine/index.tsx` | 新增邀请码入口菜单项 | 修改 |
| `src/pages/mine/index.scss` | 邀请码入口样式 | 修改 |
| `src/pagesUser/invite/index.tsx` | 邀请好友页面 | 新建 |
| `src/pagesUser/invite/index.scss` | 邀请好友页面样式 | 新建 |
| `src/pagesPet/trends/index.tsx` | 接入 onShareTimeline + 邀请码路径 + NPS after_export | 修改 |
| `src/pagesPet/food-query/index.tsx` | 接入 onShareTimeline + 邀请码路径 + NPS after_share | 修改 |
| `src/pagesPet/vaccine/index.tsx` | 接入 onShareTimeline + 邀请码路径 + NPS after_share | 修改 |
| `src/pagesPet/checkin/index.tsx` | 接入 onShareTimeline + 邀请码路径 | 修改 |
| `src/pagesPet/symptom-check/index.tsx` | 接入 onShareTimeline + 邀请码路径 | 修改 |
| `src/types/shareTypes.ts` | 新增 ShareRewardResult 类型 | 修改 |

---

### Task 1: 创建 shareStore (Zustand)

**Files:**
- Create: `src/stores/shareStore.ts`
- Create: `src/stores/__tests__/shareStore.test.ts`
- Modify: `src/types/shareTypes.ts` (新增 ShareRewardResult 类型)

- [x] **Step 1: 在 shareTypes.ts 新增 ShareRewardResult 类型**

```typescript
// 追加到 src/types/shareTypes.ts 末尾

export interface ShareRewardResult {
  rewardGranted: boolean;
  rewardType: 'membership_days' | 'feature_unlock' | 'none';
  rewardValue: number;
  message: string;
}
```

- [x] **Step 2: 写 shareStore 测试**

```typescript
// src/stores/__tests__/shareStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useShareStore } from '../shareStore'

const mockGetOrCreateInviteCode = vi.fn()
const mockGetShareStats = vi.fn()
const mockRecordShare = vi.fn()
const mockGrantShareReward = vi.fn()

vi.mock('../../services/shareService', () => ({
  getOrCreateInviteCode: mockGetOrCreateInviteCode,
  getShareStats: mockGetShareStats,
  recordShare: mockRecordShare,
  grantShareReward: mockGrantShareReward,
}))

describe('shareStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useShareStore.setState({
      inviteCode: '',
      shareStats: null,
      isLoading: false,
      error: null,
    })
  })

  it('初始状态正确', () => {
    const state = useShareStore.getState()
    expect(state.inviteCode).toBe('')
    expect(state.shareStats).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('fetchInviteCode 成功获取邀请码', async () => {
    mockGetOrCreateInviteCode.mockResolvedValue('ABC123')
    await useShareStore.getState().fetchInviteCode('user-1')
    expect(useShareStore.getState().inviteCode).toBe('ABC123')
    expect(mockGetOrCreateInviteCode).toHaveBeenCalledWith('user-1')
  })

  it('fetchInviteCode 失败设置 error', async () => {
    mockGetOrCreateInviteCode.mockRejectedValue(new Error('网络错误'))
    await useShareStore.getState().fetchInviteCode('user-1')
    expect(useShareStore.getState().error).toBe('网络错误')
    expect(useShareStore.getState().inviteCode).toBe('')
  })

  it('fetchShareStats 成功获取统计', async () => {
    const mockStats = {
      totalShares: 5,
      foodShares: 2,
      trendShares: 1,
      vaccineShares: 1,
      achievementShares: 1,
      totalInvites: 3,
      successfulInvites: 1,
    }
    mockGetShareStats.mockResolvedValue(mockStats)
    await useShareStore.getState().fetchShareStats('user-1')
    expect(useShareStore.getState().shareStats).toEqual(mockStats)
  })

  it('recordShareAction 成功记录分享', async () => {
    mockRecordShare.mockResolvedValue({ id: '1', userId: 'user-1', cardType: 'food', petId: 'pet-1', sharedAt: '2025-01-01', platform: 'wechat', inviteCode: 'ABC' })
    await useShareStore.getState().recordShareAction('user-1', 'food', 'pet-1', 'wechat')
    expect(mockRecordShare).toHaveBeenCalledWith('user-1', 'food', 'pet-1', 'wechat')
  })

  it('checkAndGrantReward 成功邀请数达标时发放奖励', async () => {
    useShareStore.setState({
      shareStats: {
        totalShares: 5,
        foodShares: 2,
        trendShares: 1,
        vaccineShares: 1,
        achievementShares: 1,
        totalInvites: 3,
        successfulInvites: 3,
      },
    })
    mockGrantShareReward.mockResolvedValue({
      rewardGranted: true,
      true,
      rewardType:         'membership_days',
      rewardValue:        7,
      message:            '邀请3位好友，奖励7天会员',
    })
    const result = await useShareStore.getState().checkAndGrantReward('user-1')
    expect(result?.rewardGranted).toBe(true)
    expect(mockGrantShareReward).toHaveBeenCalledWith('user-1')
  })

  it('clearError 清除错误', () => {
    useShareStore.setState({ error: 'some error' })
    useShareStore.getState().clearError()
    expect(useShareStore.getState().error).toBeNull()
  })
})
```

- [x] **Step 3: 运行测试确认失败**

Run: `npx vitest run src/stores/__tests__/shareStore.test.ts`
Expected: FAIL (shareStore 不存在)

- [x] **Step 4: 实现 shareStore**

```typescript
// src/stores/shareStore.ts
import { create } from 'zustand'
import {
  getOrCreateInviteCode,
  getShareStats,
  recordShare,
  grantShareReward,
} from '../services/shareService'
import type { ShareCardType, ShareStats, ShareRewardResult } from '../types/shareTypes'

interface ShareStoreState {
  inviteCode: string
  shareStats: ShareStats | null
  isLoading: boolean
  error: string | null

  fetchInviteCode: (userId: string) => Promise<void>
  fetchShareStats: (userId: string) => Promise<void>
  recordShareAction: (userId: string, cardType: ShareCardType, petId: string, platform: string) => Promise<void>
  checkAndGrantReward: (userId: string) => Promise<ShareRewardResult | null>
  clearError: () => void
}

export const useShareStore = create<ShareStoreState>((set, get) => ({
  inviteCode: '',
  shareStats: null,
  isLoading: false,
  error: null,

  fetchInviteCode: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const code = await getOrCreateInviteCode(userId)
      set({ inviteCode: code, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取邀请码失败', isLoading: false })
    }
  },

  fetchShareStats: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const stats = await getShareStats(userId)
      set({ shareStats: stats, isLoading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取分享统计失败', isLoading: false })
    }
  },

  recordShareAction: async (userId: string, cardType: ShareCardType, petId: string, platform: string) => {
    try {
      await recordShare(userId, cardType, petId, platform)
      const stats = get().shareStats
      if (stats) {
        set({
          shareStats: {
            ...stats,
            totalShares: stats.totalShares + 1,
            [`${cardType}Shares`]: (stats as any)[`${cardType}Shares`] + 1,
          },
        })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '记录分享失败' })
    }
  },

  checkAndGrantReward: async (userId: string) => {
    try {
      const result = await grantShareReward(userId)
      if (result.rewardGranted) {
        const stats = get().shareStats
        if (stats) {
          set({
            shareStats: {
              ...stats,
              successfulInvites: stats.successfulInvites + 1,
            },
          })
        }
      }
      return result
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '奖励发放失败' })
      return null
    }
  },

  clearError: () => set({ error: null }),
}))
```

- [x] **Step 5: 运行测试确认通过**

Run: `npx vitest run src/stores/__tests__/shareStore.test.ts`
Expected: PASS

---

### Task 2: 创建分享卡片 Canvas 渲染器

**Files:**
- Create: `src/utils/shareCanvasRenderer.ts`
- Create: `src/utils/__tests__/shareCanvasRenderer.test.ts`

- [x] **Step 1: 写 shareCanvasRenderer 测试**

```typescript
// src/utils/__tests__/shareCanvasRenderer.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  drawFoodShareImage,
  drawHealthTrendShareImage,
  drawVaccineShareImage,
  drawAchievementShareImage,
  renderShareCardToCanvas,
  saveShareImage,
} from '../shareCanvasRenderer'

const mockTaro = {
  createSelectorQuery: vi.fn(),
  canvasToTempFilePath: vi.fn(),
  saveImageToPhotosAlbum: vi.fn(),
  showToast: vi.fn(),
}

vi.mock('@tarojs/taro', () => ({ default: mockTaro, ...mockTaro }))

interface MockContext {
  fillStyle: string
  strokeStyle: string
  font: string
  textAlign: string
  fillRect: ReturnType<typeof vi.fn>
  fillText: ReturnType<typeof vi.fn>
  strokeRect: ReturnType<typeof vi.fn>
  beginPath: ReturnType<typeof vi.fn>
  moveTo: ReturnType<typeof vi.fn>
  lineTo: ReturnType<typeof vi.fn>
  stroke: ReturnType<typeof vi.fn>
  arc: ReturnType<typeof vi.fn>
  fill: ReturnType<typeof vi.fn>
  drawImage: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
  restore: ReturnType<typeof vi.fn>
  scale: ReturnType<typeof vi.fn>
  measureText: ReturnType<typeof vi.fn>
  clip: ReturnType<typeof vi.fn>
  closePath: ReturnType<typeof vi.fn>
}

function createMockCtx(): MockContext {
  return {
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: 'left: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 100 }),
    clip: vi.fn(),
    closePath: vi.fn(),
  }
}

function asCtx(ctx: MockContext): CanvasRenderingContext2D {
  return ctx as unknown as CanvasRenderingContext2D
}

describe('shareCanvasRenderer', () => {
  let ctx: MockContext

  beforeEach(() => {
    ctx = createMockCtx()
    vi.clearAllMocks()
  })

  describe('drawFoodShareImage', () => {
    it('绘制食物安全分享卡片', () => {
      drawFoodShareImage(asCtx(ctx), {
        foodName: '巧克力',
        safetyLevel: 'toxic',
        petName: '咪咪',
        dangerousCompounds: ['可可碱', '咖啡因'],
        symptoms: ['呕吐', '腹泻', '心跳加速'],
      })
      expect(ctx.fillText).toHaveBeenCalled()
      const calls = ctx.fillText.mock.calls.map(c => c[0] as string)
      expect(calls.some(t => t.includes('巧克力'))).toBe(true)
      expect(calls.some(t => t.includes('有毒'))).toBe(true)
      expect(calls.some(t => t.includes('咪咪'))).toBe(true)
    })
  })

  describe('drawHealthTrendShareImage', () => {
    it('绘制健康趋势分享卡片', () => {
      drawHealthTrendShareImage(asCtx(ctx), {
        petName: '旺财',
        dateRange: '2025-01 ~ 2025-06',
        trendSummary: '体重稳定，食欲正常',
        aiInsight: '整体健康状态良好',
      })
      expect(ctx.fillText).toHaveBeenCalled()
      const calls = ctx.fillText.mock.calls.map(c => c[0] as string)
      expect(calls.some(t => t.includes('旺财'))).toBe(true)
      expect(calls.some(t => t.includes('体重稳定'))).toBe(true)
    })
  })

  describe('drawVaccineShareImage', () => {
    it('绘制疫苗完成分享卡片', () => {
      drawVaccineShareImage(asCtx(ctx), {
        petName: '咪咪',
        vaccineName: '猫三联',
        completedDate: '2025-06-15',
        badgeTitle: '疫苗卫士',
      })
      expect(ctx.fillText).toHaveBeenCalled()
      const calls = ctx.fillText.mock.calls.map(c => c[0] as string)
      expect(calls.some(t => t.includes('咪咪'))).toBe(true)
      expect(calls.some(t => t.includes('猫三联'))).toBe(true)
      expect(calls.some(t => t.includes('疫苗卫士'))).toBe(true)
    })
  })

  describe('drawAchievementShareImage', () => {
    it('绘制成就纪念分享卡片', () => {
      drawAchievementShareImage(asCtx(ctx), {
        petName: '旺财',
        achievementTitle: '连续7天',
        achievementSubtitle: '一周健康打卡',
        achievementIcon: '⭐',
        achievementColor: '#FFD700',
      })
      expect(ctx.fillText).toHaveBeenCalled()
      const calls = ctx.fillText.mock.calls.map(c => c[0] as string)
      expect(calls.some(t => t.includes('旺财'))).toBe(true)
      expect(calls.some(t => t.includes('连续7天'))).toBe(true)
    })
  })

  describe('renderShareCardToCanvas', () => {
    it('Canvas节点不存在时reject', async () => {
      mockTaro.createSelectorQuery.mockReturnValue({
        select: vi.fn().mockReturnValue({
          fields: vi.fn().mockReturnValue({
            exec: vi.fn().mockImplementation((cb: any) => cb([null])),
          }),
        }),
      })
      await expect(renderShareCardToCanvas('food', {}, { canvasId: 'test-canvas' }))
        .rejects.toThrow('Canvas context not found')
    })
  })

  describe('saveShareImage', () => {
    it('保存图片到相册成功', async () => {
      mockTaro.saveImageToPhotosAlbum.mockImplementation((opts: any) => opts.success())
      await saveShareImage('/tmp/test.png')
      expect(mockTaro.saveImageToPhotosAlbum).toHaveBeenCalled()
    })

    it('保存图片到相册失败', async () => {
      mockTaro.saveImageToPhotosAlbum.mockImplementation((opts: any) => opts.fail({ errMsg: 'denied' }))
      await expect(saveShareImage('/tmp/test.png')).rejects.toThrow('Save to album failed')
    })
  })
})
```

- [x] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/utils/__tests__/shareCanvasRenderer.test.ts`
Expected: FAIL

- [x] **Step 3: 实现 shareCanvasRenderer**

```typescript
// src/utils/shareCanvasRenderer.ts
import Taro from '@tarojs/taro'

const CANVAS_WIDTH = 750
const CARD_HEIGHT = 1334
const PADDING = 40
const LINE_HEIGHT = 44
const TITLE_FONT_SIZE = 36
const SUBTITLE_FONT_SIZE = 28
const BODY_FONT_SIZE = 24
const SMALL_FONT_SIZE = 20

const COLORS = {
  primary: '#FF8C42',
  text: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',
  border: '#E8E8E8',
  background: '#FFFFFF',
  sectionBg: '#F8F8F8',
  success: '#52C41A',
  warning: '#FAAD14',
  danger: '#FF4D4F',
  toxic: '#F44336',
  brand: '#FF6B35',
}

const SAFETY_COLORS: Record<string, string> = {
  safe: COLORS.success,
  caution: COLORS.warning,
  dangerous: COLORS.danger,
  toxic: COLORS.toxic,
}

const SAFETY_LABELS: Record<string, string> = {
  safe: '安全',
  caution: '注意',
  dangerous: '危险',
  toxic: '有毒',
}

interface FoodShareImageData {
  foodName: string
  safetyLevel: string
  petName: string
  dangerousCompounds?: string[]
  symptoms?: string[]
}

interface HealthTrendShareImageData {
  petName: string
  dateRange: string
  trendSummary: string
  string
  aiInsight: string
}

interface VaccineShareImageData {
  petName: string
  vaccineName: string
  completedDate: string
  badgeTitle: string
}

interface AchievementShareImageData {
  petName: string
  achievementTitle: string
  achievementSubtitle: string
  achievementIcon: string
  achievementColor: string
}

type ShareCardDataType = FoodShareImageData | HealthTrendShareImageData | VaccineShareImageData | AchievementShareImageData

interface ShareCanvasOptions {
  canvasId: string
  pixelRatio?: number
  width?: number
  height?: number
}

interface ShareImageResult {
  tempFilePath: string
  width: number
  height: number
}

function drawBrandHeader(ctx: CanvasRenderingContext2D, y: number): number {
  ctx.save()
  ctx.fillStyle = COLORS.brand
  ctx.font = `bold ${TITLE_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('星寰海', CANVAS_WIDTH / 2, y + 50)

  ctx.fillStyle = COLORS.textLight
  ctx.font = `${SMALL_FONT_SIZE}px sans-serif`
  ctx.fillText('宠物健康管家', CANVAS_WIDTH / 2, y + 85)
  ctx.restore()
  return y + 110
}

function drawBrandFooter(ctx: CanvasRenderingContext2D, y: number): number {
  ctx.save()
  ctx.strokeStyle = COLORS.border
  ctx.beginPath()
  ctx.moveTo(PADDING + 20, y)
  ctx.lineTo(CANVAS_WIDTH - PADDING - 20, y)
  ctx.stroke()

  ctx.fillStyle = COLORS.textLight
  ctx.font = `${SMALL_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('长按识别小程序码 · 关注宠物健康', CANVAS_WIDTH / 2, y + 40)
  ctx.fillText('星寰海 - 宠物健康管理', CANVAS_WIDTH / 2, y + 75)
  ctx.restore()
  return y + 100
}

export function drawFoodShareImage(ctx: CanvasRenderingContext2D, data: FoodShareImageData): void {
  let y = PADDING
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CANVAS_WIDTH, CARD_HEIGHT)

  y = drawBrandHeader(ctx, y) + 20

  ctx.save()
  ctx.fillStyle = COLORS.text
  ctx.font = `bold ${TITLE_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(`${data.petName}的食物安全报告`, CANVAS_WIDTH / 2, y + 40)
  y += 70

  const safetyColor = SAFETY_COLORS[data.safetyLevel] || COLORS.warning
  const safetyLabel = SAFETY_LABELS[data.safetyLevel] || '未知'

  ctx.fillStyle = COLORS.sectionBg
  ctx.fillRect(PADDING, y, CANVAS_WIDTH - PADDING * 2, 80)
  ctx.fillStyle = safetyColor
  ctx.font = `bold ${SUBTITLE_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(`安全等级：${safetyLabel}`, PADDING + 20, y + 50)
  y += 100

  ctx.fillStyle = COLORS.text
  ctx.font = `bold ${SUBTITLE_FONT_SIZE}px sans-serif`
  ctx.fillText(`食物：${data.foodName}`, PADDING + 20, y + 35)
  y += 60

  if (data.dangerousCompounds && data.dangerousCompounds.length > 0) {
    ctx.fillStyle = COLORS.danger
    ctx.font = `${BODY_FONT_SIZE}px sans-serif`
    ctx.fillText('危险成分：', PADDING + 20, y + 35)
    ctx.fillStyle = COLORS.text
    ctx.fillText(data.dangerousCompounds.join('、'), PADDING + 160, y + 35)
    y += 50
  }

  if (data.symptoms && data.symptoms.length > 0) {
    ctx.fillStyle = COLORS.warning
    ctx.font = `${BODY_FONT_SIZE}px sans-serif`
    ctx.fillText('中毒症状：', PADDING + 20, y + 35)
    ctx.fillStyle = COLORS.text
    const visibleSymptoms = data.symptoms.slice(0, 4)
    ctx.fillText(visibleSymptoms.join('、'), PADDING + 160, y + 35)
    y += 50
  }

  y += 40
  drawBrandFooter(ctx, y)
  ctx.restore()
}

export function drawHealthTrendShareImage(ctx: CanvasRenderingContext2D, data: HealthTrendShareImageData): void {
  let y = PADDING
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CANVAS_WIDTH, CARD_HEIGHT)

  y = drawBrandHeader(ctx, y) + 20

  ctx.save()
  ctx.fillStyle = COLORS.text
  ctx.font = `bold ${TITLE_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(`${data.petName}的健康趋势`, CANVAS_WIDTH / 2, y + 40)
  y += 70

  ctx.fillStyle = COLORS.textSecondary
  ctx.font = `${BODY_FONT_SIZE}px sans-serif`
  ctx.fillText(data.dateRange, CANVAS_WIDTH / 2, y + 30)
  y += 60

  ctx.fillStyle = COLORS.sectionBg
  ctx.fillRect(PADDING, y, CANVAS_WIDTH - PADDING * 2, 200)

  ctx.fillStyle = COLORS.primary
  ctx.font = `bold ${SUBTITLE_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText('趋势概览', PADDING + 20, y + 40)

  ctx.fillStyle = COLORS.text
  ctx.font = `${BODY_FONT_SIZE}px sans-serif`
  const summaryLines = data.trendSummary.split(/[,，。；;]/g).filter(Boolean)
  summaryLines.slice(0, 4).forEach((line, i) => {
    ctx.fillText(line.trim(), PADDING + 20, y + 80 + i * LINE_HEIGHT)
  })
  y += 220

  if (data.aiInsight) {
    ctx.fillStyle = COLORS.sectionBg
    ctx.fillRect(PADDING, y, CANVAS_WIDTH - PADDING * 2, 120)

    ctx.fillStyle = COLORS.primary
    ctx.font = `bold ${SUBTITLE_FONT_SIZE}px sans-serif`
    ctx.textAlign = 'left'
    ctx.fillText('AI 分析', PADDING + 20, y + 40)

    ctx.fillStyle = COLORS.text
    ctx.font = `${BODY_FONT_SIZE}px sans-serif`
    ctx.fillText(data.aiInsight, PADDING + 20, y + 85)
    y += 140
  }

  y += 40
  drawBrandFooter(ctx, y)
  ctx.restore()
}

export function drawVaccineShareImage(ctx: CanvasRenderingContext2D, data: VaccineShareImageData): void {
  let y = PADDING
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CANVAS_WIDTH, CARD_HEIGHT)

  y = drawBrandHeader(ctx, y) + 20

  ctx.save()
  ctx.fillStyle = COLORS.success
  ctx.font = `bold 48px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('🏆', CANVAS_WIDTH / 2, y + 50)
  y += 80

  ctx.fillStyle = COLORS.text
  ctx.font = `bold ${TITLE_FONT_SIZE}px sans-serif`
  ctx.fillText(data.badgeTitle, CANVAS_WIDTH / 2, y + 40)
  y += 70

  ctx.fillStyle = COLORS.sectionBg
  ctx.fillRect(PADDING, y, CANVAS_WIDTH - PADDING * 2, 200)

  ctx.fillStyle = COLORS.text
  ctx.font = `bold ${SUBTITLE_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(data.petName, PADDING + 20, y + 50)

  ctx.fillStyle = COLORS.textSecondary
  ctx.font = `${BODY_FONT_SIZE}px sans-serif`
  ctx.fillText(`完成接种：${data.vaccineName}`, PADDING + 20, y + 100)
  ctx.fillText(`完成日期：${data.completedDate}`, PADDING + 20, y + 145)
  y += 220

  ctx.fillStyle = COLORS.textLight
  ctx.font = `${BODY_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('负责任的毛孩子家长', CANVAS_WIDTH / 2, y + 30)
  y += 60

  drawBrandFooter(ctx, y)
  ctx.restore()
}

export function drawAchievementShareImage(ctx: CanvasRenderingContext2D, data: AchievementShareImageData): void {
  let y = PADDING
  ctx.fillStyle = COLORS.background
  ctx.fillRect(0, 0, CANVAS_WIDTH, CARD_HEIGHT)

  y = drawBrandHeader(ctx, y) + 20

  ctx.save()
  ctx.fillStyle = data.achievementColor
  ctx.font = `bold 64px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(data.achievementIcon, CANVAS_WIDTH / 2, y + 70)
  y += 100

  ctx.fillStyle = data.achievementColor
  ctx.font = `bold ${TITLE_FONT_SIZE}px sans-serif`
  ctx.fillText(data.achievementTitle, CANVAS_WIDTH / 2, y + 40)
  y += 70

  ctx.fillStyle = COLORS.textSecondary
  ctx.font = `${SUBTITLE_FONT_SIZE}px sans-serif`
  ctx.fillText(data.achievementSubtitle, CANVAS_WIDTH / 2, y + 30)
  y += 60

  ctx.fillStyle = COLORS.sectionBg
  ctx.fillRect(PADDING, y, CANVAS_WIDTH - PADDING * 2, 120)

  ctx.fillStyle = COLORS.text
  ctx.font = `bold ${SUBTITLE_FONT_SIZE}px sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(data.petName, PADDING + 20, y + 70)
  y += 140

  drawBrandFooter(ctx, y)
  ctx.restore()
}

export async function renderShareCardToCanvas(
  cardType: string,
  data: ShareCardDataType,
  options: ShareCanvasOptions,
): Promise<ShareImageResult> {
  const pixelRatio = options.pixelRatio || 2
  const canvasWidth = options.width || CANVAS_WIDTH
  const canvasHeight = options.height || CARD_HEIGHT

  return new Promise<ShareImageResult>((resolve, reject) => {
    const query = Taro.createSelectorQuery()
    query
      .select(`#${options.canvasId}`)
      .fields({ node: true, size: true })
      .exec((res: any[]) => {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error('Canvas context not found'))
          return
        }

        const canvas = res[0].node as any
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

        const dpr = pixelRatio
        canvas.width = canvasWidth * dpr
        canvas.height = canvasHeight * dpr
        ctx.scale(dpr, dpr)

        switch (cardType) {
          case 'food':
            drawFoodShareImage(ctx, data as FoodShareImageData)
            break
          case 'health_trend':
            drawHealthTrendShareImage(ctx, data as HealthTrendShareImageData)
            break
          case 'vaccine':
            drawVaccineShareImage(ctx, data as VaccineShareImageData)
            break
          case 'achievement':
            drawAchievementShareImage(ctx, data as AchievementShareImageData)
            break
        }

        setTimeout(() => {
          Taro.canvasToTempFilePath({
            canvas,
            width: canvasWidth,
            height: canvasHeight,
            destWidth: canvasWidth * dpr,
            destHeight: canvasHeight * dpr,
            fileType: 'png',
            success: (res: { tempFilePath: string }) => {
              resolve({ tempFilePath: res.tempFilePath, width: canvasWidth, height: canvasHeight })
            },
            fail: (err: { errMsg: string }) => {
              reject(new Error(`Canvas export failed: ${err.errMsg}`))
            },
          })
        }, 300)
      })
  })
}

export async function saveShareImage(tempFilePath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    Taro.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => {
        Taro.showToast({ title: '已保存到相册', icon: 'success' })
        resolve()
      },
      fail: (err: { errMsg: string }) => {
        reject(new Error(`Save to album failed: ${err.errMsg}`))
      },
    })
  })
}
```

- [x] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/utils/__tests__/shareCanvasRenderer.test.ts`
Expected: PASS (可能需要修复 drawVaccineShareImage 中的模板字符串 bug `完成日期：}` → `完成日期：${data.completedDate}`)

- [x] **Step 5: 修复 drawVaccineShareImage 中的模板字符串 bug**

将 `完成日期：}` 修改为 `完成日期：${data.completedDate}`

- [x] **Step 6: 再次运行测试确认通过**

Run: `npx vitest run src/utils/__tests__/shareCanvasRenderer.test.ts`
Expected: PASS

---

### Task 3: 重构分享卡片组件，集成 Canvas 生成图片

**Files:**
- Modify: `src/components/FoodShareCard.tsx`
- Modify: `src/components/HealthTrendShareCard.tsx`
- Modify: `src/components/VaccineShareCard.tsx`
- Create: `src/components/AchievementShareCard.tsx`
- Create: `src/components/AchievementShareCard.scss`
- Create: `src/components/__tests__/AchievementShareCard.test.tsx`
- Modify: `src/components/index.ts`

- [x] **Step 1: 重构 FoodShareCard.tsx — 添加 Canvas + 保存/分享按钮**

核心改动：在现有 UI 组件基础上，新增隐藏 Canvas 节点，点击"分享给好友"时先通过 Canvas 生成图片，然后保存到相册或分享。将 `onShare` 回调改为 `onSaveImage`（保存到相册）+ `onShareMessage`（触发微信分享）。

```typescript
// src/components/FoodShareCard.tsx — 完整重写
import { View, Text, Image, Canvas } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { renderShareCardToCanvas, saveCardToCanvas, saveShareImage } from '../utils/shareCanvasRenderer'
import './FoodShareCard.scss'

type SafetyLevel = 'safe' | 'caution' | 'dangerous' | 'toxic'

interface FoodShareCardProps {
  foodName: string
  safetyLevel: SafetyLevel
  petName: string
  petAvatar?: string
  dangerousCompounds?: string[]
  symptoms?: string[]
  detail?: string
  onClose: () => void
}

const SAFETY_LEVEL_CONFIG: Record<SafetyLevel, { label: string; color: string; bgColor: string }> = {
  safe: { label: '安全', color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.1)' },
  caution: { label: '注意', color: '#FFC107', bgColor: 'rgba(255, 193, 7, 0.1)' },
  dangerous: { label: '危险', color: '#FF9800', bgColor: 'rgba(255, 152, 0, 0.1)' },
  toxic: { label: '有毒', color: '#F44336', bgColor: 'rgba(244, 67, 54, 0.1)' },
}

const MAX_VISIBLE_SYMPTOMS = 3
const CANVAS_ID = 'food-share-canvas'

export default function FoodShareCard({
  foodName,
  safetyLevel,
  petName,
  petAvatar,
  dangerousCompounds,
  symptoms,
  detail,
  onClose,
}: FoodShareCardProps) {
  const [saving, setSaving] = useState(false)
  const config = SAFETY_LEVEL_CONFIG[safetyLevel]
  const visibleSymptoms = symptoms?.slice(0, MAX_VISIBLE_SYMPTOMS) ?? []
  const remainingSymptoms = (symptoms?.length ?? 0) - MAX_VISIBLE_SYMPTOMS

  const handleSaveImage = useCallback(async () => {
    setSaving(true)
    try {
      const result = await renderShareCardToCanvas('food', {
        foodName,
        safetyLevel,
        petName,
        dangerousCompounds,
        symptoms,
      }, { canvasId: CANVAS_ID })
      await saveShareImage(result.tempFilePath)
    } catch (err) {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }, [foodName, safetyLevel, petName, dangerousCompounds, symptoms])

  const handleShareMessage = useCallback(() => {
    Taro.showShareMenu({ withShareTicket: true })
    onClose()
  }, [onClose])

  return (
    <View className='food-share-card'>
      <View className='food-share-card__overlay' onClick={onClose} />
      <View className='food-share-card__content'>
        <View className='food-share-card__header'>
          <View className='food-share-card__pet'>
            <View className='food-share-card__pet-avatar'>
              {petAvatar ? (
                <Image className='food-share-card__pet-avatar-img' src={petAvatar} mode='aspectFill' lazyLoad />
              ) : (
                <Text className='food-share-card__pet-avatar-emoji'>🐾</Text>
              )}
            </View>
            <Text className='food-share-card__pet-name'>{petName}</Text>
          </View>
          <View
            className={`food-share-card__badge food-share-card__badge--${safetyLevel}`}
            style={{ backgroundColor: config.bgColor }}
          >
            <View className='food-share-card__badge-dot' style={{ backgroundColor: config.color }} />
            <Text className='food-share-card__badge-text' style={{ color: config.color }}>
              {config.label}
            </Text>
          </View>
        </View>

        <View className='food-share-card__body'>
          <Text className='food-share-card__food-name'>{foodName}</Text>
          {dangerousCompounds && dangerousCompounds.length > 0 && (
            <View className='food-share-card__compounds'>
              {dangerousCompounds.map((compound) => (
                <View className='food-share-card__compound-tag' key={compound}>
                  <Text className='food-share-card__compound-tag-text'>{compound}</Text>
                </View>
              ))}
            </View>
          )}
          {symptoms && symptoms.length > 0 && (
            <View className='food-share-card__symptoms'>
              {visibleSymptoms.map((symptom) => (
                <View className='food-share-card__symptom-tag' key={symptom}>
                  <Text className='food-share-card__symptom-tag-text'>{symptom}</Text>
                </View>
              ))}
              {remainingSymptoms > 0 && (
                <View className='food-share-card__symptom-tag food-share-card__symptom-tag--more'>
                  <Text className='food-share-card__symptom-tag-text food-share-card__symptom-tag-text--more'>
                    +{remainingSymptoms}
                  </Text>
                </View>
              )}
            </View>
          )}
          {detail && <Text className='food-share-card__detail'>{detail}</Text>}
        </View>

        <View className='food-share-card__footer'>
          <Canvas type='2d' id={CANVAS_ID} className='food-share-card__canvas' style={{ width: '750px', height: '1334px', position: 'absolute', left: '-9999px' }} />
          <View className='food-share-card__save-btn' onClick={handleSaveImage}>
            <Text className='food-share-card__save-btn-text'>{saving ? '生成中...' : '保存图片'}</Text>
          </View>
          <View className='food-share-card__share-btn' onClick={handleShareMessage}>
            <Text className='food-share-card__share-btn-text'>分享给好友</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
```

- [x] **Step 2: 重构 HealthTrendShareCard.tsx — 同样模式**

将现有 overlay+card 结构保留，footer 区域新增 Canvas 节点 + 保存图片按钮 + 分享给好友按钮。`onShare` 回调改为 `onShareMessage`（触发微信分享），新增 `onSaveImage`（Canvas 生成+保存到相册）。

核心改动点：
1. import Canvas 组件 + renderShareCardToCanvas + saveShareImage
2. 新增 `saving` state
3. 新增 `handleSaveImage` 回调（调用 renderShareCardToCanvas('health_trend', ...) + saveShareImage）
4. footer 区域新增 Canvas 节点（id='health-trend-share-canvas'）+ 保存图片按钮
5. 保留"分享给朋友"按钮，改为调用 `Taro.showShareMenu`

- [x] **Step 3: 重构 VaccineShareCard.tsx — 同样模式**

同 HealthTrendShareCard 模式，Canvas id='vaccine-share-canvas'。

- [x] **Step 4: 创建 AchievementShareCard.tsx**

```typescript
// src/components/AchievementShareCard.tsx
import { View, Text, Canvas } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { renderShareCardToCanvas, saveShareImage } from '../utils/shareCanvasRenderer'
import type { AchievementShareData } from '../types/shareTypes'
import './AchievementShareCard.scss'

interface AchievementShareCardProps extends AchievementShareData {
  achievementColor: string
  onClose: () => void
}

const CANVAS_ID = 'achievement-share-canvas'

export default function AchievementShareCard({
  petName,
  achievementTitle,
  achievementSubtitle,
  achievementIcon,
  achievementColor,
  onClose,
}: AchievementShareCardProps) {
  const [saving, setSaving] = useState(false)

  const handleSaveImage = useCallback(async () => {
    setSaving(true)
    try {
      const result = await renderShareCardToCanvas('achievement', {
        petName,
        achievementTitle,
        achievementSubtitle,
        achievementIcon,
        achievementColor,
      }, { canvasId: CANVAS_ID })
      await saveShareImage(result.tempFilePath)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }, [petName, achievementTitle, achievementSubtitle, achievementIcon, achievementColor])

  const handleShareMessage = useCallback(() => {
    Taro.showShareMenu({ withShareTicket: true })
    onClose()
  }, [onClose])

  return (
    <View className='achievement-share'>
      <View className='achievement-share__overlay' onClick={onClose} />
      <View className='achievement-share__card' style={{ borderColor: achievementColor }}>
        <View className='achievement-share__close' onClick={onClose}>✕</View>
        <View className='achievement-share__icon'>
          <Text className='achievement-share__icon-text'>{achievementIcon}</Text>
        </View>
        <View className='achievement-share__info'>
          <Text className='achievement-share__title' style={{ color: achievementColor }}>{achievementTitle}</Text>
          <Text className='achievement-share__subtitle'>{achievementSubtitle}</Text>
          <Text className='achievement-share__pet-name'>{petName}</Text>
        </View>
        <View className='achievement-share__footer' style={{ backgroundColor: achievementColor }}>
          <Text className='achievement-share__footer-text'>成就纪念卡 · 星寰海</Text>
        </View>
        <View className='achievement-share__actions'>
          <Canvas type='2d' id={CANVAS_ID} className='achievement-share__canvas' style={{ width: '750px', height: '1334px', position: 'absolute', left: '-9999px' }} />
          <View className='achievement-share__save-btn' onClick={handleSaveImage}>
            <Text className='achievement-share__save-btn-text'>{saving ? '生成中...' : '保存图片'}</Text>
          </View>
          <View className='achievement-share__share-btn' onClick={handleShareMessage}>
            <Text className='achievement-share__share-btn-text'>炫耀一下</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
```

- [x] **Step 5: 创建 AchievementShareCard.scss**

```scss
.achievement-share {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;

  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  &__card {
    position: relative;
    width: 600px;
    background: #fff;
    border-radius: 24px;
    border: 4px solid;
    overflow: hidden;
    z-index: 1;
  }

  &__close {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 32px;
    color: #999;
    padding: 8px;
  }

  &__icon {
    text-align: center;
    padding: 40px 0 16px;

    &-text {
      font-size: 80px;
    }
  }

  &__info {
    text-align: center;
    padding: 16px 32px;
  }

  &__title {
    font-size: 36px;
    font-weight: bold;
    display: block;
    margin-bottom: 8px;
  }

  &__subtitle {
    font-size: 26px;
    color: #666;
    display: block;
    margin-bottom: 8px;
  }

  &__pet-name {
    font-size: 28px;
    color: #333;
    display: block;
  }

  &__footer {
    padding: 16px;
    text-align: center;

    &-text {
      color: #fff;
      font-size: 24px;
    }
  }

  &__actions {
    display: flex;
    padding: 24px 32px;
    gap: 16px;
    position: relative;
  }

  &__canvas {
    pointer-events: none;
  }

  &__save-btn {
    flex: 1;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FF8C42;
    border-radius: 40px;

    &-text {
      color: #fff;
      font-size: 28px;
      font-weight: bold;
    }
  }

  &__share-btn {
    flex: 1;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #07C160;
    border-radius: 40px;

    &-text {
      color: #fff;
      font-size: 28px;
      font-weight: bold;
    }
  }
}
```

- [x] **Step 6: 写 AchievementShareCard 测试**

```typescript
// src/components/__tests__/AchievementShareCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AchievementShareCard from '../AchievementShareCard'

vi.mock('@tarojs/components', () => ({
  View: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Canvas: (props: any) => <canvas {...props} />,
}))

vi.mock('@tarojs/taro', () => ({
  default: {
    showShareMenu: vi.fn(),
    showToast: vi.fn(),
    createSelectorQuery: vi.fn(),
    canvasToTempFilePath: vi.fn(),
    saveImageToPhotosAlbum: vi.fn(),
  },
}))

vi.mock('../utils/shareCanvasRenderer', () => ({
  renderShareCardToCanvas: vi.fn().mockRejectedValue(new Error('no canvas')),
  saveShareImage: vi.fn(),
}))

describe('AchievementShareCard', () => {
  it('渲染成就标题和宠物名', () => {
    render(
      <AchievementShareCard
        petName='旺财'
        achievementTitle='连续7天'
        achievementSubtitle='一周健康打卡'
        achievementIcon='⭐'
        achievementColor='#FFD700'
        achievementType='streak_7'
        achievementAvatar=''
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText('连续7天')).toBeTruthy()
    expect(screen.getByText('旺财')).toBeTruthy()
  })

  it('渲染保存图片和炫耀按钮', () => {
    render(
      <AchievementShareCard
        petName='旺财'
        achievementTitle='连续7天'
        achievementSubtitle='一周健康打卡'
        achievementIcon='⭐'
        achievementColor='#FFD700'
        achievementType='streak_7'
        achievementAvatar=''
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText('保存图片')).toBeTruthy()
    expect(screen.getByText('炫耀一下')).toBeTruthy()
  })
})
```

- [x] **Step 7: 更新 components/index.ts 导出**

在 `src/components/index.ts` 末尾追加：
```typescript
export { default as AchievementShareCard } from './AchievementShareCard'
```

- [x] **Step 8: 运行测试确认通过**

Run: `npx vitest run src/components/__tests__/AchievementShareCard.test.tsx src/components/FoodShareCard.test.tsx`
Expected: PASS

---

### Task 4: 添加 onShareTimeline 朋友圈分享 + 分享路径携带邀请码

路径携带邀请码

**Files:**
- Modify: `src/pagesPet/trends/index.tsx`
- Modify: `src/pagesPet/food-query/index.tsx`
- Modify: `src/pagesPet/vaccine/index.tsx`
- Modify: `src/pagesPet/checkin/index.tsx`
- Modify: `src/pagesPet/symptom-check/index.tsx`

- [x] **Step 1: 修改 trends/index.tsx — 添加 onShareTimeline + 邀请码路径**

核心改动：
1. import `useShareTimeline` from `@tarojs/taro`
2. import `useShareStore` from `../../stores/shareStore`
3. 在组件内获取 inviteCode: `const inviteCode = useShareStore(s => s.inviteCode)`
4. 修改 `useShareAppMessage` 的 path 携带邀请码：`path: \`/pagesPet/trends/index?inviteCode=${inviteCode}\``
5. 新增 `useShareTimeline` 回调：
```typescript
useShareTimeline(() => ({
  title: `${currentPet?.name || '宠物'}的健康趋势 - 星寰海`,
  path: `/pagesPet/trends/index?inviteCode=${inviteCode}`,
}))
```

- [x] **Step 2: 修改 food-query/index.tsx — 同样模式**

1. import `useShareTimeline` + `useShareStore`
2. 获取 inviteCode
3. 修改 `useShareAppMessage` path 携带邀请码
4. 新增 `useShareTimeline`

- [x] **Step 3: 修改 vaccine/index.tsx — 同样模式**

- [x] **Step 4: 修改 checkin/index.tsx — 同样模式**

- [x] **Step 5: 修改 symptom-check/index.tsx — 同样模式**

- [x] **Step 6: 运行类型检查确认无错误**

Run: `npx tsc --noEmit`
Expected: 0 errors

---

### Task 5: 实现分享奖励发放逻辑 + 邀请码入口UI

**Files:**
- Modify: `src/services/shareService.ts` (新增 grantShareReward)
- Modify: `src/services/__tests__/shareService.test.ts`
- Modify: `src/pages/mine/index.tsx` (新增邀请码菜单项)
- Modify: `src/pages/mine/index.scss` (邀请码入口样式)
- Create: `src/pagesUser/invite/index.tsx` (邀请好友页面)
- Create: `src/pagesUser/invite/index.scss`

- [x] **Step 1: 在 shareService.ts 新增 grantShareReward 函数**

```typescript
// 追加到 src/services/shareService.ts

import { SHARE_REWARD_INVITES } from '../constants';
import type { ShareRewardResult } from '../types/shareTypes';

export async function grantShareReward(userId: string): Promise<ShareRewardResult> {
  const stats = await getShareStats(userId);

  if (stats.successfulInvites < SHARE_REWARD_INVITES) {
    return {
      rewardGranted: false,
      rewardType: 'none',
      rewardValue: 0,
      message: `还需邀请${SHARE_REWARD_INVITES - stats.successfulInvites}位好友即可获得奖励`,
    };
  }

  const alreadyGranted = stats.successfulInvites > SHARE_REWARD_INVITES;
  if (alreadyGranted) {
    return {
      rewardGranted: false,
      rewardType: 'none',
      rewardValue: 0,
      message: '奖励已发放',
    };
  }

  await supabaseClient.insert('share_rewards', {
    user_id: userId,
    reward_type: 'membership_days',
    reward_value: 7,
    granted_at: new Date().toISOString(),
  });

  return {
    rewardGranted: true,
    rewardType: 'membership_days',
    rewardValue: 7,
    message: `邀请${SHARE_REWARD_INVITES}位好友，奖励7天会员`,
  };
}
```

- [x] **Step 2: 写 grantShareReward 测试**

在 `src/services/__tests__/shareService.test.ts` 追加：

```typescript
describe('grantShareReward', () => {
  it('邀请数未达标时返回未达标提示', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null })
    memoryStore.set('xhh_share_history', [
      { id: '1', userId: 'user-1', cardType: 'food', petId: 'pet-1', sharedAt: '2025-01-01', platform: 'wechat', inviteCode: 'ABC' },
    ])
    mockSelect.mockResolvedValue({
      data: [{ inviter_id: 'user-1', invitee_id: 'user-2', invite_code: 'ABC', reward_granted: false }],
      error: null,
    })

    const result = await grantShareReward('user-1')
    expect(result.rewardGranted).toBe(false)
    expect(result.message).toContain('还需邀请')
  })

  it('邀请数达标时发放奖励', async () => {
    memoryStore.set('xhh_share_history', [
      { id: '1', userId: 'user-1', cardType: 'food', petId: 'pet-1', sharedAt: '2025-01-01', platform: 'wechat', inviteCode: 'ABC' },
    ])
    mockSelect.mockResolvedValue({
      data: [
        { inviter_id: 'user-1', invitee_id: 'user-2', invite_code: 'ABC', reward_granted: true },
        { inviter_id: 'user-1', invitee_id: 'user-3', invite_code: 'ABC', reward_granted: true },
        { inviter_id: 'user-1', invitee_id: 'user-4', invite_code: 'ABC', reward_granted: true },
      ],
      error: null,
    })
    mockInsert.mockResolvedValue({ data: [{ id: 'r1' }], error: null })

    const result = await grantShareReward('user-1')
    expect(result.rewardGranted).toBe(true)
    expect(result.rewardType).toBe('membership_days')
    expect(result.rewardValue).toBe(7)
  })
})
```

- [x] **Step 3: 运行测试确认通过**

Run: `npx vitest run src/services/__tests__/shareService.test.ts`
Expected: PASS

- [x] **Step 4: 修改 mine/index.tsx — 新增邀请码菜单项**

在"会员管理"和"我的宠物"之间新增"邀请好友"菜单项：

```typescript
// 在 mine/index.tsx 的 MenuItem 列表中，会员管理之后新增：
<MenuItem
  title='邀请好友'
  icon='🎁'
  onClick={handleInviteClick}
  showBadge={inviteCode === ''}
/>
```

新增 handleInviteClick：
```typescript
const handleInviteClick = () => {
  Taro.navigateTo({ url: '/pagesUser/invite/index' })
}
```

import useShareStore：
```typescript
import { useShareStore } from '../../stores/shareStore'
```

在组件内：
```typescript
const inviteCode = useShareStore(s => s.inviteCode)
```

- [x] **Step 5: 创建邀请好友页面**

```typescript
// src/pagesUser/invite/index.tsx
import { View, Text, Button } from '@tarojs/components'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useShareStore } from '../../stores/shareStore'
import { PageLoading, PageError } from '../../components'
import './index.scss'

export default function InvitePage() {
  const user = useAuthStore(s => s.user)
  const { inviteCode, shareStats, fetchInviteCode, fetchShareStats, checkAndGrantReward, isLoading, error } = useShareStore()
  const [rewardResult, setRewardResult] = useState<string | null>(null)

  const userId = user?.id || ''

  useEffect(() => {
    if (userId) {
      fetchInviteCode(userId)
      fetchShareStats(userId)
    }
  }, [userId, fetchInviteCode, fetchShareStats])

  useShareAppMessage(() => ({
    title: '我在用星寰海管理宠物健康，快来一起吧！',
    path: `/pages/index/index?inviteCode=${inviteCode}`,
  }))

  useShareTimeline(() => ({
    title: '星寰海 - 宠物健康管家',
    path: `/pages/index/index?inviteCode=${inviteCode}`,
  }))

  const handleCopyCode = useCallback(() => {
    Taro.setClipboardData({
      data: inviteCode,
      success: () => Taro.showToast({ title: '邀请码已复制', icon: 'success' }),
    })
  }, [inviteCode])

  const handleCheckReward = useCallback(async () => {
    if (!userId) return
    const result = await checkAndGrantReward(userId)
    if (result) {
      setRewardResult(result.message)
    }
  }, [userId, checkAndGrantReward])

  if (isLoading && !inviteCode) {
    return <View className='invite-page'><PageLoading /></View>
  }

  if (error) {
    return <View className='invite-page'><PageError message={error} onRetry={() => { fetchInviteCode(userId); fetchShareStats(userId) }} /></View>
  }

  return (
    <View className='invite-page'>
      <View className='invite-page__header'>
        <Text className='invite-page__title'>邀请好友</Text>
        <Text className='invite-page__subtitle'>分享给好友，一起守护毛孩子健康</Text>
      </View>

      <View className='invite-page__code-section'>
        <Text className='invite-page__code-label'>我的邀请码</Text>
        <View className='invite-page__code-box'>
          <Text className='invite-page__code-text'>{inviteCode || '---'}</Text>
        </View>
        <Button className='invite-page__copy-btn' onClick={handleCopyCode}>复制邀请码</Button>
      </View>

      <View className='invite-page__stats'>
        <View className='invite-page__stat-item'>
          <Text className='invite-page__stat-value'>{shareStats?.totalShares ?? 0}</Text>
          <Text className='invite-page__stat-label'>分享次数</Text>
        </View>
        <View className='invite-page__stat-item'>
          <Text className='invite-page__stat-value'>{shareStats?.totalInvites ?? 0}</Text>
          <Text className='invite-page__stat-label'>邀请人数</Text>
        </View>
        <View className='invite-page__stat-item'>
          <Text className='invite-page__stat-value'>{shareStats?.successfulInvites ?? 0}/3</Text>
          <Text className='invite-page__stat-label'>奖励进度</Text>
        </View>
      </View>

      <View className='invite-page__actions'>
        <Button className='invite-page__share-btn' openType='share'>分享给好友</Button>
        <Button className='invite-page__timeline-btn' openType='shareTimeline'>分享到朋友圈</Button>
      </View>

      <View className='invite-page__reward'>
        <Text className='invite-page__reward-title'>🎁 邀请奖励</Text>
        <Text className='invite-page__reward-desc'>邀请3位好友注册，即可获得7天会员奖励</Text>
        <Button className='invite-page__reward-btn' onClick={handleCheckReward}>检查奖励</Button>
        {rewardResult && <Text className='invite-page__reward-result'>{rewardResult}</Text>}
      </View>
    </View>
  )
}
```

- [x] **Step 6: 创建邀请好友页面样式**

```scss
// src/pagesUser/invite/index.scss
.invite-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF5EB 0%, #FFFFFF 40%);
  padding: 32px;

  &__header {
    text-align: center;
    padding: 40px 0 32px;
  }

  &__title {
    font-size: 40px;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 12px;
  }

  &__subtitle {
    font-size: 26px;
    color: #666;
    display: block;
  }

  &__code-section {
    background: #fff;
    border-radius: 24px;
    padding: 40px 32px;
    text-align: center;
    margin-bottom: 32px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  &__code-label {
    font-size: 26px;
    color: #999;
    display: block;
    margin-bottom: 16px;
  }

  &__code-box {
    background: #FFF5EB;
    border: 2px dashed #FF8C42;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }

  &__code-text {
    font-size: 48px;
    font-weight: bold;
    color: #FF8C42;
    letter-spacing: 8px;
  }

  &__copy-btn {
    background: #FF8C42 !important;
    color: #fff !important;
    border-radius: 40px !important;
    font-size: 28px !important;
    width: 300px !important;
    height: 80px !important;
    line-height: 80px !important;
  }

  &__stats {
    display: flex;
    background: #fff;
    border-radius: 24px;
    padding: 32px;
    margin-bottom: 32px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  &__stat-item {
    flex: 1;
    text-align: center;
  }

  &__stat-value {
    font-size: 40px;
    font-weight: bold;
    color: #FF8C42;
    display: block;
    margin-bottom: 8px;
  }

  &__stat-label {
    font-size: 22px;
    color: #999;
    display: block;
  }

  &__actions {
    display: flex;
    gap: 16px;
    margin-bottom: 32px;
  }

  &__share-btn {
    flex: 1;
    background: #07C160 !important;
    color: #fff !important;
    border-radius: 40px !important;
    font-size: 28px !important;
    height: 88px !important;
    line-height: 88px !important;
  }

  &__timeline-btn {
    flex: 1;
    background: #FF8C42 !important;
    color: #fff !important;
    border-radius: 40px !important;
    font-size: 28px !important;
    height: 88px !important;
    line-height: 88px !important;
  }

  &__reward {
    background: #fff;
    border-radius: 24px;
    padding: 32px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  &__reward-title {
    font-size: 30px;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 12px;
  }

  &__reward-desc {
    font-size: 24px;
    color: #666;
    display: block;
    margin-bottom: 20px;
  }

  &__reward-btn {
    background: #FFD700 !important;
    !important;
    color: #333 !important;
    border-radius: 40px !important;
    font-size: 26px !important;
    width: 240px !important;
    height: 72px !important;
    line-height: 72px !important;
  }

  &__reward-result {
    font-size: 24px;
    color: #FF8C42;
    display: block;
    margin-top: 16px;
    text-align: center;
  }
}
```

- [x] **Step 7: 注册邀请页面路由**

在 `src/app.config.ts` 的 pages 数组中追加 `'pagesUser/invite/index'`。

- [x] **Step 8: 运行类型检查确认无错误**

Run: `npx tsc --noEmit`
Expected: 0 errors

---

### Task 6: 集成 NPS after_share/after_export 触发

**Files:**
- Modify: `src/pagesPet/trends/index.tsx` (after_export 触发)
- Modify: `src/pagesPet/food-query/index.tsx` (after_share 触发)
- Modify: `src/pagesPet/vaccine/index.tsx` (after_share 触发)

- [x] **Step 1: 修改 trends/index.tsx — 导出报告后触发 NPS**

在 `handleExportReport` 成功后，检查 NPS 资格并触发 after_export 事件：

```typescript
import { checkNpsEligibility, getTriggerEvent } from '../../services/npsService'

// 在 handleExportReport 的 try 块末尾追加：
const npsStatus = checkNpsEligibility(user.id, user.createdAt)
if (npsStatus.isEligible) {
  setShowNpsSurvey(true)
  setNpsTriggerEvent('after_export')
}
```

需要新增 state：
```typescript
const [showNpsSurvey, setShowNpsSurvey] = useState(false)
const [npsTriggerEvent, setNpsTriggerEvent] = useState<NpsTriggerEvent>('manual')
```

在 JSX 末尾追加 NpsSurvey 组件：
```typescript
{showNpsSurvey && (
  <NpsSurvey
    triggerEvent={npsTriggerEvent}
    onSubmit={(score, feedback) => {
      submitNpsResponse(user.id, score, npsTriggerEvent, feedback)
      setShowNpsSurvey(false)
    }}
    onDismiss={() => {
      dismissNpsSurvey()
      setShowNpsSurvey(false)
    }}
  />
)}
```

- [x] **Step 2: 修改 food-query/index.tsx — 分享后触发 NPS**

在分享确认回调中，检查 NPS 资格并触发 after_share 事件。模式同上。

- [x] **Step 3: 修改 vaccine/index.tsx — 分享后触发 NPS**

模式同 food-query。

- [x] **Step 4: 运行类型检查确认无错误**

Run: `npx tsc --noEmit`
Expected: 0 errors

---

### Task 7: 全量验证 + 看板更新

**Files:**
- None (验证任务)

- [x] **Step 1: 运行全量测试**

Run: `npx vitest run`
Expected: All tests pass

- [x] **Step 2: 运行类型检查**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [x] **Step 3: 运行构建**

Run: `npm run build`
Expected: Build successful

- [x] **Step 4: 更新看板**

Run: `E:\update-board.bat "E:\星寰海\03-源代码\小程序\miniapp" "分享裂变闭环完成" "Canvas分享图片生成、朋友圈分享、邀请码路径、奖励发放、邀请码入口UI、NPS after_share/after_export触发" "src/stores/shareStore.ts,src/utils/shareCanvasRenderer.ts,src/components/AchievementShareCard.tsx,src/pagesUser/invite/index.tsx"`

- [x] **Step 5: 同步项目记忆**

Run: `node "E:\sync-memory-to-board.cjs" "E:\星寰海\03-源代码\小程序\miniapp"`
