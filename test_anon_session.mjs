import { createClient } from '@supabase/supabase-js'; 
const s = createClient('https://paaaxlboxspvirmrqkrq.supabase.co', 'sb_publishable_d3B8_PO15vabIsN4IhVrjA_FR8bstuJ'); 
async function run() { 
  await s.auth.signInAnonymously();
  const { data } = await s.rpc('verify_share_access', { p_token: '87f6de6d046e4b93a1059bbbf4ab3a64r04cotjk', p_pin: '2306' }); 
  console.log('Result for new token with Anonymous Session:', data); 
} 
run();
