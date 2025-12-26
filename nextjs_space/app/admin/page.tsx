import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/helpers';
import { AdminDashboardClient } from './admin-client';

export default async function AdminDashboard() {
  const { user, jnxUser } = await requireAdmin();

  return <AdminDashboardClient user={user} jnxUser={jnxUser} />;
}
