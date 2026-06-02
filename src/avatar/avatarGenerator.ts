import type { AvatarDefinition, AvatarRenderMode, AvatarStyle } from './avatarTypes'
import { avatarStore } from './avatarStore'
import { avatarAIProvider, type IAvatarAIProvider } from './avatarAIProvider'
import { AVATAR_CONSTRAINTS } from './avatarConstraints'
import { validateAvatarName, validatePrompt, isPartUnlocked, isAnimationUnlocked, isDecorationUnlocked, DEFAULT_AVATAR_PARTS, DEFAULT_AVATAR_ANIMATIONS, DEFAULT_AVATAR_DECORATIONS, type AvatarPartType, type AvatarPartCategory, type AvatarAnimationAsset, type AvatarDecorationAsset } from './avatarConstraints'

export type AvatarGeneratorConfig = {
  userId: string
  name: string
  prompt?: string
  style?: AvatarStyle
  renderMode: AvatarRenderMode
  parts?: Partial<Record<AvatarPartType, string>>
  animations?: string[]
  decorations?: string[]
  effects?: string[]
}

export type AvatarGeneratorResult = {
  success: boolean
  avatar?: AvatarDefinition
  error?: string
}

export type IAvatarGenerator = {
  generate: (config: AvatarGeneratorConfig) => Promise<AvatarGeneratorResult>
  generateWithAI: (userId: string, prompt: string, style: AvatarStyle, renderMode: AvatarRenderMode) => Promise<AvatarGeneratorResult>
  createFromParts: (config: AvatarGeneratorConfig) => AvatarGeneratorResult
  customizeAvatar: (avatarId: string, userId: string, updates: Partial<AvatarGeneratorConfig>) => AvatarGeneratorResult
  addAnimation: (avatarId: string, userId: string, animationId: string) => AvatarGeneratorResult
  removeAnimation: (avatarId: string, userId: string, animationId: string) => AvatarGeneratorResult
  addDecoration: (avatarId: string, userId: string, decorationId: string) => AvatarGeneratorResult
  removeDecoration: (avatarId: string, userId: string, decorationId: string) => AvatarGeneratorResult
  addEffect: (avatarId: string, userId: string, effectId: string) => AvatarGeneratorResult
  removeEffect: (avatarId: string, userId: string, effectId: string) => AvatarGeneratorResult
  getAvailableParts: (avatarLevel: number) => Partial<Record<AvatarPartType, AvatarPartCategory[]>>
  getAvailableAnimations: (avatarLevel: number) => AvatarAnimationAsset[]
  getAvailableDecorations: (avatarLevel: number) => AvatarDecorationAsset[]
}

function getAILimit(_userId: string): number {
  try {
    const raw = localStorage.getItem('xinghuanhai_entitlements')
    if (!raw) return 0
    const entitlements = JSON.parse(raw) as Record<string, unknown>
    if (typeof entitlements.avatar_ai_gen === 'number') return entitlements.avatar_ai_gen as number
    return entitlements.avatar_ai_gen ? AVATAR_CONSTRAINTS.maxGenerationsPerMonth : 0
  } catch {
    return 0
  }
}

function checkAvatarLimit(userId: string): { allowed: boolean; error?: string } {
  const avatars = avatarStore.getAvatars(userId)
  if (avatars.length >= AVATAR_CONSTRAINTS.maxAvatarsPerUser) {
    return { allowed: false, error: `已达到最大角色数量限制 (${AVATAR_CONSTRAINTS.maxAvatarsPerUser})` }
  }
  return { allowed: true }
}

function checkGenerationLimit(userId: string): { allowed: boolean; error?: string } {
  const limit = getAILimit(userId)
  if (limit <= 0) {
    return { allowed: false, error: '没有AI生成权限' }
  }
  const monthlyCount = avatarStore.getMonthlyGenerationCount(userId)
  if (monthlyCount >= limit) {
    return { allowed: false, error: `本月生成次数已用完 (${limit}次)` }
  }
  return { allowed: true }
}

