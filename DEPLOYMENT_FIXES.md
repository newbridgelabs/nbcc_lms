# 🔧 Deployment Fixes - Registration & Email Issues

## Issues Fixed

### ✅ **Issue 1: User not receiving confirmation email on second registration attempt**
**Problem**: When a user tries to register again after a failed first attempt, they don't receive a confirmation email.

**Solution**: Enhanced registration logic to detect existing unconfirmed users and automatically resend confirmation emails.

### ✅ **Issue 2: User restricted from re-registering after first failed attempt**
**Problem**: Users cannot attempt registration again if their first attempt failed.

**Solution**: Updated RLS policies and registration logic to allow re-registration for unconfirmed users.

### ✅ **Issue 3: Update URLs for production deployment**
**Problem**: Hardcoded localhost URLs in authentication redirects.

**Solution**: Updated all redirect URLs to use the production Vercel URL.

## 🚀 **Step-by-Step Fix Implementation**

### **Step 1: Update Supabase Configuration**

1. **Go to Supabase Dashboard → Authentication → URL Configuration**

2. **Update Site URL:**
   ```
   https://nbcc-labs-il5rcafib-newbridgelabs-projects.vercel.app
   ```

3. **Update Redirect URLs (add all these):**
   ```
   https://nbcc-labs-il5rcafib-newbridgelabs-projects.vercel.app/auth/callback
   https://nbcc-labs-il5rcafib-newbridgelabs-projects.vercel.app/auth/login
   https://nbcc-labs-il5rcafib-newbridgelabs-projects.vercel.app/dashboard
   https://nbcc-labs-il5rcafib-newbridgelabs-projects.vercel.app/sermons
   https://nbcc-labs-il5rcafib-newbridgelabs-projects.vercel.app/*
   ```

### **Step 2: Run Database Fixes**

1. **Go to Supabase Dashboard → SQL Editor**

2. **Copy and run the entire content from `sql/fix_registration_issues.sql`**

3. **Verify the functions were created successfully**

### **Step 3: Update Vercel Environment Variables**

Make sure these are set in your Vercel dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Step 4: EmailJS Configuration (Optional)**

If you're using EmailJS for additional email functionality:

1. **Go to EmailJS Dashboard**
2. **Update any templates that reference localhost**
3. **Ensure your Vercel environment variables include:**
   ```env
   NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
   NEXT_PUBLIC_EMAILJS_USER_ID=your_user_id
   ```

## 🧪 **Testing the Fixes**

### **Test Scenario 1: New User Registration**
1. Go to your live site registration page
2. Enter a valid email (that's in allowed_users)
3. Complete registration
4. Check email for confirmation link
5. Click confirmation link
6. Verify successful login

### **Test Scenario 2: Failed Registration Retry**
1. Register with a valid email
2. Don't click the confirmation link
3. Try to register again with the same email
4. Should receive message: "Confirmation email has been resent!"
5. Check email for new confirmation link
6. Click link and verify successful login

### **Test Scenario 3: Already Registered User**
1. Try to register with an email that's already confirmed
2. Should receive appropriate error message
3. Should be directed to login instead

## 🔧 **New Features Added**

### **Enhanced Registration Logic**
- Detects existing unconfirmed users
- Automatically resends confirmation emails
- Prevents duplicate registrations
- Better error messages

### **Database Functions**
- `check_user_email_status()` - Check user confirmation status
- `reset_allowed_user_status()` - Reset for re-registration
- `handle_user_registration()` - Smart registration handling
- `cleanup_failed_registration()` - Cleanup old failed attempts

### **Improved User Experience**
- Clear feedback messages
- Automatic email resend
- Proper redirect handling
- Better error handling

## 🚨 **Troubleshooting**

### **If emails still not working:**
1. Check Supabase email quota
2. Verify SMTP settings in Supabase
3. Check spam folder
4. Test with different email providers

### **If registration still fails:**
1. Check browser console for errors
2. Verify environment variables in Vercel
3. Check Supabase logs
4. Run the SQL fixes again

### **If redirects not working:**
1. Verify all URLs in Supabase settings
2. Check for typos in URLs
3. Ensure HTTPS is used
4. Clear browser cache

## 📋 **Deployment Checklist**

- ✅ **Supabase URLs updated** with production domain
- ✅ **Database fixes applied** via SQL Editor
- ✅ **Vercel environment variables** set correctly
- ✅ **Code changes committed** and deployed
- ✅ **Registration flow tested** with new user
- ✅ **Email resend tested** with failed registration
- ✅ **Authentication redirects tested**

## 🎉 **Expected Results**

After applying these fixes:

1. **New users** can register and receive confirmation emails
2. **Failed registration attempts** can be retried with automatic email resend
3. **Email confirmations** redirect to the correct production URLs
4. **Users are not blocked** from re-attempting registration
5. **Clear feedback** is provided for all registration states

## 📞 **Support**

If you encounter any issues after applying these fixes:

1. Check the browser console for JavaScript errors
2. Check Supabase logs for database errors
3. Verify all environment variables are set correctly
4. Test with different browsers and email providers

The registration and email confirmation system should now work reliably for your production deployment! 🚀
