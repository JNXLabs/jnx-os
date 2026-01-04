'use client';

import { SignIn, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Zap, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectUrl = searchParams?.get('redirect_url');
  const { isSignedIn, isLoaded } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Handle successful login - redirect to the specified URL
  useEffect(() => {
    if (isLoaded && isSignedIn && redirectUrl && !isRedirecting) {
      console.log('[Login] User signed in, redirecting to:', redirectUrl);
      setIsRedirecting(true);
      
      // Use window.location for a full page navigation
      // This ensures cookies are properly set
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
          <h1 className="text-2xl font-bold text-white mb-2">Login Successful!</h1>
          <p className="text-slate-400 mb-4">Redirecting you back...</p>
          <Loader2 className="h-6 w-6 text-cyan-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Check if Clerk is configured
  const isClerkConfigured = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );

  if (!isClerkConfigured) {
    return (
      <div className="min-h-screen bg-jnx-dark flex flex-col items-center justify-center p-4">
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

        <div className="mt-16 w-full max-w-md">
          <div className="p-8 bg-slate-900/40 border border-slate-800/60 rounded-xl">
            <div className="flex items-center space-x-3 text-yellow-500 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Configuration Required</h2>
            </div>
            <p className="text-slate-300 mb-4">
              Clerk authentication is not configured. Please add your Clerk API keys to the .env file.
            </p>
            <div className="p-4 bg-slate-950/50 rounded-lg font-mono text-sm text-slate-400">
              <p>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...</p>
              <p>CLERK_SECRET_KEY=...</p>
            </div>
            <Link
              href="/"
              className="mt-4 inline-block text-cyan-500 hover:text-cyan-400 transition-colors"
            >
              ← Back to home
            </Link>
          </div>
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
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to your JNX-OS account</p>
        </div>

        {/* Clerk SignIn Component */}
        <div className="flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-slate-900/40 border border-slate-800/60',
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/signup"
            fallbackRedirectUrl="/app"
            forceRedirectUrl="/app"
          />
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-cyan-500 hover:text-cyan-400 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
