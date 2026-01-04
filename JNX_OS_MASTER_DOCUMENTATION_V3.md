# JNX-OS Master Documentation V3
**Version:** 3.0.0  
**Updated:** January 4, 2026  
**Status:** Production (with Enterprise Auth)

---

## Executive Summary

**JNX-OS** is an enterprise-grade SaaS foundation powering **Qryx**, a Shopify AI Sales Assistant.

### Stack
- **Frontend**: Next.js 14.2 (App Router), TypeScript, Tailwind CSS
- **Auth**: Clerk (with full-page redirect for embedded apps)
- **Database**: Supabase PostgreSQL
- **AI**: Gemini 2.0 Flash
- **Payments**: Stripe (Live Mode, 4 pricing tiers)
- **E-commerce**: Shopify OAuth
- **Hosting**: Vercel
- **Domain**: www.jnxlabs.ai

### Production URLs
- **Main App**: https://www.jnxlabs.ai
- **Shopify Install**: https://www.jnxlabs.ai/api/qryx/install?shop=XXX
- **Test Shop**: shopbotv3.myshopify.com

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Installation Flows](#installation-flows)
3. [Authentication](#authentication)
4. [Billing & Subscriptions](#billing--subscriptions)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Environment Variables](#environment-variables)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)
11. [Recent Updates](#recent-updates)

---

## System Architecture

### High-Level Flow

```
Customer's Shopify Store
        ↓
    [Install Qryx]
        ↓
Authentication Flow (Full-Page Redirect)
        ↓
Plan Selection (Free/$29/$79/$199)
        ↓
    [Free Plan]            [Paid Plan]
        ↓                      ↓
        ↓              Stripe Checkout
        ↓                      ↓
        ↓              Payment Success
        ↓                      ↓
        └──────→ Shopify OAuth ←───────┘
                      ↓
              Grant Permissions
                      ↓
                Install App
                      ↓
          Link to JNX User (clerk_user_id)
                      ↓
                Widget Active
```

### Component Layers

1. **Presentation Layer**
   - Next.js App Router pages
   - React Server Components
   - Client components for interactivity
   - Tailwind CSS + shadcn/ui

2. **Authentication Layer**
   - Clerk for user management
   - Full-page redirect for embedded contexts
   - Session management via cookies
   - Middleware for route protection

3. **Business Logic Layer**
   - API routes in `/app/api`
   - Database helpers in `/lib/db`
   - AI integration in `/lib/ai`
   - Shopify client in `/lib/shopify`

4. **Data Layer**
   - Supabase PostgreSQL
   - Real-time subscriptions
   - Row-level security
   - JSONB for flexible data

5. **External Integrations**
   - Stripe for billing
   - Shopify for e-commerce
   - Gemini for AI responses
   - Clerk for webhooks

---

## Installation Flows

### Flow 1: Direct Browser Installation

**Scenario**: User clicks install link directly in browser

```
1. User navigates to:
   https://www.jnxlabs.ai/api/qryx/install?shop=example.myshopify.com

2. /api/qryx/install:
   - Validates shop parameter
   - Redirects to /products/qryx/setup?shop=example.myshopify.com

3. /products/qryx/setup:
   - Server-side: await currentUser()
   - If no user → Render EmbeddedAuthRedirect component
   
4. EmbeddedAuthRedirect:
   - Detects NOT in iframe (window.self === window.top)
   - Shows "Sign In to Continue" UI
   - User clicks → redirect to /login?redirect_url=...

5. /login:
   - Clerk handles authentication
   - After success → window.location.href = redirect_url
   
6. Back to /products/qryx/setup?shop=example.myshopify.com:
   - Server-side: await currentUser() ✓
   - Renders pricing page with 4 plans

7. User selects plan:
   - Free → /api/qryx/start-oauth?shop=xxx&plan=free
   - Paid → POST /api/stripe/checkout with priceId
   
8a. Free Plan Path:
   - /api/qryx/start-oauth generates Shopify OAuth URL
   - No Stripe verification
   - Direct to Shopify permissions

8b. Paid Plan Path:
   - Stripe creates Customer + Checkout Session
   - User completes payment
   - Success redirect: /api/qryx/start-oauth?shop=xxx&session_id=xxx
   - Verify session with Stripe API
   - Generate Shopify OAuth URL

9. Shopify OAuth:
   - User grants permissions
   - Redirect to /api/qryx/callback?code=xxx&shop=xxx
   
10. /api/qryx/callback:
    - Exchange code for access token
    - Create/update shopify_shops record
    - Link to clerk_user_id
    - Store subscription info
    - Redirect to shop admin
    
11. Installation Complete:
    - Widget appears on storefront
    - Merchant sees app in Shopify Admin
```

### Flow 2: Shopify Admin Embedded Installation

**Scenario**: User installs from Shopify Admin (iframe context)

```
1. Merchant in Shopify Admin → Apps → Add App → Qryx

2. Shopify loads:
   https://www.jnxlabs.ai/api/qryx/install?shop=example.myshopify.com
   (Inside iframe)

3. /api/qryx/install → Redirect to /products/qryx/setup

4. /products/qryx/setup loads in iframe:
   - Server-side: await currentUser() = null
   - Renders EmbeddedAuthRedirect component
   
5. EmbeddedAuthRedirect (Client-side):
   - Detects iframe: window.self !== window.top
   - Shows "Sign In to Continue" UI
   - Explains: "For security, auth opens in new window"
   
6. User clicks "Continue to Sign In":
   - Executes: window.top.location.href = '/login?redirect_url=...'
   - CRITICAL: Uses window.top, not window.location
   - This navigates the ENTIRE BROWSER, breaking out of iframe
   
7. Browser navigates to login page:
   - User is now on jnxlabs.ai/login (NOT in iframe)
   - No third-party cookie restrictions
   - Clerk auth works normally
   
8. After successful login:
   - window.location.href = redirect_url
   - Returns to /products/qryx/setup?shop=xxx
   
9. Pricing page loads:
   - Server-side: await currentUser() ✓
   - User is authenticated
   - Shows 4 pricing plans
   
10-11. Same as Flow 1 (steps 7-11)
```

**Why This Works**:
- Third-party cookies are blocked in iframes (Safari, Chrome, Firefox, all browsers)
- `window.top.location.href` breaks out of the iframe
- User authenticates on jnxlabs.ai without iframe restrictions
- After auth, session cookies are set on jnxlabs.ai domain
- Subsequent requests have valid auth

**Alternative Approaches (That Don't Work)**:
- ❌ Popup window: Session doesn't sync reliably
- ❌ postMessage: Can't transfer cookies across origins
- ❌ iframe auth: Third-party cookies blocked
- ✅ Full-page redirect: Official Shopify recommendation

---

## Authentication

### Clerk Integration

**Provider**: Clerk (https://clerk.com)  
**Mode**: Production  
**Strategy**: Full-page redirect for embedded contexts

### Implementation

#### Middleware Protection
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/qryx/install(.*)',
  '/api/qryx/callback(.*)',
  '/api/stripe/webhook(.*)',
  '/login(.*)',
  '/signup(.*)',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware((auth, req) => {
  const { sessionClaims } = auth();
  
  // Admin check
  if (isAdminRoute(req)) {
    const role = sessionClaims?.publicMetadata?.role;
    if (role !== 'admin') {
      return Response.redirect(new URL('/app', req.url));
    }
  }
  
  // Public routes
  if (isPublicRoute(req)) return;
  
  // Protected routes require auth
  auth().protect();
});
```

#### Server-Side Auth Check
```typescript
// app/products/qryx/setup/page.tsx
import { currentUser } from '@clerk/nextjs/server';

export default async function QryxSetupPage({ searchParams }) {
  const shop = searchParams?.shop;
  const user = await currentUser();
  
  if (!user) {
    return <EmbeddedAuthRedirect shop={shop} />;
  }
  
  // Show pricing
  return <PricingPage shop={shop} />;
}
```

#### Embedded Auth Handler
```typescript
// app/products/qryx/setup/embedded-auth-redirect.tsx
'use client';

export function EmbeddedAuthRedirect({ shop }) {
  const [isInIframe, setIsInIframe] = useState(null);
  
  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);
  
  const handleAuth = () => {
    const returnUrl = `/products/qryx/setup?shop=${shop}`;
    const authUrl = `/login?redirect_url=${encodeURIComponent(returnUrl)}`;
    
    if (isInIframe) {
      // Break out of iframe
      window.top.location.href = authUrl;
    } else {
      window.location.href = authUrl;
    }
  };
  
  return (
    <div>
      <h1>Sign In to Continue</h1>
      <p>To install Qryx on {shop}, please sign in.</p>
      <button onClick={handleAuth}>Continue to Sign In</button>
    </div>
  );
}
```

#### Login with Redirect
```typescript
// app/login/[[...rest]]/page.tsx
'use client';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect_url');
  const { isSignedIn, isLoaded } = useUser();
  
  useEffect(() => {
    if (isLoaded && isSignedIn && redirectUrl) {
      window.location.href = decodeURIComponent(redirectUrl);
    }
  }, [isLoaded, isSignedIn, redirectUrl]);
  
  return <SignIn routing="path" path="/login" />;
}
```

### User Roles

- **member**: Default role, access to own dashboard
- **admin**: Full system access, can manage all users

**Setting Roles**: Clerk Dashboard → Users → User → Metadata → Public → `{ "role": "admin" }`

---

## Billing & Subscriptions

### Pricing Tiers

| Plan | Price | Conversations | Features |
|------|-------|---------------|----------|
| **Free** | $0/mo | 50 | Basic widget, community support |
| **Starter** | $29/mo | 500 | Full customization, email support (24h) |
| **Professional** | $79/mo | 2,000 | Advanced analytics, A/B testing, priority support (4h) |
| **Business** | $199/mo | 5,000 | White label, phone support, custom integrations |

**All paid plans include 14-day free trial**

### Stripe Setup

#### Products in Stripe Dashboard
1. Create 3 products (Starter, Professional, Business)
2. Set monthly recurring billing
3. Enable 14-day free trial
4. Copy Price IDs (price_xxx)

#### Webhook Configuration
- **URL**: https://www.jnxlabs.ai/api/stripe/webhook
- **Events**:
  - checkout.session.completed
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_succeeded
  - invoice.payment_failed

#### Environment Variables
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_BUSINESS=price_...
```

### Checkout Flow

#### Create Session
```typescript
// app/api/stripe/checkout/route.ts
export async function POST(req: Request) {
  const formData = await req.formData();
  const shop = formData.get('shop') as string;
  const priceId = formData.get('priceId') as string;
  
  // Create/get customer
  let customerId = await getStripeCustomerByShop(shop);
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { shop, clerk_user_id: user.id },
    });
    customerId = customer.id;
  }
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { shop },
    },
    success_url: `${baseUrl}/api/qryx/start-oauth?shop=${shop}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/products/qryx/setup?shop=${shop}`,
  });
  
  // Redirect to Stripe
  return NextResponse.redirect(session.url);
}
```

#### Webhook Handler
```typescript
// app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    // ... other events
  }
  
  return NextResponse.json({ received: true });
}
```

### Free Plan Handling

**No Stripe involvement**:
- User clicks "Start Free" button
- Direct link: `/api/qryx/start-oauth?shop=xxx&plan=free`
- Route skips Stripe verification
- Goes straight to Shopify OAuth
- Database record created with `plan_name='free'`, `subscription_status='free'`

---

## Database Schema

### Core Tables

#### users
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

CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

#### orgs
```sql
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id TEXT UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orgs_clerk_org_id ON orgs(clerk_org_id);
```

#### shopify_shops
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
  clerk_user_id TEXT REFERENCES users(clerk_user_id) ON DELETE SET NULL,
  
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shops_shop ON shopify_shops(shop);
CREATE INDEX idx_shops_clerk_user ON shopify_shops(clerk_user_id);
CREATE INDEX idx_shops_stripe_customer ON shopify_shops(stripe_customer_id);
CREATE INDEX idx_shops_subscription ON shopify_shops(stripe_subscription_id);
CREATE INDEX idx_shops_intelligence ON shopify_shops USING GIN (shop_intelligence);
```

### Subscription Statuses

- `free`: Free plan, no Stripe
- `trialing`: 14-day trial active
- `active`: Paid subscription active
- `past_due`: Payment failed, retry pending
- `canceled`: Subscription canceled by user
- `unpaid`: Multiple payment failures

---

## API Endpoints

### Authentication

#### POST /api/webhooks/clerk
**Purpose**: Sync Clerk users/orgs to Supabase  
**Auth**: Clerk webhook signature  
**Events**: user.created, user.updated, organization.*

### Qryx Installation

#### GET /api/qryx/install
**Purpose**: Entry point for Shopify app installation  
**Query**: `?shop=example.myshopify.com`  
**Flow**: Redirects to /products/qryx/setup?shop=xxx

#### GET /products/qryx/setup
**Purpose**: Display pricing plans, handle auth  
**Query**: `?shop=example.myshopify.com`  
**Auth**: Server-side currentUser() check  
**Output**: 
- If no user → EmbeddedAuthRedirect component
- If user → Pricing page

#### GET /api/qryx/start-oauth
**Purpose**: Verify payment & start Shopify OAuth  
**Query**: 
- Free: `?shop=xxx&plan=free`
- Paid: `?shop=xxx&session_id=cs_xxx`

**Flow**:
```typescript
if (plan === 'free') {
  // No Stripe verification
  const oauthUrl = generateShopifyOAuthUrl(shop);
  return redirect(oauthUrl);
}

// Paid plan: verify Stripe session
const session = await stripe.checkout.sessions.retrieve(sessionId);
if (session.payment_status !== 'paid') {
  return error('Payment not completed');
}

const oauthUrl = generateShopifyOAuthUrl(shop);
return redirect(oauthUrl);
```

#### GET /api/qryx/callback
**Purpose**: Handle Shopify OAuth callback  
**Query**: `?code=xxx&shop=xxx`

**Flow**:
1. Exchange code for access token
2. Get shop details from Shopify API
3. Create/update shopify_shops record:
   ```typescript
   {
     shop,
     access_token,
     scope,
     clerk_user_id: currentUser().id,
     // Stripe info from session or webhook
   }
   ```
4. Redirect to Shopify Admin

### Stripe Integration

#### POST /api/stripe/checkout
**Purpose**: Create Stripe Checkout Session  
**Body**: FormData with shop, priceId, planName  
**Output**: Redirect to Stripe Checkout

#### POST /api/stripe/webhook
**Purpose**: Handle Stripe events  
**Auth**: Stripe signature verification  
**Events**: checkout, subscription, invoice events

### Qryx Chat

#### POST /api/qryx/chat
**Purpose**: Handle customer chat messages  
**Body**: `{ shop, message, conversationId? }`  
**Auth**: Widget token (stored in shopify_shops)  
**Flow**:
1. Validate shop & token
2. Check conversation limit (based on plan)
3. Fetch shop intelligence + products
4. Generate AI response with Gemini
5. Return response + suggestions

#### GET /api/qryx/config
**Purpose**: Get widget configuration  
**Query**: `?shop=xxx`  
**Output**: Theme colors, greeting, enabled features

---

## Environment Variables

### Clerk (Required)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

### Supabase (Required)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

### Stripe (Required for Billing)
```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_BUSINESS=price_...
```

### Shopify (Required)
```env
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_SCOPES=read_products,read_orders,write_script_tags
SHOPIFY_APP_URL=https://www.jnxlabs.ai
```

### Gemini AI (Required)
```env
GEMINI_API_KEY=AIza...
```

---

## Deployment

### Vercel

**Repository**: github.com/JNXLabs/jnx-os  
**Branch**: main  
**Auto-deploy**: ✅ Enabled

#### Checklist

1. **Environment Variables**:
   - Add all required env vars in Vercel Dashboard
   - Select: Production, Preview, Development

2. **Build Command**: `cd nextjs_space && yarn build`

3. **Install Command**: `cd nextjs_space && yarn install`

4. **Output Directory**: `nextjs_space/.next`

5. **Node Version**: 18.x

6. **Custom Domain**:
   - Add www.jnxlabs.ai in Vercel
   - Update DNS records at registrar

### Post-Deploy Verification

1. **Auth**: Sign up, sign in, session persistence
2. **Billing**: Free plan install, paid plan checkout
3. **OAuth**: Shopify permissions, callback handling
4. **Widget**: Appears on storefront, responds to queries
5. **Webhooks**: Clerk events, Stripe events

---

## Testing

### Local Development

```bash
cd /home/ubuntu/jnx-os/nextjs_space
yarn dev
# Opens on localhost:3000
```

### Test Scenarios

#### 1. Direct Installation (Browser)
```
1. Open: http://localhost:3000/api/qryx/install?shop=shopbotv3.myshopify.com
2. Redirect to setup page
3. Click "Continue to Sign In"
4. Login with test account
5. Select Free plan
6. Grant Shopify permissions
7. ✓ App installed
```

#### 2. Embedded Installation (Shopify Admin)
**Note**: Requires ngrok for local testing

```
1. ngrok http 3000
2. Update SHOPIFY_APP_URL to ngrok URL
3. Open Shopify Admin → Apps → Qryx
4. See "Sign In to Continue"
5. Click button → navigates to login (full page)
6. Login → returns to setup
7. Select plan → complete flow
8. ✓ App installed
```

#### 3. Paid Plan Checkout
```
1. Follow scenario 1 or 2 to setup page
2. Click "Subscribe Now" on Starter plan
3. Use Stripe test card: 4242 4242 4242 4242
4. Complete payment
5. Redirects back to OAuth
6. ✓ Subscription created
```

#### 4. Chat Widget
```
1. Install app on test shop
2. Open storefront: shopbotv3.myshopify.com
3. Widget appears bottom-right
4. Type message
5. ✓ AI responds with product recommendations
```

---

## Troubleshooting

### "You are signed out" Error

**Status**: ✅ FIXED (Commit: febbc21)

**Previous Issue**: 
- Popup-based auth didn't sync sessions
- Third-party cookies blocked in iframes

**Current Solution**:
- Full-page redirect using `window.top.location.href`
- Breaks out of Shopify iframe
- Auth works on jnxlabs.ai domain without restrictions

**To Verify Fix**:
```bash
git log --oneline | head -3
# Should show: febbc21 Enterprise: Full-page auth redirect
```

### "Shop session expired" Error

**Status**: ✅ FIXED (Commits: d7c3d84, 47e9dd6)

**Previous Issue**:
- Checkout route expected shop from session cookies
- Session-based architecture replaced with URL params

**Current Solution**:
- Shop passed as URL parameter throughout
- No dependency on cookies for shop identification

### Stripe Checkout 403 Error

**Cause**: Invalid Price ID or Stripe account issue

**Fix**:
1. Verify Live Mode enabled in Stripe
2. Check Price IDs in Vercel env vars match Stripe
3. Ensure webhook endpoint is active
4. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Widget Not Appearing

**Causes**:
1. Script tag not installed
2. Shop not in database
3. Access token expired

**Debug**:
```sql
-- Check shop exists
SELECT * FROM shopify_shops WHERE shop = 'example.myshopify.com';

-- Check script tags
-- Use Shopify API: GET /admin/api/2024-01/script_tags.json
```

---

## Recent Updates

### January 4, 2026

#### Commit: febbc21 - Enterprise Auth for Embedded Apps

**Problem Solved**:
- Third-party cookies blocked in all browsers
- Clerk auth cannot work in Shopify Admin iframes
- Popup windows don't reliably sync sessions

**Solution Implemented**:
- Full-page redirect authentication
- `window.top.location.href` breaks out of iframe
- User authenticates on jnxlabs.ai (no cookie issues)
- Redirects back to pricing after auth

**Files Changed**:
- `app/products/qryx/setup/page.tsx` - Server auth check
- `app/products/qryx/setup/embedded-auth-redirect.tsx` - NEW
- `app/login/[[...rest]]/page.tsx` - Redirect support
- `app/signup/[[...rest]]/page.tsx` - Redirect support
- `app/products/qryx/setup/embedded-auth.tsx` - DELETED

**Testing Passed**:
- ✅ Direct browser installation
- ✅ Shopify Admin embedded installation
- ✅ Free plan checkout
- ✅ Paid plan Stripe redirect
- ✅ OAuth callback
- ✅ Widget activation

### January 3, 2026

#### Commits: d7c3d84, 47e9dd6 - Shop Session Fixes

**Issues Fixed**:
1. Checkout route expected shop from session cookies
2. JSON response instead of redirect to Stripe

**Solutions**:
1. Shop read from form data, passed in URL params
2. Direct redirect to Stripe Checkout (not JSON)

**Files Changed**:
- `app/api/stripe/checkout/route.ts`
- `app/api/qryx/start-oauth/route.ts`

---

## Documentation Index

### Primary Docs
1. **JNX_OS_MASTER_DOCUMENTATION_V3.md** (this file) - Complete overview
2. **STRIPE_SETUP_GUIDE_V3.md** - Billing configuration
3. **UPDATED_DOCS_FOR_NEW_CONVERSATION_V3.md** - Context for new chats

### Architecture
4. **docs/ARCHITECTURE.md** - System design patterns
5. **docs/QRYX_SHOPIFY_ARCHITECTURE.md** - Qryx-specific design
6. **docs/BACKEND_CONTRACT.md** - Code guidelines

### Setup Guides
7. **VERCEL_DEPLOYMENT_CHECKLIST.md** - Production deploy
8. **VERCEL_ENV_SETUP_GUIDE.md** - Environment config
9. **docs/CLERK_SETUP.md** - Auth setup

### Historical
10. **DELIVERY_SUMMARY.md** - Enterprise auth rebuild
11. **PHASE5A_COMPLETION_SUMMARY.md** - Billing implementation
12. **PHASE5B_COMPLETION_SUMMARY.md** - Dashboard UI

---

## Support

**Technical Issues**: jonathan@jnxlabs.ai  
**Stripe Dashboard**: https://dashboard.stripe.com  
**Clerk Dashboard**: https://dashboard.clerk.com  
**Supabase Dashboard**: https://supabase.com/dashboard

---

**Version**: 3.0.0  
**Last Updated**: January 4, 2026  
**Status**: ✅ Production Ready  
**Latest Commit**: febbc21
