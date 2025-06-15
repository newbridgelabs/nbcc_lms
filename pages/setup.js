import Layout from '../components/Layout'
import { ExternalLink, Database, Key, Upload, Globe } from 'lucide-react'

export default function Setup() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Setup Your NBCC LMS
            </h1>
            <p className="text-lg text-gray-600">
              Follow these simple steps to get your church LMS up and running
            </p>
          </div>

          <div className="space-y-8">
            {/* Step 1: Supabase Setup */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-full p-2 mr-4">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Step 1: Create Supabase Project (Free)
                </h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Supabase provides your database, authentication, and file storage - all for free.
                </p>
                
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>
                    Go to{' '}
                    <a 
                      href="https://supabase.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                    >
                      supabase.com
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </li>
                  <li>Click "Start your project" and create a free account</li>
                  <li>Create a new organization and project</li>
                  <li>Choose a region close to your location</li>
                  <li>Wait for the project to be created (1-2 minutes)</li>
                </ol>
              </div>
            </div>

            {/* Step 2: Get Credentials */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 rounded-full p-2 mr-4">
                  <Key className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Step 2: Get Your API Credentials
                </h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Copy your project credentials to connect your LMS to Supabase.
                </p>
                
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>In your Supabase project, go to <strong>Settings → API</strong></li>
                  <li>Copy your <strong>Project URL</strong></li>
                  <li>Copy your <strong>anon public</strong> key</li>
                  <li>Open the <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file in your project</li>
                  <li>Replace the placeholder values with your actual credentials</li>
                </ol>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-2">Your .env.local should look like:</p>
                  <pre className="text-sm text-gray-600">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Step 3: Database Setup */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 rounded-full p-2 mr-4">
                  <Database className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Step 3: Set Up Database Tables
                </h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Create the necessary database tables for your LMS.
                </p>
                
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>In Supabase, go to <strong>SQL Editor</strong></li>
                  <li>Copy the SQL commands from the <code className="bg-gray-100 px-2 py-1 rounded">README.md</code> file</li>
                  <li>Paste and run the SQL to create tables</li>
                  <li>Go to <strong>Authentication → Providers</strong> to enable Google OAuth (optional)</li>
                </ol>
              </div>
            </div>

            {/* Step 4: Upload Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="bg-orange-100 rounded-full p-2 mr-4">
                  <Upload className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Step 4: Upload Study Materials
                </h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Add your church's study materials (PDF document).
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> The admin interface for uploading PDFs is not yet implemented. 
                    For now, you can manually upload your PDF to Supabase Storage and create the section records.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5: Deploy */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 rounded-full p-2 mr-4">
                  <Globe className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Step 5: Deploy to Vercel (Free)
                </h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Make your LMS available online for your church members.
                </p>
                
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Push your code to GitHub</li>
                  <li>
                    Go to{' '}
                    <a 
                      href="https://vercel.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline inline-flex items-center"
                    >
                      vercel.com
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </li>
                  <li>Import your GitHub repository</li>
                  <li>Add your environment variables in Vercel settings</li>
                  <li>Deploy and share the URL with your church members!</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Restart Instructions */}
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              After Setting Up Supabase
            </h3>
            <p className="text-blue-800">
              Once you've updated your <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code> file 
              with your Supabase credentials, restart your development server:
            </p>
            <div className="mt-3 bg-blue-100 p-3 rounded">
              <code className="text-blue-900">npm run dev</code>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Need help? Check the{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">SETUP_GUIDE.md</code>{' '}
              file for detailed instructions.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
