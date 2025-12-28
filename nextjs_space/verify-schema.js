require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔍 Verifying JNX-OS Schema...\n');

async function verify() {
  // Check orgs table structure
  const { data: orgsColumns, error: orgsError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'orgs'
      ORDER BY ordinal_position;
    `
  }).catch(() => ({ data: null, error: null }));

  // Alternative method: Query the table
  const { data: orgsTest, error: orgsTestError } = await supabase
    .from('orgs')
    .select('*')
    .limit(1);

  if (orgsTestError) {
    console.log('❌ orgs table:', orgsTestError.message);
  } else {
    console.log('✅ orgs table: EXISTS');
    if (orgsTest && orgsTest.length > 0) {
      console.log('   Columns:', Object.keys(orgsTest[0]).join(', '));
    }
  }

  // Check users table structure  
  const { data: usersTest, error: usersTestError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (usersTestError) {
    console.log('❌ users table:', usersTestError.message);
  } else {
    console.log('✅ users table: EXISTS');
    if (usersTest && usersTest.length > 0) {
      console.log('   Columns:', Object.keys(usersTest[0]).join(', '));
    }
  }

  console.log('\n📝 Expected Schema:');
  console.log('   orgs: org_id (PK), clerk_org_id, name, created_at, updated_at');
  console.log('   users: user_id (PK), clerk_user_id, email, first_name, last_name, org_id (FK), role, created_at, updated_at, deleted_at');
}

verify().then(() => console.log('\n✅ Verification complete!\n'));
