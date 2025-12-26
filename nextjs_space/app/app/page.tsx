import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/helpers';
import { getUserBySupabaseId, getOrg } from '@/lib/db/helpers';
import { DashboardClient } from './dashboard-client';

export default async function AppDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const jnxUser = await getUserBySupabaseId(user.id);
  const org = jnxUser?.org_id ? await getOrg(jnxUser.org_id) : null;

  return (
    <DashboardClient
      user={user}
      jnxUser={jnxUser}
      org={org}
    />
  );
}
