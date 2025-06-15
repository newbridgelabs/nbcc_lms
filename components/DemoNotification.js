import { useState, useEffect } from 'react'
import { AlertTriangle, X, ExternalLink } from 'lucide-react'

export default function DemoNotification() {
  const [isVisible, setIsVisible] = useState(false)
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true)

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const isConfigured = supabaseUrl &&
                        supabaseKey &&
                        supabaseUrl !== 'your-supabase-url' &&
                        supabaseKey !== 'your-supabase-anon-key' &&
                        supabaseUrl.includes('supabase.co') &&
                        supabaseUrl.startsWith('https://')

    setIsSupabaseConfigured(isConfigured)
    setIsVisible(!isConfigured)
  }, [])

  if (!isVisible || isSupabaseConfigured) return null

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            <strong>Supabase not configured:</strong> Please set up your environment variables in .env.local
          </p>
          <div className="mt-2 text-sm text-yellow-600">
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a free Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-800">supabase.com</a></li>
              <li>Copy your project URL and anon key</li>
              <li>Update the values in <code className="bg-yellow-100 px-1 rounded">.env.local</code></li>
              <li>Restart the development server</li>
            </ol>
          </div>
          <div className="mt-3">
            <a
              href="/setup"
              className="inline-flex items-center text-sm text-yellow-700 hover:text-yellow-800 underline"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View Setup Guide
            </a>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => setIsVisible(false)}
              className="inline-flex rounded-md bg-yellow-50 p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
