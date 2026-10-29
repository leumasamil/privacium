import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ExternalLink } from 'lucide-react';
import { usePriva } from '@/lib/priva/store';
import { consultarReferenciasExternas } from '@/lib/priva/referenciasExternas.functions';
import { CACHE_NOTICIAS_MS, casosSemelhantes, type ReferenciasPublicas } from '@/lib/priva/referenciasExternas';
import { Skeleton } from '@/components/ui/skeleton';

export function SeloReferencia() {
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><ExternalLink className="h-3 w-3 shrink-0" aria-hidden />Referência externa — não integra o dossiê</span>;
}

export function useReferencias(cnpj: string) {
  const consultar = useServerFn(consultarReferenciasExternas);
  return useSuspenseQuery({ queryKey: ['referencias-externas', cnpj], staleTime: CACHE_NOTICIAS_MS, refetchInterval: CACHE_NOTICIAS_MS, retry: false,
    queryFn: async (): Promise<ReferenciasPublicas> => {
      try { return await consultar({ data: { cnpj } }); }
      catch { return { casos: [], noticias: [], atualizadoEm: '', erroCasos: true, erroNoticias: true }; }
    },
  });
}

export function CasosPublicosSemelhantes({ natureza, categorias }: { natureza: string; categorias: string[] }) {
  const { cnpj, demo } = usePriva();
  return <aside className="mt-5 min-w-0 border-t pt-5 print:hidden" data-referencia-externa>
    <h3 className="mb-2 font-semibold">Casos públicos semelhantes</h3><SeloReferencia />
    {cnpj && !demo ? <Suspense fallback={<Skeleton className="mt-3 h-24 w-full" />}><Casos cnpj={cnpj} natureza={natureza} categorias={categorias} /></Suspense>
      : <p className="mt-3 text-sm text-muted-foreground">Referências públicas indisponíveis no modo demonstração.</p>}
  </aside>;
}

function Casos({ cnpj, natureza, categorias }: { cnpj: string; natureza: string; categorias: string[] }) {
  const { data } = useReferencias(cnpj);
  const casos = casosSemelhantes(data.casos, natureza, categorias);
  if (data.erroCasos) return <p role="status" className="mt-3 text-sm text-muted-foreground">Não foi possível carregar referências agora</p>;
  if (!casos.length) return <p className="mt-3 text-sm text-muted-foreground">Nenhum caso semelhante identificado nas categorias selecionadas.</p>;
  return <ul className="mt-4 grid gap-3 lg:grid-cols-3">{casos.map(c => <li key={c.url} className="min-w-0 rounded-md border p-3 text-sm">
    <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between gap-2 font-semibold underline underline-offset-4">{c.nome}<ExternalLink className="mt-1 h-3 w-3 shrink-0" aria-hidden /></a>
    <p className="mt-2 text-xs text-muted-foreground">{new Date(`${c.data}T12:00:00Z`).toLocaleDateString('pt-BR')} · {c.contas.toLocaleString('pt-BR')} contas</p>
    <p className="my-2 break-words text-xs">Dados pessoais comprometidos: {c.categorias.join(', ')}</p>
    <span className="text-xs text-muted-foreground">Referência externa · não integra o dossiê</span>
  </li>)}</ul>;
}