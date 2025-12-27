'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import type { JNXUser } from '@/lib/db/helpers';
import {
  LayoutDashboard,
  Package,
  Settings,
  CreditCard,
  LogOut,
  Zap,
  Users,
  ShieldCheck,
} from 'lucide-react';

// Plain user object type for client components
interface PlainUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
}

interface DashboardClientProps {
  user: PlainUser;
  jnxUser: JNXUser;
}

export default function DashboardClient({ user, jnxUser }: DashboardClientProps) {
  const [activePage, setActivePage] = useState('home');
  const router = useRouter();
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const menuItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-jnx-dark flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/40 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-cyan-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              JNX-OS
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
                  ? 'bg-cyan-500/10 text-cyan-500'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Info & Sign Out */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-semibold">
                {user.firstName?.[0] || user.email[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user.email}
              </p>
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
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user.firstName || 'User'}!
            </h1>
            <p className="text-slate-400">
              Your JNX-OS dashboard is ready. Manage your products and settings here.
            </p>
          </div>

          {/* Admin Access Banner */}
          {jnxUser.role === 'admin' && (
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-start space-x-4">
                <ShieldCheck className="w-6 h-6 text-purple-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Admin Access Enabled
                  </h3>
                  <p className="text-purple-200/80 mb-3">
                    You have administrator privileges. Access the admin dashboard to manage users,
                    view system health, and configure settings.
                  </p>
                  <Link
                    href="/admin"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>Go to Admin Dashboard</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-8 h-8 text-cyan-500" />
                <span className="text-sm text-slate-500">Products</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">0</p>
              <p className="text-sm text-slate-400">Active products</p>
            </div>

            <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-cyan-500" />
                <span className="text-sm text-slate-500">Team</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">1</p>
              <p className="text-sm text-slate-400">Team members</p>
            </div>

            <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <CreditCard className="w-8 h-8 text-cyan-500" />
                <span className="text-sm text-slate-500">Billing</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">Free</p>
              <p className="text-sm text-slate-400">Current plan</p>
            </div>
          </div>

          {/* User Details Card */}
          <div className="p-6 bg-slate-900/40 border border-slate-800/60 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Account Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Email</span>
                <span className="text-white">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Role</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  jnxUser.role === 'admin'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                }`}>
                  {jnxUser.role.charAt(0).toUpperCase() + jnxUser.role.slice(1)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">User ID</span>
                <span className="text-white font-mono text-sm">{jnxUser.user_id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Joined</span>
                <span className="text-white">
                  {new Date(jnxUser.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
