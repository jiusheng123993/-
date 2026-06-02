import { useRef, useEffect, useState } from 'react'
import type { AvatarDefinition, AvatarRenderMode } from './avatarTypes'

type AvatarRendererProps = {
  avatar: AvatarDefinition
  width?: number
  height?: number
  activeAnimation?: string
  onAnimationEnd?: () => void
  fallbackMode?: AvatarRenderMode
}

export function AvatarRenderer({
  avatar,
  width = 200,
  height = 200,
  activeAnimation: _activeAnimation,
  onAnimationEnd: _onAnimationEnd,
  fallbackMode = '2d_sticker'
}: AvatarRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [renderError, setRenderError] = useState(false)
  const [currentMode, setCurrentMode] = useState<AvatarRenderMode>(avatar.renderMode)

  useEffect(() => {
    if (renderError && currentMode !== fallbackMode) {
      setCurrentMode(fallbackMode)
      setRenderError(false)
    }
  }, [renderError, currentMode, fallbackMode])

  useEffect(() => {
    if (currentMode === '3d_gltf' && canvasRef.current) {
      try {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, width, height)
          ctx.fillStyle = '#f0f0f0'
          ctx.fillRect(0, 0, width, height)
          ctx.fillStyle = '#666'
          ctx.font = '14px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('3D渲染区域', width / 2, height / 2 - 10)
          ctx.fillText(avatar.name, width / 2, height / 2 + 10)
        }
      } catch {
        setRenderError(true)
      }
    }
  }, [currentMode, avatar, width, height])

  if (currentMode === '3d_gltf' && !renderError) {
    return (
      <div className="avatar-renderer-3d" style={{ width, height }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="avatar-canvas"
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
    <div className="avatar-renderer-sticker" style={{ width, height }}>
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