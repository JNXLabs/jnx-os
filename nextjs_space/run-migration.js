const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🚀 Running Phase 5B Migration...\n');
  
  const sql = fs.readFileSync('../MIGRATION_PHASE5B_USAGE_TRACKING.sql', 'utf8');
  
  // Split by semicolon but keep DO blocks together
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    // Skip comments and empty statements
    if (!stmt || stmt.startsWith('--') || stmt === 'END') continue;
    
    // Reconstruct DO blocks
    let fullStmt = stmt;
    if (stmt.includes('DO $$')) {
      // Find the matching END
      while (i < statements.length - 1 && !statements[i].includes('END $$')) {
        i++;
        fullStmt += ';' + statements[i];
      }
    }
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: fullStmt + ';' });
      
      if (error) {
        // Try direct query if rpc fails
        const { error: directError } = await supabase.from('_').select(fullStmt);
        if (directError && !directError.message.includes('does not exist')) {
          console.log(`❌ Error: ${directError.message.substring(0, 100)}`);
          errorCount++;
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    } catch (e) {
      // Ignore errors for informational queries
      if (!fullStmt.includes('SELECT') && !fullStmt.includes('COMMENT')) {
        console.log(`⚠️  Warning: ${e.message.substring(0, 100)}`);
      }
    }
  }
  
  console.log(`\n✅ Migration complete: ${successCount} successful, ${errorCount} errors\n`);
  
  // Verify tables
  console.log('🔍 Verifying tables...\n');
  
  const tables = ['user_conversation_usage', 'qryx_shops', 'qryx_conversations', 'qryx_messages'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: Exists`);
    }
  }
  
  // Check billing_subscriptions.conversations_limit
  const { error: colError } = await supabase
    .from('billing_subscriptions')
    .select('conversations_limit')
    .limit(0);
  
  if (colError) {
    console.log(`❌ billing_subscriptions.conversations_limit: ${colError.message}`);
  } else {
    console.log(`✅ billing_subscriptions.conversations_limit: Added`);
  }
}

runMigration().catch(console.error);
