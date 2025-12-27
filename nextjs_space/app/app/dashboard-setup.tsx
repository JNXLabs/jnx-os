'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, AlertCircle, Mail } from 'lucide-react';
import { ButtonPrimary } from '@/components/ui/button-primary';
import { ButtonSecondary } from '@/components/ui/button-secondary';

const MAX_RETRIES = 10; // Maximum auto-refresh attempts
const RETRY_INTERVAL = 3; // Seconds between retries

interface DashboardSetupProps {
  userId?: string;
}

export default function DashboardSetup({ userId }: DashboardSetupProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(RETRY_INTERVAL);
  const [retries, setRetries] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Check if max retries reached
    if (retries >= MAX_RETRIES) {
      setShowError(true);
      return;
    }

    // Auto-refresh countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger refresh
          router.refresh();
          setRetries((r) => r + 1);
          return RETRY_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router, retries]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRetries((r) => r + 1);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      setCountdown(RETRY_INTERVAL);
    }, 1000);
  };

  // Error State: Max retries reached
  if (showError) {
    return (
      <div className="min-h-screen bg-jnx-dark flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">
            Setup Taking Longer Than Expected
          </h1>

          {/* Description */}
          <p className="text-slate-400 mb-6">
            We're having trouble setting up your account automatically.
            This is usually due to a temporary issue with our synchronization system.
          </p>

          {/* Actions */}
          <div className="space-y-3 mb-8">
            <ButtonPrimary
              onClick={() => {
                setShowError(false);
                setRetries(0);
                setCountdown(RETRY_INTERVAL);
                router.refresh();
              }}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </ButtonPrimary>

            <ButtonSecondary
              onClick={() => router.push('/')}
              className="w-full"
            >
              Return to Homepage
            </ButtonSecondary>
          </div>

          {/* Support Info */}
          <div className="p-4 bg-slate-900/60 border border-slate-700/50 rounded-xl">
            <p className="text-sm text-slate-300 mb-3">
              <strong>Need immediate assistance?</strong>
            </p>
            <a
              href="mailto:support@jnxlabs.ai"
              className="inline-flex items-center text-cyan-500 hover:text-cyan-400 transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              support@jnxlabs.ai
            </a>
            {userId && (
              <p className="text-xs text-slate-500 mt-3">
                Reference ID: {userId.slice(0, 8)}...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading State: Normal operation
  return (
    <div className="min-h-screen bg-jnx-dark flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Loading Icon */}
        <div className="flex justify-center mb-6">
          <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Setting up your account
        </h1>

        {/* Description */}
        <p className="text-slate-400 mb-2">
          Please wait while we prepare your dashboard.
        </p>
        <p className="text-sm text-slate-500 mb-6">
          This usually takes just a few seconds.
        </p>

        {/* Progress Indicator */}
        <div className="mb-6">
          <p className="text-sm text-slate-400 mb-2">
            Auto-refreshing in <span className="text-cyan-500 font-bold">{countdown}</span> seconds...
          </p>
          <p className="text-xs text-slate-500">
            Attempt {retries + 1} of {MAX_RETRIES}
          </p>
        </div>

        {/* Manual Refresh Button */}
        <ButtonPrimary
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Now'}</span>
        </ButtonPrimary>

        {/* Warning if taking longer */}
        {retries >= 5 && (
          <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-400">
              Setup is taking longer than usual. Please be patient.
            </p>
          </div>
        )}

        {/* Troubleshooting hint */}
        <div className="mt-8 p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl">
          <p className="text-xs text-slate-400">
            <strong>What's happening?</strong>
            <br />
            We're syncing your account data from our authentication system.
            <br />
            This process is usually instant but may take a moment during high load.
          </p>
        </div>
      </div>
    </div>
  );
}
