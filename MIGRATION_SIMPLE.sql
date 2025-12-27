-- ═══════════════════════════════════════════════════════════════════════
-- JNX-OS: Simple Migration v1 to v2 (Clerk Integration)
-- ═══════════════════════════════════════════════════════════════════════
-- This is IDEMPOTENT and SAFE - Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- Part 1: Add columns to orgs table
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS clerk_org_id TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Part 2: Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_user_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Part 3: Add constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orgs_clerk_org_id_key') THEN
    ALTER TABLE orgs ADD CONSTRAINT orgs_clerk_org_id_key UNIQUE (clerk_org_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_clerk_user_id_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_clerk_user_id_key UNIQUE (clerk_user_id);
  END IF;
END $$;

-- Part 4: Make supabase_user_id nullable
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'supabase_user_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE users ALTER COLUMN supabase_user_id DROP NOT NULL;
  END IF;
END $$;

-- Part 5: Create new tables
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

-- Part 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_orgs_clerk_org_id ON orgs(clerk_org_id);
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_billing_customers_stripe_id ON billing_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_org_id ON data_export_requests(org_id);

-- Part 7: Verification
SELECT 'Migration completed!' AS status, NOW() AS completed_at;

-- Show table structures
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orgs' 
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;