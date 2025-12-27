'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { ButtonPrimary } from '@/components/ui/button-primary';

export default function DashboardSetup() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.refresh();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

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

        {/* Auto-refresh countdown */}
        <div className="mb-6">
          <p className="text-sm text-slate-400">
            Auto-refreshing in <span className="text-cyan-500 font-bold">{countdown}</span> seconds...
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

        {/* Troubleshooting hint */}
        <div className="mt-8 p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl">
          <p className="text-xs text-slate-400">
            <strong>Taking longer than expected?</strong>
            <br />
            This can happen if our webhook system is experiencing delays.
            <br />
            The page will automatically keep trying to load your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
