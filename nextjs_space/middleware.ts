import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase is not configured, allow access to all routes except protected ones
    if (
      request.nextUrl.pathname.startsWith('/app') ||
      request.nextUrl.pathname.startsWith('/admin')
    ) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - require authentication
  if (
    request.nextUrl.pathname.startsWith('/app') ||
    request.nextUrl.pathname.startsWith('/admin')
  ) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Admin routes - require admin role
    if (request.nextUrl.pathname.startsWith('/admin')) {
      // Fetch user role from database
      try {
        const { data: jnxUser } = await supabase
          .from('users')
          .select('role')
          .eq('supabase_user_id', user.id)
          .single();

        if (!jnxUser || jnxUser.role !== 'admin') {
          return NextResponse.redirect(new URL('/app', request.url));
        }
      } catch (error) {
        return NextResponse.redirect(new URL('/app', request.url));
      }
    }
  }

  // If user is logged in and tries to access login/signup, redirect to /app
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.svg|og-image.png|robots.txt|api).*)',
  ],
};
