# Phase 5A Quick Reference 🚀

**One-page guide for deploying and testing the Qryx SaaS billing system**

---

## ✅ What's Complete

```
✅ Shop session management
✅ Installation flow (Login → Payment → OAuth)
✅ 3 pricing plans (Starter $29, Pro $79, Business $199)
✅ Stripe integration (API keys, webhook, checkout)
✅ Database schema (billing_subscriptions table)
✅ Subscription tracking
✅ Production build (0 errors, 31 routes)
```

---

## 💻 Environment Variables (Production)

**Add to Vercel:** `https://vercel.com/[project]/settings/environment-variables`

```bash
# Session
SESSION_SECRET=d1mNLG5+tZxSFOmVB+i2MhgLIie3/IPsQNqJylHxETw=

# Stripe (Live Mode)
STRIPE_SECRET_KEY=sk_live_51SexRf...[REDACTED]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51SexRf...[REDACTED]
STRIPE_WEBHOOK_SECRET=whsec_...[REDACTED]

# Stripe Price IDs
STRIPE_PRICE_STARTER=price_1SjkKKBQ5QFS35pBxGKE0r5O
STRIPE_PRICE_PROFESSIONAL=price_1SjkQTBQ5QFS35pBpWkdi5ws
STRIPE_PRICE_ENTERPRISE=price_1SjkR4BQ5QFS35pBkhTJsxk2
```

---

## 🎯 Test URLs

### Local (http://localhost:3000)

```
1. Start dev: cd /home/ubuntu/jnx-os/nextjs_space && yarn dev

2. Test install:
   http://localhost:3000/api/qryx/install?shop=shopbotv3.myshopify.com

3. Expected flow:
   /api/qryx/install → /login → /products/qryx/setup →
   Stripe Checkout → /api/qryx/start-oauth →
   Shopify OAuth → /app/qryx
```

### Production (https://www.jnxlabs.ai)

```
1. Deploy: git push origin main (Vercel auto-deploys)

2. Test install:
   https://www.jnxlabs.ai/api/qryx/install?shop=shopbotv3.myshopify.com

3. Test webhook:
   Stripe Dashboard → Webhooks → "Send test event"
```

---

## 🔍 Verify Deployment

### 1. Environment Variables

```bash
# Check Vercel dashboard
https://vercel.com/[project]/settings/environment-variables

# Verify all 7 variables set:
✅ SESSION_SECRET
✅ STRIPE_SECRET_KEY
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
✅ STRIPE_WEBHOOK_SECRET
✅ STRIPE_PRICE_STARTER
✅ STRIPE_PRICE_PROFESSIONAL
✅ STRIPE_PRICE_ENTERPRISE
```

### 2. Stripe Webhook

```bash
# Check Stripe dashboard
https://dashboard.stripe.com/webhooks

# Verify:
✅ Endpoint: https://www.jnxlabs.ai/api/stripe/webhook
✅ Status: Active
✅ Events: 5 selected (checkout.session.completed, etc.)
✅ Secret: whsec_...[REDACTED]
```

### 3. Database

```sql
-- Run in Supabase SQL Editor

-- Verify table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'billing_subscriptions';

-- Verify structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'billing_subscriptions'
ORDER BY ordinal_position;

-- Should return 13 columns
```

---

## 🧪 Test Checklist

### End-to-End Flow

```
[ ] 1. Visit install URL with shop parameter
[ ] 2. Redirect to /login (if not logged in)
[ ] 3. After login → /products/qryx/setup
[ ] 4. See 3 pricing plans (Starter, Professional, Business)
[ ] 5. Click "Subscribe Now" on Professional
[ ] 6. Redirect to Stripe Checkout
[ ] 7. Enter test card: 4242 4242 4242 4242
[ ] 8. Complete payment
[ ] 9. Redirect to /api/qryx/start-oauth
[ ] 10. Shopify OAuth authorization page
[ ] 11. Approve permissions
[ ] 12. Redirect to /app/qryx
[ ] 13. Dashboard shows "Connected"
```

### Database Verification

