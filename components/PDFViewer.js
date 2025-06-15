import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react'

// Import react-pdf CSS
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Set up PDF.js worker - use the recommended approach for Next.js
if (typeof window !== 'undefined') {
  // Use unpkg CDN which is more reliable for PDF.js workers
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

  console.log('PDF.js version:', pdfjs.version)
  console.log('PDF.js worker configured:', pdfjs.GlobalWorkerOptions.workerSrc)
}

export default function PDFViewer({ pdfUrl, title, onComplete }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('PDFViewer received URL:', pdfUrl)
    if (pdfUrl) {
      setLoading(true)
      setError(null)
    }
  }, [pdfUrl])

  function onDocumentLoadSuccess({ numPages }) {
    console.log('PDF loaded successfully, pages:', numPages)
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  function onDocumentLoadError(error) {
    console.error('Error loading PDF:', error)
    console.error('PDF URL that failed:', pdfUrl)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    setError(`Failed to load PDF document: ${error.message || 'Unknown error'}`)
    setLoading(false)
  }

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages))
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.0))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5))
  }

  const downloadPDF = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `${title}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600">No PDF URL provided</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
          <p className="text-xs text-gray-500 mt-2">URL: {pdfUrl}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <div className="text-center mb-6">
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
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

        {/* Fallback iframe */}
        <div>
          <p className="text-sm text-gray-600 mb-2 text-center">Fallback PDF viewer:</p>
          <iframe
            src={pdfUrl}
            width="100%"
            height="600"
            className="border border-gray-300 rounded"
            title={title}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* PDF Controls */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          
          <div className="flex items-center space-x-4">
            {/* Page Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="p-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-sm text-gray-700 px-3 py-1 bg-white border border-gray-300 rounded">
                {pageNumber} of {numPages}
              </span>
              
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="p-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={zoomOut}
                className="p-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              
              <span className="text-sm text-gray-700 px-3 py-1 bg-white border border-gray-300 rounded">
                {Math.round(scale * 100)}%
              </span>
              
              <button
                onClick={zoomIn}
                className="p-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Download Button */}
            <button
              onClick={downloadPDF}
              className="flex items-center px-3 py-2 bg-church-primary text-white rounded-md hover:bg-church-secondary"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* PDF Document */}
      <div className="p-4 bg-gray-100 min-h-96">
        <div className="flex justify-center">
          <Document
            file={{
              url: pdfUrl,
              httpHeaders: {},
              withCredentials: false
            }}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="shadow-lg"
            options={{
              cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
              standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
            }}
            loading={
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PDF document...</p>
                </div>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="border border-gray-300 bg-white"
              loading={
                <div className="flex items-center justify-center h-96 bg-white border border-gray-300">
                  <div className="text-center">
                    <div className="loading-spinner mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading page...</p>
                  </div>
                </div>
              }
            />
          </Document>
        </div>
      </div>

      {/* Complete Section Button */}
      {onComplete && (
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="text-center">
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Mark Section as Complete
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Click to proceed to the next section
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
