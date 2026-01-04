/**
 * Qryx Setup Page - Plan Selection
 * 
 * ENTERPRISE-GRADE SHOPIFY INSTALLATION FLOW
 * 
 * This page handles ALL installation scenarios:
 * 
 * 1. DIRECT BROWSER ACCESS (not in iframe)
 *    - User opens install link directly
 *    - Normal Clerk auth works fine
 *    - Show pricing directly after login
 * 
 * 2. SHOPIFY ADMIN EMBEDDED (iframe)
 *    - Third-party cookies are BLOCKED
 *    - Clerk auth CANNOT work in iframe
 *    - SOLUTION: Redirect entire browser window to auth
 *    - After auth, user returns here
 * 
 * 3. RETURNING FROM AUTH (with auth_complete param)
 *    - User just completed auth on full page
 *    - Session is now valid
 *    - Show pricing
 */

import Link from 'next/link';
import { ArrowLeft, Zap, TrendingUp, Building2, Sparkles, Check, Gift } from 'lucide-react';
import { currentUser } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { EmbeddedAuthRedirect } from './embedded-auth-redirect';

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
  searchParams: { shop?: string; auth_complete?: string };
}) {
  const shop = searchParams?.shop;
  const authComplete = searchParams?.auth_complete === 'true';
  
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

  // Not authenticated? Show appropriate auth handler
  if (!user) {
    // Return client component that will handle the redirect properly
    return <EmbeddedAuthRedirect shop={shop} />;
  }

  // USER IS AUTHENTICATED - Show pricing page
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
