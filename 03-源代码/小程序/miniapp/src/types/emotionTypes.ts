import type { EmotionSceneType } from '../engines/emotion'

export type { GriefStage, EmotionSceneType, AnxietyLevel, SickAnxietyContext, NewOwnerAnxietyContext, EmotionIntervention } from '../engines/emotion'

export type GriefStep = 'name' | 'write' | 'connect' | 'close'

export interface GriefStepConfig {
  step: GriefStep
  title: string
  prompt: string
  options?: string[]
  placeholder?: string
}

export interface GriefFlowState {
  currentStep: GriefStep
  selectedFeeling: string
  userMessage: string
  connectedCount: number
}

export interface EmotionDismissal {
  interventionId: string
  dismissedAt: number
}

export interface EmotionCheckRecord {
  type: EmotionSceneType
  petId?: string
  checkedAt: number
}
