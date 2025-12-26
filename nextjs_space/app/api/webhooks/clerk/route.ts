/**
 * Clerk Webhook Handler
 * Syncs user and organization data from Clerk to Supabase
 */

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  createUser,
  createOrg,
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

// ===== WEBHOOK HANDLERS =====

async function handleUserCreated(evt: WebhookEvent) {
  if (evt.type !== 'user.created') return;

  const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
  const primaryEmail = email_addresses[0]?.email_address;

  if (!primaryEmail) {
    console.error('No email address found for user');
    return;
  }

  // Check if user already exists
  const existingUser = await getUserByClerkId(id);
  if (existingUser) {
    console.log('User already exists in database');
    return;
  }

  // Create default organization for the user
  const orgName = `${first_name || 'User'}'s Organization`;
  const org = await createOrg(orgName);

  if (!org) {
    console.error('Failed to create organization');
    return;
  }

  // Create user in database
  const role = (public_metadata?.role as string) || 'member';
  const user = await createUser(
    id,
    primaryEmail,
    first_name || null,
    last_name || null,
    org.org_id,
    role
  );

  if (user) {
    await logAudit('user.signup', org.org_id, user.user_id, 'user', {
      clerk_user_id: id,
      email: primaryEmail,
    });
  }
}

async function handleUserUpdated(evt: WebhookEvent) {
  if (evt.type !== 'user.updated') return;

  const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
  const primaryEmail = email_addresses[0]?.email_address;

  const user = await getUserByClerkId(id);
  if (!user) {
    console.log('User not found in database, creating...');
    await handleUserCreated({ ...evt, type: 'user.created' });
    return;
  }

  // Update user
  const role = (public_metadata?.role as string) || user.role;
  await updateUser(user.user_id, {
    email: primaryEmail || user.email,
    first_name: first_name || user.first_name,
    last_name: last_name || user.last_name,
    role,
  });

  await logAudit('user.updated', user.org_id, user.user_id, 'user', {
    clerk_user_id: id,
  });
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

async function handleOrganizationCreated(evt: WebhookEvent) {
  if (evt.type !== 'organization.created') return;

  const { id, name } = evt.data;

  // Check if org already exists
  const existingOrg = await getOrgByClerkId(id);
  if (existingOrg) {
    console.log('Organization already exists in database');
    return;
  }

  // Create organization
  const org = await createOrg(name, id);

  if (org) {
    await logAudit('organization.created', org.org_id, null, 'organization', {
      clerk_org_id: id,
      name,
    });
  }
}

async function handleOrganizationUpdated(evt: WebhookEvent) {
  if (evt.type !== 'organization.updated') return;

  const { id, name } = evt.data;

  const org = await getOrgByClerkId(id);
  if (!org) {
    console.log('Organization not found, creating...');
    await handleOrganizationCreated({ ...evt, type: 'organization.created' });
    return;
  }

  // Update organization
  await updateOrg(org.org_id, { name });

  await logAudit('organization.updated', org.org_id, null, 'organization', {
    clerk_org_id: id,
  });
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
