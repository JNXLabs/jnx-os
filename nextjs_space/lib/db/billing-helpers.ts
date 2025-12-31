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
  conversations_limit: number; // PHASE 5B: Added for usage tracking
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

// =============================================================================
// PHASE 5B: USAGE TRACKING FUNCTIONS
// =============================================================================

/**
 * User conversation usage interface
 */
export interface UserConversationUsage {
  usage_id: string;
  clerk_user_id: string;
  period_start: string;
  period_end: string;
  conversations_used: number;
  conversations_limit: number;
  warning_sent_80_percent: boolean;
  warning_sent_100_percent: boolean;
  last_updated: string;
  created_at: string;
}

/**
 * Get or create usage record for current billing period
 * 
 * Implements "lazy reset" - creates new usage record if current period expired
 * Uses UPSERT to handle concurrent requests safely
 * 
 * @param clerkUserId - Clerk user ID
 * @returns Current period's usage record
 */
export async function getOrCreateUsageForPeriod(
  clerkUserId: string
): Promise<UserConversationUsage> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Get user's subscription to determine limit and billing period
    const subscription = await getSubscription(clerkUserId);

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const periodStart = new Date(subscription.current_period_start || new Date());
    const periodEnd = new Date(subscription.current_period_end || new Date());
    const conversationsLimit = subscription.conversations_limit || 500;

    // Check if usage record exists for current period
    const { data: existingUsage, error: fetchError } = await supabase
      .from('user_conversation_usage')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .eq('period_start', periodStart.toISOString())
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error('Failed to fetch usage record:', { fetchError, clerkUserId });
      throw fetchError;
    }

    // If exists and within current period, return it
    if (existingUsage) {
      return existingUsage;
    }

    // Create new usage record for current period (lazy reset)
    const { data: newUsage, error: insertError } = await supabase
      .from('user_conversation_usage')
      .upsert(
        {
          clerk_user_id: clerkUserId,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          conversations_used: 0,
          conversations_limit: conversationsLimit,
          warning_sent_80_percent: false,
          warning_sent_100_percent: false,
        },
        {
          onConflict: 'clerk_user_id,period_start',
        }
      )
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create usage record:', { insertError, clerkUserId });
      throw insertError;
    }

    logger.info('Usage record created for new period:', {
      clerkUserId,
      periodStart: periodStart.toISOString(),
      limit: conversationsLimit,
    });

    return newUsage;
  } catch (error) {
    logger.error('Get or create usage error:', error);
    throw error;
  }
}

/**
 * Increment conversation count for user
 * 
 * Uses atomic increment with row-level locking to prevent race conditions
 * Returns updated usage data
 * 
 * @param clerkUserId - Clerk user ID
 * @returns Updated usage record
 */
export async function incrementConversationCount(
  clerkUserId: string
): Promise<UserConversationUsage> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Ensure usage record exists for current period
    const usage = await getOrCreateUsageForPeriod(clerkUserId);

    // Atomic increment using PostgreSQL
    const { data: updatedUsage, error } = await supabase.rpc('increment_conversation_usage', {
      p_clerk_user_id: clerkUserId,
      p_period_start: usage.period_start,
    });

    if (error) {
      // Fallback to manual increment if RPC not available
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_conversation_usage')
        .update({
          conversations_used: usage.conversations_used + 1,
          last_updated: new Date().toISOString(),
        })
        .eq('usage_id', usage.usage_id)
        .select()
        .single();

      if (fallbackError) {
        logger.error('Failed to increment conversation count:', { fallbackError, clerkUserId });
        throw fallbackError;
      }

      logger.info('Conversation count incremented (fallback):', {
        clerkUserId,
        newCount: fallbackData.conversations_used,
      });

      return fallbackData;
    }

    logger.info('Conversation count incremented:', {
      clerkUserId,
      newCount: updatedUsage.conversations_used,
    });

    return updatedUsage;
  } catch (error) {
    logger.error('Increment conversation count error:', error);
    throw error;
  }
}

/**
 * Check if user has reached conversation limit
 * 
 * Supports admin override (unlimited conversations for admins)
 * Returns detailed usage information
 * 
 * @param clerkUserId - Clerk user ID
 * @param isAdmin - Whether user is admin (unlimited)
 * @returns Usage check result
 */
export async function checkConversationLimit(
  clerkUserId: string,
  isAdmin: boolean = false
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  percentUsed: number;
  isAdmin: boolean;
  warningLevel?: 'none' | '80' | '100';
}> {
  try {
    // Admins have unlimited conversations
    if (isAdmin) {
      return {
        allowed: true,
        used: 0,
        limit: Infinity,
        percentUsed: 0,
        isAdmin: true,
        warningLevel: 'none',
      };
    }

    // Get current usage
    const usage = await getOrCreateUsageForPeriod(clerkUserId);

    const used = usage.conversations_used;
    const limit = usage.conversations_limit;
    const percentUsed = (used / limit) * 100;
    const allowed = used < limit;

    // Determine warning level
    let warningLevel: 'none' | '80' | '100' = 'none';
    if (percentUsed >= 100) {
      warningLevel = '100';
    } else if (percentUsed >= 80) {
      warningLevel = '80';
    }

    return {
      allowed,
      used,
      limit,
      percentUsed,
      isAdmin,
      warningLevel,
    };
  } catch (error) {
    logger.error('Check conversation limit error:', error);
    // Fail open - allow request but log error
    return {
      allowed: true,
      used: 0,
      limit: 500,
      percentUsed: 0,
      isAdmin: false,
      warningLevel: 'none',
    };
  }
}

/**
 * Update warning flags for usage record
 * 
 * Prevents duplicate warning notifications
 * 
 * @param clerkUserId - Clerk user ID
 * @param warningLevel - '80' or '100' percent
 */
export async function updateWarningFlag(
  clerkUserId: string,
  warningLevel: '80' | '100'
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const usage = await getOrCreateUsageForPeriod(clerkUserId);

    const updateData =
      warningLevel === '80'
        ? { warning_sent_80_percent: true }
        : { warning_sent_100_percent: true };

    const { error } = await supabase
      .from('user_conversation_usage')
      .update(updateData)
      .eq('usage_id', usage.usage_id);

    if (error) {
      logger.error('Failed to update warning flag:', { error, clerkUserId, warningLevel });
      throw error;
    }

    logger.info('Warning flag updated:', { clerkUserId, warningLevel });
  } catch (error) {
    logger.error('Update warning flag error:', error);
    throw error;
  }
}

/**
 * Get usage statistics for dashboard
 * 
 * Returns formatted data for UI display
 * 
 * @param clerkUserId - Clerk user ID
 * @returns Usage statistics
 */
export async function getUserUsageStats(clerkUserId: string): Promise<{
  used: number;
  limit: number;
  percentUsed: number;
  remaining: number;
  periodStart: Date;
  periodEnd: Date;
  resetDate: Date;
}> {
  try {
    const usage = await getOrCreateUsageForPeriod(clerkUserId);

    const used = usage.conversations_used;
    const limit = usage.conversations_limit;
    const percentUsed = Math.round((used / limit) * 100);
    const remaining = Math.max(0, limit - used);

    return {
      used,
      limit,
      percentUsed,
      remaining,
      periodStart: new Date(usage.period_start),
      periodEnd: new Date(usage.period_end),
      resetDate: new Date(usage.period_end),
    };
  } catch (error) {
    logger.error('Get user usage stats error:', error);
    throw error;
  }
}
