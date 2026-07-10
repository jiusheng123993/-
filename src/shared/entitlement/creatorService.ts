import type { EntitlementService } from './entitlementService'

export type CreatorAssetType = 'theme' | 'template' | 'habit_pack' | 'pomodoro_scene' | 'avatar_pack'

export type AssetStatus = 'draft' | 'reviewing' | 'published' | 'offline' | 'rejected'

export interface CreatorAsset {
  id: string
  creatorId: string
  type: CreatorAssetType
  name: string
  description: string
  coverUrl: string
  contentRef: string
  price: number
  status: AssetStatus
  reviewNotes?: string
  shareRatio: number
  publishedAt?: string
  salesCount: number
  rating: number
}

export interface CreatorAccount {
  userId: string
  realNameVerified: boolean
  certifiedAt?: string
  payoutAccount?: { type: 'wechat' | 'alipay'; mask: string }
  totalRevenue: number
  pendingRevenue: number
  withdrawnRevenue: number
}

export interface CreatorPayout {
  id: string
  creatorId: string
  amount: number
  status: 'pending' | 'processing' | 'paid' | 'failed'
  period: string
  createdAt: string
}

export interface CreatorMarketplaceService {
  applyForCreator(userId: string, realName: string): void
  verifyCreator(userId: string): void
  isCreator(userId: string): boolean
  getCreatorAccount(userId: string): CreatorAccount | null

  createAsset(creatorId: string, asset: Omit<CreatorAsset, 'id' | 'salesCount' | 'rating'>): CreatorAsset
  updateAsset(creatorId: string, assetId: string, updates: Partial<CreatorAsset>): void
  submitForReview(creatorId: string, assetId: string): void
  publishAsset(creatorId: string, assetId: string): void
  offlineAsset(creatorId: string, assetId: string): void
  getCreatorAssets(creatorId: string): CreatorAsset[]
  getAssetById(assetId: string): CreatorAsset | null

  recordSale(assetId: string, amount: number): void
  calculateCreatorRevenue(creatorId: string, period: string): number
  requestPayout(creatorId: string, amount: number): CreatorPayout
  getPayoutHistory(creatorId: string): CreatorPayout[]
}

const PLATFORM_SHARE_RATIO = 0.3

function generateAssetId(): string {
  return `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function generatePayoutId(): string {
  return `payout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function createCreatorService(_entitlementService: EntitlementService): CreatorMarketplaceService {
  const creatorAccounts = new Map<string, CreatorAccount>()
  const creatorAssets = new Map<string, CreatorAsset>()
  const creatorSales = new Map<string, { assetId: string; amount: number; timestamp: string }[]>()
  const payouts = new Map<string, CreatorPayout[]>()

  return {
    applyForCreator(userId: string, _realName: string): void {
      const account: CreatorAccount = {
        userId,
        realNameVerified: false,
        totalRevenue: 0,
        pendingRevenue: 0,
        withdrawnRevenue: 0
      }
      creatorAccounts.set(userId, account)
    },

    verifyCreator(userId: string): void {
      const account = creatorAccounts.get(userId)
      if (account) {
        account.realNameVerified = true
        account.certifiedAt = new Date().toISOString()
      }
    },

    isCreator(userId: string): boolean {
      const account = creatorAccounts.get(userId)
      return account?.realNameVerified ?? false
    },

    getCreatorAccount(userId: string): CreatorAccount | null {
      return creatorAccounts.get(userId) ?? null
    },

    createAsset(
      creatorId: string,
      asset: Omit<CreatorAsset, 'id' | 'salesCount' | 'rating'>
    ): CreatorAsset {
      const newAsset: CreatorAsset = {
        ...asset,
        id: generateAssetId(),
        creatorId,
        salesCount: 0,
        rating: 0
      }
      creatorAssets.set(newAsset.id, newAsset)
      return newAsset
    },

    updateAsset(creatorId: string, assetId: string, updates: Partial<CreatorAsset>): void {
      const asset = creatorAssets.get(assetId)
      if (asset && asset.creatorId === creatorId) {
        Object.assign(asset, updates)
      }
    },

    submitForReview(creatorId: string, assetId: string): void {
      const asset = creatorAssets.get(assetId)
      if (asset && asset.creatorId === creatorId) {
        asset.status = 'reviewing'
      }
    },

    publishAsset(creatorId: string, assetId: string): void {
      const asset = creatorAssets.get(assetId)
      if (asset && asset.creatorId === creatorId) {
        asset.status = 'published'
        asset.publishedAt = new Date().toISOString()
      }
    },

    offlineAsset(creatorId: string, assetId: string): void {
      const asset = creatorAssets.get(assetId)
      if (asset && asset.creatorId === creatorId) {
        asset.status = 'offline'
      }
    },

    getCreatorAssets(creatorId: string): CreatorAsset[] {
      return Array.from(creatorAssets.values()).filter((a) => a.creatorId === creatorId)
    },

    getAssetById(assetId: string): CreatorAsset | null {
      return creatorAssets.get(assetId) ?? null
    },

    recordSale(assetId: string, amount: number): void {
      const asset = creatorAssets.get(assetId)
      if (!asset) return

      asset.salesCount += 1

      const creatorId = asset.creatorId
      const creatorRevenue = amount * (1 - PLATFORM_SHARE_RATIO)

      const sales = creatorSales.get(creatorId) ?? []
      sales.push({ assetId, amount: creatorRevenue, timestamp: new Date().toISOString() })
      creatorSales.set(creatorId, sales)

      const account = creatorAccounts.get(creatorId)
      if (account) {
        account.totalRevenue += creatorRevenue
        account.pendingRevenue += creatorRevenue
      }
    },

    calculateCreatorRevenue(creatorId: string, _period: string): number {
      const sales = creatorSales.get(creatorId) ?? []
      return sales.reduce((sum, sale) => sum + sale.amount, 0)
    },

    requestPayout(creatorId: string, amount: number): CreatorPayout {
      const account = creatorAccounts.get(creatorId)
      if (!account || account.pendingRevenue < amount) {
        throw new Error('Insufficient pending revenue')
      }

      const payout: CreatorPayout = {
        id: generatePayoutId(),
        creatorId,
        amount,
        status: 'pending',
        period: new Date().toISOString().slice(0, 7),
        createdAt: new Date().toISOString()
      }

      const payoutList = payouts.get(creatorId) ?? []
      payoutList.push(payout)
      payouts.set(creatorId, payoutList)

      account.pendingRevenue -= amount

      return payout
    },

    getPayoutHistory(creatorId: string): CreatorPayout[] {
      return payouts.get(creatorId) ?? []
    }
  }
}
