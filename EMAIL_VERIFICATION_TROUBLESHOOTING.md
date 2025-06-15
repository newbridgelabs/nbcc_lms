# Email Verification Troubleshooting Guide

## Current Issues Identified

### Issue 1: User Not Receiving Verification Email
**Problem**: User "alen" registered but didn't receive the email verification link.

**Possible Causes**:
1. Supabase email service not properly configured
2. Email going to spam folder
3. Email service quota exceeded
4. SMTP settings incorrect

### Issue 2: Wrong User Name Displayed
**Problem**: Header shows "Madagala Prasanna Paul" instead of "alen" after registration.

**Cause**: Admin session persisted during user registration.

**Solution**: ✅ **FIXED** - Added automatic logout before registration.

## Solutions Implemented

### ✅ Fixed User Session Issue
- Added automatic logout before registration in `pages/auth/register.js`
- Enhanced auth state change listener in `components/Layout.js`
- Now properly shows the correct user after registration

### ✅ Enhanced Email Resend Functionality
- Updated `pages/auth/check-email.js` with proper resend functionality
- Uses Supabase's `resend()` method for verification emails
- Better error handling and user feedback

### ✅ Created Diagnostic Tools
- **Email Verification Diagnostics**: `/admin/email-verification-diagnostics`
- **Email Service Diagnostics**: `/admin/email-diagnostics`
- Both accessible from admin dashboard

## Email Verification Setup Steps

### 1. Check Supabase Email Configuration

**Go to Supabase Dashboard**:
1. Visit: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Authentication** → **Settings**
4. Check **Email** section

**Required Settings**:
- ✅ Enable email confirmations
- ✅ Configure SMTP settings OR use Supabase's email service
- ✅ Set correct redirect URLs

### 2. SMTP Configuration (Recommended)

**Option A: Use Gmail SMTP**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password (not regular password)
```

**Option B: Use Supabase Email Service**
- Default option, but has limitations
- May have delivery issues
- Limited quota

### 3. Verify Email Templates

**Check Email Templates**:
1. Go to **Authentication** → **Email Templates**
2. Ensure "Confirm signup" template is enabled
3. Verify redirect URL: `{{ .SiteURL }}/auth/callback`

### 4. Test Email Delivery

**Using Admin Diagnostics**:
1. Go to `/admin/email-verification-diagnostics`
2. Enter test email address
3. Click "Test Email Send"
4. Check email delivery

## Common Issues & Solutions

### Issue: Email Goes to Spam
**Solutions**:
- Configure SPF, DKIM, DMARC records
- Use a verified domain
- Use proper SMTP service (Gmail, SendGrid, etc.)

### Issue: Email Not Sent at All
**Check**:
- Supabase project quota
- SMTP credentials
- Email service status
- Network connectivity

### Issue: Verification Link Expired
**Solutions**:
- Use resend functionality
- Check token expiration settings
- Ensure proper callback URL

### Issue: Wrong User Session
**Solution**: ✅ **FIXED**
- Automatic logout before registration
- Proper session management

## Testing Procedure

### 1. Test User Registration
```bash
1. Go to /auth/register
2. Fill form with allowed email
3. Submit registration
4. Check email inbox (and spam)
5. Click verification link
6. Verify redirect to dashboard
```

### 2. Test Email Resend
```bash
1. Go to /auth/check-email
2. Click "Resend email"
3. Check for new email
4. Verify link works
```

### 3. Use Diagnostic Tools
```bash
1. Admin Dashboard → "User Registration"
2. Run diagnostics
3. Check for errors
4. Test email sending
```

## Environment Variables Check

**Required Variables**:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Files Modified

1. `pages/auth/register.js` - Added logout before registration
2. `pages/auth/check-email.js` - Enhanced resend functionality
3. `components/Layout.js` - Improved auth state management
4. `pages/admin/email-verification-diagnostics.js` - New diagnostic tool
5. `pages/admin/index.js` - Added diagnostic links

## Next Steps

### Immediate Actions:
1. **Check Supabase Email Settings**
   - Go to Supabase dashboard
   - Verify email configuration
   - Test email delivery

2. **Test Registration Flow**
   - Use diagnostic tools
   - Test with known email
   - Check spam folders

3. **Configure SMTP (if needed)**
   - Set up Gmail SMTP
   - Update Supabase settings
   - Test delivery

### If Issues Persist:
1. Check Supabase logs
2. Contact Supabase support
3. Consider alternative email services
4. Use diagnostic tools for debugging

## Support Resources

- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Email Setup Guide**: https://supabase.com/docs/guides/auth/auth-smtp
- **Troubleshooting**: https://supabase.com/docs/guides/auth/troubleshooting

The system now has comprehensive tools to diagnose and fix email verification issues. The user session problem has been resolved, and proper diagnostic tools are available to troubleshoot email delivery.
