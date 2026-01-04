# Updated Documentation for New Conversation V3
**Version:** 3.0.0  
**Updated:** January 4, 2026  
**For**: Starting a new DeepAgent conversation with full context

---

## Quick Status

**Project**: JNX-OS v2 + Qryx (Shopify AI Sales Assistant)  
**Production URL**: https://www.jnxlabs.ai  
**Test Shop**: shopbotv3.myshopify.com  
**Status**: ✅ Active Development - Billing & Auth Working  
**Latest Commit**: febbc21 (Enterprise full-page auth for Shopify)

---

## Critical Context

### What's Working ✅
1. **Enterprise Auth System** (Clerk-based)
   - Full-page redirect for Shopify embedded apps
   - No third-party cookie issues
   - Robust error handling

2. **Stripe Billing** (Live Mode)
   - 4 pricing tiers: Free ($0), Starter ($29), Professional ($79), Business ($199)
   - 14-day free trial on paid plans
   - Automatic subscription management

3. **Shopify OAuth**
   - Installation flow complete
   - Store linking to JNX user
   - Access token management

4. **Database Schema** (Supabase PostgreSQL)
   - Clerk integration
   - Shop Intelligence (JSONB with GIN index)
   - Billing tracking

### What Was Just Fixed ✅

#### Issue 1: "You are signed out" in Shopify Admin
**Commit**: febbc21 (January 4, 2026)

**Problem**:
- Shopify loads Qryx in iframe
- Modern browsers block third-party cookies in iframes
- Clerk auth cannot work in this context
- Popup-based auth doesn't reliably sync sessions

**Solution**:
- Full-page redirect using `window.top.location.href`
- Breaks out of Shopify's iframe entirely
- User authenticates on jnxlabs.ai (no iframe = no cookie issues)
- After auth, redirects back to pricing page
- **This is the official Shopify-recommended approach**

**Files Changed**:
- `app/products/qryx/setup/page.tsx` - Auth detection & pricing
- `app/products/qryx/setup/embedded-auth-redirect.tsx` - NEW: Full-page redirect handler
- `app/login/[[...rest]]/page.tsx` - Redirect after login
- `app/signup/[[...rest]]/page.tsx` - Redirect after signup
- `app/products/qryx/setup/embedded-auth.tsx` - DELETED (old popup approach)

#### Issue 2: Shop Session Expiration
**Commits**: d7c3d84, 47e9dd6 (January 3, 2026)

**Problem**:
- Checkout route expected shop from session cookies
- Architecture changed to URL parameters
- "Shop session expired" errors

**Solution**:
- Shop passed as URL parameter throughout
- `app/api/stripe/checkout/route.ts` reads shop from form data
- Direct redirect to Stripe (not JSON response)
- `app/api/qryx/start-oauth/route.ts` reads shop from URL params

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14.2.28 (App Router)
- **Language**: TypeScript 5.2.2
- **Styling**: Tailwind CSS 3.3.3
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Package Manager**: Yarn

### Backend
- **Auth**: Clerk
- **Database**: Supabase (PostgreSQL)
- **AI**: Gemini 2.0 Flash
- **Payments**: Stripe (Live Mode)
- **E-commerce**: Shopify

### Infrastructure
- **Hosting**: Vercel
- **Domain**: www.jnxlabs.ai
- **Repository**: github.com/JNXLabs/jnx-os

---

## Project Structure

