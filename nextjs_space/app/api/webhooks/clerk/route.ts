/**
 * Clerk Webhook Handler
 * Syncs user and organization data from Clerk to Supabase
 */

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  upsertUser,
  upsertOrg,
  createUserWithOrg,
  getUserByClerkId,
  getOrgByClerkId,
  updateUser,
  updateOrg,
  deleteUser,
  logAudit,
  logSystemEvent,
} from '@/lib/db/helpers';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt);
        break;
      case 'user.updated':
        await handleUserUpdated(evt);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt);
        break;
      case 'organization.created':
        await handleOrganizationCreated(evt);
        break;
      case 'organization.updated':
        await handleOrganizationUpdated(evt);
        break;
      case 'organizationMembership.created':
        await handleOrganizationMembershipCreated(evt);
        break;
      case 'organizationMembership.updated':
        await handleOrganizationMembershipUpdated(evt);
        break;
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    await logSystemEvent(
      'webhook.processed',
      'info',
      `Processed Clerk webhook: ${eventType}`,
      { event_type: eventType }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error handling ${eventType}:`, error);
    await logSystemEvent(
      'webhook.error',
      'error',
      `Error processing Clerk webhook: ${eventType}`,
      { event_type: eventType, error: String(error) }
    );
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// ===== WEBHOOK HANDLERS (ENTERPRISE-GRADE) =====

/**
 * ENTERPRISE: Handle User Created Event (Idempotent)
 * Creates or updates user with organization atomically
 */
async function handleUserCreated(evt: WebhookEvent) {
  if (evt.type !== 'user.created') return;

  const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
  const primaryEmail = email_addresses[0]?.email_address;

  if (!primaryEmail) {
    console.error('[Webhook] No email address found for user');
    throw new Error('No email address in user.created event');
  }

  try {
    // IDEMPOTENT: Check if user already exists
    const existingUser = await getUserByClerkId(id);
    if (existingUser) {
      console.log('[Webhook] User already exists, updating...');
      
      // Update existing user
      const role = (public_metadata?.role as string) || existingUser.role;
      await upsertUser(id, {
        email: primaryEmail,
        first_name: first_name || existingUser.first_name,
        last_name: last_name || existingUser.last_name,
        org_id: existingUser.org_id,
        role,
      });

      await logSystemEvent(
        'webhook.user_updated',
        'info',
        'User updated via user.created webhook',
        { clerk_user_id: id }
      );
      return;
    }

    // TRANSACTIONAL: Create user with organization atomically
    const orgName = `${first_name || 'User'}'s Organization`;
    const role = (public_metadata?.role as string) || 'member';
    
    const result = await createUserWithOrg(
      id,
      primaryEmail,
      first_name || null,
      last_name || null,
      orgName
    );

    if (!result) {
      throw new Error('Failed to create user with organization');
    }

    // Update role if admin
    if (role === 'admin') {
      await updateUser(result.user.user_id, { role });
    }

    // Audit log
    await logAudit('user.signup', result.org.org_id, result.user.user_id, 'user', {
      clerk_user_id: id,
      email: primaryEmail,
    });

    console.log('[Webhook] User created successfully:', id);
  } catch (error) {
    console.error('[Webhook] Error in handleUserCreated:', error);
    throw error; // Re-throw to trigger retry
  }
}

/**
 * ENTERPRISE: Handle User Updated Event (Idempotent)
 * Updates user or creates if not exists
 */
async function handleUserUpdated(evt: WebhookEvent) {
  if (evt.type !== 'user.updated') return;

  const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
  const primaryEmail = email_addresses[0]?.email_address;

  if (!primaryEmail) {
    console.error('[Webhook] No email address in user.updated event');
    return;
  }

  try {
    // IDEMPOTENT: Get or create user
    let user = await getUserByClerkId(id);
    
    if (!user) {
      console.log('[Webhook] User not found, creating via user.updated...');
      await handleUserCreated({ ...evt, type: 'user.created' });
      return;
    }

    // UPSERT: Update user (idempotent)
    const role = (public_metadata?.role as string) || user.role;
    await upsertUser(id, {
      email: primaryEmail,
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      org_id: user.org_id,
      role,
    });

    await logAudit('user.updated', user.org_id, user.user_id, 'user', {
      clerk_user_id: id,
    });

    console.log('[Webhook] User updated successfully:', id);
  } catch (error) {
    console.error('[Webhook] Error in handleUserUpdated:', error);
    throw error;
  }
}

