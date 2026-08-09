/**
 * 预设头像库测试
 * 验证 16 款预设（狗 8 + 猫 8）数据完整、ID 唯一、按物种筛选正确
 */
import { describe, it, expect } from 'vitest'
// 头像数据已随资源移到 pagesPet 分包内（主包体积优化），测试改为引用新路径
import { AVATAR_PRESETS, getPresetsBySpecies } from '../pagesPet/avatar-customize/data/avatarPresets'

describe('预设头像库', () => {
  it('共 16 款：狗 8 款 + 猫 8 款', () => {
    expect(AVATAR_PRESETS).toHaveLength(16)
    expect(AVATAR_PRESETS.filter((item) => item.species === 'dog')).toHaveLength(8)
    expect(AVATAR_PRESETS.filter((item) => item.species === 'cat')).toHaveLength(8)
  })

  it('ID 唯一且格式为 物种-画风', () => {
    const ids = AVATAR_PRESETS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const item of AVATAR_PRESETS) {
      expect(item.id).toMatch(/^(dog|cat)-[a-z]+$/)
    }
  })

  it('每款都有图片资源、品种与画风名称', () => {
    for (const item of AVATAR_PRESETS) {
      expect(item.image).toBeTruthy()
      expect(item.breed).toBeTruthy()
      expect(item.styleLabel).toBeTruthy()
    }
  })

  it('狗与猫的画风 key 一一对应（同物种 8 款画风互不重复）', () => {
    const dogKeys = getPresetsBySpecies('dog').map((item) => item.styleKey)
    const catKeys = getPresetsBySpecies('cat').map((item) => item.styleKey)
    expect(new Set(dogKeys).size).toBe(8)
    expect(new Set(catKeys).size).toBe(8)
    expect(dogKeys.sort()).toEqual(catKeys.sort())
  })

  it('getPresetsBySpecies 按物种筛选', () => {
    expect(getPresetsBySpecies('dog').every((item) => item.species === 'dog')).toBe(true)
    expect(getPresetsBySpecies('cat').every((item) => item.species === 'cat')).toBe(true)
  })
})
