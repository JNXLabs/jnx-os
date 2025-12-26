# 🚀 JNX-OS Quick Start Guide

Your JNX-OS v1 Phase 1 Foundation MVP is **ready to use**!

## ⚡ What You Have

✅ **Complete Authentication System**
- Email/Password login and signup
- Google OAuth Sign-In (requires configuration)
- Session management with Supabase

✅ **Role-Based Access Control**
- Two roles: `admin` and `member`
- Admin dashboard with system health monitoring
- Protected routes with automatic redirects

✅ **Beautiful UI**
- JNX Dark Design System
- Responsive on all devices
- Smooth animations and transitions
- Custom scrollbar and gradients

✅ **System Monitoring**
- Real-time Supabase connection status
- Active sessions count
- Audit logs viewer
- User and organization management

## 🎯 Next Steps (5 Minutes)

### Step 1: Configure Supabase

You need to set up Supabase to enable authentication and database:

1. **Create a Supabase project** (free):
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name and password
   - Wait ~2 minutes for initialization

2. **Get your credentials**:
   - In Supabase, go to **Settings > API**
   - Copy these values:
     - Project URL
     - `anon` public key
     - `service_role` key

3. **Add to your app**:
   ```bash
   cd /home/ubuntu/jnx-os/nextjs_space
   # Edit .env.local and paste your credentials
   ```

4. **Run the database schema**:
   - In Supabase, go to **SQL Editor**
   - Copy contents of `lib/db/schema.sql`
   - Paste and run in SQL Editor

### Step 2: Test the App

```bash
# App is already running on localhost:3000
# Open in browser: http://localhost:3000
```

**Try these:**
1. Sign up with email/password at `/signup`
2. You'll be redirected to `/app` (user dashboard)
3. Check your user was created in Supabase Table Editor

### Step 3: Create an Admin User

To access the admin dashboard:

1. In Supabase, go to **Table Editor > users**
2. Find your user by email
3. Change `role` from `member` to `admin`
4. Log out and log back in
5. Visit `/admin` to see system health

## 📄 Pages You Can Visit

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | No |
| `/login` | Sign in | No |
| `/signup` | Create account | No |
| `/app` | User dashboard | Yes (any user) |
| `/admin` | Admin dashboard | Yes (admin only) |
| `/privacy` | Privacy policy | No |
| `/terms` | Terms of service | No |
| `/products` | Products showcase | No |

## 🔐 Authentication Flows

### Email/Password Signup
1. User enters email, password, name
2. Account created in Supabase Auth
3. Organization auto-created
4. User record created with role: `member`
5. Redirected to `/app`

### Google OAuth
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth
3. After approval, redirected to `/auth/callback`
4. If new user: org and user created
5. If existing: just logged in
6. Redirected to `/app`

## 🛠️ Configuration Options

### Enable Google OAuth (Optional)

See detailed instructions in [SETUP.md](./SETUP.md#google-oauth-setup).

Quick version:
1. Create OAuth credentials in Google Cloud Console
2. Add redirect URI: `https://[your-project].supabase.co/auth/v1/callback`
3. Enable Google provider in Supabase
4. Add credentials to `.env.local`

### Environment Variables

Required:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional (for Google OAuth):
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=xxx
```

## 🐛 Troubleshooting

### App shows "Supabase not configured"
→ Add your Supabase credentials to `.env.local` and restart dev server

### Can't access /admin
→ Update your user's role to `admin` in Supabase Table Editor

### Google OAuth not working
→ Check redirect URIs are correct in Google Cloud Console

### Database errors
→ Make sure you ran the schema.sql in Supabase SQL Editor

## 📚 Full Documentation

- **[README.md](./README.md)** - Complete project overview
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **Database Schema** - See `lib/db/schema.sql`

## 🎨 Design System

The app uses **JNX Dark** design system:
- Background: `#030712` (deep slate)
- Primary: `#06b6d4` (cyan)
- Fonts: Inter (body), JetBrains Mono (code)
- Components in `components/ui/`

## 🚀 Deploy to Production

When ready to deploy:

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables
4. Update `NEXT_PUBLIC_APP_URL` to production domain
5. Deploy!

**Important:** Update Google OAuth redirect URIs to include your production domain.

## ✨ What's Working

✅ Landing page with hero and features
✅ Authentication (email/password + Google OAuth ready)
✅ User dashboard with stats
✅ Admin dashboard with system health
✅ Route protection (middleware)
✅ Audit logging
✅ GDPR-compliant privacy policy
✅ Responsive design
✅ Custom scrollbar and animations

## 🔮 Next Phase Features (Roadmap)

Phase 2 will add:
- Stripe billing integration
- Subscription management
- Team/organization management
- Usage tracking

Phase 3 will add:
- QRYX product (AI Sales Assistant)
- Multi-product architecture
- Advanced analytics

---

**Questions?** Check [SETUP.md](./SETUP.md) or review the code!

**Built with ⚡ by JNX Labs**
