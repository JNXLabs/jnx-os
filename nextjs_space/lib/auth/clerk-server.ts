/**
 * Clerk Server-Side Utilities
 * For use in Server Components and API routes
 */

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import type { User } from '@clerk/nextjs/server';

/**
 * Get current authenticated user (server-side)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const user = await currentUser();
    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * Get current user's role from public metadata
 */
export async function getCurrentUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return (user.publicMetadata?.role as string) || 'member';
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'admin';
}

/**
 * Get user's organization ID
 */
export async function getCurrentUserOrgId(): Promise<string | null> {
  const authResult = await auth();
  const { orgId } = authResult;
  return orgId || null;
}

/**
 * Get organization details
 */
export async function getOrganization(orgId: string) {
  try {
    const client = await clerkClient();
    const organization = await client.organizations.getOrganization({ organizationId: orgId });
    return organization;
  } catch (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
}

/**
 * Update user metadata (e.g., set role)
 */
export async function updateUserMetadata(
  userId: string,
  metadata: { role?: string; [key: string]: any }
) {
  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: metadata,
    });
    return true;
  } catch (error) {
    console.error('Error updating user metadata:', error);
    return false;
  }
}

/**
 * Get all users in an organization
 */
export async function getOrganizationUsers(orgId: string) {
  try {
    const client = await clerkClient();
    const { data } = await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });
    return data;
  } catch (error) {
    console.error('Error fetching organization users:', error);
    return [];
  }
}
