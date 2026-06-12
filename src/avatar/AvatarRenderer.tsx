import { useRef, useEffect, useState, useCallback } from 'react'
import type { AvatarDefinition, AvatarRenderMode, AnimationState } from './avatarTypes'
import {
  createAnimatorState,
  transitionAnimation,
  advanceTransition,
  completeTransition,
  getAnimationDuration,
  isAnimationLooping,
  getCrossfadeAlpha,
  getActiveAnimationName
} from './animator'
import { ThreeDRenderer } from './renderers/ThreeDRenderer'

type AvatarRendererProps = {
  avatar: AvatarDefinition
  width?: number
  height?: number
  activeAnimation?: string
  onAnimationEnd?: () => void
  fallbackMode?: AvatarRenderMode
}

const ANIMATION_CSS_KEYFRAMES: Record<string, string> = {
  idle: 'avatar-idle 3s ease-in-out infinite',
  talking: 'avatar-talking 0.6s ease-in-out infinite',
  thinking: 'avatar-thinking 2s ease-in-out',
  encouraging: 'avatar-encouraging 1s ease-out',
  celebrating: 'avatar-celebrating 1.5s ease-out',
  waving: 'avatar-waving 0.8s ease-in-out'
}

export function AvatarRenderer({
  avatar,
  width = 200,
  height = 200,
  activeAnimation,
  onAnimationEnd,
  fallbackMode = '2d_sticker'
}: AvatarRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [renderError, setRenderError] = useState(false)
  const [currentMode, setCurrentMode] = useState<AvatarRenderMode>(avatar.renderMode)
  const animatorRef = useRef(createAnimatorState())
  const animFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAnimationTimer = useCallback(() => {
    if (animationTimerRef.current !== null) {
      clearTimeout(animationTimerRef.current)
      animationTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearAnimationTimer()
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [clearAnimationTimer])

  useEffect(() => {
    if (!activeAnimation) return

    const target = activeAnimation as AnimationState
    animatorRef.current = transitionAnimation(animatorRef.current, target)

    const duration = getAnimationDuration(target)
    const looping = isAnimationLooping(target)

    clearAnimationTimer()

    if (!looping && duration > 0) {
      animationTimerRef.current = setTimeout(() => {
        animatorRef.current = completeTransition(animatorRef.current)
        animatorRef.current = transitionAnimation(animatorRef.current, 'idle')
        onAnimationEnd?.()
      }, duration)
    }
  }, [activeAnimation, onAnimationEnd, clearAnimationTimer])

  useEffect(() => {
    if (renderError && currentMode !== fallbackMode) {
      setCurrentMode(fallbackMode)
      setRenderError(false)
    }
  }, [renderError, currentMode, fallbackMode])

  const handle3DError = useCallback((_error: Error) => {
    setRenderError(true)
  }, [])

  const getAnimationStyle = (): React.CSSProperties => {
    const state = animatorRef.current
    const animName = getActiveAnimationName(state)
    const keyframe = ANIMATION_CSS_KEYFRAMES[animName]

    if (!keyframe) return {}

    if (state.isTransitioning) {
      const fromAlpha = getCrossfadeAlpha(state, 'from')
      return {
        animation: keyframe,
        opacity: fromAlpha > 0.5 ? fromAlpha : 1,
        transition: 'opacity 0.3s ease'
      }
    }

    return {
      animation: keyframe,
      opacity: 1
    }
  }

  if (currentMode === '3d_gltf' && !renderError) {
    return (
      <div className="avatar-renderer-3d" style={{ width, height }}>
        <ThreeDRenderer
          avatar={avatar}
          width={width}
          height={height}
          autoRotate={true}
          onError={handle3DError}
        />
        <div className="avatar-renderer-label">
          3D · {avatar.name}
        </div>
      </div>
    )
  }

  if (currentMode === '2d_live2d') {
    return (
      <div className="avatar-renderer-live2d" style={{ width, height }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="avatar-canvas"
        />
        <div className="avatar-renderer-label">
          Live2D · {avatar.name}
        </div>
      </div>
    )
  }

  return (
    <div className="avatar-renderer-sticker" style={{ width, height, ...getAnimationStyle() }}>
      {avatar.stickerUrl ? (
        <img
          src={avatar.stickerUrl}
          alt={avatar.name}
          className="avatar-sticker-img"
          style={{ maxWidth: width, maxHeight: height }}
          onError={() => setRenderError(true)}
        />
      ) : (
        <div className="avatar-sticker-placeholder" style={{ width, height }}>
          <span className="placeholder-icon">🎭</span>
          <span className="placeholder-name">{avatar.name}</span>
        </div>
      )}
    </div>
  )
}

type AvatarFallbackProps = {
  name: string
  width?: number
  height?: number
  reason?: string
}

export function AvatarFallback({ name, width = 200, height = 200, reason }: AvatarFallbackProps) {
  return (
    <div className="avatar-fallback" style={{ width, height }}>
      <div className="fallback-icon">🎭</div>
      <div className="fallback-name">{name}</div>
      {reason && <div className="fallback-reason">{reason}</div>}
    </div>
  )
}

type AvatarAnimationControllerProps = {
  avatar: AvatarDefinition
  onPlayAnimation: (name: string) => void
}

export function AvatarAnimationController({ avatar, onPlayAnimation }: AvatarAnimationControllerProps) {
  const animations = avatar.animations.filter(a => a.trigger === 'user_action')

  return (
    <div className="animation-controller">
      {animations.length === 0 ? (
        <p className="empty-text">暂无可用动画</p>
      ) : (
        <div className="animation-buttons">
          {animations.map(anim => (
            <button
              key={anim.name}
              className="animation-btn"
              onClick={() => onPlayAnimation(anim.name)}
            >
              {anim.name === 'idle' && '🧘 待机'}
              {anim.name === 'encourage' && '💪 鼓励'}
              {anim.name === 'celebrate' && '🎉 庆祝'}
              {anim.name === 'think' && '🤔 思考'}
              {!['idle', 'encourage', 'celebrate', 'think'].includes(anim.name) && `🎬 ${anim.name}`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}