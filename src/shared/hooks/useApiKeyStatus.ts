import { useState, useEffect, useCallback } from 'react'

const API_KEY_NAMES = [
  'deepseek_api_key',
  'openai_api_key',
  'tongyi_api_key',
  'doubao_api_key',
  'xfyun_coding_api_key',
] as const

export type ApiKeyStatus = {
  hasAnyKey: boolean
  status: 'not-configured' | 'ready'
}

export function useApiKeyStatus(): ApiKeyStatus {
  const [status, setStatus] = useState<ApiKeyStatus>(() => {
    const hasAnyKey = API_KEY_NAMES.some((key) => !!localStorage.getItem(key))
    return {
      hasAnyKey,
      status: hasAnyKey ? 'ready' : 'not-configured',
    }
  })

  const checkKeys = useCallback(() => {
    const hasAnyKey = API_KEY_NAMES.some((key) => !!localStorage.getItem(key))
    setStatus((prev) => {
      const newStatus = hasAnyKey ? 'ready' : 'not-configured'
      if (prev.hasAnyKey === hasAnyKey && prev.status === newStatus) {
        return prev
      }
      return { hasAnyKey, status: newStatus }
    })
  }, [])

  useEffect(() => {
    const interval = setInterval(checkKeys, 5000)
    return () => clearInterval(interval)
  }, [checkKeys])

  return status
}