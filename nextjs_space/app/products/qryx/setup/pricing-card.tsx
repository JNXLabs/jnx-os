/**
 * Client-side Pricing Card Component
 * Handles Stripe Checkout redirect
 */
'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { ButtonPrimary } from '@/components/ui/button-primary';
import Link from 'next/link';

interface PricingPlan {
  id: string;
  name: string;
  icon: any;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  color: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  shop: string;
}

export function PricingCard({ plan, shop }: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const Icon = plan.icon;

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call checkout API with shop parameter
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: plan.id, shop }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('[PricingCard] Subscribe error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border bg-slate-900/40 p-8 backdrop-blur-sm transition-all
        ${
          plan.popular
            ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/20'
            : 'border-slate-800/60 hover:border-slate-700'
        }
      `}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute right-4 top-4 rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-900">
          POPULAR
        </div>
      )}

      {/* Plan Header */}
      <div className="mb-6">
        <div className="mb-4 inline-flex rounded-lg bg-slate-800/50 p-3">
          <Icon className={`h-6 w-6 text-${plan.color}-500`} />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-white">{plan.name}</h3>
        <p className="text-sm text-slate-400">{plan.description}</p>
      </div>

      {/* Pricing */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">{plan.price}</span>
          <span className="text-slate-400">{plan.period}</span>
        </div>
      </div>

      {/* Features */}
      <ul className="mb-8 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="h-5 w-5 shrink-0 text-cyan-500" />
            <span className="text-sm text-slate-300">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* CTA Button */}
      {plan.id === 'enterprise' ? (
        <Link href="mailto:sales@jnxlabs.ai?subject=Qryx Enterprise Plan">
          <ButtonPrimary className="w-full" size="lg" glow={plan.popular} type="button">
            Contact Sales
          </ButtonPrimary>
        </Link>
      ) : (
        <ButtonPrimary
          className="w-full"
          size="lg"
          glow={plan.popular}
          onClick={handleSubscribe}
          disabled={!shop || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Subscribe Now'
          )}
        </ButtonPrimary>
      )}
    </div>
  );
}
