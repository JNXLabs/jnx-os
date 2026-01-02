-- ============================================================================
-- MIGRATION: Phase 5C - Shop Intelligence
-- ============================================================================
-- Purpose: Add shop_intelligence JSONB column to qryx_config table
-- Author: JNX Labs
-- Date: 2025-01-02
-- 
-- This migration enables Qryx to store analyzed shop intelligence including:
-- - Category (fashion, tech, beauty, etc.)
-- - Price range (budget, mid, premium, luxury)
-- - Brand voice (professional, casual, playful, etc.)
-- - Target audience
-- - Top product categories
-- - AI-generated insights
--
-- SAFE TO RUN MULTIPLE TIMES (idempotent)
-- ============================================================================

-- Add shop_intelligence column if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'qryx_config' 
    AND column_name = 'shop_intelligence'
  ) THEN
    ALTER TABLE qryx_config 
    ADD COLUMN shop_intelligence JSONB NULL;
    
    RAISE NOTICE '✅ Added shop_intelligence column to qryx_config';
  ELSE
    RAISE NOTICE '✓ shop_intelligence column already exists';
  END IF;
END $$;

-- Add analyzed_at column to track last analysis
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'qryx_config' 
    AND column_name = 'analyzed_at'
  ) THEN
    ALTER TABLE qryx_config 
    ADD COLUMN analyzed_at TIMESTAMPTZ NULL;
    
    RAISE NOTICE '✅ Added analyzed_at column to qryx_config';
  ELSE
    RAISE NOTICE '✓ analyzed_at column already exists';
  END IF;
END $$;

-- Create index on shop_intelligence for faster queries
CREATE INDEX IF NOT EXISTS idx_qryx_config_shop_intelligence 
ON qryx_config USING GIN (shop_intelligence);

-- Success notification for index creation
DO $$ BEGIN
  RAISE NOTICE '✅ Created GIN index on shop_intelligence';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$ 
DECLARE
  shop_intelligence_exists BOOLEAN;
  analyzed_at_exists BOOLEAN;
  index_exists BOOLEAN;
BEGIN
  -- Check columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'qryx_config' AND column_name = 'shop_intelligence'
  ) INTO shop_intelligence_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'qryx_config' AND column_name = 'analyzed_at'
  ) INTO analyzed_at_exists;
  
  -- Check index
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'qryx_config' 
    AND indexname = 'idx_qryx_config_shop_intelligence'
  ) INTO index_exists;
  
  -- Report
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'shop_intelligence column: %', CASE WHEN shop_intelligence_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'analyzed_at column: %', CASE WHEN analyzed_at_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'GIN index: %', CASE WHEN index_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '========================================';
  
  IF shop_intelligence_exists AND analyzed_at_exists AND index_exists THEN
    RAISE NOTICE '✅ Phase 5C Migration: SUCCESS';
  ELSE
    RAISE EXCEPTION '❌ Migration verification failed!';
  END IF;
END $$;

-- ============================================================================
-- EXAMPLE: Shop Intelligence JSON Structure
-- ============================================================================
/*
{
  "category": "fashion",
  "priceRange": "premium",
  "brandVoice": "luxury",
  "targetAudience": ["women", "professionals", "style-conscious shoppers"],
  "topCategories": ["dresses", "accessories", "shoes"],
  "avgPrice": 149.99,
  "productCount": 45,
  "insights": [
    "This is a fashion shop focusing on fashion products.",
    "Price positioning: premium, high-quality items.",
    "Target audience: women, professionals, style-conscious shoppers.",
    "Use an elegant, sophisticated tone."
  ],
  "analyzed_at": "2025-01-02T10:30:00Z"
}
*/
