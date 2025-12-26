import { requireAdmin } from '@/lib/auth/helpers';
import AdminDashboardClient from './admin-client';

// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Require admin role (redirects to /app if not admin)
  const { user, jnxUser } = await requireAdmin();

  if (!user || !jnxUser) {
    return (
      <div className="min-h-screen bg-jnx-dark flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Setting up admin access...</h1>
          <p className="text-slate-400">Please wait while we verify your permissions.</p>
        </div>
      </div>
    );
  }

  // Pass user data to client component
  return <AdminDashboardClient user={user} jnxUser={jnxUser} />;
}
