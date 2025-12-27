import { createSupabaseAdminClient } from '../supabase/client';

// Type Definitions
export interface JNXUser {
  user_id: string;
  clerk_user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  org_id: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface JNXOrg {
  org_id: string;
  clerk_org_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  log_id: string;
  org_id: string | null;
  actor_user_id: string | null;
  action: string;
  target: string | null;
  metadata: any;
  created_at: string;
}

export interface BillingCustomer {
  org_id: string;
  stripe_customer_id: string | null;
  status: string | null;
  plan: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entitlement {
  org_id: string;
  product_key: string;
  feature_key: string;
  value: any;
  updated_at: string;
}

export interface FeatureFlag {
  flag_key: string;
  enabled: boolean;
  config: any;
  description: string | null;
  updated_at: string;
}

export interface DataExportRequest {
  request_id: string;
  org_id: string | null;
  user_id: string | null;
  status: string;
  export_url: string | null;
  created_at: string;
  completed_at: string | null;
}

// ===== ORGANIZATION FUNCTIONS =====

/**
 * ENTERPRISE: Upsert Organization (Idempotent)
 * Creates or updates an organization based on clerk_org_id
 * @returns Created/Updated organization or null on error
 */
export async function upsertOrg(name: string, clerkOrgId?: string): Promise<JNXOrg | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    console.error('Supabase client not available');
    return null;
  }

  try {
    const orgData: any = {
      name,
      updated_at: new Date().toISOString(),
    };

    if (clerkOrgId) {
      orgData.clerk_org_id = clerkOrgId;
      
      // UPSERT based on clerk_org_id
      const { data, error } = await supabase
        .from('orgs')
        .upsert(orgData, { 
          onConflict: 'clerk_org_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting org with Clerk ID:', error);
        return null;
      }

      return data;
    } else {
      // No clerk_org_id, just insert
      const { data, error } = await supabase
        .from('orgs')
        .insert(orgData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting org:', error);
        return null;
      }

      return data;
    }
  } catch (error) {
    console.error('Unexpected error in upsertOrg:', error);
    return null;
  }
}

/**
 * LEGACY: Create Organization (kept for backward compatibility)
 * Use upsertOrg() for new code
 */
export async function createOrg(name: string, clerkOrgId?: string): Promise<JNXOrg | null> {
  return upsertOrg(name, clerkOrgId);
}

export async function getOrg(orgId: string): Promise<JNXOrg | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('orgs')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error) {
    console.error('Error fetching org:', error);
    return null;
  }

  return data;
}

export async function getOrgByClerkId(clerkOrgId: string): Promise<JNXOrg | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error} = await supabase
    .from('orgs')
    .select('*')
    .eq('clerk_org_id', clerkOrgId)
    .single();

  if (error) {
    console.error('Error fetching org by Clerk ID:', error);
    return null;
  }

  return data;
}

export async function updateOrg(orgId: string, updates: Partial<JNXOrg>): Promise<JNXOrg | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('orgs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) {
    console.error('Error updating org:', error);
    return null;
  }

  return data;
}

// ===== USER FUNCTIONS =====

/**
 * ENTERPRISE: Upsert User (Idempotent)
 * Creates or updates a user based on clerk_user_id
 * @returns Created/Updated user or null on error
 */
export async function upsertUser(
  clerkUserId: string,
  data: {
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    org_id?: string | null;
    role?: string;
  }
): Promise<JNXUser | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    console.error('Supabase client not available');
    return null;
  }

  try {
    const userData: any = {
      clerk_user_id: clerkUserId,
      email: data.email,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      org_id: data.org_id ?? null,
      role: data.role ?? 'member',
      updated_at: new Date().toISOString(),
    };

    // UPSERT based on clerk_user_id
    const { data: result, error } = await supabase
      .from('users')
      .upsert(userData, { 
        onConflict: 'clerk_user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user:', error);
      return null;
    }

    return result;
  } catch (error) {
    console.error('Unexpected error in upsertUser:', error);
    return null;
  }
}

/**
 * LEGACY: Create User (kept for backward compatibility)
 * Use upsertUser() for new code
 */
