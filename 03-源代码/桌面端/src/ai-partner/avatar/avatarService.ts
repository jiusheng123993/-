import type { AvatarDefinition, AvatarRenderMode, AvatarStyle } from './avatarTypes'
import { avatarStore } from './avatarStore'
import { BUILTIN_AVATARS, AVATAR_CONSTRAINTS } from './avatarTypes'
import type { IAvatarAIProvider } from './avatarAIProvider'
import { avatarAIProvider } from './avatarAIProvider'
import { checkEvolutionRules, applyEvolutionRewards, updateEvolutionStats } from './evolutionEngine'

export type AvatarService = {
  getAvatars: (userId: string) => AvatarDefinition[]
  getActiveAvatar: (userId: string) => AvatarDefinition | undefined
  setActiveAvatar: (userId: string, avatarId: string) => AvatarDefinition | undefined
  createFromBuiltin: (userId: string, builtinId: string, name?: string) => AvatarDefinition | null
  generateWithAI: (userId: string, prompt: string, style: AvatarStyle, renderMode: AvatarRenderMode) => Promise<AvatarDefinition | null>
  createFromRPM: (userId: string, rpmAvatarUrl: string, name: string) => AvatarDefinition | null
  createFromUpload: (userId: string, name: string, stickerUrl: string) => AvatarDefinition | null
  updateAvatar: (avatarId: string, userId: string, patch: Partial<AvatarDefinition>) => AvatarDefinition | undefined
  deleteAvatar: (avatarId: string, userId: string) => boolean
  bindToPersona: (avatarId: string, userId: string, personaId: string) => AvatarDefinition | undefined
  unbindFromPersona: (avatarId: string, userId: string) => AvatarDefinition | undefined
  recordFocus: (avatarId: string, minutes: number) => AvatarDefinition | undefined
  recordTaskComplete: (avatarId: string) => AvatarDefinition | undefined
  recordStreak: (avatarId: string, streakDays: number) => AvatarDefinition | undefined
  checkAndApplyEvolution: (avatarId: string) => ReturnType<typeof checkEvolutionRules>
  getBuiltinAvatars: () => typeof BUILTIN_AVATARS
  canGenerateAI: (userId: string) => boolean
  getRemainingGenerations: (userId: string) => number
}

function getEntitlementValue(_userId: string, key: string): number {
  try {
    const raw = localStorage.getItem('xinghuanhai_entitlements')
    if (!raw) return 0
    const entitlements = JSON.parse(raw) as Record<string, unknown>
    return entitlements[key] ? 1 : 0
  } catch {
    return 0
  }
}

function getAILimit(_userId: string): number {
  try {
    const raw = localStorage.getItem('xinghuanhai_entitlements')
    if (!raw) return 0
    const entitlements = JSON.parse(raw) as Record<string, unknown>
    if (typeof entitlements.avatar_ai_gen === 'number') return entitlements.avatar_ai_gen as number
    return entitlements.avatar_ai_gen ? AVATAR_CONSTRAINTS.AI_GENERATION_MONTHLY_LIMIT : 0
  } catch {
    return 0
  }
}

