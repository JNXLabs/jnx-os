/**
 * Auth Check Endpoint
 * 
 * Simple endpoint to check if user is authenticated
 * Used by embedded auth flow to verify session after popup login
 */

import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await currentUser();
    
    if (user) {
      return NextResponse.json({
        authenticated: true,
        userId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
      });
    }
    
    return NextResponse.json({
      authenticated: false,
    });
  } catch (error) {
    console.error('[Auth Check] Error:', error);
    return NextResponse.json(
      {
        authenticated: false,
        error: 'Failed to check authentication',
      },
      { status: 500 }
    );
  }
}
