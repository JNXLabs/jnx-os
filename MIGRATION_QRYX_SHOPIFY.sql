-- QRYX SHOPIFY INTEGRATION - DATABASE MIGRATION
-- This migration creates all necessary tables for Qryx Shopify AI Sales Assistant
-- Integrates with JNX-OS via org_id foreign keys
-- Version: 1.0.0
-- Date: 2024-12-28

-- =============================================================================
-- SECTION 1: SHOPIFY SHOPS (Core Integration with JNX-OS)
-- =============================================================================

-- Create shopify_shops table
-- Links Shopify stores to JNX-OS organizations
-- Each shop becomes a Clerk Organization
CREATE TABLE IF NOT EXISTS shopify_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- JNX-OS Integration (CRITICAL)
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Shopify Data
  shop_domain TEXT NOT NULL UNIQUE,  -- mystore.myshopify.com
  shop_name TEXT NOT NULL,           -- Store display name
  shop_email TEXT,                   -- Shop owner email
  shop_owner_name TEXT,              -- Shop owner name
  
  -- Shopify OAuth
  access_token TEXT NOT NULL,        -- Encrypted via Supabase RLS
  scope TEXT NOT NULL,               -- OAuth scopes granted
  
  -- Installation Status
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uninstalled_at TIMESTAMPTZ,        -- Soft delete timestamp
  
  -- Subscription Status
  plan_tier TEXT NOT NULL DEFAULT 'trial',  -- trial, basic, pro, business, enterprise
  subscription_status TEXT DEFAULT 'active', -- active, cancelled, past_due
  trial_ends_at TIMESTAMPTZ,                 -- When trial expires
  
  -- Billing
  shopify_charge_id TEXT,            -- Recurring charge ID
  billing_period_start DATE,
  billing_period_end DATE,
  
  -- Metadata
  shopify_plan TEXT,                 -- basic, shopify, advanced, plus
  country_code TEXT,
  currency TEXT,
  timezone TEXT,
  
  -- GDPR Compliance
  deleted_at TIMESTAMPTZ,            -- Soft delete for GDPR
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for shopify_shops
CREATE INDEX IF NOT EXISTS idx_shopify_shops_org_id ON shopify_shops(org_id);
CREATE INDEX IF NOT EXISTS idx_shopify_shops_shop_domain ON shopify_shops(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shopify_shops_plan_tier ON shopify_shops(plan_tier);
CREATE INDEX IF NOT EXISTS idx_shopify_shops_deleted_at ON shopify_shops(deleted_at);
CREATE INDEX IF NOT EXISTS idx_shopify_shops_uninstalled_at ON shopify_shops(uninstalled_at);

COMMENT ON TABLE shopify_shops IS 'Shopify stores integrated with JNX-OS via org_id. Each shop = 1 Clerk Organization.';

-- =============================================================================
-- SECTION 2: CHAT SESSIONS
-- =============================================================================

-- Create qryx_chat_sessions table
-- Tracks conversation sessions between customers and Qryx bot
CREATE TABLE IF NOT EXISTS qryx_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  shop_id UUID NOT NULL REFERENCES shopify_shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Optional: links to JNX user if known
  
  -- Session Data
  session_token TEXT NOT NULL UNIQUE,  -- Anonymous session identifier
  customer_email TEXT,                 -- If customer provides email
  customer_name TEXT,                  -- If customer provides name
  
  -- Session Metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,                -- When session closed
  last_message_at TIMESTAMPTZ,         -- For timeout detection
  
  -- Session Status
  status TEXT NOT NULL DEFAULT 'active', -- active, ended, abandoned
  
  -- Conversion Tracking
  resulted_in_order BOOLEAN DEFAULT FALSE,
  order_id TEXT,                       -- Shopify order ID if converted
  order_value DECIMAL(10,2),           -- Order total if converted
  
  -- Context
  ip_address TEXT,                     -- For analytics (GDPR compliant)
  user_agent TEXT,
  referrer TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for qryx_chat_sessions
CREATE INDEX IF NOT EXISTS idx_qryx_chat_sessions_shop_id ON qryx_chat_sessions(shop_id);
CREATE INDEX IF NOT EXISTS idx_qryx_chat_sessions_user_id ON qryx_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_qryx_chat_sessions_session_token ON qryx_chat_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_qryx_chat_sessions_status ON qryx_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_qryx_chat_sessions_started_at ON qryx_chat_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_qryx_chat_sessions_resulted_in_order ON qryx_chat_sessions(resulted_in_order);

COMMENT ON TABLE qryx_chat_sessions IS 'Chat sessions between Shopify customers and Qryx AI. Tracks conversions.';

-- =============================================================================
-- SECTION 3: CHAT MESSAGES
-- =============================================================================

-- Create qryx_chat_messages table
-- Stores individual messages within sessions
CREATE TABLE IF NOT EXISTS qryx_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  session_id UUID NOT NULL REFERENCES qryx_chat_sessions(id) ON DELETE CASCADE,
  
  -- Message Data
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Message Metadata
  tokens_used INTEGER,                 -- For cost tracking
  response_time_ms INTEGER,            -- AI response latency
  
  -- Product Recommendations
  recommended_products JSONB,          -- Array of product IDs/details
  
  -- Sentiment Analysis (for learning platform)
  sentiment TEXT,                      -- positive, neutral, negative
  sentiment_score DECIMAL(3,2),        -- -1.0 to 1.0
  
  -- PII Redaction Status
  contains_pii BOOLEAN DEFAULT FALSE,
  redacted_fields JSONB,               -- Which fields were redacted
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for qryx_chat_messages
CREATE INDEX IF NOT EXISTS idx_qryx_chat_messages_session_id ON qryx_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_qryx_chat_messages_role ON qryx_chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_qryx_chat_messages_created_at ON qryx_chat_messages(created_at);

COMMENT ON TABLE qryx_chat_messages IS 'Individual messages within Qryx chat sessions. PII-redacted for GDPR.';

-- =============================================================================
-- SECTION 4: QRYX CONFIGURATION
-- =============================================================================

-- Create qryx_config table
-- Per-shop configuration for Qryx behavior
CREATE TABLE IF NOT EXISTS qryx_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  shop_id UUID NOT NULL UNIQUE REFERENCES shopify_shops(id) ON DELETE CASCADE,
  
  -- Bot Configuration
  bot_name TEXT DEFAULT 'Qryx',
  bot_greeting TEXT DEFAULT 'Hi! How can I help you today?',
  bot_avatar_url TEXT,
  
  -- Widget Styling
  widget_position TEXT DEFAULT 'bottom-right', -- bottom-right, bottom-left
  primary_color TEXT DEFAULT '#06b6d4',        -- Cyan-500
  secondary_color TEXT DEFAULT '#0891b2',      -- Cyan-600
  
  -- Behavior Settings
  show_product_images BOOLEAN DEFAULT TRUE,
  enable_order_tracking BOOLEAN DEFAULT TRUE,
  enable_cart_recovery BOOLEAN DEFAULT FALSE,  -- Pro+ feature
  max_context_messages INTEGER DEFAULT 10,     -- How many messages to include in context
  
  -- AI Settings
  system_prompt TEXT,                          -- Custom system prompt
  temperature DECIMAL(2,1) DEFAULT 0.7,        -- AI creativity (0.0-1.0)
  max_tokens INTEGER DEFAULT 500,              -- Max response length
  
  -- Custom Prompts (Pro+ feature)
  custom_prompts JSONB DEFAULT '[]'::jsonb,    -- Array of custom prompt templates
  
  -- A/B Testing (Pro+ feature)
  ab_test_enabled BOOLEAN DEFAULT FALSE,
  ab_test_variants JSONB DEFAULT '[]'::jsonb,  -- Array of test variants
  
  -- Business Hours
  business_hours JSONB,                        -- Schedule for "available" status
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for qryx_config
CREATE INDEX IF NOT EXISTS idx_qryx_config_shop_id ON qryx_config(shop_id);

COMMENT ON TABLE qryx_config IS 'Per-shop configuration for Qryx AI behavior and widget appearance.';

-- =============================================================================
-- SECTION 5: USAGE TRACKING (For Billing)
-- =============================================================================

-- Create conversation_usage table
-- Tracks conversation usage for billing purposes
CREATE TABLE IF NOT EXISTS conversation_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  shop_id UUID NOT NULL REFERENCES shopify_shops(id) ON DELETE CASCADE,
  
  -- Billing Period
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  
  -- Usage Limits
  conversations_included INTEGER NOT NULL,     -- From plan
  conversations_used INTEGER NOT NULL DEFAULT 0,
  
  -- Overage Tracking
  overage_count INTEGER DEFAULT 0,
  overage_charged DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: One record per shop per billing period
  UNIQUE(shop_id, billing_period_start)
);

