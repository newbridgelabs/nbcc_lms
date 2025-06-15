import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
}

// Create a Supabase client with service role key for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create a regular Supabase client for auth operations
const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const getServerUser = async (req) => {
  try {
    // Get the session token from cookies
    const token = req.cookies['sb-access-token'] || 
                  req.cookies['supabase-auth-token'] ||
                  req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return null
    }

    // Verify the JWT token
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting server user:', error)
    return null
  }
}

export const getCurrentUser = async () => {
  // This is for client-side use only
  const { data: { user } } = await supabaseAuth.auth.getUser()
  return user
}

export { supabaseAdmin, supabaseAuth }
