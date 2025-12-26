import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import {
  checkSupabaseConnection,
  countActiveSessions,
  getRecentAuditLogs,
  getUserByClerkId,
} from '@/lib/db/helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check Supabase connection
    const supabaseStatus = await checkSupabaseConnection();

    // Check Clerk connection (if user is authenticated, Clerk is working)
    const clerkUser = await currentUser();
    const clerkStatus = clerkUser
      ? { status: 'connected', message: 'Clerk authentication operational' }
      : { status: 'disconnected', message: 'No authenticated user' };

    // Get current user details
    let currentUserInfo = null;
    if (clerkUser) {
      const jnxUser = await getUserByClerkId(clerkUser.id);
      if (jnxUser) {
        currentUserInfo = {
          email: jnxUser.email,
          role: jnxUser.role,
          org_id: jnxUser.org_id,
        };
      }
    }

    // Get active sessions count
    const activeSessions = await countActiveSessions();

    // Get recent audit logs
    const recentAuditLogs = await getRecentAuditLogs(10);

    return NextResponse.json({
      supabase: supabaseStatus,
      clerk: clerkStatus,
      currentUser: currentUserInfo,
      activeSessions,
      recentAuditLogs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch system health',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
