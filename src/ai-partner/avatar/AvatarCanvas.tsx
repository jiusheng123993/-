import { useRef, useEffect, useState, useCallback } from 'react'
import type { AvatarDefinition } from './avatarTypes'

export type AvatarCanvasProps = {
  avatar: AvatarDefinition
  width?: number
  height?: number
  autoRotate?: boolean
  showGrid?: boolean
  backgroundColor?: string
  onLoad?: () => void
  onError?: (error: Error) => void
}

export function AvatarCanvas({
  avatar,
  width = 512,
  height = 512,
  autoRotate = false,
  showGrid = false,
  backgroundColor = '#1a1a2e',
  onLoad,
  onError
}: AvatarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentAnimation] = useState<string>('idle')
  const animationFrameRef = useRef<number | null>(null)
  const rotationRef = useRef(0)

  const render2DSticker = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 10; i++) {
        const x = (width / 10) * i
        const y = (height / 10) * i
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }

    if (avatar.stickerUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const scale = Math.min(width / img.width, height / img.height) * 0.8
        const drawWidth = img.width * scale
        const drawHeight = img.height * scale
        const x = (width - drawWidth) / 2
        const y = (height - drawHeight) / 2
        ctx.drawImage(img, x, y, drawWidth, drawHeight)
        setIsLoading(false)
        onLoad?.()
      }
      img.onerror = () => {
        setLoadError('Failed to load image')
        setIsLoading(false)
        onError?.(new Error('Failed to load sticker image'))
      }
      img.src = avatar.stickerUrl
    } else {
      ctx.fillStyle = '#4a4a6a'
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = `${Math.min(width, height) * 0.08}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(avatar.name.slice(0, 2), width / 2, height / 2)
      setIsLoading(false)
      onLoad?.()
    }
  }, [width, height, backgroundColor, showGrid, onLoad, onError, avatar.name, avatar.stickerUrl])

  const render3DPlaceholder = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 10; i++) {
        const x = (width / 10) * i
        const y = (height / 10) * i
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }

    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.25

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(rotationRef.current)

    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = '#8b5cf6'
    ctx.beginPath()
    ctx.moveTo(-radius * 0.7, 0)
    ctx.lineTo(radius * 0.7, 0)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, -radius * 0.7)
    ctx.lineTo(0, radius * 0.7)
    ctx.stroke()

    ctx.fillStyle = '#a78bfa'
    ctx.beginPath()
    ctx.arc(0, -radius * 0.5, radius * 0.2, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#c4b5fd'
    ctx.beginPath()
    ctx.arc(-radius * 0.3, radius * 0.3, radius * 0.15, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(radius * 0.3, radius * 0.3, radius * 0.15, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()

    ctx.fillStyle = '#ffffff'
    ctx.font = `${Math.min(width, height) * 0.05}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('3D Model: ' + (avatar.modelUrl || 'N/A'), width / 2, height - 30)
    ctx.fillText(`Animation: ${currentAnimation}`, width / 2, height - 10)

    setIsLoading(false)
    onLoad?.()
  }, [width, height, backgroundColor, showGrid, currentAnimation, onLoad, avatar.modelUrl])

  const renderLive2DPlaceholder = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 10; i++) {
        const x = (width / 10) * i
        const y = (height / 10) * i
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }

    const centerX = width / 2
    const centerY = height / 2

    ctx.fillStyle = '#fcd34d'
    ctx.beginPath()
    ctx.ellipse(centerX, centerY - 20, 60, 70, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#1f2937'
    ctx.beginPath()
    ctx.arc(centerX - 20, centerY - 30, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(centerX + 20, centerY - 30, 8, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(centerX, centerY + 10, 20, 0, Math.PI)
    ctx.stroke()

    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.ellipse(centerX, centerY - 90, 40, 30, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = `${Math.min(width, height) * 0.05}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('Live2D Model', width / 2, height - 30)

    setIsLoading(false)
    onLoad?.()
  }, [width, height, backgroundColor, showGrid, onLoad])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (avatar.renderMode === '3d_gltf') {
      render3DPlaceholder(ctx)
    } else if (avatar.renderMode === '2d_live2d') {
      renderLive2DPlaceholder(ctx)
    } else {
      render2DSticker(ctx)
    }
  }, [render2DSticker, render3DPlaceholder, renderLive2DPlaceholder, avatar.renderMode])

  useEffect(() => {
    if (!autoRotate) return

    const animate = () => {
      rotationRef.current += 0.02

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      if (avatar.renderMode === '3d_gltf') {
        render3DPlaceholder(ctx)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [autoRotate, avatar.renderMode, render3DPlaceholder])

  return (
    <div ref={containerRef} className="avatar-canvas-container" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="avatar-canvas-element"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px'
        }}
      />
      {isLoading && (
        <div className="avatar-canvas-loading" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: '#fff',
          borderRadius: '8px'
        }}>
          加载中...
        </div>
      )}
      {loadError && (
        <div className="avatar-canvas-error" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          {loadError}
        </div>
      )}
      <div className="avatar-canvas-info" style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        right: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.7)'
      }}>
        <span>{avatar.renderMode}</span>
        <span>{currentAnimation}</span>
      </div>
    </div>
  )
}

export type AvatarPreviewProps = {
  avatar: AvatarDefinition
  size?: 'small' | 'medium' | 'large'
}

export function AvatarPreview({ avatar, size = 'medium' }: AvatarPreviewProps) {
  const sizeMap = {
    small: 64,
    medium: 128,
    large: 256
  }

  const dimension = sizeMap[size]

  return (
    <AvatarCanvas
      avatar={avatar}
      width={dimension}
      height={dimension}
      autoRotate={avatar.renderMode === '3d_gltf'}
    />
  )
}
