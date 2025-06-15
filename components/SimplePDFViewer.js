import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Import react-pdf CSS
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
}

export default function SimplePDFViewer({ pdfUrl, title }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageWidth, setPageWidth] = useState(800)

  useEffect(() => {
    console.log('SimplePDFViewer - PDF URL:', pdfUrl)
    if (pdfUrl) {
      setLoading(true)
      setError(null)
      setNumPages(null)
      setPageNumber(1)
    }
  }, [pdfUrl])

  useEffect(() => {
    // Set responsive width
    const updateWidth = () => {
      if (typeof window !== 'undefined') {
        const containerWidth = Math.min(900, window.innerWidth - 100)
        setPageWidth(containerWidth)
      }
    }

    updateWidth()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateWidth)
      return () => window.removeEventListener('resize', updateWidth)
    }
  }, [])

  function onDocumentLoadSuccess({ numPages }) {
    console.log('SimplePDFViewer - PDF loaded successfully, pages:', numPages)
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  function onDocumentLoadError(error) {
    console.error('SimplePDFViewer - Error loading PDF:', error)
    console.error('SimplePDFViewer - PDF URL that failed:', pdfUrl)
    setError(`Failed to load PDF: ${error.message || 'Unknown error'}`)
    setLoading(false)
  }

  if (!pdfUrl) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No PDF URL provided</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Loading PDF...</p>
        <p className="text-xs text-gray-500 mt-2">URL: {pdfUrl}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-sm text-gray-600 mb-4">PDF URL: {pdfUrl}</p>
        <div className="space-y-4">
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

          {/* Fallback iframe */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2">Fallback PDF viewer:</p>
            <iframe
              src={pdfUrl}
              width="100%"
              height="600"
              className="border border-gray-300 rounded"
              title={title}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">
          Page {pageNumber} of {numPages}
        </p>
      </div>

      <div className="p-4 bg-gray-100">
        <div className="flex justify-center">
          <Document
            file={{
              url: pdfUrl,
              httpHeaders: {},
              withCredentials: false
            }}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            options={{
              cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
              cMapPacked: true,
              standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
              disableWorker: false,
              isEvalSupported: false,
              disableAutoFetch: false,
              disableStream: false
            }}
            loading={
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading document...</p>
                </div>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              className="border border-gray-300 bg-white shadow-lg"
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

      {numPages > 1 && (
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
              disabled={pageNumber >= numPages}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
