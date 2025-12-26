'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { JNXUser, JNXOrg } from '@/lib/db/helpers';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Home,
  Package,
  Settings,
  CreditCard,
  LogOut,
  Zap,
  Activity,
  Users,
  Clock,
} from 'lucide-react';
import { FeatureCard } from '@/components/ui/feature-card';
import { ButtonPrimary } from '@/components/ui/button-primary';

interface DashboardClientProps {
  user: User;
  jnxUser: JNXUser | null;
  org: JNXOrg | null;
}

export function DashboardClient({ user, jnxUser, org }: DashboardClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-jnx-dark flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/40 border-r border-slate-800/60 flex flex-col">
        <div className="p-6 border-b border-slate-800/60">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-500" />
            <span className="text-xl font-bold text-white">JNX-OS</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/app"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/products"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <Package className="w-5 h-5" />
            <span>Products</span>
          </Link>
          <Link
            href="/app"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
          <Link
            href="/app"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            <span>Billing</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800/60">
          <div className="mb-4 p-4 bg-slate-800/30 rounded-lg">
            <p className="text-sm text-slate-400 mb-1">Signed in as</p>
            <p className="text-sm text-white font-medium truncate">
              {user.email}
            </p>
            {jnxUser?.role && (
              <p className="text-xs text-cyan-400 mt-1 capitalize">
                {jnxUser.role}
              </p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to JNX-OS
            </h1>
            <p className="text-slate-400">
              Manage your products and services from this dashboard.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <FeatureCard
              icon={<Activity className="w-8 h-8" />}
              title="System Status"
              description="All systems operational"
            >
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-green-400">Online</span>
              </div>
            </FeatureCard>

            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Organization"
              description={org?.name ?? 'No organization'}
            >
              <div className="mt-3">
                <span className="text-sm text-slate-400">
                  {jnxUser?.role === 'admin' ? 'Administrator' : 'Member'}
                </span>
              </div>
            </FeatureCard>

            <FeatureCard
              icon={<Clock className="w-8 h-8" />}
              title="Account Created"
              description="Member since"
            >
              <div className="mt-3">
                <span className="text-sm text-slate-400">
                  {jnxUser?.created_at
                    ? new Date(jnxUser.created_at).toLocaleDateString()
                    : 'Unknown'}
                </span>
              </div>
            </FeatureCard>
          </div>

          {/* Admin Access */}
          {jnxUser?.role === 'admin' && (
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Admin Access
              </h3>
              <p className="text-slate-400 mb-4">
                You have administrator privileges. Access the admin dashboard to
                manage users, organizations, and system health.
              </p>
              <Link href="/admin">
                <ButtonPrimary glow>Go to Admin Dashboard</ButtonPrimary>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
