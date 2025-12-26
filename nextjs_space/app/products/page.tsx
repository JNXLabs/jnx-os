import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-jnx-dark">
      {/* Header */}
      <header className="border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-500" />
            <span className="text-xl font-bold text-white">JNX-OS</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            JNX-Powered Products
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Intelligent applications built on the JNX computational core.
          </p>
        </div>

        {/* Products Grid */}
        <div className="max-w-2xl mx-auto">
          <div className="group relative p-8 bg-slate-900/60 border border-slate-800/60 rounded-xl transition-all duration-300 hover:bg-slate-900/80">
            <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-cyan-500 to-transparent group-hover:w-full transition-all duration-500" />
            
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">QRYX</h2>
                  <StatusBadge status="coming-soon">Coming Soon</StatusBadge>
                </div>
                <p className="text-lg text-cyan-400 mb-3">
                  AI Sales Assistant for modern e-commerce
                </p>
                <p className="text-slate-400 mb-4">
                  Automates support, boosts conversions, turns chats into
                  revenue. Intelligent product recommendations powered by JNX.
                </p>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Features:</h3>
                  <ul className="space-y-1 text-sm text-slate-400">
                    <li>• AI-powered customer support automation</li>
                    <li>• Intelligent product recommendations</li>
                    <li>• Real-time conversation analytics</li>
                    <li>• Seamless e-commerce integration</li>
                    <li>• Multi-language support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-400">
              More products coming soon. Stay tuned for updates.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
