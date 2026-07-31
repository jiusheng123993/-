import type { EmotionSceneType } from '../engines/emotion'

export type { GriefStage, EmotionSceneType, AnxietyLevel, SickAnxietyContext, NewOwnerAnxietyContext, EmotionIntervention } from '../engines/emotion'

export type GriefStep = 'name' | 'write' | 'connect' | 'close'

/** 哀伤步骤配置 */
export interface GriefStepConfig {
  step: GriefStep
  title: string
  prompt: string
  options?: string[]
  placeholder?: string
}

/** 哀伤流程状态 */
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

/** 情绪检查记录 */
export interface EmotionCheckRecord {
  type: EmotionSceneType
  petId?: string
  checkedAt: number
}
