# JNX-OS v2 Architecture

## Overview

JNX-OS is a multi-tenant SaaS foundation built with:
- **Authentication**: Clerk (Organizations + RBAC)
- **Database**: Supabase PostgreSQL
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend Layer                      │
│  (Next.js Pages, React Components, Clerk UI)             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Middleware Layer                       │
│  (Auth, Rate Limiting, Security Headers, RBAC)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                     API Layer                            │
│  (Next.js API Routes, Webhooks, Health Checks)           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Service Layer                          │
│  (Business Logic, Privacy, Security, Observability)      │
└──────────┬─────────────────────────────┬────────────────┘
           │                             │
┌──────────▼──────────┐       ┌─────────▼──────────┐
│   Clerk Auth API    │       │  Supabase Database  │
│  (Users, Orgs,      │       │  (Data Persistence) │
│   RBAC, Sessions)   │       │                     │
└─────────────────────┘       └─────────────────────┘
```

## Key Principles

### 1. **Separation of Concerns**
- UI components never call database directly
- All database access goes through helper functions
- Business logic isolated in service layer

### 2. **Security by Default**
- All routes protected by Clerk middleware
- Rate limiting on sensitive endpoints
- Security headers on all responses
- PII redaction in logs

### 3. **GDPR Compliance**
- Data minimization
- Right to access (export)
- Right to erasure (deletion)
- Audit trail for all actions

### 4. **Multi-Tenant Model**
- Clerk Organizations = Tenant Boundary
- Users belong to Organizations
- Data isolated by org_id

## Directory Structure

```
nextjs_space/
├── app/                        # Next.js pages
│   ├── (public pages)          # Landing, products, privacy, terms
│   ├── login/                  # Clerk SignIn
│   ├── signup/                 # Clerk SignUp
│   ├── app/                    # User Dashboard
│   ├── admin/                  # Admin Dashboard
│   └── api/                    # API routes
│       ├── webhooks/clerk/     # Clerk webhook handler
│       └── system/health/      # Health check endpoint
├── components/                 # UI components
│   └── ui/                     # JNX Dark design system
├── lib/                        # Core libraries
│   ├── auth/                   # Clerk auth utilities
│   │   ├── clerk-client.ts     # Client-side hooks
│   │   ├── clerk-server.ts     # Server-side utilities
│   │   ├── helpers.ts          # requireAuth, requireAdmin
│   │   └── rbac.ts             # Role definitions
│   ├── db/                     # Database layer
│   │   ├── schema-v2.sql       # Database schema
│   │   └── helpers.ts          # CRUD operations
│   ├── privacy/                # GDPR features
│   │   ├── redaction.ts        # PII redaction
│   │   ├── export.ts           # Data export
│   │   └── deletion.ts         # Data deletion
│   ├── security/               # Security utilities
│   │   ├── rate-limit.ts       # Rate limiting
│   │   └── headers.ts          # Security headers
│   ├── observability/          # Logging & monitoring
│   │   └── logger.ts           # Structured logger
│   └── supabase/               # Supabase clients
└── middleware.ts               # Clerk auth middleware
```

## Data Flow

### Authentication Flow

1. User visits protected route (`/app` or `/admin`)
2. Middleware checks Clerk authentication
3. If not authenticated → redirect to `/login`
4. If admin route → check role in metadata
5. If not admin → redirect to `/app`

### User Creation Flow

1. User signs up via Clerk
2. Clerk sends webhook to `/api/webhooks/clerk`
3. Webhook handler creates user in Supabase
4. User can now access dashboard

### Data Export Flow (GDPR)

1. User requests data export
2. System gathers all user data
3. Redacts sensitive information
4. Returns JSON export

## Security Model

### Authentication
- **Provider**: Clerk
- **Methods**: Email/Password, Google OAuth
- **Session**: JWT tokens managed by Clerk

### Authorization
- **Model**: RBAC (Role-Based Access Control)
- **Roles**: admin, member
- **Enforcement**: Middleware + API guards

### Data Protection
- **At Rest**: Supabase encryption
- **In Transit**: HTTPS only
- **Logging**: PII redaction

## Scalability Considerations

### Current Implementation
- Single Next.js app (hub)
- In-memory rate limiting
- Direct Supabase connection

### Future Enhancements
- **Multi-Product**: Separate apps in monorepo
- **Caching**: Redis for sessions and rate limits
- **CDN**: Static asset distribution
- **Database**: Read replicas for scaling

## Monitoring & Observability

### Available Now
- System health endpoint (`/api/system/health`)
- Structured logging with PII redaction
- Audit logs in database

### Future Enhancements
- Error tracking (Sentry integration)
- Performance monitoring (Vercel Analytics)
- Custom metrics dashboard

## Compliance

### GDPR Features
✅ Data minimization
✅ Right to access (export)
✅ Right to erasure (deletion)
✅ Audit logging
✅ Privacy policy
✅ Terms of service

### Security Features
✅ HTTPS only
✅ Security headers (CSP, HSTS, etc.)
✅ Rate limiting
✅ PII redaction in logs
✅ Input validation
✅ RBAC

## Next Steps

See:
- `BACKEND_CONTRACT.md` - Rules for modifying code
- `ADD_FEATURE.md` - How to add new features
- `ADD_PRODUCT.md` - How to add new products
- `CLERK_SETUP.md` - Setting up Clerk
- `GDPR_COMPLIANCE.md` - GDPR implementation details
