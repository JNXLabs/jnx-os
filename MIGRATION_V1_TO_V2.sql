-- ═══════════════════════════════════════════════════════════════════════
-- JNX-OS: Migration from Schema v1 to v2 (Clerk Integration)
-- ═══════════════════════════════════════════════════════════════════════
-- CRITICAL: Run this in Supabase SQL Editor BEFORE deploying v2 code
-- This migration is IDEMPOTENT and safe to run multiple times
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Add missing columns to 'orgs' table
DO $$ 
BEGIN
  -- Add clerk_org_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orgs' AND column_name = 'clerk_org_id'
  ) THEN
    ALTER TABLE orgs ADD COLUMN clerk_org_id TEXT UNIQUE;
    RAISE NOTICE 'Added clerk_org_id to orgs table';
  ELSE
    RAISE NOTICE 'clerk_org_id already exists in orgs table';
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orgs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE orgs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at to orgs table';
  ELSE
    RAISE NOTICE 'updated_at already exists in orgs table';
  END IF;
END $$;

-- Step 2: Migrate 'users' table from supabase_user_id to clerk_user_id
DO $$ 
BEGIN
  -- Add clerk_user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'clerk_user_id'
  ) THEN
    ALTER TABLE users ADD COLUMN clerk_user_id TEXT UNIQUE;
    RAISE NOTICE 'Added clerk_user_id to users table';
  ELSE
    RAISE NOTICE 'clerk_user_id already exists in users table';
  END IF;

  -- Add first_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE users ADD COLUMN first_name TEXT;
    RAISE NOTICE 'Added first_name to users table';
  ELSE
    RAISE NOTICE 'first_name already exists in users table';
  END IF;

  -- Add last_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE users ADD COLUMN last_name TEXT;
    RAISE NOTICE 'Added last_name to users table';
  ELSE
    RAISE NOTICE 'last_name already exists in users table';
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at to users table';
  ELSE
    RAISE NOTICE 'updated_at already exists in users table';
  END IF;

  -- Add deleted_at column if it doesn't exist (GDPR soft delete)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
    RAISE NOTICE 'Added deleted_at to users table';
  ELSE
    RAISE NOTICE 'deleted_at already exists in users table';
  END IF;

  -- Make supabase_user_id nullable (we're migrating to clerk_user_id)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'supabase_user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE users ALTER COLUMN supabase_user_id DROP NOT NULL;
    RAISE NOTICE 'Made supabase_user_id nullable in users table';
  ELSE
    RAISE NOTICE 'supabase_user_id is already nullable or does not exist';
  END IF;
END $$;

-- Step 3: Create new tables from schema-v2
CREATE TABLE IF NOT EXISTS billing_customers (
  org_id UUID PRIMARY KEY REFERENCES orgs(org_id),
  stripe_customer_id TEXT UNIQUE,
  status TEXT,
  plan TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entitlements (
  org_id UUID REFERENCES orgs(org_id),
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
  org_id UUID REFERENCES orgs(org_id),
  user_id UUID REFERENCES users(user_id),
  status TEXT DEFAULT 'pending',
  export_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Step 4: Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_orgs_clerk_org_id ON orgs(clerk_org_id);
CREATE INDEX IF NOT EXISTS idx_billing_customers_stripe_id ON billing_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);

-- Step 5: Verify the migration
SELECT 'Migration completed successfully!' AS status;

-- Step 6: Display table structure for verification
SELECT 
  'orgs' AS table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orgs'
ORDER BY ordinal_position;

SELECT 
  'users' AS table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
