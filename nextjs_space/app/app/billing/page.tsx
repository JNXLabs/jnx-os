/**
 * JNX-OS Billing Page
 * 
 * Subscription management and usage tracking.
 * Stripe-ready infrastructure (integration pending).
 */

import { BillingClient } from './billing-client'
import { requireAuth } from '@/lib/auth/helpers'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  // Require authentication
  const { jnxUser } = await requireAuth()

  return <BillingClient jnxUser={jnxUser!} />
}
