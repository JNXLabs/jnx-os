require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔍 Verifying Qryx Migration...\n');

async function verify() {
  const tables = [
    'shopify_shops',
    'qryx_chat_sessions', 
    'qryx_chat_messages',
    'qryx_config',
    'conversation_usage',
    'qryx_product_cache',
    'qryx_analytics_daily'
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`❌ ${table}: NOT FOUND`);
    } else {
      console.log(`✅ ${table}: EXISTS`);
    }
  }
}

verify().then(() => console.log('\n✅ Verification complete!\n'));
