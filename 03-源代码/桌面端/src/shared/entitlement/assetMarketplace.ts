import type { CreatorAsset, CreatorAssetType, AssetStatus } from './creatorService'

export interface MarketplaceProduct {
  id: string
  type: CreatorAssetType
  name: string
  description: string
  coverUrl: string
  price: number
  creatorId?: string
  contentRef: string
  salesCount: number
  rating: number
}

export interface AssetFilters {
  type?: CreatorAssetType
  status?: AssetStatus
  minPrice?: number
  maxPrice?: number
  creatorId?: string
  searchKeyword?: string
}

export interface AssetSortOption {
  field: 'salesCount' | 'rating' | 'price' | 'publishedAt'
  order: 'asc' | 'desc'
}

export interface AssetMarketplace {
  getPublishedAssets(filters?: AssetFilters, sort?: AssetSortOption): MarketplaceProduct[]
  getAssetById(assetId: string): MarketplaceProduct | null
  searchAssets(keyword: string): MarketplaceProduct[]
  getAssetsByType(type: CreatorAssetType): MarketplaceProduct[]
  getFeaturedAssets(limit?: number): MarketplaceProduct[]
  getTopRatedAssets(limit?: number): MarketplaceProduct[]
}

export function createAssetMarketplace(getCreatorAssets: () => CreatorAsset[]): AssetMarketplace {
  const toMarketplaceProduct = (asset: CreatorAsset): MarketplaceProduct => ({
    id: asset.id,
    type: asset.type,
    name: asset.name,
    description: asset.description,
    coverUrl: asset.coverUrl,
    price: asset.price,
    creatorId: asset.creatorId,
    contentRef: asset.contentRef,
    salesCount: asset.salesCount,
    rating: asset.rating
  })

  const filterAssets = (assets: CreatorAsset[], filters?: AssetFilters): CreatorAsset[] => {
    if (!filters) return assets

    return assets.filter((asset) => {
      if (filters.type && asset.type !== filters.type) return false
      if (filters.status && asset.status !== filters.status) return false
      if (filters.minPrice && asset.price < filters.minPrice) return false
      if (filters.maxPrice && asset.price > filters.maxPrice) return false
      if (filters.creatorId && asset.creatorId !== filters.creatorId) return false
      if (filters.searchKeyword) {
        const keyword = filters.searchKeyword.toLowerCase()
        const matchName = asset.name.toLowerCase().includes(keyword)
        const matchDesc = asset.description.toLowerCase().includes(keyword)
        if (!matchName && !matchDesc) return false
      }
      return true
    })
  }

  const sortAssets = (assets: CreatorAsset[], sort?: AssetSortOption): CreatorAsset[] => {
    if (!sort) {
      return assets.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    }

    return [...assets].sort((a, b) => {
      let aVal: string | number = 0
      let bVal: string | number = 0

      switch (sort.field) {
        case 'salesCount':
          aVal = a.salesCount || 0
          bVal = b.salesCount || 0
          break
        case 'rating':
          aVal = a.rating || 0
          bVal = b.rating || 0
          break
        case 'price':
          aVal = a.price
          bVal = b.price
          break
        case 'publishedAt':
          aVal = a.publishedAt || ''
          bVal = b.publishedAt || ''
          break
      }

      if (aVal < bVal) return sort.order === 'asc' ? -1 : 1
      if (aVal > bVal) return sort.order === 'asc' ? 1 : -1
      return 0
    })
  }

  return {
    getPublishedAssets(filters?: AssetFilters, sort?: AssetSortOption): MarketplaceProduct[] {
      const allAssets = getCreatorAssets()
      const published = filterAssets(allAssets, { ...filters, status: 'published' })
      const sorted = sortAssets(published, sort)
      return sorted.map(toMarketplaceProduct)
    },

    getAssetById(assetId: string): MarketplaceProduct | null {
      const allAssets = getCreatorAssets()
      const asset = allAssets.find((a) => a.id === assetId && a.status === 'published')
      return asset ? toMarketplaceProduct(asset) : null
    },

    searchAssets(keyword: string): MarketplaceProduct[] {
      return this.getPublishedAssets({ searchKeyword: keyword })
    },

    getAssetsByType(type: CreatorAssetType): MarketplaceProduct[] {
      return this.getPublishedAssets({ type })
    },

    getFeaturedAssets(limit = 10): MarketplaceProduct[] {
      return this.getPublishedAssets(undefined, { field: 'salesCount', order: 'desc' }).slice(0, limit)
    },

    getTopRatedAssets(limit = 10): MarketplaceProduct[] {
      return this.getPublishedAssets(undefined, { field: 'rating', order: 'desc' }).slice(0, limit)
    }
  }
}
