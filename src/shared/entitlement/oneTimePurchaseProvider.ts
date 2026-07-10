import type { EntitlementService } from './entitlementService'
import type { EntitlementCode } from './entitlementTypes'

export type OneTimeProductType = 'theme' | 'template' | 'habit_pack' | 'pomodoro_scene' | 'avatar_pack'

export interface OneTimeProduct {
  id: string
  type: OneTimeProductType
  name: string
  description: string
  coverUrl: string
  price: number
  creatorId?: string
  contentRef: string
}

export interface OneTimePurchaseProvider {
  purchase(userId: string, product: OneTimeProduct): void
  hasPurchased(userId: string, productId: string): boolean
  listPurchased(userId: string): string[]
}

export function createOneTimePurchaseProvider(
  entitlementService: EntitlementService
): OneTimePurchaseProvider {
  return {
    purchase(userId: string, product: OneTimeProduct): void {
      const entitlementCode = `${product.type}_${product.id}` as EntitlementCode
      entitlementService.grant(userId, {
        code: entitlementCode,
        source: 'one_time_purchase',
        expireAt: null,
        scope: product.contentRef
      })
    },

    hasPurchased(userId: string, productId: string): boolean {
      const types: OneTimeProductType[] = ['theme', 'template', 'habit_pack', 'pomodoro_scene', 'avatar_pack']
      return types.some((type) => {
        const code = `${type}_${productId}` as EntitlementCode
        return entitlementService.has(userId, code)
      })
    },

    listPurchased(userId: string): string[] {
      const entitlements = entitlementService.list(userId)
      return entitlements
        .filter((e) => e.source === 'one_time_purchase')
        .map((e) => e.code.replace(/^(theme|template|habit_pack|pomodoro_scene|avatar_pack)_/, ''))
    }
  }
}