function buildAvatarFromParts(config: AvatarGeneratorConfig, userId: string): AvatarDefinition | null {
  const nameValidation = validateAvatarName(config.name)
  if (!nameValidation.valid) {
    return null
  }

  const avatarLevel = 1

  const selectedParts = config.parts || {}
  const modelParts: string[] = []
  const stickerParts: Record<string, string> = {}

  for (const [partType, partId] of Object.entries(selectedParts)) {
    const parts = DEFAULT_AVATAR_PARTS[partType as AvatarPartType]
    const part = parts?.find(p => p.id === partId)
    if (part) {
      if (!isPartUnlocked(part, avatarLevel)) {
        return null
      }
      modelParts.push(partId)
      if (part.modelUrl) stickerParts[partType] = part.modelUrl
      if (part.stickerUrl) stickerParts[partType] = part.stickerUrl
    }
  }

  const selectedAnimations = config.animations && config.animations.length > 0 ? config.animations : ['anim_idle']
  const avatarAnimations = selectedAnimations
    .map(animId => DEFAULT_AVATAR_ANIMATIONS.find(a => a.id === animId))
    .filter((a): a is AvatarAnimationAsset => !!a && isAnimationUnlocked(a, avatarLevel))
    .map(a => ({ name: a.name, url: a.url, loop: a.loop, trigger: a.trigger as 'auto' | 'user_action' | 'schedule' }))

  if (avatarAnimations.length === 0) {
    avatarAnimations.push({ name: 'idle', url: undefined, loop: true, trigger: 'auto' })
  }

  const selectedDecorations = config.decorations || []
  const unlockedDecorations = selectedDecorations
    .filter(decId => {
      const dec = DEFAULT_AVATAR_DECORATIONS.find(d => d.id === decId)
      return dec && dec.type === 'decoration' && isDecorationUnlocked(dec, avatarLevel)
    })

  const selectedEffects = config.effects || []
  const unlockedEffects = selectedEffects
    .filter(effId => {
      const eff = DEFAULT_AVATAR_DECORATIONS.find(d => d.id === effId)
      return eff && eff.type === 'effect' && isDecorationUnlocked(eff, avatarLevel)
    })

  return avatarStore.createAvatar({
    userId,
    name: config.name,
    source: 'user_upload',
    renderMode: config.renderMode,
    thumbnailUrl: 'assets/avatars/custom_avatar_thumb.png',
    modelUrl: modelParts.length > 0 ? 'assets/avatars/models/custom.glb' : undefined,
    stickerUrl: Object.values(stickerParts)[0] || 'assets/avatars/custom_avatar.png',
    animations: avatarAnimations,
    evolution: {
      level: avatarLevel,
      unlockedDecorations,
      unlockedEffects,
      unlockedAnimations: avatarAnimations.map(a => a.name),
      totalFocusMinutes: 0,
      totalTasksCompleted: 0,
      streakDays: 0
    }
  })
}

