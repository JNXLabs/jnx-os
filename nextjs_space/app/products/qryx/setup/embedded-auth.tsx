/**
 * Embedded Auth Handler for Shopify Admin
 * 
 * Handles authentication in Shopify's embedded app iframe context
 * Opens auth in a new window to bypass third-party cookie restrictions
 */

'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Sparkles, Shield, CheckCircle2 } from 'lucide-react';

interface EmbeddedAuthProps {
  shop: string;
  returnUrl?: string;
}

export function EmbeddedAuth({ shop, returnUrl }: EmbeddedAuthProps) {
  const [authWindow, setAuthWindow] = useState<Window | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Listen for auth completion message from popup
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'qryx-auth-complete') {
        setIsChecking(true);
        // Reload to check auth status
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

    setAuthWindow(newWindow);

    // Check if window was closed
    const checkClosed = setInterval(() => {
      if (newWindow?.closed) {
        clearInterval(checkClosed);
        setAuthWindow(null);
        setIsChecking(true);
        // Check auth status after window closes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }, 500);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 animate-pulse">
            <Sparkles className="h-8 w-8 text-cyan-500" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-white">Checking Authentication...</h1>
          <p className="text-slate-400">Please wait while we verify your login.</p>
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
                Return here after authentication to continue setup
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
