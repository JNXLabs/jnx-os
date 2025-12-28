-- ================================================================
-- JNX-OS: Agentic LLMOps Database Migration
-- ================================================================
-- Purpose: Add tables for Self-Healing AI System
-- Date: 2024-12-28
-- Status: Phase 0 - Foundation
-- ================================================================

-- ================================================================
-- 1. SYSTEM HEALTH LOGS
-- ================================================================
-- Tracks errors, performance issues, and warnings across the system

CREATE TABLE IF NOT EXISTS system_health_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Classification
  log_type TEXT NOT NULL CHECK (log_type IN ('error', 'performance', 'warning')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  component TEXT NOT NULL,           -- 'auth', 'database', 'api', 'webhook', 'ui'
  
  -- Error Details
  error_message TEXT,
  stack_trace TEXT,
  
  -- Performance Metrics
  execution_time_ms INTEGER,        -- For performance tracking
  
  -- Request Context
  request_path TEXT,                -- API Route or Page
  request_method TEXT,              -- GET, POST, PUT, DELETE
  user_agent TEXT,
  
  -- Relations (nullable - may not always have user/org context)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES orgs(id) ON DELETE SET NULL,
  
  -- Flexible Metadata (Request Headers, Query Params, etc.)
  metadata JSONB,
  
  -- Resolution Tracking
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_health_logs_severity 
  ON system_health_logs(severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_logs_component 
  ON system_health_logs(component, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_logs_unresolved 
  ON system_health_logs(resolved_at) 
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_health_logs_user 
  ON system_health_logs(user_id, created_at DESC) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_health_logs_org 
  ON system_health_logs(org_id, created_at DESC) 
  WHERE org_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_health_logs_created_at 
  ON system_health_logs(created_at DESC);

-- ================================================================
-- 2. AI PROPOSALS
-- ================================================================
-- Stores AI-generated code fix proposals (Human-in-the-Loop)

CREATE TABLE IF NOT EXISTS ai_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Classification
  module_name TEXT,                  -- 'auth', 'database', 'api/webhooks/clerk'
  issue_type TEXT NOT NULL CHECK (issue_type IN ('bug', 'performance', 'security', 'optimization')),
  
  -- Description
  title TEXT NOT NULL,               -- Short summary
  description TEXT NOT NULL,         -- Detailed explanation
  
  -- Code Changes
  file_path TEXT NOT NULL,           -- Relative path: 'lib/db/helpers.ts'
  old_code TEXT,                     -- Original code (can be null for new files)
  new_code TEXT NOT NULL,            -- AI-optimized code
  explanation TEXT NOT NULL,         -- Why is this better?
  
  -- Impact Assessment
  impact_score INTEGER NOT NULL CHECK (impact_score BETWEEN 1 AND 10),
  complexity TEXT NOT NULL CHECK (complexity IN ('low', 'medium', 'high')),
  estimated_time_saved_ms INTEGER,   -- Performance improvement estimate
  
  -- Status & Workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied', 'reverted')),
  
  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES users(id) ON DELETE SET NULL,
  github_commit_sha TEXT,            -- Commit hash after apply
  github_commit_url TEXT,
  
  reverted_at TIMESTAMPTZ,
  reverted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revert_reason TEXT,
  
  -- Relations
  related_health_log_ids UUID[],     -- Which health logs led to this proposal?
  
  -- AI Metadata
  ai_model TEXT DEFAULT 'gemini-2.0-flash-exp',
  ai_confidence_score DECIMAL(3,2),  -- 0.00 to 1.00
  ai_reasoning TEXT                  -- AI's explanation of the fix
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_proposals_status 
  ON ai_proposals(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proposals_impact 
  ON ai_proposals(impact_score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proposals_pending 
  ON ai_proposals(created_at DESC) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_proposals_module 
  ON ai_proposals(module_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proposals_reviewed_by 
  ON ai_proposals(reviewed_by, reviewed_at DESC) 
  WHERE reviewed_by IS NOT NULL;

-- ================================================================
-- 3. AI ADVISOR SESSIONS
-- ================================================================
-- Tracks background analysis runs (for debugging and monitoring)

CREATE TABLE IF NOT EXISTS ai_advisor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Session Info
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  
  -- Analysis Results
  critical_issues_found INTEGER DEFAULT 0,
  performance_issues_found INTEGER DEFAULT 0,
  proposals_created INTEGER DEFAULT 0,
  
  -- Context
  analyzed_time_range_hours INTEGER, -- e.g., last 24 hours
  ai_model TEXT DEFAULT 'gemini-2.0-flash-exp',
  
  -- Performance
  execution_time_ms INTEGER,
  
  -- Error Handling
  error_message TEXT,
  error_stack TEXT,
  
  -- Metadata
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_advisor_sessions_status 
  ON ai_advisor_sessions(status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_advisor_sessions_started_at 
  ON ai_advisor_sessions(started_at DESC);

-- ================================================================
-- 4. CODE CONTEXT CACHE
-- ================================================================
-- Caches frequently accessed code files for AI analysis
-- (Performance optimization - avoids repeated file reads)

CREATE TABLE IF NOT EXISTS code_context_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  file_path TEXT UNIQUE NOT NULL,    -- 'lib/db/helpers.ts'
  content TEXT NOT NULL,             -- File content
  hash TEXT NOT NULL,                -- SHA-256 hash for change detection
  
  -- Metadata
  file_size_bytes INTEGER,
  lines_of_code INTEGER,
  component_type TEXT,               -- 'api', 'lib', 'component', 'page'
  
  -- Cache Management
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  cache_hits INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_cache_file_path 
  ON code_context_cache(file_path);

CREATE INDEX IF NOT EXISTS idx_code_cache_last_accessed 
  ON code_context_cache(last_accessed_at DESC);

-- ================================================================
-- 5. VERIFICATION QUERIES
-- ================================================================

-- Verify all tables created successfully
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'system_health_logs',
    'ai_proposals',
    'ai_advisor_sessions',
    'code_context_cache'
  )
ORDER BY table_name;

-- Verify indexes created
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'system_health_logs',
    'ai_proposals',
    'ai_advisor_sessions',
    'code_context_cache'
  )
ORDER BY tablename, indexname;

-- ================================================================
-- 6. SAMPLE DATA (for testing)
-- ================================================================

-- Sample Health Log (Performance Issue)
INSERT INTO system_health_logs (
  log_type,
  severity,
  component,
  error_message,
  execution_time_ms,
  request_path,
  request_method,
  metadata
) VALUES (
  'performance',
  'medium',
  'database',
  'Slow query detected in user lookup',
  2450,
  '/api/auth/user',
  'GET',
  '{"query": "SELECT * FROM users WHERE email = ?", "affected_rows": 1}'::jsonb
);

-- Sample Health Log (Critical Error)
INSERT INTO system_health_logs (
  log_type,
  severity,
  component,
  error_message,
  stack_trace,
  request_path,
  request_method
) VALUES (
  'error',
  'critical',
  'webhook',
  'Clerk webhook handler failed: duplicate key error',
  'Error: duplicate key value violates unique constraint "users_clerk_user_id_key"\n    at ...',
  '/api/webhooks/clerk',
  'POST'
);

-- Sample AI Proposal
INSERT INTO ai_proposals (
  module_name,
  issue_type,
  title,
  description,
  file_path,
  old_code,
  new_code,
  explanation,
  impact_score,
  complexity,
  estimated_time_saved_ms,
  ai_model,
  ai_confidence_score,
  ai_reasoning
) VALUES (
  'database',
  'performance',
  'Optimize user lookup query with index',
  'The current user lookup query in /api/auth/user is causing performance issues (avg 2.4s). Adding a composite index on (email, deleted_at) will reduce query time to <100ms.',
  'lib/db/schema-v2.sql',
  '-- No index on email + deleted_at',
  'CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email) WHERE deleted_at IS NULL;',
  'Adding this partial index will dramatically improve query performance for active user lookups, which are the most common database operation in the auth flow.',
  8,
  'low',
  2350,
  'gemini-2.0-flash-exp',
  0.92,
  'Analysis of 10,000 recent queries shows 95% are for active users (deleted_at IS NULL). A partial index will cover these cases efficiently without adding overhead for deleted users.'
);

-- ================================================================
-- 7. SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Agentic LLMOps Migration completed successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created Tables:';
  RAISE NOTICE '  - system_health_logs';
  RAISE NOTICE '  - ai_proposals';
  RAISE NOTICE '  - ai_advisor_sessions';
  RAISE NOTICE '  - code_context_cache';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Implement Error Tracker (lib/observability/error-tracker.ts)';
  RAISE NOTICE '  2. Setup Cron Job (app/api/agentic/analyze-health/route.ts)';
  RAISE NOTICE '  3. Build AI Advisor Dashboard (/admin/ai-advisor)';
  RAISE NOTICE '============================================';
END $$;
