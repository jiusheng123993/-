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

export interface AvatarCustomization {
  species: PetSpecies
  style: 'cartoon' | 'realistic'
  baseColor: string
  accessory?: string
  generatedAt?: string
  cartoonUrl?: string
}