```
/home/ubuntu/jnx-os/
├── nextjs_space/              # Next.js application
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # Deprecated (use Clerk directly)
│   │   │   ├── qryx/           # Qryx API endpoints
│   │   │   │   ├── install/    # Install entry point
│   │   │   │   ├── callback/   # OAuth callback
│   │   │   │   ├── start-oauth/ # Payment verification + OAuth
│   │   │   │   ├── chat/       # Chat API
│   │   │   │   └── config/     # Widget config
│   │   │   ├── stripe/         # Stripe integration
│   │   │   │   ├── checkout/   # Create checkout session
│   │   │   │   └── webhook/    # Stripe webhook handler
│   │   │   └── webhooks/
│   │   │       └── clerk/      # Clerk webhook
│   │   ├── products/qryx/
│   │   │   └── setup/          # Pricing & plan selection
│   │   │       ├── page.tsx    # Main pricing page
│   │   │       └── embedded-auth-redirect.tsx  # Auth handler
│   │   ├── login/          # Clerk login
│   │   └── signup/         # Clerk signup
│   ├── lib/
│   │   ├── auth/           # Auth utilities
│   │   ├── db/             # Database helpers
│   │   ├── stripe/         # Stripe client
│   │   ├── shopify/        # Shopify API
│   │   └── ai/             # Gemini integration
│   └── middleware.ts       # Clerk auth middleware
├── docs/                   # Architecture & guides
└── *.md                    # Project documentation
```

---

## Installation Flows

### Scenario 1: Direct Browser Link
```
User clicks: https://www.jnxlabs.ai/api/qryx/install?shop=xxx
↓
/api/qryx/install detects no auth
↓
Redirect to /products/qryx/setup?shop=xxx
↓
Server-side checks currentUser()
↓
No user → Render EmbeddedAuthRedirect component
↓
User clicks "Continue to Sign In"
↓
Redirect to /login?redirect_url=/products/qryx/setup?shop=xxx
↓
Clerk login completes
↓
Redirect back to /products/qryx/setup?shop=xxx
↓
Show pricing page (4 plans)
↓
User selects plan → Payment → Shopify OAuth → Done
```

### Scenario 2: Shopify Admin Embedded
```
User opens Qryx in Shopify Admin (iframe)
↓
App detects iframe context (window.self !== window.top)
↓
Shows "Sign In to Continue" UI
↓
User clicks button
↓
window.top.location.href = '/login?redirect_url=...'
↓
FULL BROWSER navigates to login (exits iframe)
↓
No third-party cookie issues
↓
Clerk login completes
↓
Redirect to /products/qryx/setup?shop=xxx
↓
Show pricing page
↓
User selects plan → Payment → Shopify OAuth → Done
```

**Key Difference**: Scenario 2 uses `window.top.location.href` to break out of the iframe.

---

## Database Schema

### Table: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  org_id UUID REFERENCES orgs(id),
  role TEXT DEFAULT 'member',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: shopify_shops
```sql
CREATE TABLE shopify_shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scope TEXT NOT NULL,
  
  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'free',
  plan_name TEXT DEFAULT 'free',
  current_period_end TIMESTAMPTZ,
  
  -- Shop Intelligence (Phase 5C)
  shop_intelligence JSONB,
  analyzed_at TIMESTAMPTZ,
  
  -- User Association
  clerk_user_id TEXT REFERENCES users(clerk_user_id),
  
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shops_clerk_user ON shopify_shops(clerk_user_id);
CREATE INDEX idx_shops_stripe_customer ON shopify_shops(stripe_customer_id);
CREATE INDEX idx_shops_intelligence ON shopify_shops USING GIN (shop_intelligence);
```

---

## Environment Variables

### Required
```env
# Clerk (Auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Stripe (Live Mode)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_BUSINESS=price_...

# Shopify
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_SCOPES=read_products,read_orders,write_script_tags
SHOPIFY_APP_URL=https://www.jnxlabs.ai

# Gemini AI
GEMINI_API_KEY=AIza...
```

---

## Recent Commits

### febbc21 (January 4, 2026)
**Enterprise: Full-page auth redirect for Shopify embedded apps**
- Replaced popup-based auth with full-page redirect
- Created `embedded-auth-redirect.tsx` for iframe detection
- Updated login/signup to handle redirect_url
- Deleted old `embedded-auth.tsx` (popup approach)
- **Fixes**: "You are signed out" error in Shopify Admin

### 1e6403f (January 4, 2026)
**Fix: Improved embedded auth with session sync retry logic**
- Added `/api/auth/check` endpoint
- Implemented retry logic with exponential backoff
- Enhanced postMessage handling
- **Status**: Deprecated by febbc21 (popup approach replaced)

