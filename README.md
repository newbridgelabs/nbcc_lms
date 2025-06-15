# Church LMS - Learning Management System

A comprehensive Learning Management System designed for church membership processes. This application allows new members to study church materials, track their progress, and complete a digital membership agreement.

## Features

- 🔐 **Secure Authentication** - Google OAuth and email/password registration
- 📚 **PDF Section Management** - Automatically splits PDFs into manageable sections
- 📊 **Progress Tracking** - Visual progress indicators and completion tracking
- ✍️ **Digital Signatures** - Canvas-based signature capture for agreements
- 📧 **Email Integration** - Automated email delivery of completed agreements
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🎨 **Modern UI** - Clean, professional design with Tailwind CSS

## Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **PDF Processing**: PDF-lib, React-PDF
- **Signatures**: Signature Pad
- **Email**: EmailJS
- **Deployment**: Vercel (Free tier)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available)
- A Vercel account for deployment (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd church-lms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Go to Settings > API to get your project URL and anon key
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials to `.env.local`

4. **Configure Supabase Database**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the following SQL to create the required tables:

   ```sql
   -- Enable RLS (Row Level Security)
   ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

   -- Create users table
   CREATE TABLE public.users (
     id UUID REFERENCES auth.users ON DELETE CASCADE,
     email TEXT UNIQUE NOT NULL,
     full_name TEXT,
     username TEXT UNIQUE,
     is_verified BOOLEAN DEFAULT FALSE,
     verification_code TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     PRIMARY KEY (id)
   );

   -- Create PDF sections table
   CREATE TABLE public.pdf_sections (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
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

   -- Create storage bucket for PDF sections
   INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-sections', 'pdf-sections', true);

   -- Set up RLS policies
   CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

   CREATE POLICY "Anyone can view PDF sections" ON public.pdf_sections FOR SELECT TO authenticated;

   CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can update own progress" ON public.user_progress FOR ALL USING (auth.uid() = user_id);

   CREATE POLICY "Users can view own agreements" ON public.agreements FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can create own agreements" ON public.agreements FOR INSERT WITH CHECK (auth.uid() = user_id);
   ```

5. **Configure Google OAuth (Optional)**
   - In Supabase dashboard, go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### For Church Administrators

1. **Upload Study Materials**
   - Prepare a PDF document (up to 30 pages recommended)
   - The system will automatically split it into 5 sections
   - Upload through the admin interface (to be implemented)

2. **Monitor Progress**
   - View member progress through the dashboard
   - Track completion rates and engagement

### For Church Members

1. **Register and Verify**
   - Create an account with email verification
   - Or sign in with Google

2. **Study Materials**
   - Progress through 5 sections of study materials
   - Each section must be completed before proceeding to the next

3. **Complete Agreement**
   - Fill out the membership agreement form
   - Provide digital signature
   - Receive PDF copy via email

## Deployment

### Deploy to Vercel (Free)

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Set Environment Variables**
   - In Vercel dashboard, go to your project settings
   - Add the same environment variables from `.env.local`

3. **Deploy**
   - Push to your Git repository
   - Vercel will automatically deploy on every push

### Custom Domain (Optional)

- Purchase a domain ($10-15/year)
- Configure in Vercel dashboard
- Update Supabase redirect URLs

## Cost Breakdown

- **Development**: Free
- **Hosting**: Free (Vercel)
- **Database**: Free (Supabase)
- **Authentication**: Free (Supabase)
- **Storage**: Free (Supabase - 1GB)
- **Email**: Free (EmailJS - 200 emails/month)
- **Custom Domain**: $10-15/year (optional)

**Total Monthly Cost: $0** (plus optional domain)

## Support

For technical support or questions about the church LMS system, please contact the development team.

## License

This project is developed specifically for church use and is not intended for commercial distribution.
