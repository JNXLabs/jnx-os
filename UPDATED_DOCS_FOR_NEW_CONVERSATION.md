# Updated Documentation for New Conversation

**Created:** January 2, 2026, 15:45 UTC
**Purpose:** Comprehensive reference for continuing JNX-OS development
**Status:** ACTIVE DEBUGGING SESSION

---

## 🚨 CURRENT STATUS: Active Debugging

### Issue Being Debugged
**Route:** `/api/qryx/install?shop=shopbotv3.myshopify.com`
**Error:** "Application error: a server-side exception has occurred"
**Digest:** 4057891335

### Fixes Already Applied

1. **Commit `76f2a19`:** OAuth Callback for SaaS Flow
   - Callback now uses `currentUser()` instead of creating new users
   - Links shop to EXISTING user/org
   - Added `clerk_user_id` to `upsertShopifyShop()`

2. **Commit `e77c40b`:** Async Cookies API
   - Fixed `cookies()` to be async for Next.js 14.2+
   - Updated `setShopSession()`, `getShopSession()`, `clearShopSession()`

3. **Commit `d68489d`:** Debug Logging
   - Added extensive logging to `/api/qryx/install`
   - Removed external dependency (inline `isValidShop`)
   - Non-blocking error handling for session and auth

### Next Steps
1. Wait for Vercel deployment (~2 min)
2. Test: `https://www.jnxlabs.ai/api/qryx/install?shop=shopbotv3.myshopify.com`
3. If still failing, check Vercel Function Logs
4. Look for `[Qryx Install]` log entries

---

## ✅ What's Working

### Phase 5A++ (Complete)
- ✅ Stripe Live Mode billing (3 tiers: $29/$79/$199)
- ✅ Stripe webhook handler (5 events)
- ✅ Native SVG Logo component
- ✅ User/Admin dashboards with mobile responsiveness
- ✅ Clerk authentication
- ✅ Supabase database (9 tables)

### Phase 5B (Complete)
- ✅ Billing Dashboard UI (`/app/billing`)
- ✅ Usage tracking endpoints
- ✅ Plan management APIs

### Phase 5C (DB Complete, Testing Flow)
- ✅ Shop Intelligence database migration
- ✅ `shop_intelligence` JSONB column added
- ✅ `analyzed_at` timestamp column added
- ✅ GIN index for JSONB queries
- ⚠️ OAuth flow testing in progress

---

## 🔧 Key Files Modified (Jan 2, 2026)

### `/app/api/qryx/callback/route.ts`
**Change:** Complete rewrite for SaaS flow
```typescript
// Now uses:
import { currentUser } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/lib/db/helpers';

// Instead of creating new users, it:
const clerkUser = await currentUser();
const jnxUser = await getUserByClerkId(clerkUser.id);
await upsertShopifyShop({
  org_id: jnxUser.org_id,
  clerk_user_id: clerkUser.id,
  // ... shop data
});
```

### `/app/api/qryx/install/route.ts`
**Change:** Debug version with extensive logging
```typescript
export async function GET(request: NextRequest) {
  console.log('[Qryx Install] === START ===');
  
  // Non-blocking session save
  try {
    await setShopSession(shop);
  } catch (sessionError) {
    console.error('[Qryx Install] Session save error:', sessionError);
    // Continue anyway
  }
  
  // Non-blocking auth check
  let user = null;
  try {
    user = await currentUser();
  } catch (authError) {
    console.error('[Qryx Install] Auth check error:', authError);
  }
  
  // Redirect based on auth status
  const baseUrl = 'https://www.jnxlabs.ai';
  if (user) {
    return NextResponse.redirect(`${baseUrl}/products/qryx/setup`);
  } else {
    return NextResponse.redirect(`${baseUrl}/login?redirect_url=/products/qryx/setup`);
  }
}
```

### `/lib/session/shop-session.ts`
**Change:** Async cookies() for Next.js 14.2+
```typescript
// Before:
cookies().set(COOKIE_NAME, token, {...});

// After:
const cookieStore = await cookies();
cookieStore.set(COOKIE_NAME, token, {...});
```

### `/lib/db/qryx-helpers.ts`
**Change:** Added `clerk_user_id` parameter
```typescript
export async function upsertShopifyShop(data: {
  org_id: string;
  clerk_user_id?: string;  // NEW: For user-based billing
  shop_domain: string;
  // ...
})
```

