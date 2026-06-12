import type { AvatarMood, AnimationState } from './avatarTypes'

export const MOOD_TO_ANIMATION: Record<AvatarMood, AnimationState> = {
  neutral: 'idle',
  happy: 'idle',
  encouraging: 'encouraging',
  thinking: 'thinking',
  concerned: 'idle',
  celebrating: 'celebrating'
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
