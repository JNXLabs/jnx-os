# 🔧 CRITICAL: Database Schema Verification

**Action Required:** Run this SQL in your Supabase SQL Editor

---

## ✅ Step 1: Verify Indexes

```sql
-- Check existing indexes
SELECT 
  tablename, 
  indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (
    tablename = 'users' 
    OR tablename = 'orgs'
    OR tablename = 'audit_logs'
  )
ORDER BY tablename, indexname;
```

---

## ✅ Step 2: Create Missing Indexes (Idempotent)

```sql
-- Critical Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

CREATE INDEX IF NOT EXISTS idx_orgs_clerk_org_id ON orgs(clerk_org_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at DESC);
```

---

## ✅ Step 3: Verify Constraints

```sql
-- Check foreign key constraints
SELECT
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('users', 'orgs', 'audit_logs')
ORDER BY tc.table_name, tc.constraint_type;
```

---

## ✅ Step 4: Add Missing Constraints (Optional but Recommended)

```sql
-- Add foreign key constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_org_id_fkey' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add audit logs constraints if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'audit_logs_org_id_fkey' 
    AND table_name = 'audit_logs'
  ) THEN
    ALTER TABLE audit_logs 
    ADD CONSTRAINT audit_logs_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES orgs(org_id) ON DELETE CASCADE;
  END IF;
END $$;
```

---

## ✅ Step 5: Verify Schema Matches Expected

```sql
-- Verify users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Verify orgs table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orgs'
ORDER BY ordinal_position;
```

**Expected Users Columns:**
- `user_id` (uuid, PRIMARY KEY)
- `clerk_user_id` (text, UNIQUE NOT NULL)
- `email` (text, NOT NULL)
- `first_name` (text, nullable)
- `last_name` (text, nullable)
- `org_id` (uuid, nullable, FK to orgs)
- `role` (text, DEFAULT 'member')
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `deleted_at` (timestamptz, nullable)

**Expected Orgs Columns:**
- `org_id` (uuid, PRIMARY KEY)
- `clerk_org_id` (text, UNIQUE, nullable)
- `name` (text, NOT NULL)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

---

## 🎯 Success Criteria

After running all commands, you should have:
- ✅ All indexes created
- ✅ Foreign key constraints in place
- ✅ Schema matches expected structure
- ✅ No errors in SQL execution

---

**Note:** All commands are idempotent and safe to run multiple times.
