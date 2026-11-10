import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const hasRealSupabaseConfig = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.includes('supabase.co') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-') &&
  supabaseAnonKey.length > 20,
)

export const supabase = hasRealSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const storage = {
  get(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key)
      return value ? JSON.parse(value) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore storage errors
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore storage errors
    }
  },
}
