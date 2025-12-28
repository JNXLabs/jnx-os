require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔍 Checking Migration Prerequisites...\n');

async function checkPrerequisites() {
  const issues = [];
  
  // 1. Check if orgs table exists with correct structure
  console.log('1️⃣ Checking orgs table...');
  const { data: orgs, error: orgsError } = await supabase
    .from('orgs')
    .select('*')
    .limit(0);
  
  if (orgsError) {
    issues.push('❌ orgs table does not exist or is not accessible');
    console.log('   ❌ orgs table: NOT FOUND');
    console.log('   Error:', orgsError.message);
  } else {
    console.log('   ✅ orgs table: EXISTS');
    
    // Check if org_id column exists
    const { data: orgsColumns } = await supabase
      .from('orgs')
      .select('org_id')
      .limit(1);
    
    if (orgsColumns !== undefined) {
      console.log('   ✅ org_id column: EXISTS');
    }
  }
  
  // 2. Check if users table exists with correct structure
  console.log('\n2️⃣ Checking users table...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(0);
  
  if (usersError) {
    issues.push('❌ users table does not exist or is not accessible');
    console.log('   ❌ users table: NOT FOUND');
    console.log('   Error:', usersError.message);
  } else {
    console.log('   ✅ users table: EXISTS');
    
    // Check if user_id column exists
    const { data: usersColumns } = await supabase
      .from('users')
      .select('user_id')
      .limit(1);
    
    if (usersColumns !== undefined) {
      console.log('   ✅ user_id column: EXISTS');
    }
  }
  
  // 3. Check if any Qryx tables already exist
  console.log('\n3️⃣ Checking for existing Qryx tables...');
  const qryxTables = [
    'shopify_shops',
    'qryx_chat_sessions',
    'qryx_chat_messages',
    'qryx_config',
    'conversation_usage',
    'qryx_product_cache',
    'qryx_analytics_daily'
  ];
  
  for (const table of qryxTables) {
    const { error } = await supabase
      .from(table)
      .select('count')
      .limit(1);
    
    if (!error) {
      console.log(`   ⚠️  ${table}: ALREADY EXISTS (will be skipped by CREATE TABLE IF NOT EXISTS)`);
    }
  }
  
  // 4. Summary
  console.log('\n' + '='.repeat(60));
  if (issues.length === 0) {
    console.log('✅ ALL PREREQUISITES MET - MIGRATION READY TO RUN');
    console.log('\nYou can safely execute MIGRATION_QRYX_SHOPIFY.sql in Supabase');
  } else {
    console.log('❌ PREREQUISITES NOT MET - DO NOT RUN MIGRATION YET');
    console.log('\nIssues found:');
    issues.forEach(issue => console.log('  -', issue));
    console.log('\nYou need to run the base JNX-OS schema first!');
    console.log('Execute: lib/db/schema-v2.sql in Supabase before Qryx migration');
  }
  console.log('='.repeat(60) + '\n');
}

checkPrerequisites();
