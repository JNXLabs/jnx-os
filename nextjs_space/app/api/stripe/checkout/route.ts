/**
 * Stripe Checkout Session Creation
 * 
 * Step 4 in SaaS Flow:
 * Shop saved → Login → Product selected → HERE → Payment → OAuth
 * 
 * Creates a Stripe Checkout session for subscription payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { stripe, getPricingPlan } from '@/lib/stripe/client';
import { hasValidShopSession } from '@/lib/session/shop-session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/checkout
 * 
 * Creates Stripe Checkout session for selected plan
 * Body: { planId: 'starter' | 'professional' | 'business' }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 401 }
      );
    }

    // 2. Verify shop session exists
    const hasShop = await hasValidShopSession();

    if (!hasShop) {
      return NextResponse.json(
        {
          error: 'Shop session expired.',
          message: 'Please restart the installation from your Shopify Admin.',
        },
        { status: 400 }
      );
    }

    // 3. Parse and validate plan ID
    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Missing planId in request body' },
        { status: 400 }
      );
    }

    const plan = getPricingPlan(planId);

    if (!plan) {
      return NextResponse.json(
        { error: `Invalid plan: ${planId}` },
        { status: 400 }
      );
    }

    // 4. Validate plan has price ID
    if (!plan.priceId || plan.priceId.includes('placeholder')) {
      return NextResponse.json(
        {
          error: 'Plan not configured',
          message: 'Stripe price ID missing. Please contact support.',
        },
        { status: 500 }
      );
    }

    // 5. Get user email
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // 6. Build base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // 7. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        userEmail: email,
        planId: plan.id,
        planName: plan.name,
        productType: 'qryx',
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: plan.id,
          productType: 'qryx',
        },
      },
      success_url: `${baseUrl}/api/qryx/start-oauth?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/products/qryx/setup?canceled=true`,
      allow_promotion_codes: true,
    });

    console.log('[Stripe Checkout] Session created:', {
      sessionId: session.id,
      userId: user.id,
      planId: plan.id,
      email,
    });

    // 8. Return checkout URL to client
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
