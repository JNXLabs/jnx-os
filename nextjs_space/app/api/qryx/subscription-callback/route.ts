/**
 * Subscription Callback - Nach Shopify Billing
 * 
 * Wird aufgerufen nachdem User die Zahlung in Shopify bestätigt hat.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { installChatWidget } from '@/lib/shopify/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jnxlabs.ai';
  
  try {
    const shop = request.nextUrl.searchParams.get('shop');
    const shopId = request.nextUrl.searchParams.get('shop_id');
    const chargeId = request.nextUrl.searchParams.get('charge_id');
    
    if (!shop || !shopId) {
      return NextResponse.redirect(new URL('/products/qryx?error=missing_params', baseUrl));
    }
    
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.redirect(new URL('/login', baseUrl));
    }
    
    const supabase = await createSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.redirect(new URL('/products/qryx?error=db_error', baseUrl));
    }
    
    // Get shop data
    const { data: shopData, error: shopError } = await supabase
      .from('shopify_shops')
      .select('*')
      .eq('id', shopId)
      .eq('clerk_user_id', clerkUser.id)
      .single();
    
    if (shopError || !shopData) {
      console.error('[Subscription Callback] Shop not found');
      return NextResponse.redirect(new URL('/products/qryx?error=shop_not_found', baseUrl));
    }
    
    console.log('[Subscription Callback] Verifying charge for shop:', shop);
    
    // Verify the charge status with Shopify
    const verifyChargeId = chargeId || shopData.shopify_charge_id;
    
    if (verifyChargeId) {
      const chargeResponse = await fetch(
        `https://${shop}/admin/api/2024-01/recurring_application_charges/${verifyChargeId}.json`,
        {
          headers: {
            'X-Shopify-Access-Token': shopData.access_token,
          },
        }
      );
      
      if (chargeResponse.ok) {
        const chargeData = await chargeResponse.json();
        const status = chargeData.recurring_application_charge?.status;
        
        console.log('[Subscription Callback] Charge status:', status);
        
        if (status === 'active') {
          // Payment confirmed! Update shop status
          await supabase
            .from('shopify_shops')
            .update({
              subscription_status: 'active',
              shopify_charge_id: verifyChargeId,
            })
            .eq('id', shopId);
          
          // Install widget if not already installed
          if (!shopData.script_tag_id) {
            try {
              const scriptTagId = await installChatWidget(shop, shopData.access_token, shopId);
              console.log('[Subscription Callback] Widget installed:', scriptTagId);
              
              await supabase
                .from('shopify_shops')
                .update({ script_tag_id: scriptTagId?.toString() })
                .eq('id', shopId);
            } catch (widgetError) {
              console.error('[Subscription Callback] Widget install failed:', widgetError);
            }
          }
          
          console.log('[Subscription Callback] Subscription activated successfully');
          return NextResponse.redirect(new URL(`/app/qryx?shop=${shop}&activated=true`, baseUrl));
        } else if (status === 'declined') {
          // Payment declined
          await supabase
            .from('shopify_shops')
            .update({ subscription_status: 'declined' })
            .eq('id', shopId);
          
          return NextResponse.redirect(new URL(`/products/qryx/plan-selection?shop=${shop}&shop_id=${shopId}&error=payment_declined`, baseUrl));
        }
      }
    }
    
    // Fallback: Check if subscription is already active
    if (shopData.subscription_status === 'active' || shopData.subscription_status === 'trial') {
      return NextResponse.redirect(new URL(`/app/qryx?shop=${shop}`, baseUrl));
    }
    
    // Unknown state - redirect back to plan selection
    return NextResponse.redirect(new URL(`/products/qryx/plan-selection?shop=${shop}&shop_id=${shopId}&error=unknown_status`, baseUrl));
    
  } catch (error) {
    console.error('[Subscription Callback] Error:', error);
    return NextResponse.redirect(new URL('/products/qryx?error=unexpected', baseUrl));
  }
}
