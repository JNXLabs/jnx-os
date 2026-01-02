/**
 * Qryx OAuth Callback Endpoint - SaaS Flow
 * 
 * CRITICAL: This handles Shopify OAuth callback for EXISTING authenticated users
 * 
 * Phase 5 SaaS Flow:
 * 1. User already logged in to JNX Labs
 * 2. User initiates Shopify OAuth from /api/qryx/install
 * 3. Shopify redirects here after approval
 * 4. Link shop to EXISTING user/org (don't create new ones!)
 * 5. Save shop session and redirect to /api/qryx/install
 * 6. Install route redirects to plan selection
 * 
 * Step 2: Shopify redirects here after merchant approves OAuth
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { validateOAuthCallback, getShopInfo } from '@/lib/shopify/client';
import { upsertShopifyShop } from '@/lib/db/qryx-helpers';
import { getUserByClerkId } from '@/lib/db/helpers';
import { setShopSession } from '@/lib/session/shop-session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/qryx/callback?shop=example.myshopify.com&code=xxx&state=xxx
 * 
 * Handles OAuth callback from Shopify for SaaS flow
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Validate required parameters
    if (!shop || !code || !state) {
      console.error('[Qryx Callback] Missing parameters:', { shop, code: !!code, state: !!state });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('[Qryx Callback] Processing OAuth callback:', { shop });

    // CRITICAL: Get currently authenticated user
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.error('[Qryx Callback] No authenticated user found!');
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect_url', `/api/qryx/install?shop=${shop}`);
      return NextResponse.redirect(loginUrl);
    }

    console.log('[Qryx Callback] Authenticated user:', {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
    });

    // Step 1: Get JNX user from database
    const jnxUser = await getUserByClerkId(clerkUser.id);

    if (!jnxUser || !jnxUser.org_id) {
      console.error('[Qryx Callback] User not synced to database!', { clerkId: clerkUser.id });
      return NextResponse.json(
        { error: 'User not properly initialized. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('[Qryx Callback] JNX user loaded:', {
      userId: jnxUser.user_id,
      orgId: jnxUser.org_id,
    });

    // Step 2: Exchange code for access token
    const { accessToken, scope } = await validateOAuthCallback(shop, code, state);
    console.log('[Qryx Callback] OAuth successful, access token received');

    // Step 3: Fetch shop information from Shopify
    const shopInfo = await getShopInfo(shop, accessToken);
    console.log('[Qryx Callback] Shop info retrieved:', {
      name: shopInfo.name,
      email: shopInfo.email,
      plan: shopInfo.plan_name,
    });

    // Step 4: Link Shopify shop to EXISTING user/org
    const shopRecord = await upsertShopifyShop({
      org_id: jnxUser.org_id,
      clerk_user_id: clerkUser.id, // PHASE 5B: For user-based billing
      shop_domain: shop,
      shop_name: shopInfo.name,
      shop_email: shopInfo.email,
      shop_owner_name: shopInfo.shop_owner,
      access_token: accessToken,
      scope,
      shopify_plan: shopInfo.plan_name,
      country_code: shopInfo.country_code,
      currency: shopInfo.currency,
      timezone: shopInfo.timezone,
    });
    console.log('[Qryx Callback] Shopify shop linked to existing org:', {
      shopId: shopRecord.id,
      orgId: jnxUser.org_id,
    });

    // Step 5: Save shop to session for plan selection
    await setShopSession(shop);
    console.log('[Qryx Callback] Shop saved to session');

    // Step 6: Redirect to /api/qryx/install
    // This will check auth status and redirect to /products/qryx/setup for plan selection
    const installUrl = new URL('/api/qryx/install', request.url);
    installUrl.searchParams.set('shop', shop);

    console.log('[Qryx Callback] OAuth complete! Redirecting to plan selection');

    return NextResponse.redirect(installUrl.toString());
  } catch (error) {
    console.error('[Qryx Callback] Installation failed:', error);

    // Redirect to error page with details
    const errorUrl = new URL('/products/qryx/setup', request.url);
    errorUrl.searchParams.set('error', error instanceof Error ? error.message : 'OAuth callback failed');

    return NextResponse.redirect(errorUrl.toString());
  }
}
