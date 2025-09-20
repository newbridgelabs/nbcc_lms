-- Independent Tags and Journeys Migration
-- This migration implements the new system where tags and journeys are independent
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create user_tags table for multiple tags per user
CREATE TABLE IF NOT EXISTS public.user_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tag_name)
);

-- Step 2: Create user_journeys table for multiple journeys per user
CREATE TABLE IF NOT EXISTS public.user_journeys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES public.journeys(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.users(id),
    journey_order INTEGER DEFAULT 1, -- Order in which journeys should be presented
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, journey_id)
);

-- Step 3: Add user_id field to users table (unique identifier separate from email)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_id TEXT UNIQUE;

-- Step 4: Create function to generate unique user IDs
CREATE OR REPLACE FUNCTION generate_user_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        new_id := 'USER' || LPAD(counter::TEXT, 4, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE user_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to prevent infinite loop
        IF counter > 9999 THEN
            new_id := 'USER' || LPAD(counter::TEXT, 6, '0');
            IF NOT EXISTS (SELECT 1 FROM public.users WHERE user_id = new_id) THEN
                RETURN new_id;
            END IF;
        END IF;
        
        -- If we reach 999999, use UUID-based approach
        IF counter > 999999 THEN
            new_id := 'USER' || REPLACE(gen_random_uuid()::TEXT, '-', '')::TEXT;
            IF NOT EXISTS (SELECT 1 FROM public.users WHERE user_id = new_id) THEN
                RETURN new_id;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update existing users to have user_id
UPDATE public.users 
SET user_id = generate_user_id()
WHERE user_id IS NULL;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON public.user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag_name ON public.user_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_user_journeys_user_id ON public.user_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_journey_id ON public.user_journeys(journey_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_order ON public.user_journeys(journey_order);
CREATE INDEX IF NOT EXISTS idx_user_journeys_active ON public.user_journeys(is_active);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);

-- Step 7: Enable RLS on new tables
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for user_tags
CREATE POLICY "Users can view own tags" ON public.user_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tags" ON public.user_tags
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user tags" ON public.user_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- Step 9: Create RLS policies for user_journeys
CREATE POLICY "Users can view own journeys" ON public.user_journeys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own journey progress" ON public.user_journeys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user journeys" ON public.user_journeys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- Step 10: Migrate existing user_tag data to user_tags table
INSERT INTO public.user_tags (user_id, tag_name)
SELECT id, user_tag
FROM public.users
WHERE user_tag IS NOT NULL
ON CONFLICT (user_id, tag_name) DO NOTHING;

-- Step 11: Create default journey assignments based on existing user tags
-- This will assign journeys to users based on their current tags
INSERT INTO public.user_journeys (user_id, journey_id, journey_order, assigned_by)
SELECT 
    u.id as user_id,
    j.id as journey_id,
    ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY j.created_at) as journey_order,
    (SELECT id FROM public.users WHERE is_admin = true LIMIT 1) as assigned_by
FROM public.users u
JOIN public.journeys j ON j.user_tag = u.user_tag
WHERE j.is_active = true
ON CONFLICT (user_id, journey_id) DO NOTHING;

-- Step 12: Create function to assign default journey to new users
CREATE OR REPLACE FUNCTION assign_default_journey_to_user(user_uuid UUID, user_tag_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Insert user tag
    INSERT INTO public.user_tags (user_id, tag_name)
    VALUES (user_uuid, user_tag_name)
    ON CONFLICT (user_id, tag_name) DO NOTHING;

    -- Assign default journeys for this tag
    INSERT INTO public.user_journeys (user_id, journey_id, journey_order)
    SELECT
        user_uuid,
        j.id,
        ROW_NUMBER() OVER (ORDER BY j.created_at)
    FROM public.journeys j
    WHERE j.user_tag = user_tag_name AND j.is_active = true
    ON CONFLICT (user_id, journey_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Step 13: Create function to get user's active journeys in order
CREATE OR REPLACE FUNCTION get_user_active_journeys(user_uuid UUID)
RETURNS TABLE (
    journey_id UUID,
    journey_title TEXT,
    journey_description TEXT,
    journey_order INTEGER,
    total_days INTEGER,
    completed_days INTEGER,
    is_completed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        j.id as journey_id,
        j.title as journey_title,
        j.description as journey_description,
        uj.journey_order,
        (SELECT COUNT(*) FROM public.journey_days WHERE journey_id = j.id AND is_active = true)::INTEGER as total_days,
        (SELECT COUNT(*) FROM public.user_journey_progress WHERE user_id = user_uuid AND journey_id = j.id AND completed = true)::INTEGER as completed_days,
        (uj.completed_at IS NOT NULL) as is_completed
    FROM public.user_journeys uj
    JOIN public.journeys j ON j.id = uj.journey_id
    WHERE uj.user_id = user_uuid
    AND uj.is_active = true
    AND j.is_active = true
    ORDER BY uj.journey_order, j.created_at;
END;
$$ LANGUAGE plpgsql;

-- Step 14: Create function to add tags to user
CREATE OR REPLACE FUNCTION add_user_tags(user_uuid UUID, tag_names TEXT[])
RETURNS VOID AS $$
DECLARE
    tag_name TEXT;
BEGIN
    FOREACH tag_name IN ARRAY tag_names
    LOOP
        INSERT INTO public.user_tags (user_id, tag_name)
        VALUES (user_uuid, tag_name)
        ON CONFLICT (user_id, tag_name) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 15: Create function to assign journeys to user
CREATE OR REPLACE FUNCTION assign_journeys_to_user(user_uuid UUID, journey_ids UUID[], assigned_by_uuid UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    journey_uuid UUID;
    max_order INTEGER;
BEGIN
    -- Get current max order for this user
    SELECT COALESCE(MAX(journey_order), 0) INTO max_order
    FROM public.user_journeys
    WHERE user_id = user_uuid;

    FOREACH journey_uuid IN ARRAY journey_ids
    LOOP
        max_order := max_order + 1;
        INSERT INTO public.user_journeys (user_id, journey_id, journey_order, assigned_by)
        VALUES (user_uuid, journey_uuid, max_order, assigned_by_uuid)
        ON CONFLICT (user_id, journey_id) DO UPDATE SET
            journey_order = EXCLUDED.journey_order,
            assigned_by = EXCLUDED.assigned_by,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 16: Create function to remove tags from user
CREATE OR REPLACE FUNCTION remove_user_tags(user_uuid UUID, tag_names TEXT[])
RETURNS VOID AS $$
DECLARE
    tag_name TEXT;
BEGIN
    FOREACH tag_name IN ARRAY tag_names
    LOOP
        DELETE FROM public.user_tags
        WHERE user_id = user_uuid AND tag_name = tag_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 17: Create function to remove journeys from user
CREATE OR REPLACE FUNCTION remove_journeys_from_user(user_uuid UUID, journey_ids UUID[])
RETURNS VOID AS $$
DECLARE
    journey_uuid UUID;
BEGIN
    FOREACH journey_uuid IN ARRAY journey_ids
    LOOP
        DELETE FROM public.user_journeys
        WHERE user_id = user_uuid AND journey_id = journey_uuid;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
