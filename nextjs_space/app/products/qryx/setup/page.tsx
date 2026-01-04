/**
 * Qryx Product Selection & Pricing Page
 * 
 * Step 3 in SaaS Installation Flow:
 * Shop saved → Login complete → HERE → Payment → OAuth
 */

import Link from 'next/link';
import { ArrowLeft, Zap, TrendingUp, Building2, Sparkles, Check, Gift } from 'lucide-react';
import { currentUser } from '@clerk/nextjs/server';
import { EmbeddedAuth } from './embedded-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Try Qryx with basic features - no credit card required',
    features: [
      '50 conversations/month',
      'Basic widget',
      'Product recommendations',
      'Community support',
    ],
    popular: false,
    color: 'slate',
    isFree: true,
  },
  {
    id: 'starter',
    name: 'Starter',
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
    isFree: false,
  },
  {
    id: 'professional',
    name: 'Professional',
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
    isFree: false,
  },
  {
    id: 'business',
    name: 'Business',
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
    isFree: false,
  },
];

export default async function QryxSetupPage({
  searchParams,
}: {
  searchParams: { shop?: string };
}) {
  const shop = searchParams?.shop;

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
          <h1 className="mb-4 text-2xl font-bold text-white">Session Expired</h1>
          <p className="mb-6 text-slate-400">
            Your installation session has expired. Please restart the installation from your Shopify admin.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-900 hover:bg-cyan-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // Not authenticated? Show embedded auth handler
  if (!user) {
    return <EmbeddedAuth shop={shop} returnUrl={`/products/qryx/setup?shop=${shop}`} />;
  }

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

      {/* Shop Info Banner */}
      <div className="bg-slate-900/30 border-b border-slate-800/30">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-400">
            Installing for: <span className="text-cyan-400 font-medium">{shop}</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Choose Your <span className="text-cyan-500">Qryx</span> Plan
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Select the plan that fits your store&apos;s needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} shop={shop} />
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

function PricingCard({ plan, shop }: { plan: typeof PRICING_PLANS[0]; shop: string }) {
  const IconMap: Record<string, React.ElementType> = {
    free: Gift,
    starter: Zap,
    professional: TrendingUp,
    business: Building2,
  };
  const Icon = IconMap[plan.id] || Zap;

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border bg-slate-900/40 p-6 backdrop-blur-sm transition-all
        ${
          plan.popular
            ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/20'
            : 'border-slate-800/60 hover:border-slate-700'
        }
      `}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute right-3 top-3 rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-semibold text-slate-900">
          POPULAR
        </div>
      )}

      {/* Plan Header */}
      <div className="mb-4">
        <div className="mb-3 inline-flex rounded-lg bg-slate-800/50 p-2">
          <Icon className={`h-5 w-5 ${plan.isFree ? 'text-green-500' : 'text-cyan-500'}`} />
        </div>
        <h3 className="mb-1 text-xl font-bold text-white">{plan.name}</h3>
        <p className="text-xs text-slate-400">{plan.description}</p>
      </div>

      {/* Pricing */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold ${plan.isFree ? 'text-green-400' : 'text-white'}`}>{plan.price}</span>
          <span className="text-slate-400 text-sm">{plan.period}</span>
        </div>
      </div>

      {/* Features */}
      <ul className="mb-6 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className={`h-4 w-4 shrink-0 ${plan.isFree ? 'text-green-500' : 'text-cyan-500'}`} />
            <span className="text-xs text-slate-300">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      {plan.isFree ? (
        <a
          href={`/api/qryx/start-oauth?shop=${encodeURIComponent(shop)}&plan=free`}
          className="block w-full rounded-lg px-4 py-2.5 font-semibold text-center bg-green-600 text-white hover:bg-green-500 transition-all"
        >
          Start Free
        </a>
      ) : (
        <form action="/api/stripe/checkout" method="POST">
          <input type="hidden" name="planId" value={plan.id} />
          <input type="hidden" name="shop" value={shop} />
          <button
            type="submit"
            className={`
              w-full rounded-lg px-4 py-2.5 font-semibold transition-all
              ${
                plan.popular
                  ? 'bg-cyan-500 text-slate-900 hover:bg-cyan-400 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }
            `}
          >
            Subscribe Now
          </button>
        </form>
      )}
    </div>
  );
}
