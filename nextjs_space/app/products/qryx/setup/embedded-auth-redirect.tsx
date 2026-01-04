/**
 * Embedded Auth Redirect Component
 * 
 * ENTERPRISE-GRADE SOLUTION FOR SHOPIFY EMBEDDED APPS
 * 
 * The Problem:
 * - Shopify Admin loads our app in an iframe
 * - Third-party cookies are blocked by ALL modern browsers
 * - Clerk (and any cookie-based auth) CANNOT work in iframes
 * - Popup windows don't reliably sync sessions across origins
 * 
 * The Solution:
 * - Detect if we're in an iframe
 * - If yes: Navigate the TOP-LEVEL window to our auth page
 * - This exits Shopify's iframe entirely
 * - User authenticates on our domain (full page, no cookie issues)
 * - After auth, redirect back to setup page with shop param
 * - User is now authenticated and sees pricing
 * 
 * This is the STANDARD approach for Shopify apps with external auth.
 * Shopify themselves recommend this for apps that can't use Shopify's
 * built-in Session Token authentication.
 */

'use client';

import { useEffect, useState } from 'react';
import { Shield, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface EmbeddedAuthRedirectProps {
  shop: string;
}

export function EmbeddedAuthRedirect({ shop }: EmbeddedAuthRedirectProps) {
  const [isInIframe, setIsInIframe] = useState<boolean | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showManualButton, setShowManualButton] = useState(false);

  useEffect(() => {
    // Detect if we're in an iframe
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);
    console.log('[Qryx Auth] Running in iframe:', inIframe);

    // Show manual button after a delay (fallback for auto-redirect)
    const timer = setTimeout(() => {
      setShowManualButton(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleAuth = () => {
    setIsRedirecting(true);
    
    // Build the auth URL
    // After login, Clerk will redirect to the fallbackRedirectUrl
    // We set up a special callback that redirects back to setup with shop param
    const returnUrl = `/products/qryx/setup?shop=${encodeURIComponent(shop)}&auth_complete=true`;
    const authUrl = `/login?redirect_url=${encodeURIComponent(returnUrl)}`;
    
    console.log('[Qryx Auth] Redirecting to auth:', authUrl);
    console.log('[Qryx Auth] Is in iframe:', isInIframe);

    if (isInIframe) {
      // We're in an iframe - redirect the TOP window
      // This breaks out of Shopify's iframe
      try {
        if (window.top) {
          window.top.location.href = authUrl;
        } else {
          // Fallback if top is not accessible
          window.location.href = authUrl;
        }
      } catch (e) {
        // Cross-origin restriction - try window.open as fallback
        console.log('[Qryx Auth] Cannot access top window, opening new tab');
        window.open(authUrl, '_blank');
      }
    } else {
      // Not in iframe - normal redirect
      window.location.href = authUrl;
    }
  };

  // Still detecting environment
  if (isInIframe === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Preparing authentication...</p>
        </div>
      </div>
    );
  }

  // Already redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">Redirecting to Login...</h1>
          <p className="text-slate-400 mb-6">
            {isInIframe 
              ? "Opening authentication in a new window. Please complete the login process."
              : "Please wait while we redirect you to the login page."}
          </p>
          {isInIframe && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-400">
                If the login page doesn&apos;t open automatically, please allow popups for this site.
              </p>
            </div>
          )}
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
            Sign In to Continue
          </h1>
          
          <p className="mb-6 text-slate-400 text-lg">
            To install Qryx on <span className="text-cyan-400 font-medium">{shop}</span>, 
            please sign in to your JNX account.
          </p>

          {/* Info box for embedded context */}
          {isInIframe && (
            <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-400 mb-1">
                    Secure Authentication Required
                  </h3>
                  <p className="text-sm text-slate-400">
                    For security reasons, you&apos;ll be redirected to complete authentication 
                    outside of Shopify. After signing in, you&apos;ll return here automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
              <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <span className="text-cyan-400 text-sm font-bold">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Sign In</p>
                <p className="text-xs text-slate-400">Use your existing account or create one</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
              <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <span className="text-cyan-400 text-sm font-bold">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Choose Plan</p>
                <p className="text-xs text-slate-400">Select the best plan for your store</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
              <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <span className="text-cyan-400 text-sm font-bold">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Connect Store</p>
                <p className="text-xs text-slate-400">Authorize Qryx to access your shop</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
              <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <span className="text-cyan-400 text-sm font-bold">4</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Go Live!</p>
                <p className="text-xs text-slate-400">AI assistant ready in minutes</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleAuth}
              className="w-full rounded-lg bg-cyan-500 px-6 py-4 font-semibold text-slate-900 transition-all hover:bg-cyan-400 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
            >
              <ExternalLink className="h-5 w-5" />
              Continue to Sign In
            </button>

            {showManualButton && (
              <p className="text-center text-sm text-slate-500">
                Button not working?{' '}
                <a
                  href={`/login?redirect_url=${encodeURIComponent(`/products/qryx/setup?shop=${shop}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Open login in new tab
                </a>
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <a
                href={`/signup?redirect_url=${encodeURIComponent(`/products/qryx/setup?shop=${shop}`)}`}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Sign up for free
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
