import {
  identityRepository,
  type Identity,
  type CreateIdentityInput,
  type UpdateIdentityInput
} from '../data/repositories'

const MAX_IDENTITIES_PER_USER = 5

export const identityService = {
  async createIdentity(userId: string, input: Omit<CreateIdentityInput, 'userId'>): Promise<Identity> {
    if (!input.name.trim()) throw new Error('身份名称不能为空')

    const existing = await identityRepository.findByUserId(userId)
    if (existing.length >= MAX_IDENTITIES_PER_USER) {
      throw new Error(`最多创建 ${MAX_IDENTITIES_PER_USER} 个身份`)
    }

    return identityRepository.create({ ...input, userId })
  },

  async switchIdentity(userId: string, identityId: string): Promise<void> {
    await identityRepository.setActive(userId, identityId)
  },

  async getIdentities(userId: string): Promise<Identity[]> {
    return identityRepository.findByUserId(userId)
  },

  async getActiveIdentity(userId: string): Promise<Identity | null> {
    return identityRepository.findActive(userId)
  },

  async updateIdentity(identityId: string, patch: UpdateIdentityInput): Promise<Identity> {
    return identityRepository.update(identityId, patch)
  },

  async deleteIdentity(identityId: string): Promise<void> {
    return identityRepository.delete(identityId)
  }
}
