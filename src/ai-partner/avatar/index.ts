export { AvatarManager } from './AvatarManager'
export { AvatarRenderer, AvatarFallback, AvatarAnimationController } from './AvatarRenderer'
export { AvatarCanvas, AvatarPreview } from './AvatarCanvas'
export { AvatarCustomizer } from './AvatarCustomizer'
export { PartPicker, PartCategorySelector } from './PartPicker'
export { AnimationPicker, AnimationList } from './AnimationPicker'
export { AvatarEvolutionPanel } from './AvatarEvolutionPanel'
export { avatarService } from './avatarService'
export { avatarStore } from './avatarStore'
export { avatarAIProvider, rpmProvider } from './avatarAIProvider'
export { avatarGenerator } from './avatarGenerator'
export { avatarExporter } from './avatarExport'
export { checkEvolutionRules, applyEvolutionRewards, updateEvolutionStats, getEvolutionProgress } from './evolutionEngine'
export {
  MOOD_TO_ANIMATION,
  ANIMATION_DURATIONS,
  ANIMATION_LOOP,
  ANIMATION_CSS_KEYFRAMES,
  createAnimatorState,
  moodToAnimationState,
  getAnimationDuration,
  isAnimationLooping,
  computeCrossfadeDuration,
  transitionAnimation,
  advanceTransition,
  completeTransition,
  getActiveAnimationName,
  getCrossfadeAlpha,
  analyzeResponseMood,
  getMoodEmoji,
  getAnimationCSS
} from './animator'
export type { AvatarService } from './avatarService'
export type { IAvatarAIProvider, IRPMProvider } from './avatarAIProvider'
export type { IAvatarGenerator, AvatarGeneratorConfig, AvatarGeneratorResult } from './avatarGenerator'
export type { IAvatarExporter, AvatarExportOptions, AvatarExportResult } from './avatarExport'
export type { AvatarDefinition, AvatarGenerationRequest, AvatarEvolution, AvatarRenderMode, AvatarStyle, AvatarSource, GenerationStatus, AnimationTrigger, EvolutionTriggerType, EvolutionRewardType, AvatarAnimation, AvatarEvolutionRule, BuiltinAvatar, AvatarMood, AnimationState } from './avatarTypes'
export type { AvatarExportFormat, AvatarPartType, AvatarPartCategory, AvatarAnimationAsset, AvatarDecorationAsset, AvatarConstraints } from './avatarConstraints'
export type { AnimationTransition, AnimatorState } from './animator'
