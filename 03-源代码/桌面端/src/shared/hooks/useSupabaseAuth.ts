import { useState, useEffect, useCallback } from 'react'
import { getSession, onAuthStateChange, signIn, signUp, signOut } from '../infrastructure/auth'
import type { AuthResult } from '../infrastructure/auth'
import type { Session, User } from '@supabase/supabase-js'

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const sess = await getSession()
      if (mounted) {
        setSession(sess)
        setUser(sess?.user ?? null)
        setLoading(false)
      }
    }

    init()

    const { unsubscribe } = onAuthStateChange((newSession) => {
      if (mounted) {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    return result
  }, [])

  const register = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true)
    const result = await signUp(email, password)
    setLoading(false)
    return result
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    await signOut()
    setSession(null)
    setUser(null)
    setLoading(false)
  }, [])

  return {
    session,
    user,
    loading,
    isAuthenticated: !!session,
    login,
    register,
    logout
  }
}
