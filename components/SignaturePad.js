import { useRef, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { RotateCcw, Download, Check } from 'lucide-react'

export default function SignaturePad({ 
  onSignatureChange, 
  label = "Your Signature", 
  required = false,
  disabled = false 
}) {
  const sigCanvas = useRef(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [signatureData, setSignatureData] = useState(null)

  useEffect(() => {
    if (sigCanvas.current) {
      sigCanvas.current.on()
    }
  }, [])

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear()
      setIsEmpty(true)
      setSignatureData(null)
      if (onSignatureChange) {
        onSignatureChange(null)
      }
    }
  }

  const saveSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataURL = sigCanvas.current.toDataURL('image/png')
      setSignatureData(dataURL)
      setIsEmpty(false)
      if (onSignatureChange) {
        onSignatureChange(dataURL)
      }
    }
  }

  const downloadSignature = () => {
    if (signatureData) {
      const link = document.createElement('a')
      link.download = 'signature.png'
      link.href = signatureData
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      saveSignature()
    }
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="border-2 border-gray-300 rounded-lg bg-white signature-pad-container">
        {/* Signature Canvas */}
        <div className="relative">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              width: 500,
              height: 200,
              className: 'signature-canvas w-full h-40 sm:h-48 rounded-t-lg',
              style: {
                border: 'none',
                background: disabled ? '#f9fafb' : 'white',
                touchAction: 'none' // Prevent scrolling on mobile when signing
              }
            }}
            onEnd={handleEnd}
            backgroundColor={disabled ? '#f9fafb' : 'white'}
            penColor={disabled ? '#d1d5db' : '#000000'}
            disabled={disabled}
          />

          {/* Placeholder text when empty */}
          {isEmpty && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-xs sm:text-sm text-center px-4">
                Sign here with your mouse or finger
              </p>
            </div>
          )}

          {/* Disabled overlay */}
          {disabled && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
              <p className="text-gray-500 text-xs sm:text-sm text-center px-4">Signature pad disabled</p>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={clearSignature}
              disabled={disabled || isEmpty}
              className="flex items-center px-3 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] rounded"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </button>

            {signatureData && (
              <button
                type="button"
                onClick={downloadSignature}
                className="flex items-center px-3 py-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 min-h-[44px] rounded"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
            )}
          </div>

          <div className="flex items-center">
            {!isEmpty && (
              <div className="flex items-center text-green-600 text-xs sm:text-sm">
                <Check className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Signature captured</span>
                <span className="sm:hidden">Captured</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Validation message */}
      {required && isEmpty && (
        <p className="mt-1 text-sm text-red-600">
          Signature is required
        </p>
      )}
      
      {/* Instructions */}
      <p className="mt-2 text-xs text-gray-500 leading-relaxed">
        <span className="hidden sm:inline">Use your mouse or finger to draw your signature in the box above.</span>
        <span className="sm:hidden">Draw your signature with your finger in the box above.</span>
        {' '}You can clear and redraw if needed.
      </p>
    </div>
  )
}
