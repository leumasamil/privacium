import { createFileRoute, useHydrated } from '@tanstack/react-router';
import { PrivaProvider } from '@/lib/priva/store';
import { AppShell } from '@/components/priva/AppShell';
import { BlockGate } from '@/components/priva/ui';
import { Painel } from '@/components/priva/views/Painel';
import { Bloco1 } from '@/components/priva/views/Bloco1';
import { Bloco2 } from '@/components/priva/views/Bloco2';
import { Bloco3 } from '@/components/priva/views/Bloco3';
import { Bloco4 } from '@/components/priva/views/Bloco4';
import { Bloco5 } from '@/components/priva/views/Bloco5';
import { Kanban } from '@/components/priva/views/Kanban';
import { Manual } from '@/components/priva/views/Manual';
import { Glossario } from '@/components/priva/views/Glossario';
import { Auditoria } from '@/components/priva/views/Auditoria';
import { FormularioANPD } from '@/components/priva/FormularioANPD';
import { EncarregadoDPO } from '@/components/priva/EncarregadoDPO';
import { DEMO_ROWS, DEMO_PUBLIC_SIGNATURES } from '@/lib/priva/demo';
import { carregarEstadoIncidente } from '@/lib/priva/estadoIncidente';
import { EncerrarIncidente } from '@/components/priva/EncerrarIncidente';
import { avisarAcaoDemo } from '@/lib/priva/demoAction';

const ABAS = ['painel', 'bloco-1', 'bloco-2', 'bloco-3', 'bloco-4', 'bloco-5', 'anpd', 'kanban', 'manual', 'glossario', 'auditoria', 'encarregado'];
export const Route = createFileRoute('/demo')({
  validateSearch: (search: Record<string, unknown>): { aba?: string } => ({ aba: typeof search['aba'] === 'string' && ABAS.includes(search['aba']) ? search['aba'] : 'painel' }),
  head: () => ({ meta: [
    { title: 'Demonstração — Privacium' },
    { name: 'description', content: 'Demonstração cenográfica do Método BLLOCO, isolada dos dados de clientes.' },
    { property: 'og:title', content: 'Demonstração — Privacium' },
    { property: 'og:description', content: 'Conheça os blocos da Privacium em um cenário fictício e isolado.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, nofollow' },
  ] }),
  component: DemoPage,
});

function DemoPage() {
  const { aba } = Route.useSearch();
  const hydrated = useHydrated();
  if (!hydrated) return <p role="status" className="p-8 text-muted-foreground">Carregando demonstração…</p>;
  return <PrivaProvider initialDemo><AppShell><DemoConteudo aba={aba ?? "painel"} /></AppShell></PrivaProvider>;
}
function DemoConteudo({ aba }: { aba: string }) {
  switch (aba) {
    case 'bloco-1': return <Bloco1 />;
    case 'bloco-2': return <BlockGate n={2}><Bloco2 /></BlockGate>;
    case 'bloco-3': return <BlockGate n={3}><Bloco3 /></BlockGate>;
    case 'bloco-4': return <BlockGate n={4}><Bloco4 /></BlockGate>;
    case 'bloco-5': return <BlockGate n={5}><Bloco5 /></BlockGate>;
    case 'kanban': return <Kanban />;
    case 'manual': return <Manual aba="guias" />;
    case 'glossario': return <Glossario />;
    case 'auditoria': return <Auditoria />;
    case 'encarregado': return <EncarregadoDPO />;
    case 'anpd': {
      const incidente = DEMO_ROWS.incidentes_seguranca[0];
      if (!incidente) return null;
      const estado = carregarEstadoIncidente(incidente.id, { incidentes: DEMO_ROWS.incidentes_seguranca, lotes: DEMO_ROWS.lotes_pgaudit, assinaturas: DEMO_PUBLIC_SIGNATURES, agora: Date.parse(incidente.iniciado_em) });
      return <FormularioANPD incidente={incidente} estado={estado} canEdit refresh={() => undefined} encerramento={<EncerrarIncidente estado={estado} busy={false} onClick={avisarAcaoDemo} />} />;
    }
    default: return <Painel />;
  }
}