import { createClient } from '@supabase/supabase-js'; 
const s = createClient('https://paaaxlboxspvirmrqkrq.supabase.co', 'sb_publishable_d3B8_PO15vabIsN4IhVrjA_FR8bstuJ'); 
async function run() { 
  const { data: { session } } = await s.auth.signInAnonymously();
  // We can't query public_shares directly without RLS?
  // Let's just use the RPC to verify
  const { data } = await s.rpc('verify_share_access', { p_token: 'd6e88f5c4eb8430ca4bb6cc41ff1533dis0qeza4', p_pin: '2306' }); 
  console.log('Result for new token with Anonymous Session:', data); 
} 
run();
