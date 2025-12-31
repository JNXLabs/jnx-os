-- =============================================================================
-- PHASE 5B: ADD clerk_user_id TO shopify_shops
-- =============================================================================
-- Purpose: Link shopify_shops to Clerk users for billing integration
-- Allows us to track usage per user instead of per org
-- =============================================================================

-- Add clerk_user_id column to shopify_shops
ALTER TABLE shopify_shops 
ADD COLUMN IF NOT EXISTS clerk_user_id TEXT REFERENCES users(clerk_user_id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_shopify_shops_clerk_user ON shopify_shops(clerk_user_id);

-- Update existing records: Set clerk_user_id from org's first user
-- This ensures existing shops have a user owner
UPDATE shopify_shops s
SET clerk_user_id = (
  SELECT u.clerk_user_id 
  FROM users u 
  WHERE u.org_id = s.org_id 
  AND u.deleted_at IS NULL
  ORDER BY u.created_at ASC
  LIMIT 1
)
WHERE s.clerk_user_id IS NULL;

-- Verification query
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'shopify_shops'
AND column_name = 'clerk_user_id';

-- =============================================================================
-- SUCCESS CRITERIA
-- =============================================================================
-- After running this migration:
-- ✅ shopify_shops.clerk_user_id column exists
-- ✅ Index created for performance
-- ✅ Existing records updated with user ownership
-- ✅ Foreign key constraint to users table
-- =============================================================================
