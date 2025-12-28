/**
 * Qryx OAuth Callback Endpoint
 * 
 * Step 2: Shopify redirects here after merchant approves OAuth
 * 
 * Flow:
 * 1. Validate OAuth callback
 * 2. Exchange code for access token
 * 3. Fetch shop information
 * 4. Create Clerk User for shop owner
 * 5. Create Clerk Organization for shop
 * 6. Link shop to org in database
 * 7. Install chat widget
 * 8. Redirect to JNX-OS dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateOAuthCallback, getShopInfo, installChatWidget } from '@/lib/shopify/client';
import { upsertShopifyShop } from '@/lib/db/qryx-helpers';
import { clerkClient } from '@clerk/nextjs/server';
import { upsertOrg, upsertUser } from '@/lib/db/helpers';

// Get async Clerk client
async function getClerkClient() {
  return await clerkClient();
}

export const dynamic = 'force-dynamic';

/**
 * GET /api/qryx/callback?shop=example.myshopify.com&code=xxx&state=xxx
 * 
 * Handles OAuth callback from Shopify
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Validate required parameters
    if (!shop || !code || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('[Qryx Callback] Processing OAuth callback:', { shop });

    // TODO: Validate state parameter (CSRF protection)
    // Compare with stored state from /install endpoint

    // Step 1: Exchange code for access token
    const { accessToken, scope } = await validateOAuthCallback(shop, code, state);
    console.log('[Qryx Callback] OAuth successful, access token received');

    // Step 2: Fetch shop information from Shopify
    const shopInfo = await getShopInfo(shop, accessToken);
    console.log('[Qryx Callback] Shop info retrieved:', {
      name: shopInfo.name,
      email: shopInfo.email,
      plan: shopInfo.plan_name,
    });

    // Step 3: Create Clerk User for shop owner
    // Email = shop owner email from Shopify
    // Password = auto-generated (shop owner will set via password reset)
    const clerk = await getClerkClient();
    const clerkUser = await clerk.users.createUser({
      emailAddress: [shopInfo.email],
      firstName: shopInfo.shop_owner || shopInfo.name,
      publicMetadata: {
        role: 'shop_owner',
        shop_domain: shop,
        source: 'qryx_install',
      },
    });
    console.log('[Qryx Callback] Clerk user created:', clerkUser.id);

    // Step 4: Create Clerk Organization for shop
    const clerkOrg = await clerk.organizations.createOrganization({
      name: shopInfo.name,
      slug: shop.replace('.myshopify.com', ''),
      publicMetadata: {
        shop_domain: shop,
        shopify_plan: shopInfo.plan_name,
        source: 'qryx',
      },
      createdBy: clerkUser.id,
    });
    console.log('[Qryx Callback] Clerk org created:', clerkOrg.id);

    // Step 5: Add user as admin of organization
    await clerk.organizations.createOrganizationMembership({
      organizationId: clerkOrg.id,
      userId: clerkUser.id,
      role: 'org:admin',
    });
    console.log('[Qryx Callback] User added to org as admin');

    // Step 6: Sync to JNX-OS database
    // This will be triggered by Clerk webhooks, but we do it here for immediate availability
    const org = await upsertOrg(clerkOrg.name, clerkOrg.id);

    if (!org) {
      throw new Error('Failed to create organization');
    }

    const user = await upsertUser(clerkUser.id, {
      org_id: org.org_id,
      email: clerkUser.emailAddresses[0].emailAddress,
      first_name: clerkUser.firstName || '',
      last_name: clerkUser.lastName || '',
      role: 'shop_owner',
    });

    if (!user) {
      throw new Error('Failed to create user');
    }

    console.log('[Qryx Callback] JNX user/org synced:', { user_id: user.user_id, org_id: org.org_id });

    // Step 7: Link Shopify shop to organization
    const shopRecord = await upsertShopifyShop({
      org_id: org.org_id,
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
    console.log('[Qryx Callback] Shopify shop linked:', shopRecord.id);

    // Step 8: Install chat widget on Shopify storefront
    try {
      const scriptTagId = await installChatWidget(shop, accessToken, shopRecord.id);
      console.log('[Qryx Callback] Chat widget installed:', scriptTagId);
    } catch (widgetError) {
      console.error('[Qryx Callback] Failed to install widget:', widgetError);
      // Non-critical error - shop is still installed
    }

    // Step 9: Create sign-in token for immediate dashboard access
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: clerkUser.id,
      expiresInSeconds: 3600, // 1 hour
    });

    // Step 10: Redirect to dashboard with sign-in token
    const dashboardUrl = new URL('/app/qryx', process.env.NEXT_PUBLIC_APP_URL || request.url);
    dashboardUrl.searchParams.set('__clerk_ticket', signInToken.token);

    console.log('[Qryx Callback] Installation complete! Redirecting to dashboard');

    return NextResponse.redirect(dashboardUrl.toString());
  } catch (error) {
    console.error('[Qryx Callback] Installation failed:', error);

    // Redirect to error page with details
    const errorUrl = new URL('/qryx/install-error', process.env.NEXT_PUBLIC_APP_URL || request.url);
    errorUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.redirect(errorUrl.toString());
  }
}
