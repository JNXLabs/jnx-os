/**
 * Qryx Subscription API
 * 
 * GET: Fetch current user's active subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getSubscription } from '@/lib/db/billing-helpers';
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('api/qryx/subscription');

export const dynamic = 'force-dynamic';

/**
 * GET /api/qryx/subscription
 * 
 * Returns the current user's active subscription
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Fetch active subscription
    const subscription = await getSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { subscription: null, message: 'No active subscription' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan_id: subscription.plan_id,
        plan_name: subscription.plan_name,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        conversations_limit: subscription.conversations_limit,
        stripe_customer_id: subscription.stripe_customer_id,
      },
    });
  } catch (error) {
    logger.error('Get subscription error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
