import Link from 'next/link';
import { ButtonPrimary } from '@/components/ui/button-primary';
import { ButtonSecondary } from '@/components/ui/button-secondary';
import { FeatureCard } from '@/components/ui/feature-card';
import { TerminalBox } from '@/components/ui/terminal-box';
import { StatusBadge } from '@/components/ui/status-badge';
import { NeuralBackground } from '@/components/ui/neural-background';
import { FloatingParticles } from '@/components/ui/floating-particles';
import {
  Activity,
  Brain,
  Shield,
  Zap,
  Sparkles,
  Cpu,
  Network,
  Lock,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-jnx-dark relative overflow-hidden">
      {/* Floating Particles Background */}
      <FloatingParticles />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Zap className="w-6 h-6 text-cyan-500 group-hover:animate-pulse transition-all" />
            <span className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
              JNX-OS
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-slate-300 hover:text-cyan-400 transition-all duration-300 relative group"
            >
              Products
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/login"
              className="text-slate-300 hover:text-cyan-400 transition-all duration-300 relative group"
            >
              Login
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/signup">
              <ButtonPrimary size="sm" className="hover-lift">
                Get Started
              </ButtonPrimary>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section with Neural Background */}
      <section className="relative pt-32 pb-20 px-6 min-h-[90vh] flex items-center">
        {/* Neural Network Animation */}
        <NeuralBackground />

        <div className="relative z-10 max-w-7xl mx-auto text-center w-full">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/30 mb-8 animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-sm text-cyan-300 font-medium">
              Enterprise SaaS Foundation • Production Ready
            </span>
          </div>

          {/* Main Heading with Gradient */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
            The Neural Engine For{' '}
            <span className="gradient-text block md:inline animate-neural-pulse">
              SaaS Logic
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
            JNX is not just software. It is a{' '}
            <span className="text-cyan-400 font-semibold">self-healing</span>,{' '}
            <span className="text-cyan-400 font-semibold">predictive</span>{' '}
            computational core designed to scale modern digital infrastructure{' '}
            <span className="text-cyan-400 font-semibold">autonomously</span>.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in">
            <Link href="/signup">
              <ButtonPrimary size="lg" glow className="hover-lift group">
                <Cpu className="w-5 h-5 mr-2 group-hover:animate-spin" />
                Deploy Engine
              </ButtonPrimary>
            </Link>
            <Link href="#features">
              <ButtonSecondary size="lg" className="hover-lift">
                Read Architecture
              </ButtonSecondary>
            </Link>
          </div>

          {/* Terminal Status Box with Glass Effect */}
          <div className="max-w-2xl mx-auto animate-fade-in-up">
            <TerminalBox title="system.status">
              <div className="space-y-3">
                <div className="flex items-center justify-between group">
                  <span className="text-green-400 font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    ENGINE STATUS:
                  </span>
                  <StatusBadge status="online">ONLINE</StatusBadge>
                </div>
                <div className="flex items-center justify-between hover:bg-slate-800/30 px-2 py-1 rounded transition-colors">
                  <span className="text-slate-300">Active Nodes:</span>
                  <span className="text-cyan-400 font-semibold font-mono">8,492</span>
                </div>
                <div className="flex items-center justify-between hover:bg-slate-800/30 px-2 py-1 rounded transition-colors">
                  <span className="text-slate-300">Compute Load:</span>
                  <span className="text-cyan-400 font-semibold font-mono">42%</span>
                </div>
                <div className="flex items-center justify-between hover:bg-slate-800/30 px-2 py-1 rounded transition-colors">
                  <span className="text-slate-300">System Status:</span>
                  <span className="text-green-400 font-semibold font-mono">OPTIMAL</span>
                </div>
                <div className="flex items-center justify-between hover:bg-slate-800/30 px-2 py-1 rounded transition-colors">
                  <span className="text-slate-300">Latency:</span>
                  <span className="text-cyan-400 font-semibold font-mono">~14ms</span>
                </div>
              </div>
            </TerminalBox>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/20 mb-4">
              <Network className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-300 font-medium">
                Core Architecture
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Core Capabilities
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Enterprise-grade features designed for modern SaaS infrastructure
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <FeatureCard
                icon={<Activity className="w-10 h-10" />}
                title="Self-Healing"
                description="Auto-detects and resolves system anomalies in real-time. Maintains optimal performance without manual intervention."
                className="hover-lift h-full"
              />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <FeatureCard
                icon={<Brain className="w-10 h-10" />}
                title="Predictive"
                description="Anticipates load patterns and scales resources proactively. Machine learning drives intelligent resource allocation."
                className="hover-lift h-full"
              />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <FeatureCard
                icon={<Shield className="w-10 h-10" />}
                title="Privacy-First"
                description="GDPR compliant from the ground up. Data minimization and encryption by default. Your data stays yours."
                className="hover-lift h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-950/50 to-jnx-dark relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/20 mb-4">
              <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-sm text-cyan-300 font-medium">
                JNX-Powered Solutions
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Powered Products
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Enterprise applications built on the JNX-OS foundation
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="group relative p-8 glass border border-cyan-500/20 rounded-xl transition-all duration-500 hover-lift hover:border-cyan-500/40 animate-fade-in-up">
              {/* Animated Border Glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              
              {/* Bottom Accent Line */}
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-transparent group-hover:w-full transition-all duration-700" />
              
              <div className="relative flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow-primary group-hover:shadow-glow-hover transition-shadow">
                  <Zap className="w-8 h-8 text-white group-hover:animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                      QRYX
                    </h3>
                    <StatusBadge status="coming-soon">Coming Soon</StatusBadge>
                  </div>
                  <p className="text-lg text-cyan-400 mb-3 font-semibold">
                    AI Sales Assistant for modern e-commerce
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    Automates support, boosts conversions, turns chats into
                    revenue. Intelligent product recommendations powered by JNX.
                  </p>
                  
                  {/* Feature Pills */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Gemini 2.0 Flash
                    </span>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Shopify Integration
                    </span>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Real-time Chat
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800/50 bg-gradient-to-b from-jnx-dark to-slate-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cyan-900/5 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 group">
              <Zap className="w-5 h-5 text-cyan-500 group-hover:animate-pulse transition-all" />
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                © 2025 JNX Labs. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-slate-400 hover:text-cyan-400 transition-all duration-300 relative group"
              >
                Privacy
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-cyan-500 to-transparent group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/terms"
                className="text-sm text-slate-400 hover:text-cyan-400 transition-all duration-300 relative group"
              >
                Terms
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-cyan-500 to-transparent group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/products"
                className="text-sm text-slate-400 hover:text-cyan-400 transition-all duration-300 relative group"
              >
                Products
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-cyan-500 to-transparent group-hover:w-full transition-all duration-300" />
              </Link>
            </div>
          </div>
          
          {/* Powered by badge */}
          <div className="mt-8 pt-6 border-t border-slate-800/30 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/10">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-slate-400 font-medium">
                Enterprise-Grade Security • GDPR Compliant • Production Ready
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
