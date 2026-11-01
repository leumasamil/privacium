import { createFileRoute, useHydrated } from '@tanstack/react-router';
import { PrivaProvider, usePriva } from '@/lib/priva/store';
import { AppShell } from '@/components/priva/AppShell';
import { Painel } from '@/components/priva/views/Painel';
import { Bloco1 } from '@/components/priva/views/Bloco1';
import { Bloco2 } from '@/components/priva/views/Bloco2';
import { Bloco3 } from '@/components/priva/views/Bloco3';
import { Bloco4 } from '@/components/priva/views/Bloco4';
import { Bloco5 } from '@/components/priva/views/Bloco5';
import { Kanban } from '@/components/priva/views/Kanban';
import { Pendencias } from '@/components/priva/views/Pendencias';
import { Manual } from '@/components/priva/views/Manual';
import { Glossario } from '@/components/priva/views/Glossario';
import { Auditoria } from '@/components/priva/views/Auditoria';
import { FormularioANPD } from '@/components/priva/FormularioANPD';
import { EncarregadoDPO } from '@/components/priva/EncarregadoDPO';
import { EncerrarIncidente } from '@/components/priva/EncerrarIncidente';
import { QualidadeNormativa } from '@/components/priva/views/QualidadeNormativa';
import { SolicitacoesTitular } from '@/components/priva/views/SolicitacoesTitular';
import { useEstadoBloco4 } from '@/lib/priva/useEstadoBloco4';
import { BUILD_INFO } from '@/lib/priva/buildInfo';

const ABAS = ['painel', 'bloco-1', 'bloco-2', 'bloco-3', 'bloco-4', 'bloco-5', 'anpd', 'kanban', 'pendencias', 'manual', 'glossario', 'auditoria', 'encarregado', 'qualidade-normativa', 'titulares'];
export const Route = createFileRoute('/demo')({
  validateSearch: (search: Record<string, unknown>): { aba?: string; cenario?: string | undefined } => ({ aba: typeof search['aba'] === 'string' && ABAS.includes(search['aba']) ? search['aba'] : 'painel', cenario: search['cenario'] === 'origem-ausente' ? 'origem-ausente' : undefined }),
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
  const { aba, cenario } = Route.useSearch();
  const hydrated = useHydrated();
  if (!hydrated) return <p role="status" className="p-8 text-muted-foreground">Carregando demonstração…</p>;
  return <PrivaProvider initialDemo><AppShell><DemoConteudo aba={aba ?? "painel"} cenario={cenario} /><footer data-testid="build-publico" className="mt-8 border-t pt-3 text-xs text-muted-foreground break-all">Identificador da entrega (SHA-256 do código): {BUILD_INFO.id}<br />Preparação: {BUILD_INFO.builtAt} · Commit de base: {BUILD_INFO.baseCommit}</footer></AppShell></PrivaProvider>;
}
function DemoConteudo({ aba, cenario }: { aba: string; cenario?: string | undefined }) {
  switch (aba) {
    case 'bloco-1': return <Bloco1 />;
    case 'bloco-2': return <Bloco2 origemAusente={cenario === 'origem-ausente'} />;
    case 'bloco-3': return <Bloco3 />;
    case 'bloco-4': return <Bloco4 />;
    case 'bloco-5': return <Bloco5 />;
    case 'kanban': return <Kanban />;
    case 'pendencias': return <Pendencias />;
    case 'manual': return <Manual aba="guias" />;
    case 'glossario': return <Glossario />;
    case 'auditoria': return <Auditoria />;
    case 'encarregado': return <EncarregadoDPO />;
    case 'qualidade-normativa': return <QualidadeNormativa />;
    case 'titulares': return <SolicitacoesTitular />;
    case 'anpd': return <DemoANPD />;
    default: return <Painel />;
  }
}

/** Aba ANPD da demonstração: lê a MESMA fonte de estado do Bloco 4 (seed + sessão simulada em memória). */
function DemoANPD() {
  const { cnpj } = usePriva();
  const consulta = useEstadoBloco4(cnpj);
  const incidente = consulta.data?.incidentes[0];
  const estado = consulta.data?.estados.find(e => e.incidente.id === incidente?.id);
  if (!incidente || !estado) return <p role="status" className="p-4 text-muted-foreground">Lendo o estado do incidente…</p>;
  return <FormularioANPD incidente={incidente} estado={estado} canEdit refresh={() => undefined} encerramento={<EncerrarIncidente estado={estado} busy={false} onClick={() => undefined} />} />;
}
