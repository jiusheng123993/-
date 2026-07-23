export type AvatarExportFormat = 'png' | 'gif' | 'mp4' | 'glb'

export type AvatarPartType = 'body' | 'head' | 'face' | 'hair' | 'outfit' | 'accessory' | 'background'

export type AvatarPartCategory = {
  id: string
  name: string
  type: AvatarPartType
  thumbnailUrl: string
  modelUrl?: string
  stickerUrl?: string
  price?: number
  unlockLevel?: number
}

export type AvatarAnimationAsset = {
  id: string
  name: string
  url?: string
  thumbnailUrl?: string
  duration?: number
  loop: boolean
  trigger: 'auto' | 'user_action' | 'schedule'
  unlockLevel?: number
}

export type AvatarDecorationAsset = {
  id: string
  name: string
  type: 'decoration' | 'effect'
  thumbnailUrl: string
  modelUrl?: string
  shaderUrl?: string
  unlockLevel?: number
}

export type AvatarConstraints = {
  maxFileSizeBytes: number
  maxModelSizeBytes: number
  maxTextureSizeBytes: number
  maxAnimationDurationMs: number
  supportedImageFormats: string[]
  supportedModelFormats: string[]
  supportedVideoFormats: string[]
  maxThumbnailWidth: number
  maxThumbnailHeight: number
  maxTextureWidth: number
  maxTextureHeight: number
  defaultRenderWidth: number
  defaultRenderHeight: number
  maxAvatarsPerUser: number
  maxGenerationsPerMonth: number
  maxPromptLength: number
  maxNameLength: number
  maxAnimationsPerAvatar: number
  maxDecorationsPerAvatar: number
  maxEffectsPerAvatar: number
}

export const AVATAR_CONSTRAINTS: AvatarConstraints = {
  maxFileSizeBytes: 50 * 1024 * 1024,
  maxModelSizeBytes: 20 * 1024 * 1024,
  maxTextureSizeBytes: 10 * 1024 * 1024,
  maxAnimationDurationMs: 30000,
  supportedImageFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  supportedModelFormats: ['model/gltf-binary', 'model/gltf+json', 'model/vnd.threejs'],
  supportedVideoFormats: ['video/mp4', 'video/webm'],
  maxThumbnailWidth: 512,
  maxThumbnailHeight: 512,
  maxTextureWidth: 2048,
  maxTextureHeight: 2048,
  defaultRenderWidth: 1024,
  defaultRenderHeight: 1024,
  maxAvatarsPerUser: 10,
  maxGenerationsPerMonth: 10,
  maxPromptLength: 500,
  maxNameLength: 50,
  maxAnimationsPerAvatar: 10,
  maxDecorationsPerAvatar: 5,
  maxEffectsPerAvatar: 3
}

export const EXPORT_FORMATS: Record<AvatarExportFormat, {
  mimeType: string
  extension: string
  requiresEncoder: boolean
  maxDuration?: number
}> = {
  png: {
    mimeType: 'image/png',
    extension: 'png',
    requiresEncoder: false
  },
  gif: {
    mimeType: 'image/gif',
    extension: 'gif',
    requiresEncoder: true,
    maxDuration: 10000
  },
  mp4: {
    mimeType: 'video/mp4',
    extension: 'mp4',
    requiresEncoder: true,
    maxDuration: 30000
  },
  glb: {
    mimeType: 'model/gltf-binary',
    extension: 'glb',
    requiresEncoder: false
  }
}

