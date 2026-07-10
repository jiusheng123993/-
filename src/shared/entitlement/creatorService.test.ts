import { describe, it, expect, beforeEach } from 'vitest'
import { createCreatorService } from './creatorService'
import { createEntitlementService } from './entitlementService'

describe('CreatorService', () => {
  let creatorService: ReturnType<typeof createCreatorService>
  let entitlementService: ReturnType<typeof createEntitlementService>

  beforeEach(() => {
    entitlementService = createEntitlementService()
    creatorService = createCreatorService(entitlementService)
  })

  it('should allow user to apply for creator', () => {
    creatorService.applyForCreator('user-123', '张三')
    const account = creatorService.getCreatorAccount('user-123')
    expect(account).not.toBeNull()
    expect(account?.realNameVerified).toBe(false)
  })

  it('should verify creator after approval', () => {
    creatorService.applyForCreator('user-123', '张三')
    creatorService.verifyCreator('user-123')
    expect(creatorService.isCreator('user-123')).toBe(true)
  })

  it('should create asset as draft', () => {
    creatorService.applyForCreator('user-123', '张三')
    creatorService.verifyCreator('user-123')

    const asset = creatorService.createAsset('user-123', {
      creatorId: 'user-123',
      type: 'theme',
      name: '多巴胺主题',
      description: '活力多巴胺配色',
      coverUrl: '/themes/dopamine.png',
      contentRef: 'dopamine',
      price: 600,
      status: 'draft',
      shareRatio: 0.7
    })

    expect(asset.id).toBeDefined()
    expect(asset.status).toBe('draft')
    expect(asset.salesCount).toBe(0)
  })

  it('should submit asset for review', () => {
    creatorService.applyForCreator('user-123', '张三')
    creatorService.verifyCreator('user-123')

    const asset = creatorService.createAsset('user-123', {
      creatorId: 'user-123',
      type: 'theme',
      name: '测试主题',
      description: '',
      coverUrl: '',
      contentRef: 'test',
      price: 600,
      status: 'draft',
      shareRatio: 0.7
    })

    creatorService.submitForReview('user-123', asset.id)
    const updated = creatorService.getAssetById(asset.id)
    expect(updated?.status).toBe('reviewing')
  })

  it('should publish asset after approval', () => {
    creatorService.applyForCreator('user-123', '张三')
    creatorService.verifyCreator('user-123')

    const asset = creatorService.createAsset('user-123', {
      creatorId: 'user-123',
      type: 'template',
      name: '考研 30 天计划',
      description: '完整备考计划',
      coverUrl: '/templates/kaoyan.png',
      contentRef: 'kaoyan-30days',
      price: 1200,
      status: 'draft',
      shareRatio: 0.7
    })

    creatorService.submitForReview('user-123', asset.id)
    creatorService.publishAsset('user-123', asset.id)

    const published = creatorService.getAssetById(asset.id)
    expect(published?.status).toBe('published')
    expect(published?.publishedAt).toBeDefined()
  })

  it('should record sales and calculate revenue', () => {
    creatorService.applyForCreator('user-123', '张三')
    creatorService.verifyCreator('user-123')

    const asset = creatorService.createAsset('user-123', {
      creatorId: 'user-123',
      type: 'theme',
      name: '主题',
      description: '',
      coverUrl: '',
      contentRef: 'test',
      price: 600,
      status: 'draft',
      shareRatio: 0.7
    })

    creatorService.publishAsset('user-123', asset.id)
    creatorService.recordSale(asset.id, 600)

    const account = creatorService.getCreatorAccount('user-123')
    expect(account?.totalRevenue).toBe(420)
    expect(account?.pendingRevenue).toBe(420)
  })

  it('should request payout when sufficient revenue', () => {
    creatorService.applyForCreator('user-123', '张三')
    creatorService.verifyCreator('user-123')

    const asset = creatorService.createAsset('user-123', {
      creatorId: 'user-123',
      type: 'theme',
      name: '主题',
      description: '',
      coverUrl: '',
      contentRef: 'test',
      price: 1000,
      status: 'draft',
      shareRatio: 0.7
    })

    creatorService.publishAsset('user-123', asset.id)
    creatorService.recordSale(asset.id, 1000)

    const payout = creatorService.requestPayout('user-123', 300)
    expect(payout.amount).toBe(300)
    expect(payout.status).toBe('pending')

    const account = creatorService.getCreatorAccount('user-123')
    expect(account?.pendingRevenue).toBe(400)
  })

  it('should get creator assets list', () => {
    creatorService.applyForCreator('user-123', '张三')
    creatorService.verifyCreator('user-123')

    creatorService.createAsset('user-123', {
      creatorId: 'user-123',
      type: 'theme',
      name: '主题1',
      description: '',
      coverUrl: '',
      contentRef: 'ref1',
      price: 600,
      status: 'draft',
      shareRatio: 0.7
    })

    creatorService.createAsset('user-123', {
      creatorId: 'user-123',
      type: 'template',
      name: '模板1',
      description: '',
      coverUrl: '',
      contentRef: 'ref2',
      price: 1200,
      status: 'draft',
      shareRatio: 0.7
    })

    const assets = creatorService.getCreatorAssets('user-123')
    expect(assets).toHaveLength(2)
  })

  it('should throw error for insufficient revenue on payout', () => {
    creatorService.applyForCreator('user-123', '张三')
    creatorService.verifyCreator('user-123')

    expect(() => creatorService.requestPayout('user-123', 100)).toThrow()
  })
})
