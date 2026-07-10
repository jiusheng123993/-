import { describe, it, expect } from 'vitest'
import {
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
import type { AvatarMood, AnimationState } from './avatarTypes'

describe('MOOD_TO_ANIMATION', () => {
  it('maps all moods to valid animation states', () => {
    const moods: AvatarMood[] = ['neutral', 'happy', 'encouraging', 'thinking', 'concerned', 'celebrating']
    for (const mood of moods) {
      expect(MOOD_TO_ANIMATION[mood]).toBeDefined()
    }
  })

  it('maps neutral to idle', () => {
    expect(MOOD_TO_ANIMATION.neutral).toBe('idle')
  })

  it('maps celebrating to celebrating', () => {
    expect(MOOD_TO_ANIMATION.celebrating).toBe('celebrating')
  })

  it('maps thinking to thinking', () => {
    expect(MOOD_TO_ANIMATION.thinking).toBe('thinking')
  })
})

describe('ANIMATION_DURATIONS', () => {
  it('has duration for all animation states', () => {
    const states: AnimationState[] = ['idle', 'talking', 'thinking', 'encouraging', 'celebrating', 'waving']
    for (const state of states) {
      expect(typeof ANIMATION_DURATIONS[state]).toBe('number')
    }
  })

  it('idle has zero duration', () => {
    expect(ANIMATION_DURATIONS.idle).toBe(0)
  })
})

describe('ANIMATION_LOOP', () => {
  it('idle loops', () => {
    expect(ANIMATION_LOOP.idle).toBe(true)
  })

  it('non-idle states do not loop', () => {
    expect(ANIMATION_LOOP.talking).toBe(false)
    expect(ANIMATION_LOOP.thinking).toBe(false)
    expect(ANIMATION_LOOP.celebrating).toBe(false)
  })
})

describe('ANIMATION_CSS_KEYFRAMES', () => {
  it('has keyframes for all animation states', () => {
    const states: AnimationState[] = ['idle', 'talking', 'thinking', 'encouraging', 'celebrating', 'waving']
    for (const state of states) {
      expect(ANIMATION_CSS_KEYFRAMES[state]).toBeDefined()
      expect(typeof ANIMATION_CSS_KEYFRAMES[state]).toBe('string')
    }
  })
})

describe('createAnimatorState', () => {
  it('creates initial state with idle', () => {
    const state = createAnimatorState()
    expect(state.current).toBe('idle')
    expect(state.previous).toBe('idle')
    expect(state.isTransitioning).toBe(false)
    expect(state.transitionProgress).toBe(0)
  })
})

describe('moodToAnimationState', () => {
  it('returns idle for neutral mood', () => {
    expect(moodToAnimationState('neutral')).toBe('idle')
  })

  it('returns idle for happy mood', () => {
    expect(moodToAnimationState('happy')).toBe('idle')
  })

  it('returns encouraging for encouraging mood', () => {
    expect(moodToAnimationState('encouraging')).toBe('encouraging')
  })

  it('returns thinking for thinking mood', () => {
    expect(moodToAnimationState('thinking')).toBe('thinking')
  })

  it('returns celebrating for celebrating mood', () => {
    expect(moodToAnimationState('celebrating')).toBe('celebrating')
  })

  it('returns idle for concerned mood', () => {
    expect(moodToAnimationState('concerned')).toBe('idle')
  })
})

describe('getAnimationDuration', () => {
  it('returns correct duration for idle', () => {
    expect(getAnimationDuration('idle')).toBe(0)
  })

  it('returns correct duration for talking', () => {
    expect(getAnimationDuration('talking')).toBe(3000)
  })

  it('returns 0 for unknown state', () => {
    expect(getAnimationDuration('unknown' as AnimationState)).toBe(0)
  })
})

describe('isAnimationLooping', () => {
  it('returns true for idle', () => {
    expect(isAnimationLooping('idle')).toBe(true)
  })

  it('returns false for talking', () => {
    expect(isAnimationLooping('talking')).toBe(false)
  })

  it('returns false for unknown state', () => {
    expect(isAnimationLooping('unknown' as AnimationState)).toBe(false)
  })
})

describe('computeCrossfadeDuration', () => {
  it('returns 0 when from and to are same', () => {
    expect(computeCrossfadeDuration('idle', 'idle')).toBe(0)
  })

  it('returns 300 when transitioning from idle', () => {
    expect(computeCrossfadeDuration('idle', 'talking')).toBe(300)
  })

  it('returns 500 when transitioning between non-idle states', () => {
    expect(computeCrossfadeDuration('talking', 'thinking')).toBe(500)
  })
})

describe('transitionAnimation', () => {
  it('returns same state when target equals current', () => {
    const state = createAnimatorState()
    const result = transitionAnimation(state, 'idle')
    expect(result).toBe(state)
  })

  it('transitions to new target state', () => {
    const state = createAnimatorState()
    const result = transitionAnimation(state, 'talking')
    expect(result.current).toBe('talking')
    expect(result.previous).toBe('idle')
    expect(result.isTransitioning).toBe(true)
    expect(result.transitionProgress).toBe(0)
  })
})

describe('advanceTransition', () => {
  it('returns same state when not transitioning', () => {
    const state = createAnimatorState()
    const result = advanceTransition(state, 100)
    expect(result).toBe(state)
  })

  it('advances transition progress', () => {
    let state = transitionAnimation(createAnimatorState(), 'talking')
    state = advanceTransition(state, 150)
    expect(state.transitionProgress).toBeGreaterThan(0)
    expect(state.transitionProgress).toBeLessThan(1)
    expect(state.isTransitioning).toBe(true)
  })

  it('completes transition when progress reaches 1', () => {
    let state = transitionAnimation(createAnimatorState(), 'talking')
    state = advanceTransition(state, 1000)
    expect(state.transitionProgress).toBe(1)
    expect(state.isTransitioning).toBe(false)
  })

  it('completes immediately when crossfade duration is 0', () => {
    const state = createAnimatorState()
    const result = advanceTransition(state, 100)
    expect(result.isTransitioning).toBe(false)
    expect(result.transitionProgress).toBe(0)
  })
})

describe('completeTransition', () => {
  it('returns same state when not transitioning', () => {
    const state = createAnimatorState()
    const result = completeTransition(state)
    expect(result).toBe(state)
  })

  it('completes transition immediately', () => {
    let state = transitionAnimation(createAnimatorState(), 'talking')
    state = completeTransition(state)
    expect(state.isTransitioning).toBe(false)
    expect(state.transitionProgress).toBe(1)
  })
})

describe('getActiveAnimationName', () => {
  it('returns current animation state name', () => {
    const state = createAnimatorState()
    expect(getActiveAnimationName(state)).toBe('idle')
  })

  it('returns new state after transition', () => {
    const state = transitionAnimation(createAnimatorState(), 'celebrating')
    expect(getActiveAnimationName(state)).toBe('celebrating')
  })
})

describe('getCrossfadeAlpha', () => {
  it('returns 1 for "to" layer when not transitioning', () => {
    const state = createAnimatorState()
    expect(getCrossfadeAlpha(state, 'to')).toBe(1)
  })

  it('returns 0 for "from" layer when not transitioning', () => {
    const state = createAnimatorState()
    expect(getCrossfadeAlpha(state, 'from')).toBe(0)
  })

  it('returns intermediate values during transition', () => {
    let state = transitionAnimation(createAnimatorState(), 'talking')
    state = advanceTransition(state, 150)
    const toAlpha = getCrossfadeAlpha(state, 'to')
    const fromAlpha = getCrossfadeAlpha(state, 'from')
    expect(toAlpha).toBeGreaterThan(0)
    expect(fromAlpha).toBeGreaterThan(0)
    expect(toAlpha + fromAlpha).toBeCloseTo(1, 1)
  })
})

describe('analyzeResponseMood', () => {
  it('returns celebrating for congratulatory messages', () => {
    expect(analyzeResponseMood('恭喜你完成了任务！')).toBe('celebrating')
    expect(analyzeResponseMood('太棒了，你做得很好！')).toBe('celebrating')
  })

  it('returns encouraging for supportive messages', () => {
    expect(analyzeResponseMood('加油，你可以的！')).toBe('encouraging')
    expect(analyzeResponseMood('别放弃，继续努力')).toBe('encouraging')
  })

  it('returns concerned for apologetic messages', () => {
    expect(analyzeResponseMood('抱歉，出了点问题')).toBe('concerned')
    expect(analyzeResponseMood('这个挑战确实很困难')).toBe('concerned')
  })

  it('returns thinking for analytical messages', () => {
    expect(analyzeResponseMood('让我想想这个问题')).toBe('thinking')
    expect(analyzeResponseMood('我们来分析一下')).toBe('thinking')
  })

  it('returns happy for positive messages', () => {
    expect(analyzeResponseMood('好的，没问题！')).toBe('happy')
    expect(analyzeResponseMood('当然可以')).toBe('happy')
  })

  it('returns neutral for generic messages', () => {
    expect(analyzeResponseMood('今天天气不错')).toBe('neutral')
    expect(analyzeResponseMood('')).toBe('neutral')
  })

  it('prioritizes celebrating over happy when both keywords present', () => {
    expect(analyzeResponseMood('好的，恭喜你成功了！')).toBe('celebrating')
  })
})

describe('getMoodEmoji', () => {
  it('returns correct emoji for each mood', () => {
    expect(getMoodEmoji('neutral')).toBe('👋')
    expect(getMoodEmoji('happy')).toBe('😊')
    expect(getMoodEmoji('encouraging')).toBe('💪')
    expect(getMoodEmoji('thinking')).toBe('🤔')
    expect(getMoodEmoji('concerned')).toBe('😟')
    expect(getMoodEmoji('celebrating')).toBe('🎉')
  })
})

describe('getAnimationCSS', () => {
  it('returns animation and opacity for idle state', () => {
    const state = createAnimatorState()
    const css = getAnimationCSS(state)
    expect(css.animation).toContain('avatar-idle')
    expect(css.opacity).toBe(1)
  })

  it('returns empty animation for unknown state', () => {
    const state = { current: 'unknown' as AnimationState, previous: 'idle' as AnimationState, isTransitioning: false, transitionProgress: 0 }
    const css = getAnimationCSS(state)
    expect(css.animation).toBe('')
    expect(css.opacity).toBe(1)
  })

  it('returns transition opacity during crossfade', () => {
    let state = transitionAnimation(createAnimatorState(), 'talking')
    state = advanceTransition(state, 150)
    const css = getAnimationCSS(state)
    expect(css.animation).toContain('avatar-talking')
    expect(css.opacity).toBeGreaterThan(0)
  })
})
