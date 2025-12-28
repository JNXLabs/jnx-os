/**
 * JNX-OS Settings Page
 * 
 * User profile and organization management.
 * GDPR-compliant with data export/deletion options.
 */

import { SettingsClient } from './settings-client'
import { requireAuth } from '@/lib/auth/helpers'
import { currentUser } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  // Require authentication
  const { user, jnxUser } = await requireAuth()
  const fullClerkUser = await currentUser()

  // Convert Clerk user to plain object for client component
  const plainUser = {
    id: fullClerkUser?.id || user?.id || '',
    email: fullClerkUser?.emailAddresses?.[0]?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '',
    firstName: fullClerkUser?.firstName || user?.firstName || '',
    lastName: fullClerkUser?.lastName || user?.lastName || '',
    imageUrl: fullClerkUser?.imageUrl || user?.imageUrl || '',
  }

  return <SettingsClient user={plainUser} jnxUser={jnxUser!} />
}
