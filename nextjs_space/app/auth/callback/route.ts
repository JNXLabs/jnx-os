/**
 * DEPRECATED: This route has been replaced by Clerk authentication.
 * Clerk handles OAuth callbacks automatically.
 */

import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  // Redirect to app dashboard
  const url = new URL('/app', request.url);
  return NextResponse.redirect(url);
}

// Mark as dynamic to prevent static generation issues
export const dynamic = 'force-dynamic';
