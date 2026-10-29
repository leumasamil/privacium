import { Suspense, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { usePriva } from '@/lib/priva/store';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SeloReferencia, useReferencias } from './ReferenciasExternas';

// Fora do PIOutput/docRef: dado de terceiro não é evidência própria. Não conectar
// este painel a trilha, hash, progresso, pendências ou geradores de PDFs/chancelas.
export function PainelNoticiasIncidentes() {
  const { cnpj, demo } = usePriva();
  return <section aria-label="Notícias públicas de incidentes" className="border-t pt-6 print:hidden" data-referencia-externa>
    <h2 className="mb-2 font-semibold">5 notícias mais recentes</h2><SeloReferencia />
    {cnpj && !demo ? <Suspense fallback={<div className="mt-4 space-y-3" role="status" aria-label="Carregando notícias">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>}><Noticias cnpj={cnpj} /></Suspense>
      : <p className="mt-4 text-sm text-muted-foreground">Referências públicas indisponíveis no modo demonstração.</p>}
  </section>;
}

function Noticias({ cnpj }: { cnpj: string }) {
  const { data, refetch, isFetching } = useReferencias(cnpj);
  const [, atualizarRelogio] = useState(0);
  useEffect(() => { const timer = setInterval(() => atualizarRelogio(n => n + 1), 60000); return () => clearInterval(timer); }, []);
  return <>
    <div className="my-4 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{data.atualizadoEm ? `Última atualização: ${new Date(data.atualizadoEm).toLocaleString('pt-BR')}` : 'Sem atualização disponível'}</p><Button variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}><RefreshCw className={isFetching ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden />Atualizar</Button></div>
    {data.erroNoticias ? <p role="status" className="text-sm text-muted-foreground">Não foi possível carregar referências agora</p>
      : <ol className="divide-y">{data.noticias.map(n => <li key={n.url} className="min-w-0 py-3"><a href={n.url} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between gap-3 text-sm font-medium underline-offset-4 hover:underline"><span className="min-w-0 break-words">{n.titulo}</span><ExternalLink className="mt-1 h-4 w-4 shrink-0" aria-hidden /></a><p className="mt-1 text-xs text-muted-foreground">{n.veiculo} · <time dateTime={n.data} title={new Date(n.data).toLocaleString('pt-BR')}>{formatDistanceToNow(new Date(n.data), { addSuffix: true, locale: ptBR })}</time></p></li>)}</ol>}
  </>;
}