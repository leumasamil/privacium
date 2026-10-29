import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePriva } from '@/lib/priva/store';
import { useEstadoBloco4 } from '@/lib/priva/useEstadoBloco4';
import { FormularioANPD } from '@/components/priva/FormularioANPD';
import { EncerrarIncidente } from '@/components/priva/EncerrarIncidente';
import { BlockGate, PageHeader } from '@/components/priva/ui';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_authenticated/bloco-4_/anpd/$incidenteId')({
  head: () => ({ meta: [
    { title: 'Comunicação ANPD do incidente — Privacium' },
    { name: 'description', content: 'Comunicação simulada de incidente à ANPD com riscos e medidas assistidos e rastreabilidade normativa.' },
    { property: 'og:title', content: 'Comunicação ANPD do incidente — Privacium' },
    { property: 'og:description', content: 'Formulário assistido de comunicação ANPD por incidente, com contato do encarregado e fontes normativas.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: PaginaANPD,
});
function PaginaANPD() {
  const { incidenteId } = Route.useParams();
  const { roles, demo, cnpj, selectEmpresa, log } = usePriva();
  const [busy, setBusy] = useState(false);
  const incidente = useQuery({ queryKey: ['incidente-anpd', incidenteId], enabled: !demo,
    queryFn: async () => {
      const { data, error } = await supabase.from('incidentes_seguranca').select('*').eq('id', incidenteId).maybeSingle();
      if (error) throw error; return data;
    },
  });
  const consulta = useEstadoBloco4(incidente.data?.empresa_cnpj ?? cnpj);
  useEffect(() => { if (incidente.data && incidente.data.empresa_cnpj !== cnpj) selectEmpresa(incidente.data.empresa_cnpj); }, [incidente.data?.empresa_cnpj, cnpj]);
  useEffect(() => { if (incidente.data) log('SELECT', 'incidentes_seguranca', `Abertura do formulário ANPD do incidente ${incidenteId}`); }, [incidenteId, incidente.data?.empresa_cnpj, log]);
  const atual = consulta.data?.incidentes.find(i => i.id === incidenteId);
  const estado = consulta.data?.estados.find(e => e.incidente.id === incidenteId);
  const refresh = async () => { await Promise.all([consulta.refresh(), incidente.refetch()]); };
  const encerrar = async () => {
    if (!estado?.podeEncerrar || busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('encerrar_incidente', { _incidente: incidenteId });
      if (error) throw error;
      const resultado = data as { encerrado?: boolean } | null;
      if (!resultado?.encerrado) { toast.error('Confira as pendências de encerramento.'); await refresh(); return; }
      await refresh(); toast.success('Incidente encerrado. Trilha de auditoria registrada.');
    } catch (error) { console.error('Falha no encerramento ANPD', error); toast.error('Não foi possível encerrar. Tente novamente.'); }
    finally { setBusy(false); }
  };
  if (incidente.isError || consulta.isError) return <div role="alert">Não foi possível carregar o incidente. <Button onClick={() => void refresh()}>Tentar novamente</Button></div>;
  if (incidente.isLoading || (incidente.data && !consulta.data)) return <p role="status">Carregando incidente…</p>;
  if (!atual || !estado) return <div><p role="alert">Incidente não encontrado ou sem acesso para este perfil.</p><Button asChild variant="outline"><Link to="/bloco-4">Voltar ao Bloco 4</Link></Button></div>;
  const canEdit = !demo && (roles.includes('DPO_OPERACIONAL') || roles.includes('ADMIN_SISTEMA'));
  const encerramento = canEdit ? <EncerrarIncidente estado={estado} busy={busy} onClick={() => void encerrar()} /> : null;
  return <BlockGate n={4}><div className="space-y-4"><PageHeader eyebrow={`Bloco 4 · Incidente #${incidenteId.slice(0, 6)}`} title="Comunicação à ANPD"><Button asChild variant="outline"><Link to="/bloco-4" hash="incidentes">Voltar às etapas do incidente</Link></Button></PageHeader><FormularioANPD key={incidenteId} incidente={atual} estado={estado} encerramento={encerramento} canEdit={canEdit} refresh={refresh} />{atual.encerrado_em && <Button asChild><Link to="/bloco-4" hash="assinatura">Assinar o PI-04</Link></Button>}</div></BlockGate>;
}