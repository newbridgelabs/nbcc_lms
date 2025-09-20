-- Create user_tags table for many-to-many relationship between users and tags
CREATE TABLE IF NOT EXISTS public.user_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tag_name)
);

-- Create user_journeys table for many-to-many relationship between users and journeys
CREATE TABLE IF NOT EXISTS public.user_journeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  journey_order INTEGER DEFAULT 1,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT true,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, journey_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON public.user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag_name ON public.user_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_user_tags_active ON public.user_tags(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_user_journeys_user_id ON public.user_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_journey_id ON public.user_journeys(journey_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_order ON public.user_journeys(user_id, journey_order);
CREATE INDEX IF NOT EXISTS idx_user_journeys_active ON public.user_journeys(user_id, is_active);

-- Enable Row Level Security
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own tags" ON public.user_tags;
DROP POLICY IF EXISTS "Admins can manage all user tags" ON public.user_tags;
DROP POLICY IF EXISTS "Users can view their own journeys" ON public.user_journeys;
DROP POLICY IF EXISTS "Admins can manage all user journeys" ON public.user_journeys;

-- Create RLS policies for user_tags
CREATE POLICY "Users can view their own tags" ON public.user_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user tags" ON public.user_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create RLS policies for user_journeys
CREATE POLICY "Users can view their own journeys" ON public.user_journeys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user journeys" ON public.user_journeys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Helper function to get user tags
CREATE OR REPLACE FUNCTION get_user_tags(user_uuid UUID)
RETURNS TABLE(tag_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ut.tag_name
  FROM public.user_tags ut
  WHERE ut.user_id = user_uuid AND ut.is_active = true
  ORDER BY ut.assigned_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user journeys
CREATE OR REPLACE FUNCTION get_user_journeys(user_uuid UUID)
RETURNS TABLE(
  journey_id UUID,
  journey_order INTEGER,
  title TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uj.journey_id,
    uj.journey_order,
    j.title,
    j.description
  FROM public.user_journeys uj
  JOIN public.journeys j ON j.id = uj.journey_id
  WHERE uj.user_id = user_uuid AND uj.is_active = true AND j.is_active = true
  ORDER BY uj.journey_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to assign tag to user
CREATE OR REPLACE FUNCTION assign_user_tag(
  user_uuid UUID,
  tag TEXT,
  assigned_by_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.user_tags (user_id, tag_name, assigned_by)
  VALUES (user_uuid, tag, assigned_by_uuid)
  ON CONFLICT (user_id, tag_name) 
  DO UPDATE SET 
    is_active = true,
    assigned_at = NOW(),
    assigned_by = assigned_by_uuid,
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to assign journey to user
CREATE OR REPLACE FUNCTION assign_user_journey(
  user_uuid UUID,
  journey_uuid UUID,
  order_num INTEGER DEFAULT 1,
  assigned_by_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.user_journeys (user_id, journey_id, journey_order, assigned_by)
  VALUES (user_uuid, journey_uuid, order_num, assigned_by_uuid)
  ON CONFLICT (user_id, journey_id) 
  DO UPDATE SET 
    journey_order = order_num,
    is_active = true,
    assigned_at = NOW(),
    assigned_by = assigned_by_uuid,
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
