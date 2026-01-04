/**
 * Complete Install Endpoint - Nach Login
 * 
 * Wird aufgerufen nachdem User sich eingeloggt/registriert hat.
 * Lädt die gespeicherte Install Session und erstellt den Shop Record.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserByClerkId, syncUserFromClerk } from '@/lib/db/helpers';
import { upsertShopifyShop } from '@/lib/db/qryx-helpers';
import { getShopInfo } from '@/lib/shopify/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jnxlabs.ai';
  const supabase = await createSupabaseServerClient();
  
  if (!supabase) {
    console.error('[Complete Install] Supabase client not available');
    return NextResponse.redirect(new URL('/products/qryx?error=db_error', baseUrl));
  }
  
  try {
    const sessionId = request.nextUrl.searchParams.get('install_session_id');
    
    if (!sessionId) {
      console.error('[Complete Install] Missing install_session_id');
      return NextResponse.redirect(new URL('/products/qryx?error=missing_session', baseUrl));
    }
    
    // =================================================================
    // SCHRITT 1: User muss eingeloggt sein
    // =================================================================
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      console.log('[Complete Install] User not logged in, redirecting to login');
      return NextResponse.redirect(
        new URL(`/login?redirect_url=${encodeURIComponent(`/api/qryx/complete-install?install_session_id=${sessionId}`)}`, baseUrl)
      );
    }
    
    console.log('[Complete Install] User authenticated:', clerkUser.id);
    
    // =================================================================
    // SCHRITT 2: Install Session aus DB laden
    // =================================================================
    const { data: session, error: sessionError } = await supabase
      .from('install_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('status', 'pending_auth')
      .single();
    
    if (sessionError || !session) {
      console.error('[Complete Install] Session not found or expired:', sessionError);
      return NextResponse.redirect(
        new URL('/products/qryx?error=session_expired', baseUrl)
      );
    }
    
    // Check ob Session abgelaufen
    if (new Date(session.expires_at) < new Date()) {
      console.error('[Complete Install] Session expired');
      await supabase.from('install_sessions').update({ status: 'expired' }).eq('id', sessionId);
      return NextResponse.redirect(
        new URL('/products/qryx?error=session_expired', baseUrl)
      );
    }
    
    console.log('[Complete Install] Session loaded:', { shop: session.shop_domain, plan: session.selected_plan });
    
    // =================================================================
    // SCHRITT 3: JNX User holen/erstellen
    // =================================================================
    let jnxUser = await getUserByClerkId(clerkUser.id);
    
    if (!jnxUser || !jnxUser.org_id) {
      console.log('[Complete Install] Creating JNX user...');
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      jnxUser = await syncUserFromClerk(clerkUser.id, email, clerkUser.firstName, clerkUser.lastName);
      
      if (!jnxUser?.org_id) {
        console.error('[Complete Install] Failed to create JNX user');
        return NextResponse.redirect(
          new URL('/products/qryx?error=user_creation_failed', baseUrl)
        );
      }
    }
    
    console.log('[Complete Install] JNX user ready:', { userId: jnxUser.user_id, orgId: jnxUser.org_id });
    
    // =================================================================
    // SCHRITT 4: Shop Info holen (optional, für bessere Daten)
    // =================================================================
    let shopInfo: any = { name: session.shop_domain, email: '', plan_name: '', shop_owner: '', country_code: '', currency: '', timezone: '' };
    try {
      shopInfo = await getShopInfo(session.shop_domain, session.access_token);
    } catch (e) {
      console.warn('[Complete Install] Could not fetch shop info:', e);
    }
    
    // =================================================================
    // SCHRITT 5: Shop Record erstellen
    // =================================================================
    const shopRecord = await upsertShopifyShop({
      org_id: jnxUser.org_id,
      clerk_user_id: clerkUser.id,
      shop_domain: session.shop_domain,
      shop_name: shopInfo.name,
      shop_email: shopInfo.email || '',
      shop_owner_name: shopInfo.shop_owner || '',
      access_token: session.access_token,
      scope: session.scope,
      shopify_plan: shopInfo.plan_name || '',
      country_code: shopInfo.country_code || '',
      currency: shopInfo.currency || '',
      timezone: shopInfo.timezone || '',
      subscription_status: 'pending', // Muss noch Plan wählen!
      plan_tier: session.selected_plan || 'trial',
    });
    
    console.log('[Complete Install] Shop created:', shopRecord.id);
    
    // =================================================================
    // SCHRITT 6: Session als completed markieren
    // =================================================================
    await supabase
      .from('install_sessions')
      .update({ 
        status: 'completed', 
        clerk_user_id: clerkUser.id,
        org_id: jnxUser.org_id,
        completed_at: new Date().toISOString() 
      })
      .eq('id', sessionId);
    
    // =================================================================
    // SCHRITT 7: Redirect zu Plan-Auswahl
    // =================================================================
    const planUrl = new URL('/products/qryx/plan-selection', baseUrl);
    planUrl.searchParams.set('shop', session.shop_domain);
    planUrl.searchParams.set('shop_id', shopRecord.id);
    
    console.log('[Complete Install] ✅ Installation complete, redirecting to plan selection');
    
    return NextResponse.redirect(planUrl.toString());
    
  } catch (error) {
    console.error('[Complete Install] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/products/qryx?error=unexpected', baseUrl)
    );
  }
}
