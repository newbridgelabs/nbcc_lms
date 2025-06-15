import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { getCurrentUser } from '../lib/supabase'
import { BookOpen, Users, Shield, FileText, ArrowRight, CheckCircle } from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      // If user is already logged in, redirect to dashboard
      if (currentUser) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    )
  }

  // If user is logged in, don't show landing page
  if (user) {
    return null
  }

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-church-primary to-church-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Welcome to NBCC
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Begin your journey of faith and become part of our loving community. 
              Learn about our beliefs, values, and what it means to be a member.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/auth/register')}
                className="inline-flex items-center px-8 py-4 bg-white text-church-primary font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-church-primary transition-colors duration-200"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Path to Membership
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive learning system guides you through everything you need to know about joining our church family.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="bg-church-primary bg-opacity-10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-church-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Study Materials
              </h3>
              <p className="text-gray-600">
                Learn about our church's beliefs, history, and values through carefully curated study materials.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="bg-church-primary bg-opacity-10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-church-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Community Focus
              </h3>
              <p className="text-gray-600">
                Understand what it means to be part of our church community and the responsibilities that come with membership.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="bg-church-primary bg-opacity-10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-church-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure Process
              </h3>
              <p className="text-gray-600">
                Your information is protected with secure authentication and encrypted data storage.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="bg-church-primary bg-opacity-10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-church-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Digital Agreement
              </h3>
              <p className="text-gray-600">
                Complete your membership with a digital agreement that includes your signature and commitment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              A simple, step-by-step process to join our church community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-church-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Register & Verify
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Create your account with email verification to ensure secure access to our learning materials.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Email registration
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Account verification
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Secure login
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-church-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Study & Learn
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Progress through 5 sections of study materials at your own pace, learning about our church and faith.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  5 study sections
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Progress tracking
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Self-paced learning
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="bg-church-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Sign Agreement
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Complete your membership by filling out the agreement form and providing your digital signature.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Digital form
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Electronic signature
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  PDF generation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-church-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Begin?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our church community today and start your journey of faith, fellowship, and spiritual growth.
          </p>
          <button
            onClick={() => router.push('/auth/register')}
            className="inline-flex items-center px-8 py-4 bg-white text-church-primary font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </Layout>
  )
}
