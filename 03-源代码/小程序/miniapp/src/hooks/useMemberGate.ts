/**
 * 会员功能访问钩子
 *
 * 判断当前用户是否为会员并可访问指定会员功能。
 * 返回 allowed：null=判断中 / true=可访问 / false=非会员（应展示开通引导）。
 */
import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useMembership } from './useMembership'

export function useMemberGate(featureKey: string): { allowed: boolean | null } {
  const userId = useAuthStore(s => s.user?.id || '')
  const { initUser, checkAccess } = useMembership()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!userId) {
      setAllowed(false)
      return
    }
    let cancelled = false
    initUser(userId)
      .then(() => checkAccess(featureKey))
      .then(result => {
        if (!cancelled) setAllowed(result.allowed)
      })
      .catch(() => {
        // 判断失败时按非会员处理，避免绕过门槛
        if (!cancelled) setAllowed(false)
      })
    return () => { cancelled = true }
  }, [userId, featureKey, initUser, checkAccess])

  return { allowed }
}