/**
 * Qryx Installation Endpoint
 * 
 * Initiates Shopify OAuth flow
 * Step 1: Merchant clicks "Install App" → Redirected here
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl, isValidShopDomain, generateNonce } from '@/lib/shopify/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/qryx/install?shop=example.myshopify.com
 * 
 * Validates shop domain and redirects to Shopify OAuth
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');

    // Validate shop parameter
    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop parameter' },
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

    // Generate OAuth state (nonce for CSRF protection)
    const state = generateNonce();

    // Get Shopify authorization URL
    const authUrl = await getAuthorizationUrl(shop, state);

    // Store state in session/cookie for validation in callback
    // TODO: Implement state storage (Redis, encrypted cookie, etc.)

    console.log('[Qryx Install] Redirecting to Shopify OAuth:', { shop, state });

    // Redirect to Shopify authorization page
    return NextResponse.redirect(authUrl);
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
