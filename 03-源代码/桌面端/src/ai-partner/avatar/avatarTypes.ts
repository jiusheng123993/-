export type AvatarRenderMode = '3d_gltf' | '2d_live2d' | '2d_sticker'
export type AvatarSource = 'builtin' | 'ready_player_me' | 'meshy_ai' | 'user_upload' | 'ip_collab'
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type AnimationTrigger = 'auto' | 'user_action' | 'schedule'
export type EvolutionTriggerType = 'focus_minutes' | 'tasks_completed' | 'streak_days' | 'special_event'
export type EvolutionRewardType = 'decoration' | 'effect' | 'animation'
export type AvatarStyle = 'realistic' | 'anime' | 'cartoon' | 'chibi'

export type AvatarMood = 'neutral' | 'happy' | 'encouraging' | 'thinking' | 'concerned' | 'celebrating'

export type AnimationState = 'idle' | 'talking' | 'thinking' | 'encouraging' | 'celebrating' | 'waving'

export type AvatarAnimation = {
  name: string
  url?: string
  loop: boolean
  trigger: AnimationTrigger
}

export type AvatarEvolution = {
  level: number
  unlockedDecorations: string[]
  unlockedEffects: string[]
  unlockedAnimations: string[]
  totalFocusMinutes: number
  totalTasksCompleted: number
  streakDays: number
}

export type AvatarDefinition = {
  id: string
  userId: string
  personaId?: string
  name: string
  source: AvatarSource
  renderMode: AvatarRenderMode
  modelUrl?: string
  stickerUrl?: string
  thumbnailUrl: string
  rpmAvatarUrl?: string
  rpmConfig?: Record<string, unknown>
  aiPrompt?: string
  aiModelId?: string
  evolution: AvatarEvolution
  animations: AvatarAnimation[]
  createdAt: string
  updatedAt: string
}

export type AvatarGenerationRequest = {
  id: string
  userId: string
  prompt: string
  style?: AvatarStyle
  renderMode: AvatarRenderMode
  status: GenerationStatus
  result?: AvatarDefinition
  error?: string
  createdAt: string
  completedAt?: string
}

export type AvatarEvolutionRule = {
  id: string
  trigger: {
    type: EvolutionTriggerType
    threshold: number
  }
  reward: {
    type: EvolutionRewardType
    assetId: string
    name: string
    description: string
  }
}

export type BuiltinAvatar = {
  id: string
  name: string
  thumbnailUrl: string
  renderMode: AvatarRenderMode
  modelUrl?: string
  stickerUrl?: string
  animations: AvatarAnimation[]
}

export const DEFAULT_AVATAR_EVOLUTION: AvatarEvolution = {
  level: 1,
  unlockedDecorations: [],
  unlockedEffects: [],
  unlockedAnimations: [],
  totalFocusMinutes: 0,
  totalTasksCompleted: 0,
  streakDays: 0
}

export const AVATAR_CONSTRAINTS = {
  AVATARS_STORAGE_KEY: 'xinghuanhai_avatars',
  GENERATIONS_STORAGE_KEY: 'xinghuanhai_avatar_generations',
  MAX_AVATARS_PER_USER: 10,
  MAX_GENERATION_PROMPT_LENGTH: 500,
  AI_GENERATION_MONTHLY_LIMIT: 10,
  EVOLUTION_RULES_STORAGE_KEY: 'xinghuanhai_evolution_rules'
} as const

export const EVOLUTION_RULES: AvatarEvolutionRule[] = [
  { id: 'evo_1', trigger: { type: 'focus_minutes', threshold: 60 }, reward: { type: 'decoration', assetId: 'dec_star_badge', name: '星标徽章', description: '专注1小时解锁' } },
  { id: 'evo_2', trigger: { type: 'focus_minutes', threshold: 300 }, reward: { type: 'effect', assetId: 'eff_glow', name: '光晕效果', description: '专注5小时解锁' } },
  { id: 'evo_3', trigger: { type: 'tasks_completed', threshold: 10 }, reward: { type: 'decoration', assetId: 'dec_crown', name: '皇冠装饰', description: '完成10个任务解锁' } },
  { id: 'evo_4', trigger: { type: 'tasks_completed', threshold: 50 }, reward: { type: 'animation', assetId: 'anim_celebrate', name: '庆祝动画', description: '完成50个任务解锁' } },
  { id: 'evo_5', trigger: { type: 'streak_days', threshold: 7 }, reward: { type: 'effect', assetId: 'eff_aura', name: '光环效果', description: '连续7天打卡解锁' } },
  { id: 'evo_6', trigger: { type: 'streak_days', threshold: 30 }, reward: { type: 'decoration', assetId: 'dec_diamond', name: '钻石装饰', description: '连续30天打卡解锁' } },
  { id: 'evo_7', trigger: { type: 'focus_minutes', threshold: 1000 }, reward: { type: 'animation', assetId: 'anim_fly', name: '飞行动画', description: '专注1000分钟解锁' } },
  { id: 'evo_8', trigger: { type: 'tasks_completed', threshold: 100 }, reward: { type: 'effect', assetId: 'eff_rainbow', name: '彩虹效果', description: '完成100个任务解锁' } }
]

export const BUILTIN_AVATARS: BuiltinAvatar[] = [
  {
    id: 'builtin_cat',
    name: '小猫咪',
    thumbnailUrl: 'assets/avatars/cat_thumb.png',
    renderMode: '2d_sticker',
    stickerUrl: 'assets/avatars/cat_sticker.png',
    animations: [
      { name: 'idle', loop: true, trigger: 'auto' },
      { name: 'encourage', loop: false, trigger: 'user_action' }
    ]
  },
  {
    id: 'builtin_robot',
    name: '小机器人',
    thumbnailUrl: 'assets/avatars/robot_thumb.png',
    renderMode: '2d_sticker',
    stickerUrl: 'assets/avatars/robot_sticker.png',
    animations: [
      { name: 'idle', loop: true, trigger: 'auto' },
      { name: 'think', loop: false, trigger: 'user_action' },
      { name: 'celebrate', loop: false, trigger: 'user_action' }
    ]
  },
  {
    id: 'builtin_scholar',
    name: '小学者',
    thumbnailUrl: 'assets/avatars/scholar_thumb.png',
    renderMode: '2d_sticker',
    stickerUrl: 'assets/avatars/scholar_sticker.png',
    animations: [
      { name: 'idle', loop: true, trigger: 'auto' },
      { name: 'encourage', loop: false, trigger: 'user_action' }
    ]
  }
]
