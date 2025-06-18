import { supabase } from './supabase'

// Register new user (with selective registration check)
export const registerUser = async (email, password, fullName, username) => {
  try {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set up your environment variables in .env.local')
    }

    // Check if user is in allowed_users list using service role to bypass RLS
    const { data: allowedUser, error: allowedError } = await supabase.rpc('check_allowed_user', {
      user_email: email.toLowerCase()
    })

    if (allowedError) {
      console.error('Error checking allowed user:', allowedError)
      throw new Error('Registration is by invitation only. Please contact church administration to be added to the allowed users list.')
    }

    if (!allowedUser || allowedUser.length === 0) {
      throw new Error('Registration is by invitation only. Please contact church administration to be added to the allowed users list.')
    }

    const allowedUserRecord = allowedUser[0]
    console.log('Found allowed user record:', allowedUserRecord)

    // Check if user already exists in auth.users but email not confirmed
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
      filter: `email.ilike.${email}`
    })

    const existingUser = users?.length > 0 ? { user: users[0] } : null

    if (existingUser?.user && !existingUser.user.email_confirmed_at) {
      // User exists but email not confirmed - resend confirmation
      console.log('User exists but email not confirmed, resending confirmation...')
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://nbcc-labs-il5rcafib-newbridgelabs-projects.vercel.app'}/auth/callback`
        }
      })

      if (resendError) {
        console.error('Error resending confirmation:', resendError)
        throw new Error('Failed to resend confirmation email. Please try again or contact support.')
      }

      return {
        data: { user: existingUser.user, needsConfirmation: true, isResend: true },
        error: null
      }
    }

    if (allowedUserRecord.is_used && existingUser?.user?.email_confirmed_at) {
      throw new Error('This invitation has already been used. Please try signing in instead.')
    }

    // If user was marked as used but doesn't have a confirmed auth account, allow re-registration
    if (allowedUserRecord.is_used && (!existingUser?.user || !existingUser.user.email_confirmed_at)) {
      console.log('User was marked as used but has no confirmed auth account, allowing re-registration...')
      // Reset the is_used flag to allow re-registration
      await supabase
        .from('allowed_users')
        .update({
          is_used: false,
          registered_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('email', email.toLowerCase())
    }

    // Sign up with Supabase Auth (includes automatic email verification)
    console.log('Attempting Supabase registration for:', email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username
        },
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://nbcc-labs-il5rcafib-newbridgelabs-projects.vercel.app'}/auth/callback`
      }
    })

    if (authError) {
      console.error('Supabase registration error:', authError)
      // If email confirmation is disabled or fails, still allow registration
      if (authError.message?.includes('email') && authError.message?.includes('confirm')) {
        console.warn('Email confirmation not configured, proceeding with registration')
        // Continue with registration process
      } else {
        throw authError
      }
    }

    // Log registration result
    if (authData?.user) {
      console.log('Supabase registration successful:', {
        userId: authData.user.id,
        email: authData.user.email,
        emailConfirmed: authData.user.email_confirmed_at ? 'Yes' : 'No',
        needsConfirmation: !authData.user.email_confirmed_at
      })
    }

    // Try to create user profile in custom users table (optional)
    if (authData.user) {
      try {
        await createUserProfile(authData.user.id, {
          email,
          full_name: fullName,
          username,
          is_verified: false
        })

        // Mark the allowed_user as used using RPC function
        await supabase.rpc('mark_allowed_user_used', {
          user_email: email.toLowerCase()
        })

      } catch (profileError) {
        console.warn('Could not create user profile in custom table:', profileError.message)
        // Don't fail registration if profile creation fails
      }
    }

    return { data: authData, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Helper function to create user profile
const createUserProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      id: userId,
      ...profileData
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

// Sign in user
export const signInUser = async (email, password) => {
  try {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set up your environment variables in .env.local')
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      // Enhanced error handling for better user experience
      if (error.message?.includes('Invalid login credentials')) {
        try {
          // Check if user is in allowed_users list but hasn't registered yet
          const { data: allowedUser } = await supabase.rpc('check_allowed_user', {
            user_email: email.toLowerCase()
          })

          if (allowedUser && allowedUser.length > 0) {
            throw new Error('You have been invited to join but need to register first. Please click "Sign Up" and create your account using this email address.')
          } else {
            // Check if they're in allowed_users but already used (registered)
            const { data: allAllowedUsers } = await supabase.rpc('check_all_allowed_users', {
              user_email: email.toLowerCase()
            })

            if (allAllowedUsers && allAllowedUsers.length > 0) {
              throw new Error('Invalid password. Please check your password or use "Forgot Password" to reset it.')
            } else {
              throw new Error('Access denied. Please contact church administration to be added to the allowed users list.')
            }
          }
        } catch (checkError) {
          // If the check fails, provide a generic message
          throw new Error('Invalid login credentials. Please check your email and password, or contact church administration if you need access.')
        }
      } else if (error.message?.includes('Email not confirmed')) {
        throw new Error('Please check your email and click the verification link before signing in.')
      } else {
        throw error
      }
    }

    // Supabase handles email verification automatically
    // Users can only sign in if their email is verified

    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    console.log('🔍 Google Sign-In Debug:')
    console.log('Supabase client exists:', !!supabase)

    if (!supabase) {
      console.error('❌ Supabase client is null')
      throw new Error('Supabase not configured. Please check your environment variables.')
    }

    console.log('🚀 Attempting Google OAuth...')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://nbcc-labs-il5rcafib-newbridgelabs-projects.vercel.app'}/auth/callback`
      }
    })

    console.log('📊 OAuth response:', { data, error })
    return { data, error }
  } catch (error) {
    console.error('❌ Google sign-in error:', error)
    return { data: null, error }
  }
}

// Reset password
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://nbcc-labs-il5rcafib-newbridgelabs-projects.vercel.app'}/auth/reset-password`
    })

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error }
  }
}
