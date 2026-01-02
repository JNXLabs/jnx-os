'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthRedirectProps {
  shop: string;
}

export function AuthRedirect({ shop }: AuthRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const redirectUrl = `/login?redirect_url=${encodeURIComponent(`/products/qryx/setup?shop=${shop}`)}`;
    router.push(redirectUrl);
  }, [shop, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-400 mb-4">Redirecting to login...</p>
      </div>
    </div>
  );
}
