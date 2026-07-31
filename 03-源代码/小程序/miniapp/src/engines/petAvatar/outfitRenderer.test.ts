/**
 * outfitRenderer 测试
 * 验证装扮图层组合器的排序、SVG 包装和物种差异缩放
 */
import { describe, it, expect, vi } from 'vitest'
import { composeOutfitLayers, resolveOutfitLayers } from './outfitRenderer'
import type { OutfitLayer, OutfitSlotMap } from '../../types/wardrobeTypes'
import type { PetSpecies } from '../../types/avatarTypes'

vi.mock('../../data/wardrobe/accessories', () => ({
  getAccessoryById: vi.fn((id: string) => {
    const map: Record<string, { id: string; slot: string; svgPath: string }> = {
      hat_bowler: { id: 'hat_bowler', slot: 'head', svgPath: 'svgFragments/hat_bowler.svg' },
      scarf_red: { id: 'scarf_red', slot: 'neck', svgPath: 'svgFragments/scarf_red.svg' },
      tshirt_blue: { id: 'tshirt_blue', slot: 'body', svgPath: 'svgFragments/tshirt_blue.svg' },
      socks_small: { id: 'socks_small', slot: 'feet', svgPath: 'svgFragments/socks_small.svg' },
      backpack_small: { id: 'backpack_small', slot: 'back', svgPath: 'svgFragments/backpack_small.svg' },
    }
    return map[id]
  }),
}))

describe('composeOutfitLayers', () => {
  it('returns empty string for empty array', () => {
    const result = composeOutfitLayers([])
    expect(result).toBe('')
  })

  it('composes layers sorted by zIndex ascending', () => {
    const layers: OutfitLayer[] = [
      { slot: 'head', accessoryId: 'hat_bowler', svgPath: 'hat.svg', zIndex: 10 },
      { slot: 'feet', accessoryId: 'socks_small', svgPath: 'socks.svg', zIndex: 1 },
      { slot: 'body', accessoryId: 'tshirt_blue', svgPath: 'tshirt.svg', zIndex: 2 },
    ]
    const result = composeOutfitLayers(layers)
    const feetPos = result.indexOf('socks.svg')
    const bodyPos = result.indexOf('tshirt.svg')
    const headPos = result.indexOf('hat.svg')
    expect(feetPos).toBeLessThan(bodyPos)
    expect(bodyPos).toBeLessThan(headPos)
  })

  it('wraps each layer in a g tag', () => {
    const layers: OutfitLayer[] = [
      { slot: 'feet', accessoryId: 'socks_small', svgPath: 'socks.svg', zIndex: 1 },
    ]
    const result = composeOutfitLayers(layers)
    expect(result).toContain('<g')
    expect(result).toContain('</g>')
  })

  it('adds transform attribute when layer has transform', () => {
    const layers: OutfitLayer[] = [
      { slot: 'head', accessoryId: 'hat_bowler', svgPath: 'hat.svg', zIndex: 10, transform: 'scale(0.85, 0.9)' },
    ]
    const result = composeOutfitLayers(layers)
    expect(result).toContain('transform="scale(0.85, 0.9)"')
  })

  it('omits transform attribute when layer has no transform', () => {
    const layers: OutfitLayer[] = [
      { slot: 'feet', accessoryId: 'socks_small', svgPath: 'socks.svg', zIndex: 1 },
    ]
    const result = composeOutfitLayers(layers)
    expect(result).not.toContain('transform=')
  })
})

describe('resolveOutfitLayers', () => {
  it('converts OutfitSlotMap to sorted OutfitLayer array', () => {
    const slots: OutfitSlotMap = {
      head: 'hat_bowler',
      feet: 'socks_small',
    }
    const result = resolveOutfitLayers(slots, 'dog')
    expect(result).toHaveLength(2)
    expect(result[0].slot).toBe('feet')
    expect(result[0].zIndex).toBe(1)
    expect(result[1].slot).toBe('head')
    expect(result[1].zIndex).toBe(10)
  })

  it('resolves svgPath from accessory definition', () => {
    const slots: OutfitSlotMap = {
      head: 'hat_bowler',
    }
    const result = resolveOutfitLayers(slots, 'dog')
    expect(result[0].svgPath).toBe('svgFragments/hat_bowler.svg')
  })

  it('skips empty slot values', () => {
    const slots: OutfitSlotMap = {
      head: 'hat_bowler',
      neck: undefined as unknown as string,
    }
    const result = resolveOutfitLayers(slots, 'dog')
    expect(result).toHaveLength(1)
    expect(result[0].slot).toBe('head')
  })

  it('applies scale transform for cat species', () => {
    const slots: OutfitSlotMap = {
      head: 'hat_bowler',
    }
    const result = resolveOutfitLayers(slots, 'cat')
    expect(result[0].transform).toBe('scale(0.85, 0.9)')
  })

  it('does not apply scale transform for dog species', () => {
    const slots: OutfitSlotMap = {
      head: 'hat_bowler',
    }
    const result = resolveOutfitLayers(slots, 'dog')
    expect(result[0].transform).toBeUndefined()
  })

  it('returns empty array for empty slot map', () => {
    const result = resolveOutfitLayers({}, 'dog')
    expect(result).toHaveLength(0)
  })

  it('sets accessoryId to null when accessory not found', () => {
    const slots: OutfitSlotMap = {
      head: 'nonexistent_hat',
    }
    const result = resolveOutfitLayers(slots, 'dog')
    expect(result).toHaveLength(1)
    expect(result[0].accessoryId).toBeNull()
  })
})
