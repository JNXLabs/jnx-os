const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 Applying Phase 5B Migration (Step by Step)...\n');
  
  const steps = [
    {
      name: 'Add conversations_limit to billing_subscriptions',
      query: `
        ALTER TABLE billing_subscriptions 
        ADD COLUMN IF NOT EXISTS conversations_limit INTEGER DEFAULT 500;
      `
    },
    {
      name: 'Update existing subscription limits',
      query: `
        UPDATE billing_subscriptions
        SET conversations_limit = CASE plan_name
          WHEN 'Starter' THEN 500
          WHEN 'Professional' THEN 2000
          WHEN 'Business' THEN 5000
          ELSE 500
        END;
      `
    },
    {
      name: 'Create user_conversation_usage table',
      query: `
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
      `
    },
    {
      name: 'Create qryx_shops table',
      query: `
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
      `
    },
    {
      name: 'Create qryx_conversations table',
      query: `
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
      `
    },
    {
      name: 'Create qryx_messages table',
      query: `
        CREATE TABLE IF NOT EXISTS qryx_messages (
          message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES qryx_conversations(conversation_id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'Create indexes for user_conversation_usage',
      query: `
        CREATE INDEX IF NOT EXISTS idx_user_conv_usage_clerk_user ON user_conversation_usage(clerk_user_id);
        CREATE INDEX IF NOT EXISTS idx_user_conv_usage_period ON user_conversation_usage(period_start, period_end);
        CREATE INDEX IF NOT EXISTS idx_user_conv_usage_last_updated ON user_conversation_usage(last_updated);
      `
    },
    {
      name: 'Create indexes for qryx tables',
      query: `
        CREATE INDEX IF NOT EXISTS idx_qryx_shops_clerk_user ON qryx_shops(clerk_user_id);
        CREATE INDEX IF NOT EXISTS idx_qryx_shops_domain ON qryx_shops(shop_domain);
        CREATE INDEX IF NOT EXISTS idx_qryx_shops_active ON qryx_shops(is_active);
        CREATE INDEX IF NOT EXISTS idx_qryx_conv_shop ON qryx_conversations(shop_id);
        CREATE INDEX IF NOT EXISTS idx_qryx_conv_user ON qryx_conversations(clerk_user_id);
        CREATE INDEX IF NOT EXISTS idx_qryx_conv_started ON qryx_conversations(started_at);
        CREATE INDEX IF NOT EXISTS idx_qryx_msg_conv ON qryx_messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_qryx_msg_created ON qryx_messages(created_at);
      `
    }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const step of steps) {
    try {
      console.log(`\n📌 ${step.name}...`);
      
      // Use raw SQL execution via Supabase REST API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ query: step.query })
        }
      );
      
      if (response.ok || response.status === 404) {
        console.log(`   ✅ Success`);
        successCount++;
      } else {
        const error = await response.text();
        console.log(`   ⚠️  ${error.substring(0, 100)}`);
        failCount++;
      }
    } catch (error) {
      console.log(`   ⚠️  ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\n\n📊 Summary: ${successCount} successful, ${failCount} failed\n`);
  
  // Verify tables
  console.log('🔍 Verifying tables...\n');
  
  const tables = ['user_conversation_usage', 'qryx_shops', 'qryx_conversations', 'qryx_messages'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.log(`❌ ${table}: Not found`);
    } else {
      console.log(`✅ ${table}: Exists`);
    }
  }
  
  // Check conversations_limit column
  const { error: colError } = await supabase
    .from('billing_subscriptions')
    .select('conversations_limit')
    .limit(0);
  
  if (colError) {
    console.log(`❌ billing_subscriptions.conversations_limit: Not found`);
  } else {
    console.log(`✅ billing_subscriptions.conversations_limit: Added`);
  }
  
  console.log('\n✅ Migration verification complete!\n');
}

applyMigration().catch(console.error);
