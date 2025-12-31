const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('📊 Checking billing_subscriptions structure...\n');
  
  // Get columns
  const { data, error } = await supabase
    .rpc('exec_sql', {
      sql_query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'billing_subscriptions'
        ORDER BY ordinal_position;
      `
    });
  
  if (error) {
    // Fallback: Try direct select to see what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .limit(0);
    
    console.log('Sample query result:', sampleError || 'Success');
    
    // Try to insert a test record to see required fields
    const { error: insertError } = await supabase
      .from('billing_subscriptions')
      .insert({})
      .select();
    
    console.log('\n❌ Insert test (shows required fields):', insertError?.message || 'Success');
  } else {
    console.log('Columns:', data);
  }
  
  // Check conversation_usage
  console.log('\n📊 Checking conversation_usage structure...\n');
  
  const { error: usageError } = await supabase
    .from('conversation_usage')
    .insert({})
    .select();
  
  console.log('Insert test result:', usageError?.message || 'Success');
}

checkSchema().catch(console.error);
