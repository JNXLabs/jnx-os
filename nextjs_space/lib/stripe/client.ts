/**
 * Stripe Client Configuration
 * 
 * Centralized Stripe setup for payment processing
 * Used for: Qryx subscriptions, billing management
 */

import Stripe from 'stripe';

/**
 * Stripe client instance
 * IMPORTANT: Only use on server-side (API routes, server components)
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
  typescript: true,
  appInfo: {
    name: 'JNX-OS',
    version: '2.0.0',
    url: 'https://www.jnxlabs.ai',
  },
});

/**
 * Pricing plan configuration
 * 
 * IMPORTANT: Update priceId values after creating prices in Stripe Dashboard
 * https://dashboard.stripe.com/test/products
 */
export interface PricingPlan {
  id: string;
  name: string;
  priceId: string; // Stripe Price ID (e.g., 'price_1ABC...')
  amount: number | null; // Amount in cents (null for custom pricing)
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  conversationLimit: number;
  isPopular: boolean;
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter_placeholder',
    amount: 2900, // $29.00
    currency: 'usd',
    interval: 'month',
    features: [
      '500 conversations/month',
      'Full widget customization',
      'Product recommendations',
      'Order tracking',
      'Standard analytics',
      'Email support (24h response)',
    ],
    conversationLimit: 500,
    isPopular: false,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional_placeholder',
    amount: 7900, // $79.00
    currency: 'usd',
    interval: 'month',
    features: [
      '2,000 conversations/month',
      'Everything in Starter',
      'Advanced analytics dashboard',
      'Unlimited custom prompts',
      'A/B testing (2 variants)',
      'Priority support (4h response)',
      'Conversion tracking',
    ],
    conversationLimit: 2000,
    isPopular: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_business_placeholder',
    amount: 19900, // $199.00
    currency: 'usd',
    interval: 'month',
    features: [
      '5,000 conversations/month',
      'Everything in Professional',
      'White label option',
      '5 A/B test variants',
      'Phone support',
      'Custom integrations',
      'Dedicated Slack channel',
    ],
    conversationLimit: 5000,
    isPopular: false,
  },
};

/**
 * Get pricing plan by ID
 */
export function getPricingPlan(planId: string): PricingPlan | null {
  return PRICING_PLANS[planId] || null;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number | null, currency: string = 'usd'): string {
  if (amount === null) return 'Custom';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  });
  
  return formatter.format(amount / 100);
}

/**
 * Validate Stripe configuration
 */
export function isStripeConfigured(): boolean {
  return (
    !!process.env.STRIPE_SECRET_KEY &&
    !!process.env.STRIPE_PUBLISHABLE_KEY &&
    !!process.env.STRIPE_WEBHOOK_SECRET
  );
}

/**
 * Get Stripe publishable key for client-side
 * Safe to expose to browser
 */
export function getPublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
}
