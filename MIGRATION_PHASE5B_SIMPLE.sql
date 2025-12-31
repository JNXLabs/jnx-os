-- PHASE 5B MIGRATION - SIMPLIFIED VERSION
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- Step 1: Add conversations_limit to billing_subscriptions
ALTER TABLE billing_subscriptions 
ADD COLUMN IF NOT EXISTS conversations_limit INTEGER DEFAULT 500;

-- Step 2: Update existing records
UPDATE billing_subscriptions
SET conversations_limit = CASE plan_name
  WHEN 'Starter' THEN 500
  WHEN 'Professional' THEN 2000
  WHEN 'Business' THEN 5000
  ELSE 500
END;

-- Step 3: Create user_conversation_usage table
CREATE TABLE IF NOT EXISTS user_conversation_usage (
  usage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  conversations_used INTEGER NOT NULL DEFAULT 0,
  conversations_limit INTEGER NOT NULL DEFAULT 500,
  warning_sent_80_percent BOOLEAN DEFAULT FALSE,
  warning_sent_100_percent BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, period_start)
);

-- Step 4: Create qryx_shops table
CREATE TABLE IF NOT EXISTS qryx_shops (
  shop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  shop_domain TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create qryx_conversations table
CREATE TABLE IF NOT EXISTS qryx_conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES qryx_shops(shop_id) ON DELETE CASCADE,
  clerk_user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  customer_email TEXT,
  customer_name TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Create qryx_messages table
CREATE TABLE IF NOT EXISTS qryx_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES qryx_conversations(conversation_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_conv_usage_clerk_user ON user_conversation_usage(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_conv_usage_period ON user_conversation_usage(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_user_conv_usage_last_updated ON user_conversation_usage(last_updated);
CREATE INDEX IF NOT EXISTS idx_qryx_shops_clerk_user ON qryx_shops(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_qryx_shops_domain ON qryx_shops(shop_domain);
CREATE INDEX IF NOT EXISTS idx_qryx_shops_active ON qryx_shops(is_active);
CREATE INDEX IF NOT EXISTS idx_qryx_conv_shop ON qryx_conversations(shop_id);
CREATE INDEX IF NOT EXISTS idx_qryx_conv_user ON qryx_conversations(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_qryx_conv_started ON qryx_conversations(started_at);
CREATE INDEX IF NOT EXISTS idx_qryx_msg_conv ON qryx_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_qryx_msg_created ON qryx_messages(created_at);

-- Verification queries
SELECT 'user_conversation_usage' as table_name, COUNT(*) as count FROM user_conversation_usage
UNION ALL
SELECT 'qryx_shops', COUNT(*) FROM qryx_shops
UNION ALL
SELECT 'qryx_conversations', COUNT(*) FROM qryx_conversations
UNION ALL
SELECT 'qryx_messages', COUNT(*) FROM qryx_messages;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'billing_subscriptions' 
AND column_name = 'conversations_limit';
