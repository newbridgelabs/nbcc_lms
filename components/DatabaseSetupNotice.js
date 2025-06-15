import { useState } from 'react'
import { AlertTriangle, Database, ExternalLink, CheckCircle, X } from 'lucide-react'

export default function DatabaseSetupNotice() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Database Setup Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-2">
              To enable full functionality (user profiles, verification, etc.), you need to set up the database tables in Supabase.
            </p>
            <div className="space-y-2">
              <div className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                <span>Go to your Supabase project dashboard</span>
              </div>
              <div className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                <span>Open the SQL Editor</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Run the SQL from <code className="bg-yellow-100 px-1 rounded">database-setup.sql</code></span>
              </div>
            </div>
            <p className="mt-2 text-xs">
              <strong>Note:</strong> Registration will work without this setup, but some features like email verification may be limited.
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={() => setDismissed(true)}
            className="inline-flex text-yellow-400 hover:text-yellow-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
