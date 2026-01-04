'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Crown, Rocket, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PlanSelectionClientProps {
  shop: string;
  shopId: string;
  shopName: string;
  error?: string;
}

export default function PlanSelectionClient({ shop, shopId, shopName, error }: PlanSelectionClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState(error || '');

  const handleSelectPlan = async (plan: 'trial' | 'starter' | 'professional') => {
    setLoading(plan);
    setErrorMsg('');
    
    try {
      const response = await fetch('/api/qryx/activate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, shopId, plan }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate plan');
      }
      
      if (data.redirectUrl) {
        // For paid plans: Redirect to Shopify billing
        window.location.href = data.redirectUrl;
      } else {
        // For trial: Go directly to success/dashboard
        router.push(`/app/qryx?shop=${shop}&activated=true`);
      }
    } catch (err) {
      console.error('Plan activation error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück</span>
          </Link>
          <div className="text-sm text-slate-400">
            Shop: <span className="text-cyan-400 font-mono">{shopName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Wähle deinen <span className="text-cyan-400">Qryx</span> Plan
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Starte mit einer kostenlosen Testphase oder wähle direkt den passenden Plan für deinen Shop.
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
            {errorMsg}
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* FREE TRIAL */}
          <div className="relative bg-slate-900/60 border-2 border-cyan-500/50 rounded-2xl p-6 hover:border-cyan-500 transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">
              EMPFOHLEN
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold">Free Trial</h3>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold">7 Tage</span>
              <span className="text-slate-400 ml-2">kostenlos</span>
            </div>
            
            <ul className="space-y-3 mb-8">
              {[
                'Voller Zugang zu allen Features',
                'Unbegrenzte Chat-Nachrichten',
                'KI-Produktempfehlungen',
                'Analytics Dashboard',
                'Keine Kreditkarte erforderlich',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleSelectPlan('trial')}
              disabled={loading !== null}
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === 'trial' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Wird aktiviert...</>
              ) : (
                'Kostenlos starten'
              )}
            </button>
          </div>

          {/* STARTER */}
          <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Rocket className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Starter</h3>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold">$29</span>
              <span className="text-slate-400 ml-1">/Monat</span>
            </div>
            
            <ul className="space-y-3 mb-8">
              {[
                'Alles aus Free Trial',
                '5.000 Chat-Nachrichten/Monat',
                'E-Mail Support',
                'Basis-Anpassungen',
                'Shopify Billing',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleSelectPlan('starter')}
              disabled={loading !== null}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === 'starter' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Weiter zu Shopify...</>
              ) : (
                'Starter wählen'
              )}
            </button>
          </div>

          {/* PROFESSIONAL */}
          <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold">Professional</h3>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-bold">$79</span>
              <span className="text-slate-400 ml-1">/Monat</span>
            </div>
            
            <ul className="space-y-3 mb-8">
              {[
                'Alles aus Starter',
                'Unbegrenzte Chat-Nachrichten',
                'Priority Support',
                'Erweiterte Anpassungen',
                'API-Zugang',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleSelectPlan('professional')}
              disabled={loading !== null}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === 'professional' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Weiter zu Shopify...</>
              ) : (
                'Professional wählen'
              )}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-slate-500 text-sm mt-8">
          Alle Pläne werden über Shopify abgerechnet. Du kannst jederzeit kündigen.
        </p>
      </main>
    </div>
  );
}
