import type { AvatarDefinition, AvatarStyle, AvatarSource, BuiltinAvatar } from './avatarTypes'
import { DEFAULT_AVATAR } from './avatarTypes'

export interface AvatarRegistryEntry {
  id: string
  avatar: AvatarDefinition
  source: AvatarSource
  isBuiltin: boolean
  createdAt: string
  updatedAt: string
}

export interface AvatarRegistry {
  getAvatar(id: string): AvatarDefinition | null
  getAllAvatars(): AvatarDefinition[]
  getBuiltinAvatars(): BuiltinAvatar[]
  registerAvatar(avatar: Omit<AvatarDefinition, 'id'>): AvatarDefinition
  updateAvatar(id: string, patch: Partial<AvatarDefinition>): AvatarDefinition | null
  deleteAvatar(id: string): boolean
  getAvatarByStyle(style: AvatarStyle): AvatarDefinition | null
}

const BUILTIN_AVATARS: BuiltinAvatar[] = [
  {
    id: 'builtin-1',
    name: '星灵',
    style: 'anime',
    source: 'builtin',
    body: 'default',
    face: 'smile',
    hair: 'short',
    outfit: 'casual',
    background: 'gradient-blue',
    evolution: {
      level: 1,
      experience: 0,
      totalExperience: 100,
      unlockedRewards: []
    },
    personality: {
      trait: 'gentle',
      mood: 'happy'
    }
  },
  {
    id: 'builtin-2',
    name: '晨曦',
    style: 'realistic',
    source: 'builtin',
    body: 'default',
    face: 'focused',
    hair: 'long',
    outfit: 'formal',
    background: 'warm',
    evolution: {
      level: 1,
      experience: 0,
      totalExperience: 100,
      unlockedRewards: []
    },
    personality: {
      trait: 'energetic',
      mood: 'happy'
    }
  },
  {
    id: 'builtin-3',
    name: '暮云',
    style: 'cartoon',
    source: 'builtin',
    body: 'default',
    face: 'smile',
    hair: 'short',
    outfit: 'casual',
    background: 'gradient-blue',
    evolution: {
      level: 1,
      experience: 0,
      totalExperience: 100,
      unlockedRewards: []
    },
    personality: {
      trait: 'calm',
      mood: 'neutral'
    }
  }
]

const userAvatars: Map<string, AvatarDefinition> = new Map()

export function createAvatarRegistry(): AvatarRegistry {
  return {
    getAvatar(id: string): AvatarDefinition | null {
      const builtin = BUILTIN_AVATARS.find(a => a.id === id)
      if (builtin) return builtin
      
      return userAvatars.get(id) || null
    },

    getAllAvatars(): AvatarDefinition[] {
      return [
        ...BUILTIN_AVATARS,
        ...Array.from(userAvatars.values())
      ]
    },

    getBuiltinAvatars(): BuiltinAvatar[] {
      return [...BUILTIN_AVATARS]
    },

    registerAvatar(avatar: Omit<AvatarDefinition, 'id'>): AvatarDefinition {
      const id = `avatar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newAvatar: AvatarDefinition = {
        ...avatar,
        id,
        source: 'local'
      }
      userAvatars.set(id, newAvatar)
      return newAvatar
    },

    updateAvatar(id: string, patch: Partial<AvatarDefinition>): AvatarDefinition | null {
      const existing = this.getAvatar(id)
      if (!existing) return null
      
      const updated: AvatarDefinition = {
        ...existing,
        ...patch,
        id
      }
      
      const builtin = BUILTIN_AVATARS.find(a => a.id === id)
      if (builtin) return null
      
      userAvatars.set(id, updated)
      return updated
    },

    deleteAvatar(id: string): boolean {
      const builtin = BUILTIN_AVATARS.find(a => a.id === id)
      if (builtin) return false
      
      return userAvatars.delete(id)
    },

    getAvatarByStyle(style: AvatarStyle): AvatarDefinition | null {
      const builtin = BUILTIN_AVATARS.find(a => a.style === style)
      if (builtin) return builtin
      
      const userAvatar = Array.from(userAvatars.values()).find(a => a.style === style)
      return userAvatar || null
    }
  }
}

export const avatarRegistry = createAvatarRegistry()

export function getDefaultAvatar(): AvatarDefinition {
  return { ...DEFAULT_AVATAR }
}

export function getBuiltinAvatarById(id: string): BuiltinAvatar | null {
  return BUILTIN_AVATARS.find(a => a.id === id) || null
}

export function createAvatarFromTemplate(
  templateId: string,
  overrides: Partial<AvatarDefinition> = {}
): AvatarDefinition | null {
  const template = avatarRegistry.getAvatar(templateId)
  if (!template) return null
  
  return {
    ...template,
    ...overrides,
    id: `avatar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'local',
    name: overrides.name || `${template.name} (副本)`
  }
}
