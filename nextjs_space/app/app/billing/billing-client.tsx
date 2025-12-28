/**
 * Billing Client Component
 * 
 * Handles subscription display and management.
 * Ready for Stripe integration.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  CreditCard, 
  TrendingUp, 
  Zap, 
  Check, 
  Crown,
  Users,
  Activity,
  Calendar,
  DollarSign,
  ArrowUpRight,
  Lock
} from 'lucide-react'
import { ButtonPrimary } from '@/components/ui/button-primary'
import { ButtonSecondary } from '@/components/ui/button-secondary'
import { StatusBadge } from '@/components/ui/status-badge'
import type { JNXUser } from '@/lib/db/helpers'

interface BillingClientProps {
  jnxUser: JNXUser
}

// Pricing plans (placeholder - will be managed by Stripe)
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      'Up to 100 chat messages/month',
      '1 product integration',
      'Basic analytics',
      'Community support',
      '7-day data retention'
    ],
    limits: {
      messages: 100,
      products: 1,
      users: 1
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    features: [
      'Up to 1,000 chat messages/month',
      '3 product integrations',
      'Advanced analytics',
      'Email support',
      '30-day data retention',
      'Custom branding'
    ],
    limits: {
      messages: 1000,
      products: 3,
      users: 5
    },
    popular: true
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 99,
    interval: 'month',
    features: [
      'Up to 10,000 chat messages/month',
      'Unlimited product integrations',
      'Real-time analytics & AI insights',
      'Priority support',
      'Unlimited data retention',
      'Custom branding',
      'API access',
      'Advanced security features'
    ],
    limits: {
      messages: 10000,
      products: -1, // unlimited
      users: 20
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // Custom pricing
    interval: 'month',
    features: [
      'Unlimited chat messages',
      'Unlimited product integrations',
      'Dedicated AI infrastructure',
      '24/7 premium support',
      'Custom data retention',
      'White-label solutions',
      'SLA guarantees',
      'Dedicated account manager',
      'Custom integrations'
    ],
    limits: {
      messages: -1,
      products: -1,
      users: -1
    }
  }
]

export function BillingClient({ jnxUser }: BillingClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const currentPlan = 'free' // TODO: Get from database

  // Usage stats (placeholder - will come from database)
  const usageStats = {
    messages: {
      used: 47,
      limit: 100,
      percentage: 47
    },
    products: {
      used: 1,
      limit: 1
    },
    users: {
      used: 1,
      limit: 1
    }
  }

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true)
    // TODO: Integrate with Stripe
    alert(`Stripe integration coming soon! Selected plan: ${planId}`)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/app">
                <ButtonSecondary size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </ButtonSecondary>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Billing & Usage</h1>
                  <p className="text-slate-400 text-sm">Manage your subscription and track usage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Current Plan & Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Plan */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Current Plan</h3>
              <Crown className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2 capitalize">{currentPlan}</div>
            <StatusBadge status="online" className="mb-4">
              Active
            </StatusBadge>
            <p className="text-slate-300 text-sm">
              {currentPlan === 'free' ? 'Perfect for getting started' : 'Your current subscription'}
            </p>
          </div>

          {/* Messages Usage */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-sm">Chat Messages</h3>
              <Activity className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <div className="text-3xl font-bold text-white">{usageStats.messages.used}</div>
              <div className="text-slate-400">/ {usageStats.messages.limit}</div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${usageStats.messages.percentage}%` }}
              />
            </div>
            <p className="text-slate-400 text-xs">{usageStats.messages.percentage}% used this month</p>
          </div>

          {/* Billing Cycle */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-sm">Billing Cycle</h3>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-2">Monthly</div>
            <p className="text-slate-400 text-sm">
              Renews on <span className="text-white font-medium">Jan 1, 2025</span>
            </p>
            <div className="mt-4 flex items-center gap-2 text-cyan-400 text-sm">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">$0/month</span>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Choose Your Plan</h2>
            <p className="text-slate-400">Scale as you grow with flexible pricing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl p-6 backdrop-blur-sm transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-2 border-cyan-500/30 shadow-glow-primary'
                    : 'bg-slate-900/40 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Plan Header */}
                <div className="mb-6">
                  {plan.popular && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-medium mb-4">
                      <TrendingUp className="w-3 h-3" />
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    {plan.price !== null ? (
                      <>
                        <span className="text-4xl font-bold text-white">${plan.price}</span>
                        <span className="text-slate-400">/{plan.interval}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-white">Custom</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.id === currentPlan ? (
                  <ButtonSecondary className="w-full" disabled>
                    <Check className="w-4 h-4 mr-2" />
                    Current Plan
                  </ButtonSecondary>
                ) : plan.price === null ? (
                  <ButtonPrimary className="w-full" onClick={() => window.location.href = 'mailto:sales@jnxlabs.com'}>
                    <Crown className="w-4 h-4 mr-2" />
                    Contact Sales
                  </ButtonPrimary>
                ) : (
                  <ButtonPrimary
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading}
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Upgrade
                  </ButtonPrimary>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stripe Integration Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg flex-shrink-0">
              <Lock className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">Stripe Integration Coming Soon</h3>
              <p className="text-slate-300 text-sm mb-4">
                We're currently integrating Stripe for secure payment processing. Soon you'll be able to:
              </p>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  Subscribe to paid plans with credit card
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  Manage billing details and invoices
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  Track usage and costs in real-time
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  Automatic upgrades and downgrades
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Payment Method (Placeholder) */}
        <div className="mt-8 bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-500" />
            Payment Method
          </h3>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 mb-4">No payment method on file</p>
            <ButtonSecondary disabled>
              <Lock className="w-4 h-4 mr-2" />
              Add Payment Method
            </ButtonSecondary>
          </div>
        </div>
      </main>
    </div>
  )
}
