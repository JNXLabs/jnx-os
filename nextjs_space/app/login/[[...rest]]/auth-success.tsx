/**
 * Auth Success Handler for Embedded Context
 * 
 * Detects if login happened in a popup and notifies parent window
 */

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function AuthSuccessHandler() {
  const searchParams = useSearchParams();
  const embedded = searchParams?.get('embedded');

  useEffect(() => {
    // If this is an embedded auth flow (opened from popup)
    if (embedded === 'true' && window.opener) {
      // Notify the parent window that auth is complete
      window.opener.postMessage(
        { type: 'qryx-auth-complete' },
        window.location.origin
      );
      
      // Close this popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  }, [embedded]);

  return null;
}
