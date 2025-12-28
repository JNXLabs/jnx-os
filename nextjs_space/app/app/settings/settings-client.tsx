/**
 * Settings Client Component
 * 
 * Handles user/org profile updates and GDPR actions.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Shield, 
  Download, 
  Trash2, 
  AlertTriangle,
  Check,
  Settings as SettingsIcon,
  Mail,
  Calendar,
  Zap
} from 'lucide-react'
import { ButtonPrimary } from '@/components/ui/button-primary'
import { ButtonSecondary } from '@/components/ui/button-secondary'
import { StatusBadge } from '@/components/ui/status-badge'
import type { JNXUser } from '@/lib/db/helpers'

interface PlainUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
}

interface SettingsClientProps {
  user: PlainUser
  jnxUser: JNXUser
}

export function SettingsClient({ user, jnxUser }: SettingsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'privacy'>('profile')
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)

  // Handle data export (GDPR)
  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jnx-data-export-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle account deletion (GDPR)
  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/privacy/delete', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Deletion failed')
      }

      // Redirect to goodbye page
      router.push('/?deleted=true')
    } catch (error) {
      console.error('Deletion error:', error)
      alert('Failed to delete account. Please contact support.')
    }
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
                  <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Settings</h1>
                  <p className="text-slate-400 text-sm">Manage your account and preferences</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 backdrop-blur-sm sticky top-8">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'profile'
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium">Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('organization')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'organization'
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">Organization</span>
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === 'privacy'
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Privacy & Data</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-500" />
                    Personal Information
                  </h2>

                  <div className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt="Profile"
                          className="w-20 h-20 rounded-full border-2 border-cyan-500/20"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <User className="w-10 h-10 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : 'No name set'}
                        </h3>
                        <p className="text-slate-400 text-sm">{user.email}</p>
                        <StatusBadge status="online" className="mt-2">
                          Active
                        </StatusBadge>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </div>
                        <div className="text-white font-medium">{user.email}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>Member Since</span>
                        </div>
                        <div className="text-white font-medium">
                          {new Date(jnxUser.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                          <Shield className="w-4 h-4" />
                          <span>Role</span>
                        </div>
                        <div className="text-white font-medium capitalize">{jnxUser.role}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                          <Zap className="w-4 h-4" />
                          <span>User ID</span>
                        </div>
                        <div className="text-white font-mono text-xs">{jnxUser.user_id.slice(0, 8)}...</div>
                      </div>
                    </div>

                    {/* Managed by Clerk Notice */}
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                      <div className="flex gap-3">
                        <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-white font-semibold mb-1">Profile Managed by Clerk</h4>
                          <p className="text-slate-300 text-sm">
                            Your profile information is securely managed by Clerk. To update your name, email, or password,
                            please use the Clerk dashboard or contact your administrator.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organization Tab */}
            {activeTab === 'organization' && (
              <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-500" />
                    Organization Details
                  </h2>

                  <div className="space-y-6">
                    {/* Org Info */}
                    <div>
                      <div className="text-slate-400 text-sm mb-2">Organization Name</div>
                      <div className="text-white text-lg font-semibold">Your Organization</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Organization ID</div>
                        <div className="text-white font-mono text-sm">{jnxUser.org_id?.slice(0, 16) || 'N/A'}...</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm mb-2">Your Role</div>
                        <StatusBadge status={jnxUser.role === 'admin' ? 'connected' : 'online'}>
                          {jnxUser.role}
                        </StatusBadge>
                      </div>
                    </div>

                    {/* Members Notice */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex gap-3">
                        <Building2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-white font-semibold mb-1">Organization Management</h4>
                          <p className="text-slate-300 text-sm">
                            Organization settings and member management are handled through Clerk Organizations.
                            Contact your admin to manage members, roles, and permissions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                {/* Data Export */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-cyan-500" />
                    Export Your Data
                  </h2>
                  <p className="text-slate-300 mb-6">
                    Download all your personal data in JSON format. This includes your profile, activity logs, and any
                    content you've created. (GDPR Right to Data Portability)
                  </p>
                  <ButtonPrimary onClick={handleExportData} disabled={isExporting}>
                    {isExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download My Data
                      </>
                    )}
                  </ButtonPrimary>
                </div>

                {/* Delete Account */}
                <div className="bg-slate-900/40 border border-red-900/20 rounded-xl p-6 backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Delete Account
                  </h2>
                  <p className="text-slate-300 mb-6">
                    Permanently delete your account and all associated data. This action cannot be undone. (GDPR Right to Erasure)
                  </p>
                  
                  {!showDeleteWarning ? (
                    <ButtonSecondary onClick={() => setShowDeleteWarning(true)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete My Account
                    </ButtonSecondary>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                      <div className="flex gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <div>
                          <h4 className="text-red-400 font-semibold mb-1">Warning: This action is permanent</h4>
                          <p className="text-slate-300 text-sm">
                            All your data will be permanently deleted. This includes:
                          </p>
                          <ul className="list-disc list-inside text-slate-300 text-sm mt-2 space-y-1">
                            <li>Your profile and account information</li>
                            <li>All activity logs and analytics</li>
                            <li>Product configurations and settings</li>
                            <li>Access to all JNX products</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                        >
                          Yes, Delete Forever
                        </button>
                        <ButtonSecondary onClick={() => setShowDeleteWarning(false)}>
                          Cancel
                        </ButtonSecondary>
                      </div>
                    </div>
                  )}
                </div>

                {/* GDPR Info */}
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">GDPR Compliant</h4>
                      <p className="text-slate-300 text-sm">
                        JNX-OS is fully compliant with GDPR regulations. We respect your privacy and give you full
                        control over your data. Learn more in our{' '}
                        <Link href="/privacy" className="text-cyan-400 hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
