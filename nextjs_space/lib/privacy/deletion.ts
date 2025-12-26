/**
 * Data Deletion Service
 * For GDPR compliance - Right to Erasure
 */

import { deleteUser, logAudit } from '../db/helpers';

/**
 * Soft delete user (marks as deleted but keeps data)
 * Use this when retention is required (e.g., audit logs, legal)
 */
export async function softDeleteUser(userId: string, actorUserId: string | null = null): Promise<boolean> {
  try {
    const success = await deleteUser(userId, true);

    if (success) {
      await logAudit('user.soft_deleted', null, actorUserId, 'user', {
        deleted_user_id: userId,
      });
    }

    return success;
  } catch (error) {
    console.error('Error soft deleting user:', error);
    return false;
  }
}

/**
 * Hard delete user (permanently removes data)
 * DANGEROUS: This is irreversible. Use only when GDPR requires complete erasure.
 */
export async function hardDeleteUser(userId: string, actorUserId: string | null = null): Promise<boolean> {
  try {
    // Log the deletion before it happens (audit trail)
    await logAudit('user.hard_deleted', null, actorUserId, 'user', {
      deleted_user_id: userId,
      warning: 'User data permanently deleted',
    });

    // Perform hard delete
    const success = await deleteUser(userId, false);

    return success;
  } catch (error) {
    console.error('Error hard deleting user:', error);
    return false;
  }
}

/**
 * Anonymize user data (replaces PII with anonymized values)
 * Use this for retention requirements where PII must be removed but records kept
 */
export async function anonymizeUser(userId: string): Promise<boolean> {
  try {
    const { updateUser } = await import('../db/helpers');

    const success = await updateUser(userId, {
      email: `anonymized_${userId.substring(0, 8)}@deleted.local`,
      first_name: 'Deleted',
      last_name: 'User',
      deleted_at: new Date().toISOString(),
    });

    if (success) {
      await logAudit('user.anonymized', null, null, 'user', {
        anonymized_user_id: userId,
      });
    }

    return !!success;
  } catch (error) {
    console.error('Error anonymizing user:', error);
    return false;
  }
}

/**
 * Check if user can be safely deleted
 * Returns array of warnings/blockers
 */
export async function checkDeletionSafety(userId: string): Promise<{
  canDelete: boolean;
  warnings: string[];
}> {
  const warnings: string[] = [];

  try {
    const { getUserById, getAuditLogsByOrg } = await import('../db/helpers');
    const user = await getUserById(userId);

    if (!user) {
      return { canDelete: false, warnings: ['User not found'] };
    }

    // Check if user has organization
    if (user.org_id) {
      warnings.push('User is part of an organization. Consider removing from org first.');
    }

    // Check if user is admin
    if (user.role === 'admin') {
      warnings.push('User has admin role. Ensure another admin exists before deletion.');
    }

    // Check audit logs
    if (user.org_id) {
      const auditLogs = await getAuditLogsByOrg(user.org_id, 10);
      const userLogs = auditLogs.filter((log) => log.actor_user_id === userId);
      if (userLogs.length > 0) {
        warnings.push(
          `User has ${userLogs.length} audit log entries. Consider retention policy.`
        );
      }
    }

    return {
      canDelete: true,
      warnings,
    };
  } catch (error) {
    console.error('Error checking deletion safety:', error);
    return {
      canDelete: false,
      warnings: ['Error checking deletion safety'],
    };
  }
}
