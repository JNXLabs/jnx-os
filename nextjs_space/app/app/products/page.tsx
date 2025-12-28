/**
 * JNX-OS Products Overview
 * 
 * Displays all registered products in the JNX ecosystem.
 * Dynamically loads from Product Registry.
 */

import Link from 'next/link'
import { Zap, ArrowLeft, ExternalLink, ShoppingBag, TrendingUp, Activity, Settings } from 'lucide-react'
import { getAllProducts } from '@/lib/jnx-products'
import { ButtonPrimary } from '@/components/ui/button-primary'
import { ButtonSecondary } from '@/components/ui/button-secondary'
import { StatusBadge } from '@/components/ui/status-badge'
import { requireAuth } from '@/lib/auth/helpers'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  // Require authentication
  const { user } = await requireAuth()

  // Get all registered products
  const products = getAllProducts()

  // Product icons mapping
  const getProductIcon = (productId: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      qryx: <ShoppingBag className="w-5 h-5" />,
      // Future products
      trading_bot: <TrendingUp className="w-5 h-5" />,
      analytics: <Activity className="w-5 h-5" />,
    }
    return icons[productId] || <Zap className="w-5 h-5 text-white" />
  }

  // Product status mapping
  const getProductStatus = (metadata: Record<string, unknown> | undefined) => {
    const status = metadata?.status as string | undefined
    switch (status) {
      case 'active':
        return 'connected'
      case 'beta':
        return 'online'
      case 'maintenance':
        return 'degraded'
      case 'deprecated':
        return 'disconnected'
      default:
        return 'coming-soon'
    }
  }

  // Get product status text
  const getProductStatusText = (metadata: Record<string, unknown> | undefined): string => {
    return metadata?.status ? String(metadata.status) : 'Unknown'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/app">
                <ButtonSecondary size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </ButtonSecondary>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">JNX Products</h1>
                  <p className="text-slate-400 text-sm">Manage your product portfolio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Total Products</span>
              <Activity className="w-5 h-5 text-cyan-500" />
            </div>
            <div className="text-3xl font-bold text-white">{products.length}</div>
            <p className="text-sm text-slate-500 mt-1">Registered in ecosystem</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Active Products</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-white">
              {products.filter(p => p.metadata?.status === 'active' || p.metadata?.status === 'beta').length}
            </div>
            <p className="text-sm text-slate-500 mt-1">Ready to use</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Events Logged</span>
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-white">
              {products.reduce((sum, p) => sum + Object.keys(p.events).length, 0)}
            </div>
            <p className="text-sm text-slate-500 mt-1">Event types total</p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Your Products</h2>
            <StatusBadge status="online">
              {products.length} Active
            </StatusBadge>
          </div>

          {products.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center backdrop-blur-sm">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Products Yet</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Start building your first JNX product to see it here.
              </p>
              <Link href="/docs/products">
                <ButtonPrimary>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Documentation
                </ButtonPrimary>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {products.map((product): React.ReactNode => (
                <div
                  key={product.id}
                  className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 hover:bg-slate-900/60 transition-all backdrop-blur-sm group"
                >
                  {/* Product Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                        {getProductIcon(product.id)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{product.name}</h3>
                        <p className="text-sm text-slate-400">v{product.version}</p>
                      </div>
                    </div>
                    <StatusBadge status={getProductStatus(product.metadata)}>
                      {getProductStatusText(product.metadata)}
                    </StatusBadge>
                  </div>

                  {/* Product Metadata */}
                  {product.metadata && product.metadata.tags && Array.isArray(product.metadata.tags) && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {(product.metadata.tags as unknown as string[]).slice(0, 4).map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-xs text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Events</div>
                      <div className="text-white font-semibold">{Object.keys(product.events).length}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Goals</div>
                      <div className="text-white font-semibold">{Object.keys(product.goals).length}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Protected</div>
                      <div className="text-white font-semibold">{product.protected.length}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-800">
                    {product.id === 'qryx' && (
                      <Link href="/app/qryx" className="flex-1">
                        <ButtonPrimary className="w-full" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Open Dashboard
                        </ButtonPrimary>
                      </Link>
                    )}
                    {product.metadata?.documentation_url && typeof product.metadata.documentation_url === 'string' && (
                      <Link href={String(product.metadata.documentation_url)}>
                        <ButtonSecondary size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </ButtonSecondary>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-8 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-cyan-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">More Products Coming Soon</h3>
              <p className="text-slate-300">We're building the future of AI-powered business tools</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Trading Bot</h4>
              <p className="text-sm text-slate-400">Automated trading with AI optimization</p>
              <StatusBadge status="coming-soon" className="mt-3">
                Q1 2025
              </StatusBadge>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Analytics Hub</h4>
              <p className="text-sm text-slate-400">Real-time business intelligence</p>
              <StatusBadge status="coming-soon" className="mt-3">
                Q2 2025
              </StatusBadge>
            </div>
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Data Pipeline</h4>
              <p className="text-sm text-slate-400">ETL and data processing</p>
              <StatusBadge status="coming-soon" className="mt-3">
                Q3 2025
              </StatusBadge>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
