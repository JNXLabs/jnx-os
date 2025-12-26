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

export async function createOrg(name: string, clerkOrgId?: string): Promise<JNXOrg | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('orgs')
    .insert({ name, clerk_org_id: clerkOrgId })
    .select()
    .single();

  if (error) {
    console.error('Error creating org:', error);
    return null;
  }

  return data;
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

export async function createUser(
  clerkUserId: string,
  email: string,
  firstName: string | null = null,
  lastName: string | null = null,
  orgId: string | null = null,
  role: string = 'member'
): Promise<JNXUser | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .insert({
      clerk_user_id: clerkUserId,
      email,
      first_name: firstName,
      last_name: lastName,
      org_id: orgId,
      role,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    return null;
  }

  return data;
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
