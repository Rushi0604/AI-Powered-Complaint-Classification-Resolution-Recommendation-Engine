const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('Complain_Data').select('*').limit(1);
  if (error) {
    console.log("Error fetching Complain_Data:", error.message);
  } else {
    console.log("Complain_Data sample:", JSON.stringify(data, null, 2));
  }
}
run();
