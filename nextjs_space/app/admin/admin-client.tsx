'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import type { User } from '@clerk/nextjs/server';
import type { JNXUser } from '@/lib/db/helpers';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  LayoutDashboard,
  Users,
  Building2,
  Activity,
  FileText,
  LogOut,
  Zap,
  Database,
  Flag,
  Shield,
} from 'lucide-react';

interface AdminDashboardClientProps {
  user: User;
  jnxUser: JNXUser;
}

interface SystemHealth {
  supabase: {
    status: string;
    message: string;
  };
  clerk: {
    status: string;
    message: string;
  };
  currentUser: {
    email: string;
    role: string;
    org_id: string | null;
  } | null;
  activeSessions: number;
  recentAuditLogs: Array<{
    log_id: string;
    action: string;
    created_at: string;
    target: string | null;
  }>;
}

export default function AdminDashboardClient({ user, jnxUser }: AdminDashboardClientProps) {
  const [activePage, setActivePage] = useState('dashboard');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { signOut } = useClerk();

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/system/health');
      const data = await response.json();
      setSystemHealth(data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'system-health', label: 'System Health', icon: Activity },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
    { id: 'feature-flags', label: 'Feature Flags', icon: Flag },
  ];

  return (
    <div className="min-h-screen bg-jnx-dark flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/40 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-purple-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Admin
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                activePage === item.id
                  ? 'bg-purple-500/10 text-purple-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Info & Navigation */}
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/app"
            className="flex items-center space-x-2 px-4 py-2 mb-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all"
          >
            <Zap className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <span className="text-white font-semibold">
                {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-purple-400 truncate">Admin</p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">
              Manage users, monitor system health, and configure settings.
            </p>
          </div>

          {/* System Health Overview */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <>
              {/* Connection Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Clerk Status */}
                <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <Shield className="w-8 h-8 text-purple-500" />
                    <StatusBadge status="connected">
                      {systemHealth?.clerk?.status || 'Connected'}
                    </StatusBadge>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Clerk Auth</h3>
                  <p className="text-sm text-slate-400">
                    {systemHealth?.clerk?.message || 'Authentication service operational'}
                  </p>
                </div>

                {/* Supabase Status */}
                <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <Database className="w-8 h-8 text-cyan-500" />
                    <StatusBadge
                      status={
                        (systemHealth?.supabase?.status as
                          | 'connected'
                          | 'disconnected'
                          | 'degraded') || 'connected'
                      }
                    >
                      {systemHealth?.supabase?.status || 'Connected'}
                    </StatusBadge>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Supabase DB</h3>
                  <p className="text-sm text-slate-400">
                    {systemHealth?.supabase?.message || 'Database connection healthy'}
                  </p>
                </div>

                {/* Active Sessions */}
                <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-green-500" />
                    <span className="text-2xl font-bold text-white">
                      {systemHealth?.activeSessions || 0}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Active Users</h3>
                  <p className="text-sm text-slate-400">Currently active in the system</p>
                </div>
              </div>

              {/* Current User Info */}
              {systemHealth?.currentUser && (
                <div className="mb-8 p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                  <h2 className="text-xl font-semibold text-white mb-4">Current Session</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Email</p>
                      <p className="text-white font-mono text-sm">
                        {systemHealth.currentUser.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Role</p>
                      <p className="text-white">
                        {systemHealth.currentUser.role.charAt(0).toUpperCase() +
                          systemHealth.currentUser.role.slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Organization ID</p>
                      <p className="text-white font-mono text-sm">
                        {systemHealth.currentUser.org_id?.slice(0, 8) || 'N/A'}...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Audit Logs */}
              <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Recent Audit Logs</h2>
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>

                {systemHealth?.recentAuditLogs && systemHealth.recentAuditLogs.length > 0 ? (
                  <div className="space-y-2">
                    {systemHealth.recentAuditLogs.map((log) => (
                      <div
                        key={log.log_id}
                        className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800/40 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-white font-medium">{log.action}</p>
                          {log.target && (
                            <p className="text-xs text-slate-400 mt-1">Target: {log.target}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8">No recent audit logs</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