export function createAvatarGenerator(aiProvider?: IAvatarAIProvider): IAvatarGenerator {
  const provider = aiProvider || avatarAIProvider

  return {
    generate: async (config) => {
      const limitCheck = checkAvatarLimit(config.userId)
      if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.error }
      }

      if (config.prompt) {
        const promptValidation = validatePrompt(config.prompt)
        if (!promptValidation.valid) {
          return { success: false, error: promptValidation.error }
        }

        const genLimitCheck = checkGenerationLimit(config.userId)
        if (!genLimitCheck.allowed) {
          return { success: false, error: genLimitCheck.error }
        }

        return provider.generate(config.prompt, config.style || 'anime', config.renderMode).then(req => {
          if (req.status === 'completed' && req.result) {
            return { success: true, avatar: req.result }
          }
          return { success: false, error: req.error || '生成失败' }
        }).catch(err => ({ success: false, error: err.message }))
      }

      const avatar = buildAvatarFromParts(config, config.userId)
      if (!avatar) {
        return { success: false, error: '创建角色失败，请检查部件选择' }
      }

      return { success: true, avatar }
    },

    generateWithAI: async (userId, prompt, style, renderMode) => {
      const limitCheck = checkAvatarLimit(userId)
      if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.error }
      }

      const promptValidation = validatePrompt(prompt)
      if (!promptValidation.valid) {
        return { success: false, error: promptValidation.error }
      }

      const genLimitCheck = checkGenerationLimit(userId)
      if (!genLimitCheck.allowed) {
        return { success: false, error: genLimitCheck.error }
      }

      try {
        const request = await provider.generate(prompt, style, renderMode)
        if (request.status === 'completed' && request.result) {
          return { success: true, avatar: request.result }
        }
        return { success: false, error: request.error || 'AI生成失败' }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : '未知错误' }
      }
    },

    createFromParts: (config) => {
      const limitCheck = checkAvatarLimit(config.userId)
      if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.error }
      }

      const avatar = buildAvatarFromParts(config, config.userId)
      if (!avatar) {
        return { success: false, error: '创建角色失败，请检查部件选择' }
      }

      return { success: true, avatar }
    },

    customizeAvatar: (avatarId, userId, updates) => {
      const avatar = avatarStore.getAvatarById(avatarId)
      if (!avatar || avatar.userId !== userId) {
        return { success: false, error: '角色不存在或无权限' }
      }

      if (updates.name !== undefined && updates.name !== null) {
        const nameValidation = validateAvatarName(updates.name)
        if (!nameValidation.valid) {
          return { success: false, error: nameValidation.error }
        }
      }

      const updated = avatarStore.updateAvatar(avatarId, {
        name: updates.name,
        updatedAt: new Date().toISOString()
      })

      if (updated) {
        return { success: true, avatar: updated }
      }
      return { success: false, error: '更新失败' }
    },

    addAnimation: (avatarId, userId, animationId) => {
      const avatar = avatarStore.getAvatarById(avatarId)
      if (!avatar || avatar.userId !== userId) {
        return { success: false, error: '角色不存在或无权限' }
      }

      const anim = DEFAULT_AVATAR_ANIMATIONS.find(a => a.id === animationId)
      if (!anim) {
        return { success: false, error: '动画不存在' }
      }

      if (!isAnimationUnlocked(anim, avatar.evolution.level)) {
        return { success: false, error: `需要等级 ${anim.unlockLevel} 才能解锁此动画` }
      }

      if (avatar.animations.length >= AVATAR_CONSTRAINTS.maxAnimationsPerAvatar) {
        return { success: false, error: '已达到最大动画数量' }
      }

      if (avatar.animations.some(a => a.name === anim.name)) {
        return { success: false, error: '动画已存在' }
      }

      const newAnimations = [
        ...avatar.animations,
        { name: anim.name, url: anim.url, loop: anim.loop, trigger: anim.trigger as 'auto' | 'user_action' | 'schedule' }
      ]

      const updated = avatarStore.updateAvatar(avatarId, { animations: newAnimations })
      if (updated) {
        return { success: true, avatar: updated }
      }
      return { success: false, error: '添加动画失败' }
    },

    removeAnimation: (avatarId, userId, animationId) => {
      const avatar = avatarStore.getAvatarById(avatarId)
      if (!avatar || avatar.userId !== userId) {
        return { success: false, error: '角色不存在或无权限' }
      }

      const anim = DEFAULT_AVATAR_ANIMATIONS.find(a => a.id === animationId)
      if (!anim) {
        return { success: false, error: '动画不存在' }
      }

      const newAnimations = avatar.animations.filter(a => a.name !== anim.name)
      const updated = avatarStore.updateAvatar(avatarId, { animations: newAnimations })
      if (updated) {
        return { success: true, avatar: updated }
      }
      return { success: false, error: '移除动画失败' }
    },

    addDecoration: (avatarId, userId, decorationId) => {
      const avatar = avatarStore.getAvatarById(avatarId)
      if (!avatar || avatar.userId !== userId) {
        return { success: false, error: '角色不存在或无权限' }
      }

      const dec = DEFAULT_AVATAR_DECORATIONS.find(d => d.id === decorationId && d.type === 'decoration')
      if (!dec) {
        return { success: false, error: '装饰不存在' }
      }

      if (!isDecorationUnlocked(dec, avatar.evolution.level)) {
        return { success: false, error: `需要等级 ${dec.unlockLevel} 才能解锁此装饰` }
      }

      if (avatar.evolution.unlockedDecorations.length >= AVATAR_CONSTRAINTS.maxDecorationsPerAvatar) {
        return { success: false, error: '已达到最大装饰数量' }
      }

      if (avatar.evolution.unlockedDecorations.includes(decorationId)) {
        return { success: false, error: '装饰已存在' }
      }

      const newDecorations = [...avatar.evolution.unlockedDecorations, decorationId]
      const updated = avatarStore.updateAvatar(avatarId, {
        evolution: { ...avatar.evolution, unlockedDecorations: newDecorations }
      })

      if (updated) {
        return { success: true, avatar: updated }
      }
      return { success: false, error: '添加装饰失败' }
    },

    removeDecoration: (avatarId, userId, decorationId) => {
      const avatar = avatarStore.getAvatarById(avatarId)
      if (!avatar || avatar.userId !== userId) {
        return { success: false, error: '角色不存在或无权限' }
      }

      const newDecorations = avatar.evolution.unlockedDecorations.filter(d => d !== decorationId)
      const updated = avatarStore.updateAvatar(avatarId, {
        evolution: { ...avatar.evolution, unlockedDecorations: newDecorations }
      })

      if (updated) {
        return { success: true, avatar: updated }
      }
      return { success: false, error: '移除装饰失败' }
    },

    addEffect: (avatarId, userId, effectId) => {
      const avatar = avatarStore.getAvatarById(avatarId)
      if (!avatar || avatar.userId !== userId) {
        return { success: false, error: '角色不存在或无权限' }
      }

      const eff = DEFAULT_AVATAR_DECORATIONS.find(d => d.id === effectId && d.type === 'effect')
      if (!eff) {
        return { success: false, error: '特效不存在' }
      }

      if (!isDecorationUnlocked(eff, avatar.evolution.level)) {
        return { success: false, error: `需要等级 ${eff.unlockLevel} 才能解锁此特效` }
      }

      if (avatar.evolution.unlockedEffects.length >= AVATAR_CONSTRAINTS.maxEffectsPerAvatar) {
        return { success: false, error: '已达到最大特效数量' }
      }

      if (avatar.evolution.unlockedEffects.includes(effectId)) {
        return { success: false, error: '特效已存在' }
      }

      const newEffects = [...avatar.evolution.unlockedEffects, effectId]
      const updated = avatarStore.updateAvatar(avatarId, {
        evolution: { ...avatar.evolution, unlockedEffects: newEffects }
      })

      if (updated) {
        return { success: true, avatar: updated }
      }
      return { success: false, error: '添加特效失败' }
    },

    removeEffect: (avatarId, userId, effectId) => {
      const avatar = avatarStore.getAvatarById(avatarId)
      if (!avatar || avatar.userId !== userId) {
        return { success: false, error: '角色不存在或无权限' }
      }

      const newEffects = avatar.evolution.unlockedEffects.filter(e => e !== effectId)
      const updated = avatarStore.updateAvatar(avatarId, {
        evolution: { ...avatar.evolution, unlockedEffects: newEffects }
      })

      if (updated) {
        return { success: true, avatar: updated }
      }
      return { success: false, error: '移除特效失败' }
    },

    getAvailableParts: (avatarLevel) => {
      const result: Partial<Record<AvatarPartType, AvatarPartCategory[]>> = {}
      for (const [type, parts] of Object.entries(DEFAULT_AVATAR_PARTS)) {
        result[type as AvatarPartType] = parts.filter(p => isPartUnlocked(p, avatarLevel))
      }
      return result
    },

    getAvailableAnimations: (avatarLevel) => {
      return DEFAULT_AVATAR_ANIMATIONS.filter(a => isAnimationUnlocked(a, avatarLevel))
    },

    getAvailableDecorations: (avatarLevel) => {
      return DEFAULT_AVATAR_DECORATIONS.filter(d => isDecorationUnlocked(d, avatarLevel))
    }
  }
}

export const avatarGenerator = createAvatarGenerator()
