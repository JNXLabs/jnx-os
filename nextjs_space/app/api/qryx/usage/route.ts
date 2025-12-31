/**
 * Qryx Usage API
 * 
 * GET: Fetch current user's usage statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserUsageStats } from '@/lib/db/billing-helpers';
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('api/qryx/usage');

export const dynamic = 'force-dynamic';

/**
 * GET /api/qryx/usage
 * 
 * Returns the current user's conversation usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Fetch usage stats
    const stats = await getUserUsageStats(user.id);

    if (!stats) {
      return NextResponse.json(
        {
          conversationsUsed: 0,
          conversationsLimit: 500, // Default starter limit
          percentage: 0,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
          warningLevel: 0,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Get usage error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch usage',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
