/**
 * Data Export Service
 * For GDPR compliance - Right to Data Portability
 */

import { getUserById, getAuditLogsByOrg, getBillingCustomer, getEntitlements } from '../db/helpers';

export interface UserDataExport {
  user: {
    user_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    created_at: string;
  };
  organization: {
    org_id: string | null;
    name: string | null;
  } | null;
  audit_logs: Array<{
    action: string;
    target: string | null;
    created_at: string;
  }>;
  billing: {
    stripe_customer_id: string | null;
    status: string | null;
    plan: string | null;
  } | null;
  entitlements: Array<{
    product_key: string;
    feature_key: string;
    value: any;
  }>;
}

/**
 * Export all user data in a structured format
 */
export async function exportUserData(userId: string): Promise<UserDataExport | null> {
  try {
    // Get user details
    const user = await getUserById(userId);
    if (!user) {
      return null;
    }

    // Get organization details
    let organization = null;
    if (user.org_id) {
      const { getOrg } = await import('../db/helpers');
      const org = await getOrg(user.org_id);
      if (org) {
        organization = {
          org_id: org.org_id,
          name: org.name,
        };
      }
    }

    // Get audit logs
    const auditLogs = user.org_id
      ? await getAuditLogsByOrg(user.org_id, 100)
      : [];

    const filteredAuditLogs = auditLogs
      .filter((log) => log.actor_user_id === userId)
      .map((log) => ({
        action: log.action,
        target: log.target,
        created_at: log.created_at,
      }));

    // Get billing information
    let billing = null;
    if (user.org_id) {
      const billingCustomer = await getBillingCustomer(user.org_id);
      if (billingCustomer) {
        billing = {
          stripe_customer_id: billingCustomer.stripe_customer_id,
          status: billingCustomer.status,
          plan: billingCustomer.plan,
        };
      }
    }

    // Get entitlements
    let entitlements: Array<{ product_key: string; feature_key: string; value: any }> = [];
    if (user.org_id) {
      const ents = await getEntitlements(user.org_id);
      entitlements = ents.map((e) => ({
        product_key: e.product_key,
        feature_key: e.feature_key,
        value: e.value,
      }));
    }

    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        created_at: user.created_at,
      },
      organization,
      audit_logs: filteredAuditLogs,
      billing,
      entitlements,
    };
  } catch (error) {
    console.error('Error exporting user data:', error);
    return null;
  }
}

/**
 * Generate a downloadable JSON file of user data
 */
export function generateExportFile(data: UserDataExport): string {
  return JSON.stringify(data, null, 2);
}
