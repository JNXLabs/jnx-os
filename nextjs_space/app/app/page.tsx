import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/helpers';
import DashboardClient from './dashboard-client';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';

export default async function UserDashboardPage() {
  // Require authentication (redirects to /login if not authenticated)
  const { user, jnxUser } = await requireAuth();

  if (!user || !jnxUser) {
    // If JNX user doesn't exist yet (webhook hasn't processed), show a message
    return (
      <div className="min-h-screen bg-jnx-dark flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Setting up your account...</h1>
          <p className="text-slate-400">Please wait while we prepare your dashboard.</p>
          <p className="text-sm text-slate-500 mt-2">This usually takes just a few seconds.</p>
        </div>
      </div>
    );
  }

  // Pass user data to client component
  return <DashboardClient user={user} jnxUser={jnxUser} />;
}