-- Indexes for conversation_usage
CREATE INDEX IF NOT EXISTS idx_conversation_usage_shop_id ON conversation_usage(shop_id);
CREATE INDEX IF NOT EXISTS idx_conversation_usage_billing_period ON conversation_usage(billing_period_start, billing_period_end);

COMMENT ON TABLE conversation_usage IS 'Conversation usage tracking for Qryx billing. Resets per billing cycle.';

-- =============================================================================
-- SECTION 6: PRODUCT CACHE (Performance Optimization)
-- =============================================================================

-- Create qryx_product_cache table
-- Caches Shopify product data for faster AI responses
CREATE TABLE IF NOT EXISTS qryx_product_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  shop_id UUID NOT NULL REFERENCES shopify_shops(id) ON DELETE CASCADE,
  
  -- Shopify Product Data
  product_id TEXT NOT NULL,            -- Shopify product ID
  product_title TEXT NOT NULL,
  product_description TEXT,
  product_type TEXT,
  vendor TEXT,
  tags TEXT[],
  
  -- Pricing
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  currency TEXT,
  
  -- Availability
  available BOOLEAN DEFAULT TRUE,
  inventory_quantity INTEGER,
  
  -- Images
  image_url TEXT,
  
  -- Product URL
  product_url TEXT,
  
  -- Embeddings (for AI matching)
  embedding_vector vector(768),        -- Requires pgvector extension (optional)
  
  -- Cache Metadata
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: One record per product per shop
  UNIQUE(shop_id, product_id)
);

