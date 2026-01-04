/**
 * Qryx Setup Page - Plan Selection & Installation
 * 
 * ENTERPRISE-GRADE SHOPIFY INSTALLATION FLOW
 * 
 * This page handles ALL customer scenarios:
 * 
 * SCENARIO 1: USER HAS JNX ACCOUNT + QRYX ALREADY PURCHASED FOR THIS SHOP
 *    - Show "Install Widget" button only
 *    - No pricing needed
 *    - Direct to OAuth installation
 * 
 * SCENARIO 2: USER HAS JNX ACCOUNT BUT NO QRYX FOR THIS SHOP
 *    - Show pricing/plan selection
 *    - After payment → OAuth installation
 * 
 * SCENARIO 3: USER NOT REGISTERED
 *    - Show "Sign In to Continue" 
 *    - After registration → Show pricing
 *    - After payment → OAuth installation
 * 
 * EMBEDDED (IFRAME) HANDLING:
 *    - Third-party cookies are BLOCKED in iframes
 *    - SOLUTION: Redirect entire browser window to auth
 *    - After auth, user returns here
 */

import Link from 'next/link';
import { ArrowLeft, Zap, TrendingUp, Building2, Sparkles, Check, Gift, Store, CheckCircle2 } from 'lucide-react';
import { currentUser } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { EmbeddedAuthRedirect } from './embedded-auth-redirect';
import { getShopByUserAndDomain } from '@/lib/db/qryx-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Try Qryx with basic features - no credit card required',
    features: [
      '50 conversations/month',
      'Basic widget',
      'Product recommendations',
      'Community support',
    ],
    icon: Gift,
    color: 'emerald',
    popular: false,
    isFree: true,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_PRICE_STARTER,
    description: 'Perfect for small Shopify stores getting started with AI',
    features: [
      '500 conversations/month',
      'Full widget customization',
      'Product recommendations',
      'Order tracking',
      'Standard analytics',
      'Email support (24h response)',
    ],
    icon: Zap,
    color: 'cyan',
    popular: false,
    isFree: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL,
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
    icon: TrendingUp,
    color: 'cyan',
    popular: true,
    isFree: false,
  },
  {
    id: 'business',
    name: 'Business',
    price: 199,
    priceId: process.env.STRIPE_PRICE_BUSINESS,
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
    icon: Building2,
    color: 'slate',
    popular: false,
    isFree: false,
  },
];

// Detect if request is from an iframe
function isInIframe(headersList: Headers): boolean {
  // Check Sec-Fetch-Dest header (modern browsers)
  const secFetchDest = headersList.get('sec-fetch-dest');
  if (secFetchDest === 'iframe') return true;
  
  // Check for Shopify-specific headers
  const shopifyHeader = headersList.get('x-shopify-api-request-failure-reauthorize');
  if (shopifyHeader) return true;
  
  return false;
}

