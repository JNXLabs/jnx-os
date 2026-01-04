'use client';

import { SignUp, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect_url');
  const { isSignedIn, isLoaded } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Handle successful signup - redirect to the specified URL
  useEffect(() => {
    if (isLoaded && isSignedIn && redirectUrl && !isRedirecting) {
      console.log('[Signup] User signed up, redirecting to:', redirectUrl);
      setIsRedirecting(true);
      
      // Use window.location for a full page navigation
      setTimeout(() => {
        window.location.href = decodeURIComponent(redirectUrl);
      }, 500);
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
          <h1 className="text-2xl font-bold text-white mb-2">Account Created!</h1>
          <p className="text-slate-400 mb-4">Redirecting you back...</p>
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Get Started</h1>
          <p className="text-slate-400">Create your JNX-OS account</p>
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
            signInUrl="/login"
            fallbackRedirectUrl="/app"
            forceRedirectUrl="/app"
          />
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-500 hover:text-cyan-400 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
