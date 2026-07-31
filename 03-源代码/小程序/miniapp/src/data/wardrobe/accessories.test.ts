import { describe, it, expect } from 'vitest'
/**
 * 配饰数据测试
 * 验证配饰定义的正确性和完整性
 */
import { ACCESSORIES, getAccessoriesBySlot, getDefaultAccessories, getAccessoryById } from './accessories'
import { getActiveThemes, getThemeById } from './themeSuites'
import type { AccessorySlot } from '../../types/wardrobeTypes'

const VALID_SLOTS: AccessorySlot[] = ['head', 'neck', 'back', 'body', 'feet']

describe('accessories', () => {
  it('应有 40 件饰品', () => {
    expect(ACCESSORIES).toHaveLength(40)
  })

  it('每件饰品应有合法 slot', () => {
    for (const a of ACCESSORIES) {
      expect(VALID_SLOTS).toContain(a.slot)
    }
  })

  it('默认饰品应为 8 件', () => {
    const defaults = getDefaultAccessories()
    expect(defaults).toHaveLength(8)
    for (const a of defaults) {
      expect(a.unlockSource).toBe('default')
    }
  })

  it('getAccessoriesBySlot 应按槽位筛选', () => {
    const headItems = getAccessoriesBySlot('head')
    for (const a of headItems) {
      expect(a.slot).toBe('head')
    }
    expect(headItems.length).toBeGreaterThan(0)

    const neckItems = getAccessoriesBySlot('neck')
    for (const a of neckItems) {
      expect(a.slot).toBe('neck')
    }
    expect(neckItems.length).toBeGreaterThan(0)
  })

  it('getAccessoryById 应能查找饰品', () => {
    const found = getAccessoryById('hat_bowler')
    expect(found).toBeDefined()
    expect(found!.id).toBe('hat_bowler')

    const notFound = getAccessoryById('nonexistent')
    expect(notFound).toBeUndefined()
  })

  it('所有 id 应唯一', () => {
    const ids = ACCESSORIES.map(a => a.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

describe('themeSuites', () => {
  it('应有 10 套主题', () => {
    const activeThemes = getActiveThemes()
    expect(activeThemes).toHaveLength(10)
  })

  it('getThemeById 应能查找主题', () => {
    const found = getThemeById('christmas')
    expect(found).toBeDefined()
    expect(found!.id).toBe('christmas')

    const notFound = getThemeById('nonexistent')
    expect(notFound).toBeUndefined()
  })
})
