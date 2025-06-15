import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { getPDFSections, getSectionPDFUrl } from '../lib/pdf-utils'

export default function DebugPDF() {
  const [sections, setSections] = useState([])
  const [selectedSection, setSelectedSection] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [urlTest, setUrlTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSections()
  }, [])

  const loadSections = async () => {
    try {
      console.log('Loading sections for debug...')
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
      setUrlTest(null)

      if (section.file_path) {
        console.log('Getting PDF URL for:', section.file_path)
        const url = await getSectionPDFUrl(section.file_path, supabase)
        console.log('Generated PDF URL:', url)
        setPdfUrl(url)
        
        // Test URL accessibility
        if (url) {
          testUrl(url)
        }
      } else {
        console.log('No file_path for section:', section)
      }
    } catch (error) {
      console.error('Error selecting section:', error)
      setError(error.message)
    }
  }

  const testUrl = async (url) => {
    try {
      console.log('Testing URL accessibility:', url)
      const response = await fetch(url, { method: 'HEAD' })
      console.log('URL test response:', response.status, response.statusText)
      
      setUrlTest({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })
    } catch (error) {
      console.error('URL test failed:', error)
      setUrlTest({
        error: error.message,
        ok: false
      })
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading debug info...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">PDF Debug Page</h1>
            <p className="mt-2 text-gray-600">Debug PDF loading and accessibility</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section List */}
            <div>
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

            {/* Debug Info */}
            <div>
              {selectedSection && (
                <div className="space-y-6">
                  {/* Section Info */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Section Info</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Title:</strong> {selectedSection.title}</div>
                      <div><strong>Section:</strong> {selectedSection.section_number} of {selectedSection.total_sections}</div>
                      <div><strong>File Path:</strong> {selectedSection.file_path || 'None'}</div>
                      <div><strong>Created:</strong> {new Date(selectedSection.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* URL Info */}
                  {pdfUrl && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4">Generated URL</h3>
                      <div className="space-y-2 text-sm">
                        <div className="break-all">
                          <strong>URL:</strong> 
                          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                            {pdfUrl}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* URL Test Results */}
                  {urlTest && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4">URL Accessibility Test</h3>
                      <div className="space-y-2 text-sm">
                        {urlTest.error ? (
                          <div className="text-red-600">
                            <strong>Error:</strong> {urlTest.error}
                          </div>
                        ) : (
                          <>
                            <div className={urlTest.ok ? 'text-green-600' : 'text-red-600'}>
                              <strong>Status:</strong> {urlTest.status} {urlTest.statusText}
                            </div>
                            <div>
                              <strong>Accessible:</strong> {urlTest.ok ? 'Yes' : 'No'}
                            </div>
                            {urlTest.headers && (
                              <div>
                                <strong>Content-Type:</strong> {urlTest.headers['content-type'] || 'Not specified'}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Simple iframe test */}
                  {pdfUrl && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4">Iframe Test</h3>
                      <iframe
                        src={pdfUrl}
                        width="100%"
                        height="400"
                        className="border border-gray-300 rounded"
                        title={selectedSection.title}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
