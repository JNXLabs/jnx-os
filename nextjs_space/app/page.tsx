import Link from 'next/link';
import { ButtonPrimary } from '@/components/ui/button-primary';
import { ButtonSecondary } from '@/components/ui/button-secondary';
import { FeatureCard } from '@/components/ui/feature-card';
import { TerminalBox } from '@/components/ui/terminal-box';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Activity,
  Brain,
  Shield,
  Zap,
  Twitter,
  Github,
  Linkedin,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-jnx-dark">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-jnx-dark/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-500" />
            <span className="text-xl font-bold text-white">JNX-OS</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Products
            </Link>
            <Link
              href="/login"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link href="/signup">
              <ButtonPrimary size="sm">Get Started</ButtonPrimary>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            The Neural Engine For{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              SaaS Logic
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 mb-8 max-w-3xl mx-auto">
            JNX is not just software. It is a self-healing, predictive
            computational core designed to scale modern digital infrastructure
            autonomously.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <ButtonPrimary size="lg" glow>
                Deploy Engine
              </ButtonPrimary>
            </Link>
            <Link href="#features">
              <ButtonSecondary size="lg">Read Architecture</ButtonSecondary>
            </Link>
          </div>

          {/* Terminal Status Box */}
          <div className="max-w-2xl mx-auto">
            <TerminalBox title="system.status">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">ENGINE STATUS:</span>
                  <StatusBadge status="online">ONLINE</StatusBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Nodes:</span>
                  <span className="text-cyan-400 font-semibold">8,492</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Compute Load:</span>
                  <span className="text-cyan-400 font-semibold">42%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>System Status:</span>
                  <span className="text-green-400 font-semibold">OPTIMAL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Latency:</span>
                  <span className="text-cyan-400 font-semibold">~14ms</span>
                </div>
              </div>
            </TerminalBox>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Core Capabilities
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Activity className="w-10 h-10" />}
              title="Self-Healing"
              description="Auto-detects and resolves system anomalies in real-time. Maintains optimal performance without manual intervention."
            />
            <FeatureCard
              icon={<Brain className="w-10 h-10" />}
              title="Predictive"
              description="Anticipates load patterns and scales resources proactively. Machine learning drives intelligent resource allocation."
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10" />}
              title="Privacy-First"
              description="GDPR compliant from the ground up. Data minimization and encryption by default. Your data stays yours."
            />
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 px-6 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Powered Products
          </h2>
          <div className="max-w-2xl mx-auto">
            <div className="group relative p-8 bg-slate-900/60 border border-slate-800/60 rounded-xl transition-all duration-300 hover:bg-slate-900/80">
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-cyan-500 to-transparent group-hover:w-full transition-all duration-500" />
              
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white">QRYX</h3>
                    <StatusBadge status="coming-soon">Coming Soon</StatusBadge>
                  </div>
                  <p className="text-lg text-cyan-400 mb-3">
                    AI Sales Assistant for modern e-commerce
                  </p>
                  <p className="text-slate-400">
                    Automates support, boosts conversions, turns chats into
                    revenue. Intelligent product recommendations powered by JNX.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-500" />
              <span className="text-sm text-slate-400">
                © 2025 JNX Labs. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/products"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Products
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
