/**
 * Qryx Installation Endpoint - SaaS Flow
 * 
 * CRITICAL: This is NOT a direct OAuth flow anymore!
 * 
 * Phase 5 Multi-Step Flow:
 * 1. Save shop parameter in encrypted session
 * 2. Check if user is already authenticated
 *    - If YES → Redirect directly to /products/qryx/setup
 *    - If NO → Redirect to login/signup
 * 3. User selects pricing plan
 * 4. Payment via Stripe
 * 5. THEN OAuth (triggered after successful payment)
 * 
 * Step 1: Merchant clicks "Install App" → Redirected here → Saved → Login/Setup
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple shop domain validation
function isValidShop(shop: string): boolean {
  if (!shop) return false;
  const cleaned = shop.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  return cleaned.endsWith('.myshopify.com');
}

/**
 * GET /api/qryx/install?shop=example.myshopify.com
 * 
 * Simplified: Just validate and redirect. Shop is passed via URL params.
 */
export async function GET(request: NextRequest) {
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
  if (!isValidShop(shop)) {
    return NextResponse.json(
      { error: 'Invalid shop domain. Must be *.myshopify.com' },
      { status: 400 }
    );
  }

  // Simple redirect - pass shop via URL, no cookies/session needed here
  const baseUrl = 'https://www.jnxlabs.ai';
  const setupUrl = `${baseUrl}/products/qryx/setup?shop=${encodeURIComponent(shop)}`;
  
  return NextResponse.redirect(setupUrl);
}
