import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ggohlcpajbumdfrqbwrp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Io8PwEoIcGix_9UJPIeZuQ_tRngqhFl';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('Testando conexão com Supabase...');
  
  const { data, error } = await supabase
    .from('medicos')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Erro ao buscar médicos:', error);
  } else {
    console.log('Resultados (Médicos):', data);
    console.log('Total recebido:', data?.length || 0);
  }

  const { data: codigos, error: codigosError } = await supabase
    .from('codigos_aghu')
    .select('*')
    .limit(5);

  if (codigosError) {
    console.error('Erro ao buscar códigos AGHU:', codigosError);
  } else {
    console.log('Resultados (Códigos):', codigos?.length || 0, 'itens recebidos.');
  }
}

testConnection();
