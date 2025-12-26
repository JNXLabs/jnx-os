import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { createUser, createOrg, logAudit } from '@/lib/db/helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

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

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create organization for the user
    const orgName = name ? `${name}'s Organization` : `${email}'s Organization`;
    const org = await createOrg(orgName);

    // Create JNX user record
    const jnxUser = await createUser(
      authData.user.id,
      email,
      org?.org_id ?? null,
      'member'
    );

    // Log the signup event
    await logAudit(
      'user_signup',
      org?.org_id ?? null,
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
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
