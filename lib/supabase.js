import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging
console.log('🔍 Supabase Debug Info:')
console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseAnonKey)
console.log('Key length:', supabaseAnonKey?.length)

// Simple check - just verify we have both values and they look valid
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.includes('supabase.co') &&
  supabaseAnonKey.length > 50 // JWT tokens are typically longer than 50 chars
)

console.log('✅ Is Supabase configured:', isSupabaseConfigured)

// Always try to create the client if we have the values
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    })
  : null

console.log('🚀 Supabase client created:', !!supabase)

// Database helper functions

// Helper functions
export const getCurrentUser = async () => {
  if (!supabase) {
    console.error('Supabase not configured. Please set up your environment variables in .env.local')
    return null
  }
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signOut = async () => {
  if (!supabase) {
    return { error: new Error('Supabase not configured') }
  }
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}
