import { NextResponse } from 'next/server';
import {
  checkSupabaseConnection,
  countActiveSessions,
  getRecentAuditLogs,
  getUserBySupabaseId,
  getOrg,
} from '@/lib/db/helpers';
import { getCurrentUser } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check Supabase connection
    const connectionStatus = await checkSupabaseConnection();

    // Get current user info
    const currentUser = await getCurrentUser();
    let jnxUser = null;
    let org = null;

    if (currentUser) {
      jnxUser = await getUserBySupabaseId(currentUser.id);
      if (jnxUser?.org_id) {
        org = await getOrg(jnxUser.org_id);
      }
    }

    // Get active sessions count
    const activeSessions = await countActiveSessions();

    // Get recent audit logs
    const recentLogs = await getRecentAuditLogs(10);

    return NextResponse.json(
      {
        connection: connectionStatus,
        currentUser: jnxUser
          ? {
              email: jnxUser.email,
              role: jnxUser.role,
              user_id: jnxUser.user_id,
            }
          : null,
        currentOrg: org
          ? {
              org_id: org.org_id,
              name: org.name,
            }
          : null,
        activeSessions,
        recentAuditLogs: recentLogs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        connection: { status: 'disconnected', message: 'Health check failed' },
        currentUser: null,
        currentOrg: null,
        activeSessions: 0,
        recentAuditLogs: [],
      },
      { status: 500 }
    );
  }
}
