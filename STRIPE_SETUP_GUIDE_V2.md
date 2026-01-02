# Stripe Setup Guide - JNX-OS Phase 5C

**Status:** Live Mode Active
**Last Updated:** January 2, 2026
**Version:** 2.2 (SaaS Flow Fix)

---

## Quick Reference

### Environment Status
- **Mode:** LIVE (Production)
- **Webhook:** Verified & Active
- **Plans:** 3 Pricing Tiers Configured
- **Integration:** Complete with Session Management

---

## Stripe Pricing Plans

### 1. Starter Plan
- **Price:** $29/month
- **Conversations:** 500/month
- **Price ID:** `price_1SjkKKBQ5QFS35pBxGKE0r50`

### 2. Professional Plan
- **Price:** $79/month
- **Conversations:** 2,000/month
- **Price ID:** `price_1SjkQTBQ5QFS35pBpWkdi5ws`

### 3. Business Plan
- **Price:** $199/month
- **Conversations:** 5,000/month
- **Price ID:** `price_1SjkR4BQ5QF535pBkhTJsxk2`

---

## API Keys (Production)

**Location:** Vercel Environment Variables

```env
# Stripe Live Mode Keys
STRIPE_SECRET_KEY=sk_live_xxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxx
STRIPE_WEBHOOK_SECRET=whsec_iiZIS4zHkV3SCdYi57DLty8zD0WtF1jW

# Price IDs
STRIPE_PRICE_STARTER=price_1SjkKKBQ5QFS35pBxGKE0r50
STRIPE_PRICE_PROFESSIONAL=price_1SjkQTBQ5QFS35pBpWkdi5ws
STRIPE_PRICE_BUSINESS=price_1SjkR4BQ5QF535pBkhTJsxk2
```

---

## Webhook Configuration

### Production Webhook
- **URL:** `https://www.jnxlabs.ai/api/stripe/webhook`
- **Status:** Verified & Active
- **Secret:** `whsec_iiZIS4zHkV3SCdYi57DLty8zD0WtF1jW`

### Events Monitored (5 Events)

1. **checkout.session.completed**
   - Triggered: After successful payment
   - Action: Create billing subscription record

2. **customer.subscription.created**
   - Triggered: New subscription created
   - Action: Initialize subscription tracking

3. **customer.subscription.updated**
   - Triggered: Plan change, renewal, payment method update
   - Action: Update subscription status & period

4. **customer.subscription.deleted**
   - Triggered: Cancellation, payment failure (after retries)
   - Action: Mark subscription as cancelled

5. **invoice.payment_failed**
   - Triggered: Failed payment attempt
   - Action: Update status to 'past_due'

---

## SaaS Installation Flow (Updated Jan 2, 2026)

### CRITICAL: Correct Flow

The Stripe checkout happens AFTER user authentication but BEFORE Shopify OAuth.

