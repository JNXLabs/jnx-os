/**
 * Embedded Auth Handler for Shopify Admin
 * 
 * Handles authentication in Shopify's embedded app iframe context
 * Opens auth in a new window to bypass third-party cookie restrictions
 */

'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Sparkles, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmbeddedAuthProps {
  shop: string;
  returnUrl?: string;
}

export function EmbeddedAuth({ shop, returnUrl }: EmbeddedAuthProps) {
  const router = useRouter();
  const [authWindow, setAuthWindow] = useState<Window | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);

  useEffect(() => {
    // Listen for auth completion message from popup
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'qryx-auth-complete') {
        console.log('[Embedded Auth] Auth complete message received');
        setIsChecking(true);
        setCheckAttempts(0);
        
        // Close the popup if still open
        if (authWindow && !authWindow.closed) {
          authWindow.close();
        }
        
        // Start checking for auth with retries
        checkAuthStatus();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authWindow]);

  const checkAuthStatus = async () => {
    const maxAttempts = 5;
    
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`[Embedded Auth] Checking auth status, attempt ${i + 1}/${maxAttempts}`);
      setCheckAttempts(i + 1);
      
      try {
        // Call a simple API endpoint to check if user is authenticated
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include', // Important for cookies
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            console.log('[Embedded Auth] User is authenticated, reloading page');
            // Force a full page reload to get fresh server-side data
            window.location.href = returnUrl || `/products/qryx/setup?shop=${shop}`;
            return;
          }
        }
      } catch (error) {
        console.error('[Embedded Auth] Error checking auth status:', error);
      }
      
      // Wait before next attempt (exponential backoff)
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, i), 5000)));
      }
    }
    
    // If we get here, auth check failed
    console.error('[Embedded Auth] Auth check failed after max attempts');
    setIsChecking(false);
    alert('Authentication completed, but we could not verify your session. Please try refreshing the page.');
  };

  const handleOpenAuth = () => {
    const authUrl = `/login?redirect_url=${encodeURIComponent(
      returnUrl || `/products/qryx/setup?shop=${shop}`
    )}&embedded=true`;

    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const newWindow = window.open(
      authUrl,
      'qryx-auth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!newWindow) {
      alert('Popup blocked! Please allow popups for this site and try again.');
      return;
    }

    setAuthWindow(newWindow);

    // Check if window was closed manually without completing auth
    const checkClosed = setInterval(() => {
      if (newWindow?.closed) {
        clearInterval(checkClosed);
        setAuthWindow(null);
        
        // If window closed and we're not checking, it was closed manually
        if (!isChecking) {
          console.log('[Embedded Auth] Popup closed manually');
        }
      }
    }, 500);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
            <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-white">Verifying Authentication...</h1>
          <p className="text-slate-400 mb-2">
            Please wait while we verify your login.
          </p>
          <p className="text-sm text-slate-500">
            Attempt {checkAttempts} of 5
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Card */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-8">
          {/* Icon */}
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
            <Shield className="h-8 w-8 text-cyan-500" />
          </div>

          {/* Heading */}
          <h1 className="mb-3 text-3xl font-bold text-white">
            Continue Setup in New Window
          </h1>
          
          <p className="mb-6 text-slate-400 text-lg">
            To complete your Qryx installation for <span className="text-cyan-400 font-medium">{shop}</span>, 
            we need to authenticate you in a separate window.
          </p>

          {/* Why box */}
          <div className="mb-6 rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-300">Why is this needed?</h3>
            <p className="text-sm text-slate-400">
              Browser security policies prevent authentication inside Shopify&apos;s embedded app. 
              Opening authentication in a new window ensures a secure and reliable login experience.
            </p>
          </div>

          {/* Steps */}
          <div className="mb-8 space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-400">
                1
              </div>
              <p className="text-sm text-slate-300">
                Click the button below to open authentication in a new window
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-400">
                2
              </div>
              <p className="text-sm text-slate-300">
                Sign in or create your account in the popup window
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-400">
                3
              </div>
              <p className="text-sm text-slate-300">
                This page will automatically update after successful authentication
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleOpenAuth}
            disabled={!!authWindow}
            className="w-full rounded-lg bg-cyan-500 px-6 py-4 font-semibold text-slate-900 transition-all hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
          >
            <ExternalLink className="h-5 w-5" />
            {authWindow ? 'Authentication Window Opened' : 'Open Authentication Window'}
          </button>

          {authWindow && (
            <p className="mt-4 text-center text-sm text-slate-400">
              Complete authentication in the popup window. This page will update automatically.
            </p>
          )}

          {/* Security note */}
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
            <p className="text-xs text-slate-400">
              This is a secure authentication process. We never store your Shopify credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
