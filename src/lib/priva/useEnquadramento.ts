import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePriva } from './store';
import { cicloSemestral } from './ciclo';
import type { CriteriosPorte, Porte } from './enquadramento';
import type { Database } from '@/integrations/supabase/types';
export type DeclaracaoPorte = Database['public']['Tables']['enquadramentos_agente']['Row'];
export function useEnquadramento() {
  const { cnpj, demo, demoPorte } = usePriva();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['enquadramento', cnpj, demo], enabled: !!cnpj && !demo, refetchInterval: 5000,
    queryFn: async () => {
      const [e, c] = await Promise.all([
        supabase.from('enquadramentos_agente').select('*').eq('empresa_cnpj', cnpj ?? '').order('assinado_em', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('ciclos_priva').select('finalizado_em').eq('empresa_cnpj', cnpj ?? '').order('finalizado_em', { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (e.error) throw e.error; if (c.error) throw c.error;
      const inicio = cicloSemestral(new Date()).inicio.getTime();
      return e.data && Date.parse(e.data.assinado_em) >= inicio && Date.parse(e.data.assinado_em) > Date.parse(c.data?.finalizado_em ?? '1970-01-01') ? e.data : null;
    },
  });
  const porte: Porte | null = demo ? demoPorte : q.data?.porte === 'PEQUENO' ? 'PEQUENO' : q.data ? 'COMPLETO' : null;
  const assinar = async (criterios: CriteriosPorte) => {
    if (!cnpj || demo) throw new Error('Assinatura disponível apenas na versão completa.');
    const { data, error } = await supabase.rpc('assinar_enquadramento', { _cnpj: cnpj, _criterios: criterios });
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ['enquadramento', cnpj] });
    return data;
  };
  return { ...q, porte, vigente: !!porte, declaracao: demo ? null : q.data, assinar };
}