```
┌─────────────────────────────────────────────────────────────┐
│ CORRECT SAAS FLOW                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. User opens:                                              │
│    https://www.jnxlabs.ai/api/qryx/install?shop=xxx         │
│    └── NOT the direct Shopify OAuth URL!                    │
│                                                              │
│ 2. /api/qryx/install                                        │
│    └── Saves shop to JWT session (30 min TTL)               │
│    └── Checks if user is authenticated                      │
│    └── Redirects to /login or /products/qryx/setup          │
│                                                              │
│ 3. User logs in (if needed)                                 │
│                                                              │
│ 4. /products/qryx/setup                                     │
│    └── Shows 3 pricing plans                                │
│    └── User selects a plan                                  │
│                                                              │
│ 5. POST /api/stripe/checkout                                │
│    └── Creates Stripe Checkout Session                      │
│    └── Links clerk_user_id to customer                      │
│    └── success_url = /api/qryx/start-oauth?shop=xxx         │
│                                                              │
│ 6. Stripe Checkout Page                                     │
│    └── User enters payment details                          │
│    └── Payment processed                                    │
│                                                              │
│ 7. Webhook: checkout.session.completed                      │
│    └── Creates billing_subscriptions record                 │
│                                                              │
│ 8. Redirect to /api/qryx/start-oauth                        │
│    └── NOW Shopify OAuth begins                             │
│                                                              │
│ 9. Shopify OAuth → /api/qryx/callback                       │
│    └── Links shop to EXISTING user (not create new!)        │
│                                                              │
│ 10. Dashboard /app/qryx                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### 1. Create Checkout Session
**Endpoint:** `POST /api/stripe/checkout`

**Request Body:**
```json
{
  "priceId": "price_1SjkKKBQ5QFS35pBxGKE0r50",
  "shop": "shopbotv3.myshopify.com"
}
```

**Response:**
```json
{
  "sessionId": "cs_live_xxxx",
  "url": "https://checkout.stripe.com/c/pay/cs_live_xxxx"
}
```

### 2. Webhook Handler
**Endpoint:** `POST /api/stripe/webhook`

**Headers Required:**
```
stripe-signature: t=xxxx,v1=xxxx
```

---

## Database Schema

### Table: `billing_subscriptions`

```sql
CREATE TABLE billing_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_clerk_user ON billing_subscriptions(clerk_user_id);
CREATE INDEX idx_billing_stripe_customer ON billing_subscriptions(stripe_customer_id);
CREATE INDEX idx_billing_status ON billing_subscriptions(status);
```

---

## Recent Fixes (January 2, 2026)

### Fix 1: OAuth Callback for SaaS Flow
**Commit:** `76f2a19`

**Problem:** Old callback route created NEW Clerk users instead of using existing authenticated user.

**Solution:**
```typescript
// OLD (wrong):
const clerkUser = await clerk.users.createUser({...});

// NEW (correct):
const clerkUser = await currentUser();
const jnxUser = await getUserByClerkId(clerkUser.id);
await upsertShopifyShop({
  org_id: jnxUser.org_id,
  clerk_user_id: clerkUser.id,  // NEW: Added for billing
  ...
});
```

### Fix 2: Async Cookies API
**Commit:** `e77c40b`

**Problem:** Next.js 14.2+ requires async `cookies()` API.

**Solution:**
```typescript
// OLD (wrong):
cookies().set(COOKIE_NAME, token, {...});

// NEW (correct):
const cookieStore = await cookies();
cookieStore.set(COOKIE_NAME, token, {...});
```

### Fix 3: clerk_user_id in shopify_shops
**Commit:** `76f2a19`

**Added:** `clerk_user_id` field to `upsertShopifyShop()` for user-based billing tracking.

---

## Testing

### Test Cards (Stripe Test Mode)
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

### Test Flow
1. Navigate to `https://www.jnxlabs.ai/api/qryx/install?shop=test.myshopify.com`
2. Login if not authenticated
3. Select any plan on /products/qryx/setup
4. Use test card 4242 4242 4242 4242
5. Verify webhook received in Stripe Dashboard
6. Check `billing_subscriptions` table in Supabase

---

## Monitoring

### Stripe Dashboard
- **URL:** https://dashboard.stripe.com/
- **Check:** Events → Webhooks → View details

### Supabase Dashboard
- **URL:** https://supabase.com/dashboard/project/[PROJECT_ID]
- **Table:** `billing_subscriptions`

### Vercel Logs
- **URL:** https://vercel.com/jnxlabs/jnx-os/logs
- **Filter:** `/api/stripe/webhook`

---

## Subscription Lifecycle States

### Status Flow
```
[New User] → [active] → [past_due] → [cancelled]
                ↓
         [cancel_at_period_end = true]
                ↓
           [cancelled]
```

### Status Definitions
- **active:** Subscription is active and paid
- **past_due:** Payment failed, awaiting retry
- **cancelled:** Subscription ended
- **trialing:** Free trial period (future feature)

---

## Checklist for Developers

- [ ] Stripe account created
- [ ] API keys copied to Vercel env vars
- [ ] Webhook endpoint configured in Stripe
- [ ] Webhook secret added to Vercel env vars
- [ ] All 5 events enabled in Stripe
- [ ] Test mode verified with test cards
- [ ] Database table `billing_subscriptions` exists
- [ ] Foreign key to `users(clerk_user_id)` verified
- [ ] Indexes created for performance
- [ ] SESSION_SECRET generated
- [ ] SHOPIFY_APP_URL set to https://www.jnxlabs.ai

---

**Document Version:** 2.2
**Last Updated:** January 2, 2026
**Status:** Production Ready (with active debugging on install flow)
