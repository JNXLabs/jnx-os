/**
 * Billing Database Helpers
 * 
 * Handles all database operations related to subscriptions and billing
 * Used by: Stripe webhooks, billing dashboard, usage tracking
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('db/billing-helpers');

/**
 * Subscription data interface
 */
export interface Subscription {
  id: string;
  clerk_user_id: string;
  org_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Upsert subscription record
 * 
 * Idempotent operation - safe to call multiple times
 * Used by: Stripe webhooks (checkout.session.completed, customer.subscription.updated)
 */
export async function upsertSubscription(data: {
  userId?: string;
  orgId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId: string;
  planId?: string;
  planName?: string;
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}): Promise<Subscription> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Build update data (only include provided fields)
    const updateData: any = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };

    if (data.userId) updateData.clerk_user_id = data.userId;
    if (data.orgId) updateData.org_id = data.orgId;
    if (data.stripeCustomerId) updateData.stripe_customer_id = data.stripeCustomerId;
    if (data.planId) updateData.plan_id = data.planId;
    if (data.planName) updateData.plan_name = data.planName;
    if (data.currentPeriodStart) updateData.current_period_start = data.currentPeriodStart.toISOString();
    if (data.currentPeriodEnd) updateData.current_period_end = data.currentPeriodEnd.toISOString();
    if (data.cancelAtPeriodEnd !== undefined) updateData.cancel_at_period_end = data.cancelAtPeriodEnd;

    // Upsert: insert if not exists, update if exists
    const { data: subscription, error } = await supabase
      .from('billing_subscriptions')
      .upsert(
        {
          stripe_subscription_id: data.stripeSubscriptionId,
          ...updateData,
        },
        {
          onConflict: 'stripe_subscription_id',
        }
      )
      .select()
      .single();

    if (error) {
      logger.error('Failed to upsert subscription:', { error, data });
      throw error;
    }

    logger.info('Subscription upserted:', {
      subscriptionId: subscription.stripe_subscription_id,
      status: subscription.status,
    });

    return subscription;
  } catch (error) {
    logger.error('Upsert subscription error:', error);
    throw error;
  }
}

/**
 * Get active subscription for user
 * 
 * Returns the most recent active subscription
 * Used by: Product selection page, billing dashboard, usage checks
 */
export async function getSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('clerk_user_id', userId)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get subscription:', { error, userId });
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Get subscription error:', error);
    throw error;
  }
}

/**
 * Get subscription by Stripe subscription ID
 * 
 * Used by: Webhook handlers
 */
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string
): Promise<Subscription | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to get subscription by Stripe ID:', { error, stripeSubscriptionId });
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Get subscription by Stripe ID error:', error);
    throw error;
  }
}

/**
 * Check if user has active subscription
 * 
 * Used by: Product selection page (redirect if already subscribed)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const subscription = await getSubscription(userId);
    return subscription !== null && subscription.status === 'active';
  } catch (error) {
    logger.error('Check active subscription error:', error);
    return false;
  }
}

/**
 * Cancel subscription (mark for cancellation at period end)
 * 
 * Does NOT immediately cancel - allows access until period ends
 * Used by: Billing dashboard cancellation flow
 */
export async function cancelSubscription(stripeSubscriptionId: string): Promise<Subscription> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('billing_subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to cancel subscription:', { error, stripeSubscriptionId });
      throw error;
    }

    logger.info('Subscription marked for cancellation:', {
      subscriptionId: stripeSubscriptionId,
    });

    return data;
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    throw error;
  }
}

/**
 * Get all subscriptions (admin only)
 * 
 * Used by: Admin dashboard
 */
export async function getAllSubscriptions(options?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<Subscription[]> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    let query = supabase
      .from('billing_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to get all subscriptions:', { error, options });
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Get all subscriptions error:', error);
    throw error;
  }
}
