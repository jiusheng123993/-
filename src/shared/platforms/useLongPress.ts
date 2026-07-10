import { useCallback, useRef, useState, useEffect } from 'react'

interface LongPressOptions {
  duration?: number
  onLongPress: () => void
  onClick?: () => void
}

export function useLongPress({ duration = 500, onLongPress, onClick }: LongPressOptions) {
  const [isLongPressing, setIsLongPressing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTouchStart = useCallback(() => {
    setIsLongPressing(true)
    timerRef.current = setTimeout(() => {
      onLongPress()
      setIsLongPressing(false)
    }, duration)
  }, [duration, onLongPress])

  const handleTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!isLongPressing && onClick) {
      onClick()
    }
    setIsLongPressing(false)
  }, [isLongPressing, onClick])

  const handleMouseDown = useCallback(() => {
    setIsLongPressing(true)
    timerRef.current = setTimeout(() => {
      onLongPress()
      setIsLongPressing(false)
    }, duration)
  }, [duration, onLongPress])

  const handleMouseUp = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!isLongPressing && onClick) {
      onClick()
    }
    setIsLongPressing(false)
  }, [isLongPressing, onClick])

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsLongPressing(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return {
    isLongPressing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave
    }
  }
}
