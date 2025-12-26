# Clerk Setup Guide

## Prerequisites

- Clerk account (sign up at [clerk.com](https://clerk.com))
- JNX-OS project set up locally

## Step 1: Create Clerk Application

1. Go to [clerk.com/dashboard](https://dashboard.clerk.com)
2. Click "Create Application"
3. Name: `JNX-OS` (or your preferred name)
4. Select authentication options:
   - ✅ Email & Password
   - ✅ Google OAuth
5. Click "Create Application"

## Step 2: Get API Keys

In your Clerk dashboard:

1. Go to **API Keys** section
2. Copy the following values:
   - **Publishable key** (starts with `pk_test_...` or `pk_live_...`)
   - **Secret key** (starts with `sk_test_...` or `sk_live_...`)

## Step 3: Configure Environment Variables

Update `/nextjs_space/.env`:

```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key
CLERK_SECRET_KEY=sk_test_your-secret-key

# Clerk URLs (already configured)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
```

## Step 4: Configure Google OAuth (Optional)

### In Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Application type: **Web application**
6. Name: `JNX-OS`
7. Add Authorized redirect URIs:
   - `https://your-clerk-domain.clerk.accounts.dev/v1/oauth_callback`
   - (Copy exact URL from Clerk dashboard)
8. Click **Create**
9. Copy **Client ID** and **Client Secret**

### In Clerk Dashboard

1. Go to **Configure** → **SSO Connections**
2. Click **Google**
3. Paste your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Click **Save**

## Step 5: Enable Organizations

1. In Clerk dashboard, go to **Configure** → **Organizations**
2. Toggle **Enable Organizations** to ON
3. Configure settings:
   - ✅ Allow users to create organizations
   - ✅ Allow users to delete organizations
   - Maximum organizations per user: `5` (or your preference)
4. Click **Save**

## Step 6: Configure Webhooks

Webhooks sync Clerk users/orgs to your Supabase database.

### Development (Local Testing)

1. Install Clerk CLI:
   ```bash
   npm install -g @clerk/clerk-cli
   ```

2. Start webhook forwarding:
   ```bash
   clerk listen --forward-url http://localhost:3000/api/webhooks/clerk
   ```

3. Copy the webhook secret from terminal output
4. Add to `.env`:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_your-webhook-secret
   ```

### Production (Deployed App)

1. In Clerk dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
4. Subscribe to events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
   - ✅ `organization.created`
   - ✅ `organization.updated`
   - ✅ `organizationMembership.created`
   - ✅ `organizationMembership.updated`
5. Click **Create**
6. Copy the **Signing Secret**
7. Add to production `.env`:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_your-webhook-secret
   ```

## Step 7: Set User Roles

### Method 1: Via Clerk Dashboard

1. Go to **Users**
2. Select a user
3. Go to **Public metadata** tab
4. Add:
   ```json
   {
     "role": "admin"
   }
   ```
5. Click **Save**

### Method 2: Via API (Automated)

```typescript
import { clerkClient } from '@clerk/nextjs';

await clerkClient.users.updateUser('user_id', {
  publicMetadata: {
    role: 'admin',
  },
});
```

## Step 8: Test Authentication

1. Start your app:
   ```bash
   cd /home/ubuntu/jnx-os/nextjs_space
   yarn dev
   ```

2. Visit: http://localhost:3000

3. Test flows:
   - ✅ Sign up with email/password
   - ✅ Sign in with email/password
   - ✅ Sign in with Google (if configured)
   - ✅ Access `/app` (should work)
   - ✅ Access `/admin` (should redirect if not admin)

4. Check Supabase:
   - Open Supabase SQL Editor
   - Run: `SELECT * FROM users;`
   - Verify user was synced from Clerk

## Step 9: Verify Webhooks

1. Sign up a new user
2. Check webhook logs in Clerk dashboard
3. Verify user appears in Supabase `users` table
4. Check `audit_logs` table for signup event

## Troubleshooting

### Users not syncing to Supabase
- Check webhook endpoint is accessible
- Verify `CLERK_WEBHOOK_SECRET` is correct
- Check logs: `vercel logs` or local console

### Google OAuth not working
- Verify redirect URIs match exactly
- Check Google OAuth is enabled in Clerk
- Ensure credentials are correct

### Admin access not working
- Check `publicMetadata.role` is set to `"admin"`
- Verify middleware is checking role correctly
- Check Clerk session has fresh metadata (re-login if needed)

### Webhook signature verification fails
- Ensure `CLERK_WEBHOOK_SECRET` is correct
- Check you're using the correct secret (dev vs prod)
- Verify webhook URL is publicly accessible

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Organizations](https://clerk.com/docs/organizations/overview)
- [Clerk Webhooks](https://clerk.com/docs/integration/webhooks)

## Security Best Practices

1. ✅ Never commit Clerk secret keys to Git
2. ✅ Use separate Clerk apps for dev/staging/prod
3. ✅ Rotate keys periodically
4. ✅ Monitor webhook failures
5. ✅ Enable 2FA for Clerk dashboard access
6. ✅ Restrict API key permissions when possible

## Next Steps

After Clerk is set up:
- Configure Supabase (see `SETUP.md`)
- Review architecture (see `ARCHITECTURE.md`)
- Understand backend rules (see `BACKEND_CONTRACT.md`)
