/**
 * Qryx Stripe Customer Portal API
 * 
 * POST: Create Stripe Customer Portal session for managing billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getSubscription } from '@/lib/db/billing-helpers';
import { stripe } from '@/lib/stripe/client';
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('api/qryx/subscription/portal');

export const dynamic = 'force-dynamic';

/**
 * POST /api/qryx/subscription/portal
 * 
 * Creates a Stripe Customer Portal session for the user to manage their subscription
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user's subscription
    const subscription = await getSubscription(user.id);

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    // 3. Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/app/billing`,
    });

    logger.info('Created billing portal session:', {
      userId: user.id,
      customerId: subscription.stripe_customer_id,
      sessionId: portalSession.id,
    });

    return NextResponse.json({
      portalUrl: portalSession.url,
    });
  } catch (error) {
    logger.error('Portal session error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create portal session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
