# Quick Fix Instructions

## Issue
The allowed_users table doesn't exist yet, causing errors in the admin panel.

## Quick Solution (2 options)

### Option 1: Run SQL in Supabase (Recommended)
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste this SQL:

```sql
-- Create allowed_users table for selective registration
  CREATE TABLE IF NOT EXISTS public.allowed_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    invited_by UUID REFERENCES public.users(id),
    is_used BOOLEAN DEFAULT FALSE,
    temp_password TEXT,
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    registered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Enable Row Level Security
  ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_allowed_users_email ON public.allowed_users(email);
  CREATE INDEX IF NOT EXISTS idx_allowed_users_is_used ON public.allowed_users(is_used);

  -- Simple RLS policies - allow all authenticated users
  CREATE POLICY "Allow authenticated users to view allowed users" ON public.allowed_users
    FOR SELECT TO authenticated USING (true);

  CREATE POLICY "Allow authenticated users to insert allowed users" ON public.allowed_users
    FOR INSERT TO authenticated WITH CHECK (true);

  CREATE POLICY "Allow authenticated users to update allowed users" ON public.allowed_users
    FOR UPDATE TO authenticated USING (true);

  CREATE POLICY "Allow authenticated users to delete allowed users" ON public.allowed_users
    FOR DELETE TO authenticated USING (true);

  -- Insert a test record
  INSERT INTO public.allowed_users (email, full_name, temp_password) 
  VALUES ('test@example.com', 'Test User', 'temp123')
  ON CONFLICT (email) DO NOTHING;
  ```

4. Click "Run"
5. Go back to the admin panel and try "Allowed Users" again

### Option 2: Temporarily Disable Selective Registration
If you want to test the email functionality first without setting up the allowed users table:

1. Open `lib/auth.js`
2. Comment out the allowed users check (lines 9-16)
3. This will allow anyone to register temporarily while you test emails

## Testing Email Functionality

Once the table is created or registration is temporarily opened:

1. **Setup EmailJS** (if not done already):
   - Go to https://www.emailjs.com/
   - Create account and email service
   - Create template with variables: `{{to_email}}`, `{{to_name}}`, `{{subject}}`, `{{message}}`, `{{pdf_url}}`
   - Update `.env.local` with your EmailJS credentials

2. **Test the flow**:
   - Add a user to allowed users (or register directly if disabled check)
   - Complete membership process
   - Approve agreement as admin
   - Check if emails are sent

## Current Status
- ✅ Email service implemented with EmailJS
- ✅ Selective registration logic implemented
- ❌ Database table not created yet
- ❌ EmailJS not configured yet

## Next Steps
1. Create the database table (Option 1 above)
2. Configure EmailJS
3. Test the complete flow
4. Add real users to the allowed list
