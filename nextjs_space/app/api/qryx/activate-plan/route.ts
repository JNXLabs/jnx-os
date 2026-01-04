/**
 * Activate Plan Endpoint
 * 
 * Aktiviert den gewählten Plan:
 * - Trial: Sofort aktivieren, Widget installieren
 * - Paid: Shopify Subscription erstellen, User zu Shopify Billing leiten
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { installChatWidget } from '@/lib/shopify/client';

export const dynamic = 'force-dynamic';

const PLAN_PRICES: Record<string, number> = {
  starter: 29.99,
  professional: 79.99,
};

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { shop, shopId, plan } = await request.json();
    
    if (!shop || !shopId || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = await createSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }
    
    // Verify shop ownership
    const { data: shopData, error: shopError } = await supabase
      .from('shopify_shops')
      .select('*')
      .eq('id', shopId)
      .eq('clerk_user_id', clerkUser.id)
      .single();
    
    if (shopError || !shopData) {
      console.error('[Activate Plan] Shop not found:', shopError);
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    
    console.log('[Activate Plan] Activating plan:', { shop, plan, shopId });
    
    // =================================================================
    // TRIAL: Sofort aktivieren
    // =================================================================
    if (plan === 'trial') {
      const trialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      // Update shop status
      await supabase
        .from('shopify_shops')
        .update({
          subscription_status: 'trial',
          trial_started_at: new Date().toISOString(),
          trial_expires_at: trialExpiresAt.toISOString(),
          plan_tier: 'trial',
        })
        .eq('id', shopId);
      
      // Install widget
      try {
        const scriptTagId = await installChatWidget(shop, shopData.access_token, shopId);
        console.log('[Activate Plan] Widget installed:', scriptTagId);
        
        // Update script_tag_id
        await supabase
          .from('shopify_shops')
          .update({ script_tag_id: scriptTagId?.toString() })
          .eq('id', shopId);
      } catch (widgetError) {
        console.error('[Activate Plan] Widget install failed:', widgetError);
        // Don't fail the whole request - widget can be installed later
      }
      
      console.log('[Activate Plan] Trial activated successfully');
      return NextResponse.json({ success: true, plan: 'trial' });
    }
    
    // =================================================================
    // PAID: Shopify Subscription erstellen
    // =================================================================
    const price = PLAN_PRICES[plan];
    if (!price) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jnxlabs.ai';
    const returnUrl = `${baseUrl}/api/qryx/subscription-callback?shop=${shop}&shop_id=${shopId}`;
    
    // Create Shopify Recurring Application Charge
    const chargeResponse = await fetch(`https://${shop}/admin/api/2024-01/recurring_application_charges.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': shopData.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recurring_application_charge: {
          name: `Qryx ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
          price: price,
          return_url: returnUrl,
          trial_days: 0, // No trial for paid plans if they skipped free trial
          test: process.env.NODE_ENV !== 'production', // Test mode for dev stores
        },
      }),
    });
    
    if (!chargeResponse.ok) {
      const errorText = await chargeResponse.text();
      console.error('[Activate Plan] Failed to create Shopify charge:', errorText);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }
    
    const chargeData = await chargeResponse.json();
    const confirmationUrl = chargeData.recurring_application_charge?.confirmation_url;
    
    if (!confirmationUrl) {
      console.error('[Activate Plan] No confirmation URL in response:', chargeData);
      return NextResponse.json({ error: 'Invalid response from Shopify' }, { status: 500 });
    }
    
    // Save pending charge ID
    await supabase
      .from('shopify_shops')
      .update({
        shopify_charge_id: chargeData.recurring_application_charge.id?.toString(),
        subscription_status: 'pending_payment',
        plan_tier: plan,
      })
      .eq('id', shopId);
    
    console.log('[Activate Plan] Shopify charge created, redirecting to:', confirmationUrl);
    
    return NextResponse.json({ 
      success: true, 
      redirectUrl: confirmationUrl,
      plan: plan,
    });
    
  } catch (error) {
    console.error('[Activate Plan] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
