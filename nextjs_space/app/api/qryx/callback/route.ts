/**
 * Qryx OAuth Callback Endpoint - SHOPIFY-NATIVE FLOW
 * 
 * KRITISCH: OAuth Code wird SOFORT gegen Access Token getauscht!
 * Der Code ist nur einmal verwendbar und läuft schnell ab.
 * 
 * Flow:
 * 1. User installiert App in Shopify → OAuth → Redirect hierher
 * 2. SOFORT: Exchange code → access_token (bevor er abläuft!)
 * 3. Speichere access_token in install_sessions
 * 4. User eingeloggt? 
 *    - JA → Erstelle Shop, redirect zu Plan-Auswahl
 *    - NEIN → Redirect zu /login mit install_session_id
 * 5. Nach Login/Signup → /api/qryx/complete-install
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { validateOAuthCallback, getShopInfo } from '@/lib/shopify/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserByClerkId, syncUserFromClerk } from '@/lib/db/helpers';
import { upsertShopifyShop } from '@/lib/db/qryx-helpers';
import { installChatWidget } from '@/lib/shopify/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jnxlabs.ai';
  const supabase = await createSupabaseServerClient();
  
  if (!supabase) {
    console.error('[Qryx Callback] Supabase client not available');
    return NextResponse.redirect(new URL('/products/qryx?error=db_error', baseUrl));
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const code = searchParams.get('code');
    const hmac = searchParams.get('hmac');
    const state = searchParams.get('state'); // Optional - nur wenn von /start-oauth

    console.log('[Qryx Callback] Received OAuth callback:', { shop, hasCode: !!code, hasHmac: !!hmac, hasState: !!state });

    // Validate required parameters (state ist OPTIONAL für native Shopify installs)
    if (!shop || !code) {
      console.error('[Qryx Callback] Missing required parameters:', { shop, hasCode: !!code });
      return NextResponse.redirect(
        new URL('/products/qryx?error=missing_shop_param', baseUrl)
      );
    }

    // =================================================================
    // SCHRITT 1: SOFORT Code gegen Access Token tauschen!
    // =================================================================
    console.log('[Qryx Callback] Exchanging OAuth code for access token...');
    
    let accessToken: string;
    let scope: string;
    
    try {
      const oauthResult = await validateOAuthCallback(shop, code, state || 'direct_install');
      accessToken = oauthResult.accessToken;
      scope = oauthResult.scope;
      console.log('[Qryx Callback] ✅ Access token received successfully');
    } catch (oauthError) {
      console.error('[Qryx Callback] ❌ OAuth exchange failed:', oauthError);
      return NextResponse.redirect(
        new URL(`/products/qryx?error=oauth_failed&shop=${encodeURIComponent(shop)}`, baseUrl)
      );
    }

    // =================================================================
    // SCHRITT 2: Shop Info von Shopify holen
    // =================================================================
    let shopInfo;
    try {
      shopInfo = await getShopInfo(shop, accessToken);
      console.log('[Qryx Callback] Shop info:', { name: shopInfo.name, email: shopInfo.email });
    } catch (shopError) {
      console.error('[Qryx Callback] Failed to get shop info:', shopError);
      // Nicht fatal - wir haben den access token
      shopInfo = { name: shop, email: '', plan_name: 'unknown', shop_owner: '', country_code: '', currency: '', timezone: '' };
    }

    // =================================================================
    // SCHRITT 3: Check ob User eingeloggt ist
    // =================================================================
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      // User NICHT eingeloggt → Speichere Session, redirect zu Login
      console.log('[Qryx Callback] User not logged in, creating install session...');
      
      // Parse plan from state if present
      const stateParts = state ? state.split('_') : [];
      const selectedPlan = stateParts.length >= 2 ? stateParts[1] : 'trial';
      
      // Erstelle Install Session in DB
      const { data: session, error: sessionError } = await supabase
        .from('install_sessions')
        .insert({
          shop_domain: shop,
          shop_id: shopInfo.id || null,
          access_token: accessToken,
          scope: scope,
          status: 'pending_auth',
          selected_plan: selectedPlan,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error('[Qryx Callback] Failed to create install session:', sessionError);
        return NextResponse.redirect(
          new URL(`/products/qryx?error=session_failed&shop=${encodeURIComponent(shop)}`, baseUrl)
        );
      }
      
      console.log('[Qryx Callback] Install session created:', session.id);
      
      // Redirect zu Login mit Session ID
      const loginUrl = new URL('/login', baseUrl);
      loginUrl.searchParams.set('install_session_id', session.id);
      loginUrl.searchParams.set('shop', shop);
      loginUrl.searchParams.set('redirect_url', `/api/qryx/complete-install?install_session_id=${session.id}`);
      
      return NextResponse.redirect(loginUrl.toString());
    }

    // =================================================================
    // SCHRITT 4: User IST eingeloggt → Direkte Installation
    // =================================================================
    console.log('[Qryx Callback] User authenticated:', clerkUser.id);
    
    // Get or create JNX user
    let jnxUser = await getUserByClerkId(clerkUser.id);
    
    if (!jnxUser || !jnxUser.org_id) {
      console.log('[Qryx Callback] Syncing user from Clerk...');
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      jnxUser = await syncUserFromClerk(clerkUser.id, email, clerkUser.firstName, clerkUser.lastName);
      
      if (!jnxUser?.org_id) {
        console.error('[Qryx Callback] Failed to sync user');
        return NextResponse.redirect(
          new URL(`/products/qryx?error=user_sync_failed&shop=${encodeURIComponent(shop)}`, baseUrl)
        );
      }
    }
    
    // Parse plan from state
    const stateParts = state ? state.split('_') : [];
    const selectedPlan = stateParts.length >= 2 ? stateParts[1] : 'trial';
    
    // Erstelle Shop Record
    const shopRecord = await upsertShopifyShop({
      org_id: jnxUser.org_id,
      clerk_user_id: clerkUser.id,
      shop_domain: shop,
      shop_name: shopInfo.name,
      shop_email: shopInfo.email,
      shop_owner_name: shopInfo.shop_owner || '',
      access_token: accessToken,
      scope: scope,
      shopify_plan: shopInfo.plan_name,
      country_code: shopInfo.country_code || '',
      currency: shopInfo.currency || '',
      timezone: shopInfo.timezone || '',
      subscription_status: 'pending', // Muss noch Plan wählen!
      plan_tier: selectedPlan,
    });
    
    console.log('[Qryx Callback] Shop created:', shopRecord.id);
    
    // Redirect zu Plan-Auswahl (Widget wird erst NACH Plan-Aktivierung installiert)
    const planUrl = new URL('/products/qryx/plan-selection', baseUrl);
    planUrl.searchParams.set('shop', shop);
    planUrl.searchParams.set('shop_id', shopRecord.id);
    
    return NextResponse.redirect(planUrl.toString());
    
  } catch (error) {
    console.error('[Qryx Callback] Unexpected error:', error);
    const shop = request.nextUrl.searchParams.get('shop');
    return NextResponse.redirect(
      new URL(`/products/qryx?error=unexpected&shop=${shop || ''}`, baseUrl)
    );
  }
}
