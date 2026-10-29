import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BASES_PUBLICAS } from '@/lib/priva/referenciasExternas';
import { SeloReferencia } from './ReferenciasExternas';

export function ConsultarBasesPublicas() {
  return <Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><ExternalLink aria-hidden />Consultar bases públicas →</Button></DialogTrigger>
    <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto" data-referencia-externa>
      <DialogHeader><DialogTitle>Bases públicas de incidentes</DialogTitle><DialogDescription>Referência externa — não integra o dossiê</DialogDescription></DialogHeader>
      <ul className="divide-y">{BASES_PUBLICAS.map(b => <li key={b.nome} className="py-3"><a href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 font-semibold underline underline-offset-4">{b.nome}<ExternalLink className="h-4 w-4 shrink-0" aria-hidden /></a><p className="mt-1 text-sm text-muted-foreground">{b.descricao}</p></li>)}</ul>
      <SeloReferencia />
    </DialogContent>
  </Dialog>;
}