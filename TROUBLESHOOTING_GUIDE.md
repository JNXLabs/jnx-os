# Troubleshooting Guide - JNX-OS v2 + Qryx

## Quick Diagnosis

**Is something broken?** Start here:

1. **Installation failing?** → [Shop Session Issues](#shop-session-issues)
2. **Payment not working?** → [Stripe Checkout Errors](#stripe-checkout-errors)
3. **Webhook not firing?** → [Webhook Issues](#webhook-issues)
4. **OAuth failing?** → [Shopify OAuth Errors](#shopify-oauth-errors)
5. **Dashboard not loading?** → [Dashboard Issues](#dashboard-issues)
6. **Chat not responding?** → [Qryx Chat Errors](#qryx-chat-errors)
7. **Auth problems?** → [Clerk Authentication Issues](#clerk-authentication-issues)

---

## Table of Contents

1. [Shop Session Issues](#shop-session-issues)
2. [Stripe Checkout Errors](#stripe-checkout-errors)
3. [Webhook Issues](#webhook-issues)
4. [Shopify OAuth Errors](#shopify-oauth-errors)
5. [Dashboard Issues](#dashboard-issues)
6. [Qryx Chat Errors](#qryx-chat-errors)
7. [Clerk Authentication Issues](#clerk-authentication-issues)
8. [Database Errors](#database-errors)
9. [Deployment Issues](#deployment-issues)
10. [Performance Problems](#performance-problems)

---

## Shop Session Issues

### Problem 1: "Shop session expired. Please restart installation."

**Symptoms:**
- Error message shown after login
- Cannot proceed to plan selection
- Shop session cookie missing or invalid

**Causes:**
1. Session expired (30-minute timeout)
2. Cookie deleted or cleared
3. SESSION_SECRET changed (invalidated all sessions)
4. Browser blocking cookies (privacy settings)

**Solutions:**

#### Solution 1: Restart Installation

```
1. Navigate to: https://www.jnxlabs.ai/api/qryx/install?shop=YOUR_SHOP.myshopify.com
2. Complete login/signup within 30 minutes
3. Select plan immediately after authentication
```

#### Solution 2: Check SESSION_SECRET

```bash
# Verify SESSION_SECRET exists in .env
cat /home/ubuntu/jnx-os/nextjs_space/.env | grep SESSION_SECRET

# Should output:
# SESSION_SECRET=d1mNLG5+tZxSFOmVB+i2MhgLIie3/IPsQNqJylHxETw=

# If missing, generate new one:
openssl rand -base64 32

# Add to .env:
echo "SESSION_SECRET=<generated_secret>" >> .env
```

#### Solution 3: Check Cookie Settings

**DevTools → Application → Cookies:**

```javascript
// Shop session cookie should exist:
// Name: shop_session
// Value: eyJhbGc... (JWT token)
// HttpOnly: true
// Secure: true
// SameSite: Lax
// Max-Age: 1800 (30 minutes)

// If missing, check browser console for errors:
// - "Cookie blocked by browser"
// - "Third-party cookies disabled"
```

**Fix browser settings:**
- Chrome: Settings → Privacy → Allow all cookies (for testing)
- Firefox: Settings → Privacy → Custom → Accept cookies
- Safari: Preferences → Privacy → Uncheck "Block all cookies"

#### Solution 4: Check Server Logs

```bash
# Development
cd /home/ubuntu/jnx-os/nextjs_space
yarn dev

# Look for:
# ✅ [API] /api/qryx/install - Shop session created
# ❌ [ERROR] Failed to encrypt shop session

# Production (Vercel)
vercel logs www.jnxlabs.ai --follow

# Look for:
# ✅ POST /api/qryx/install 302
# ❌ POST /api/qryx/install 500 - JWT encryption failed
```

---

### Problem 2: "Invalid shop parameter"

**Symptoms:**
- Error on installation URL
- Immediate rejection before redirect

**Causes:**
1. Shop parameter missing from URL
2. Invalid shop domain format
3. Shop domain contains special characters

**Solutions:**

#### Solution 1: Verify URL Format

**✅ Correct:**
```
https://www.jnxlabs.ai/api/qryx/install?shop=shopbotv3.myshopify.com
```

**❌ Incorrect:**
```
https://www.jnxlabs.ai/api/qryx/install
https://www.jnxlabs.ai/api/qryx/install?shop=shopbotv3
https://www.jnxlabs.ai/api/qryx/install?shop=https://shopbotv3.myshopify.com
```

#### Solution 2: Validate Shop Domain

**Valid formats:**
- `shopname.myshopify.com`
- `custom-domain.com` (if custom domain configured in Shopify)

**Invalid formats:**
- URLs (https://...)
- Partial domains (shopname)
- Special characters (!@#$%)

---

## Stripe Checkout Errors

### Problem 3: "Failed to create checkout session"

**Symptoms:**
- Error when clicking "Get Started" on plan
- No redirect to Stripe Checkout
- Console error: 500 Internal Server Error

**Causes:**
1. Missing or invalid Stripe API keys
2. Incorrect Price IDs
3. Shop session expired
4. Clerk authentication failed

**Solutions:**

#### Solution 1: Verify Stripe API Keys

```bash
# Check .env file
cat /home/ubuntu/jnx-os/nextjs_space/.env | grep STRIPE

# Should show:
# STRIPE_SECRET_KEY=sk_live_51SexRf...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SexRf...
# STRIPE_WEBHOOK_SECRET=whsec_iiZ...
# STRIPE_PRICE_STARTER=price_1Sjk...
# STRIPE_PRICE_PROFESSIONAL=price_1Sjk...
# STRIPE_PRICE_ENTERPRISE=price_1Sjk...
```

**Test Stripe keys:**

```bash
# Using Stripe CLI
stripe customers list --api-key sk_live_51SexRf...

# Should return list of customers (or empty list)
# If error: "Invalid API key provided"
```

#### Solution 2: Verify Price IDs in Stripe Dashboard

1. Go to **Stripe Dashboard → Products**
2. Find "Qryx - AI Sales Assistant"
3. Click on product
4. Verify 3 prices exist:
   - Qryx Starter: `price_1SjkKKBQ5QFS35pBxGKE0r5O`
   - Qryx Professional: `price_1SjkQTBQ5QFS35pBpWkdi5ws`
   - Qryx Business: `price_1SjkR4BQ5QFS35pBkhTJsxk2`
5. Copy exact Price IDs to .env
6. Redeploy (Vercel) or restart dev server

#### Solution 3: Check Server Logs

```bash
# Look for specific error
vercel logs www.jnxlabs.ai --follow

# Common errors:
# "No such price: 'price_abc123'" → Wrong Price ID
# "Invalid API Key provided" → Wrong secret key
# "Shop session not found" → Session expired, restart installation
# "User not authenticated" → Clerk token invalid
```

#### Solution 4: Test API Directly

```bash
# Get Clerk token from browser
# DevTools → Application → Local Storage → clerk_session

curl -X POST https://www.jnxlabs.ai/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk_token>" \
  -d '{
    "planId": "starter",
    "shop": "shopbotv3.myshopify.com"
  }'

# Expected response:
# {"sessionId": "cs_test_...", "url": "https://checkout.stripe.com/..."}

# Error response:
# {"error": "...", "code": "..."}
```

---

### Problem 4: "Payment declined"

**Symptoms:**
- Stripe shows "Your card was declined"
- Payment doesn't complete
- User stuck on checkout page

**Causes:**
1. Test card used in Live Mode (or vice versa)
2. Real card declined (insufficient funds, fraud detection)
3. Card details incorrect

**Solutions:**

#### Solution 1: Verify Test Mode

**Development/Testing:**
- Use Test API keys (sk_test_..., pk_test_...)
- Use test cards:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - 3D Secure: `4000 0027 6000 3184`

**Production:**
- Use Live API keys (sk_live_..., pk_live_...)
- Use real payment cards

#### Solution 2: Check Card Details

- Card number valid (Luhn algorithm check)
- Expiry date in future
- CVC is 3-4 digits
- ZIP code matches billing address

#### Solution 3: Try Different Card

- Use different card number
- Use different card type (Visa → Mastercard)
- Contact bank if real card consistently declines

---

## Webhook Issues

### Problem 5: "Webhook not firing after payment"

**Symptoms:**
- Payment succeeds in Stripe
- No database record created
- User stuck after payment
- OAuth not initiated

**Causes:**
1. Webhook endpoint not configured
2. Webhook secret incorrect
3. Webhook signature verification failing
4. Server error in webhook handler

**Solutions:**

#### Solution 1: Verify Webhook Configuration

**In Stripe Dashboard:**

1. Go to **Developers → Webhooks**
2. Find endpoint: `https://www.jnxlabs.ai/api/stripe/webhook`
3. Status should be "Enabled" (not "Disabled")
4. Check **Recent deliveries** tab:
   - Green checkmarks = Success (200 OK)
   - Red X = Failed (400/500 error)
5. Click failed delivery → See error details

**If endpoint missing:**

1. Click **Add endpoint**
2. URL: `https://www.jnxlabs.ai/api/stripe/webhook`
3. Select events:
   - ✅ checkout.session.completed
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ invoice.payment_succeeded
   - ✅ invoice.payment_failed
4. Click **Add endpoint**
5. Copy **Signing secret** (whsec_...)
6. Add to .env: `STRIPE_WEBHOOK_SECRET=whsec_...`

#### Solution 2: Verify Webhook Secret

```bash
# Check .env
cat /home/ubuntu/jnx-os/nextjs_space/.env | grep STRIPE_WEBHOOK_SECRET

# Should match Stripe Dashboard secret
# whsec_iiZIS4zHkV3SCdYi57DLty8zD0WtF1jW
```

**If secret incorrect:**

1. Get correct secret from Stripe Dashboard
2. Update .env file
3. Redeploy (Vercel) or restart dev server
4. Test webhook using "Send test webhook" in Stripe Dashboard

#### Solution 3: Check Webhook Handler Logs

```bash
# Vercel logs
vercel logs www.jnxlabs.ai --follow

# Look for:
# ✅ POST /api/stripe/webhook 200 - Webhook processed
# ❌ POST /api/stripe/webhook 400 - Invalid signature
# ❌ POST /api/stripe/webhook 500 - Server error

# Common errors:
# "No signatures found matching the expected signature for payload"
#   → Wrong webhook secret
# "Error inserting subscription: duplicate key value"
#   → Subscription already exists (webhook retry)
# "User not found"
#   → Clerk webhook hasn't synced user yet
```

#### Solution 4: Manually Retry Webhook

1. Go to **Developers → Webhooks → Your Endpoint**
2. Click **Recent deliveries**
3. Find failed event
4. Click **...** → **Resend**
5. Check if succeeds

#### Solution 5: Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In another terminal, trigger test event
stripe trigger checkout.session.completed

# Check local server logs
```

---

### Problem 6: "Duplicate subscription created"

**Symptoms:**
- Multiple database records for same subscription
- Webhook fired multiple times

**Causes:**
1. Webhook retries after temporary failure
2. No idempotency check in webhook handler

**Solutions:**

#### Solution 1: Check Database for Duplicates

```sql
-- Find duplicate subscriptions
SELECT 
  stripe_subscription_id,
  COUNT(*) as count
FROM billing_subscriptions
GROUP BY stripe_subscription_id
HAVING COUNT(*) > 1;
```

**If duplicates exist:**

```sql
-- Keep only the oldest record
DELETE FROM billing_subscriptions
WHERE id NOT IN (
  SELECT MIN(id)
  FROM billing_subscriptions
  GROUP BY stripe_subscription_id
);
```

#### Solution 2: Verify Unique Constraint

```sql
-- Check constraint exists
SELECT conname
FROM pg_constraint
WHERE conrelid = 'billing_subscriptions'::regclass
  AND conname LIKE '%stripe_subscription_id%';

-- If missing, add it:
ALTER TABLE billing_subscriptions
ADD CONSTRAINT billing_subscriptions_stripe_subscription_id_key
UNIQUE (stripe_subscription_id);
```

---

## Shopify OAuth Errors

### Problem 7: "OAuth callback failed"

**Symptoms:**
- Error after clicking "Install App" in Shopify
- Redirect fails
- 404 or 500 error on callback URL

**Causes:**
1. Redirect URI mismatch in Shopify Partner Dashboard
2. Invalid HMAC signature
3. Missing OAuth scopes
4. No active subscription (payment not completed)

**Solutions:**

#### Solution 1: Verify Redirect URI

**Shopify Partner Dashboard:**

1. Go to **Apps → Your App**
2. Click **Configuration**
3. Verify **App URL**: `https://www.jnxlabs.ai`
4. Verify **Allowed redirection URL(s)**:
   ```
   https://www.jnxlabs.ai/api/qryx/callback
   ```
5. Must match EXACTLY (no trailing slash, correct domain)

#### Solution 2: Check HMAC Verification

**Server logs should show:**

```
✅ [OAuth] HMAC verified for shop: shopbotv3.myshopify.com
✅ [OAuth] Access token retrieved
✅ [OAuth] Shop record created
```

**If HMAC fails:**

```bash
# Verify Shopify API credentials
cat /home/ubuntu/jnx-os/nextjs_space/.env | grep SHOPIFY

# Should show:
# SHOPIFY_API_KEY=...
# SHOPIFY_API_SECRET=...

# Get correct values from Shopify Partner Dashboard:
# Apps → Your App → Client credentials
```

#### Solution 3: Verify Payment Completed

**OAuth callback checks for active subscription:**

```sql
-- Check subscription exists
SELECT * FROM billing_subscriptions
WHERE shop_domain = 'shopbotv3.myshopify.com'
  AND status = 'active'
ORDER BY created_at DESC
LIMIT 1;

-- If no record:
-- → Payment didn't complete
-- → Webhook didn't fire
-- → See "Webhook Issues" section
```

---

### Problem 8: "Access token not working"

**Symptoms:**
- OAuth completes but API calls fail
- "401 Unauthorized" from Shopify API
- Products not loading

**Causes:**
1. Access token expired (rare, tokens are long-lived)
2. Access token not stored correctly
3. Scopes insufficient for API calls

**Solutions:**

#### Solution 1: Check Token Storage

```sql
-- Verify token exists
SELECT 
  shop_domain,
  LENGTH(access_token) as token_length,
  scope,
  status
FROM qryx_shops
WHERE shop_domain = 'shopbotv3.myshopify.com';

-- Token should be:
-- - Non-empty
-- - ~50+ characters (encrypted)
-- - Status: 'active'
```

#### Solution 2: Verify Scopes

**Required scopes:**
- `read_products` - Product data for chat
- `read_customers` - Customer info (optional)
- `read_orders` - Order history (optional)

**In Shopify Partner Dashboard:**

1. Go to **Apps → Your App → Configuration**
2. Scroll to **API access scopes**
3. Verify scopes checked
4. If changed, users must reinstall app

#### Solution 3: Test API Call

```bash
# Get access token from database
TOKEN="shpat_abc123..."
SHOP="shopbotv3.myshopify.com"

# Test Shopify API
curl -X GET "https://${SHOP}/admin/api/2024-01/products.json" \
  -H "X-Shopify-Access-Token: ${TOKEN}"

# Expected: JSON response with products
# Error: {"errors": "[API] Invalid API key or access token"}
```

---

## Dashboard Issues

### Problem 9: "Dashboard stuck on loading"

**Symptoms:**
- Spinner shows indefinitely
- "Setting up your account..." message
- Never redirects to dashboard

**Causes:**
1. Clerk webhook delayed (user not synced to database)
2. Database connection issue
3. User deleted (soft delete)

**Solutions:**

#### Solution 1: Check User Exists in Database

```sql
-- Check user synced from Clerk
SELECT * FROM users
WHERE clerk_user_id = 'user_abc123'  -- Replace with actual Clerk user ID
  AND deleted_at IS NULL;

-- If no result:
-- → Clerk webhook hasn't fired yet (wait 5-10 seconds)
-- → Webhook failed (check Clerk Dashboard)
```

**Get Clerk user ID:**

```javascript
// In browser console
const { userId } = clerk;
console.log(userId); // "user_abc123"
```

#### Solution 2: Check Clerk Webhook

**Clerk Dashboard:**

1. Go to **Webhooks**
2. Find endpoint: `https://www.jnxlabs.ai/api/webhooks/clerk`
3. Check **Message log**:
   - Green checkmarks = Success
   - Red X = Failed
4. Click failed message → See error details

**Common errors:**
- "Network timeout" → Vercel function timeout (increase limit)
- "500 Internal Server Error" → Check database connection
- "Duplicate key value" → User already exists (retry is safe)

#### Solution 3: Manual User Creation (Emergency)

**⚠️ Use only if webhook consistently fails:**

```sql
-- Create org first
INSERT INTO orgs (name, slug)
VALUES ('User Org', 'user-org-abc123')
RETURNING id;

-- Use returned org ID
INSERT INTO users (clerk_user_id, org_id, email, first_name, last_name, role)
VALUES (
  'user_abc123',  -- Clerk user ID
  '<org_id_from_above>',
  'user@example.com',
  'John',
  'Doe',
  'member'
);

-- Refresh dashboard page
```

#### Solution 4: Increase Retry Limit (Dashboard Setup Component)

**File:** `nextjs_space/app/app/dashboard-setup.tsx`

```typescript
// Current: MAX_RETRIES = 10 (30 seconds)
// Increase to: MAX_RETRIES = 20 (60 seconds)

const MAX_RETRIES = 20;
const RETRY_INTERVAL = 3000; // 3 seconds
```

---

### Problem 10: "Qryx dashboard shows wrong data"

**Symptoms:**
- Wrong shop displayed
- Wrong plan shown
- Incorrect usage stats

**Causes:**
1. Multiple subscriptions (showing wrong one)
2. Stale data (cache issue)
3. Database query error

**Solutions:**

#### Solution 1: Check Active Subscription

```sql
-- Get all subscriptions for user
SELECT 
  bs.shop_domain,
  bs.plan_id,
  bs.status,
  bs.created_at
FROM billing_subscriptions bs
WHERE bs.clerk_user_id = 'user_abc123'
ORDER BY bs.created_at DESC;

-- Should show correct shop and status
```

#### Solution 2: Clear Browser Cache

1. DevTools → Network → Disable cache (checkbox)
2. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. Clear cookies: DevTools → Application → Clear storage

#### Solution 3: Check API Response

```bash
# Get configuration API
curl -H "Authorization: Bearer <clerk_token>" \
  "https://www.jnxlabs.ai/api/qryx/config?shop=shopbotv3.myshopify.com"

# Verify response:
# - Correct shop_domain
# - Correct plan_id
# - Correct subscription status
```

---

## Qryx Chat Errors

### Problem 11: "Chat not responding"

**Symptoms:**
- Message sent but no response
- Spinner indefinitely
- Error message in console

**Causes:**
1. Gemini API key missing or invalid
2. Subscription inactive or limit exceeded
3. Shopify data not accessible
4. Rate limiting

**Solutions:**

#### Solution 1: Verify Gemini API Key

```bash
# Check .env
cat /home/ubuntu/jnx-os/nextjs_space/.env | grep GEMINI

# Should show:
# GEMINI_API_KEY=AIzaSy...
```

**Test Gemini API:**

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello"}]
    }]
  }'

# Expected: JSON response with generated text
# Error: {"error": {"message": "API key not valid"}}
```

#### Solution 2: Check Subscription Status

```sql
-- Verify subscription active
SELECT status, plan_id, current_period_end
FROM billing_subscriptions
WHERE shop_domain = 'shopbotv3.myshopify.com'
  AND status = 'active';

-- If status != 'active':
-- → Subscription canceled or past due
-- → Payment failed
```

#### Solution 3: Check Usage Limits

```sql
-- Count conversations in current period
SELECT 
  bs.plan_id,
  CASE 
    WHEN bs.plan_id = 'starter' THEN 500
    WHEN bs.plan_id = 'professional' THEN 2000
    WHEN bs.plan_id = 'business' THEN 5000
  END as limit,
  COUNT(qc.id) as used,
  CASE 
    WHEN bs.plan_id = 'starter' THEN 500 - COUNT(qc.id)
    WHEN bs.plan_id = 'professional' THEN 2000 - COUNT(qc.id)
    WHEN bs.plan_id = 'business' THEN 5000 - COUNT(qc.id)
  END as remaining
FROM billing_subscriptions bs
LEFT JOIN qryx_conversations qc 
  ON qc.shop_domain = bs.shop_domain
  AND qc.started_at >= bs.current_period_start
WHERE bs.shop_domain = 'shopbotv3.myshopify.com'
  AND bs.status = 'active'
GROUP BY bs.plan_id, bs.current_period_start;

-- If remaining <= 0:
-- → Limit exceeded, show upgrade prompt
```

#### Solution 4: Check Server Logs

```bash
vercel logs www.jnxlabs.ai --follow | grep qryx/chat

# Look for:
# ✅ POST /api/qryx/chat 200 - Response sent
# ❌ POST /api/qryx/chat 403 - Limit exceeded
# ❌ POST /api/qryx/chat 500 - Gemini API error
```

---

### Problem 12: "Chat giving wrong information"

**Symptoms:**
- AI provides incorrect product details
- Prices don't match Shopify store
- Products mentioned don't exist

**Causes:**
1. Product data not synced from Shopify
2. AI hallucinating (making up information)
3. Shopify API access token expired

**Solutions:**

#### Solution 1: Verify Shopify Data Access

```bash
# Test Shopify API
curl -X GET "https://shopbotv3.myshopify.com/admin/api/2024-01/products.json" \
  -H "X-Shopify-Access-Token: <access_token>"

# Should return list of products
# If error: Check OAuth token (see Problem 8)
```

#### Solution 2: Improve AI Prompt

**File:** `nextjs_space/app/api/qryx/chat/route.ts`

```typescript
// Add stricter instruction to AI prompt:
const prompt = `
You are a sales assistant for ${shopName}.

IMPORTANT RULES:
1. ONLY provide information about products that exist in the product catalog below.
2. If you don't know the answer, say "I don't have that information."
3. DO NOT make up product names, prices, or features.
4. Always verify information against the product catalog.

Product Catalog:
${JSON.stringify(products, null, 2)}

Customer Message: ${message}

Your Response:
`;
```

#### Solution 3: Add Product Verification

```typescript
// After AI response, verify mentioned products exist
const mentionedProducts = extractProductNames(aiResponse);
const validProducts = mentionedProducts.filter(name => 
  products.some(p => p.title.toLowerCase().includes(name.toLowerCase()))
);

if (mentionedProducts.length !== validProducts.length) {
  // AI hallucinated, regenerate response
}
```

---

## Clerk Authentication Issues

### Problem 13: "Clerk authentication failing"

**Symptoms:**
- Can't log in
- "Authentication required" error
- Stuck on login page

**Causes:**
1. Clerk API keys missing or invalid
2. Clerk application not configured
3. Browser cookies disabled

**Solutions:**

#### Solution 1: Verify Clerk API Keys

```bash
# Check .env
cat /home/ubuntu/jnx-os/nextjs_space/.env | grep CLERK

# Should show:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
# CLERK_SECRET_KEY=sk_test_...
```

**Get keys from Clerk Dashboard:**

1. Go to **Clerk Dashboard → API Keys**
2. Copy **Publishable Key** and **Secret Key**
3. Update .env
4. Restart server

#### Solution 2: Check Clerk Application Settings

**Clerk Dashboard → Configure:**

1. **Sign-in options**: Email + Password enabled
2. **Social login** (optional): Google enabled
3. **Paths**:
   - Sign-in: `/login`
   - Sign-up: `/signup`
   - After sign-in: `/products/qryx/setup` (during installation) or `/app` (default)

#### Solution 3: Test Clerk Directly

```typescript
// In browser console (on any page with Clerk)
import { Clerk } from '@clerk/clerk-js';

const clerk = new Clerk('pk_test_...');
await clerk.load();

if (clerk.user) {
  console.log('User authenticated:', clerk.user.id);
} else {
  console.log('Not authenticated');
}
```

---

### Problem 14: "Admin access denied"

**Symptoms:**
- Can't access `/admin` page
- Redirected to `/app`
- Error: "Insufficient permissions"

**Causes:**
1. User doesn't have admin role
2. Role not set in Clerk
3. Middleware checking wrong metadata field

**Solutions:**

#### Solution 1: Set Admin Role in Clerk

**Clerk Dashboard:**

1. Go to **Users**
2. Find user
3. Click **...** → **Edit**
4. Scroll to **Public metadata**
5. Add:
   ```json
   {
     "role": "admin"
   }
   ```
6. Click **Save**

#### Solution 2: Set Admin Role in Database

```sql
-- Update user role
UPDATE users
SET role = 'admin'
WHERE email = 'admin@jnxlabs.ai';

-- Verify
SELECT email, role FROM users WHERE email = 'admin@jnxlabs.ai';
```

#### Solution 3: Check Middleware

**File:** `nextjs_space/middleware.ts`

```typescript
// Verify checking correct field
const role = sessionClaims?.publicMetadata?.role; // ✅ Correct
// NOT: sessionClaims?.metadata?.role // ❌ Wrong

if (isAdminRoute(pathname) && role !== 'admin') {
  return NextResponse.redirect(new URL('/app', request.url));
}
```

---

## Database Errors

### Problem 15: "Database connection failed"

**Symptoms:**
- 500 error on all pages
- "Could not connect to database" in logs
- Supabase queries failing

**Causes:**
1. Invalid Supabase credentials
2. Database unreachable
3. Connection pool exhausted

**Solutions:**

#### Solution 1: Verify Supabase Credentials

```bash
# Check .env
cat /home/ubuntu/jnx-os/nextjs_space/.env | grep SUPABASE

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Get credentials from Supabase:**

1. Go to **Supabase Dashboard → Project Settings → API**
2. Copy **Project URL**
3. Copy **service_role** key (not anon key)
4. Update .env
5. Restart server

#### Solution 2: Test Database Connection

```bash
# Using psql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Should connect and show:
# postgres=>

# Test query:
SELECT COUNT(*) FROM users;
```

#### Solution 3: Check Connection Pool

**Supabase Dashboard → Database → Connection Pooling:**

- Max connections: 15 (free tier)
- Current connections: Should be < 15
- If at limit: Close unused connections or upgrade plan

---

### Problem 16: "Column does not exist" error

**Symptoms:**
- SQL error: "column 'clerk_user_id' does not exist"
- Database queries failing

**Causes:**
1. Database schema outdated
2. Migration not run
3. Wrong table name

**Solutions:**

#### Solution 1: Run Migration

**File:** `/home/ubuntu/jnx-os/MIGRATION_SIMPLE.sql`

1. Open Supabase Dashboard → SQL Editor
2. Paste migration SQL
3. Click **Run**
4. Verify success message

#### Solution 2: Verify Schema

```sql
-- Check table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'billing_subscriptions'
ORDER BY ordinal_position;

-- Should include:
-- clerk_user_id | text
-- shop_domain | text
-- stripe_subscription_id | text
-- plan_id | text
-- status | text
-- ...(and more)
```

---

## Deployment Issues

### Problem 17: "Vercel deployment failed"

**Symptoms:**
- Build error in Vercel
- Deployment shows "Failed"
- Site not updating

**Causes:**
1. TypeScript errors
2. Missing environment variables
3. Build timeout
4. Dependency conflicts

**Solutions:**

#### Solution 1: Check Build Logs

**Vercel Dashboard → Deployments → Failed Deployment → View Build Logs**

**Common errors:**

```bash
# TypeScript error
Type error: Property 'x' does not exist on type 'Y'
→ Fix TypeScript errors locally first

# Missing environment variable
Error: STRIPE_SECRET_KEY is not defined
→ Add missing env vars in Vercel Dashboard

# Module not found
Cannot find module '@/lib/utils'
→ Check import paths, run yarn install

# Build timeout
Error: Command "yarn build" exceeded timeout of 15m
→ Optimize build, upgrade Vercel plan
```

#### Solution 2: Test Build Locally

```bash
# Clean install
cd /home/ubuntu/jnx-os/nextjs_space
rm -rf node_modules .next
yarn install

# Run build
yarn build

# If successful:
# → Push to GitHub, Vercel will deploy

# If errors:
# → Fix locally, then push
```

#### Solution 3: Verify Environment Variables

**Vercel Dashboard → Project → Settings → Environment Variables:**

Verify all required variables set:

- ✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- ✅ CLERK_SECRET_KEY
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ STRIPE_SECRET_KEY
- ✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- ✅ STRIPE_WEBHOOK_SECRET
- ✅ STRIPE_PRICE_STARTER
- ✅ STRIPE_PRICE_PROFESSIONAL
- ✅ STRIPE_PRICE_ENTERPRISE
- ✅ GEMINI_API_KEY
- ✅ SHOPIFY_API_KEY
- ✅ SHOPIFY_API_SECRET
- ✅ SESSION_SECRET
- ✅ NEXT_PUBLIC_APP_URL

**If any missing:**

1. Click **Add**
2. Name: `VARIABLE_NAME`
3. Value: `<value_from_.env>`
4. Environment: **Production** (and Preview if needed)
5. Click **Save**
6. Redeploy

---

### Problem 18: "Site showing old version"

**Symptoms:**
- Changes not visible on production
- Code updated but site unchanged
- Cache showing stale content

**Causes:**
1. Deployment not triggered
2. Browser cache
3. CDN cache (Vercel Edge)
4. DNS cache

**Solutions:**

#### Solution 1: Verify Deployment

**Vercel Dashboard → Deployments:**

- Check latest deployment is "Ready"
- Check deployment time matches latest push
- If not: Manually trigger deployment

**Manual deployment:**

```bash
# Using Vercel CLI
vercel --prod

# Or via Git
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

#### Solution 2: Clear Browser Cache

1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear site data: DevTools → Application → Clear storage
3. Try incognito/private mode
4. Try different browser

#### Solution 3: Purge CDN Cache

**Vercel Dashboard → Project → Settings → General:**

1. Scroll to **Deployment Protection**
2. Click **Purge Cache**
3. Wait 1-2 minutes
4. Refresh site

---

## Performance Problems

### Problem 19: "Site loading slowly"

**Symptoms:**
- Pages take >5 seconds to load
- API calls timing out
- Dashboard unresponsive

**Causes:**
1. Database query slow (missing indexes)
2. Too many API calls
3. Large bundle size
4. Unoptimized images

**Solutions:**

#### Solution 1: Check Database Query Performance

```sql
-- Enable query timing
\timing

-- Test slow query
SELECT * FROM billing_subscriptions
WHERE clerk_user_id = 'user_abc123';

-- Should return in < 100ms
-- If > 500ms: Add index

CREATE INDEX idx_billing_clerk_user 
ON billing_subscriptions(clerk_user_id);
```

#### Solution 2: Optimize API Calls

**DevTools → Network Tab:**

- Count API calls on page load
- Should be < 10 requests
- If > 20: Combine or cache

**Add caching:**

```typescript
// Use SWR for client-side caching
import useSWR from 'swr';

const { data, error } = useSWR(
  `/api/qryx/config?shop=${shop}`,
  fetcher,
  { revalidateOnFocus: false, revalidateOnReconnect: false }
);
```

#### Solution 3: Analyze Bundle Size

```bash
# Install analyzer
yarn add -D @next/bundle-analyzer

# Add to next.config.js:
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // existing config
});

# Analyze
ANALYZE=true yarn build

# Opens browser with bundle visualization
# Look for:
# - Large dependencies (>500kb)
# - Duplicate packages
# - Unused code
```

---

### Problem 20: "Rate limit exceeded"

**Symptoms:**
- Error: "Too many requests"
- 429 status code
- API temporarily blocked

**Causes:**
1. Too many requests in short time
2. Rate limiting active
3. Loop causing repeated calls

**Solutions:**

#### Solution 1: Check Rate Limits

**Rate limits (per minute):**
- General: 100 requests
- Auth: 10 requests
- Chat: 30 requests

**Check headers in response:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1672531200
```

#### Solution 2: Implement Backoff

```typescript
// Retry with exponential backoff
async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      await delay(retryAfter * 1000 * (i + 1)); // Exponential backoff
      continue;
    }
    
    return response;
  }
  
  throw new Error('Rate limit exceeded after retries');
}
```

#### Solution 3: Find Request Loop

**Check browser console for repeated requests:**

```javascript
// In DevTools Console
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('/api/'))
  .forEach(r => console.log(r.name, r.startTime));

// Look for same API called multiple times quickly
```

---

## General Debugging Tips

### Enable Verbose Logging

```bash
# Development
export DEBUG=*
yarn dev

# Production (Vercel)
# Add to .env:
NODE_ENV=development
LOG_LEVEL=debug
```

### Check All Services

```bash
# Health check
curl https://www.jnxlabs.ai/api/system/health

# Should return:
# {
#   "status": "operational",
#   "services": {
#     "clerk": {"status": "operational"},
#     "supabase": {"status": "operational"},
#     "stripe": {"status": "operational"},
#     "gemini": {"status": "operational"},
#     "shopify": {"status": "operational"}
#   }
# }
```

### Browser DevTools Checklist

- ✅ Console: No errors
- ✅ Network: All requests 200 OK
- ✅ Application: Cookies present
- ✅ Performance: Page load < 3s

---

## Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Review server logs (Vercel/local)
3. ✅ Test in incognito mode
4. ✅ Verify environment variables
5. ✅ Check database records
6. ✅ Review recent code changes

### Information to Provide

```markdown
**Problem:** [Brief description]

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected:** [What should happen]
**Actual:** [What actually happens]

**Environment:**
- URL: [Dev/Production]
- Browser: [Chrome 120, etc.]
- User: [user@example.com]
- Shop: [shop.myshopify.com]

**Logs:**
[Paste relevant logs]

**Database State:**
[SQL query results]

**Screenshots:**
[Attach if visual issue]
```

### Contact Support

- **GitHub Issues**: https://github.com/JNXLabs/jnx-os/issues
- **Email**: support@jnxlabs.ai
- **Emergency**: engineering@jnxlabs.ai

---

## Summary

This troubleshooting guide covers:

✅ **20 Common Problems**: From shop sessions to performance
✅ **60+ Solutions**: Step-by-step fixes
✅ **SQL Queries**: Database diagnostics
✅ **Code Examples**: Testing and debugging
✅ **Debugging Tools**: Logs, DevTools, CLIs
✅ **Getting Help**: How to report issues

**Related Documentation:**

- [Testing Guide](/TESTING_GUIDE_PHASE5A.md)
- [API Endpoints Reference](/API_ENDPOINTS_REFERENCE.md)
- [Database Schema Reference](/DATABASE_SCHEMA_REFERENCE.md)
- [Stripe Setup Guide](/STRIPE_SETUP_GUIDE.md)

---

**Document Version:** 1.0
**Last Updated:** December 29, 2025
**Maintained By:** JNXLabs Support Team