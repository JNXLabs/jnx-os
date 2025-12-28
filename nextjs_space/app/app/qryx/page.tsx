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

  // Get Shopify shop for this organization
  const shop = await getShopifyShopByOrg(jnxUser.org_id);

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

  // Render dashboard with shop data
  if (!user) {
    redirect('/login');
  }
  
  const plainUser = {
    id: user.id,
    email: user.emailAddresses?.[0]?.emailAddress || null,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
  };
  
  return <QryxDashboardClient shop={shop} user={plainUser} />;
}
