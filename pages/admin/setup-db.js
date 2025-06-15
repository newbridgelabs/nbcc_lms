import { useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { Database, CheckCircle, AlertCircle, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SetupDatabase() {
  const [setupStatus, setSetupStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const sqlScript = `-- Create multimedia content table for rich section content
CREATE TABLE IF NOT EXISTS multimedia_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES pdf_sections(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'video', 'audio', 'pdf', 'embed'
  title VARCHAR(255),
  content_data JSONB NOT NULL, -- Flexible storage for different content types
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_multimedia_content_section_id ON multimedia_content(section_id);
CREATE INDEX IF NOT EXISTS idx_multimedia_content_order ON multimedia_content(section_id, display_order);

-- Enable RLS
ALTER TABLE multimedia_content ENABLE ROW LEVEL SECURITY;

-- Create policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read multimedia content" ON multimedia_content;
DROP POLICY IF EXISTS "Allow authenticated users to insert multimedia content" ON multimedia_content;
DROP POLICY IF EXISTS "Allow authenticated users to update multimedia content" ON multimedia_content;
DROP POLICY IF EXISTS "Allow authenticated users to delete multimedia content" ON multimedia_content;

CREATE POLICY "Allow authenticated users to read multimedia content" ON multimedia_content
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert multimedia content" ON multimedia_content
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update multimedia content" ON multimedia_content
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete multimedia content" ON multimedia_content
  FOR DELETE TO authenticated USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_multimedia_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_multimedia_content_updated_at ON multimedia_content;
CREATE TRIGGER update_multimedia_content_updated_at
  BEFORE UPDATE ON multimedia_content
  FOR EACH ROW
  EXECUTE FUNCTION update_multimedia_content_updated_at();`

  const testTableAccess = async () => {
    setLoading(true)
    try {
      // Test if table exists and is accessible
      const { data, error } = await supabase
        .from('multimedia_content')
        .select('id')
        .limit(1)

      if (error) {
        if (error.code === '42P01') {
          setSetupStatus({
            success: false,
            message: 'Table does not exist. Please run the SQL script manually.',
            error: error.message
          })
        } else {
          setSetupStatus({
            success: false,
            message: 'Table access error',
            error: error.message
          })
        }
      } else {
        setSetupStatus({
          success: true,
          message: 'Multimedia content table is set up and accessible!',
          data: data
        })
      }
    } catch (error) {
      setSetupStatus({
        success: false,
        message: 'Unexpected error',
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    toast.success('SQL script copied to clipboard!')
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Database Setup</h1>
                <p className="mt-2 text-gray-600">Set up multimedia content table for rich section content</p>
              </div>
            </div>
          </div>

          {/* Test Table Access */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Test Table Access</h2>
            <p className="text-gray-600 mb-4">
              Click the button below to test if the multimedia_content table exists and is accessible.
            </p>
            
            <button
              onClick={testTableAccess}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Table Access'}
            </button>

            {setupStatus && (
              <div className={`mt-4 p-4 rounded-lg ${setupStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {setupStatus.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <span className={setupStatus.success ? 'text-green-800' : 'text-red-800'}>
                    {setupStatus.message}
                  </span>
                </div>
                {setupStatus.error && (
                  <p className="text-sm text-gray-600 mt-2">Error: {setupStatus.error}</p>
                )}
              </div>
            )}
          </div>

          {/* SQL Script */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">SQL Setup Script</h2>
              <button
                onClick={copyToClipboard}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              If the table doesn't exist, copy the SQL script below and run it in your Supabase dashboard:
            </p>
            
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm whitespace-pre-wrap">{sqlScript}</pre>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Go to your Supabase dashboard</li>
                <li>2. Navigate to the SQL Editor</li>
                <li>3. Copy and paste the SQL script above</li>
                <li>4. Click "Run" to execute the script</li>
                <li>5. Return here and click "Test Table Access" to verify</li>
              </ol>
            </div>
          </div>

          {/* Features Overview */}
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-lg font-semibold mb-4">Multimedia Content Features</h2>
            <p className="text-gray-600 mb-4">
              Once the table is set up, you'll be able to add rich content to your sections:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">📝 Rich Text</h3>
                <p className="text-sm text-gray-600">Add formatted text content with HTML support</p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">🖼️ Images</h3>
                <p className="text-sm text-gray-600">Embed images with captions and alt text</p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">🎥 Videos</h3>
                <p className="text-sm text-gray-600">Embed YouTube videos or upload video files</p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">🎵 Audio</h3>
                <p className="text-sm text-gray-600">Add audio files with optional transcripts</p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">📄 PDF Documents</h3>
                <p className="text-sm text-gray-600">Embed additional PDF documents</p>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">🔗 Embed Code</h3>
                <p className="text-sm text-gray-600">Add custom embed codes for external content</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