export const DEFAULT_AVATAR_PARTS: Record<AvatarPartType, AvatarPartCategory[]> = {
  body: [
    { id: 'body_default', name: '默认身体', type: 'body', thumbnailUrl: 'assets/avatars/parts/body_default.png' },
    { id: 'body_slim', name: '纤细体型', type: 'body', thumbnailUrl: 'assets/avatars/parts/body_slim.png', unlockLevel: 5 },
    { id: 'body_athletic', name: '运动体型', type: 'body', thumbnailUrl: 'assets/avatars/parts/body_athletic.png', unlockLevel: 10 }
  ],
  head: [
    { id: 'head_default', name: '默认头部', type: 'head', thumbnailUrl: 'assets/avatars/parts/head_default.png' },
    { id: 'head_round', name: '圆润头部', type: 'head', thumbnailUrl: 'assets/avatars/parts/head_round.png', unlockLevel: 3 },
    { id: 'head_elegant', name: '优雅头部', type: 'head', thumbnailUrl: 'assets/avatars/parts/head_elegant.png', unlockLevel: 8 }
  ],
  face: [
    { id: 'face_default', name: '默认表情', type: 'face', thumbnailUrl: 'assets/avatars/parts/face_default.png' },
    { id: 'face_happy', name: '开心表情', type: 'face', thumbnailUrl: 'assets/avatars/parts/face_happy.png' },
    { id: 'face_serious', name: '认真表情', type: 'face', thumbnailUrl: 'assets/avatars/parts/face_serious.png' },
    { id: 'face_calm', name: '平静表情', type: 'face', thumbnailUrl: 'assets/avatars/parts/face_calm.png' }
  ],
  hair: [
    { id: 'hair_default', name: '默认发型', type: 'hair', thumbnailUrl: 'assets/avatars/parts/hair_default.png' },
    { id: 'hair_short', name: '短发', type: 'hair', thumbnailUrl: 'assets/avatars/parts/hair_short.png' },
    { id: 'hair_long', name: '长发', type: 'hair', thumbnailUrl: 'assets/avatars/parts/hair_long.png' },
    { id: 'hair_bun', name: '发髻', type: 'hair', thumbnailUrl: 'assets/avatars/parts/hair_bun.png', unlockLevel: 5 },
    { id: 'hair_ponytail', name: '马尾', type: 'hair', thumbnailUrl: 'assets/avatars/parts/hair_ponytail.png', unlockLevel: 7 }
  ],
  outfit: [
    { id: 'outfit_default', name: '默认服装', type: 'outfit', thumbnailUrl: 'assets/avatars/parts/outfit_default.png' },
    { id: 'outfit_casual', name: '休闲装', type: 'outfit', thumbnailUrl: 'assets/avatars/parts/outfit_casual.png' },
    { id: 'outfit_formal', name: '正装', type: 'outfit', thumbnailUrl: 'assets/avatars/parts/outfit_formal.png', unlockLevel: 3 },
    { id: 'outfit_school', name: '校服', type: 'outfit', thumbnailUrl: 'assets/avatars/parts/outfit_school.png', unlockLevel: 5 },
    { id: 'outfit_sports', name: '运动装', type: 'outfit', thumbnailUrl: 'assets/avatars/parts/outfit_sports.png', unlockLevel: 8 }
  ],
  accessory: [
    { id: 'accessory_none', name: '无配饰', type: 'accessory', thumbnailUrl: 'assets/avatars/parts/accessory_none.png' },
    { id: 'accessory_glasses', name: '眼镜', type: 'accessory', thumbnailUrl: 'assets/avatars/parts/accessory_glasses.png', unlockLevel: 2 },
    { id: 'accessory_hat', name: '帽子', type: 'accessory', thumbnailUrl: 'assets/avatars/parts/accessory_hat.png', unlockLevel: 4 },
    { id: 'accessory_earrings', name: '耳环', type: 'accessory', thumbnailUrl: 'assets/avatars/parts/accessory_earrings.png', unlockLevel: 6 },
    { id: 'accessory_necklace', name: '项链', type: 'accessory', thumbnailUrl: 'assets/avatars/parts/accessory_necklace.png', unlockLevel: 8 }
  ],
  background: [
    { id: 'bg_default', name: '默认背景', type: 'background', thumbnailUrl: 'assets/avatars/parts/bg_default.png' },
    { id: 'bg_gradient_blue', name: '蓝色渐变', type: 'background', thumbnailUrl: 'assets/avatars/parts/bg_gradient_blue.png' },
    { id: 'bg_gradient_pink', name: '粉色渐变', type: 'background', thumbnailUrl: 'assets/avatars/parts/bg_gradient_pink.png', unlockLevel: 3 },
    { id: 'bg_nature', name: '自然风景', type: 'background', thumbnailUrl: 'assets/avatars/parts/bg_nature.png', unlockLevel: 5 },
    { id: 'bg_space', name: '星空', type: 'background', thumbnailUrl: 'assets/avatars/parts/bg_space.png', unlockLevel: 10 }
  ]
}

