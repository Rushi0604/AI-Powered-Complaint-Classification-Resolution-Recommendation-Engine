const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  // Test 1: Insert into User table
  console.log("Testing User upsert...");
  const { error: e1 } = await supabase.from('User').upsert({
    email: 'rls_test@example.com',
    user_name: 'rls_test',
    password: 'test123',
  }, { onConflict: 'email' });
  console.log("User result:", e1 ? e1.message : "OK");

  // Test 2: Insert into Complain_Data
  console.log("Testing Complain_Data insert...");
  const { error: e2 } = await supabase.from('Complain_Data').insert({
    complaint_id: Math.floor(Math.random() * 10000000) + 10000,
    email: 'rls_test@example.com',
    product_type: 'Electronic',
    date: '2026-01-01',
    category: 'Other',
    text: 'RLS test',
    resolve_status: 'submitted',
  });
  console.log("Complain_Data result:", e2 ? e2.message : "OK");
}
run();
