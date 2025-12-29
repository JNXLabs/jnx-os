/**
 * Qryx Installation Endpoint - SaaS Flow
 * 
 * CRITICAL: This is NOT a direct OAuth flow anymore!
 * 
 * Phase 5 Multi-Step Flow:
 * 1. Save shop parameter in encrypted session
 * 2. Redirect to login/signup
 * 3. User selects pricing plan
 * 4. Payment via Stripe
 * 5. THEN OAuth (triggered after successful payment)
 * 
 * Step 1: Merchant clicks "Install App" → Redirected here → Saved → Login
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidShopDomain } from '@/lib/shopify/client';
import { setShopSession } from '@/lib/session/shop-session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/qryx/install?shop=example.myshopify.com
 * 
 * Validates shop domain, saves to session, redirects to login
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');

    // Validate shop parameter
    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop parameter. Expected: ?shop=yourstore.myshopify.com' },
        { status: 400 }
      );
    }

    // Validate shop domain format
    if (!isValidShopDomain(shop)) {
      return NextResponse.json(
        { error: 'Invalid shop domain. Must be *.myshopify.com' },
        { status: 400 }
      );
    }

    // Save shop parameter in encrypted session (30 min expiry)
    await setShopSession(shop);

    console.log('[Qryx Install] Shop saved to session:', { shop });

    // Build login URL with redirect to product selection
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_url', '/products/qryx/setup');

    console.log('[Qryx Install] Redirecting to login:', loginUrl.toString());

    // Redirect to JNX login (or signup if new user)
    // After login, user will be redirected to /products/qryx/setup
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('[Qryx Install] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate installation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
