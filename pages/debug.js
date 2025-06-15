import { useEffect, useState } from 'react'

export default function Debug() {
  const [envVars, setEnvVars] = useState({})

  useEffect(() => {
    setEnvVars({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Environment Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Supabase URL:</label>
              <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                {envVars.supabaseUrl || 'Not set'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Supabase Key Exists:</label>
              <p className="mt-1 text-sm text-gray-900">
                {envVars.supabaseKeyExists ? '✅ Yes' : '❌ No'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Supabase Key Length:</label>
              <p className="mt-1 text-sm text-gray-900">
                {envVars.supabaseKeyLength} characters
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
