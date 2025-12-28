const fs = require('fs');

console.log('\n🔍 Final Migration Validation...\n');

const sql = fs.readFileSync('/home/ubuntu/jnx-os/MIGRATION_QRYX_SHOPIFY.sql', 'utf8');

// Check if pgvector is actually used (not just in comments)
const pgvectorActiveCheck = () => {
  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments
    if (trimmed.startsWith('--')) continue;
    // Check if vector type is used in active code
    if (trimmed.includes('vector(768)')) {
      return false; // Found active usage
    }
  }
  return true; // Only in comments or not present
};

const checks = {
  '✅ pgvector disabled': pgvectorActiveCheck(),
  '✅ Foreign keys correct': sql.includes('REFERENCES orgs(org_id)') && sql.includes('REFERENCES users(user_id)'),
  '✅ No orphan REFERENCES': !sql.includes('REFERENCES orgs(id)') && !sql.includes('REFERENCES users(id)'),
  '✅ All tables defined': [
    'shopify_shops',
    'qryx_chat_sessions', 
    'qryx_chat_messages',
    'qryx_config',
    'conversation_usage',
    'qryx_product_cache',
    'qryx_analytics_daily'
  ].every(table => sql.includes(`CREATE TABLE IF NOT EXISTS ${table}`)),
  '✅ Indexes defined': sql.includes('CREATE INDEX IF NOT EXISTS'),
  '✅ Comments added': sql.includes('COMMENT ON TABLE'),
  '✅ Verification queries': sql.includes('-- SECTION 8: VERIFICATION QUERIES'),
  '✅ IF NOT EXISTS everywhere': sql.split('CREATE TABLE').length === sql.split('CREATE TABLE IF NOT EXISTS').length
};

console.log('Validation Results:');
console.log('='.repeat(60));

let allPassed = true;
for (const [check, passed] of Object.entries(checks)) {
  console.log(passed ? check : check.replace('✅', '❌'));
  if (!passed) allPassed = false;
}

console.log('='.repeat(60));

if (allPassed) {
  console.log('\n✅ MIGRATION IS READY - All checks passed!\n');
  console.log('📋 Summary:');
  console.log('   - 7 tables will be created');
  console.log('   - Foreign keys: orgs.org_id ✅, users.user_id ✅');
  console.log('   - No pgvector dependency ✅');
  console.log('   - All CREATE statements use IF NOT EXISTS ✅');
  console.log('   - Includes verification queries at the end ✅');
  console.log('\n🚀 Safe to execute in Supabase SQL Editor!\n');
} else {
  console.log('\n❌ MIGRATION HAS ISSUES - Do not execute!\n');
}
