/**
 * Role-Based Access Control (RBAC) Utilities
 */

export type UserRole = 'admin' | 'member';

export const ROLES: Record<UserRole, { name: string; permissions: string[] }> = {
  admin: {
    name: 'Administrator',
    permissions: [
      'manage:users',
      'manage:organizations',
      'manage:billing',
      'view:analytics',
      'manage:settings',
      'view:audit_logs',
      'manage:feature_flags',
      'export:data',
    ],
  },
  member: {
    name: 'Member',
    permissions: [
      'view:own_data',
      'edit:own_profile',
      'export:own_data',
    ],
  },
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const roleData = ROLES[role];
  if (!roleData) return false;
  return roleData.permissions.includes(permission);
}

/**
 * Check if a role can perform an action
 */
export function canPerform(role: UserRole, action: string): boolean {
  // Map actions to permissions
  const actionPermissionMap: Record<string, string> = {
    'view_users': 'manage:users',
    'edit_user': 'manage:users',
    'delete_user': 'manage:users',
    'view_organizations': 'manage:organizations',
    'edit_organization': 'manage:organizations',
    'view_billing': 'manage:billing',
    'edit_billing': 'manage:billing',
    'view_analytics': 'view:analytics',
    'manage_settings': 'manage:settings',
    'view_audit_logs': 'view:audit_logs',
    'manage_feature_flags': 'manage:feature_flags',
    'export_all_data': 'export:data',
  };

  const permission = actionPermissionMap[action];
  if (!permission) return false;

  return hasPermission(role, permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): string[] {
  return ROLES[role]?.permissions || [];
}

/**
 * Check if role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return role === 'admin' || role === 'member';
}
