/**
 * DEPRECATED: This route has been replaced by Clerk authentication.
 * Use Clerk's currentUser() or auth() functions instead.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Please use Clerk API' },
    { status: 410 }
  );
}
