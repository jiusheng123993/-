import { getSupabase } from './supabase'
import type { AuthError, Session, User } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase()
  if (!supabase) return { user: null, session: null, error: { message: 'Supabase 未配置', status: 0, name: 'ConfigError' } as AuthError }

  const { data, error } = await supabase.auth.signUp({ email, password })
  return { user: data.user, session: data.session, error }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = getSupabase()
  if (!supabase) return { user: null, session: null, error: { message: 'Supabase 未配置', status: 0, name: 'ConfigError' } as AuthError }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: data.user, session: data.session, error }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = getSupabase()
  if (!supabase) return { error: null }

  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getUser(): Promise<User | null> {
  const supabase = getSupabase()
  if (!supabase) return null

  const { data } = await supabase.auth.getUser()
  return data.user
}

export function onAuthStateChange(callback: (session: Session | null) => void): { unsubscribe: () => void } {
  const supabase = getSupabase()
  if (!supabase) return { unsubscribe: () => {} }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })

  return { unsubscribe: () => data.subscription.unsubscribe() }
}

export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  const supabase = getSupabase()
  if (!supabase) return { error: { message: 'Supabase 未配置', status: 0, name: 'ConfigError' } as AuthError }

  const { error } = await supabase.auth.resetPasswordForEmail(email)
  return { error }
}