### ce1482f (January 4, 2026)
**Add embedded auth support for Shopify Admin iframe**
- Initial popup-based auth implementation
- **Status**: Deprecated by febbc21

### 47e9dd6 (January 3, 2026)
**Fix: Redirect to Stripe instead of JSON response**
- Changed checkout route to redirect directly
- **Fixes**: Form POST not redirecting to Stripe

### d7c3d84 (January 3, 2026)
**Fix: Checkout uses shop from form data instead of session**
- Removed dependency on shop session cookies
- Shop passed as URL parameter
- **Fixes**: "Shop session expired" errors

---

## Testing Checklist

### Auth Flow
- [ ] Direct browser access works
- [ ] Shopify Admin iframe shows "Sign In to Continue"
- [ ] Full-page redirect to login works
- [ ] After login, pricing page loads
- [ ] No "You are signed out" errors

### Billing Flow
- [ ] Free plan installs without Stripe
- [ ] Paid plan redirects to Stripe Checkout
- [ ] Payment completes successfully
- [ ] Redirects back to OAuth flow
- [ ] Subscription created in database

### OAuth Flow
- [ ] Shopify permissions page loads
- [ ] User grants permissions
- [ ] Callback creates shop record
- [ ] Shop linked to clerk_user_id
- [ ] Access token stored securely

---

## Known Issues

### None Currently
All critical issues resolved as of January 4, 2026.

---

## Next Steps

### Phase 5C: Shop Intelligence (In Progress)
- [x] Database schema (shop_intelligence JSONB column)
- [x] GIN index for performance
- [ ] AI analysis of shop data
- [ ] Intelligence display in dashboard

### Phase 6: Widget Customization
- [ ] Color picker
- [ ] Position selector
- [ ] Custom greeting messages
- [ ] Advanced styling options

### Phase 7: Analytics Dashboard
- [ ] Conversation metrics
- [ ] Conversion tracking
- [ ] A/B test results
- [ ] Export reports

---

## Documentation Files

### Primary
1. **JNX_OS_MASTER_DOCUMENTATION_V3.md** - Complete system overview
2. **STRIPE_SETUP_GUIDE_V3.md** - Billing setup
3. **UPDATED_DOCS_FOR_NEW_CONVERSATION_V3.md** - This file

### Architecture
4. **docs/ARCHITECTURE.md** - System design
5. **docs/BACKEND_CONTRACT.md** - Code guidelines
6. **docs/QRYX_SHOPIFY_ARCHITECTURE.md** - Qryx-specific design

### Setup & Deployment
7. **VERCEL_DEPLOYMENT_CHECKLIST.md** - Production deploy
8. **VERCEL_ENV_SETUP_GUIDE.md** - Environment config
9. **docs/CLERK_SETUP.md** - Auth setup

### Historical
10. **DELIVERY_SUMMARY.md** - Enterprise auth rebuild
11. **PHASE5A_COMPLETION_SUMMARY.md** - Billing implementation
12. **PHASE5B_COMPLETION_SUMMARY.md** - Dashboard UI

---

## Quick Commands

### Development
```bash
cd /home/ubuntu/jnx-os/nextjs_space
yarn dev  # Start dev server on localhost:3000
```

### Build
```bash
cd /home/ubuntu/jnx-os/nextjs_space
yarn build
```

### Deploy
```bash
cd /home/ubuntu/jnx-os
git add -A
git commit -m "Your message"
git push origin main
# Vercel auto-deploys
```

### Database
```sql
-- Check shops
SELECT shop, clerk_user_id, plan_name, subscription_status 
FROM shopify_shops 
ORDER BY installed_at DESC;

-- Check users
SELECT email, full_name, role 
FROM users 
WHERE deleted_at IS NULL;
```

---

## Support Contacts

**Technical Issues**: jonathan@jnxlabs.ai  
**Billing Questions**: Stripe Dashboard → Logs  
**Auth Issues**: Clerk Dashboard → Users  
**Database**: Supabase Dashboard → SQL Editor

---

**Version**: 3.0.0  
**Last Updated**: January 4, 2026  
**Status**: ✅ Current  
**Latest Commit**: febbc21