export const DEFAULT_AVATAR_ANIMATIONS: AvatarAnimationAsset[] = [
  { id: 'anim_idle', name: '待机', loop: true, trigger: 'auto', unlockLevel: 1 },
  { id: 'anim_encourage', name: '鼓励', loop: false, trigger: 'user_action', unlockLevel: 1 },
  { id: 'anim_think', name: '思考', loop: false, trigger: 'user_action', unlockLevel: 3 },
  { id: 'anim_celebrate', name: '庆祝', loop: false, trigger: 'user_action', unlockLevel: 5 },
  { id: 'anim_wave', name: '挥手', loop: false, trigger: 'user_action', unlockLevel: 7 },
  { id: 'anim_dance', name: '跳舞', loop: true, trigger: 'user_action', unlockLevel: 10 },
  { id: 'anim_fly', name: '飞行', loop: true, trigger: 'user_action', unlockLevel: 15 }
]

export const DEFAULT_AVATAR_DECORATIONS: AvatarDecorationAsset[] = [
  { id: 'dec_star_badge', name: '星标徽章', type: 'decoration', thumbnailUrl: 'assets/avatars/decorations/star_badge.png', unlockLevel: 1 },
  { id: 'dec_crown', name: '皇冠', type: 'decoration', thumbnailUrl: 'assets/avatars/decorations/crown.png', unlockLevel: 5 },
  { id: 'dec_diamond', name: '钻石', type: 'decoration', thumbnailUrl: 'assets/avatars/decorations/diamond.png', unlockLevel: 10 },
  { id: 'dec_wings', name: '翅膀', type: 'decoration', thumbnailUrl: 'assets/avatars/decorations/wings.png', unlockLevel: 15 },
  { id: 'eff_glow', name: '光晕', type: 'effect', thumbnailUrl: 'assets/avatars/decorations/glow.png', unlockLevel: 2 },
  { id: 'eff_aura', name: '光环', type: 'effect', thumbnailUrl: 'assets/avatars/decorations/aura.png', unlockLevel: 7 },
  { id: 'eff_rainbow', name: '彩虹', type: 'effect', thumbnailUrl: 'assets/avatars/decorations/rainbow.png', unlockLevel: 12 }
]

export function isPartUnlocked(part: AvatarPartCategory, avatarLevel: number): boolean {
  return !part.unlockLevel || avatarLevel >= part.unlockLevel
}

export function isAnimationUnlocked(anim: AvatarAnimationAsset, avatarLevel: number): boolean {
  return !anim.unlockLevel || avatarLevel >= anim.unlockLevel
}

export function isDecorationUnlocked(dec: AvatarDecorationAsset, avatarLevel: number): boolean {
  return !dec.unlockLevel || avatarLevel >= dec.unlockLevel
}

export function validateExportFormat(format: AvatarExportFormat): boolean {
  return format in EXPORT_FORMATS
}

export function getExportFormatConfig(format: AvatarExportFormat) {
  return EXPORT_FORMATS[format]
}

export function validateAvatarName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '角色名称不能为空' }
  }
  if (name.length > AVATAR_CONSTRAINTS.maxNameLength) {
    return { valid: false, error: `角色名称不能超过${AVATAR_CONSTRAINTS.maxNameLength}个字符` }
  }
  return { valid: true }
}

export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: '提示词不能为空' }
  }
  if (prompt.length > AVATAR_CONSTRAINTS.maxPromptLength) {
    return { valid: false, error: `提示词不能超过${AVATAR_CONSTRAINTS.maxPromptLength}个字符` }
  }
  return { valid: true }
}
