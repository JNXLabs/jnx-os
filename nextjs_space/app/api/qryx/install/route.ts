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
import { currentUser } from '@clerk/nextjs/server';
import { setShopSession } from '@/lib/session/shop-session';

export const dynamic = 'force-dynamic';

// Simple shop domain validation (no external dependencies)
function isValidShop(shop: string): boolean {
  if (!shop) return false;
  const cleaned = shop.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  return cleaned.endsWith('.myshopify.com');
}

/**
 * GET /api/qryx/install?shop=example.myshopify.com
 * 
 * Validates shop domain, saves to session, redirects to login OR setup
 */
export async function GET(request: NextRequest) {
  console.log('[Qryx Install] === START ===');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    
    console.log('[Qryx Install] Shop param:', shop);

    // Validate shop parameter
    if (!shop) {
      console.log('[Qryx Install] ERROR: Missing shop parameter');
      return NextResponse.json(
        { error: 'Missing shop parameter. Expected: ?shop=yourstore.myshopify.com' },
        { status: 400 }
      );
    }

    // Validate shop domain format
    if (!isValidShop(shop)) {
      console.log('[Qryx Install] ERROR: Invalid shop domain:', shop);
      return NextResponse.json(
        { error: 'Invalid shop domain. Must be *.myshopify.com' },
        { status: 400 }
      );
    }

    console.log('[Qryx Install] Shop domain valid, saving to session...');

    // Save shop parameter in encrypted session (30 min expiry)
    try {
      await setShopSession(shop);
      console.log('[Qryx Install] Shop saved to session successfully');
    } catch (sessionError) {
      console.error('[Qryx Install] Session save error:', sessionError);
      // Continue anyway - session is nice-to-have for UX
    }

    // CRITICAL: Check if user is already authenticated
    console.log('[Qryx Install] Checking authentication...');
    
    let user = null;
    try {
      user = await currentUser();
      console.log('[Qryx Install] Auth check result:', user ? `User ${user.id}` : 'Not authenticated');
    } catch (authError) {
      console.error('[Qryx Install] Auth check error:', authError);
      // Continue with unauthenticated flow
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jnxlabs.ai';

    if (user) {
      // User is already logged in → Skip login, go directly to setup
      console.log('[Qryx Install] User authenticated, redirecting to setup');
      const setupUrl = `${baseUrl}/products/qryx/setup`;
      return NextResponse.redirect(setupUrl);
    } else {
      // User is NOT logged in → Redirect to login with return URL
      console.log('[Qryx Install] User not authenticated, redirecting to login');
      const loginUrl = `${baseUrl}/login?redirect_url=/products/qryx/setup`;
      return NextResponse.redirect(loginUrl);
    }
  } catch (error) {
    console.error('[Qryx Install] FATAL ERROR:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate installation',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
