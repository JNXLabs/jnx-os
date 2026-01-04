/**
 * Qryx OAuth Callback Endpoint - SaaS Flow
 * 
 * This handles Shopify OAuth callback AFTER payment/plan selection
 * 
 * Flow:
 * 1. User selects plan → Payment (if paid) → OAuth starts
 * 2. Shopify redirects here with code + state
 * 3. Exchange code for access token
 * 4. Save shop with access token
 * 5. Redirect to SUCCESS page (widget installation complete!)
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { validateOAuthCallback, getShopInfo, installChatWidget } from '@/lib/shopify/client';
import { upsertShopifyShop, getShopByUserAndDomain } from '@/lib/db/qryx-helpers';
import { getUserByClerkId, syncUserFromClerk } from '@/lib/db/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/qryx/callback?shop=example.myshopify.com&code=xxx&state=xxx
 * 
 * Handles OAuth callback from Shopify - final step of installation
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jnxlabs.ai';
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Validate required parameters
    if (!shop || !code || !state) {
      console.error('[Qryx Callback] Missing parameters:', { shop, code: !!code, state: !!state });
      return NextResponse.redirect(
        new URL(`/products/qryx/setup?error=missing_oauth_params`, baseUrl)
      );
    }

    // Parse plan from state (format: nonce_plan_orgId)
    const stateParts = state.split('_');
    const plan = stateParts.length >= 2 ? stateParts[1] : 'free';
    const stateOrgId = stateParts.length >= 3 ? stateParts[2] : null;
    
    console.log('[Qryx Callback] Processing OAuth callback:', { shop, plan, stateOrgId });

    // CRITICAL: Get currently authenticated user
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.error('[Qryx Callback] No authenticated user found!');
      // Redirect to login with return URL back to setup
      return NextResponse.redirect(
        new URL(`/login?redirect_url=${encodeURIComponent(`/products/qryx/setup?shop=${shop}`)}`, baseUrl)
      );
    }

    console.log('[Qryx Callback] Authenticated user:', {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
    });

    // Step 1: Get or create JNX user from database
    let jnxUser = await getUserByClerkId(clerkUser.id);
    
    if (!jnxUser || !jnxUser.org_id) {
      // Try to sync user from Clerk (handles new registrations)
      console.log('[Qryx Callback] User not in DB, attempting sync...');
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      const firstName = clerkUser.firstName || null;
      const lastName = clerkUser.lastName || null;
      jnxUser = await syncUserFromClerk(clerkUser.id, email, firstName, lastName);
      
      if (!jnxUser || !jnxUser.org_id) {
        console.error('[Qryx Callback] Failed to sync user!', { clerkId: clerkUser.id });
        return NextResponse.redirect(
          new URL(`/products/qryx/setup?shop=${encodeURIComponent(shop)}&error=user_sync_failed`, baseUrl)
        );
      }
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

    // Step 4: Check if shop already exists (to preserve subscription status)
    const existingShop = await getShopByUserAndDomain(clerkUser.id, shop);
    
    // Step 5: Upsert Shopify shop with access token AND plan info
    const shopRecord = await upsertShopifyShop({
      org_id: jnxUser.org_id,
      clerk_user_id: clerkUser.id,
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
      // Set plan from OAuth state (or preserve existing)
      subscription_status: existingShop?.subscription_status || (plan === 'free' ? 'free' : 'trialing'),
      plan_tier: existingShop?.plan_tier || plan,
    });
    
    console.log('[Qryx Callback] Shop saved/updated:', {
      shopId: shopRecord.id,
      orgId: jnxUser.org_id,
      hasExistingSubscription: !!existingShop?.subscription_status,
    });

    // Step 6: Install the chat widget on the Shopify store
    try {
      const scriptTagId = await installChatWidget(shop, accessToken, shopRecord.id);
      console.log('[Qryx Callback] Widget installed, scriptTagId:', scriptTagId);
    } catch (widgetError) {
      console.error('[Qryx Callback] Widget installation failed (non-fatal):', widgetError);
      // Continue - widget can be installed manually later
    }

    // Step 7: SUCCESS! Redirect to dashboard with success message
    const successUrl = new URL('/app/qryx', baseUrl);
    successUrl.searchParams.set('shop', shop);
    successUrl.searchParams.set('installed', 'true');

    console.log('[Qryx Callback] Installation complete! Redirecting to dashboard');

    return NextResponse.redirect(successUrl.toString());
    
  } catch (error) {
    console.error('[Qryx Callback] Installation failed:', error);

    // Redirect to setup page with error
    const shop = request.nextUrl.searchParams.get('shop');
    const errorUrl = new URL('/products/qryx/setup', baseUrl);
    if (shop) errorUrl.searchParams.set('shop', shop);
    errorUrl.searchParams.set('error', 'oauth_failed');

    return NextResponse.redirect(errorUrl.toString());
  }
}
