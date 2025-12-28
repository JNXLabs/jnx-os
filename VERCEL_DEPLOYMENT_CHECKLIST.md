# Vercel Deployment Checklist for JNX-OS

## 🚨 Critical: This checklist must be completed for the production deployment to work

---

## 1. Environment Variables in Vercel

### Required Variables

You need to add the following environment variables in your Vercel project settings:

#### **Clerk Authentication**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
```

#### **Supabase Database** (CRITICAL - Missing causes 500 errors!)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### **Qryx - Gemini AI**
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

#### **Qryx - Shopify Integration**
```bash
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_SCOPES=read_products,read_product_listings,read_customers,read_orders
SHOPIFY_APP_URL=https://your-vercel-app.vercel.app
SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret_here
```

### How to Add Variables in Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable with:
   - **Key**: Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Your actual value
   - **Environments**: Check all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your application after adding all variables

---

## 2. Supabase Database Schema

### Required Tables for Qryx

The Qryx feature requires additional database tables. Run this SQL in your Supabase SQL Editor:

**File to execute:** `MIGRATION_QRYX_SHOPIFY.sql`

#### Quick Steps:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `MIGRATION_QRYX_SHOPIFY.sql` from the project root
5. Paste and click **Run**
6. Verify tables were created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'qryx_%' OR table_name LIKE 'shopify_%';
   ```

#### Expected Tables:
- `shopify_shops` - Stores Shopify store installations
- `qryx_chat_sessions` - Tracks chat conversations
- `qryx_messages` - Stores individual chat messages (GDPR-compliant)
- `qryx_configs` - Widget and AI configuration per shop
- `qryx_usage_logs` - Tracks API usage for billing
- `shopify_products_cache` - Cached product data for AI context

---

## 3. Shopify App Configuration

### Update Redirect URLs

After deploying to Vercel, update your Shopify Partner Dashboard:

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com/)
2. Select your app
3. Navigate to **App Setup** → **URLs**
4. Update:
   - **App URL**: `https://your-vercel-app.vercel.app/api/qryx/auth`
   - **Allowed redirection URL(s)**:
     ```
     https://your-vercel-app.vercel.app/api/qryx/callback
     ```
5. Update **API access scopes**:
   ```
   read_products,read_product_listings,read_customers,read_orders
   ```
   ⚠️ **Important**: Use commas, NO spaces between scopes!

---

## 4. Verification Steps

### After Deployment, Test:

#### ✅ **Basic Auth Flow**
1. Visit `https://your-vercel-app.vercel.app/signup`
2. Create a new account
3. Verify redirect to `/app` dashboard
4. Check user appears in Supabase `users` table

#### ✅ **Qryx Dashboard Access**
1. Login to your app
2. Navigate to `/app/products`
3. Click "Open Dashboard" on Qryx card
4. Should see:
   - "Qryx Not Installed" page (if no Shopify shop connected)
   - OR "Configuration Error" (if Supabase credentials are missing)
   - OR Qryx Dashboard (if shop is installed)

#### ✅ **Shopify Installation Flow**
1. From "Qryx Not Installed" page, click "Install Qryx on Shopify"
2. Should redirect to Shopify OAuth
3. After authorization, should redirect back to Qryx dashboard
4. Verify shop appears in `shopify_shops` table

---

## 5. Common Issues & Solutions

### ❌ "Application error: a server-side exception has occurred"

**Cause**: Missing Supabase environment variables in Vercel

**Solution**:
1. Add all Supabase variables to Vercel (see Section 1)
2. Redeploy the application
3. Clear browser cache and retry

---

### ❌ "Configuration Error" on Qryx Dashboard

**Possible Causes**:
1. Supabase credentials not set in Vercel
2. `shopify_shops` table doesn't exist (run MIGRATION_QRYX_SHOPIFY.sql)
3. Network issue connecting to Supabase

**Solution**:
1. Check Vercel Environment Variables
2. Verify Supabase tables exist
3. Check Vercel function logs for detailed error

---

### ❌ Shopify OAuth Error: "Invalid redirect_uri"

**Cause**: Redirect URL mismatch in Shopify Partner Dashboard

**Solution**:
1. Update Shopify App URLs (see Section 3)
2. Ensure `SHOPIFY_APP_URL` in Vercel matches your deployed URL
3. NO trailing slashes in URLs

---

### ❌ Widget not loading on Shopify store

**Cause**: Script tag not installed or incorrect widget endpoint

**Solution**:
1. Check `shopify_shops` table - verify `installed_at` is set
2. Visit Shopify Admin → Online Store → Themes → Actions → Edit Code
3. Check if script tag exists in theme files
4. Manually verify widget endpoint: `https://your-vercel-app.vercel.app/api/widget/qryx?shop_id=YOUR_SHOP_ID`

---

## 6. Monitoring & Logs

### Vercel Function Logs
- Go to Vercel Dashboard → Your Project → **Logs**
- Filter by route: `/api/qryx/*`
- Look for errors or exceptions

### Supabase Logs
- Go to Supabase Dashboard → **Logs**
- Check for connection errors or query failures

### Clerk Logs
- Go to Clerk Dashboard → **Logs**
- Verify webhooks are firing correctly
- Check for authentication issues

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Main website loads at `https://your-vercel-app.vercel.app`
2. ✅ Login/Signup works without errors
3. ✅ Dashboard loads at `/app`
4. ✅ Products page loads at `/app/products`
5. ✅ Qryx dashboard shows "Not Installed" or dashboard (not Configuration Error)
6. ✅ Shopify OAuth flow completes successfully
7. ✅ Widget loads on Shopify store frontend

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Vercel Function Logs** first
2. **Verify all environment variables** are set
3. **Run database migrations** in Supabase
4. **Clear browser cache** and retry
5. **Check this checklist** for missed steps

---

**Last Updated**: December 28, 2024
**JNX-OS Version**: v2 (Qryx Phase 4)
