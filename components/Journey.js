import { useState, useEffect } from 'react'
import { BookOpen, Calendar, CheckCircle, Clock } from 'lucide-react'
import JourneyDay from './JourneyDay'
import toast from 'react-hot-toast'

export default function Journey({ user }) {
  const [journey, setJourney] = useState(null)
  const [progress, setProgress] = useState(null)
  const [completedJourneys, setCompletedJourneys] = useState([])
  const [availableJourneys, setAvailableJourneys] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadJourney()
    }
  }, [user])

  const loadJourney = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/journeys/user-journey?userId=${user.id}`)
      const data = await response.json()

      if (data.success) {
        setJourney(data.journey)
        setProgress(data.progress)
        setCompletedJourneys(data.completedJourneys || [])
        setAvailableJourneys(data.availableJourneys || [])
      } else {
        console.error('Failed to load journey:', data.error)
        toast.error('Failed to load your journey')
      }
    } catch (error) {
      console.error('Error loading journey:', error)
      toast.error('Failed to load your journey')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteDay = async (dayId, reflectionAnswers) => {
    try {
      const response = await fetch('/api/journeys/complete-day', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          dayId,
          reflectionAnswers
        })
      })

      const data = await response.json()

      if (data.success) {
        // Reload journey to get updated progress
        await loadJourney()
      } else {
        throw new Error(data.error || 'Failed to complete day')
      }
    } catch (error) {
      console.error('Error completing day:', error)
      throw error
    }
  }

  const getNextAvailableDay = () => {
    if (!journey?.journey_days) return 1
    
    // Find the first incomplete day
    const incompleteDays = journey.journey_days.filter(day => !day.completed)
    return incompleteDays.length > 0 ? incompleteDays[0].day_number : journey.journey_days.length
  }

  const isDayAccessible = (dayNumber) => {
    if (!journey?.journey_days) return false
    
    // Day 1 is always accessible
    if (dayNumber === 1) return true
    
    // Check if all previous days are completed
    const previousDays = journey.journey_days.filter(day => day.day_number < dayNumber)
    return previousDays.every(day => day.completed)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-church-primary"></div>
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No journey available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Your journey will be available soon.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Journey Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {journey.title}
            </h1>
            <p className="text-gray-600 mb-4">
              {journey.description}
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{journey.journey_days?.length || 0} Days</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span>{progress?.completedDays || 0} Completed</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{progress?.progressPercentage || 0}% Complete</span>
              </div>
            </div>
          </div>
          
          {/* Progress Circle */}
          <div className="flex-shrink-0">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-church-primary"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${progress?.progressPercentage || 0}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-700">
                  {progress?.progressPercentage || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Days */}
      <div className="space-y-6">
        {journey.journey_days?.map((day) => (
          <JourneyDay
            key={day.id}
            day={day}
            onComplete={handleCompleteDay}
            isAccessible={isDayAccessible(day.day_number)}
          />
        ))}
      </div>

      {/* Completion Message */}
      {progress?.progressPercentage === 100 && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Congratulations! 🎉
          </h3>
          <p className="text-green-700 mb-4">
            You have completed your {journey.title}! You're ready to move forward in your faith journey.
          </p>

          {/* Show available next journeys */}
          {availableJourneys.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-green-900 mb-3">
                Continue Your Journey
              </h4>
              <div className="space-y-3">
                {availableJourneys.map((nextJourney) => (
                  <div key={nextJourney.id} className="bg-white border border-green-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900">{nextJourney.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{nextJourney.description}</p>
                    <button
                      onClick={() => window.location.reload()} // Reload to get the next journey
                      className="mt-3 inline-flex items-center px-4 py-2 bg-church-primary text-white text-sm font-medium rounded-md hover:bg-church-secondary transition-colors"
                    >
                      Start This Journey
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show completed journeys */}
      {completedJourneys.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Your Completed Journeys
          </h3>
          <div className="space-y-2">
            {completedJourneys.map((completedJourney) => (
              <div key={completedJourney.id} className="flex items-center text-blue-800">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">{completedJourney.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
