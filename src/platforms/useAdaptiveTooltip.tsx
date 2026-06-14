import { useState, useCallback, useRef, useEffect } from 'react'
import { usePlatform } from './usePlatform'

export function useAdaptiveTooltip(title: string) {
  const { deviceCategory } = usePlatform()
  const isMobile = deviceCategory === 'mobile'
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return
    const target = e.currentTarget as HTMLElement
    elementRef.current = target
    timerRef.current = setTimeout(() => {
      const rect = target.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8
      })
      setShowTooltip(true)
      tooltipTimerRef.current = setTimeout(() => {
        setShowTooltip(false)
        setTooltipPosition(null)
      }, 2000)
    }, 500)
  }, [isMobile])

  const handleTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    }
  }, [])

  const tooltipElement = isMobile && showTooltip && tooltipPosition ? (
    <div
      style={{
        position: 'fixed',
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
        transform: 'translate(-50%, -100%)',
        background: 'rgba(10, 10, 30, 0.92)',
        backdropFilter: 'blur(10px)',
        borderRadius: '8px',
        padding: '6px 12px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        zIndex: 9999,
        maxWidth: '220px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        color: 'white',
        fontSize: '13px',
        fontWeight: 500,
        lineHeight: 1.4,
        textAlign: 'center',
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
    >
      {title}
    </div>
  ) : null

  return {
    showTooltip,
    tooltipElement,
    tooltipProps: isMobile
      ? {
          onTouchStart: handleTouchStart,
          onTouchEnd: handleTouchEnd,
          title: undefined
        }
      : {
          title
        }
  }
}