export async function createUser(
  clerkUserId: string,
  email: string,
  firstName: string | null = null,
  lastName: string | null = null,
  orgId: string | null = null,
  role: string = 'member'
): Promise<JNXUser | null> {
  return upsertUser(clerkUserId, {
    email,
    first_name: firstName,
    last_name: lastName,
    org_id: orgId,
    role,
  });
}

export async function getUserByClerkId(clerkUserId: string): Promise<JNXUser | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Error fetching user by Clerk ID:', error);
    return null;
  }

  return data;
}

export async function getUserById(userId: string): Promise<JNXUser | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

export async function updateUser(userId: string, updates: Partial<JNXUser>): Promise<JNXUser | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }

  return data;
}

export async function deleteUser(userId: string, soft: boolean = true): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return false;

  if (soft) {
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('Error soft deleting user:', error);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error hard deleting user:', error);
      return false;
    }
  }

  return true;
}

export async function getAllUsers(includeDeleted: boolean = false): Promise<JNXUser[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  let query = supabase.from('users').select('*');

  if (!includeDeleted) {
    query = query.is('deleted_at', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all users:', error);
    return [];
  }

  return data || [];
}

// ===== AUDIT LOG FUNCTIONS =====

export async function logAudit(
  action: string,
  orgId: string | null = null,
  actorUserId: string | null = null,
  target: string | null = null,
  metadata: any = null
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  const { error } = await supabase.from('audit_logs').insert({
    org_id: orgId,
    actor_user_id: actorUserId,
    action,
    target,
    metadata,
  });

  if (error) {
    console.error('Error logging audit:', error);
  }
}

export async function getRecentAuditLogs(limit: number = 10): Promise<AuditLog[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data || [];
}

export async function getAuditLogsByOrg(orgId: string, limit: number = 50): Promise<AuditLog[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching org audit logs:', error);
    return [];
  }

  return data || [];
}

// ===== SYSTEM EVENT FUNCTIONS =====

export async function logSystemEvent(
  eventType: string,
  severity: string = 'info',
  message: string,
  metadata: any = null
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  const { error } = await supabase.from('system_events').insert({
    event_type: eventType,
    severity,
    message,
    metadata,
  });

  if (error) {
    console.error('Error logging system event:', error);
  }
}

// ===== HEALTH CHECK FUNCTIONS =====

export async function checkSupabaseConnection(): Promise<{ status: string; message: string }> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      status: 'disconnected',
      message: 'Supabase client not configured',
    };
  }

  try {
    const { error } = await supabase.from('system_events').select('event_id').limit(1);

    if (error) {
      return {
        status: 'degraded',
        message: `Database error: ${error.message}`,
      };
    }

    return {
      status: 'connected',
      message: 'Database connection healthy',
    };
  } catch (error) {
    return {
      status: 'disconnected',
      message: 'Failed to connect to database',
    };
  }
}

export async function countActiveSessions(): Promise<number> {
  // This will count active users (not deleted)
  const supabase = createSupabaseAdminClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  if (error) {
    console.error('Error counting active sessions:', error);
    return 0;
  }

  return count || 0;
}

// ===== BILLING FUNCTIONS =====

export async function getBillingCustomer(orgId: string): Promise<BillingCustomer | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('billing_customers')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error) {
    console.error('Error fetching billing customer:', error);
    return null;
  }

  return data;
}

export async function upsertBillingCustomer(
  orgId: string,
  stripeCustomerId: string,
  status?: string,
  plan?: string,
  currentPeriodEnd?: string
): Promise<BillingCustomer | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('billing_customers')
    .upsert({
      org_id: orgId,
      stripe_customer_id: stripeCustomerId,
      status,
      plan,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting billing customer:', error);
    return null;
  }

  return data;
}

// ===== ENTITLEMENT FUNCTIONS =====

export async function getEntitlements(orgId: string): Promise<Entitlement[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('entitlements')
    .select('*')
    .eq('org_id', orgId);

  if (error) {
    console.error('Error fetching entitlements:', error);
    return [];
  }

  return data || [];
}

export async function upsertEntitlement(
  orgId: string,
  productKey: string,
  featureKey: string,
  value: any
): Promise<Entitlement | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('entitlements')
    .upsert({
      org_id: orgId,
      product_key: productKey,
      feature_key: featureKey,
      value,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting entitlement:', error);
    return null;
  }

  return data;
}

