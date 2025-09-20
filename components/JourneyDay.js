import { useState } from 'react'
import { CheckCircle, Book, MessageSquare, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function JourneyDay({ day, onComplete, isAccessible = true }) {
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionAnswers, setReflectionAnswers] = useState(day.reflection_answers || {})
  const [completing, setCompleting] = useState(false)

  const handleComplete = async () => {
    if (completing) return

    setCompleting(true)
    try {
      await onComplete(day.id, reflectionAnswers)
      toast.success(`${day.title} completed!`)
      setShowReflection(false)
    } catch (error) {
      console.error('Error completing day:', error)
      toast.error('Failed to complete day')
    } finally {
      setCompleting(false)
    }
  }

  const handleReflectionChange = (questionIndex, answer) => {
    setReflectionAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const questions = day.reflection_questions || []

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 transition-all duration-200 ${
      day.completed 
        ? 'border-green-200 bg-green-50' 
        : isAccessible 
          ? 'border-blue-200 hover:border-blue-300 hover:shadow-lg' 
          : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              day.completed 
                ? 'bg-green-100 text-green-600' 
                : isAccessible 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-400'
            }`}>
              {day.completed ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <span className="font-bold">{day.day_number}</span>
              )}
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-semibold ${
                isAccessible ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {day.title}
              </h3>
              {day.scripture_reference && (
                <p className={`text-sm ${
                  isAccessible ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  <Book className="inline w-4 h-4 mr-1" />
                  {day.scripture_reference}
                </p>
              )}
            </div>
          </div>
          {day.completed && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Completed
            </span>
          )}
        </div>

        {/* Content */}
        {isAccessible && (
          <>
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                {day.content}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {!day.completed && (
                <>
                  {questions.length > 0 && (
                    <button
                      onClick={() => setShowReflection(!showReflection)}
                      className="flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {showReflection ? 'Hide' : 'Show'} Reflection Questions
                    </button>
                  )}
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="flex items-center justify-center px-6 py-2 bg-church-primary text-white rounded-md hover:bg-church-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {completing ? (
                      <>
                        <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Completing...
                      </>
                    ) : (
                      <>
                        Complete Day
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </>
              )}
              {day.completed && questions.length > 0 && (
                <button
                  onClick={() => setShowReflection(!showReflection)}
                  className="flex items-center justify-center px-4 py-2 border border-green-300 text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {showReflection ? 'Hide' : 'View'} Your Reflections
                </button>
              )}
            </div>
          </>
        )}

        {!isAccessible && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">
              Complete the previous days to unlock this content
            </p>
          </div>
        )}
      </div>

      {/* Reflection Questions */}
      {showReflection && isAccessible && questions.length > 0 && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Reflection Questions
          </h4>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {question}
                </label>
                <textarea
                  value={reflectionAnswers[index] || ''}
                  onChange={(e) => handleReflectionChange(index, e.target.value)}
                  disabled={day.completed}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-church-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  rows="3"
                  placeholder={day.completed ? "Your reflection..." : "Take a moment to reflect..."}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
