import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL_KEY = 'xinghuanhai_supabase_url'
const SUPABASE_ANON_KEY_KEY = 'xinghuanhai_supabase_anon_key'

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  if (typeof window === 'undefined') return null
  const url = window.localStorage.getItem(SUPABASE_URL_KEY)
  const anonKey = window.localStorage.getItem(SUPABASE_ANON_KEY_KEY)
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SUPABASE_URL_KEY, url)
  window.localStorage.setItem(SUPABASE_ANON_KEY_KEY, anonKey)
  supabaseInstance = null
}

export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  if (supabaseInstance) return supabaseInstance

  const config = getSupabaseConfig()
  if (!config) return null

  supabaseInstance = createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: 'xinghuanhai_supabase_auth'
    }
  })

  return supabaseInstance
}

export function resetSupabase(): void {
  supabaseInstance = null
}
