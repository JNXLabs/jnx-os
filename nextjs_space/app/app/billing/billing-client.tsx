/**
 * Qryx Billing Client Component
 * 
 * Real-time subscription management, usage tracking, and plan upgrades
 * Integrated with Stripe for Qryx SaaS billing
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  CreditCard, 
  TrendingUp, 
  Check, 
  Crown,
  Activity,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
  AlertTriangle
} from 'lucide-react'
import { ButtonPrimary } from '@/components/ui/button-primary'
import { ButtonSecondary } from '@/components/ui/button-secondary'
import { StatusBadge } from '@/components/ui/status-badge'
import type { JNXUser } from '@/lib/db/helpers'
import { formatDistanceToNow } from 'date-fns'

interface BillingClientProps {
  jnxUser: JNXUser
}

interface Subscription {
  id: string
  plan_id: string
  plan_name: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  conversations_limit: number
  stripe_customer_id: string
}

interface UsageStats {
  conversationsUsed: number
  conversationsLimit: number
  percentage: number
  resetDate: string
  warningLevel: 0 | 80 | 100
}

interface Invoice {
  id: string
  amount: number
  status: string
  created: number
  invoice_pdf: string
}

// Qryx Pricing Plans
const QRYX_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    conversations: 500,
    features: [
      '500 AI conversations/month',
      'Basic product recommendations',
      'Email support',
      'Standard analytics',
      'Shopify integration'
    ],
    recommended: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    conversations: 2000,
    features: [
      '2,000 AI conversations/month',
      'Advanced product recommendations',
      'Priority email support',
      'Advanced analytics & insights',
      'Shopify integration',
      'Custom branding'
    ],
    recommended: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 199,
    conversations: 5000,
    features: [
      '5,000 AI conversations/month',
      'Premium product recommendations',
      'Priority support + Slack',
      'Real-time analytics & AI insights',
      'Shopify integration',
      'Custom branding',
      'API access',
      'Dedicated account manager'
    ],
    recommended: false
  }
]

export function BillingClient({ jnxUser }: BillingClientProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch subscription
      const subRes = await fetch('/api/qryx/subscription')
      if (subRes.ok) {
        const subData = await subRes.json()
        setSubscription(subData.subscription)
      }

      // Fetch usage stats
      const usageRes = await fetch('/api/qryx/usage')
      if (usageRes.ok) {
        const usageData = await usageRes.json()
        setUsage(usageData)
      }

      // Fetch invoices
      const invoicesRes = await fetch('/api/qryx/invoices')
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json()
        setInvoices(invoicesData.invoices || [])
      }
    } catch (err) {
      console.error('Failed to load billing data:', err)
      setError('Failed to load billing data. Please refresh the page.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    try {
      setIsUpgrading(true)
      setError(null)

      const response = await fetch('/api/qryx/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade plan')
      }

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        // Plan changed in-place (e.g., upgrade/downgrade)
        await loadBillingData()
      }
    } catch (err) {
      console.error('Upgrade error:', err)
      setError(err instanceof Error ? err.message : 'Failed to process upgrade')
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleManagePayment = async () => {
    try {
      const response = await fetch('/api/qryx/subscription/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      if (data.portalUrl) {
        window.location.href = data.portalUrl
      }
    } catch (err) {
      console.error('Portal error:', err)
      setError(err instanceof Error ? err.message : 'Failed to open billing portal')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading billing information...</p>
        </div>
      </div>
    )
  }

  const currentPlanId = subscription?.plan_id || 'starter'
  const currentPlan = QRYX_PLANS.find(p => p.id === currentPlanId) || QRYX_PLANS[0]

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
                  <p className="text-slate-400 text-sm">Manage your Qryx subscription</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
            <div className="text-3xl font-bold text-white mb-2">{currentPlan.name}</div>
            <StatusBadge status={subscription?.status === 'active' ? 'online' : 'degraded'} className="mb-4">
              {subscription?.status || 'No Subscription'}
            </StatusBadge>
            <div className="flex items-center gap-2 text-cyan-400 text-sm mt-4">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">${currentPlan.price}/month</span>
            </div>
          </div>

          {/* Conversation Usage */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-sm">AI Conversations</h3>
              <Activity className="w-5 h-5 text-slate-400" />
            </div>
            {usage ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <div className="text-3xl font-bold text-white">{usage.conversationsUsed}</div>
                  <div className="text-slate-400">/ {usage.conversationsLimit}</div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      usage.warningLevel === 100
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : usage.warningLevel === 80
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                    }`}
                    style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-slate-400 text-xs">
                  {usage.percentage}% used · Resets {formatDistanceToNow(new Date(usage.resetDate), { addSuffix: true })}
                </p>
                {usage.warningLevel >= 80 && (
                  <div className="mt-3 flex items-start gap-2">
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      usage.warningLevel === 100 ? 'text-red-400' : 'text-yellow-400'
                    }`} />
                    <p className={`text-xs ${
                      usage.warningLevel === 100 ? 'text-red-300' : 'text-yellow-300'
                    }`}>
                      {usage.warningLevel === 100
                        ? 'Limit reached! Upgrade to continue conversations.'
                        : 'Approaching limit. Consider upgrading your plan.'}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-400">No usage data available</p>
            )}
          </div>

          {/* Billing Cycle */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 text-sm">Billing Cycle</h3>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            {subscription ? (
              <>
                <div className="text-2xl font-bold text-white mb-2">Monthly</div>
                <p className="text-slate-400 text-sm mb-4">
                  Renews <span className="text-white font-medium">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                </p>
                {subscription.cancel_at_period_end && (
                  <div className="flex items-start gap-2 mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-300 text-xs">
                      Subscription will cancel at period end
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-400">No active subscription</p>
            )}
          </div>
        </div>

        {/* Available Plans */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Upgrade Your Plan</h2>
            <p className="text-slate-400">Scale your AI sales assistant as your business grows</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {QRYX_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl p-6 backdrop-blur-sm transition-all ${
                  plan.recommended
                    ? 'bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-2 border-cyan-500/30 shadow-glow-primary'
                    : 'bg-slate-900/40 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Plan Header */}
                <div className="mb-6">
                  {plan.recommended && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-medium mb-4">
                      <TrendingUp className="w-3 h-3" />
                      Recommended
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-slate-400">/month</span>
                  </div>
                  <p className="text-cyan-400 text-sm font-medium">{plan.conversations.toLocaleString()} conversations/mo</p>
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
                {plan.id === currentPlanId ? (
                  <ButtonSecondary className="w-full" disabled>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Current Plan
                  </ButtonSecondary>
                ) : (
                  <ButtonPrimary
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                    )}
                    {QRYX_PLANS.findIndex(p => p.id === plan.id) > QRYX_PLANS.findIndex(p => p.id === currentPlanId)
                      ? 'Upgrade'
                      : 'Change Plan'}
                  </ButtonPrimary>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment & Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Method */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-500" />
              Payment Method
            </h3>
            {subscription?.stripe_customer_id ? (
              <div className="space-y-4">
                <p className="text-slate-300 text-sm">Manage your payment method and billing details through Stripe.</p>
                <ButtonSecondary onClick={handleManagePayment} className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage in Stripe
                </ButtonSecondary>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400 mb-4">No payment method on file</p>
                <p className="text-slate-400 text-sm">Subscribe to a plan to add payment details</p>
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-cyan-500" />
              Invoice History
            </h3>
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg hover:bg-slate-800/60 transition-colors"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">${(invoice.amount / 100).toFixed(2)}</p>
                      <p className="text-slate-400 text-xs">{new Date(invoice.created * 1000).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={invoice.status === 'paid' ? 'online' : 'degraded'}>
                        {invoice.status}
                      </StatusBadge>
                      {invoice.invoice_pdf && (
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">No invoices yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
