# Stripe Setup Guide V3 - Qryx SaaS Billing
**Version:** 3.0.0  
**Updated:** January 4, 2026  
**Status:** Production Ready (with Embedded Auth Fix)

---

## Overview

This guide covers Stripe integration for Qryx's 4-tier SaaS billing model:
- ✅ **Free Plan**: $0/month (50 conversations, no Stripe required)
- ✅ **Starter Plan**: $29/month (500 conversations)
- ✅ **Professional Plan**: $79/month (2,000 conversations) - POPULAR
- ✅ **Business Plan**: $199/month (5,000 conversations)

All paid plans include a **14-day free trial**.

---

## Critical Fixes Applied

### Auth Flow (January 4, 2026)
**Commit:** `febbc21`  
**Issue**: "You are signed out" error when accessing from Shopify Admin iframe  
**Solution**: Full-page redirect authentication

**How it works now:**
1. User opens Qryx in Shopify Admin (iframe)
2. Sees "Sign In to Continue" page
3. Clicks button → `window.top.location.href` navigates entire browser
4. User authenticates on jnxlabs.ai (outside iframe, no cookie issues)
5. Redirects back to pricing page with valid session
6. Selects plan → Payment → Shopify OAuth → Done

**Why**: All modern browsers block third-party cookies in iframes. Cookie-based auth (Clerk, Auth0, Firebase) cannot work. Full-page redirect is the official Shopify-recommended solution.

### Checkout Flow (January 3, 2026)
**Commits:** `d7c3d84`, `47e9dd6`  
**Issues Fixed**:
- Shop session expiration errors
- JSON response instead of redirect

**Solution**: Shop passed as URL parameter throughout flow

---

## Part 1: Stripe Dashboard Setup

### Step 1: Create Products

Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)

#### Qryx Starter - $29/month
- **Price**: $29/month recurring
- **Trial**: 14 days
- **Features**: 500 conversations, widget customization, standard analytics
- **Copy Price ID**: `price_xxxxx`

#### Qryx Professional - $79/month (POPULAR)
- **Price**: $79/month recurring
- **Trial**: 14 days
- **Features**: 2,000 conversations, advanced analytics, A/B testing (2 variants)
- **Copy Price ID**: `price_xxxxx`

#### Qryx Business - $199/month
- **Price**: $199/month recurring
- **Trial**: 14 days
- **Features**: 5,000 conversations, white label, phone support, 5 A/B variants
- **Copy Price ID**: `price_xxxxx`

### Step 2: Configure Webhook

