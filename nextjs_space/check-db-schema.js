const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking current database schema...\n');
  
  // Check if billing_subscriptions exists
  const { data: billingData, error: billingError } = await supabase
    .from('billing_subscriptions')
    .select('*')
    .limit(1);
  
  if (billingError) {
    console.log('❌ billing_subscriptions table:', billingError.message);
  } else {
    console.log('✅ billing_subscriptions table exists');
  }
  
  // Check if qryx_shops exists
  const { data: qryxData, error: qryxError } = await supabase
    .from('qryx_shops')
    .select('*')
    .limit(1);
  
  if (qryxError) {
    console.log('❌ qryx_shops table:', qryxError.message);
  } else {
    console.log('✅ qryx_shops table exists');
  }
  
  // Check if conversation_usage exists
  const { data: usageData, error: usageError } = await supabase
    .from('conversation_usage')
    .select('*')
    .limit(1);
  
  if (usageError) {
    console.log('❌ conversation_usage table:', usageError.message);
  } else {
    console.log('✅ conversation_usage table exists');
  }
  
  // Check billing_customers
  const { data: customersData, error: customersError } = await supabase
    .from('billing_customers')
    .select('*')
    .limit(1);
  
  if (customersError) {
    console.log('❌ billing_customers table:', customersError.message);
  } else {
    console.log('✅ billing_customers table exists');
  }
}

checkSchema().catch(console.error);
