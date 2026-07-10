import {
  entitlementRepository,
  type Entitlement,
  type CreateEntitlementInput
} from '../data/repositories'

export const entitlementService = {
  async getUserEntitlements(userId: string): Promise<Entitlement[]> {
    return entitlementRepository.findByUserId(userId)
  },

  async hasEntitlement(userId: string, key: string): Promise<boolean> {
    const entitlement = await entitlementRepository.findByUserAndKey(userId, key)
    if (!entitlement) return false
    if (entitlement.expiresAt && new Date(entitlement.expiresAt) < new Date()) return false
    return true
  },

  async grantEntitlement(userId: string, input: Omit<CreateEntitlementInput, 'userId'>): Promise<Entitlement> {
    return entitlementRepository.create({ ...input, userId })
  },

  async revokeEntitlement(entitlementId: string): Promise<void> {
    return entitlementRepository.delete(entitlementId)
  }
}
