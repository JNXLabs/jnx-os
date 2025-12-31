# Phase 5B Migration Instructions

## ⚠️ IMPORTANT: Manual Migration Required

Supabase's REST API doesn't support DDL operations programmatically. You need to run the migration manually in the Supabase SQL Editor.

---

## 🎯 Quick Steps (2 minutes)

### Step 1: Open Supabase SQL Editor

**Direct Link:** [https://supabase.com/dashboard/project/yxikmojxbiiihkpayndw/sql/new](https://supabase.com/dashboard/project/yxikmojxbiiihkpayndw/sql/new)

*(Or navigate manually: Supabase Dashboard → SQL Editor → New Query)*

### Step 2: Copy the Migration SQL

**File Location:** `/home/ubuntu/jnx-os/MIGRATION_PHASE5B_SIMPLE.sql`

```bash
cat /home/ubuntu/jnx-os/MIGRATION_PHASE5B_SIMPLE.sql
```

### Step 3: Paste & Run

1. Copy the **ENTIRE content** of `MIGRATION_PHASE5B_SIMPLE.sql`
2. Paste it into the Supabase SQL Editor
3. Click **"Run"** (or press Cmd/Ctrl + Enter)

### Step 4: Verify Success

After running, you should see:

```
SUCCESS: No errors

Results:
┌─────────────────────────┬───────┐
│ table_name              │ count │
├─────────────────────────┼───────┤
│ user_conversation_usage │ 0     │
│ qryx_shops              │ 0     │
│ qryx_conversations      │ 0     │
│ qryx_messages           │ 0     │
└─────────────────────────┴───────┘

┌───────────────────────┬───────────┐
│ column_name           │ data_type │
├───────────────────────┼───────────┤
│ conversations_limit   │ integer   │
└───────────────────────┴───────────┘
```

---

## ✅ What This Migration Does

### 1. Extends `billing_subscriptions` Table
- Adds `conversations_limit` column (INTEGER, default 500)
- Updates existing records:
  - **Starter Plan:** 500 conversations/month
  - **Professional Plan:** 2,000 conversations/month
  - **Business Plan:** 5,000 conversations/month

### 2. Creates `user_conversation_usage` Table
- Tracks monthly conversation usage per user
- Links to `billing_subscriptions` via `clerk_user_id`
- Automatically resets per billing period
- Includes warning flags for 80%/100% usage notifications

### 3. Creates Qryx Tables
- `qryx_shops`: Links users to Shopify stores
- `qryx_conversations`: Tracks chat sessions
- `qryx_messages`: Stores individual messages

### 4. Creates Performance Indexes
- 11 indexes for optimized queries
- Foreign keys for data integrity

---

## 🐛 Troubleshooting

### Error: "column already exists"
✅ **This is SAFE** - The migration is idempotent. Just ignore this error.

### Error: "relation already exists"
✅ **This is SAFE** - Tables already exist. Migration complete.

### Error: "foreign key constraint violation"
❌ **Issue:** Make sure `users` table exists with `clerk_user_id` column.

**Fix:** Run the base schema first:
```sql
-- Ensure users table exists
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔍 Verification Commands

After migration, verify in Supabase SQL Editor:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_conversation_usage', 
  'qryx_shops', 
  'qryx_conversations', 
  'qryx_messages'
)
ORDER BY table_name;

-- Check if conversations_limit column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'billing_subscriptions'
AND column_name = 'conversations_limit';

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE '%user_conversation%' OR tablename LIKE 'qryx%'
ORDER BY tablename, indexname;
```

---

## 📞 Need Help?

If you encounter any issues:

1. **Check Supabase Logs:** Dashboard → Database → Logs
2. **Verify Base Schema:** Ensure `users` and `orgs` tables exist
3. **Contact Support:** Share the error message from SQL Editor

---

## ✅ After Migration Complete

**Tell the Agent:**

"Migration done! Let's continue with Phase 5B.2."

The agent will then proceed to:
1. Extend `lib/db/billing-helpers.ts` with usage tracking functions
2. Implement usage increment logic in chat API
3. Add limit enforcement guards
4. Update Stripe webhooks for plan changes

---

**Last Updated:** December 31, 2025  
**Phase:** 5B.1 - Core Infrastructure  
**Status:** Ready to Execute
