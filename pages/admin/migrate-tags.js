import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { ArrowLeft, Database, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MigrateTags() {
  const [migrationStatus, setMigrationStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const runMigration = async () => {
    setLoading(true)
    setMigrationStatus(null)

    try {
      console.log('Running user tags migration...')

      const response = await fetch('/api/admin/migrate-user-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMigrationStatus('success')
        toast.success('User tags migration completed successfully!')
      } else {
        setMigrationStatus('error')
        toast.error('Migration failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Migration error:', error)
      setMigrationStatus('error')
      toast.error('Migration failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/admin')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold leading-7 text-gray-900">
                  User Tags Migration
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Add user tagging system to existing installation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-8">
              <div className="text-center">
                <Database className="mx-auto h-12 w-12 text-church-primary" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  User Tags Database Migration
                </h3>
                <p className="mt-1 text-sm text-gray-500 max-w-2xl mx-auto">
                  This migration will add user tagging functionality to your system. 
                  It will add the user_tag column to both allowed_users and users tables.
                </p>

                {migrationStatus === 'success' && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">
                        Migration completed successfully!
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-green-700">
                      User tagging system is now available. You can now assign tags to users 
                      when adding them to the allowed users list.
                    </p>
                  </div>
                )}

                {migrationStatus === 'error' && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-800">
                        Migration failed
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-red-700">
                      Please check the console for error details and try again.
                    </p>
                  </div>
                )}

                <div className="mt-8">
                  <button
                    onClick={runMigration}
                    disabled={loading || migrationStatus === 'success'}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-church-primary hover:bg-church-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Running Migration...
                      </>
                    ) : migrationStatus === 'success' ? (
                      'Migration Completed'
                    ) : (
                      'Run Migration'
                    )}
                  </button>
                </div>

                <div className="mt-8 text-left">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">What this migration does:</h4>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• Adds user_tag column to allowed_users table</li>
                    <li>• Adds user_tag column to users table</li>
                    <li>• Sets default tag as 'newcomer' for existing records</li>
                    <li>• Creates database indexes for better performance</li>
                    <li>• Enables journey-based user management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
