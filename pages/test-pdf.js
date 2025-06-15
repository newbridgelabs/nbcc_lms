import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import PDFViewer from '../components/PDFViewer'
import SimplePDFViewer from '../components/SimplePDFViewer'
import IframePDFViewer from '../components/IframePDFViewer'
import { supabase } from '../lib/supabase'
import { getPDFSections, getSectionPDFUrl } from '../lib/pdf-utils'

export default function TestPDF() {
  const [sections, setSections] = useState([])
  const [selectedSection, setSelectedSection] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSections()
  }, [])

  const loadSections = async () => {
    try {
      console.log('Loading sections for test...')
      const { sections: pdfSections, error: sectionsError } = await getPDFSections(supabase)
      
      if (sectionsError) {
        throw sectionsError
      }

      console.log('Loaded sections:', pdfSections)
      setSections(pdfSections || [])
      
      // Auto-select first section if available
      if (pdfSections && pdfSections.length > 0) {
        await selectSection(pdfSections[0])
      }
    } catch (error) {
      console.error('Error loading sections:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const selectSection = async (section) => {
    try {
      console.log('Selecting section:', section)
      setSelectedSection(section)
      setPdfUrl(null)

      if (section.file_path) {
        console.log('Getting PDF URL for:', section.file_path)
        const url = await getSectionPDFUrl(section.file_path, supabase)
        console.log('Generated PDF URL:', url)
        setPdfUrl(url)
      } else {
        console.log('No file_path for section:', section)
      }
    } catch (error) {
      console.error('Error selecting section:', error)
      setError(error.message)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading PDF test...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">PDF Test Page</h1>
            <p className="mt-2 text-gray-600">Test PDF loading and display functionality</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Section List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Available Sections</h2>
                {sections.length === 0 ? (
                  <p className="text-gray-500">No sections found. Upload some PDFs first.</p>
                ) : (
                  <div className="space-y-2">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => selectSection(section)}
                        className={`w-full text-left p-3 rounded-md border ${
                          selectedSection?.id === section.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">{section.title}</div>
                        <div className="text-sm text-gray-500">
                          Section {section.section_number} of {section.total_sections}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          File: {section.file_path || 'No file'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="lg:col-span-3">
              {selectedSection ? (
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold">{selectedSection.title}</h2>
                    <p className="text-gray-600">
                      Section {selectedSection.section_number} of {selectedSection.total_sections}
                    </p>
                    {pdfUrl && (
                      <p className="text-sm text-gray-500 mt-2">
                        PDF URL: <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{pdfUrl}</a>
                      </p>
                    )}
                  </div>
                  
                  {pdfUrl ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Iframe PDF Viewer (Recommended)</h3>
                        <IframePDFViewer
                          pdfUrl={pdfUrl}
                          title={selectedSection.title}
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Simple PDF Viewer (Debug)</h3>
                        <SimplePDFViewer
                          pdfUrl={pdfUrl}
                          title={selectedSection.title}
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Full PDF Viewer (PDF.js)</h3>
                        <PDFViewer
                          pdfUrl={pdfUrl}
                          title={selectedSection.title}
                          onComplete={null}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <p className="text-gray-500">Loading PDF...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">Select a section to view its PDF</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
