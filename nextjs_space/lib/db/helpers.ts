import { createSupabaseAdminClient } from '../supabase/client';
import type { User } from '@supabase/supabase-js';

export interface JNXUser {
  user_id: string;
  supabase_user_id: string;
  email: string;
  org_id: string | null;
  role: string;
  created_at: string;
}

export interface JNXOrg {
  org_id: string;
  name: string;
  created_at: string;
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

// Create a new organization
export async function createOrg(name: string): Promise<JNXOrg | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('orgs')
    .insert({ name })
    .select()
    .single();

  if (error) {
    console.error('Error creating org:', error);
    return null;
  }

  return data;
}

// Create a new user
export async function createUser(
  supabaseUserId: string,
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
