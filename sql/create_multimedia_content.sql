-- Create multimedia content table for rich section content
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

-- Create policies
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
CREATE TRIGGER update_multimedia_content_updated_at
  BEFORE UPDATE ON multimedia_content
  FOR EACH ROW
  EXECUTE FUNCTION update_multimedia_content_updated_at();

-- Example content_data structures for different content types:
-- 
-- TEXT:
-- {
--   "html": "<p>Rich text content with <strong>formatting</strong></p>",
--   "plain_text": "Plain text version"
-- }
--
-- IMAGE:
-- {
--   "url": "https://example.com/image.jpg",
--   "alt_text": "Description of image",
--   "caption": "Image caption",
--   "width": 800,
--   "height": 600
-- }
--
-- VIDEO:
-- {
--   "url": "https://youtube.com/watch?v=...",
--   "embed_url": "https://youtube.com/embed/...",
--   "thumbnail": "https://img.youtube.com/vi/.../maxresdefault.jpg",
--   "duration": "10:30",
--   "description": "Video description"
-- }
--
-- AUDIO:
-- {
--   "url": "https://example.com/audio.mp3",
--   "duration": "5:45",
--   "transcript": "Audio transcript text"
-- }
--
-- PDF:
-- {
--   "url": "https://example.com/document.pdf",
--   "filename": "document.pdf",
--   "page_count": 10
-- }
--
-- EMBED:
-- {
--   "embed_code": "<iframe src='...'></iframe>",
--   "source": "YouTube",
--   "url": "https://original-url.com"
-- }
