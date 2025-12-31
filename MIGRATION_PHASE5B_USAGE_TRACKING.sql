-- =============================================================================
-- PHASE 5B: USAGE TRACKING & BILLING DASHBOARD - DATABASE MIGRATION
-- =============================================================================
-- Purpose: Add usage tracking and conversation limits for Stripe billing
-- Version: 1.0.0
-- Date: December 31, 2025
-- Safe to run multiple times (idempotent)
-- =============================================================================

-- =============================================================================
-- SECTION 1: EXTEND BILLING_SUBSCRIPTIONS TABLE
-- =============================================================================

-- Add conversations_limit column to billing_subscriptions
-- This stores the plan's conversation limit (500, 2000, or 5000)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'billing_subscriptions' 
    AND column_name = 'conversations_limit'
  ) THEN
    ALTER TABLE billing_subscriptions 
    ADD COLUMN conversations_limit INTEGER DEFAULT 500;
    
    RAISE NOTICE 'Added conversations_limit column to billing_subscriptions';
  ELSE
    RAISE NOTICE 'conversations_limit column already exists';
  END IF;
END $$;

-- Update existing records with correct limits based on plan_name
UPDATE billing_subscriptions
SET conversations_limit = CASE plan_name
  WHEN 'Starter' THEN 500
  WHEN 'Professional' THEN 2000
  WHEN 'Business' THEN 5000
  ELSE 500
END
WHERE conversations_limit IS NULL OR conversations_limit = 500;

COMMENT ON COLUMN billing_subscriptions.conversations_limit IS 'Monthly conversation limit based on subscription plan (Starter: 500, Professional: 2000, Business: 5000)';

-- =============================================================================
-- SECTION 2: CREATE USER_CONVERSATION_USAGE TABLE
-- =============================================================================

-- Create new table for user-based usage tracking
-- This is separate from the shop-based conversation_usage table
CREATE TABLE IF NOT EXISTS user_conversation_usage (
  usage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Reference (links to Clerk user, not shop)
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  
  -- Billing Period (matches Stripe subscription periods)
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Usage Tracking
  conversations_used INTEGER NOT NULL DEFAULT 0,
  conversations_limit INTEGER NOT NULL DEFAULT 500,
  
  -- Warning Flags (for notifications)
  warning_sent_80_percent BOOLEAN DEFAULT FALSE,
  warning_sent_100_percent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: One record per user per billing period
  UNIQUE(clerk_user_id, period_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_conv_usage_clerk_user ON user_conversation_usage(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_conv_usage_period ON user_conversation_usage(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_user_conv_usage_last_updated ON user_conversation_usage(last_updated);

COMMENT ON TABLE user_conversation_usage IS 'User-based conversation usage tracking for Stripe billing. Resets monthly per subscription period.';
COMMENT ON COLUMN user_conversation_usage.clerk_user_id IS 'Links to JNX user (billing is per user, not per shop)';
COMMENT ON COLUMN user_conversation_usage.period_start IS 'Start of billing period (from Stripe subscription current_period_start)';
COMMENT ON COLUMN user_conversation_usage.period_end IS 'End of billing period (from Stripe subscription current_period_end)';
COMMENT ON COLUMN user_conversation_usage.conversations_used IS 'Number of conversations used in current period';
COMMENT ON COLUMN user_conversation_usage.conversations_limit IS 'Monthly limit from subscription plan';
COMMENT ON COLUMN user_conversation_usage.warning_sent_80_percent IS 'True if 80% usage warning was sent';
COMMENT ON COLUMN user_conversation_usage.warning_sent_100_percent IS 'True if 100% limit warning was sent';

-- =============================================================================
-- SECTION 3: CREATE QRYX_SHOPS TABLE (If not exists)
-- =============================================================================

-- Create qryx_shops table for linking users to Shopify stores
-- This is needed for tracking which shops belong to which users
CREATE TABLE IF NOT EXISTS qryx_shops (
  shop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Reference
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  
  -- Shopify Data
  shop_domain TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scopes TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qryx_shops_clerk_user ON qryx_shops(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_qryx_shops_domain ON qryx_shops(shop_domain);
CREATE INDEX IF NOT EXISTS idx_qryx_shops_active ON qryx_shops(is_active);

COMMENT ON TABLE qryx_shops IS 'Shopify stores linked to JNX users. One user can have multiple shops.';

-- =============================================================================
-- SECTION 4: CREATE QRYX_CONVERSATIONS TABLE (If not exists)
-- =============================================================================

-- Create qryx_conversations table for tracking chat conversations
CREATE TABLE IF NOT EXISTS qryx_conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  shop_id UUID REFERENCES qryx_shops(shop_id) ON DELETE CASCADE,
  clerk_user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  
  -- Customer Data
  customer_email TEXT,
  customer_name TEXT,
  
  -- Session Data
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Metrics
  message_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qryx_conv_shop ON qryx_conversations(shop_id);
CREATE INDEX IF NOT EXISTS idx_qryx_conv_user ON qryx_conversations(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_qryx_conv_started ON qryx_conversations(started_at);

COMMENT ON TABLE qryx_conversations IS 'Chat conversations between customers and Qryx AI. Each conversation counts toward usage limit.';

-- =============================================================================
-- SECTION 5: CREATE QRYX_MESSAGES TABLE (If not exists)
-- =============================================================================

-- Create qryx_messages table for individual chat messages
CREATE TABLE IF NOT EXISTS qryx_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  conversation_id UUID NOT NULL REFERENCES qryx_conversations(conversation_id) ON DELETE CASCADE,
  
  -- Message Data
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qryx_msg_conv ON qryx_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_qryx_msg_created ON qryx_messages(created_at);

COMMENT ON TABLE qryx_messages IS 'Individual messages within Qryx conversations.';

-- =============================================================================
-- SECTION 6: VERIFICATION QUERIES
-- =============================================================================

-- Verify billing_subscriptions has conversations_limit
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'billing_subscriptions'
  AND column_name = 'conversations_limit';

-- Verify user_conversation_usage table
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'user_conversation_usage';

-- Verify indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_conversation_usage', 'billing_subscriptions', 'qryx_shops', 'qryx_conversations', 'qryx_messages')
ORDER BY tablename, indexname;

-- Verify foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('user_conversation_usage', 'qryx_shops', 'qryx_conversations', 'qryx_messages')
ORDER BY tc.table_name;

-- =============================================================================
-- SUCCESS CRITERIA
-- =============================================================================

-- After running this migration, you should have:
-- ✅ billing_subscriptions.conversations_limit column added
-- ✅ user_conversation_usage table created with indexes
-- ✅ qryx_shops table created (if not exists)
-- ✅ qryx_conversations table created (if not exists)
-- ✅ qryx_messages table created (if not exists)
-- ✅ All foreign keys properly configured
-- ✅ All indexes created for performance

-- =============================================================================
-- NEXT STEPS
-- =============================================================================

-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify all tables and columns
-- 3. Proceed to Phase 5B.2: Billing Helper Functions
-- 4. Implement usage tracking logic
-- 5. Add limit enforcement to chat API

-- =============================================================================
-- NOTES
-- =============================================================================

-- This migration is IDEMPOTENT - safe to run multiple times
-- It will not drop existing data
-- It adds new columns and tables only if they don't exist
-- Existing conversation_usage table (shop-based) is preserved
-- New user_conversation_usage table is user-based for Stripe billing

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
