import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePriva } from './store';
export function useMonitorFornecedores() {
  const { cnpj, demo } = usePriva();
  return useQuery({ queryKey: ['monitor-fornecedores', cnpj, demo], enabled: !!cnpj && !demo, refetchInterval: 60000, queryFn: async () => {
    const [m, v, r] = await Promise.all([supabase.from('monitor_fornecedores').select('*').eq('empresa_cnpj', cnpj ?? '').order('data_vazamento', { ascending: false }), supabase.from('monitor_verificacoes').select('*').eq('empresa_cnpj', cnpj ?? '').maybeSingle(), supabase.from('registro_operacoes').select('id,codigo').eq('empresa_cnpj', cnpj ?? '')]);
    if (m.error || v.error || r.error) throw new Error('Não foi possível ler o monitor');
    return { itens: m.data, verificacao: v.data, processos: r.data };
  } });
}