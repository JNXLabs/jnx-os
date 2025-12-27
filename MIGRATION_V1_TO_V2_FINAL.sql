-- ═══════════════════════════════════════════════════════════════════════
-- JNX-OS: FINAL Migration from Schema v1 to v2 (Clerk Integration)
-- ═══════════════════════════════════════════════════════════════════════
-- CRITICAL: This is IDEMPOTENT and safe to run multiple times
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- PART 1: ADD COLUMNS TO 'orgs' TABLE
-- ═══════════════════════════════════════════════════════════════════════

-- Add clerk_org_id column
ALTER TABLE orgs 
  ADD COLUMN IF NOT EXISTS clerk_org_id TEXT;

-- Add unique constraint (safe, checks if exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orgs_clerk_org_id_key'
  ) THEN
    ALTER TABLE orgs ADD CONSTRAINT orgs_clerk_org_id_key UNIQUE (clerk_org_id);
    RAISE NOTICE '✅ Added UNIQUE constraint to orgs.clerk_org_id';
  ELSE
    RAISE NOTICE 'ℹ️ orgs.clerk_org_id constraint already exists';
  END IF;
END $$;

-- Add updated_at column
ALTER TABLE orgs 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

RAISE NOTICE '✅ orgs table columns added/verified';

-- ═══════════════════════════════════════════════════════════════════════
-- PART 2: ADD COLUMNS TO 'users' TABLE
-- ═══════════════════════════════════════════════════════════════════════

-- Add clerk_user_id column
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;

-- Add unique constraint (safe, checks if exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_clerk_user_id_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_clerk_user_id_key UNIQUE (clerk_user_id);
    RAISE NOTICE '✅ Added UNIQUE constraint to users.clerk_user_id';
  ELSE
    RAISE NOTICE 'ℹ️ users.clerk_user_id constraint already exists';
  END IF;
END $$;

-- Add name columns
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add updated_at column
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add deleted_at column (CRITICAL for GDPR soft delete)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

RAISE NOTICE '✅ users table columns added/verified';

-- Make supabase_user_id nullable (migration from Supabase to Clerk)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'supabase_user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE users ALTER COLUMN supabase_user_id DROP NOT NULL;
    RAISE NOTICE '✅ Made supabase_user_id nullable';
  ELSE
    RAISE NOTICE 'ℹ️ supabase_user_id is already nullable or does not exist';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- PART 3: CREATE NEW TABLES
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS billing_customers (
  org_id UUID PRIMARY KEY REFERENCES orgs(org_id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  status TEXT,
  plan TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entitlements (
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  product_key TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, product_key, feature_key)
);

CREATE TABLE IF NOT EXISTS feature_flags (
  flag_key TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  config JSONB,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_export_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(org_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  export_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

RAISE NOTICE '✅ New tables created/verified';

-- ═══════════════════════════════════════════════════════════════════════
-- PART 4: CREATE INDEXES
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_orgs_clerk_org_id ON orgs(clerk_org_id) WHERE clerk_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id) WHERE clerk_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_customers_stripe_id ON billing_customers(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_org_id ON data_export_requests(org_id);

RAISE NOTICE '✅ Indexes created/verified';

-- ═══════════════════════════════════════════════════════════════════════
-- PART 5: VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════

-- Show orgs table structure
SELECT 
  'orgs' AS table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orgs'
ORDER BY ordinal_position;

-- Show users table structure
SELECT 
  'users' AS table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Show new tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('billing_customers', 'entitlements', 'feature_flags', 'data_export_requests')
ORDER BY table_name;

-- Show indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename = 'users' OR tablename = 'orgs')
ORDER BY tablename, indexname;

-- Final success message
SELECT '✅ ✅ ✅ Migration completed successfully! ✅ ✅ ✅' AS status,
       NOW() AS completed_at;