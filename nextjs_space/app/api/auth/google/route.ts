/**
 * DEPRECATED - This route has been removed
 * Google OAuth is now handled by Clerk
 */
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint has been deprecated. Google OAuth is handled by Clerk.' },
    { status: 410 }
  );
}
