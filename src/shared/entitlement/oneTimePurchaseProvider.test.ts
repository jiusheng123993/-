import { describe, it, expect, beforeEach } from 'vitest'
import { createOneTimePurchaseProvider } from './oneTimePurchaseProvider'
import { createEntitlementService } from './entitlementService'

describe('OneTimePurchaseProvider', () => {
  let provider: ReturnType<typeof createOneTimePurchaseProvider>
  let entitlementService: ReturnType<typeof createEntitlementService>

  beforeEach(() => {
    entitlementService = createEntitlementService()
    provider = createOneTimePurchaseProvider(entitlementService)
  })

  it('should grant theme entitlement after purchase', () => {
    const product = {
      id: 'theme-001',
      type: 'theme' as const,
      name: '多巴胺主题',
      description: '活力多巴胺配色',
      coverUrl: '/themes/dopamine.png',
      price: 600,
      contentRef: 'dopamine'
    }

    provider.purchase('user-123', product)
    expect(entitlementService.has('user-123', 'theme_theme-001')).toBe(true)
  })

  it('should grant template entitlement after purchase', () => {
    const product = {
      id: 'template-001',
      type: 'template' as const,
      name: '考研 30 天计划',
      description: '考研备考 30 天完整计划',
      coverUrl: '/templates/kaoyan.png',
      price: 1200,
      contentRef: 'kaoyan-30days'
    }

    provider.purchase('user-123', product)
    expect(entitlementService.has('user-123', 'template_template-001')).toBe(true)
  })

  it('should check if user has purchased product', () => {
    const product = {
      id: 'theme-002',
      type: 'theme' as const,
      name: '水墨主题',
      description: '水墨画风格',
      coverUrl: '/themes/ink.png',
      price: 800,
      contentRef: 'ink'
    }

    expect(provider.hasPurchased('user-123', 'theme-002')).toBe(false)

    provider.purchase('user-123', product)
    expect(provider.hasPurchased('user-123', 'theme-002')).toBe(true)
  })

  it('should list all purchased product ids', () => {
    provider.purchase('user-123', {
      id: 'theme-001',
      type: 'theme',
      name: '主题1',
      description: '',
      coverUrl: '',
      price: 600,
      contentRef: 'ref1'
    })

    provider.purchase('user-123', {
      id: 'template-001',
      type: 'template',
      name: '模板1',
      description: '',
      coverUrl: '',
      price: 1200,
      contentRef: 'ref2'
    })

    const purchased = provider.listPurchased('user-123')
    expect(purchased).toContain('theme-001')
    expect(purchased).toContain('template-001')
  })

  it('should handle pomodoro scene purchase', () => {
    provider.purchase('user-123', {
      id: 'scene-library',
      type: 'pomodoro_scene',
      name: '图书馆场景',
      description: '图书馆白噪音场景',
      coverUrl: '/scenes/library.png',
      price: 300,
      contentRef: 'library'
    })

    expect(provider.hasPurchased('user-123', 'scene-library')).toBe(true)
  })

  it('should handle avatar pack purchase', () => {
    provider.purchase('user-123', {
      id: 'avatar-anime-pack',
      type: 'avatar_pack',
      name: '动漫角色包',
      description: '5 个动漫风格角色立绘',
      coverUrl: '/avatars/anime.png',
      price: 1800,
      contentRef: 'anime-pack'
    })

    expect(provider.hasPurchased('user-123', 'avatar-anime-pack')).toBe(true)
  })
})
