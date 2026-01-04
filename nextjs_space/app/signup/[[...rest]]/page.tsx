'use client';

import { SignUp, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Zap, Loader2, CheckCircle2, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect_url');
  const installSessionId = searchParams?.get('install_session_id');
  const shopDomain = searchParams?.get('shop');
  const { isSignedIn, isLoaded } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Is this a Shopify installation flow?
  const isShopifyInstall = !!(installSessionId && shopDomain);

  // Handle successful signup - redirect to the specified URL
  useEffect(() => {
    if (isLoaded && isSignedIn && redirectUrl && !isRedirecting) {
      console.log('[Signup] User signed up, redirecting to:', redirectUrl);
      setIsRedirecting(true);
      
      // Use window.location for a full page navigation
      setTimeout(() => {
        const decodedUrl = decodeURIComponent(redirectUrl);
        console.log('[Signup] Final redirect URL:', decodedUrl);
        window.location.href = decodedUrl;
      }, 100); // Reduced timeout to 100ms for faster redirect
    }
  }, [isLoaded, isSignedIn, redirectUrl, isRedirecting]);

  // Show redirecting state
  if (isRedirecting || (isLoaded && isSignedIn && redirectUrl)) {
    return (
      <div className="min-h-screen bg-jnx-dark flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isShopifyInstall ? 'Account Created!' : 'Account Created!'}
          </h1>
          <p className="text-slate-400 mb-4">
            {isShopifyInstall ? 'Setting up Qryx for your shop...' : 'Redirecting you back...'}
          </p>
          <Loader2 className="h-6 w-6 text-cyan-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jnx-dark flex flex-col items-center justify-center p-4">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-jnx-dark/80 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-cyan-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                JNX
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mt-16 w-full max-w-md">
        
        {/* 🚨 SHOPIFY INSTALLATION BANNER */}
        {isShopifyInstall && (
          <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-cyan-400 font-semibold">📦 Fast geschafft!</p>
                <p className="text-slate-300 text-sm mt-1">
                  Du installierst Qryx in <span className="font-mono text-cyan-300">{shopDomain}</span>
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  Erstelle einen Account, um die Installation abzuschließen.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isShopifyInstall ? 'Account erstellen' : 'Get Started'}
          </h1>
          <p className="text-slate-400">
            {isShopifyInstall 
              ? 'Erstelle deinen JNX Account für Qryx' 
              : 'Create your JNX-OS account'
            }
          </p>
        </div>

        {/* Clerk SignUp Component */}
        <div className="flex justify-center">
          <SignUp 
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-slate-900/40 border border-slate-800/60',
              },
            }}
            routing="path"
            path="/signup"
            signInUrl={isShopifyInstall 
              ? `/login?install_session_id=${installSessionId}&shop=${shopDomain}&redirect_url=${encodeURIComponent(redirectUrl || '')}` 
              : "/login"
            }
            fallbackRedirectUrl={redirectUrl ? decodeURIComponent(redirectUrl) : "/app"}
            forceRedirectUrl={redirectUrl ? decodeURIComponent(redirectUrl) : undefined}
          />
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link 
              href={isShopifyInstall 
                ? `/login?install_session_id=${installSessionId}&shop=${shopDomain}&redirect_url=${encodeURIComponent(redirectUrl || '')}` 
                : "/login"
              } 
              className="text-cyan-500 hover:text-cyan-400 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
