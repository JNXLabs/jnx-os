-- =============================================================================
-- PHASE 5B: ATOMIC INCREMENT RPC FUNCTION
-- =============================================================================
-- Purpose: Create PostgreSQL function for atomic conversation count increment
-- This prevents race conditions when multiple requests increment simultaneously
-- =============================================================================

-- Drop function if exists (for idempotency)
DROP FUNCTION IF EXISTS increment_conversation_usage(TEXT, TIMESTAMPTZ);

-- Create atomic increment function
CREATE OR REPLACE FUNCTION increment_conversation_usage(
  p_clerk_user_id TEXT,
  p_period_start TIMESTAMPTZ
)
RETURNS TABLE (
  usage_id UUID,
  clerk_user_id TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  conversations_used INTEGER,
  conversations_limit INTEGER,
  warning_sent_80_percent BOOLEAN,
  warning_sent_100_percent BOOLEAN,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update with row-level lock (FOR UPDATE)
  -- This ensures no two requests can increment the same row simultaneously
  UPDATE user_conversation_usage
  SET 
    conversations_used = conversations_used + 1,
    last_updated = NOW()
  WHERE 
    user_conversation_usage.clerk_user_id = p_clerk_user_id
    AND user_conversation_usage.period_start = p_period_start;
  
  -- Return updated record
  RETURN QUERY
  SELECT 
    u.usage_id,
    u.clerk_user_id,
    u.period_start,
    u.period_end,
    u.conversations_used,
    u.conversations_limit,
    u.warning_sent_80_percent,
    u.warning_sent_100_percent,
    u.last_updated,
    u.created_at
  FROM user_conversation_usage u
  WHERE 
    u.clerk_user_id = p_clerk_user_id
    AND u.period_start = p_period_start;
END;
$$;

-- Add comment
COMMENT ON FUNCTION increment_conversation_usage IS 'Atomically increments conversation usage count for a user. Prevents race conditions with row-level locking.';

-- Verification query
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'increment_conversation_usage'
AND routine_schema = 'public';

-- =============================================================================
-- USAGE EXAMPLE
-- =============================================================================
-- SELECT * FROM increment_conversation_usage('user_xxx', '2025-12-01T00:00:00Z');
-- =============================================================================
