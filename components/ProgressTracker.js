import { CheckCircle, Circle, Lock } from 'lucide-react'

export default function ProgressTracker({
  sections = [],
  currentSection = 1,
  completedSections = [],
  onSectionClick
}) {
  console.log('ProgressTracker props:', {
    sectionsCount: sections.length,
    currentSection,
    completedSections,
    completedSectionsType: typeof completedSections,
    completedSectionsArray: Array.isArray(completedSections)
  })

  // Ensure completedSections is always an array of numbers
  const safeCompletedSections = Array.isArray(completedSections)
    ? completedSections.filter(s => typeof s === 'number' && !isNaN(s))
    : []

  console.log('Safe completed sections:', safeCompletedSections)

  const getSectionStatus = (sectionNumber) => {
    if (safeCompletedSections.includes(sectionNumber)) {
      return 'completed'
    } else if (sectionNumber === currentSection) {
      return 'current'
    } else if (sectionNumber < currentSection || sectionNumber === 1) {
      // First section is always available, others are available if they're before current
      return 'available'
    } else {
      return 'locked'
    }
  }

  const getSectionIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'current':
        return <Circle className="h-6 w-6 text-blue-600 fill-current" />
      case 'available':
        return <Circle className="h-6 w-6 text-gray-400" />
      case 'locked':
        return <Lock className="h-6 w-6 text-gray-300" />
      default:
        return <Circle className="h-6 w-6 text-gray-400" />
    }
  }

  const getSectionStyles = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800 cursor-pointer hover:bg-green-100'
      case 'current':
        return 'bg-blue-50 border-blue-200 text-blue-800 cursor-pointer hover:bg-blue-100'
      case 'available':
        return 'bg-gray-50 border-gray-200 text-gray-600 cursor-pointer hover:bg-gray-100'
      case 'locked':
        return 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-400'
    }
  }

  const handleSectionClick = (sectionNumber, status) => {
    if (status !== 'locked' && onSectionClick) {
      onSectionClick(sectionNumber)
    }
  }

  const completedCount = safeCompletedSections.length
  const totalSections = sections.length
  const progressPercentage = totalSections > 0 ? (completedCount / totalSections) * 100 : 0

  console.log('Progress calculation:', {
    completedCount,
    totalSections,
    progressPercentage: Math.round(progressPercentage)
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          Learning Progress
        </h3>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2">
          <div
            className="bg-green-600 h-2 sm:h-3 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-xs sm:text-sm text-gray-600">
          <span>{completedCount} of {totalSections} sections completed</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
      </div>

      {/* Section List */}
      <div className="space-y-2 sm:space-y-3">
        {sections.map((section, index) => {
          const sectionNumber = index + 1
          const status = getSectionStatus(sectionNumber)

          return (
            <div
              key={section.id || sectionNumber}
              onClick={() => handleSectionClick(sectionNumber, status)}
              className={`flex items-center p-3 sm:p-4 rounded-lg border transition-colors duration-200 ${getSectionStyles(status)} min-h-[60px] sm:min-h-[auto]`}
            >
              <div className="flex-shrink-0 mr-3">
                {getSectionIcon(status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                  <h4 className="text-sm sm:text-base font-medium truncate">
                    Section {sectionNumber}
                  </h4>
                  <div className="flex gap-1">
                    {status === 'current' && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Current
                      </span>
                    )}
                    {status === 'completed' && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Complete
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                  {section.title || `Study material section ${sectionNumber}`}
                </p>

                {section.pageRange && (
                  <p className="text-xs text-gray-400 mt-1">
                    Pages {section.pageRange}
                  </p>
                )}
              </div>
              
              {status === 'locked' && (
                <div className="ml-2 text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                  Complete previous sections first
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Agreement Section */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <div
          className={`flex items-center p-3 sm:p-4 rounded-lg border transition-colors duration-200 min-h-[60px] sm:min-h-[auto] ${
            completedCount === totalSections
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800 cursor-pointer hover:bg-yellow-100'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          onClick={() => {
            if (completedCount === totalSections && onSectionClick) {
              onSectionClick('agreement')
            }
          }}
        >
          <div className="flex-shrink-0 mr-3">
            {completedCount === totalSections ? (
              <Circle className="h-6 w-6 text-yellow-600" />
            ) : (
              <Lock className="h-6 w-6 text-gray-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
              <h4 className="text-sm sm:text-base font-medium">
                Membership Agreement
              </h4>
              {completedCount === totalSections && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Available
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm mt-1">
              {completedCount === totalSections
                ? 'Ready to complete your membership'
                : 'Complete all sections to unlock'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
