/**
 * DEPRECATED: This route has been replaced by Clerk authentication.
 * Please use /login page with Clerk SignIn component.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Please use Clerk authentication at /login' },
    { status: 410 }
  );
}