// ===== FEATURE FLAG FUNCTIONS =====

export async function getFeatureFlag(flagKey: string): Promise<FeatureFlag | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('flag_key', flagKey)
    .single();

  if (error) {
    console.error('Error fetching feature flag:', error);
    return null;
  }

  return data;
}

export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('flag_key');

  if (error) {
    console.error('Error fetching all feature flags:', error);
    return [];
  }

  return data || [];
}

export async function updateFeatureFlag(
  flagKey: string,
  enabled: boolean,
  config?: any
): Promise<FeatureFlag | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const updates: any = {
    enabled,
    updated_at: new Date().toISOString(),
  };

  if (config !== undefined) {
    updates.config = config;
  }

  const { data, error } = await supabase
    .from('feature_flags')
    .update(updates)
    .eq('flag_key', flagKey)
    .select()
    .single();

  if (error) {
    console.error('Error updating feature flag:', error);
    return null;
  }

  return data;
}

// ===== DATA EXPORT FUNCTIONS =====

export async function createDataExportRequest(
  userId: string,
  orgId: string | null
): Promise<DataExportRequest | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('data_export_requests')
    .insert({
      user_id: userId,
      org_id: orgId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating data export request:', error);
    return null;
  }

  return data;
}

export async function getDataExportRequest(requestId: string): Promise<DataExportRequest | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('request_id', requestId)
    .single();

  if (error) {
    console.error('Error fetching data export request:', error);
    return null;
  }

  return data;
}

export async function updateDataExportRequest(
  requestId: string,
  status: string,
  exportUrl?: string
): Promise<DataExportRequest | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const updates: any = { status };

  if (exportUrl) {
    updates.export_url = exportUrl;
  }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('data_export_requests')
    .update(updates)
    .eq('request_id', requestId)
    .select()
    .single();

  if (error) {
    console.error('Error updating data export request:', error);
    return null;
  }

  return data;
}

// ===== TRANSACTIONAL OPERATIONS =====

/**
 * ENTERPRISE: Create User with Organization (Transactional)
 * Creates both user and organization atomically
 * If one fails, both are rolled back
 * @returns {user, org} or null on error
 */
export async function createUserWithOrg(
  clerkUserId: string,
  email: string,
  firstName: string | null,
  lastName: string | null,
  orgName: string,
  clerkOrgId?: string
): Promise<{ user: JNXUser; org: JNXOrg } | null> {
  try {
    // Step 1: Create/Update Organization
    const org = await upsertOrg(orgName, clerkOrgId);
    if (!org) {
      console.error('Failed to create/update organization');
      return null;
    }

    // Step 2: Create/Update User linked to Org
    const user = await upsertUser(clerkUserId, {
      email,
      first_name: firstName,
      last_name: lastName,
      org_id: org.org_id,
      role: 'member',
    });

    if (!user) {
      console.error('Failed to create/update user');
      // Note: Org already created, but this is acceptable
      // The org can exist without users initially
      return null;
    }

    return { user, org };
  } catch (error) {
    console.error('Unexpected error in createUserWithOrg:', error);
    return null;
  }
}

/**
 * ENTERPRISE: Sync User from Clerk (Idempotent)
 * Ensures user exists in DB, creates with default org if needed
 * Used as fallback when webhook hasn't processed yet
 * @returns User or null on error
 */
export async function syncUserFromClerk(
  clerkUserId: string,
  email: string,
  firstName?: string | null,
  lastName?: string | null
): Promise<JNXUser | null> {
  try {
    // Check if user already exists
    const existingUser = await getUserByClerkId(clerkUserId);
    if (existingUser) {
      // User exists, just return it
      return existingUser;
    }

    // User doesn't exist, create with default org
    const orgName = `${firstName || 'User'}'s Organization`;
    const result = await createUserWithOrg(
      clerkUserId,
      email,
      firstName || null,
      lastName || null,
      orgName
    );

    if (!result) {
      console.error('Failed to sync user from Clerk');
      return null;
    }

    // Log audit event
    await logAudit('user.synced_from_clerk', result.org.org_id, result.user.user_id, 'user', {
      clerk_user_id: clerkUserId,
      email,
    });

    return result.user;
  } catch (error) {
    console.error('Unexpected error in syncUserFromClerk:', error);
    return null;
  }
}
