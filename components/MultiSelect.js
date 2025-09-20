import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

export default function MultiSelect({ 
  options = [], 
  selected = [], 
  onChange, 
  placeholder = "Select options...",
  label = "",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const filteredOptions = options.filter(option => {
    const optionText = typeof option === 'string' ? option : option.label || option.title || option.name
    return optionText.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleToggleOption = (option) => {
    const optionValue = typeof option === 'string' ? option : option.value || option.id
    const isSelected = selected.some(item => {
      const selectedValue = typeof item === 'string' ? item : item.value || item.id
      return selectedValue === optionValue
    })

    if (isSelected) {
      const newSelected = selected.filter(item => {
        const selectedValue = typeof item === 'string' ? item : item.value || item.id
        return selectedValue !== optionValue
      })
      onChange(newSelected)
    } else {
      onChange([...selected, option])
    }
  }

  const handleRemoveSelected = (optionToRemove) => {
    const optionValue = typeof optionToRemove === 'string' ? optionToRemove : optionToRemove.value || optionToRemove.id
    const newSelected = selected.filter(item => {
      const selectedValue = typeof item === 'string' ? item : item.value || item.id
      return selectedValue !== optionValue
    })
    onChange(newSelected)
  }

  const getDisplayText = (item) => {
    if (typeof item === 'string') return item
    return item.label || item.title || item.name || item.value || item.id
  }

  const isOptionSelected = (option) => {
    const optionValue = typeof option === 'string' ? option : option.value || option.id
    return selected.some(item => {
      const selectedValue = typeof item === 'string' ? item : item.value || item.id
      return selectedValue === optionValue
    })
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div ref={dropdownRef} className="relative">
        {/* Selected items display */}
        <div 
          className="min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-church-primary"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              selected.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-church-primary text-white"
                >
                  {getDisplayText(item)}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveSelected(item)
                    }}
                    className="ml-1 hover:bg-church-secondary rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-church-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Options */}
            <div className="py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = isOptionSelected(option)
                  return (
                    <div
                      key={index}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                        isSelected ? 'bg-church-primary text-white hover:bg-church-secondary' : 'text-gray-900'
                      }`}
                      onClick={() => handleToggleOption(option)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by parent click
                          className="mr-2"
                        />
                        {getDisplayText(option)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
