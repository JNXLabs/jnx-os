/**
 * Qryx Product Selection & Pricing Page
 * 
 * Step 3 in SaaS Installation Flow:
 * Shop saved → Login complete → HERE → Payment → OAuth
 * 
 * Displays pricing tiers and handles subscription selection
 */

import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { ArrowLeft, Zap, TrendingUp, Building2, Sparkles } from 'lucide-react';
import { hasValidShopSession } from '@/lib/session/shop-session';
import { PricingCard } from './pricing-card';

export const dynamic = 'force-dynamic';

/**
 * Pricing plan definitions
 */
const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    price: '$29',
    period: '/month',
    description: 'Perfect for small Shopify stores getting started with AI',
    features: [
      '500 conversations/month',
      'Full widget customization',
      'Product recommendations',
      'Order tracking',
      'Standard analytics',
      'Email support (24h response)',
    ],
    popular: false,
    color: 'cyan',
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: TrendingUp,
    price: '$79',
    period: '/month',
    description: 'Best for growing stores that need advanced features',
    features: [
      '2,000 conversations/month',
      'Everything in Starter',
      'Advanced analytics dashboard',
      'Unlimited custom prompts',
      'A/B testing (2 variants)',
      'Priority support (4h response)',
      'Conversion tracking',
    ],
    popular: true,
    color: 'blue',
  },
  {
    id: 'business',
    name: 'Business',
    icon: Building2,
    price: '$199',
    period: '/month',
    description: 'For established stores with premium requirements',
    features: [
      '5,000 conversations/month',
      'Everything in Professional',
      'White label option',
      '5 A/B test variants',
      'Phone support',
      'Custom integrations',
      'Dedicated Slack channel',
    ],
    popular: false,
    color: 'purple',
  },
];

export default async function QryxSetupPage() {
  // Check if user is authenticated
  const user = await currentUser();

  if (!user) {
    // Redirect to login with return URL
    redirect('/login?redirect_url=/products/qryx/setup');
  }

  // Check if shop session exists
  const hasShopSession = await hasValidShopSession();

  // TODO: Check if user already has a Qryx subscription
  // If they do, redirect to dashboard
  // const subscription = await getSubscription(user.id);
  // if (subscription?.status === 'active') {
  //   redirect('/app/qryx');
  // }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/products"
              className="flex items-center gap-2 text-slate-400 transition-colors hover:text-cyan-400"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Products</span>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              <span className="text-xl font-bold text-white">Qryx Setup</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Choose Your <span className="text-cyan-500">Qryx</span> Plan
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Select the plan that fits your store's needs. Upgrade or downgrade anytime.
          </p>
          {!hasShopSession && (
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-300">
                ⚠️ No shop detected. Please start the installation from your Shopify Admin.
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} hasShopSession={hasShopSession} />
          ))}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-400">
            All plans include 14-day free trial. No credit card required.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Cancel anytime. Your widget stays active until the end of your billing period.
          </p>
        </div>
      </main>
    </div>
  );
}
