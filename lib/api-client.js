import { supabase } from './supabase'

// Helper function to make authenticated API calls
export const authenticatedFetch = async (url, options = {}) => {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    // Add auth header to the request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    return response
  } catch (error) {
    console.error('Authenticated fetch error:', error)
    throw error
  }
}

// Helper function for GET requests
export const apiGet = async (url) => {
  const response = await authenticatedFetch(url, { method: 'GET' })
  return response
}

// Helper function for POST requests
export const apiPost = async (url, data) => {
  const response = await authenticatedFetch(url, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return response
}

// Helper function for PUT requests
export const apiPut = async (url, data) => {
  const response = await authenticatedFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
  return response
}

// Helper function for DELETE requests
export const apiDelete = async (url) => {
  const response = await authenticatedFetch(url, { method: 'DELETE' })
  return response
}
