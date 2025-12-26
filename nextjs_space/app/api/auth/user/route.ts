import { NextRequest, NextResponse } from 'next/server';
import { getUserBySupabaseId, getOrg } from '@/lib/db/helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabaseUserId = searchParams.get('supabaseUserId');

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: 'Supabase user ID required' },
        { status: 400 }
      );
    }

    const user = await getUserBySupabaseId(supabaseUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get org info if user has an org
    let org = null;
    if (user.org_id) {
      org = await getOrg(user.org_id);
    }

    return NextResponse.json({ user, org }, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
