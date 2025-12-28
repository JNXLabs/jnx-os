require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔍 Verifying JNX-OS Schema...\n');

async function verify() {
  // Check orgs table
  const { data: orgsTest, error: orgsError } = await supabase
    .from('orgs')
    .select('*')
    .limit(1);

  if (orgsError) {
    console.log('❌ orgs table:', orgsError.message);
  } else {
    console.log('✅ orgs table: EXISTS');
    if (orgsTest && orgsTest.length > 0) {
      const columns = Object.keys(orgsTest[0]);
      console.log('   Primary Key:', columns.includes('org_id') ? '✅ org_id' : '❌ MISSING org_id');
      console.log('   All Columns:', columns.join(', '));
    } else {
      console.log('   Status: Empty (no rows yet)');
    }
  }

  // Check users table  
  const { data: usersTest, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (usersError) {
    console.log('❌ users table:', usersError.message);
  } else {
    console.log('✅ users table: EXISTS');
    if (usersTest && usersTest.length > 0) {
      const columns = Object.keys(usersTest[0]);
      console.log('   Primary Key:', columns.includes('user_id') ? '✅ user_id' : '❌ MISSING user_id');
      console.log('   All Columns:', columns.join(', '));
    } else {
      console.log('   Status: Empty (no rows yet)');
    }
  }

  console.log('\n📝 Expected Schema for Migration:');
  console.log('   ✅ orgs.org_id (Primary Key) - REQUIRED for Foreign Key');
  console.log('   ✅ users.user_id (Primary Key) - REQUIRED for Foreign Key');
  console.log('\n💡 Now run the corrected MIGRATION_QRYX_SHOPIFY.sql in Supabase!');
}

verify().then(() => console.log('\n✅ Verification complete!\n'));
