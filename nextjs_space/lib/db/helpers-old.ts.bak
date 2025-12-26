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
 * Create a new organization
 */
export async function createOrg(
  name: string,
  clerkOrgId?: string
): Promise<JNXOrg | null> {
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

/**
 * Get organization by ID
 */
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

/**
 * Get organization by Clerk org ID
 */
export async function getOrgByClerkId(clerkOrgId: string): Promise<JNXOrg | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
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

/**
 * Update organization
 */
export async function updateOrg(
  orgId: string,
  updates: Partial<JNXOrg>
): Promise<JNXOrg | null> {
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
 * Create a new user
 */
export async function createUser(
  clerkUserId: string,
  email: string,
  orgId: string | null = null,
  role: string = 'member'
): Promise<JNXUser | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .insert({
      supabase_user_id: supabaseUserId,
      email,
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

// Get user by Supabase user ID
export async function getUserBySupabaseId(
  supabaseUserId: string
): Promise<JNXUser | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('supabase_user_id', supabaseUserId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// Get organization by ID
export async function getOrg(orgId: string): Promise<JNXOrg | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('orgs')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// Log audit event
export async function logAudit(
  action: string,
  orgId: string | null = null,
  actorUserId: string | null = null,
  target: string | null = null,
  metadata: any = null
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from('audit_logs').insert({
    org_id: orgId,
    actor_user_id: actorUserId,
    action,
    target,
    metadata,
  });
}

// Log system event
export async function logSystemEvent(
  eventType: string,
  severity: string,
  message: string,
  metadata: any = null
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from('system_events').insert({
    event_type: eventType,
    severity,
    message,
    metadata,
  });
}

// Get recent audit logs
export async function getRecentAuditLogs(
  limit: number = 10
): Promise<AuditLog[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return data ?? [];
}

// Check Supabase connection status
export async function checkSupabaseConnection(): Promise<{
  status: 'connected' | 'disconnected' | 'degraded';
  message: string;
}> {
  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      return {
        status: 'disconnected',
        message: 'Supabase not configured',
      };
    }

    // Try a simple query
    const { error } = await supabase.from('orgs').select('org_id').limit(1);

    if (error) {
      return {
        status: 'degraded',
        message: `Database error: ${error.message}`,
      };
    }

    return {
      status: 'connected',
      message: 'All systems operational',
    };
  } catch (error) {
    return {
      status: 'disconnected',
      message: 'Connection failed',
    };
  }
}

// Count active sessions
export async function countActiveSessions(): Promise<number> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return 0;

  try {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    return count ?? 0;
  } catch {
    return 0;
  }
}
