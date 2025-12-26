/**
 * Auth Helper Functions
 * Server-side helpers for authentication and authorization
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentUserRole } from './clerk-server';
import { getUserByClerkId } from '../db/helpers';

/**
 * Require authentication
 * Redirects to /login if not authenticated
 */
export async function requireAuth() {
  const authResult = await auth();
  const { userId } = authResult;
  
  if (!userId) {
    redirect('/login');
  }

  const user = await getCurrentUser();
  const jnxUser = user ? await getUserByClerkId(user.id) : null;

  return { user, jnxUser };
}

/**
 * Require admin role
 * Redirects to /app if not admin
 */
export async function requireAdmin() {
  const { user, jnxUser } = await requireAuth();
  
  const role = await getCurrentUserRole();
  
  if (role !== 'admin' && jnxUser?.role !== 'admin') {
    redirect('/app');
  }

  return { user, jnxUser };
}

/**
 * Check if user is authenticated (returns boolean)
 */
export async function isAuthenticated(): Promise<boolean> {
  const authResult = await auth();
  const { userId } = authResult;
  return !!userId;
}

/**
 * Get current user or null (no redirect)
 */
export async function getAuthUser() {
  const authResult = await auth();
  const { userId } = authResult;
  
  if (!userId) {
    return null;
  }

  const user = await getCurrentUser();
  const jnxUser = user ? await getUserByClerkId(user.id) : null;

  return { user, jnxUser };
}
