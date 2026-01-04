/**
 * Plan Selection Page - Nach Shop-Erstellung
 * 
 * User wählt hier seinen Plan:
 * - Free Trial (7 Tage, voller Zugang)
 * - Starter ($29.99/mo)
 * - Professional ($79.99/mo)
 * 
 * Nach Auswahl wird Widget installiert und User zum Dashboard geleitet.
 */

import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PlanSelectionClient from './plan-selection-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { shop?: string; shop_id?: string; error?: string };
}

export default async function PlanSelectionPage({ searchParams }: PageProps) {
  const { shop, shop_id, error } = searchParams;
  
  // Validate user is logged in
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect('/login');
  }
  
  // Validate shop params
  if (!shop || !shop_id) {
    redirect('/products/qryx?error=missing_shop');
  }
  
  // Fetch shop from DB to verify ownership
  const supabase = await createSupabaseServerClient();
  
  if (!supabase) {
    redirect('/products/qryx?error=db_error');
  }
  
  const { data: shopData, error: shopError } = await supabase
    .from('shopify_shops')
    .select('*')
    .eq('id', shop_id)
    .eq('clerk_user_id', clerkUser.id)
    .single();
  
  if (shopError || !shopData) {
    console.error('[Plan Selection] Shop not found:', shopError);
    redirect('/products/qryx?error=shop_not_found');
  }
  
  // If shop already has active subscription, redirect to dashboard
  if (shopData.subscription_status === 'active' || shopData.subscription_status === 'trial') {
    redirect(`/app/qryx?shop=${shop}`);
  }
  
  return (
    <PlanSelectionClient 
      shop={shop} 
      shopId={shop_id} 
      shopName={shopData.shop_name || shop}
      error={error}
    />
  );
}
