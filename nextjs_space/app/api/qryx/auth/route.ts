/**
 * Qryx Auth Redirect Endpoint
 * 
 * Alternative entry point for Shopify OAuth
 * Used when accessing from Shopify Partners or direct link
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidShopDomain } from '@/lib/shopify/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/qryx/auth?shop=example.myshopify.com
 * 
 * Redirects to /api/qryx/install to initiate OAuth
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

    console.log('[Qryx Auth] Redirecting to install:', { shop });

    // Redirect to install endpoint
    const installUrl = new URL('/api/qryx/install', request.url);
    installUrl.searchParams.set('shop', shop);

    return NextResponse.redirect(installUrl.toString());
  } catch (error) {
    console.error('[Qryx Auth] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process authentication',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
