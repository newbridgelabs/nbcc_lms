# 🚀 Deployment Guide - NBCC Sermon Q&A System

## Quick Deploy to Vercel (Free)

### Step 1: Prepare Your Repository

1. **Commit all changes to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/login with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your NBCC sermon repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Step 3: Set Environment Variables

In the Vercel deployment screen, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Where to find these values:**
1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys > anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys > service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Your app will be live at `https://your-project-name.vercel.app`

### Step 5: Configure Supabase Redirect URLs

1. **Go to Supabase Dashboard**
2. **Navigate to Authentication > URL Configuration**
3. **Add your Vercel URL to:**
   - Site URL: `https://your-project-name.vercel.app`
   - Redirect URLs: `https://your-project-name.vercel.app/auth/callback`

### Step 6: Test Your Deployment

1. **Visit your live app**
2. **Test user registration/login**
3. **Test admin functions**
4. **Create a test sermon**
5. **Test user sermon interaction**

## Custom Domain (Optional)

### Option 1: Free Vercel Subdomain
- Your app is automatically available at `https://your-project-name.vercel.app`
- No additional cost

### Option 2: Custom Domain ($10-15/year)
1. **Purchase a domain** (GoDaddy, Namecheap, etc.)
2. **In Vercel Dashboard:**
   - Go to your project settings
   - Click "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions
3. **Update Supabase URLs** to use your custom domain

## Automatic Deployments

Once connected to GitHub:
- ✅ **Every push to main branch** triggers automatic deployment
- ✅ **Preview deployments** for pull requests
- ✅ **Rollback capability** if issues arise

## Environment Management

### Production Environment Variables
Set these in Vercel dashboard under Project Settings > Environment Variables:

```env
# Required for production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Analytics, monitoring, etc.
VERCEL_ANALYTICS_ID=your_analytics_id
```

### Development vs Production
- **Development**: Uses `.env.local`
- **Production**: Uses Vercel environment variables
- **Never commit** `.env.local` to Git

## Monitoring & Maintenance

### Vercel Dashboard Features
- **Analytics**: Page views, performance metrics
- **Functions**: API route performance
- **Deployments**: Build logs and history
- **Domains**: SSL certificates and DNS

### Supabase Dashboard Features
- **Database**: Query performance, storage usage
- **Auth**: User management, login analytics
- **API**: Request logs and rate limits

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify environment variables are set

2. **Authentication Not Working**
   - Check Supabase redirect URLs
   - Verify environment variables
   - Check browser console for errors

3. **Database Connection Issues**
   - Verify Supabase credentials
   - Check RLS policies are set up correctly
   - Ensure service role key has proper permissions

4. **API Routes Failing**
   - Check Vercel function logs
   - Verify authentication headers
   - Test API endpoints individually

### Getting Help

1. **Vercel Support**: [vercel.com/support](https://vercel.com/support)
2. **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
3. **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

## Cost Breakdown

### Free Tier Limits
- **Vercel**: 100GB bandwidth, 100 deployments/month
- **Supabase**: 500MB database, 2GB bandwidth, 50,000 monthly active users
- **Total Cost**: $0/month

### If You Exceed Free Limits
- **Vercel Pro**: $20/month (unlikely to need)
- **Supabase Pro**: $25/month (unlikely to need)
- **Custom Domain**: $10-15/year (optional)

## Security Checklist

- ✅ Environment variables set in Vercel (not in code)
- ✅ Supabase RLS policies enabled
- ✅ HTTPS enabled (automatic with Vercel)
- ✅ Admin access properly configured
- ✅ User data properly protected

---

🎉 **Your NBCC Sermon Q&A System is now live and ready for your congregation!**
