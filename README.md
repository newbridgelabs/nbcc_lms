# NBCC Sermon Q&A System

An interactive sermon Q&A system designed for churches to engage their congregation during and after sermons. Built with Next.js and Supabase for real-time interaction and seamless user experience.

## Features

### 👥 **User Features**
- 🎯 **Interactive Sermon Experience** - Step-by-step questions during sermons
- 📝 **Private Notes** - Personal reflections and notes (first 5 questions)
- ❓ **Public Q&A** - Submit questions for the pastor to answer
- 📊 **Progress Tracking** - Visual progress through sermon questions
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🔐 **Secure Authentication** - Email/password and social login

### 🔧 **Admin Features**
- ⚙️ **Sermon Management** - Create, edit, and manage sermons
- ❓ **Question Builder** - Add private note prompts and public Q&A sections
- 📊 **Admin Dashboard** - View participation statistics
- 💬 **Q&A Management** - Review and respond to public questions
- 👥 **User Management** - Admin access control

## Technology Stack

- **Frontend**: Next.js 13, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Lucide React Icons, React Hot Toast
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
   - Copy and run the complete SQL from `sql/complete_sermon_setup.sql`
   - This will create all required tables and policies for the sermon system

5. **Set up Admin User**
   After running the SQL setup, make yourself an admin:
   ```sql
   UPDATE users
   SET is_admin = true, role = 'admin'
   WHERE email = 'your-email@domain.com';
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

### For Pastors/Admins

1. **Create Sermons**
   - Login to the admin dashboard at `/admin/sermons`
   - Create a new sermon with title, date, and scripture reference
   - Add questions for congregation interaction

2. **Manage Questions**
   - Set questions as "Private Notes" (personal reflection)
   - Set questions as "Public Q&A" (questions for pastor)
   - Reorder and edit questions as needed

3. **Review Q&A**
   - View submitted public questions anonymously
   - Respond to questions for next week's session

### For Congregation Members

1. **Join Sermon**
   - Login and select the current sermon
   - Work through private reflection questions
   - Take personal notes that only you can see

2. **Ask Questions**
   - Submit questions for the pastor in the public Q&A section
   - Questions are submitted anonymously
   - View responses in future sessions

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
