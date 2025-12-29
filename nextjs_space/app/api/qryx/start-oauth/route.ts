/**
 * OAuth Trigger After Payment
 * 
 * CRITICAL: This endpoint is called AFTER successful Stripe payment
 * 
 * Flow:
 * Checkout success → HERE → Verify payment → Retrieve shop → Shopify OAuth
 * 
 * Success URL set in Stripe Checkout:
 * /api/qryx/start-oauth?session_id={CHECKOUT_SESSION_ID}
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe/client';
import { getShopSession, clearShopSession } from '@/lib/session/shop-session';
import { getAuthorizationUrl, generateNonce } from '@/lib/shopify/client';
import { hasActiveSubscription } from '@/lib/db/billing-helpers';
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('api/qryx/start-oauth');

export const dynamic = 'force-dynamic';

/**
 * GET /api/qryx/start-oauth?session_id=cs_test_...
 * 
 * Verifies payment success and initiates Shopify OAuth
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    // 1. Authenticate user
    const user = await currentUser();

    if (!user) {
      logger.error('User not authenticated');
      return NextResponse.redirect(new URL('/login?error=auth_required', request.url));
    }

    // 2. Validate session ID
    if (!sessionId) {
      logger.error('Missing session_id parameter');
      return NextResponse.redirect(
        new URL('/products/qryx/setup?error=missing_session', request.url)
      );
    }

    // 3. Verify Stripe checkout session
    let session;

    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      logger.error('Failed to retrieve Stripe session:', { sessionId, error });
      return NextResponse.redirect(
        new URL('/products/qryx/setup?error=invalid_session', request.url)
      );
    }

    // 4. Verify payment was successful
    if (session.payment_status !== 'paid') {
      logger.warn('Payment not completed:', {
        sessionId,
        paymentStatus: session.payment_status,
      });
      return NextResponse.redirect(
        new URL('/products/qryx/setup?error=payment_incomplete', request.url)
      );
    }

    // 5. Verify user has active subscription in database
    const hasSubscription = await hasActiveSubscription(user.id);

    if (!hasSubscription) {
      logger.warn('No active subscription found after payment:', { userId: user.id });
      // Give webhook time to process (retry after short delay)
      return NextResponse.redirect(
        new URL('/products/qryx/setup?error=subscription_pending', request.url)
      );
    }

    // 6. Retrieve shop from session
    const shop = await getShopSession();

    if (!shop) {
      logger.error('Shop session expired or missing:', { userId: user.id });
      return NextResponse.redirect(
        new URL(
          '/products/qryx/setup?error=shop_session_expired&message=Please restart installation from Shopify',
          request.url
        )
      );
    }

    logger.info('Initiating OAuth after successful payment:', {
      userId: user.id,
      shop,
      sessionId,
    });

    // 7. Generate Shopify OAuth URL
    const state = generateNonce();
    const authUrl = await getAuthorizationUrl(shop, state);

    // 8. Clear shop session (will be restored after OAuth callback)
    // Note: We'll need to pass the shop through OAuth state or store it differently
    // For now, keep it in session until OAuth callback completes
    // await clearShopSession();

    // 9. Redirect to Shopify OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    logger.error('OAuth trigger error:', error);
    return NextResponse.redirect(
      new URL(
        `/products/qryx/setup?error=oauth_failed&message=${encodeURIComponent(
          error instanceof Error ? error.message : 'Unknown error'
        )}`,
        request.url
      )
    );
  }
}
