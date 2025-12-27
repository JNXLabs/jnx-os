import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Check if Clerk is configured
const isClerkConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
};

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/privacy',
  '/terms',
  '/products',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isAppRoute = createRouteMatcher(['/app(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // If Clerk is not configured, allow all public routes and block protected routes
  if (!isClerkConfigured()) {
    if (isAppRoute(req) || isAdminRoute(req)) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Get user session
  const authResult = await auth();
  const { userId, sessionClaims } = authResult;

  // Protect app routes
  if (isAppRoute(req) && !userId) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin routes
  if (isAdminRoute(req)) {
    if (!userId) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // FIXED: Check for admin role in publicMetadata (not metadata)
    const publicMetadata = sessionClaims?.publicMetadata as { role?: string } | undefined;
    const role = publicMetadata?.role;
    
    if (role !== 'admin') {
      console.log('[Middleware] Access denied to admin route - role:', role);
      const appUrl = new URL('/app', req.url);
      return NextResponse.redirect(appUrl);
    }
    
    console.log('[Middleware] Admin access granted');
  }

  // Redirect authenticated users away from login/signup
  if (userId && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
    const appUrl = new URL('/app', req.url);
    return NextResponse.redirect(appUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
