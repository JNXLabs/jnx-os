/**
 * Qryx Dashboard Page
 * 
 * Shop owner interface for managing Qryx AI Sales Assistant
 * - View analytics and chat history
 * - Configure widget appearance
 * - Manage subscription
 * 
 * Access: Requires authenticated user with linked Shopify shop
 */

import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/helpers';
import { getShopifyShopByOrg } from '@/lib/db/qryx-helpers';
import QryxDashboardClient from './qryx-dashboard-client';

export const dynamic = 'force-dynamic';

export default async function QryxDashboardPage() {
  // Require authentication
  const { user, jnxUser } = await requireAuth();

  if (!jnxUser?.org_id) {
    redirect('/login');
  }

  // Ensure user is loaded before rendering
  if (!user) {
    redirect('/login');
  }

  // Get Shopify shop for this organization
  let shop;
  try {
    shop = await getShopifyShopByOrg(jnxUser.org_id);
  } catch (error) {
    console.error('[Qryx Dashboard] Error loading shop:', error);
    // Show error page
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/40 border border-slate-800/60 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Configuration Error</h2>
          <p className="text-slate-400 mb-6">
            Unable to load Qryx configuration. Please contact support if this persists.
          </p>
          <a
            href="/app"
            className="inline-block px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-all"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!shop) {
    // Shop not installed yet
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/40 border border-slate-800/60 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Qryx Not Installed</h2>
          <p className="text-slate-400 mb-6">
            You haven't installed Qryx on your Shopify store yet.
          </p>
          <a
            href="/api/qryx/auth"
            className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Install Qryx on Shopify
          </a>
        </div>
      </div>
    );
  }

  // Convert Clerk user to plain object for client component
  const plainUser = {
    id: user.id,
    email: user.emailAddresses?.[0]?.emailAddress || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
  };

  // Serialize shop object to ensure all values are JSON-safe
  // Convert any potential Date objects to ISO strings
  const serializeValue = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (val instanceof Date) return val.toISOString();
    if (typeof val.toISOString === 'function') return val.toISOString();
    return String(val);
  };

  const plainShop = {
    id: shop.id,
    org_id: shop.org_id,
    shop_domain: shop.shop_domain,
    shop_name: shop.shop_name,
    shop_email: shop.shop_email,
    shop_owner_name: shop.shop_owner_name,
    access_token: shop.access_token,
    scope: shop.scope,
    installed_at: serializeValue(shop.installed_at) || '',
    uninstalled_at: serializeValue(shop.uninstalled_at),
    plan_tier: shop.plan_tier,
    subscription_status: shop.subscription_status,
    trial_ends_at: serializeValue(shop.trial_ends_at),
    shopify_charge_id: shop.shopify_charge_id,
    billing_period_start: serializeValue(shop.billing_period_start),
    billing_period_end: serializeValue(shop.billing_period_end),
    shopify_plan: shop.shopify_plan,
    country_code: shop.country_code,
    currency: shop.currency,
    timezone: shop.timezone,
    created_at: serializeValue(shop.created_at) || '',
    updated_at: serializeValue(shop.updated_at) || '',
    deleted_at: serializeValue(shop.deleted_at),
  };
  
  return <QryxDashboardClient shop={plainShop} user={plainUser} />;
}
