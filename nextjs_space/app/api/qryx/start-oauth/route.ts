/**
 * OAuth Trigger - Start Shopify OAuth
 * 
 * Handles both:
 * 1. Free plan: Direct OAuth without payment
 * 2. Paid plans: OAuth after Stripe payment success
 * 
 * Flow:
 * Free: setup?shop=xxx → HERE (with shop & plan=free) → Shopify OAuth
 * Paid: Stripe checkout → HERE (with session_id & shop) → Verify payment → Shopify OAuth
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe/client';
import { getAuthorizationUrl, generateNonce } from '@/lib/shopify/client';
import { hasActiveSubscription } from '@/lib/db/billing-helpers';
import { Logger } from '@/lib/observability/logger';

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
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const plan = searchParams.get('plan');
    const sessionId = searchParams.get('session_id');
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // 1. Validate shop parameter
    if (!shop) {
      logger.error('Missing shop parameter');
      return NextResponse.redirect(
        new URL('/products/qryx/setup?error=missing_session', baseUrl)
      );
    }

    logger.info('OAuth start requested:', { shop, plan, hasSessionId: !!sessionId });

    // 2. Authenticate user
    const user = await currentUser();

    if (!user) {
      logger.info('User not authenticated, redirecting to login');
      return NextResponse.redirect(
        new URL(`/login?redirect_url=${encodeURIComponent(`/api/qryx/start-oauth?shop=${shop}&plan=${plan || ''}`)}`, baseUrl)
      );
    }

    // 3. Handle FREE plan - skip payment verification
    if (plan === 'free') {
      logger.info('Free plan selected, skipping payment verification:', {
        userId: user.id,
        shop,
      });
      
      // Generate Shopify OAuth URL directly
      const state = generateNonce();
      const authUrl = await getAuthorizationUrl(shop, state);
      
      logger.info('Redirecting to Shopify OAuth (free plan):', { shop, authUrl: authUrl.substring(0, 100) });
      return NextResponse.redirect(authUrl);
    }

    // 4. For paid plans - verify Stripe session
    if (!sessionId) {
      logger.error('Missing session_id for paid plan');
      return NextResponse.redirect(
        new URL(`/products/qryx/setup?shop=${encodeURIComponent(shop)}&error=missing_payment`, baseUrl)
      );
    }

    // 5. Verify Stripe checkout session
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      logger.error('Failed to retrieve Stripe session:', { sessionId, error });
      return NextResponse.redirect(
        new URL(`/products/qryx/setup?shop=${encodeURIComponent(shop)}&error=invalid_session`, baseUrl)
      );
    }

    // 6. Verify payment was successful
    if (session.payment_status !== 'paid') {
      logger.warn('Payment not completed:', {
        sessionId,
        paymentStatus: session.payment_status,
      });
      return NextResponse.redirect(
        new URL(`/products/qryx/setup?shop=${encodeURIComponent(shop)}&error=payment_incomplete`, baseUrl)
      );
    }

    // 7. Verify subscription exists (webhook may still be processing)
    const hasSubscription = await hasActiveSubscription(user.id);
    
    if (!hasSubscription) {
      // Give webhook a few seconds, but proceed anyway since Stripe confirmed payment
      logger.warn('Subscription not yet in DB, but Stripe confirmed payment - proceeding:', {
        userId: user.id,
        sessionId
      });
    }

    logger.info('Payment verified, initiating OAuth:', {
      userId: user.id,
      shop,
      sessionId,
    });

    // 8. Generate Shopify OAuth URL
    const state = generateNonce();
    const authUrl = await getAuthorizationUrl(shop, state);

    // 9. Redirect to Shopify OAuth
    logger.info('Redirecting to Shopify OAuth:', { shop, authUrl: authUrl.substring(0, 100) });
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    logger.error('OAuth trigger error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    return NextResponse.redirect(
      new URL(
        `/products/qryx/setup?error=oauth_failed&message=${encodeURIComponent(
          error instanceof Error ? error.message : 'Unknown error'
        )}`,
        baseUrl
      )
    );
  }
}
