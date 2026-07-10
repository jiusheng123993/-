import { describe, it, expect, beforeEach } from 'vitest'
import { createAssetMarketplace } from './assetMarketplace'
import type { CreatorAsset } from './creatorService'

describe('AssetMarketplace', () => {
  let marketplace: ReturnType<typeof createAssetMarketplace>
  let mockAssets: CreatorAsset[]

  beforeEach(() => {
    mockAssets = [
      {
        id: 'asset-1',
        creatorId: 'creator-1',
        type: 'theme',
        name: '多巴胺主题',
        description: '活力多巴胺配色',
        coverUrl: '/themes/dopamine.png',
        contentRef: 'dopamine',
        price: 600,
        status: 'published',
        shareRatio: 0.7,
        publishedAt: '2026-01-01',
        salesCount: 100,
        rating: 4.5
      },
      {
        id: 'asset-2',
        creatorId: 'creator-1',
        type: 'template',
        name: '考研 30 天计划',
        description: '完整考研备考计划',
        coverUrl: '/templates/kaoyan.png',
        contentRef: 'kaoyan-30days',
        price: 1200,
        status: 'published',
        shareRatio: 0.7,
        publishedAt: '2026-01-15',
        salesCount: 50,
        rating: 4.8
      },
      {
        id: 'asset-3',
        creatorId: 'creator-2',
        type: 'theme',
        name: '水墨主题',
        description: '水墨画风格',
        coverUrl: '/themes/ink.png',
        contentRef: 'ink',
        price: 800,
        status: 'published',
        shareRatio: 0.7,
        publishedAt: '2026-02-01',
        salesCount: 30,
        rating: 4.2
      },
      {
        id: 'asset-4',
        creatorId: 'creator-1',
        type: 'pomodoro_scene',
        name: '图书馆场景',
        description: '图书馆白噪音',
        coverUrl: '/scenes/library.png',
        contentRef: 'library',
        price: 300,
        status: 'draft',
        shareRatio: 0.7,
        salesCount: 0,
        rating: 0
      }
    ]

    marketplace = createAssetMarketplace(() => mockAssets)
  })

  it('should get only published assets', () => {
    const assets = marketplace.getPublishedAssets()
    expect(assets).toHaveLength(3)
    expect(assets.every((a) => a.id !== 'asset-4')).toBe(true)
  })

  it('should filter assets by type', () => {
    const themes = marketplace.getAssetsByType('theme')
    expect(themes).toHaveLength(2)
    expect(themes.every((t) => t.type === 'theme')).toBe(true)
  })

  it('should filter assets by price range', () => {
    const assets = marketplace.getPublishedAssets({ minPrice: 500, maxPrice: 1000 })
    expect(assets).toHaveLength(2)
    expect(assets.every((a) => a.price >= 500 && a.price <= 1000)).toBe(true)
  })

  it('should search assets by keyword', () => {
    const results = marketplace.searchAssets('考研')
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('考研 30 天计划')
  })

  it('should sort assets by sales count', () => {
    const assets = marketplace.getPublishedAssets(undefined, { field: 'salesCount', order: 'desc' })
    expect(assets[0].salesCount).toBe(100)
    expect(assets[1].salesCount).toBe(50)
    expect(assets[2].salesCount).toBe(30)
  })

  it('should sort assets by rating', () => {
    const assets = marketplace.getPublishedAssets(undefined, { field: 'rating', order: 'desc' })
    expect(assets[0].rating).toBe(4.8)
    expect(assets[1].rating).toBe(4.5)
    expect(assets[2].rating).toBe(4.2)
  })

  it('should get featured assets by default sort', () => {
    const featured = marketplace.getFeaturedAssets(2)
    expect(featured).toHaveLength(2)
    expect(featured[0].id).toBe('asset-1')
  })

  it('should get top rated assets', () => {
    const topRated = marketplace.getTopRatedAssets(2)
    expect(topRated).toHaveLength(2)
    expect(topRated[0].id).toBe('asset-2')
  })

  it('should get asset by id', () => {
    const asset = marketplace.getAssetById('asset-1')
    expect(asset).not.toBeNull()
    expect(asset?.name).toBe('多巴胺主题')
  })

  it('should return null for non-existent asset', () => {
    const asset = marketplace.getAssetById('non-existent')
    expect(asset).toBeNull()
  })

  it('should filter by creator id', () => {
    const assets = marketplace.getPublishedAssets({ creatorId: 'creator-1' })
    expect(assets).toHaveLength(2)
  })
})
