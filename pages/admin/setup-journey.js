import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { ArrowLeft, Database, CheckCircle, AlertCircle, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SetupJourney() {
  const [migrationStatus, setMigrationStatus] = useState(null)
  const [seedStatus, setSeedStatus] = useState(null)
  const [seed14Status, setSeed14Status] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const runMigration = async () => {
    setLoading(true)
    setMigrationStatus(null)

    try {
      console.log('Running journey system migration...')

      const response = await fetch('/api/admin/migrate-journey-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMigrationStatus('success')
        toast.success('Journey system migration completed successfully!')
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

  const seedDefaultJourney = async () => {
    setLoading(true)
    setSeedStatus(null)

    try {
      console.log('Seeding default journey...')

      const response = await fetch('/api/admin/seed-default-journey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSeedStatus('success')
        toast.success('Default 5-day journey created successfully!')
      } else {
        setSeedStatus('error')
        toast.error('Seeding failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Seeding error:', error)
      setSeedStatus('error')
      toast.error('Seeding failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const seed14DayJourney = async () => {
    setLoading(true)
    setSeed14Status(null)

    try {
      console.log('Seeding 14-day journey...')

      const response = await fetch('/api/admin/seed-14day-journey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSeed14Status('success')
        toast.success('14-day membership journey created successfully!')
      } else {
        setSeed14Status('error')
        toast.error('Seeding failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Seeding error:', error)
      setSeed14Status('error')
      toast.error('Seeding failed: ' + error.message)
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
                  Journey System Setup
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Set up the journey system for newcomers and other user groups
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Step 1: Migration */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-8">
                <div className="text-center">
                  <Database className="mx-auto h-12 w-12 text-church-primary" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Step 1: Database Migration
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-2xl mx-auto">
                    Create the necessary database tables for the journey system.
                  </p>

                  {migrationStatus === 'success' && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">
                          Migration completed successfully!
                        </span>
                      </div>
                    </div>
                  )}

                  {migrationStatus === 'error' && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-800">
                          Migration failed
                        </span>
                      </div>
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
                        'Run Database Migration'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Seed Default Journey */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-8">
                <div className="text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-green-600" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Step 2: Create Default Journey
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-2xl mx-auto">
                    Create the default 5-day Bible study journey for newcomers.
                  </p>

                  {seedStatus === 'success' && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">
                          Default journey created successfully!
                        </span>
                      </div>
                    </div>
                  )}

                  {seedStatus === 'error' && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-800">
                          Seeding failed
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    <button
                      onClick={seedDefaultJourney}
                      disabled={loading || seedStatus === 'success' || migrationStatus !== 'success'}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Creating Journey...
                        </>
                      ) : seedStatus === 'success' ? (
                        'Journey Created'
                      ) : (
                        'Create Default Journey'
                      )}
                    </button>
                  </div>

                  {migrationStatus !== 'success' && (
                    <p className="mt-4 text-sm text-gray-500">
                      Complete the database migration first
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Seed 14-Day Journey */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-8">
                <div className="text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-purple-600" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Step 3: Create 14-Day Membership Journey
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-2xl mx-auto">
                    Create the 14-day membership booklet journey that follows the 5-day Bible study.
                  </p>

                  {seed14Status === 'success' && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">
                          14-day journey created successfully!
                        </span>
                      </div>
                    </div>
                  )}

                  {seed14Status === 'error' && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-800">
                          Seeding failed
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    <button
                      onClick={seed14DayJourney}
                      disabled={loading || seed14Status === 'success' || seedStatus !== 'success'}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Creating Journey...
                        </>
                      ) : seed14Status === 'success' ? (
                        '14-Day Journey Created'
                      ) : (
                        'Create 14-Day Journey'
                      )}
                    </button>
                  </div>

                  {seedStatus !== 'success' && (
                    <p className="mt-4 text-sm text-gray-500">
                      Complete the 5-day journey creation first
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Run the database migration to create journey tables</li>
                <li>Create the default 5-day Bible study journey for newcomers</li>
                <li>Create the 14-day membership booklet journey</li>
                <li>Users will automatically progress from 5-day to 14-day journey</li>
                <li>You can create custom journeys for other user tags in the admin panel</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
