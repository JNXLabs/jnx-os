'use client';

/**
 * Qryx Dashboard Client Component
 * 
 * Interactive dashboard for Qryx shop owners
 * Displays analytics, configuration, and chat history
 */

import { useState, useEffect } from 'react';
import { ShopifyShop, QryxConfig } from '@/lib/db/qryx-helpers';
import { ButtonPrimary } from '@/components/ui/button-primary';
import { ButtonSecondary } from '@/components/ui/button-secondary';
import { InputField } from '@/components/ui/input-field';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  Settings, 
  MessageCircle, 
  BarChart3, 
  Zap,
  Copy,
  Check,
  ExternalLink 
} from 'lucide-react';

interface QryxDashboardClientProps {
  shop: ShopifyShop;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

export default function QryxDashboardClient({ shop, user }: QryxDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'analytics'>('overview');
  const [config, setConfig] = useState<QryxConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load configuration
  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const response = await fetch(`/api/qryx/config?shop_id=${shop.id}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig(updates: Partial<QryxConfig>) {
    setSaving(true);
    try {
      const response = await fetch('/api/qryx/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shop.id,
          updates,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  }

  function copyWidgetCode() {
    const code = `<script src="${process.env.NEXT_PUBLIC_APP_URL}/api/widget/qryx?shop_id=${shop.id}"></script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Qryx Dashboard</h1>
                <p className="text-slate-400 text-sm">{shop.shop_name}</p>
              </div>
            </div>
            <StatusBadge status={shop.subscription_status === 'active' ? 'connected' : 'disconnected'}>
              {shop.subscription_status === 'active' ? 'Active' : 'Trial'}
            </StatusBadge>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'config'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6">
              <h3 className="text-slate-400 text-sm font-medium mb-2">Total Conversations</h3>
              <p className="text-3xl font-bold text-white">0</p>
              <p className="text-sm text-slate-500 mt-2">This month</p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6">
              <h3 className="text-slate-400 text-sm font-medium mb-2">Avg. Response Time</h3>
              <p className="text-3xl font-bold text-white">1.2s</p>
              <p className="text-sm text-slate-500 mt-2">-15% vs last month</p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6">
              <h3 className="text-slate-400 text-sm font-medium mb-2">Customer Satisfaction</h3>
              <p className="text-3xl font-bold text-white">4.8/5</p>
              <p className="text-sm text-slate-500 mt-2">Based on feedback</p>
            </div>

            {/* Installation Status */}
            <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800/60 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Widget Installation</h3>
              <p className="text-slate-400 mb-4">
                The widget is automatically installed on your Shopify store. You can customize its appearance in the Configuration tab.
              </p>
              <div className="flex items-center gap-4">
                <ButtonPrimary
                  onClick={copyWidgetCode}
                  size="sm"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy Widget Code'}
                </ButtonPrimary>
                <a
                  href={`https://${shop.shop_domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-500 hover:text-cyan-400 flex items-center gap-2"
                >
                  View Store
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && config && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appearance Settings */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Bot Name
                  </label>
                  <InputField
                    value={config.bot_name}
                    onChange={(e) => setConfig({ ...config, bot_name: e.target.value })}
                    placeholder="Qryx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Greeting Message
                  </label>
                  <textarea
                    value={config.bot_greeting}
                    onChange={(e) => setConfig({ ...config, bot_greeting: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                    rows={3}
                    placeholder="Hi! How can I help you today?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.primary_color}
                      onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      className="w-16 h-12 rounded-lg cursor-pointer"
                    />
                    <InputField
                      value={config.primary_color}
                      onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                      placeholder="#06b6d4"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Widget Position
                  </label>
                  <select
                    value={config.widget_position}
                    onChange={(e) => setConfig({ ...config, widget_position: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>

                <ButtonPrimary
                  onClick={() => saveConfig(config)}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </ButtonPrimary>
              </div>
            </div>

            {/* AI Settings */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">AI Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Temperature (0-1)
                  </label>
                  <InputField
                    type="number"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    min="0"
                    max="1"
                    step="0.1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Higher values make responses more creative, lower values more focused.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Tokens
                  </label>
                  <InputField
                    type="number"
                    value={config.max_tokens}
                    onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
                    min="100"
                    max="1000"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Maximum length of AI responses.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Context Messages
                  </label>
                  <InputField
                    type="number"
                    value={config.max_context_messages}
                    onChange={(e) => setConfig({ ...config, max_context_messages: parseInt(e.target.value) })}
                    min="5"
                    max="20"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Number of previous messages to include as context.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.show_product_images}
                      onChange={(e) => setConfig({ ...config, show_product_images: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-slate-300">Show product images in chat</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Analytics Coming Soon</h3>
            <p className="text-slate-400">
              Detailed analytics and conversation insights will be available in the next update.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
