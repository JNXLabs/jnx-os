import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createUser, createOrg, logAudit, getUserBySupabaseId } from '@/lib/db/helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.user) {
        // Check if user exists in our database
        let jnxUser = await getUserBySupabaseId(data.user.id);
        
        // If not, create user and org
        if (!jnxUser) {
          const email = data.user.email ?? 'unknown@email.com';
          const name = data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? email;
          
          // Create organization
          const org = await createOrg(`${name}'s Organization`);
          
          // Create user
          jnxUser = await createUser(
            data.user.id,
            email,
            org?.org_id ?? null,
            'member'
          );
          
          // Log signup
          await logAudit(
            'user_signup',
            org?.org_id ?? null,
            jnxUser?.user_id ?? null,
            email,
            { method: 'google_oauth' }
          );
        } else {
          // Log login
          await logAudit(
            'user_login',
            jnxUser.org_id,
            jnxUser.user_id,
            jnxUser.email,
            { method: 'google_oauth' }
          );
        }
      }
    }
  }

  // Redirect to app dashboard
  return NextResponse.redirect(new URL('/app', request.url));
}
