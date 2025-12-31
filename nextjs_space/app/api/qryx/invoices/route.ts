/**
 * Qryx Invoices API
 * 
 * GET: Fetch user's invoice history from Stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getSubscription } from '@/lib/db/billing-helpers';
import { stripe } from '@/lib/stripe/client';
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('api/qryx/invoices');

export const dynamic = 'force-dynamic';

/**
 * GET /api/qryx/invoices
 * 
 * Returns the user's invoice history from Stripe
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user's subscription to find Stripe customer ID
    const subscription = await getSubscription(user.id);

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { invoices: [], message: 'No Stripe customer ID found' },
        { status: 200 }
      );
    }

    // 3. Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: subscription.stripe_customer_id,
      limit: 12, // Last 12 invoices
    });

    // 4. Format and return
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      status: invoice.status || 'unknown',
      created: invoice.created,
      invoice_pdf: invoice.invoice_pdf || '',
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
    });
  } catch (error) {
    logger.error('Get invoices error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch invoices',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
