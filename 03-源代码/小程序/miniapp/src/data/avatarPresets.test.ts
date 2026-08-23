/**
 * 预设形象库测试
 * 验证 20 款预设（狗 10 + 猫 10）数据完整、ID 唯一、与家庭页品牌头像同源（key 一致）、按物种筛选正确
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock api 模块（resolveAvatarUrl 依赖 CONFIG.API_BASE_URL），与 homeStyleAvatars.test.ts 同一套约定
vi.mock('../services/api', () => ({
  resolveAvatarUrl: (path: string) => `https://mock-api.example.com${path}`,
}))

// 头像数据已随资源移到 pagesPet 分包内（主包体积优化），测试改为引用新路径
import { AVATAR_PRESETS, getPresetsBySpecies } from '../pagesPet/avatar-customize/data/avatarPresets'
import { HOME_STYLE_AVATARS } from './homeStyleAvatars'

describe('预设形象库', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('共 20 款：狗 10 款 + 猫 10 款', () => {
    expect(AVATAR_PRESETS).toHaveLength(20)
    expect(AVATAR_PRESETS.filter((item) => item.species === 'dog')).toHaveLength(10)
    expect(AVATAR_PRESETS.filter((item) => item.species === 'cat')).toHaveLength(10)
  })

  it('ID 唯一且格式为 物种-序号-英文名（与品牌头像 key 一致）', () => {
    const ids = AVATAR_PRESETS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const item of AVATAR_PRESETS) {
      expect(item.id).toMatch(/^(dog|cat)-[0-9]{2}-[a-z-]+$/)
    }
  })

  it('与家庭页头像同源：每个预设 key 都存在于品牌头像库，URL 指向 home-style 目录', () => {
    const homeKeys = new Set(HOME_STYLE_AVATARS.map((item) => item.key))
    for (const item of AVATAR_PRESETS) {
      // 预设 ID = 品牌头像 key，保证"形象"与"头像"是同一张图
      expect(homeKeys.has(item.id)).toBe(true)
      // 图片为服务端静态托管的绝对地址，且带物种子目录（形象与头像同源）
      expect(item.image).toMatch(/^https?:\/\/.+\/uploads\/avatars\/home-style\/(dog|cat)\/[a-z0-9-]+\.webp$/)
    }
  })

  it('每款都有品种展示名', () => {
    for (const item of AVATAR_PRESETS) {
      expect(item.breed).toBeTruthy()
    }
  })

  it('getPresetsBySpecies 按物种筛选', () => {
    expect(getPresetsBySpecies('dog').every((item) => item.species === 'dog')).toBe(true)
    expect(getPresetsBySpecies('cat').every((item) => item.species === 'cat')).toBe(true)
  })
})
