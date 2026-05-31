import { describe, expect, it } from 'vitest'
import { getDefaultMiniProgramModules, miniProgramBlueprint } from './miniProgramBlueprint'

describe('miniProgramBlueprint', () => {
  it('defines the mini program as a complete mobile app instead of a remote control', () => {
    expect(miniProgramBlueprint.positioning).toBe('可独立使用的完整移动版应用')
    expect(miniProgramBlueprint.desktopBoundary).toContain('深度规划')
    expect(miniProgramBlueprint.mobileBoundary).toContain('快速记录')
    expect(miniProgramBlueprint.recommendedThemeId).toBe('cream-dopamine')
  })

  it('uses five mobile-first navigation entries', () => {
    expect(miniProgramBlueprint.navigation.map((item) => item.id)).toEqual([
      'home',
      'plan',
      'quick-add',
      'modules',
      'profile'
    ])
    expect(miniProgramBlueprint.navigation.find((item) => item.id === 'quick-add')?.purpose).toContain('错题')
  })

  it('keeps the first version complete but modular', () => {
    expect(miniProgramBlueprint.modules.map((module) => module.id)).toEqual([
      'mobile-workbench',
      'planner',
      'quick-capture',
      'focus-checkin',
      'review-stats',
      'module-center',
      'theme-center',
      'privacy-sync'
    ])
    expect(getDefaultMiniProgramModules()).toHaveLength(8)
  })

  it('marks privacy and sync as sensitive and local-first', () => {
    const privacyModule = miniProgramBlueprint.modules.find((module) => module.id === 'privacy-sync')

    expect(privacyModule?.privacyLevel).toBe('sensitive')
    expect(miniProgramBlueprint.syncStrategy).toContain('不强制上线真实云同步')
  })

  it('chooses native WeChat Mini Program as the first mobile implementation route', () => {
    expect(miniProgramBlueprint.implementationRoute).toEqual({
      platform: 'wechat-miniprogram',
      framework: 'native',
      projectRoot: 'miniprogram',
      reason: '优先保证微信生态体验、低依赖和后续审核兼容性'
    })
  })
})
