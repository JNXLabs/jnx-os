import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/helpers';
import DashboardClient from './dashboard-client';
import DashboardSetup from './dashboard-setup';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';

export default async function UserDashboardPage() {
  // Require authentication (redirects to /login if not authenticated)
  const { user, jnxUser } = await requireAuth();

  if (!user || !jnxUser) {
    // If JNX user doesn't exist yet (webhook hasn't processed), show setup screen with auto-refresh
    return <DashboardSetup />;
  }

  // Pass user data to client component
  return <DashboardClient user={user} jnxUser={jnxUser} />;
}
