import { describe, it, expect } from 'vitest'
import type {
  AccessorySlot, UnlockSource, OutfitSlotMap, OutfitLayer,
  AccessoryDef, ThemeSuiteDef, ThemeSuiteTask, ThemeQuotaInfo,
  WardrobeError, ModerationResult, ThemeCategory,
} from './wardrobeTypes'

describe('wardrobeTypes', () => {
  it('AccessorySlot 应为 5 个槽位联合类型', () => {
    const slots: AccessorySlot[] = ['head', 'neck', 'back', 'body', 'feet']
    expect(slots).toHaveLength(5)
  })

  it('OutfitSlotMap 应允许部分槽位赋值', () => {
    const partial: OutfitSlotMap = { head: 'hat_bowler' }
    const full: OutfitSlotMap = {
      head: 'hat_bowler',
      neck: 'scarf_red',
      back: undefined,
      body: undefined,
      feet: undefined,
    }
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
    expect(layer.slot).toBe('head')
  })

  it('OutfitLayer transform 应为可选', () => {
    const withTransform: OutfitLayer = {
      slot: 'head',
      accessoryId: 'hat_bowler',
      svgPath: '<g>...</g>',
      zIndex: 10,
      transform: 'scale(0.85)',
    }
    const withoutTransform: OutfitLayer = {
      slot: 'head',
      accessoryId: 'hat_bowler',
      svgPath: '<g>...</g>',
      zIndex: 10,
    }
    expect(withTransform.transform).toBe('scale(0.85)')
    expect(withoutTransform.transform).toBeUndefined()
  })

  it('AccessoryDef 应包含完整字段', () => {
    const def: AccessoryDef = {
      id: 'hat_bowler',
      name: '小礼帽',
      slot: 'head',
      svgPath: 'svgFragments/hat_bowler.svg',
      speciesCompat: [],
      unlockSource: 'default',
      unlockCondition: {},
      sortOrder: 100,
      isActive: true,
    }
    expect(def.id).toBe('hat_bowler')
    expect(def.unlockSource).toBe('default')
  })

  it('ThemeSuiteDef 应包含完整字段', () => {
    const theme: ThemeSuiteDef = {
      id: 'christmas',
      name: '圣诞套装',
      category: 'festival',
      promptTemplate: 'a cute {species}',
      festivalDate: '12-25',
      previewUrl: null,
      sortOrder: 100,
      isActive: true,
    }
    expect(theme.category).toBe('festival')
    expect(theme.festivalDate).toBe('12-25')
  })

  it('ThemeSuiteTask 应包含完整状态字段', () => {
    const task: ThemeSuiteTask = {
      id: 'task-1',
      userId: 'user-1',
      petId: 'pet-1',
      suiteId: 'christmas',
      status: 'pending',
      resultUrl: null,
      moderationResult: null,
      quotaConsumed: false,
      retryCount: 0,
      createdAt: '2026-07-24T00:00:00Z',
      updatedAt: '2026-07-24T00:00:00Z',
    }
    expect(task.status).toBe('pending')
    expect(task.quotaConsumed).toBe(false)
  })

  it('ThemeQuotaInfo 应正确计算剩余', () => {
    const quota: ThemeQuotaInfo = {
      monthlyLimit: 5,
      usedThisMonth: 2,
      remaining: 3,
    }
    expect(quota.remaining).toBe(quota.monthlyLimit - quota.usedThisMonth)
  })

  it('WardrobeError 应包含 code/message/httpStatus', () => {
    const err: WardrobeError = {
      code: 'WARDROBE_010',
      message: '未拥有该饰品',
      httpStatus: 403,
    }
    expect(err.httpStatus).toBe(403)
  })

  it('UnlockSource 应为 4 种来源', () => {
    const sources: UnlockSource[] = ['default', 'achievement', 'paid', 'member']
    expect(sources).toHaveLength(4)
  })

  it('ThemeCategory 应为 4 种分类', () => {
    const categories: ThemeCategory[] = ['festival', 'season', 'birthday', 'special']
    expect(categories).toHaveLength(4)
  })

  it('ModerationResult 应为 3 种结果', () => {
    const results: ModerationResult[] = ['pass', 'review', 'block']
    expect(results).toHaveLength(3)
  })
})
