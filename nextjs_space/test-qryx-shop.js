require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Qryx Shop Query...');
console.log('Supabase URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: Check if shopify_shops table exists
supabase
  .from('shopify_shops')
  .select('count')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Table Error:', error.message);
      console.error('Error Code:', error.code);
      console.error('Error Details:', error.details);
    } else {
      console.log('✅ shopify_shops table exists!');
      console.log('Data:', data);
      
      // Test 2: Try to query by org_id
      return supabase
        .from('shopify_shops')
        .select('*')
        .eq('org_id', 'test-org-id')
        .is('deleted_at', null)
        .is('uninstalled_at', null)
        .single();
    }
  })
  .then(result => {
    if (result) {
      const { data, error } = result;
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('✅ Query syntax correct - No shop found (expected)');
        } else {
          console.error('❌ Query Error:', error.message);
          console.error('Error Code:', error.code);
        }
      } else {
        console.log('✅ Found shop:', data);
      }
    }
  })
  .catch(err => {
    console.error('❌ Unexpected Error:', err);
  });
