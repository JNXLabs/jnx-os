# JNX-OS v2 - The Neural Engine For SaaS Logic

**A production-ready, GDPR-compliant SaaS foundation with Clerk authentication, multi-tenant architecture, and comprehensive security features.**

---

## 🎯 What is JNX-OS?

JNX-OS is a **scalable, secure, and compliant** foundation for building modern SaaS products. It provides:

- ✅ **Enterprise Authentication** - Clerk with Organizations + RBAC
- ✅ **Multi-Tenant Architecture** - Isolated data per organization
- ✅ **GDPR Compliance** - Data export, deletion, audit trails
- ✅ **Security by Default** - Rate limiting, security headers, PII redaction
- ✅ **Production Ready** - TypeScript strict mode, error handling, logging

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Yarn 4+
- Clerk account ([clerk.com](https://clerk.com))
- Supabase account ([supabase.com](https://supabase.com))

### 1. Install Dependencies

```bash
cd /home/ubuntu/jnx-os/nextjs_space
yarn install
```

### 2. Configure Clerk

See [docs/CLERK_SETUP.md](docs/CLERK_SETUP.md) for detailed instructions.

**Quick setup:**
1. Create Clerk application
2. Copy API keys to `.env`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### 3. Configure Supabase

1. Create Supabase project
2. Run database schema:

```bash
# Copy the SQL from lib/db/schema-v2.sql
# Paste into Supabase SQL Editor
# Execute
```

3. Add credentials to `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Start Development Server

```bash
yarn dev
```

Visit: http://localhost:3000

---

## 📦 What's Included

### Authentication & Authorization
- **Clerk Integration** - Email/Password + Google OAuth
- **Organizations** - Multi-tenant support
- **RBAC** - Admin and Member roles
- **Webhooks** - Clerk → Supabase sync

### Database & Data Management
- **Supabase PostgreSQL** - Scalable database
- **Type-Safe Queries** - TypeScript interfaces
- **Audit Logging** - Track all actions
- **Migrations** - Version-controlled schema

### Security Features
- **Rate Limiting** - Prevent abuse
- **Security Headers** - CSP, HSTS, XSS protection
- **PII Redaction** - Safe logging
- **Input Validation** - Zod schemas

### GDPR Compliance
- **Data Export** - User data portability
- **Data Deletion** - Soft/hard delete
- **Privacy Policy** - Template included
- **Audit Trail** - Compliance logging

### UI/UX
- **JNX Dark Design** - Custom design system
- **Responsive** - Mobile-friendly
- **Landing Page** - Marketing site
- **Dashboards** - User + Admin interfaces

---

## 🏗️ Architecture

```
User → Middleware (Auth) → API Routes → Services → Database
                ↓
        Clerk (Auth) + Supabase (Data)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

---

## 📂 Project Structure

```
/home/ubuntu/jnx-os/
├── nextjs_space/              # Next.js application
│   ├── app/                   # Pages & API routes
│   │   ├── (public)/          # Landing, products, etc.
│   │   ├── login/             # Clerk SignIn
│   │   ├── signup/            # Clerk SignUp
│   │   ├── app/               # User Dashboard
│   │   ├── admin/             # Admin Dashboard
│   │   └── api/               # API endpoints
│   ├── components/            # React components
│   ├── lib/                   # Core libraries
│   │   ├── auth/              # Clerk utilities
│   │   ├── db/                # Database helpers
│   │   ├── privacy/           # GDPR features
│   │   ├── security/          # Security middleware
│   │   └── observability/     # Logging
│   └── middleware.ts          # Auth middleware
└── docs/                      # Documentation
    ├── ARCHITECTURE.md        # System design
    ├── BACKEND_CONTRACT.md    # Development rules
    ├── CLERK_SETUP.md         # Auth setup
    └── GDPR_COMPLIANCE.md     # Privacy features
```

---

## 🔐 Security Features

### Implemented

- ✅ Clerk authentication (OAuth2)
- ✅ HTTPS only (enforced)
- ✅ Rate limiting (in-memory)
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ PII redaction in logs
- ✅ RBAC (admin/member)
- ✅ Audit logging
- ✅ Input validation (Zod)

### Best Practices

- Secret keys in environment variables
- No PII in logs
- TypeScript strict mode
- Error boundaries
- Graceful degradation

---

## 📊 Database Schema

### Core Tables

- `orgs` - Organizations (tenants)
- `users` - User accounts
- `audit_logs` - Action tracking
- `system_events` - System logs

### GDPR Tables

- `data_export_requests` - Export tracking
- `billing_customers` - Payment data
- `entitlements` - Feature access
- `feature_flags` - Toggles

See [lib/db/schema-v2.sql](nextjs_space/lib/db/schema-v2.sql) for full schema.

---

## 🧪 Testing

### Run Type Checks

```bash
yarn tsc --noEmit
```

### Build for Production

```bash
yarn build
```

### Test Auth Flows

1. ✅ Sign up with email
2. ✅ Sign in with email
3. ✅ Sign in with Google
4. ✅ Access `/app` (user dashboard)
5. ✅ Access `/admin` (admin dashboard)
6. ✅ Logout

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and data flow |
| [BACKEND_CONTRACT.md](docs/BACKEND_CONTRACT.md) | Development rules (READ FIRST!) |
| [CLERK_SETUP.md](docs/CLERK_SETUP.md) | Clerk authentication setup |
| [GDPR_COMPLIANCE.md](docs/GDPR_COMPLIANCE.md) | Privacy features and compliance |

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | TailwindCSS, JNX Dark Design |
| **Auth** | Clerk (OAuth2, Organizations) |
| **Database** | Supabase (PostgreSQL) |
| **Validation** | Zod |
| **Logging** | Custom structured logger |
| **Deployment** | Vercel |

---

## 🎨 Design System

**JNX Dark** - A custom dark-themed design system with:

- **Colors**: Slate + Cyan primary
- **Typography**: Inter (sans), JetBrains Mono (mono)
- **Components**: Buttons, Cards, Inputs, Status Badges
- **Animations**: Subtle hover effects, gradients

See [app/globals.css](nextjs_space/app/globals.css) and [tailwind.config.ts](nextjs_space/tailwind.config.ts).

---

## 🤝 Contributing

### Before Making Changes

1. Read [BACKEND_CONTRACT.md](docs/BACKEND_CONTRACT.md)
2. Check if you're modifying protected files
3. Create new modules instead of modifying existing ones
4. Test thoroughly before committing

### Development Workflow

1. Create feature branch
2. Make changes (follow contract rules)
3. Test locally
4. Create pull request
5. Review and merge

---

## 📝 Roadmap

### Phase 3 (Future)

- [ ] Stripe billing integration
- [ ] Advanced analytics
- [ ] Multi-product support (QRYX subdomain)
- [ ] Feature flags UI
- [ ] User management UI
- [ ] Email notifications
- [ ] Webhook retry logic
- [ ] Redis rate limiting
- [ ] Sentry error tracking

---

## ⚠️ Important Notes

### For Developers

- **Never modify protected files** (see BACKEND_CONTRACT.md)
- **Always use migrations** for database changes
- **Never log PII** (emails, passwords, etc.)
- **Require auth** on all protected routes
- **Rate limit** sensitive endpoints

### For Administrators

- Set admin role via Clerk public metadata
- Monitor audit logs regularly
- Review system health in admin dashboard
- Respond to data requests within 30 days (GDPR)

---

## 📞 Support

- **Documentation**: See [docs/](docs/)
- **Issues**: GitHub Issues
- **Email**: support@yourcompany.com (update this!)

---

## 📄 License

[Your License Here]

---

## 🎉 What's Next?

1. ✅ Complete Clerk setup → [CLERK_SETUP.md](docs/CLERK_SETUP.md)
2. ✅ Run database migrations
3. ✅ Create your first admin user
4. ✅ Test all auth flows
5. ✅ Customize Privacy Policy
6. ✅ Deploy to production

**Your SaaS foundation is ready!** 🚀

---

**Built with ❤️ using Next.js, Clerk, and Supabase**
