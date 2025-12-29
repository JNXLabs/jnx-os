/**
 * Session Expired Error Component
 * 
 * Displays a clear error message when shop session has expired
 * Provides restart installation link
 */
'use client';

import Link from 'next/link';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { ButtonPrimary } from '@/components/ui/button-primary';
import { ButtonSecondary } from '@/components/ui/button-secondary';

interface SessionExpiredErrorProps {
  redirectToShopify?: boolean;
}

export function SessionExpiredError({ redirectToShopify = true }: SessionExpiredErrorProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-slate-900/80 border border-red-500/30 rounded-2xl p-8 text-center space-y-6 backdrop-blur-sm shadow-xl">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-red-500/10 p-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-white">
              Shop Session Expired
            </h2>
            <p className="text-slate-400">
              Your installation session has expired. This happens after 30 minutes of inactivity.
            </p>
            <p className="text-sm text-slate-500">
              Please restart the installation process from your Shopify Admin.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {redirectToShopify ? (
              <a
                href="https://apps.shopify.com/qryx"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <ButtonPrimary className="w-full" size="lg" glow>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restart Installation
                  <ExternalLink className="ml-2 h-4 w-4" />
                </ButtonPrimary>
              </a>
            ) : (
              <Link href="/products">
                <ButtonPrimary className="w-full" size="lg" glow>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restart Installation
                </ButtonPrimary>
              </Link>
            )}

            <Link href="/">
              <ButtonSecondary className="w-full" size="lg">
                Return to Homepage
              </ButtonSecondary>
            </Link>
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              Need help? Contact{' '}
              <a
                href="mailto:support@jnxlabs.ai"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                support@jnxlabs.ai
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            💡 <span className="text-slate-400">Tip:</span> Complete the entire installation flow within 30 minutes to avoid session expiry.
          </p>
        </div>
      </div>
    </div>
  );
}