Go to [Webhooks](https://dashboard.stripe.com/webhooks)

- **URL**: `https://www.jnxlabs.ai/api/stripe/webhook`
- **Events**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

**Copy Signing Secret**: `whsec_xxxxx`

### Step 3: Get API Keys (LIVE MODE)

Go to [API Keys](https://dashboard.stripe.com/apikeys)

- **Publishable**: `pk_live_xxxxx`
- **Secret**: `sk_live_xxxxx`

---

## Part 2: Vercel Environment Variables

```env
# Stripe Live Mode
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_BUSINESS=price_...
```

---

## Part 3: Installation Flows

### Flow 1: Direct Browser Access
```
1. User opens: https://www.jnxlabs.ai/api/qryx/install?shop=xxx
2. Not logged in → Redirect to /login?redirect_url=...
3. Login completes → Redirect back to /products/qryx/setup?shop=xxx
4. Select plan → Payment/OAuth → Done
```

### Flow 2: Shopify Admin Embedded (iframe)
```
1. User opens Qryx in Shopify Admin
2. App loads in iframe → Detects no auth
3. Shows "Sign In to Continue" UI
4. User clicks → window.top.location.href = '/login?redirect_url=...'
5. FULL BROWSER navigates to login (exits iframe)
6. Login completes → Redirect to /products/qryx/setup?shop=xxx
7. Select plan → Payment/OAuth → Done
```

**Critical**: Step 4 uses `window.top.location.href`, not `window.location.href`. This navigates the TOP-LEVEL window, breaking out of Shopify's iframe.

### Flow 3: Free Plan
```
1-3. Same as Flow 1 or 2
4. Click "Start Free"
5. Direct to /api/qryx/start-oauth?shop=xxx&plan=free
6. Generates Shopify OAuth URL (no Stripe verification)
7. Shopify permissions → Callback → App installed
```

### Flow 4: Paid Plan
```
1-3. Same as Flow 1 or 2
4. Click "Subscribe Now" on any paid plan
5. POST to /api/stripe/checkout with shop + priceId
6. Create Stripe Customer + Checkout Session
7. Redirect to Stripe Checkout (trial starts)
8. User completes payment
9. Redirect to /api/qryx/start-oauth?shop=xxx&session_id=xxx
10. Verify Stripe session, generate Shopify OAuth URL
11. Shopify permissions → Callback → App installed
```

---

## Part 4: Testing

### Test 1: Embedded Auth
1. Open Shopify Admin → Apps → Qryx
2. Should see "Sign In to Continue"
3. Click button
4. Browser navigates to login page (NOT in iframe)
5. Login → Redirects back
6. ✅ Pricing page loads

### Test 2: Free Plan
1. After login, click "Start Free"
2. Redirects to Shopify OAuth
3. Grant permissions
4. ✅ App installed, no Stripe interaction

### Test 3: Paid Plan
1. After login, click "Subscribe Now" on Starter
2. Redirects to Stripe Checkout
3. Enter test card: `4242 4242 4242 4242`
4. Complete payment
5. Redirects to Shopify OAuth
6. Grant permissions
7. ✅ App installed with Starter plan

---

## Part 5: Database Schema

```sql
CREATE TABLE shopify_shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  
  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'free',
  plan_name TEXT DEFAULT 'free',
  current_period_end TIMESTAMPTZ,
  
  -- Shop Intelligence (Phase 5C)
  shop_intelligence JSONB,
  analyzed_at TIMESTAMPTZ,
  
  -- User Link
  clerk_user_id TEXT REFERENCES users(clerk_user_id),
  
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shops_clerk_user ON shopify_shops(clerk_user_id);
CREATE INDEX idx_shops_stripe_customer ON shopify_shops(stripe_customer_id);
CREATE INDEX idx_shops_intelligence ON shopify_shops USING GIN (shop_intelligence);
```

---

## Part 6: Key Files

### Authentication
- `app/products/qryx/setup/page.tsx` - Pricing page with auth check
- `app/products/qryx/setup/embedded-auth-redirect.tsx` - Full-page redirect handler
- `app/login/[[...rest]]/page.tsx` - Login with redirect_url support

### Billing
- `app/api/stripe/checkout/route.ts` - Create Checkout Session
- `app/api/stripe/webhook/route.ts` - Handle Stripe events
- `app/api/qryx/start-oauth/route.ts` - Verify payment & start OAuth

### OAuth
- `app/api/qryx/install/route.ts` - Install entry point
- `app/api/qryx/callback/route.ts` - OAuth callback handler

---

## Part 7: Troubleshooting

### "You are signed out" in iframe
**Status**: ✅ FIXED (Commit febbc21)  
**Solution**: Full-page redirect auth

### "Shop session expired"
**Status**: ✅ FIXED (Commits d7c3d84, 47e9dd6)  
**Solution**: Shop in URL params

### Stripe 403 CloudFront Error
**Cause**: Invalid Price ID or Stripe not activated  
**Fix**: Verify Live Mode enabled, check Price IDs

### Webhook delivery fails
**Cause**: Wrong endpoint URL or signature  
**Fix**: Check Stripe Dashboard → Webhooks for error details

---

## Part 8: Deployment Checklist

### Vercel
- [ ] Stripe env vars set (Live Mode)
- [ ] Price IDs configured
- [ ] Webhook secret added
- [ ] Code deployed (febbc21 or later)

### Stripe
- [ ] Live Mode enabled
- [ ] Products/Prices created
- [ ] Webhook active
- [ ] Test payment successful

### Shopify
- [ ] Redirect URL: `https://www.jnxlabs.ai/api/qryx/callback`
- [ ] App permissions configured
- [ ] Installed on test store

---

## Support

**Stripe**: [Dashboard Logs](https://dashboard.stripe.com/logs)  
**Vercel**: [Deployment Logs](https://vercel.com)  
**Clerk**: [Dashboard](https://dashboard.clerk.com)

**Documentation**:
- `STRIPE_SETUP_GUIDE_V3.md` (this file)
- `UPDATED_DOCS_FOR_NEW_CONVERSATION_V3.md`
- `JNX_OS_MASTER_DOCUMENTATION_V3.md`

---

**Version**: 3.0.0  
**Last Updated**: January 4, 2026  
**Status**: ✅ Production Ready  
**Latest Commit**: febbc21
