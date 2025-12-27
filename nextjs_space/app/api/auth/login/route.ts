/**
 * DEPRECATED - This route has been removed
 * Use Clerk authentication instead via /login page
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint has been deprecated. Please use Clerk authentication.' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint has been deprecated. Please use Clerk authentication.' },
    { status: 410 }
  );
}
