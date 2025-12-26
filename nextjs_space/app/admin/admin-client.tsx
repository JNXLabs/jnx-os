'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { JNXUser } from '@/lib/db/helpers';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Users,
  Building,
  Activity,
  FileText,
  LogOut,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { FeatureCard } from '@/components/ui/feature-card';

interface AdminDashboardClientProps {
  user: User;
  jnxUser: JNXUser;
}

interface SystemHealth {
  connection: {
    status: 'connected' | 'disconnected' | 'degraded';
    message: string;
  };
  currentUser: any;
  currentOrg: any;
  activeSessions: number;
  recentAuditLogs: any[];
}

export function AdminDashboardClient({
  user,
  jnxUser,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/system/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setHealthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return null;
    }
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
          <p className="text-xs text-cyan-400 mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>Users</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <Building className="w-5 h-5" />
            <span>Organizations</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <Activity className="w-5 h-5" />
            <span>System Health</span>
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>Audit Logs</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800/60">
          <div className="mb-4 p-4 bg-slate-800/30 rounded-lg">
            <p className="text-sm text-slate-400 mb-1">Signed in as</p>
            <p className="text-sm text-white font-medium truncate">
              {user.email}
            </p>
            <p className="text-xs text-cyan-400 mt-1">Administrator</p>
          </div>
          <Link
            href="/app"
            className="block w-full mb-2 px-4 py-3 rounded-lg text-center text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            User Dashboard
          </Link>
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
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              System Administration
            </h1>
            <p className="text-slate-400">
              Monitor and manage JNX-OS infrastructure.
            </p>
          </div>

          {/* System Health Widget */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              System Health
            </h2>
            {healthLoading ? (
              <div className="text-slate-400">Loading system health...</div>
            ) : health ? (
              <div className="space-y-6">
                {/* Connection Status */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Supabase Connection
                    </h3>
                    <StatusBadge status={health.connection.status}>
                      {getStatusIcon(health.connection.status)}
                      {health.connection.status.toUpperCase()}
                    </StatusBadge>
                  </div>
                  <p className="text-sm text-slate-400">
                    {health.connection.message}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  <FeatureCard
                    icon={<Users className="w-8 h-8" />}
                    title="Current User"
                    description={
                      health.currentUser?.email ?? 'Not available'
                    }
                  >
                    {health.currentUser && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-500">
                          Role: {health.currentUser.role}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: {health.currentUser.user_id?.substring(0, 8)}...
                        </p>
                      </div>
                    )}
                  </FeatureCard>

                  <FeatureCard
                    icon={<Building className="w-8 h-8" />}
                    title="Current Organization"
                    description={health.currentOrg?.name ?? 'Not available'}
                  >
                    {health.currentOrg && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-500">
                          ID: {health.currentOrg.org_id?.substring(0, 8)}...
                        </p>
                      </div>
                    )}
                  </FeatureCard>

                  <FeatureCard
                    icon={<Activity className="w-8 h-8" />}
                    title="Active Users"
                    description="Total registered users"
                  >
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-cyan-400">
                        {health.activeSessions}
                      </span>
                    </div>
                  </FeatureCard>
                </div>

                {/* Recent Audit Logs */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Recent Audit Logs
                  </h3>
                  {health.recentAuditLogs.length > 0 ? (
                    <div className="space-y-3">
                      {health.recentAuditLogs.map((log) => (
                        <div
                          key={log.log_id}
                          className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                        >
                          <div>
                            <p className="text-sm text-white font-medium">
                              {log.action}
                            </p>
                            <p className="text-xs text-slate-400">
                              {log.target}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">
                      No audit logs available
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-red-400">Failed to load system health</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