```sql
-- Check subscription created
SELECT 
  clerk_user_id,
  plan_name,
  status,
  stripe_subscription_id,
  current_period_end
FROM billing_subscriptions
ORDER BY created_at DESC
LIMIT 5;

-- Expected: 1 row with status 'active'
```

### Stripe Verification

```
1. Go to: https://dashboard.stripe.com/subscriptions
2. Find latest subscription
3. Verify status: Active
4. Check customer email matches user
5. Verify plan matches selection
```

---

## 🛠️ Troubleshooting

### Issue: Webhook not receiving events

```bash
# 1. Check webhook URL
https://dashboard.stripe.com/webhooks

# 2. Verify secret in Vercel
echo $STRIPE_WEBHOOK_SECRET

# 3. Test with Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed

# 4. Check logs
https://vercel.com/[project]/logs
```

### Issue: Subscription not in database

```sql
-- 1. Check table exists
SELECT * FROM billing_subscriptions LIMIT 1;

-- 2. Check webhook delivery
-- Stripe Dashboard → Webhooks → Recent deliveries

-- 3. Check error logs
-- Vercel → Logs → Filter: "/api/stripe/webhook"
```

### Issue: OAuth fails after payment

```bash
# 1. Check shop session not expired (30 min limit)
# Clear cookies and restart flow

# 2. Verify subscription exists
SELECT * FROM billing_subscriptions 
WHERE clerk_user_id = 'user_xxx';

# 3. Check Shopify credentials
echo $SHOPIFY_API_KEY
echo $SHOPIFY_API_SECRET
```

---

## 📊 Pricing Plans

| Plan | Price | Conversations | Stripe ID |
|------|-------|---------------|----------|
| Starter | $29/mo | 500 | `price_1SjkKKBQ5QFS35pBxGKE0r5O` |
| Professional | $79/mo | 2,000 | `price_1SjkQTBQ5QFS35pBpWkdi5ws` |
| Business | $199/mo | 5,000 | `price_1SjkR4BQ5QFS35pBkhTJsxk2` |

---

## 📘 Key Files

```
lib/session/shop-session.ts          # Session management
lib/stripe/client.ts                  # Stripe configuration
lib/db/billing-helpers.ts             # Database operations
app/api/qryx/install/route.ts         # Install entry point
app/products/qryx/setup/page.tsx      # Pricing page
app/api/stripe/checkout/route.ts      # Checkout API
app/api/stripe/webhook/route.ts       # Webhook handler
app/api/qryx/start-oauth/route.ts     # OAuth trigger
```

---

## 🔗 Important Links

```
Stripe Dashboard:     https://dashboard.stripe.com
Supabase Dashboard:   https://supabase.com/dashboard
Vercel Dashboard:     https://vercel.com
Shopify Partners:     https://partners.shopify.com

Webhooks:             https://dashboard.stripe.com/webhooks
Products:             https://dashboard.stripe.com/products
Subscriptions:        https://dashboard.stripe.com/subscriptions
```

---

## 📦 Deploy Commands

```bash
# 1. Commit changes
git add .
git commit -m "Phase 5A: Stripe & Billing Complete"
git push origin main

# 2. Verify build in Vercel
https://vercel.com/[project]/deployments

# 3. Add environment variables
https://vercel.com/[project]/settings/environment-variables

# 4. Redeploy (if env vars added)
https://vercel.com/[project] → "Redeploy"

# 5. Test production
curl https://www.jnxlabs.ai/api/system/health
```

---

## 📝 Documentation

**Full Guides:**
- `PHASE5A_COMPLETION_SUMMARY.md` - Complete technical summary
- `STRIPE_SETUP_GUIDE.md` - Step-by-step Stripe configuration
- `STRIPE_CONFIGURATION_STATUS.md` - Current status
- `QRYX_PRICING_STRATEGY.md` - Pricing strategy & analysis

**Quick Start:**
- This file! Keep it handy for quick lookups.

---

**Status:** ✅ Production-Ready  
**Build:** 0 errors, 31 routes  
**Checkpoint:** "Phase 5A Complete - Stripe & Billing Ready"

---

**Last Updated:** December 29, 2024
