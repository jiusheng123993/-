import type { AvatarGenerationRequest, AvatarStyle, AvatarRenderMode } from './avatarTypes'
import { avatarStore } from './avatarStore'
import { AVATAR_CONSTRAINTS } from './avatarTypes'

export type IAvatarAIProvider = {
  generate: (prompt: string, style: AvatarStyle, renderMode: AvatarRenderMode) => Promise<AvatarGenerationRequest>
  checkStatus: (requestId: string) => Promise<AvatarGenerationRequest>
  cancel: (requestId: string) => boolean
}

function getEntitlementLimit(_userId: string): number {
  try {
    const raw = localStorage.getItem('xinghuanhai_entitlements')
    if (!raw) return 0
    const entitlements = JSON.parse(raw) as Record<string, unknown>
    return typeof entitlements.avatar_ai_gen === 'number'
      ? entitlements.avatar_ai_gen as number
      : entitlements.avatar_ai_gen ? AVATAR_CONSTRAINTS.AI_GENERATION_MONTHLY_LIMIT : 0
  } catch {
    return 0
  }
}

export type AvatarAIProviderConfig = {
  apiEndpoint: string
  apiKey: string
  maxRetries: number
  pollingIntervalMs: number
  timeoutMs: number
}

export const DEFAULT_AI_PROVIDER_CONFIG: AvatarAIProviderConfig = {
  apiEndpoint: '',
  apiKey: '',
  maxRetries: 3,
  pollingIntervalMs: 5000,
  timeoutMs: 120000
}

export function createAvatarAIProvider(config?: Partial<AvatarAIProviderConfig>): IAvatarAIProvider {
  const mergedConfig = { ...DEFAULT_AI_PROVIDER_CONFIG, ...config }

  return {
    generate: async (prompt, style, renderMode) => {
      const userId = getCurrentUserId()
      if (!userId) throw new Error('User not authenticated')

      const limit = getEntitlementLimit(userId)
      if (limit <= 0) throw new Error('No AI generation entitlement')

      const monthlyCount = avatarStore.getMonthlyGenerationCount(userId)
      if (monthlyCount >= limit) throw new Error(`Monthly generation limit reached (${limit})`)

      if (prompt.length > AVATAR_CONSTRAINTS.MAX_GENERATION_PROMPT_LENGTH) {
        throw new Error(`Prompt exceeds max length (${AVATAR_CONSTRAINTS.MAX_GENERATION_PROMPT_LENGTH})`)
      }

      const request = avatarStore.createGenerationRequest({
        userId,
        prompt,
        renderMode,
        style
      })

      try {
        avatarStore.updateGenerationStatus(request.id, 'processing')

        if (mergedConfig.apiEndpoint && mergedConfig.apiKey) {
          const response = await fetch(mergedConfig.apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${mergedConfig.apiKey}`
            },
            body: JSON.stringify({
              prompt,
              style,
              renderMode,
              requestId: request.id
            })
          })

          if (!response.ok) {
            avatarStore.updateGenerationStatus(request.id, 'failed', undefined, `API error: ${response.status}`)
            throw new Error(`Generation failed: ${response.status}`)
          }

          const data = await response.json()
          const resultAvatar = avatarStore.createAvatar({
            userId,
            name: `AI角色_${Date.now()}`,
            source: 'meshy_ai',
            renderMode,
            thumbnailUrl: data.thumbnailUrl || 'assets/avatars/ai_placeholder_thumb.png',
            modelUrl: data.modelUrl,
            stickerUrl: data.stickerUrl,
            aiPrompt: prompt,
            aiModelId: data.modelId
          })

          if (resultAvatar) {
            avatarStore.updateGenerationStatus(request.id, 'completed', resultAvatar)
          } else {
            avatarStore.updateGenerationStatus(request.id, 'failed', undefined, 'Failed to create avatar')
          }
        } else {
          const resultAvatar = avatarStore.createAvatar({
            userId,
            name: `AI角色_${prompt.slice(0, 10)}`,
            source: 'meshy_ai',
            renderMode: '2d_sticker',
            thumbnailUrl: 'assets/avatars/ai_placeholder_thumb.png',
            stickerUrl: 'assets/avatars/ai_placeholder_sticker.png',
            aiPrompt: prompt
          })

          if (resultAvatar) {
            avatarStore.updateGenerationStatus(request.id, 'completed', resultAvatar)
          }
        }

        return avatarStore.getGenerationById(request.id)!
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        avatarStore.updateGenerationStatus(request.id, 'failed', undefined, errorMsg)
        throw err
      }
    },

    checkStatus: async (requestId) => {
      const request = avatarStore.getGenerationById(requestId)
      if (!request) throw new Error('Request not found')
      return request
    },

    cancel: (requestId) => {
      const request = avatarStore.getGenerationById(requestId)
      if (!request || (request.status !== 'pending' && request.status !== 'processing')) return false
      avatarStore.updateGenerationStatus(requestId, 'failed', undefined, 'Cancelled by user')
      return true
    }
  }
}

function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem('xinghuanhai_current_user')
    if (!raw) return null
    const data = JSON.parse(raw) as { userId?: string }
    return data.userId || null
  } catch {
    return null
  }
}

export type RPMProviderConfig = {
  rpmApiEndpoint: string
  rpmSubdomain: string
}

export const DEFAULT_RPM_CONFIG: RPMProviderConfig = {
  rpmApiEndpoint: 'https://api.readyplayer.me/v1',
  rpmSubdomain: ''
}

export type IRPMProvider = {
  createAvatarUrl: (userId: string) => string
  getAvatarData: (avatarUrl: string) => Promise<Record<string, unknown>>
  updateAvatar: (avatarUrl: string, config: Record<string, unknown>) => Promise<string>
}

export function createRPMProvider(config?: Partial<RPMProviderConfig>): IRPMProvider {
  const mergedConfig = { ...DEFAULT_RPM_CONFIG, ...config }

  return {
    createAvatarUrl: (userId) => {
      return `${mergedConfig.rpmApiEndpoint}/avatars?frameApi&subdomain=${mergedConfig.rpmSubdomain}&userId=${userId}`
    },

    getAvatarData: async (avatarUrl) => {
      try {
        const response = await fetch(`${avatarUrl}.json`)
        if (!response.ok) throw new Error(`RPM API error: ${response.status}`)
        return await response.json()
      } catch {
        return {}
      }
    },

    updateAvatar: async (avatarUrl, config) => {
      try {
        const response = await fetch(avatarUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        })
        if (!response.ok) throw new Error(`RPM update error: ${response.status}`)
        return avatarUrl
      } catch {
        return avatarUrl
      }
    }
  }
}

export const avatarAIProvider = createAvatarAIProvider()
export const rpmProvider = createRPMProvider()