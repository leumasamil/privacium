import { useEffect, useId } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePriva } from './store';
import { DEMO_ROWS } from './demo';
import { carregarEstadoIncidente } from './estadoIncidente';

export function useEstadoBloco4(cnpj: string | null) {
  const { demo, signatures } = usePriva();
  const qc = useQueryClient();
  const subscriber = useId();
  const q = useQuery({
    queryKey: ['estado-bloco-4', cnpj, demo], enabled: !!cnpj,
    refetchInterval: demo ? false : 5000,
    queryFn: async () => {
      if (demo) return { lotes: DEMO_ROWS.lotes_pgaudit, incidentes: DEMO_ROWS.incidentes_seguranca };
      const [l, i] = await Promise.all([
        supabase.from('lotes_pgaudit').select('*').eq('empresa_cnpj', cnpj ?? '').order('mes_referencia', { ascending: false }),
        supabase.from('incidentes_seguranca').select('*').eq('empresa_cnpj', cnpj ?? '').order('iniciado_em', { ascending: false }),
      ]);
      if (l.error) throw l.error;
      if (i.error) throw i.error;
      return { lotes: l.data, incidentes: i.data };
    },
  });
  useEffect(() => {
    if (!cnpj || demo) return;
    const ch = supabase.channel(`estado-incidentes-${cnpj}-${subscriber}`);
    for (const table of ['incidentes_seguranca', 'lotes_pgaudit']) ch.on('postgres_changes', { event: '*', schema: 'public', table, filter: `empresa_cnpj=eq.${cnpj}` }, () => void qc.invalidateQueries({ queryKey: ['estado-bloco-4', cnpj] }));
    ch.subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [cnpj, demo, qc, subscriber]);
  const fonte = q.data ? { ...q.data, assinaturas: signatures, agora: Date.now() } : null;
  return { ...q, data: fonte ? { n: 4 as const, ...fonte, estados: fonte.incidentes.map(i => carregarEstadoIncidente(i.id, fonte)) } : undefined,
    refresh: () => qc.invalidateQueries({ queryKey: ['estado-bloco-4', cnpj] }) };
}