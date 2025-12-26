import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: ['/', '/login', '/signup', '/privacy', '/terms', '/products'],
  
  // Routes that are ignored by the middleware
  ignoredRoutes: ['/api/webhooks/clerk'],

  // After authentication, check for admin role on admin routes
  afterAuth(auth, req) {
    // If accessing admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      // Must be signed in
      if (!auth.userId) {
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
      }

      // Check for admin role in public metadata
      const role = auth.sessionClaims?.metadata?.role as string | undefined;
      
      // If not admin, redirect to /app
      if (role !== 'admin') {
        const appUrl = new URL('/app', req.url);
        return NextResponse.redirect(appUrl);
      }
    }

    // If accessing /app routes, must be signed in
    if (req.nextUrl.pathname.startsWith('/app')) {
      if (!auth.userId) {
        const loginUrl = new URL('/login', req.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    // If signed in and accessing login/signup, redirect to /app
    if (auth.userId && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
      const appUrl = new URL('/app', req.url);
      return NextResponse.redirect(appUrl);
    }

    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
