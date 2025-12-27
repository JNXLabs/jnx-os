# ⚡ JNX-OS Quick Reference

**Fast lookup for common operations and patterns.**

---

## 🔐 Authentication

### Server-Side (Page/API Route):
```typescript
import { requireAuth, requireAdmin } from '@/lib/auth/helpers';

// Require any authenticated user
const { user, jnxUser } = await requireAuth();

// Require admin role
const { user, jnxUser } = await requireAdmin();
```

### Client-Side (Component):
```typescript
import { useUser, useClerk } from '@clerk/nextjs';
import { useIsAdmin } from '@/lib/auth/clerk-client';

const { user, isLoaded } = useUser();
const { signOut } = useClerk();
const isAdmin = useIsAdmin();
```

---

## 🗄️ Database Operations

### Idempotent User/Org Operations:
```typescript
import { 
  upsertUser, 
  upsertOrg, 
  createUserWithOrg,
  syncUserFromClerk 
} from '@/lib/db/helpers';

// Update or create user
await upsertUser({
  clerkUserId: 'user_xxx',
  email: 'user@example.com',
  fullName: 'John Doe',
  role: 'member'
});

// Create user with default org (transactional)
await createUserWithOrg({
  clerkUserId: 'user_xxx',
  email: 'user@example.com',
  fullName: 'John Doe'
});
```

### Supabase Query:
```typescript
import { createSupabaseServerClient } from '@/lib/supabase/server';

const supabase = createSupabaseServerClient();

const { data, error } = await supabase
  .from('your_table')
  .select('*')
  .eq('user_id', userId)
  .is('deleted_at', null); // Respect soft-deletes
```

---

## 🔒 Security

### Rate Limiting:
```typescript
import { applyRateLimit } from '@/lib/security/rate-limit';

const identifier = req.ip || 'anonymous';
const result = await applyRateLimit('auth', identifier);

if (!result.success) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429 }
  );
}
```

### Logging with PII Redaction:
```typescript
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('api/your-route');

logger.info('User action', { userId: 'user_123' });
logger.error('Operation failed', { error });
```

---

## 🎨 UI Components

### Buttons:
```typescript
import { ButtonPrimary, ButtonSecondary } from '@/components/ui';

<ButtonPrimary size="lg" glow onClick={handleClick}>
  Primary Action
</ButtonPrimary>

<ButtonSecondary size="md" onClick={handleClick}>
  Secondary Action
</ButtonSecondary>
```

### Form Inputs:
```typescript
import { InputField } from '@/components/ui/input-field';
import { Mail } from 'lucide-react';

<InputField
  type="email"
  placeholder="Enter email"
  icon={<Mail className="h-5 w-5" />}
  onChange={handleChange}
/>
```

### Status Badge:
```typescript
import { StatusBadge } from '@/components/ui/status-badge';

<StatusBadge status="connected">Clerk</StatusBadge>
<StatusBadge status="degraded">Supabase</StatusBadge>
```

---

## 🔌 API Routes

### Standard Template:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('api/your-route');

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse input
    const body = await req.json();

    // 3. Business logic
    // ...

    // 4. Success response
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Request failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Testing Commands

```bash
# Build check
cd nextjs_space && yarn build

# Type check
cd nextjs_space && yarn tsc --noEmit

# Start dev server
cd nextjs_space && yarn dev

# Generate Prisma client
cd nextjs_space && yarn prisma generate

# View database
cd nextjs_space && yarn prisma studio
```

---

## 🔥 Common Issues & Solutions

### Issue: "Column does not exist"
**Solution:** Run `MIGRATION_SIMPLE.sql` in Supabase SQL Editor

### Issue: "Webhook failed"
**Solution:** Check Clerk webhook logs, verify `CLERK_WEBHOOK_SECRET`

### Issue: "Dashboard shows setup screen forever"
**Solution:** Check Supabase connection, verify user exists in `users` table

### Issue: "Admin panel shows 'Unauthorized'"
**Solution:** Set user role in Clerk Dashboard → User → Metadata → Public:
```json
{ "role": "admin" }
```

### Issue: "Build fails with module not found"
**Solution:** Run `yarn install && yarn prisma generate`

---

## 📁 Important File Locations

```
Configuration:
  .env                          # Environment variables
  next.config.js                # Next.js config
  tailwind.config.ts            # Design system
  middleware.ts                 # Route protection

Authentication:
  lib/auth/helpers.ts           # requireAuth, requireAdmin
  lib/auth/clerk-client.ts      # Client hooks
  lib/auth/clerk-server.ts      # Server utilities
  lib/auth/rbac.ts              # Roles & permissions

Database:
  lib/db/schema-v2.sql          # Current schema
  lib/db/helpers.ts             # UPSERT functions
  MIGRATION_SIMPLE.sql          # GDPR migration

Security:
  lib/security/rate-limit.ts    # Rate limiting
  lib/security/headers.ts       # Security headers
  lib/privacy/redaction.ts      # PII redaction

UI:
  components/ui/*               # JNX Dark components
  app/globals.css               # Global styles

API:
  app/api/webhooks/clerk/       # Clerk sync webhook
  app/api/system/health/        # Health metrics
```

---

## 🌐 Environment Variables

```bash
# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 Deployment Checklist

- [ ] Run `yarn build` - must succeed
- [ ] Verify `.env` variables in Vercel
- [ ] Run `MIGRATION_SIMPLE.sql` in production Supabase
- [ ] Configure Clerk webhook URL (production)
- [ ] Test signup/login flows
- [ ] Verify admin access
- [ ] Check Vercel deployment logs
- [ ] Monitor Clerk webhook success rate

---

**Need more details?** Check `BACKEND_PROTECTION_PROMPT.md` 📖