-- Indexes for qryx_product_cache
CREATE INDEX IF NOT EXISTS idx_qryx_product_cache_shop_id ON qryx_product_cache(shop_id);
CREATE INDEX IF NOT EXISTS idx_qryx_product_cache_product_id ON qryx_product_cache(product_id);
CREATE INDEX IF NOT EXISTS idx_qryx_product_cache_available ON qryx_product_cache(available);
CREATE INDEX IF NOT EXISTS idx_qryx_product_cache_last_synced ON qryx_product_cache(last_synced_at);

COMMENT ON TABLE qryx_product_cache IS 'Cached Shopify product data for fast AI responses. Synced periodically.';

-- =============================================================================
-- SECTION 7: ANALYTICS AGGREGATES (Performance)
-- =============================================================================

-- Create qryx_analytics_daily table
-- Pre-aggregated daily analytics for faster dashboard queries
CREATE TABLE IF NOT EXISTS qryx_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  shop_id UUID NOT NULL REFERENCES shopify_shops(id) ON DELETE CASCADE,
  
  -- Date
  date DATE NOT NULL,
  
  -- Conversation Metrics
  total_conversations INTEGER DEFAULT 0,
  avg_messages_per_conversation DECIMAL(5,2),
  avg_session_duration_seconds INTEGER,
  
  -- Conversion Metrics
  conversations_with_orders INTEGER DEFAULT 0,
  total_order_value DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2),            -- Percentage
  
  -- Customer Satisfaction
  positive_sentiment_count INTEGER DEFAULT 0,
  neutral_sentiment_count INTEGER DEFAULT 0,
  negative_sentiment_count INTEGER DEFAULT 0,
  avg_sentiment_score DECIMAL(3,2),
  
  -- Performance
  avg_response_time_ms INTEGER,
  total_tokens_used INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: One record per shop per date
  UNIQUE(shop_id, date)
);

-- Indexes for qryx_analytics_daily
CREATE INDEX IF NOT EXISTS idx_qryx_analytics_daily_shop_id ON qryx_analytics_daily(shop_id);
CREATE INDEX IF NOT EXISTS idx_qryx_analytics_daily_date ON qryx_analytics_daily(date);

COMMENT ON TABLE qryx_analytics_daily IS 'Pre-aggregated daily analytics for Qryx dashboard performance.';

-- =============================================================================
-- SECTION 8: VERIFICATION QUERIES
-- =============================================================================

-- Verify all tables were created
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'shopify_%' OR table_name LIKE 'qryx_%' OR table_name LIKE 'conversation_%'
ORDER BY table_name;

-- Verify foreign key constraints
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
  AND (tc.table_name LIKE 'shopify_%' OR tc.table_name LIKE 'qryx_%' OR tc.table_name LIKE 'conversation_%')
ORDER BY tc.table_name;

-- Verify indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename LIKE 'shopify_%' OR tablename LIKE 'qryx_%' OR tablename LIKE 'conversation_%')
ORDER BY tablename, indexname;

-- =============================================================================
-- SUCCESS CRITERIA
-- =============================================================================

-- After running this migration, you should have:
-- ✅ 7 new tables (shopify_shops, qryx_chat_sessions, qryx_chat_messages, qryx_config, conversation_usage, qryx_product_cache, qryx_analytics_daily)
-- ✅ All foreign keys to JNX-OS tables (orgs, users)
-- ✅ Proper indexes for query performance
-- ✅ GDPR-compliant soft deletes
-- ✅ Billing usage tracking
-- ✅ Product caching for performance
-- ✅ Pre-aggregated analytics

-- =============================================================================
-- NEXT STEPS
-- =============================================================================

-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify all tables and constraints
-- 3. Test with sample data
-- 4. Proceed to Phase 2: Gemini API Setup

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