---

## 📋 Correct SaaS Installation Flow

### USE THIS URL:
```
https://www.jnxlabs.ai/api/qryx/install?shop=shopbotv3.myshopify.com
```

### DO NOT USE:
```
https://shopbotv3.myshopify.com/admin/oauth/authorize?...
```

### Expected Flow:
```
1. /api/qryx/install?shop=xxx
   ├── Save shop to session
   ├── Check auth status
   └── Redirect to login OR setup

2. /login (if not authenticated)
   └── Clerk login

3. /products/qryx/setup
   └── Select plan (Starter/Professional/Business)

4. Stripe Checkout
   └── Payment

5. /api/qryx/start-oauth
   └── Trigger Shopify OAuth

6. Shopify OAuth Screen
   └── Approve permissions

7. /api/qryx/callback
   ├── Get authenticated user (currentUser)
   ├── Get JNX user (getUserByClerkId)
   ├── Link shop to existing org (upsertShopifyShop)
   └── Save shop session

8. /app/qryx (Dashboard)
```

---

## 🔑 Environment Variables

### Vercel (Production) - VERIFIED
```
SHOPIFY_APP_URL=https://www.jnxlabs.ai  ✅
SHOPIFY_API_KEY=6e62aef5f8013048ca5b446fa86c6fae  ✅
SHOPIFY_API_SECRET=shpss_xxxxx  ✅
SHOPIFY_SCOPES=read_products,read_product_listings,read_customers,read_orders  ✅
```

### Shopify Partners - NEEDS VERIFICATION
```
Allowed redirection URL(s):
https://www.jnxlabs.ai/api/qryx/callback  ← Must be set!
```

---

## 📁 Key File Locations

| File | Purpose |
|------|--------|
| `/app/api/qryx/install/route.ts` | Entry point for installation |
| `/app/api/qryx/callback/route.ts` | OAuth callback (SaaS flow) |
| `/app/api/qryx/start-oauth/route.ts` | Triggers Shopify OAuth |
| `/lib/session/shop-session.ts` | JWT session management |
| `/lib/db/qryx-helpers.ts` | Shop database operations |
| `/lib/shopify/client.ts` | Shopify API client |
| `/products/qryx/setup/page.tsx` | Plan selection page |

---

## 🧪 Testing Commands

```bash
# Navigate to project
cd /home/ubuntu/jnx-os/nextjs_space

# Build and check for errors
yarn build

# Start dev server
yarn dev

# Run Playwright tests
yarn playwright test

# Check git status
git log --oneline -5

# Push to GitHub (triggers Vercel deploy)
git push origin main
```

---

## 📊 Git Commits (Recent)

```
d68489d - Debug: Add extensive logging to /api/qryx/install
e77c40b - Fix: Async cookies() in shop-session for Next.js 14.2+
76f2a19 - Fix: SaaS-Flow OAuth Callback for existing users
b8f47bd - Fix: Smart redirect for authenticated users in Qryx install flow
05b6e5b - Phase 5C: Shop Intelligence database migration
```

---

## 🔗 External Resources

### Dashboards
- **Clerk:** https://dashboard.clerk.com
- **Supabase:** https://supabase.com/dashboard
- **Stripe:** https://dashboard.stripe.com
- **Vercel:** https://vercel.com/jnxlabs/jnx-os
- **Shopify Partners:** https://partners.shopify.com

### Production
- **Website:** https://www.jnxlabs.ai
- **Test Store:** shopbotv3.myshopify.com
- **GitHub:** https://github.com/JNXLabs/jnx-os

---

## ✅ Checklist for Debugging

- [x] OAuth callback rewritten for SaaS flow
- [x] Async cookies() for Next.js 14.2+
- [x] Debug logging added to install route
- [x] clerk_user_id added to shop upsert
- [x] Code pushed to GitHub
- [ ] Vercel deployment verified
- [ ] Test install URL working
- [ ] Check Vercel Function Logs for errors
- [ ] Verify Shopify Partners redirect URL

---

## 📞 Support

- **GitHub Issues:** https://github.com/JNXLabs/jnx-os
- **Email:** support@jnxlabs.ai

---

**Document Version:** 2.2
**Last Updated:** January 2, 2026, 15:45 UTC
**Status:** Active Debugging Session
