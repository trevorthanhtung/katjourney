import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://paaaxlboxspvirmrqkrq.supabase.co';
const supabaseKey = 'sb_publishable_d3B8_PO15vabIsN4IhVrjA_FR8bstuJ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('verify_share_access', { p_token: 'e4611daa18864b5da38dcfb6b51523885p9ut5em', p_pin: '2306' });
  console.log("DB Result 2306:", data, error);
  const { data: d2, error: e2 } = await supabase.rpc('verify_share_access', { p_token: 'e4611daa18864b5da38dcfb6b51523885p9ut5em', p_pin: null });
  console.log("DB Result NULL:", d2, e2);
}

check();
