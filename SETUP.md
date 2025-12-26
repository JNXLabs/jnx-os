# JNX-OS Setup Guide

Complete step-by-step instructions for setting up JNX-OS v1 locally.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Database Schema](#database-schema)
4. [Environment Variables](#environment-variables)
5. [Google OAuth Setup (Optional)](#google-oauth-setup)
6. [Local Development](#local-development)
7. [Creating Admin Users](#creating-admin-users)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

- Node.js 18 or higher
- Yarn package manager
- A Supabase account (free tier works)
- (Optional) Google Cloud Console account for OAuth

## Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the details:
   - **Name:** jnx-os (or your preferred name)
   - **Database Password:** Create a strong password (save this!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is sufficient for development
4. Click "Create new project" and wait for it to initialize (~2 minutes)

### Step 2: Get Your API Credentials

1. In your Supabase project, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

### Step 3: Enable Authentication Providers

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider (enabled by default)
3. (Optional) Configure Google OAuth (see [Google OAuth Setup](#google-oauth-setup))

## Database Schema

### Step 1: Open SQL Editor

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"

### Step 2: Run Database Migration

Copy and paste the contents of `lib/db/schema.sql` into the SQL editor and run it:

```sql
-- JNX-OS v1 Database Schema
-- PostgreSQL / Supabase

-- Organizations table
CREATE TABLE IF NOT EXISTS orgs (
  org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id UUID UNIQUE NOT NULL,
  email TEXT NOT NULL,
  org_id UUID REFERENCES orgs(org_id),
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(org_id),
  actor_user_id UUID REFERENCES users(user_id),
  action TEXT NOT NULL,
  target TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System events table
CREATE TABLE IF NOT EXISTS system_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at DESC);
```

3. Click **Run** (or press Cmd/Ctrl + Enter)
4. You should see "Success. No rows returned"

### Step 3: Verify Tables

1. Go to **Table Editor** in Supabase
2. You should see: `orgs`, `users`, `audit_logs`, `system_events`

## Environment Variables

### Step 1: Create Environment File

In your project root (`/home/ubuntu/jnx-os/nextjs_space`):

```bash
cp .env.local.example .env.local
```

### Step 2: Fill in Your Credentials

Edit `.env.local` with your Supabase credentials:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Google OAuth (Optional - leave empty if not using)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=
```

## Google OAuth Setup (Optional)

If you want to enable "Sign in with Google":

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure OAuth consent screen if prompted
6. Choose **Web application**
7. Add authorized redirect URIs:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
8. Copy **Client ID** and **Client Secret**

### Step 2: Configure Supabase

1. In Supabase, go to **Authentication** > **Providers**
2. Find **Google** and click **Enable**
3. Paste your Google **Client ID** and **Client Secret**
4. Save

### Step 3: Add to Environment

Update your `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your-client-secret
```

## Local Development

### Step 1: Install Dependencies

```bash
cd /home/ubuntu/jnx-os/nextjs_space
yarn install
```

### Step 2: Start Development Server

```bash
yarn dev
```

### Step 3: Open Application

Go to [http://localhost:3000](http://localhost:3000)

You should see the JNX-OS landing page!

## Creating Admin Users

By default, all new users are created with the `member` role. To create an admin:

### Method 1: Via Supabase Dashboard

1. Sign up a new user through the app
2. Go to your Supabase project
3. Open **Table Editor** > **users**
4. Find the user by email
5. Edit the `role` field to `admin`
6. Save changes
7. User now has admin access to `/admin`

### Method 2: Via SQL

1. Go to **SQL Editor** in Supabase
2. Run this query:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## Testing

### Test Email/Password Authentication

1. Go to `/signup`
2. Create an account with email and password
3. You should be redirected to `/app`
4. Check Supabase **Table Editor** to see your user and org

### Test Google OAuth

1. Go to `/login`
2. Click "Sign in with Google"
3. Complete OAuth flow
4. You should be redirected to `/app`

### Test Admin Access

1. Make your user an admin (see [Creating Admin Users](#creating-admin-users))
2. Log out and log back in
3. Go to `/admin`
4. You should see the admin dashboard with system health

### Test System Health

1. Access `/admin` as an admin user
2. Check that "Supabase Connection" shows 🟢 Connected
3. Verify your user and org info is displayed
4. Check that audit logs show your recent activities

## Troubleshooting

### "Supabase not configured" error

- Check that all environment variables are set correctly
- Verify your `.env.local` file exists and has valid credentials
- Restart the dev server after changing `.env.local`

### Tables not found

- Ensure you ran the database schema SQL in Supabase
- Check **Table Editor** to verify tables exist
- Re-run the schema SQL if needed

### Google OAuth not working

- Verify redirect URIs are correctly configured in Google Cloud Console
- Ensure Google OAuth is enabled in Supabase
- Check that environment variables are set

### User not created on signup

- Check browser console for errors
- Verify Supabase service role key is correct
- Check Supabase logs in **Logs** > **Database**

### Cannot access /admin

- Verify your user has `role = 'admin'` in the database
- Clear browser cache and cookies
- Log out and log back in

### Build errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
yarn install

# Restart dev server
yarn dev
```

## Next Steps

Once everything is working:

1. ✅ Test all authentication flows
2. ✅ Create an admin user and test admin dashboard
3. ✅ Review the code to understand the architecture
4. ✅ Customize the design and content for your needs
5. ✅ Deploy to Vercel (see README.md)

## Support

If you encounter issues:

- Check Supabase logs in your project dashboard
- Review browser console for errors
- Verify environment variables are correct
- Contact: support@jnxlabs.ai

---

**Happy building with JNX-OS! ⚡**
