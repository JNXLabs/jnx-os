/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe events and syncs subscription data to database
 * 
 * Events handled:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Plan changed, status updated
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_succeeded: Renewal successful
 * - invoice.payment_failed: Payment failed
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe/client';
import { upsertSubscription, getSubscriptionByStripeId } from '@/lib/db/billing-helpers';
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('api/stripe/webhook');

export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/webhook
 * 
 * Receives and processes Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body (required for signature verification)
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      logger.error('Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // 2. Verify webhook signature
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      logger.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        {
          error: 'Webhook signature verification failed',
          message: err instanceof Error ? err.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

    logger.info('Webhook event received:', {
      type: event.type,
      id: event.id,
    });

    // 3. Handle event by type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        logger.info('Unhandled event type:', { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * Creates initial subscription record in database
 */
async function handleCheckoutCompleted(session: any) {
  try {
    const metadata = session.metadata;

    if (!metadata?.userId || !metadata?.planId) {
      logger.warn('Checkout session missing metadata:', { sessionId: session.id });
      return;
    }

    await upsertSubscription({
      userId: metadata.userId,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      planId: metadata.planId,
      planName: metadata.planName || metadata.planId,
      status: 'active',
    });

    logger.info('Checkout completed, subscription created:', {
      userId: metadata.userId,
      planId: metadata.planId,
      subscriptionId: session.subscription,
    });
  } catch (error) {
    logger.error('Handle checkout completed error:', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.updated
 * Updates subscription status, plan, or period
 */
async function handleSubscriptionUpdated(subscription: any) {
  try {
    await upsertSubscription({
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    logger.info('Subscription updated:', {
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error) {
    logger.error('Handle subscription updated error:', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.deleted
 * Marks subscription as canceled
 */
async function handleSubscriptionDeleted(subscription: any) {
  try {
    await upsertSubscription({
      stripeSubscriptionId: subscription.id,
      status: 'canceled',
    });

    logger.info('Subscription deleted:', {
      subscriptionId: subscription.id,
    });

    // TODO: Send cancellation confirmation email
  } catch (error) {
    logger.error('Handle subscription deleted error:', error);
    throw error;
  }
}

/**
 * Handle invoice.payment_succeeded
 * Renews subscription for another period
 */
async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    if (!invoice.subscription) return;

    const subscription = await getSubscriptionByStripeId(invoice.subscription as string);

    if (!subscription) {
      logger.warn('Subscription not found for invoice:', { invoiceId: invoice.id });
      return;
    }

    await upsertSubscription({
      stripeSubscriptionId: invoice.subscription as string,
      status: 'active',
    });

    logger.info('Invoice payment succeeded, subscription renewed:', {
      subscriptionId: invoice.subscription,
      invoiceId: invoice.id,
    });

    // TODO: Send payment success email
  } catch (error) {
    logger.error('Handle invoice payment succeeded error:', error);
    throw error;
  }
}

/**
 * Handle invoice.payment_failed
 * Marks subscription as past_due, may suspend access
 */
async function handleInvoicePaymentFailed(invoice: any) {
  try {
    if (!invoice.subscription) return;

    await upsertSubscription({
      stripeSubscriptionId: invoice.subscription as string,
      status: 'past_due',
    });

    logger.warn('Invoice payment failed:', {
      subscriptionId: invoice.subscription,
      invoiceId: invoice.id,
    });

    // TODO: Send payment failed email with retry instructions
  } catch (error) {
    logger.error('Handle invoice payment failed error:', error);
    throw error;
  }
}
