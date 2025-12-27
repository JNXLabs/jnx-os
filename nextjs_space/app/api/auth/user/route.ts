/**
 * DEPRECATED - This route has been removed
 * Use Clerk's currentUser() or auth() functions instead
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint has been deprecated. Please use Clerk authentication.' },
    { status: 410 }
  );
}
