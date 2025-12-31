/**
 * Qryx Subscription Upgrade API
 * 
 * POST: Upgrade or downgrade user's subscription plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getSubscription } from '@/lib/db/billing-helpers';
import { stripe } from '@/lib/stripe/client';
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('api/qryx/subscription/upgrade');

export const dynamic = 'force-dynamic';

/**
 * Plan price mapping
 */
const PLAN_PRICES: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  professional: process.env.STRIPE_PRICE_PROFESSIONAL || '',
  business: process.env.STRIPE_PRICE_BUSINESS || '',
};

/**
 * POST /api/qryx/subscription/upgrade
 * 
 * Upgrades or downgrades the user's subscription
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

    // 2. Parse request body
    const body = await request.json();
    const { planId } = body;

    if (!planId || !PLAN_PRICES[planId]) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // 3. Get current subscription
    const currentSubscription = await getSubscription(user.id);

    // 4. If no subscription, create checkout session for new subscription
    if (!currentSubscription) {
      const session = await stripe.checkout.sessions.create({
        customer_email: user.emailAddresses[0]?.emailAddress,
        line_items: [
          {
            price: PLAN_PRICES[planId],
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/app/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/app/billing`,
        metadata: {
          userId: user.id,
          planId,
          planName: planId.charAt(0).toUpperCase() + planId.slice(1),
        },
      });

      logger.info('Created checkout session for new subscription:', {
        userId: user.id,
        planId,
        sessionId: session.id,
      });

      return NextResponse.json({
        checkoutUrl: session.url,
      });
    }

    // 5. If subscription exists, update it
    const stripeSubscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripe_subscription_id
    );

    const updatedSubscription = await stripe.subscriptions.update(
      currentSubscription.stripe_subscription_id,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: PLAN_PRICES[planId],
          },
        ],
        proration_behavior: 'create_prorations',
      }
    );

    logger.info('Updated subscription:', {
      userId: user.id,
      oldPlan: currentSubscription.plan_id,
      newPlan: planId,
      subscriptionId: updatedSubscription.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
      },
    });
  } catch (error) {
    logger.error('Subscription upgrade error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upgrade subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
