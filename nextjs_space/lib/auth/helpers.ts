import { createSupabaseServerClient } from '../supabase/server';
import { redirect } from 'next/navigation';
import { getUserBySupabaseId } from '../db/helpers';

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  const jnxUser = await getUserBySupabaseId(user.id);

  if (!jnxUser || jnxUser.role !== 'admin') {
    redirect('/app');
  }

  return { user, jnxUser };
}

export async function getJnxUser(supabaseUserId: string) {
  return await getUserBySupabaseId(supabaseUserId);
}
