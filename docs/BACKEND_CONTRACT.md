# Backend Contract - Development Rules

## 🚨 CRITICAL: Rules You Must Follow

This document defines **non-negotiable rules** for modifying the JNX-OS codebase. Violating these rules will destabilize the system.

---

## 🔒 PROTECTED FILES (DO NOT MODIFY)

These files are the **foundation** of the system. Changes here cascade everywhere:

### Authentication Layer
- `lib/auth/clerk-client.ts` - Client-side Clerk utilities
- `lib/auth/clerk-server.ts` - Server-side Clerk utilities
- `lib/auth/helpers.ts` - requireAuth, requireAdmin
- `lib/auth/rbac.ts` - Role definitions

### Database Layer
- `lib/db/helpers.ts` - All CRUD operations
- `lib/supabase/client.ts` - Supabase client setup
- `lib/supabase/server.ts` - Server-side Supabase

### Security Layer
- `lib/security/headers.ts` - Security headers config
- `lib/security/rate-limit.ts` - Rate limiting logic
- `lib/privacy/redaction.ts` - PII redaction

### Core Infrastructure
- `middleware.ts` - Clerk auth middleware
- `app/layout.tsx` - Root layout with ClerkProvider
- `app/api/webhooks/clerk/route.ts` - User/org sync

---

## ✅ HOW TO ADD NEW FEATURES

### Rule: **Extend, Don't Modify**

Instead of changing existing files, create new modules:

```
app/api/
  new-feature/         # ✅ NEW MODULE
    route.ts           # Your new API endpoint

lib/
  modules/
    new-feature/       # ✅ NEW MODULE
      service.ts       # Business logic
      types.ts         # TypeScript types
```

### Example: Adding a "Tasks" Feature

**❌ DON'T DO THIS:**
```typescript
// Modifying lib/db/helpers.ts
export async function createTask(...) { ... }  // DON'T add here!
```

**✅ DO THIS:**
```typescript
// Create lib/modules/tasks/service.ts
import { createSupabaseAdminClient } from '@/lib/supabase/client';

export async function createTask(...) {
  const supabase = createSupabaseAdminClient();
  // Task logic here
}
```

---

## 📋 CHECKLIST: Before Making Changes

### 1. Am I modifying a PROTECTED FILE?
- **YES** → STOP! Find another way.
- **NO** → Proceed with caution.

### 2. Can I extend instead of modify?
- **YES** → Create a new module.
- **NO** → Document why and get approval.

### 3. Does this affect auth/security?
- **YES** → Triple-check and test thoroughly.
- **NO** → Proceed.

### 4. Will this change the database schema?
- **YES** → Create a migration file.
- **NO** → Proceed.

### 5. Does this log PII?
- **YES** → Use PII redaction utilities.
- **NO** → Proceed.

---

## 🗃️ DATABASE CHANGES

### Rule: Migrations Only

**❌ DON'T DO THIS:**
```sql
-- Don't modify schema-v2.sql directly
ALTER TABLE users ADD COLUMN new_field TEXT;
```

**✅ DO THIS:**
```sql
-- Create lib/db/migrations/003_add_new_field.sql
ALTER TABLE users ADD COLUMN new_field TEXT;
```

### Process:
1. Create new migration file: `lib/db/migrations/00X_description.sql`
2. Document in `CHANGELOG.md`
3. Run migration in Supabase SQL Editor
4. Update types in `lib/db/helpers.ts` (only types, not functions)

---

## 🔐 SECURITY REQUIREMENTS

### 1. **Never Log PII**
```typescript
// ❌ DON'T
console.log(`User email: ${user.email}`);

// ✅ DO
import { logger } from '@/lib/observability/logger';
logger.info('User action', { userId: user.id }); // No PII
```

### 2. **Always Use Rate Limiting on Sensitive Endpoints**
```typescript
import { rateLimiters, getRateLimitIdentifier } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  const identifier = getRateLimitIdentifier(req.headers.get('x-real-ip'), null);
  const { limited } = rateLimiters.auth.check(identifier);

  if (limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Your logic here
}
```

### 3. **Require Authentication**
```typescript
import { requireAuth, requireAdmin } from '@/lib/auth/helpers';

// For user routes
export default async function UserPage() {
  const { user, jnxUser } = await requireAuth();
  // ...
}

// For admin routes
export default async function AdminPage() {
  const { user, jnxUser } = await requireAdmin();
  // ...
}
```

---

## 🧪 TESTING REQUIREMENTS

Before committing:
1. ✅ TypeScript compiles (`yarn tsc --noEmit`)
2. ✅ Build succeeds (`yarn build`)
3. ✅ Auth flow works (login, signup, logout)
4. ✅ RBAC works (admin vs member access)
5. ✅ No console errors in browser

---

## 🚫 FORBIDDEN ACTIONS

### Never Do These:
1. ❌ Remove Clerk auth guards from middleware
2. ❌ Expose Supabase service role key in client code
3. ❌ Disable rate limiting on auth endpoints
4. ❌ Log user emails or passwords
5. ❌ Hard-delete users without soft-delete first
6. ❌ Modify database schema without migration
7. ❌ Add new dependencies without justification
8. ❌ Skip RBAC checks on admin routes

---

## 📖 GOOD PRACTICES

### 1. **Use TypeScript Strictly**
```typescript
// ✅ DO
const user: JNXUser = await getUserById(id);

// ❌ DON'T
const user: any = await getUserById(id);
```

### 2. **Handle Errors Gracefully**
```typescript
// ✅ DO
try {
  const result = await someOperation();
  if (!result) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
  return NextResponse.json({ data: result });
} catch (error) {
  logger.error('Operation failed', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### 3. **Use Structured Logging**
```typescript
import { logger } from '@/lib/observability/logger';

logger.info('User signed up', { userId: user.id });
logger.error('Database connection failed', error);
```

---

## 🎯 SUMMARY

**Golden Rules:**
1. **Don't modify protected files**
2. **Extend via new modules**
3. **Use migrations for DB changes**
4. **Never log PII**
5. **Always require auth on protected routes**
6. **Rate limit sensitive endpoints**
7. **Test before committing**

**When in doubt, ask!**
