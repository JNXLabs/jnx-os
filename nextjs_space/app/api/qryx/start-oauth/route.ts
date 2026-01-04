/**
 * OAuth Trigger - Start Shopify OAuth
 * 
 * Handles both:
 * 1. Free plan: Direct OAuth without payment
 * 2. Paid plans: OAuth after Stripe payment success
 * 3. Reinstall: User already has subscription, just needs OAuth
 * 
 * Flow:
 * Free: setup?shop=xxx → HERE (with shop & plan=free) → Set free status → Shopify OAuth
 * Paid: Stripe checkout → HERE (with session_id & shop) → Verify payment → Shopify OAuth
 * Reinstall: setup?shop=xxx → HERE (with shop & existing plan) → Shopify OAuth
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe/client';
import { getAuthorizationUrl, generateNonce } from '@/lib/shopify/client';
import { hasActiveSubscription } from '@/lib/db/billing-helpers';
import { getShopByUserAndDomain, updateShopSubscription } from '@/lib/db/qryx-helpers';
import { getUserByClerkId, syncUserFromClerk } from '@/lib/db/helpers';
import { Logger } from '@/lib/observability/logger';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const logger = new Logger('api/qryx/start-oauth');

export const dynamic = 'force-dynamic';

/**
 * GET /api/qryx/start-oauth
 * 
 * Params:
 * - shop: Required. The Shopify shop domain
 * - plan: Optional. 'free' for free plan (skips payment verification)
 * - session_id: Optional. Stripe session ID (for paid plans)
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jnxlabs.ai';
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const plan = searchParams.get('plan');
    const sessionId = searchParams.get('session_id');

    // 1. Validate shop parameter
    if (!shop) {
      logger.error('Missing shop parameter');
      return NextResponse.redirect(
        new URL('/products/qryx/setup?error=missing_shop', baseUrl)
      );
    }

    logger.info('OAuth start requested:', { shop, plan, hasSessionId: !!sessionId });

    // 2. Authenticate user
    const user = await currentUser();

    if (!user) {
      logger.info('User not authenticated, redirecting to login');
      return NextResponse.redirect(
        new URL(`/login?redirect_url=${encodeURIComponent(`/products/qryx/setup?shop=${shop}`)}`, baseUrl)
      );
    }

    // 3. Ensure user exists in database
    let jnxUser = await getUserByClerkId(user.id);
    if (!jnxUser || !jnxUser.org_id) {
      logger.info('User not in DB, syncing from Clerk...');
      const email = user.emailAddresses[0]?.emailAddress || '';
      const firstName = user.firstName || null;
      const lastName = user.lastName || null;
      jnxUser = await syncUserFromClerk(user.id, email, firstName, lastName);
      if (!jnxUser || !jnxUser.org_id) {
        logger.error('Failed to sync user to database');
        return NextResponse.redirect(
          new URL(`/products/qryx/setup?shop=${encodeURIComponent(shop)}&error=user_sync_failed`, baseUrl)
        );
      }
    }

    // 4. Check if user already has this shop (reinstall scenario)
    const existingShop = await getShopByUserAndDomain(user.id, shop);
    
    if (existingShop && ['active', 'trialing', 'free'].includes(existingShop.subscription_status || '')) {
      // User already has subscription - just do OAuth for reinstall
      logger.info('Reinstall scenario - user has active subscription:', {
        userId: user.id,
        shop,
        status: existingShop.subscription_status,
      });
      
      const state = generateNonce();
      const authUrl = await getAuthorizationUrl(shop, state);
      return NextResponse.redirect(authUrl);
    }

    // 5. Handle FREE plan - skip payment verification
    if (plan === 'free') {
      logger.info('Free plan selected:', { userId: user.id, shop, orgId: jnxUser.org_id });
      
      // DON'T create shop record here - it will be created in callback
      // The shop record requires access_token which we don't have yet
      
      // Generate Shopify OAuth URL with plan info in state
      const state = `${generateNonce()}_free_${jnxUser.org_id}`;
      const authUrl = await getAuthorizationUrl(shop, state);
      
      logger.info('Redirecting to Shopify OAuth (free plan)');
      return NextResponse.redirect(authUrl);
    }

    // 6. For paid plans - verify Stripe session
    if (!sessionId) {
      logger.error('Missing session_id for paid plan');
      return NextResponse.redirect(
        new URL(`/products/qryx/setup?shop=${encodeURIComponent(shop)}&error=missing_payment`, baseUrl)
      );
    }

    // 7. Verify Stripe checkout session
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      logger.error('Failed to retrieve Stripe session:', { sessionId, error });
      return NextResponse.redirect(
        new URL(`/products/qryx/setup?shop=${encodeURIComponent(shop)}&error=invalid_session`, baseUrl)
      );
    }

    // 8. Verify payment was successful (or trialing)
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      logger.warn('Payment not completed:', {
        sessionId,
        paymentStatus: session.payment_status,
        sessionStatus: session.status,
      });
      return NextResponse.redirect(
        new URL(`/products/qryx/setup?shop=${encodeURIComponent(shop)}&error=payment_incomplete`, baseUrl)
      );
    }

    // 9. Get plan from metadata
    const planName = (session.metadata?.plan_name || 'starter').toLowerCase();
    const planTier = planName === 'professional' ? 'professional' : 
                     planName === 'business' ? 'business' : 'starter';

    // 10. Create/update shop record with subscription info
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const trialEndsAt = session.subscription ? 
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null;
      
      await supabase.from('shopify_shops').upsert({
        org_id: jnxUser.org_id,
        clerk_user_id: user.id,
        shop_domain: shop,
        shop_name: shop.replace('.myshopify.com', ''),
        subscription_status: 'trialing',
        plan_tier: planTier,
        stripe_customer_id: session.customer as string || null,
        stripe_subscription_id: session.subscription as string || null,
        trial_ends_at: trialEndsAt,
        access_token: '', // Will be filled by callback
        scope: '',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'shop_domain',
        ignoreDuplicates: false,
      });
      logger.info('Created shop record with paid status:', { planTier });
    }

    logger.info('Payment verified, initiating OAuth:', {
      userId: user.id,
      shop,
      sessionId,
      planTier,
    });

    // 11. Generate Shopify OAuth URL
    const state = generateNonce();
    const authUrl = await getAuthorizationUrl(shop, state);

    // 12. Redirect to Shopify OAuth
    logger.info('Redirecting to Shopify OAuth');
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    logger.error('OAuth trigger error:', error);
    const shop = request.nextUrl.searchParams.get('shop');
    return NextResponse.redirect(
      new URL(
        `/products/qryx/setup?${shop ? `shop=${encodeURIComponent(shop)}&` : ''}error=oauth_failed`,
        baseUrl
      )
    );
  }
}
