import { useEffect, useRef, useCallback } from 'react'
import Taro from '@tarojs/taro'

interface UsePollingOptions {
  intervalMs: number
  enabled: boolean
  immediateOnResume?: boolean
}

interface UsePollingReturn {
  forceRefresh: () => void
}

export function usePolling(
  fetcher: () => Promise<void>,
  options: UsePollingOptions,
): UsePollingReturn {
  const { intervalMs, enabled, immediateOnResume = true } = options
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isActiveRef = useRef(true)
  const fetcherRef = useRef(fetcher)

  fetcherRef.current = fetcher

  const startTimer = useCallback(() => {
    stopTimer()
    if (!isActiveRef.current) return
    timerRef.current = setInterval(() => {
      if (isActiveRef.current) {
        fetcherRef.current()
      }
    }, intervalMs)
  }, [intervalMs])

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (enabled) {
      isActiveRef.current = true
      startTimer()
    } else {
      isActiveRef.current = false
      stopTimer()
    }
    return () => {
      isActiveRef.current = false
      stopTimer()
    }
  }, [enabled, startTimer, stopTimer])

  useEffect(() => {
    const handleShow = () => {
      isActiveRef.current = true
      if (enabled) {
        if (immediateOnResume) {
          fetcherRef.current()
        }
        startTimer()
      }
    }
    const handleHide = () => {
      isActiveRef.current = false
      stopTimer()
    }
    Taro.onAppShow(handleShow)
    Taro.onAppHide(handleHide)
    return () => {
      Taro.offAppShow(handleShow)
      Taro.offAppHide(handleHide)
    }
  }, [enabled, startTimer, stopTimer, immediateOnResume])

  const forceRefresh = useCallback(() => {
    fetcherRef.current()
  }, [])

  return { forceRefresh }
}