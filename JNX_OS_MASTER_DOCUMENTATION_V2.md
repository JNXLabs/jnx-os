# JNX-OS v2 - Master Documentation
# Phase 5C Complete Reference

**Project:** JNX-OS v2 + Qryx AI Sales Assistant
**Status:** Production Ready (with Active Debugging)
**Last Updated:** January 2, 2026, 15:45 UTC
**Version:** 2.2.0 (Phase 5C - Shop Intelligence + OAuth Fix)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Overview](#project-overview)
3. [Tech Stack](#tech-stack)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Stripe Integration](#stripe-integration)
7. [SaaS Installation Flow](#saas-installation-flow)
8. [Logo Design System](#logo-design-system)
9. [Shop Intelligence (Phase 5C)](#shop-intelligence-phase-5c)
10. [Testing Guide](#testing-guide)
11. [Deployment Status](#deployment-status)
12. [Known Issues & Fixes](#known-issues--fixes)
13. [File Structure](#file-structure)

---

## Quick Start

### Prerequisites
- Node.js 18+ & Yarn
- Clerk account (authentication)
- Supabase project (database)
- Stripe account (billing)
- Shopify Partner account (Qryx integration)

### Environment Setup
```bash
# Copy from /nextjs_space/.env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...

STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

SHOPIFY_API_KEY=6e62aef5f8013048ca5b446fa86c6fae
SHOPIFY_API_SECRET=shpss_...
SHOPIFY_APP_URL=https://www.jnxlabs.ai  # CRITICAL!
SHOPIFY_SCOPES=read_products,read_product_listings,read_customers,read_orders

SESSION_SECRET=<base64-encoded-32-byte-key>
GEMINI_API_KEY=AIzaSy...
```

### Development Server
```bash
cd /home/ubuntu/jnx-os/nextjs_space
yarn install
yarn dev
# Open http://localhost:3000
```

---

## Project Overview

### What is JNX-OS?
**Enterprise SaaS Foundation** built for multi-tenant B2B applications with:
- Clerk authentication (email/password + Google SSO)
- Supabase PostgreSQL (9 tables, 23 indexes, 6 foreign keys)
- GDPR compliance (data export, deletion, audit trails)
- Role-based access control (admin/user)
- Security by default (rate limiting, CSP, HSTS)

### What is Qryx?
**AI Sales Assistant for Shopify** - First product on JNX-OS:
- Gemini 2.0 Flash AI integration
- Shopify OAuth integration
- Stripe billing (3 pricing tiers)
- Conversation limits based on plan
- Real-time chat widget
- **NEW: Shop Intelligence Analysis (Phase 5C)**

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14.2.28 (App Router)
- **Styling:** Tailwind CSS + JNX Dark Design System
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **UI Components:** Radix UI + Custom

### Backend
- **Auth:** Clerk (webhooks for user sync)
- **Database:** Supabase PostgreSQL
- **Billing:** Stripe (Checkout + Webhooks)
- **AI:** Google Gemini 2.0 Flash
- **E-commerce:** Shopify OAuth

### Infrastructure
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Domain:** www.jnxlabs.ai
- **CDN:** Vercel Edge Network
- **Environment:** Production + Preview

---

## Database Schema

### Core Tables (9 Total + Phase 5C Extensions)

#### 1. `orgs` - Organizations
```sql
CREATE TABLE orgs (
  org_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  clerk_org_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `users` - User Accounts
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  org_id UUID REFERENCES orgs(org_id) ON DELETE SET NULL,
  clerk_user_id TEXT UNIQUE NOT NULL,
  supabase_user_id UUID,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `billing_subscriptions` - Stripe Subscriptions
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
```

#### 4. `shopify_shops` - Shopify Store Connections (Extended Phase 5C)
```sql
CREATE TABLE shopify_shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES orgs(org_id),
  clerk_user_id TEXT,  -- PHASE 5B: Added for user-based billing
  shop_domain TEXT UNIQUE NOT NULL,
  shop_name TEXT,
  shop_email TEXT,
  shop_owner_name TEXT,
  access_token TEXT NOT NULL,
  scope TEXT,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  uninstalled_at TIMESTAMPTZ,
  plan_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'pending',
  trial_ends_at TIMESTAMPTZ,
  shopify_charge_id TEXT,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  shopify_plan TEXT,
  country_code TEXT,
  currency TEXT,
  timezone TEXT,
  -- PHASE 5C: Shop Intelligence
  shop_intelligence JSONB,  -- AI-analyzed shop profile
  analyzed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 5C Index for Shop Intelligence
CREATE INDEX idx_shopify_shops_intelligence ON shopify_shops USING GIN(shop_intelligence);
```

#### 5-9. Supporting Tables
- `qryx_conversations` - Chat History
- `qryx_messages` - Individual Messages
- `audit_logs` - System Audit Trail
- `system_events` - System-Wide Events
- `data_export_requests` - GDPR Data Exports

---

## API Endpoints

### Qryx Installation Flow (CRITICAL)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/qryx/install?shop=xxx` | Entry point - saves shop session | ⚠️ Debugging |
| GET | `/api/qryx/callback` | OAuth callback - links shop to user | ✅ Fixed (SaaS flow) |
| POST | `/api/qryx/start-oauth` | Triggers Shopify OAuth | ✅ Working |
| GET | `/api/qryx/auth` | Alternative OAuth entry | ✅ Working |

### Stripe Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe/checkout` | Create checkout session |
| POST | `/api/stripe/webhook` | Handle Stripe webhooks |

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/app` | ✅ | User dashboard |
| GET | `/app/qryx` | ✅ | Qryx management |
| GET | `/app/billing` | ✅ | Billing management |
| GET | `/app/products` | ✅ | Products overview |
| GET | `/admin` | Admin | Admin dashboard |

---

## Stripe Integration

### Pricing Plans (Live Mode)

| Plan | Price | Conversations | Price ID |
|------|-------|---------------|----------|
| Starter | $29/mo | 500 | `price_1SjkKKBQ5QFS35pBxGKE0r50` |
| Professional | $79/mo | 2,000 | `price_1SjkQTBQ5QFS35pBpWkdi5ws` |
| Business | $199/mo | 5,000 | `price_1SjkR4BQ5QF535pBkhTJsxk2` |

### Webhook Events (5)
1. `checkout.session.completed`
2. `customer.subscription.created`
3. `customer.subscription.updated`
4. `customer.subscription.deleted`
5. `invoice.payment_failed`

### Webhook URL
```
https://www.jnxlabs.ai/api/stripe/webhook
```

---

## SaaS Installation Flow

### Corrected 14-Step Flow (Phase 5 SaaS)

```
┌─────────────────────────────────────────────────────────────┐
│ USER JOURNEY: Shopify App Installation                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. User opens installation link:                            │
│    https://www.jnxlabs.ai/api/qryx/install?shop=xxx         │
│                                                              │
│ 2. /api/qryx/install saves shop to session                  │
│    └── Uses JWT-encrypted cookie (30 min TTL)               │
│                                                              │
│ 3. Check: Is user authenticated?                            │
│    ├── YES → Redirect to /products/qryx/setup               │
│    └── NO  → Redirect to /login?redirect_url=...            │
│                                                              │
│ 4. User logs in via Clerk                                   │
│                                                              │
│ 5. Redirect to /products/qryx/setup                         │
│    └── Plan Selection: Starter/Professional/Business        │
│                                                              │
│ 6. User selects plan → Stripe Checkout                      │
│                                                              │
│ 7. After payment → Shopify OAuth triggered                  │
│    └── /api/qryx/start-oauth?shop=xxx                       │
│                                                              │
│ 8. Shopify OAuth Screen                                     │
│    └── User approves permissions                            │
│                                                              │
│ 9. Redirect to /api/qryx/callback                           │
│    └── currentUser() gets authenticated user                │
│    └── getUserByClerkId() gets JNX user                     │
│    └── upsertShopifyShop() links shop to EXISTING org       │
│                                                              │
│ 10. Shop Intelligence Analysis (Phase 5C)                   │
│     └── Gemini AI analyzes shop profile                     │
│     └── Stores in shop_intelligence JSONB                   │
│                                                              │
│ 11. Widget Installation on Shopify Store                    │
│                                                              │
│ 12. Redirect to /app/qryx (Dashboard)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### CRITICAL: Correct Installation URL

**USE THIS (SaaS Flow):**
```
https://www.jnxlabs.ai/api/qryx/install?shop=shopbotv3.myshopify.com
```

**NOT THIS (Old Direct OAuth):**
```
https://shopbotv3.myshopify.com/admin/oauth/authorize?...
```

---

## Shop Intelligence (Phase 5C)

### Database Extension
```sql
-- Added to shopify_shops table
shop_intelligence JSONB,  -- AI-analyzed shop profile
analyzed_at TIMESTAMPTZ,

-- GIN Index for JSONB queries
CREATE INDEX idx_shopify_shops_intelligence 
  ON shopify_shops USING GIN(shop_intelligence);
```

### Shop Intelligence Schema
```typescript
interface ShopIntelligence {
  business_type: string;      // 'fashion', 'electronics', etc.
  target_audience: string;    // 'millennials', 'professionals', etc.
  price_range: string;        // 'budget', 'mid-range', 'luxury'
  product_categories: string[];
  brand_voice: string;        // 'casual', 'professional', 'playful'
  key_selling_points: string[];
  recommended_greeting: string;
  upsell_strategies: string[];
  analyzed_at: string;        // ISO timestamp
}
```

### AI Integration
- **Model:** Gemini 2.0 Flash
- **Trigger:** After successful Shopify OAuth
- **Data Source:** Shop products, metadata, order history
- **Storage:** `shop_intelligence` JSONB column

---

## Logo Design System

### Component: `components/ui/jnx-logo.tsx`

```typescript
interface JNXLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'admin';
  animated?: boolean;
  className?: string;
}
```

### Color Variants
- **Default (Cyan/Blue):** User-facing pages
- **Admin (Purple/Pink):** Admin dashboard

### Integration Points
- Homepage header/footer
- QRYX product card
- User dashboard sidebar
- Admin dashboard sidebar

---

## Testing Guide

### Playwright Test Suite (24 Tests)

| Scenario | Tests | Status |
|----------|-------|--------|
| New User Flow | 6 | ✅ |
| Existing User Flow | 4 | ✅ |
| Session Expiry | 4 | ✅ |
| Payment Failure | 5 | ✅ |
| Webhook Retry | 5 | ✅ |

### Run Tests
```bash
cd /home/ubuntu/jnx-os/nextjs_space
yarn playwright test
```

### Test Cards (Stripe)
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

---

## Deployment Status

### Current Production
- **Domain:** https://www.jnxlabs.ai
- **Host:** Vercel
- **Last Deploy:** January 2, 2026
- **Git Branch:** main
- **Latest Commits:**
  - `d68489d` - Debug: Add extensive logging to /api/qryx/install
  - `e77c40b` - Fix: Async cookies() in shop-session
  - `76f2a19` - Fix: SaaS-Flow OAuth Callback for existing users

### Environment Variables (Vercel)
- ✅ `SHOPIFY_APP_URL=https://www.jnxlabs.ai`
- ✅ `SHOPIFY_API_KEY`
- ✅ `SHOPIFY_API_SECRET`
- ✅ `SHOPIFY_SCOPES`
- ✅ All Clerk, Supabase, Stripe keys

---

## Known Issues & Fixes

### Issue 1: "Missing required parameters" Error
**Status:** FIXED (commit `76f2a19`)

**Problem:** Old callback route tried to create NEW Clerk users instead of using existing authenticated user.

**Solution:** Rewrote `/api/qryx/callback` to use `currentUser()` and link shop to existing user/org.

### Issue 2: "Application error" on /api/qryx/install
**Status:** DEBUGGING (commit `d68489d`)

**Problem:** Server-side exception, possibly related to:
1. Async `cookies()` API in Next.js 14.2+
2. Session management
3. Authentication check

**Fix Applied:**
- Made `cookies()` async in `shop-session.ts`
- Added extensive logging to identify exact failure point
- Wrapped all operations in try-catch blocks

### Issue 3: Shopify Redirect URL Mismatch
**Status:** USER ACTION REQUIRED

**Problem:** Shopify Partners had old redirect URL.

**Fix:** In Shopify Partners Dashboard:
```
Allowed redirection URL(s):
https://www.jnxlabs.ai/api/qryx/callback
```

---

## File Structure

```
/home/ubuntu/jnx-os/
├── nextjs_space/
│   ├── app/
│   │   ├── api/
│   │   │   ├── qryx/
│   │   │   │   ├── install/route.ts      # ⚠️ Entry point (debugging)
│   │   │   │   ├── callback/route.ts     # ✅ Fixed for SaaS flow
│   │   │   │   ├── start-oauth/route.ts
│   │   │   │   ├── chat/route.ts
│   │   │   │   └── config/route.ts
│   │   │   ├── stripe/
│   │   │   │   ├── checkout/route.ts
│   │   │   │   └── webhook/route.ts
│   │   │   └── webhooks/clerk/route.ts
│   │   ├── app/
│   │   │   ├── page.tsx                  # Dashboard
│   │   │   ├── qryx/page.tsx             # Qryx management
│   │   │   ├── billing/page.tsx          # Billing (Phase 5B)
│   │   │   └── products/page.tsx
│   │   ├── products/qryx/setup/page.tsx  # Plan selection
│   │   └── admin/
│   ├── components/ui/
│   │   ├── jnx-logo.tsx                  # SVG Logo component
│   │   └── [...other components]
│   ├── lib/
│   │   ├── session/shop-session.ts       # ✅ Fixed async cookies()
│   │   ├── db/
│   │   │   ├── helpers.ts
│   │   │   ├── qryx-helpers.ts           # ✅ Added clerk_user_id support
│   │   │   └── billing-helpers.ts
│   │   ├── shopify/client.ts
│   │   ├── stripe/client.ts
│   │   └── ai/
│   │       ├── gemini.ts
│   │       └── shop-analyzer.ts          # Phase 5C
│   └── .env
├── docs/
└── scripts/
```

---

## Phase Roadmap

### Completed
- ✅ Phase 1-3: Foundation (Auth, DB, GDPR)
- ✅ Phase 4: Qryx Core (Shopify, AI Chat)
- ✅ Phase 5A: SaaS Billing (Stripe)
- ✅ Phase 5A++: Logo Integration
- ✅ Phase 5B: Billing Dashboard UI
- ✅ Phase 5C: Shop Intelligence (DB Migration Done)

### In Progress
- ⚠️ Phase 5C: Testing OAuth Flow

### Upcoming
- Phase 6: Enhanced Qryx Features
- Phase 7: Scale & Optimize

---

## Support

- **GitHub:** https://github.com/JNXLabs/jnx-os
- **Production:** https://www.jnxlabs.ai
- **Shopify Test Store:** shopbotv3.myshopify.com
- **Email:** support@jnxlabs.ai

---

**Document Version:** 2.2.0
**Last Updated:** January 2, 2026, 15:45 UTC
**Status:** ACTIVE DEBUGGING
