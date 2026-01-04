# Login Fix Summary - January 4, 2026

## Problem
"You're signed out" error when trying to install Qryx from Shopify, even after logging in.

## Root Cause
The login/signup pages were configured with hard-coded redirects to `/app`, which overrode the `redirect_url` parameter needed for the Qryx installation flow.

## Fixes Applied

### 1. Login Page (app/login/[[...rest]]/page.tsx)
**Before:**
- forceRedirectUrl="/app" - Always redirected to dashboard
- fallbackRedirectUrl="/app" - Ignored redirect_url parameter

**After:**
- forceRedirectUrl={redirectUrl ? decodeURIComponent(redirectUrl) : undefined}
- fallbackRedirectUrl={redirectUrl ? decodeURIComponent(redirectUrl) : "/app"}
- Now respects redirect_url query parameter
- Reduced redirect timeout from 500ms to 100ms for faster UX

### 2. Signup Page (app/signup/[[...rest]]/page.tsx)
**Same changes as login page:**
- Dynamically sets redirect URLs based on redirect_url parameter
- Faster redirect (100ms timeout)

### 3. Middleware (middleware.ts)
**Before:**
- Automatically redirected authenticated users from /login to /app
- This broke the flow when already-logged-in users tried to install Qryx

**After:**
- Checks for redirect_url parameter before redirecting
- If redirect_url exists, lets the page handle it
- Otherwise, redirects to dashboard as before

**Also added Qryx routes to public routes:**
- /products/qryx/setup(.*)
- /api/qryx/install(.*)
- /api/qryx/callback(.*)
- /api/stripe/webhook(.*)

## How It Works Now

### Installation Flow (Complete)
1. User opens: https://www.jnxlabs.ai/api/qryx/install?shop=example.myshopify.com
2. Redirects to: /products/qryx/setup?shop=example.myshopify.com
3. Server checks if user is authenticated (via currentUser())
4. If NOT authenticated:
   - Renders EmbeddedAuthRedirect component
   - Shows "Sign In to Continue" UI
   - User clicks button
   - Redirects to: /login?redirect_url=/products/qryx/setup?shop=example.myshopify.com
   - NEW: Clerk respects the redirect_url parameter
   - After login: Redirects back to /products/qryx/setup?shop=example.myshopify.com
   - Pricing page loads with user authenticated
5. If ALREADY authenticated:
   - Directly shows pricing page
   - No login required
6. User selects plan → Payment/OAuth → Installation complete

## Testing Instructions

### Test 1: New User (Not Logged In)
Open: http://localhost:3000/api/qryx/install?shop=test-store.myshopify.com

Expected flow:
1. Redirect to /products/qryx/setup?shop=test-store.myshopify.com
2. See "Sign In to Continue" page
3. Click "Continue to Sign In"
4. Redirect to login page
5. Login with test credentials
6. Redirect back to /products/qryx/setup?shop=test-store.myshopify.com
7. See pricing page with shop name displayed

### Test 2: Already Logged In User
Make sure you're logged in, then open:
http://localhost:3000/api/qryx/install?shop=another-store.myshopify.com

Expected flow:
1. Redirect to /products/qryx/setup?shop=another-store.myshopify.com
2. DIRECTLY see pricing page (no login prompt)
3. Shop name displayed

### Test 3: Sign Up Flow
Open in incognito:
http://localhost:3000/api/qryx/install?shop=new-store.myshopify.com

Expected flow:
1. See "Sign In to Continue" page
2. Click "Sign up for free" link
3. Create new account
4. After signup: Redirect to /products/qryx/setup?shop=new-store.myshopify.com
5. See pricing page

## Files Changed
1. app/login/[[...rest]]/page.tsx - Dynamic redirect URL handling
2. app/signup/[[...rest]]/page.tsx - Dynamic redirect URL handling
3. middleware.ts - Allow redirect_url parameter, add Qryx public routes

## Next Steps
1. Test locally using instructions above
2. Build and save checkpoint
3. Deploy to Vercel
4. Test in actual Shopify Admin
5. Verify full installation flow end-to-end

Status: Ready for Testing
Updated: January 4, 2026
