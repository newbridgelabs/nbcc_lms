# Google OAuth Setup Guide

To fix the "redirect_URI_mismatch" error and enable Google Sign-In, follow these steps:

## 1. Google Cloud Console Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select Project**: Create a new project or select an existing one
3. **Enable Google+ API**: 
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

## 2. Create OAuth 2.0 Credentials

1. **Go to Credentials**: APIs & Services > Credentials
2. **Create Credentials**: Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. **Configure OAuth Consent Screen** (if not done):
   - Choose "External" for user type
   - Fill in required fields:
     - App name: "NBCC LMS"
     - User support email: your email
     - Developer contact: your email
   - Add scopes: email, profile, openid
   - Add test users if needed

## 3. Configure OAuth Client

1. **Application Type**: Web application
2. **Name**: NBCC LMS Web Client
3. **Authorized JavaScript Origins**:
   ```
   http://localhost:3000
   https://your-domain.com (for production)
   ```
4. **Authorized Redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback (for production)
   ```

## 4. Update Supabase Configuration

1. **Go to Supabase Dashboard**: https://app.supabase.com/
2. **Navigate to Authentication**: Project > Authentication > Providers
3. **Configure Google Provider**:
   - Enable Google provider
   - Add your Google Client ID
   - Add your Google Client Secret
   - Set Redirect URL to: `https://your-supabase-project.supabase.co/auth/v1/callback`

## 5. Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 6. Update Site URL in Supabase

1. **Go to Supabase Dashboard**: Project Settings > API
2. **Update Site URL**:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

## 7. Test the Configuration

1. **Clear browser cache** and cookies
2. **Restart your development server**: `npm run dev`
3. **Try Google Sign-In** from the login page

## Common Issues and Solutions

### "redirect_URI_mismatch" Error
- **Cause**: The redirect URI in your Google OAuth configuration doesn't match the one being used
- **Solution**: Ensure the redirect URI in Google Console exactly matches: `http://localhost:3000/auth/callback`

### "Access blocked" Error
- **Cause**: OAuth consent screen not properly configured
- **Solution**: Complete the OAuth consent screen setup and add your email as a test user

### "Invalid client" Error
- **Cause**: Wrong client ID or secret
- **Solution**: Double-check your environment variables and Supabase configuration

## Production Deployment

When deploying to production:

1. **Update Google OAuth Configuration**:
   - Add your production domain to authorized origins
   - Add your production callback URL to authorized redirect URIs

2. **Update Supabase Configuration**:
   - Update site URL to your production domain
   - Update redirect URLs in Google provider settings

3. **Environment Variables**:
   - Set production environment variables in your hosting platform
   - Use the same Google Client ID and Secret

## Security Notes

- **Never commit** your Google Client Secret to version control
- **Use environment variables** for all sensitive configuration
- **Regularly rotate** your OAuth credentials
- **Monitor** OAuth usage in Google Cloud Console

## Testing Checklist

- [ ] Google OAuth credentials created
- [ ] Authorized origins and redirect URIs configured
- [ ] Supabase Google provider enabled and configured
- [ ] Environment variables set correctly
- [ ] Site URL updated in Supabase
- [ ] OAuth consent screen configured
- [ ] Test users added (if using external user type)
- [ ] Google Sign-In button works without errors
- [ ] User can successfully sign in and access dashboard
