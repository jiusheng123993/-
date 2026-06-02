import type {
  AvatarDefinition,
  AvatarGenerationRequest,
  AvatarEvolution,
  AvatarRenderMode,
  AvatarSource
} from './avatarTypes'
import { DEFAULT_AVATAR_EVOLUTION, AVATAR_CONSTRAINTS } from './avatarTypes'

function generateId(prefix = 'av'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function loadAvatars(): AvatarDefinition[] {
  try {
    const raw = localStorage.getItem(AVATAR_CONSTRAINTS.AVATARS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AvatarDefinition[]
  } catch {
    return []
  }
}

function saveAvatars(avatars: AvatarDefinition[]): void {
  localStorage.setItem(AVATAR_CONSTRAINTS.AVATARS_STORAGE_KEY, JSON.stringify(avatars))
}

function loadGenerations(): AvatarGenerationRequest[] {
  try {
    const raw = localStorage.getItem(AVATAR_CONSTRAINTS.GENERATIONS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AvatarGenerationRequest[]
  } catch {
    return []
  }
}

function saveGenerations(generations: AvatarGenerationRequest[]): void {
  localStorage.setItem(AVATAR_CONSTRAINTS.GENERATIONS_STORAGE_KEY, JSON.stringify(generations))
}

export type AvatarStore = {
  getAvatars: (userId: string) => AvatarDefinition[]
  getAvatarById: (id: string) => AvatarDefinition | undefined
  getActiveAvatar: (userId: string) => AvatarDefinition | undefined
  createAvatar: (params: {
    userId: string
    name: string
    source: AvatarSource
    renderMode: AvatarRenderMode
    thumbnailUrl: string
    modelUrl?: string
    stickerUrl?: string
    personaId?: string
    aiPrompt?: string
    aiModelId?: string
    rpmAvatarUrl?: string
    rpmConfig?: Record<string, unknown>
  }) => AvatarDefinition | null
  updateAvatar: (id: string, patch: Partial<AvatarDefinition>) => AvatarDefinition | undefined
  deleteAvatar: (id: string) => boolean
  setActiveAvatar: (userId: string, avatarId: string) => AvatarDefinition | undefined
  updateEvolution: (id: string, patch: Partial<AvatarEvolution>) => AvatarDefinition | undefined
  addAnimation: (id: string, animation: AvatarDefinition['animations'][0]) => AvatarDefinition | undefined
  removeAnimation: (id: string, animationName: string) => AvatarDefinition | undefined
  getGenerationRequests: (userId: string) => AvatarGenerationRequest[]
  getGenerationById: (id: string) => AvatarGenerationRequest | undefined
  createGenerationRequest: (params: {
    userId: string
    prompt: string
    renderMode: AvatarRenderMode
    style?: string
  }) => AvatarGenerationRequest
  updateGenerationStatus: (id: string, status: AvatarGenerationRequest['status'], result?: AvatarDefinition, error?: string) => AvatarGenerationRequest | undefined
  getMonthlyGenerationCount: (userId: string) => number
}

const activeAvatarMap = new Map<string, string>()

export function createAvatarStore(): AvatarStore {
  return {
    getAvatars: (userId) => loadAvatars().filter(a => a.userId === userId),

    getAvatarById: (id) => loadAvatars().find(a => a.id === id),

    getActiveAvatar: (userId) => {
      const activeId = activeAvatarMap.get(userId)
      if (activeId) {
        const avatar = loadAvatars().find(a => a.id === activeId)
        if (avatar) return avatar
      }
      const avatars = loadAvatars().filter(a => a.userId === userId)
      return avatars[0]
    },

    createAvatar: (params) => {
      const avatars = loadAvatars()
      const userAvatars = avatars.filter(a => a.userId === params.userId)
      if (userAvatars.length >= AVATAR_CONSTRAINTS.MAX_AVATARS_PER_USER) return null
      const now = new Date().toISOString()
      const avatar: AvatarDefinition = {
        id: generateId(),
        userId: params.userId,
        name: params.name,
        source: params.source,
        renderMode: params.renderMode,
        thumbnailUrl: params.thumbnailUrl,
        modelUrl: params.modelUrl,
        stickerUrl: params.stickerUrl,
        personaId: params.personaId,
        aiPrompt: params.aiPrompt,
        aiModelId: params.aiModelId,
        rpmAvatarUrl: params.rpmAvatarUrl,
        rpmConfig: params.rpmConfig,
        evolution: { ...DEFAULT_AVATAR_EVOLUTION },
        animations: [],
        createdAt: now,
        updatedAt: now
      }
      avatars.push(avatar)
      saveAvatars(avatars)
      return avatar
    },

    updateAvatar: (id, patch) => {
      const avatars = loadAvatars()
      const idx = avatars.findIndex(a => a.id === id)
      if (idx === -1) return undefined
      avatars[idx] = { ...avatars[idx], ...patch, updatedAt: new Date().toISOString() }
      saveAvatars(avatars)
      return avatars[idx]
    },

    deleteAvatar: (id) => {
      const avatars = loadAvatars()
      const filtered = avatars.filter(a => a.id !== id)
      if (filtered.length === avatars.length) return false
      saveAvatars(filtered)
      activeAvatarMap.forEach((activeId, userId) => {
        if (activeId === id) activeAvatarMap.delete(userId)
      })
      return true
    },

    setActiveAvatar: (userId, avatarId) => {
      const avatar = loadAvatars().find(a => a.id === avatarId && a.userId === userId)
      if (!avatar) return undefined
      activeAvatarMap.set(userId, avatarId)
      return avatar
    },

    updateEvolution: (id, patch) => {
      const avatars = loadAvatars()
      const avatar = avatars.find(a => a.id === id)
      if (!avatar) return undefined
      avatar.evolution = { ...avatar.evolution, ...patch }
      avatar.updatedAt = new Date().toISOString()
      saveAvatars(avatars)
      return avatar
    },

    addAnimation: (id, animation) => {
      const avatars = loadAvatars()
      const avatar = avatars.find(a => a.id === id)
      if (!avatar) return undefined
      if (avatar.animations.some(a => a.name === animation.name)) return undefined
      avatar.animations.push(animation)
      avatar.updatedAt = new Date().toISOString()
      saveAvatars(avatars)
      return avatar
    },

    removeAnimation: (id, animationName) => {
      const avatars = loadAvatars()
      const avatar = avatars.find(a => a.id === id)
      if (!avatar) return undefined
      avatar.animations = avatar.animations.filter(a => a.name !== animationName)
      avatar.updatedAt = new Date().toISOString()
      saveAvatars(avatars)
      return avatar
    },

    getGenerationRequests: (userId) => loadGenerations().filter(g => g.userId === userId),

    getGenerationById: (id) => loadGenerations().find(g => g.id === id),

    createGenerationRequest: (params) => {
      const generations = loadGenerations()
      const now = new Date().toISOString()
      const request: AvatarGenerationRequest = {
        id: generateId('gen'),
        userId: params.userId,
        prompt: params.prompt,
        style: params.style as AvatarGenerationRequest['style'],
        renderMode: params.renderMode,
        status: 'pending',
        createdAt: now
      }
      generations.push(request)
      saveGenerations(generations)
      return request
    },

    updateGenerationStatus: (id, status, result, error) => {
      const generations = loadGenerations()
      const gen = generations.find(g => g.id === id)
      if (!gen) return undefined
      gen.status = status
      if (result) gen.result = result
      if (error) gen.error = error
      if (status === 'completed' || status === 'failed') {
        gen.completedAt = new Date().toISOString()
      }
      saveGenerations(generations)
      return gen
    },

    getMonthlyGenerationCount: (userId) => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return loadGenerations().filter(
        g => g.userId === userId && new Date(g.createdAt) >= monthStart
      ).length
    }
  }
}

export const avatarStore = createAvatarStore()
