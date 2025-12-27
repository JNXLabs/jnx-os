'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function SignupPage() {
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
