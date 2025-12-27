import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/helpers';
import { syncUserFromClerk } from '@/lib/db/helpers';
import DashboardClient from './dashboard-client';
import DashboardSetup from './dashboard-setup';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';

export default async function UserDashboardPage() {
  // Require authentication (redirects to /login if not authenticated)
  const { user, jnxUser: initialJnxUser } = await requireAuth();

  if (!user) {
    redirect('/login');
  }

  let jnxUser = initialJnxUser;

  // ENTERPRISE: Server-Side Fallback
  // If JNX user doesn't exist, try to sync from Clerk immediately
  if (!jnxUser) {
    console.log('[Dashboard] JNX User not found, attempting server-side sync...');
    
    try {
      jnxUser = await syncUserFromClerk(
        user.id,
        user.emailAddresses[0]?.emailAddress || '',
        user.firstName,
        user.lastName
      );

      if (jnxUser) {
        console.log('[Dashboard] Server-side sync successful');
        // User created, render dashboard immediately
        return <DashboardClient user={user} jnxUser={jnxUser} />;
      } else {
        console.warn('[Dashboard] Server-side sync failed, showing setup screen');
      }
    } catch (error) {
      console.error('[Dashboard] Error during server-side sync:', error);
    }

    // Fallback: Show setup screen with auto-refresh
    // This handles cases where DB is temporarily unavailable
    return <DashboardSetup userId={user.id} />;
  }

  // User exists, render dashboard
  return <DashboardClient user={user} jnxUser={jnxUser} />;
}
