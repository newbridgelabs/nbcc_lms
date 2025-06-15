import { useState, useEffect } from 'react'
import { Download, ExternalLink, RefreshCw } from 'lucide-react'

export default function IframePDFViewer({ pdfUrl, title }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [iframeKey, setIframeKey] = useState(0)

  useEffect(() => {
    console.log('IframePDFViewer - PDF URL:', pdfUrl)
    if (pdfUrl) {
      setLoading(true)
      setError(null)
      setIframeKey(prev => prev + 1) // Force iframe reload
    }
  }, [pdfUrl])

  const handleIframeLoad = () => {
    console.log('IframePDFViewer - PDF loaded successfully')
    setLoading(false)
    setError(null)
  }

  const handleIframeError = () => {
    console.error('IframePDFViewer - Error loading PDF in iframe')
    setError('Failed to load PDF in iframe')
    setLoading(false)
  }

  const refreshPDF = () => {
    setLoading(true)
    setError(null)
    setIframeKey(prev => prev + 1)
  }

  if (!pdfUrl) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No PDF URL provided</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h3>
            <p className="text-xs sm:text-sm text-gray-600">PDF Document</p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={refreshPDF}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Refresh PDF"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-2 sm:px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm min-h-[44px]"
            >
              <ExternalLink className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Open in New Tab</span>
            </a>

            <a
              href={pdfUrl}
              download
              className="flex items-center px-2 sm:px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs sm:text-sm min-h-[44px]"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </a>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-96 bg-gray-50">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading PDF document...</p>
            <p className="text-xs text-gray-500 mt-2">URL: {pdfUrl}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <button
                onClick={refreshPDF}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Open PDF Directly
              </a>
            </div>
          </div>
        </div>
      )}

      {/* PDF Iframe */}
      <div className="relative pdf-viewer-container">
        <iframe
          key={iframeKey}
          src={pdfUrl}
          width="100%"
          height="800"
          className={`border-0 ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 w-full`}
          title={title || 'PDF Document'}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{
            minHeight: '60vh',
            height: 'clamp(400px, 60vh, 800px)'
          }}
        />

        {/* Overlay for loading */}
        {loading && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base">Loading PDF...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with URL info */}
      <div className="bg-gray-50 border-t border-gray-200 p-3">
        <p className="text-xs text-gray-500 truncate">
          Source: {pdfUrl}
        </p>
      </div>
    </div>
  )
}
