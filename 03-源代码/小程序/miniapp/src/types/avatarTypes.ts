import type { PetHealthEntry, HealthRiskLevel } from '../memory-body/types/memoryBodyTypes'

export type { PetHealthEntry, HealthRiskLevel }

export type PetExpression =
  | 'happy'
  | 'worried'
  | 'concerned'
  | 'anxious'
  | 'sleepy'
  | 'proud'
  | 'excited'
  | 'scared'

export type PetSpecies = 'dog' | 'cat'

/** 日记语气类型 */
export type DiaryTone = 'happy' | 'neutral' | 'tired' | 'sick' | 'proud'

export type AnimationType =
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'flash'
  | 'float'
  | 'glow'
  | 'jump'
  | 'tremble'

export interface ExpressionConfig {
  expression: PetExpression
  label: string
  color: string
  eyes: string
  mouth: string
  accessory: string
  animation: AnimationType
}

/** 表情计算上下文 */
export interface ExpressionContext {
  todayEntry: PetHealthEntry | null
  hasAnomaly: boolean
  anomalyCount: number
  riskLevel: HealthRiskLevel | null
  streakDays: number
  isBirthday: boolean
  isVaccineComplete: boolean
  isRecovery: boolean
  isDeceased: boolean
}

export interface DiaryEntry {
  text: string
  tone: DiaryTone
  emoji: string
}

export interface SvgPetFace {
  body: string
  ears: string
  eyes: string
  mouth: string
  accessory: string
  animation: string
}

export interface SeedreamGenerateParams {
  prompt: string
  imageSize?: 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9'
  negativePrompt?: string
  style?: 'realistic' | 'cartoon' | 'anime'
}

export interface SeedreamGenerateResult {
  success: boolean
  imageUrl?: string
  error?: string
}

export interface PetImageParams {
  petId: string
  species: PetSpecies
  expression: ExpressionConfig
  breed?: string
  color?: string
  style?: 'cartoon' | 'realistic'
}

export interface AchievementConfig {
  type: 'birthday' | 'vaccine_complete' | 'streak_7' | 'streak_30' | 'streak_100' | 'rainbow_bridge' | 'holiday'
  title: string
  subtitle: string
  icon: string
  color: string
}

/** 头像定制信息 */
export interface AvatarCustomization {
  species: PetSpecies
  style: 'cartoon' | 'realistic'
  /** 多风格候选中的具体风格（Q版萌系/日系治愈/美式卡通） */
  styleVariant?: string
  baseColor: string
  accessory?: string
  generatedAt?: string
  cartoonUrl?: string
}

/** 2D 形象角度 */
export type AvatarAngle = 'front' | 'left' | 'right' | 'back' | 'left45' | 'right45'

export type AvatarExpression =
  | 'happy' | 'sad' | 'excited' | 'sleepy'
  | 'love' | 'cool' | 'angry' | 'thinking'
  | 'surprised' | 'crying' | 'celebrate' | 'naughty'

/** 2D 形象动作 */
export type AvatarAction =
  | 'sit' | 'stand' | 'lie' | 'jump'
  | 'wave' | 'eat' | 'play' | 'sleep'

export interface ExpressionOption {
  key: AvatarExpression
  label: string
  emoji: string
}

export interface AngleOption {
  key: AvatarAngle
  label: string
}

export interface ActionOption {
  key: AvatarAction
  label: string
  emoji: string
}

/** 2D 形象图片 */
export interface Avatar2DImage {
  id: string
  angle: AvatarAngle
  expression: AvatarExpression | AvatarAction
  imageUrl: string
  isSelected: boolean
  sortOrder: number
}

/** 2D 形象包（含任务和图片列表） */
export interface Avatar2DPack {
  task: GenerationTask | null
  images: Avatar2DImage[]
}

export interface Avatar3DModel {
  id: string
  modelUrl: string
  thumbnailUrl: string | null
  createdAt: string
}

export interface Avatar3DResult {
  task: GenerationTask | null
  model: Avatar3DModel | null
}

export type TaskType = '2d' | '3d' | 'theme_suite'
/** 生成任务状态 */
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface GenerationTask {
  id: string
  userId: string
  petId: string
  taskType: TaskType
  status: TaskStatus
  progress: number
  referencePhotoUrl: string | null
  resultData: Record<string, unknown> | null
  error: string | null
  createdAt: string
  updatedAt: string
}

export interface UploadPhotoResult {
  success: boolean
  data?: { url: string }
  message?: string
}

/** 2D 形象生成接口响应 */
export interface Generate2DResult {
  success: boolean
  data?: { taskId: string; status: string }
  message?: string
}

export interface Generate3DResult {
  success: boolean
  data?: { taskId: string; status: string }
  message?: string
}

export interface AvatarQuota {
  isMember: boolean
  generation2D: { used: number; limit: number }
  generation3D: { used: number; limit: number }
}
