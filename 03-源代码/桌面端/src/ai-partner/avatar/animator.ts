import type { AvatarMood, AnimationState } from './avatarTypes'

export const MOOD_TO_ANIMATION: Record<AvatarMood, AnimationState> = {
  neutral: 'idle',
  happy: 'idle',
  encouraging: 'encouraging',
  thinking: 'thinking',
  concerned: 'idle',
  celebrating: 'celebrating'
}

export const ANIMATION_CSS_KEYFRAMES: Record<AnimationState, string> = {
  idle: 'avatar-idle 3s ease-in-out infinite',
  talking: 'avatar-talking 0.6s ease-in-out infinite',
  thinking: 'avatar-thinking 2s ease-in-out',
  encouraging: 'avatar-encouraging 1s ease-out',
  celebrating: 'avatar-celebrating 1.5s ease-out',
  waving: 'avatar-waving 0.8s ease-in-out'
}

const MOOD_EMOJI_MAP: Record<AvatarMood, string> = {
  neutral: '👋',
  happy: '😊',
  encouraging: '💪',
  thinking: '🤔',
  concerned: '😟',
  celebrating: '🎉'
}

const MOOD_KEYWORDS: Record<AvatarMood, string[]> = {
  celebrating: ['恭喜', '太棒了', '做得很好', '成功'],
  encouraging: ['加油', '你可以的', '相信你', '别放弃'],
  concerned: ['抱歉', '对不起', '困难', '挑战'],
  thinking: ['让我想想', '分析', '考虑'],
  happy: ['好', '没问题', '当然', '好的'],
  neutral: []
}

export const ANIMATION_DURATIONS: Record<AnimationState, number> = {
  idle: 0,
  talking: 3000,
  thinking: 2500,
  encouraging: 2000,
  celebrating: 3000,
  waving: 1500
}

export const ANIMATION_LOOP: Record<AnimationState, boolean> = {
  idle: true,
  talking: false,
  thinking: false,
  encouraging: false,
  celebrating: false,
  waving: false
}

export type AnimationTransition = {
  from: AnimationState
  to: AnimationState
  duration: number
}

export type AnimatorState = {
  current: AnimationState
  previous: AnimationState
  isTransitioning: boolean
  transitionProgress: number
}

export function createAnimatorState(): AnimatorState {
  return {
    current: 'idle',
    previous: 'idle',
    isTransitioning: false,
    transitionProgress: 0
  }
}

export function moodToAnimationState(mood: AvatarMood): AnimationState {
  return MOOD_TO_ANIMATION[mood] ?? 'idle'
}

export function getAnimationDuration(state: AnimationState): number {
  return ANIMATION_DURATIONS[state] ?? 0
}

export function isAnimationLooping(state: AnimationState): boolean {
  return ANIMATION_LOOP[state] ?? false
}

export function computeCrossfadeDuration(from: AnimationState, to: AnimationState): number {
  if (from === to) return 0
  if (from === 'idle') return 300
  return 500
}

export function transitionAnimation(
  state: AnimatorState,
  target: AnimationState
): AnimatorState {
  if (state.current === target) return state

  return {
    current: target,
    previous: state.current,
    isTransitioning: true,
    transitionProgress: 0
  }
}

export function advanceTransition(
  state: AnimatorState,
  deltaMs: number
): AnimatorState {
  if (!state.isTransitioning) return state

  const crossfadeDuration = computeCrossfadeDuration(state.previous, state.current)
  if (crossfadeDuration <= 0) {
    return { ...state, isTransitioning: false, transitionProgress: 1 }
  }

  const newProgress = state.transitionProgress + deltaMs / crossfadeDuration

  if (newProgress >= 1) {
    return { ...state, isTransitioning: false, transitionProgress: 1 }
  }

  return { ...state, transitionProgress: newProgress }
}

export function completeTransition(state: AnimatorState): AnimatorState {
  if (!state.isTransitioning) return state
  return { ...state, isTransitioning: false, transitionProgress: 1 }
}

export function getActiveAnimationName(state: AnimatorState): string {
  return state.current
}

export function getCrossfadeAlpha(
  state: AnimatorState,
  layer: 'from' | 'to'
): number {
  if (!state.isTransitioning) {
    return layer === 'to' ? 1 : 0
  }
  const t = state.transitionProgress
  const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  return layer === 'to' ? eased : 1 - eased
}

export function analyzeResponseMood(response: string): AvatarMood {
  const lowerResponse = response.toLowerCase()

  const moodOrder: AvatarMood[] = ['celebrating', 'encouraging', 'concerned', 'thinking', 'happy']

  for (const mood of moodOrder) {
    const keywords = MOOD_KEYWORDS[mood]
    if (keywords.some(kw => lowerResponse.includes(kw))) {
      return mood
    }
  }

  return 'neutral'
}

export function getMoodEmoji(mood: AvatarMood): string {
  return MOOD_EMOJI_MAP[mood] ?? '👋'
}

export function getAnimationCSS(state: AnimatorState): { animation: string; opacity: number } {
  const animName = getActiveAnimationName(state)
  const keyframe = ANIMATION_CSS_KEYFRAMES[animName]

  if (!keyframe) return { animation: '', opacity: 1 }

  if (state.isTransitioning) {
    const fromAlpha = getCrossfadeAlpha(state, 'from')
    return {
      animation: keyframe,
      opacity: fromAlpha > 0.5 ? fromAlpha : 1
    }
  }

  return {
    animation: keyframe,
    opacity: 1
  }
}
