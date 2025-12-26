/**
 * Clerk Client-Side Utilities
 * For use in React components (client-side)
 */

import { useUser, useOrganization, useAuth, useClerk } from '@clerk/nextjs';

// Re-export Clerk hooks for convenience
export {
  useUser,
  useOrganization,
  useAuth,
  useClerk,
};

/**
 * Check if user is authenticated (client-side)
 */
export function useIsAuthenticated() {
  const { isSignedIn, isLoaded } = useAuth();
  return { isAuthenticated: isSignedIn, isLoading: !isLoaded };
}

/**
 * Check if user has admin role (client-side)
 */
export function useIsAdmin() {
  const { user, isLoaded } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;
  return { isAdmin: role === 'admin', isLoading: !isLoaded };
}

/**
 * Get current organization (client-side)
 */
export function useCurrentOrganization() {
  const { organization, isLoaded } = useOrganization();
  return { organization, isLoading: !isLoaded };
}
