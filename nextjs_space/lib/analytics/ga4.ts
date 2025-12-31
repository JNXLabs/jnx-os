/**
 * Google Analytics 4 (GA4) Integration
 * 
 * Provides utilities for tracking events and conversions
 * in the Qryx application.
 */

// Type definitions for gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

/**
 * Check if GA4 is initialized
 */
export function isGA4Enabled(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag !== 'undefined';
}

/**
 * Track a pageview
 * Automatically called by Next.js router events
 */
export function trackPageView(url: string) {
  if (!isGA4Enabled()) return;

  window.gtag!('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
    page_path: url,
  });
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, any>
) {
  if (!isGA4Enabled()) return;

  window.gtag!('event', eventName, parameters);
}

/**
 * Track user signup
 */
export function trackSignup(method: 'email' | 'google' = 'email') {
  trackEvent('sign_up', {
    method,
  });
}

/**
 * Track user login
 */
export function trackLogin(method: 'email' | 'google' = 'email') {
  trackEvent('login', {
    method,
  });
}

/**
 * Track subscription start
 */
export function trackSubscriptionStart(planId: string, value: number) {
  trackEvent('purchase', {
    transaction_id: `sub_${Date.now()}`,
    value,
    currency: 'USD',
    items: [
      {
        item_id: planId,
        item_name: `Qryx ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
        item_category: 'subscription',
        price: value,
        quantity: 1,
      },
    ],
  });

  // Also track as a conversion
  trackEvent('begin_checkout', {
    currency: 'USD',
    value,
    items: [
      {
        item_id: planId,
        item_name: `Qryx ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
      },
    ],
  });
}

/**
 * Track subscription upgrade/downgrade
 */
export function trackSubscriptionChange(
  oldPlan: string,
  newPlan: string,
  value: number
) {
  trackEvent('subscription_change', {
    old_plan: oldPlan,
    new_plan: newPlan,
    value,
    currency: 'USD',
  });
}

/**
 * Track usage milestone
 */
export function trackUsageMilestone(
  milestone: '25%' | '50%' | '75%' | '80%' | '100%',
  conversationsUsed: number,
  conversationsLimit: number
) {
  trackEvent('usage_milestone', {
    milestone,
    conversations_used: conversationsUsed,
    conversations_limit: conversationsLimit,
    percentage: Math.round((conversationsUsed / conversationsLimit) * 100),
  });
}

/**
 * Track conversation started
 */
export function trackConversationStart(shopDomain: string) {
  trackEvent('conversation_start', {
    shop_domain: shopDomain,
  });
}

/**
 * Track conversation completed
 */
export function trackConversationComplete(
  shopDomain: string,
  messageCount: number,
  duration: number
) {
  trackEvent('conversation_complete', {
    shop_domain: shopDomain,
    message_count: messageCount,
    duration_seconds: duration,
  });
}

/**
 * Track product recommendation
 */
export function trackProductRecommendation(
  shopDomain: string,
  productCount: number
) {
  trackEvent('product_recommendation', {
    shop_domain: shopDomain,
    product_count: productCount,
  });
}

/**
 * Track Shopify OAuth success
 */
export function trackShopifyOAuthSuccess(shopDomain: string) {
  trackEvent('shopify_oauth_success', {
    shop_domain: shopDomain,
  });
}

/**
 * Track error
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  errorLocation: string
) {
  trackEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
    error_location: errorLocation,
  });
}
