import { useState, useEffect, useCallback } from 'react'
import { loadDevAuthSession, saveDevAuthSession, createRoleSession, type DevAuthSession } from '../auth/devAuthSession'

export function useAuth() {
  const [session, setSession] = useState<DevAuthSession>(() => loadDevAuthSession())

  useEffect(() => {
    saveDevAuthSession(session)
    localStorage.setItem('user_id', session.userId)
  }, [session])

  const switchRole = useCallback(() => {
    setSession(current => createRoleSession(current.role === 'admin' ? 'user' : 'admin'))
  }, [])

  return {
    session,
    switchRole,
    userId: session.userId,
    role: session.role,
    displayName: session.displayName
  }
}
