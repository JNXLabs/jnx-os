# JNX-OS v1 Phase 1 - Foundation MVP

**The Neural Engine For SaaS Logic**

JNX-OS is a self-healing, predictive computational core designed to scale modern digital infrastructure autonomously. This is Phase 1 of the complete JNX ecosystem.

## 🎯 Project Overview

JNX-OS v1 Phase 1 delivers:
- ✅ Complete authentication system (Email/Password + Google SSO)
- ✅ Role-based access control (RBAC) with admin and member roles
- ✅ User and admin dashboards
- ✅ System health monitoring
- ✅ Audit logging for all critical actions
- ✅ GDPR-compliant privacy-first architecture
- ✅ JNX Dark Design System
- ✅ Supabase integration (Auth + Database)

## 📦 Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript (strict mode)
- **Styling:** TailwindCSS with custom JNX Dark design system
- **Database:** PostgreSQL via Supabase
- **Authentication:** Supabase Auth (Email/Password + Google OAuth)
- **Validation:** Zod
- **Deployment:** Vercel-ready

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and Yarn
- Supabase account ([supabase.com](https://supabase.com))
- (Optional) Google OAuth credentials for Google Sign-In

### 1. Clone and Install

```bash
cd /home/ubuntu/jnx-os/nextjs_space
yarn install
```

### 2. Configure Supabase

Follow the detailed setup guide in [SETUP.md](./SETUP.md) to:
1. Create a Supabase project
2. Run the database schema
3. Configure environment variables
4. (Optional) Set up Google OAuth

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 📋 Database Schema

The database includes:
- `orgs` - Organization management
- `users` - User accounts with role-based access
- `audit_logs` - Activity tracking
- `system_events` - System-wide events

See `lib/db/schema.sql` for the complete schema.

## 🎉 Features

### Pages

- **Landing Page** (`/`) - Hero section, features grid, products showcase
- **Login** (`/login`) - Email/Password + Google OAuth sign-in
- **Signup** (`/signup`) - User registration with auto org creation
- **User Dashboard** (`/app`) - Protected user interface
- **Admin Dashboard** (`/admin`) - System health monitoring, audit logs
- **Privacy Policy** (`/privacy`) - GDPR-compliant privacy information
- **Terms of Service** (`/terms`) - Legal terms and conditions
- **Products** (`/products`) - Product showcase (QRYX coming soon)

### Authentication

- ✅ Email/Password authentication
- ✅ Google OAuth Sign-In
- ✅ Session management with Supabase
- ✅ Automatic user and organization creation on signup
- ✅ Audit logging for all auth events

### Authorization

- ✅ Route protection via middleware
- ✅ Role-based access control (admin, member)
- ✅ Admin-only routes and features
- ✅ Automatic redirects based on auth state

### System Health

- ✅ Real-time Supabase connection status
- ✅ Active user count
- ✅ Current user and organization info
- ✅ Recent audit logs viewer

## 🎨 JNX Dark Design System

The application implements a custom design system with:

- **Colors:** Dark slate background (#030712) with cyan accents (#06b6d4)
- **Typography:** Inter for body text, JetBrains Mono for code
- **Components:** Custom buttons, inputs, cards with consistent styling
- **Animations:** Smooth transitions and hover effects
- **Custom scrollbar:** Styled to match the dark theme

## 🔒 Security

- HTTPS-only in production
- Secure cookie handling
- Role-based access control
- Audit logging for sensitive actions
- Data minimization principles
- GDPR compliance

## 📝 Testing Authentication

1. **Create an account:**
   - Go to `/signup`
   - Enter your email and password
   - An organization is automatically created
   - Default role: `member`

2. **Test Google OAuth:**
   - Click "Sign in with Google"
   - Complete OAuth flow
   - User and org are created automatically

3. **Access admin features:**
   - To test admin features, manually update a user's role in Supabase:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
   - Then navigate to `/admin`

## 🛠️ Development

### Project Structure

```
nextjs_space/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── app/               # User dashboard (protected)
│   ├── admin/             # Admin dashboard (admin only)
│   ├── privacy/           # Privacy policy
│   ├── terms/             # Terms of service
│   ├── products/          # Products showcase
│   └── api/               # API routes
├── components/            # React components
│   └── ui/                # UI components
├── lib/                   # Utilities and helpers
│   ├── auth/              # Auth helpers
│   ├── db/                # Database helpers
│   └── supabase/          # Supabase clients
├── middleware.ts          # Route protection
└── tailwind.config.ts     # JNX Dark design tokens
```

### Key Files

- `middleware.ts` - Route protection and auth checks
- `lib/supabase/client.ts` - Supabase browser client
- `lib/supabase/server.ts` - Supabase server client
- `lib/db/helpers.ts` - Database operations
- `lib/auth/helpers.ts` - Authentication utilities

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

**Important:** Update `NEXT_PUBLIC_APP_URL` to your production domain.

### Environment Variables for Production

Make sure to set these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (your production domain)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (optional)
- `NEXT_PUBLIC_GOOGLE_CLIENT_SECRET` (optional)

## 🔎 What's Next? (Phase 2+)

Phase 1 provides the foundation. Future phases will add:

- **Phase 2:**
  - Stripe billing integration
  - Subscription management
  - Usage tracking and limits
  - Team management features

- **Phase 3:**
  - QRYX product launch (AI Sales Assistant)
  - Multi-product subdomain architecture
  - Advanced analytics and reporting
  - Product-specific entitlements

## 👥 Support

For questions or issues:
- Check [SETUP.md](./SETUP.md) for detailed configuration guide
- Review the code comments for implementation details
- Contact: support@jnxlabs.ai

## 📜 License

Copyright © 2025 JNX Labs. All rights reserved.

---

**Built with ⚡ by the JNX Labs team**
