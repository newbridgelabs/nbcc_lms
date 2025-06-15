-- Create multimedia_content table
CREATE TABLE IF NOT EXISTS public.multimedia_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.pdf_sections(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'audio', 'pdf', 'embed')),
  title TEXT,
  content_data JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_multimedia_content_section_id ON public.multimedia_content(section_id);
CREATE INDEX IF NOT EXISTS idx_multimedia_content_display_order ON public.multimedia_content(section_id, display_order);
CREATE INDEX IF NOT EXISTS idx_multimedia_content_active ON public.multimedia_content(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE public.multimedia_content ENABLE ROW LEVEL SECURITY;

-- Create policies for multimedia_content
CREATE POLICY "Allow authenticated users to read multimedia content" ON public.multimedia_content
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert multimedia content" ON public.multimedia_content
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update multimedia content" ON public.multimedia_content
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete multimedia content" ON public.multimedia_content
  FOR DELETE TO authenticated USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_multimedia_content_updated_at 
  BEFORE UPDATE ON public.multimedia_content 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
