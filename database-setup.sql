-- NBCC LMS Database Setup
-- Run this SQL in your Supabase SQL Editor

-- Note: auth.users table already has RLS enabled by default

-- Create users table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'member',
  user_tag TEXT DEFAULT 'newcomer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create PDF sections table
CREATE TABLE public.pdf_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content BYTEA,
  section_number INTEGER NOT NULL,
  total_sections INTEGER NOT NULL,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user progress table
CREATE TABLE public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.pdf_sections(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, section_id)
);

-- Create agreements table
CREATE TABLE public.agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL,
  user_signature TEXT NOT NULL,
  pastor_signature TEXT,
  pdf_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signed_at TIMESTAMP WITH TIME ZONE
);

-- Create allowed_users table for selective registration
CREATE TABLE public.allowed_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  invited_by UUID REFERENCES public.users(id),
  is_used BOOLEAN DEFAULT FALSE,
  temp_password TEXT,
  user_tag TEXT DEFAULT 'newcomer',
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  registered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('pdf-sections', 'pdf-sections', true),
  ('agreements', 'agreements', false);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for pdf_sections table
CREATE POLICY "PDF sections are viewable by authenticated users" ON public.pdf_sections
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for user_progress table
CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for agreements table
CREATE POLICY "Users can view own agreements" ON public.agreements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agreements" ON public.agreements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agreements" ON public.agreements
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_section_id ON public.user_progress(section_id);
CREATE INDEX idx_agreements_user_id ON public.agreements(user_id);
CREATE INDEX idx_agreements_status ON public.agreements(status);
CREATE INDEX idx_allowed_users_email ON public.allowed_users(email);
CREATE INDEX idx_allowed_users_is_used ON public.allowed_users(is_used);

-- Create function to handle user creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, username)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage policies for pdf-sections bucket
CREATE POLICY "Public can view PDF sections" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdf-sections');

CREATE POLICY "Authenticated users can upload PDF sections" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdf-sections' AND auth.role() = 'authenticated');

-- Storage policies for agreements bucket
CREATE POLICY "Users can view their own agreement PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'agreements' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Authenticated users can upload agreement PDFs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'agreements' AND auth.role() = 'authenticated');

-- Create RLS policies for allowed_users table
CREATE POLICY "Admins can view all allowed users" ON public.allowed_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

CREATE POLICY "Admins can insert allowed users" ON public.allowed_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

CREATE POLICY "Admins can update allowed users" ON public.allowed_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

CREATE POLICY "Admins can delete allowed users" ON public.allowed_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );
