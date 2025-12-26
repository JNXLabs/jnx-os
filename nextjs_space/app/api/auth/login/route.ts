import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { logAudit, getUserBySupabaseId } from '@/lib/db/helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service not configured' },
        { status: 503 }
      );
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to authenticate' },
        { status: 401 }
      );
    }

    // Get JNX user record
    const jnxUser = await getUserBySupabaseId(authData.user.id);

    // Log the login event
    await logAudit(
      'user_login',
      jnxUser?.org_id ?? null,
      jnxUser?.user_id ?? null,
      email,
      { method: 'email' }
    );

    return NextResponse.json(
      {
        success: true,
        user: authData.user,
        session: authData.session,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