export function createAvatarService(
  store: typeof avatarStore = avatarStore,
  aiProvider: IAvatarAIProvider = avatarAIProvider
): AvatarService {
  return {
    getAvatars: (userId) => store.getAvatars(userId),

    getActiveAvatar: (userId) => store.getActiveAvatar(userId),

    setActiveAvatar: (userId, avatarId) => store.setActiveAvatar(userId, avatarId),

    createFromBuiltin: (userId, builtinId, name) => {
      const builtin = BUILTIN_AVATARS.find(b => b.id === builtinId)
      if (!builtin) return null
      return store.createAvatar({
        userId,
        name: name || builtin.name,
        source: 'builtin',
        renderMode: builtin.renderMode,
        thumbnailUrl: builtin.thumbnailUrl,
        modelUrl: builtin.modelUrl,
        stickerUrl: builtin.stickerUrl
      })
    },

    generateWithAI: async (userId, prompt, style, renderMode) => {
      const limit = getAILimit(userId)
      if (limit <= 0) throw new Error('No AI generation entitlement')
      const monthlyCount = store.getMonthlyGenerationCount(userId)
      if (monthlyCount >= limit) throw new Error('Monthly generation limit reached')

      try {
        const request = await aiProvider.generate(prompt, style, renderMode)
        if (request.status === 'completed' && request.result) {
          return request.result
        }
        return null
      } catch {
        return null
      }
    },

    createFromRPM: (userId, rpmAvatarUrl, name) => {
      if (!getEntitlementValue(userId, 'avatar_rpm')) return null
      return store.createAvatar({
        userId,
        name,
        source: 'ready_player_me',
        renderMode: '3d_gltf',
        thumbnailUrl: 'assets/avatars/rpm_placeholder_thumb.png',
        rpmAvatarUrl
      })
    },

    createFromUpload: (userId, name, stickerUrl) => {
      return store.createAvatar({
        userId,
        name,
        source: 'user_upload',
        renderMode: '2d_sticker',
        thumbnailUrl: stickerUrl,
        stickerUrl
      })
    },

    updateAvatar: (avatarId, userId, patch) => {
      const avatar = store.getAvatarById(avatarId)
      if (!avatar || avatar.userId !== userId) return undefined
      return store.updateAvatar(avatarId, patch)
    },

    deleteAvatar: (avatarId, userId) => {
      const avatar = store.getAvatarById(avatarId)
      if (!avatar || avatar.userId !== userId) return false
      return store.deleteAvatar(avatarId)
    },

    bindToPersona: (avatarId, userId, personaId) => {
      const avatar = store.getAvatarById(avatarId)
      if (!avatar || avatar.userId !== userId) return undefined
      return store.updateAvatar(avatarId, { personaId })
    },

    unbindFromPersona: (avatarId, userId) => {
      const avatar = store.getAvatarById(avatarId)
      if (!avatar || avatar.userId !== userId) return undefined
      return store.updateAvatar(avatarId, { personaId: undefined })
    },

    recordFocus: (avatarId, minutes) => {
      const avatar = store.getAvatarById(avatarId)
      if (!avatar) return undefined
      const newEvolution = updateEvolutionStats(avatar, { focusMinutes: minutes })
      return store.updateEvolution(avatarId, newEvolution)
    },

    recordTaskComplete: (avatarId) => {
      const avatar = store.getAvatarById(avatarId)
      if (!avatar) return undefined
      const newEvolution = updateEvolutionStats(avatar, { tasksCompleted: 1 })
      return store.updateEvolution(avatarId, newEvolution)
    },

    recordStreak: (avatarId, streakDays) => {
      const avatar = store.getAvatarById(avatarId)
      if (!avatar) return undefined
      const newEvolution = updateEvolutionStats(avatar, { streakDays })
      return store.updateEvolution(avatarId, newEvolution)
    },

    checkAndApplyEvolution: (avatarId) => {
      const avatar = store.getAvatarById(avatarId)
      if (!avatar) return { newlyUnlocked: [], newLevel: 1 }
      const result = checkEvolutionRules(avatar)
      if (result.newlyUnlocked.length > 0) {
        const newEvolution = applyEvolutionRewards(avatar, result.newlyUnlocked)
        store.updateEvolution(avatarId, newEvolution)
      }
      return result
    },

    getBuiltinAvatars: () => BUILTIN_AVATARS,

    canGenerateAI: (userId) => {
      const limit = getAILimit(userId)
      if (limit <= 0) return false
      const monthlyCount = store.getMonthlyGenerationCount(userId)
      return monthlyCount < limit
    },

    getRemainingGenerations: (userId) => {
      const limit = getAILimit(userId)
      const monthlyCount = store.getMonthlyGenerationCount(userId)
      return Math.max(0, limit - monthlyCount)
    }
  }
}

export const avatarService = createAvatarService()