export default async function QryxSetupPage({
  searchParams,
}: {
  searchParams: { shop?: string; auth_complete?: string; error?: string };
}) {
  const shop = searchParams?.shop;
  const authComplete = searchParams?.auth_complete === 'true';
  const errorParam = searchParams?.error;
  
  // Get request headers to detect iframe
  const headersList = headers();
  const isEmbedded = isInIframe(headersList);
  
  // Check if user is authenticated
  const user = await currentUser();

  // No shop? Show error
  if (!shop) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <Sparkles className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-white">Missing Shop Parameter</h1>
          <p className="mb-6 text-slate-400">
            Please start the installation from your Shopify Admin or use the correct installation link.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCENARIO 3: NOT AUTHENTICATED → Show Sign In UI
  // =========================================================================
  if (!user) {
    return <EmbeddedAuthRedirect shop={shop} />;
  }

  // =========================================================================
  // USER IS AUTHENTICATED - Check if they already have Qryx for this shop
  // =========================================================================
  let existingShop = null;
  try {
    existingShop = await getShopByUserAndDomain(user.id, shop);
  } catch (error) {
    console.error('[Qryx Setup] Error checking existing shop:', error);
  }

  // =========================================================================
  // SCENARIO 1: USER ALREADY HAS QRYX FOR THIS SHOP → Show Install Button
  // =========================================================================
  if (existingShop && existingShop.subscription_status && ['active', 'trialing', 'free'].includes(existingShop.subscription_status)) {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-500" />
                <span className="font-semibold text-white">Qryx Setup</span>
              </div>
            </div>
          </div>
        </header>

        {/* Already Purchased - Install Widget */}
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>

            <h1 className="mb-3 text-3xl font-bold text-white">
              Qryx is Ready!
            </h1>
            
            <p className="mb-2 text-lg text-slate-400">
              You already have an active <span className="text-cyan-400 font-medium capitalize">{existingShop.subscription_status === 'free' ? 'Free' : existingShop.plan_tier || 'Starter'}</span> plan.
            </p>
            
            <p className="mb-8 text-slate-500">
              Installing for: <span className="text-cyan-400">{shop}</span>
            </p>

            {/* Current Plan Info */}
            <div className="mb-8 rounded-xl border border-slate-800/60 bg-slate-900/40 p-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Store className="h-6 w-6 text-cyan-500" />
                <span className="text-lg font-semibold text-white">{existingShop.shop_name || shop}</span>
              </div>
              <div className="text-sm text-slate-400">
                Plan: <span className="text-white capitalize">{existingShop.plan_tier || 'Free'}</span>
                {existingShop.subscription_status === 'trialing' && (
                  <span className="ml-2 text-amber-400">(Trial)</span>
                )}
              </div>
            </div>

            {/* Install / Reinstall Widget Button */}
            <a
              href={`/api/qryx/start-oauth?shop=${encodeURIComponent(shop)}&plan=${existingShop.plan_tier || 'free'}`}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-8 py-4 font-semibold text-slate-900 transition-all hover:bg-cyan-400 shadow-lg shadow-cyan-500/25"
            >
              <Store className="h-5 w-5" />
              {existingShop.access_token ? 'Reinstall Widget' : 'Install Widget'}
            </a>

            <p className="mt-4 text-sm text-slate-500">
              This will connect Qryx to your Shopify store and add the chat widget.
            </p>

            {/* Manage Subscription Link */}
            <div className="mt-8 pt-6 border-t border-slate-800/50">
              <Link
                href="/app/billing"
                className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Manage your subscription →
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // SCENARIO 2: USER AUTHENTICATED BUT NO QRYX → Show Pricing Page
  // =========================================================================
  
  // Show error if any
  const showError = errorParam ? (
    <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center">
      <p className="text-sm text-red-400">
        {errorParam === 'missing_payment' && 'Payment is required for this plan.'}
        {errorParam === 'payment_incomplete' && 'Payment was not completed. Please try again.'}
        {errorParam === 'oauth_failed' && 'Failed to connect to Shopify. Please try again.'}
        {!['missing_payment', 'payment_incomplete', 'oauth_failed'].includes(errorParam) && `Error: ${errorParam}`}
      </p>
    </div>
  ) : null;
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              <span className="font-semibold text-white">Qryx Setup</span>
            </div>
          </div>
        </div>
      </header>

      {/* Shop indicator */}
      <div className="border-b border-slate-800/30 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-400">
            Installing for: <span className="text-cyan-400 font-medium">{shop}</span>
          </p>
        </div>
      </div>

      {/* Error display */}
      {showError && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          {showError}
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your <span className="text-cyan-400">Qryx</span> Plan
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Select the plan that fits your store&apos;s needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PRICING_PLANS.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            const isFree = plan.isFree;
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 transition-all hover:scale-[1.02] ${
                  isPopular
                    ? 'border-cyan-500/50 bg-slate-900/60 ring-1 ring-cyan-500/20'
                    : isFree
                    ? 'border-emerald-500/30 bg-slate-900/40'
                    : 'border-slate-800/60 bg-slate-900/40'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-900">
                      POPULAR
                    </span>
                  </div>
                )}

                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                  isFree ? 'bg-emerald-500/20' : 'bg-cyan-500/20'
                }`}>
                  <Icon className={`h-6 w-6 ${isFree ? 'text-emerald-500' : 'text-cyan-500'}`} />
                </div>

                <h3 className="mb-2 text-xl font-semibold text-white">{plan.name}</h3>
                <p className="mb-4 text-sm text-slate-400 min-h-[40px]">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-slate-400">/month</span>
                </div>

                <ul className="mb-6 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${isFree ? 'text-emerald-500' : 'text-cyan-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isFree ? (
                  <a
                    href={`/api/qryx/start-oauth?shop=${encodeURIComponent(shop)}&plan=free`}
                    className="block w-full rounded-lg bg-emerald-500 py-3 text-center font-semibold text-slate-900 transition-colors hover:bg-emerald-400"
                  >
                    Start Free
                  </a>
                ) : (
                  <form action="/api/stripe/checkout" method="POST">
                    <input type="hidden" name="shop" value={shop} />
                    <input type="hidden" name="priceId" value={plan.priceId} />
                    <input type="hidden" name="planName" value={plan.name} />
                    <button
                      type="submit"
                      className={`w-full rounded-lg py-3 font-semibold transition-colors ${
                        isPopular
                          ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400'
                          : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                    >
                      Subscribe Now
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
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