async function handleUserDeleted(evt: WebhookEvent) {
  if (evt.type !== 'user.deleted') return;

  const { id } = evt.data;

  if (!id) {
    console.error('No user ID in user.deleted event');
    return;
  }

  const user = await getUserByClerkId(id);
  if (!user) {
    console.log('User not found in database');
    return;
  }

  // Soft delete the user
  await deleteUser(user.user_id, true);

  await logAudit('user.deleted', user.org_id, null, 'user', {
    clerk_user_id: id,
    user_id: user.user_id,
  });
}

/**
 * ENTERPRISE: Handle Organization Created Event (Idempotent)
 * Creates or updates organization
 */
async function handleOrganizationCreated(evt: WebhookEvent) {
  if (evt.type !== 'organization.created') return;

  const { id, name } = evt.data;

  try {
    // UPSERT: Create or update organization (idempotent)
    const org = await upsertOrg(name, id);

    if (!org) {
      throw new Error('Failed to upsert organization');
    }

    // Check if this is actually new
    const isNew = !await getOrgByClerkId(id);

    await logAudit(
      isNew ? 'organization.created' : 'organization.updated',
      org.org_id,
      null,
      'organization',
      {
        clerk_org_id: id,
        name,
      }
    );

    console.log('[Webhook] Organization processed successfully:', id);
  } catch (error) {
    console.error('[Webhook] Error in handleOrganizationCreated:', error);
    throw error;
  }
}

/**
 * ENTERPRISE: Handle Organization Updated Event (Idempotent)
 * Updates organization or creates if not exists
 */
async function handleOrganizationUpdated(evt: WebhookEvent) {
  if (evt.type !== 'organization.updated') return;

  const { id, name } = evt.data;

  try {
    // UPSERT: Update or create organization (idempotent)
    const org = await upsertOrg(name, id);

    if (!org) {
      throw new Error('Failed to upsert organization');
    }

    await logAudit('organization.updated', org.org_id, null, 'organization', {
      clerk_org_id: id,
      name,
    });

    console.log('[Webhook] Organization updated successfully:', id);
  } catch (error) {
    console.error('[Webhook] Error in handleOrganizationUpdated:', error);
    throw error;
  }
}

async function handleOrganizationMembershipCreated(evt: WebhookEvent) {
  if (evt.type !== 'organizationMembership.created') return;

  const { organization, public_user_data } = evt.data;
  const clerkUserId = public_user_data?.user_id;
  const clerkOrgId = organization.id;

  if (!clerkUserId) {
    console.error('No user ID in organization membership event');
    return;
  }

  const user = await getUserByClerkId(clerkUserId);
  const org = await getOrgByClerkId(clerkOrgId);

  if (user && org) {
    // Update user's org_id
    await updateUser(user.user_id, { org_id: org.org_id });

    await logAudit('organization.member_added', org.org_id, user.user_id, 'organization_membership', {
      clerk_user_id: clerkUserId,
      clerk_org_id: clerkOrgId,
    });
  }
}

async function handleOrganizationMembershipUpdated(evt: WebhookEvent) {
  if (evt.type !== 'organizationMembership.updated') return;

  const { organization, public_user_data, role } = evt.data;
  const clerkUserId = public_user_data?.user_id;
  const clerkOrgId = organization.id;

  if (!clerkUserId) {
    console.error('No user ID in organization membership event');
    return;
  }

  const user = await getUserByClerkId(clerkUserId);
  const org = await getOrgByClerkId(clerkOrgId);

  if (user && org) {
    // Update user's role based on org membership
    const newRole = role === 'admin' ? 'admin' : 'member';
    await updateUser(user.user_id, { role: newRole });

    await logAudit('organization.member_updated', org.org_id, user.user_id, 'organization_membership', {
      clerk_user_id: clerkUserId,
      clerk_org_id: clerkOrgId,
      role: newRole,
    });
  }
}
