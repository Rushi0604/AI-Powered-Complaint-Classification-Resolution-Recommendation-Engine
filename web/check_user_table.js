const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  // Check User table structure
  const { data, error } = await supabase.from('User').select('*').limit(3);
  console.log("User table sample:", JSON.stringify(data, null, 2));
  if (error) console.log("Error:", error);
}
run();
