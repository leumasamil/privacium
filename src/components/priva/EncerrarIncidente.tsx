import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import type { EstadoIncidente } from '@/lib/priva/estadoIncidente';

export function EncerrarIncidente({ estado, busy, onClick }: { estado: EstadoIncidente; busy: boolean; onClick: () => void }) {
  return <TooltipProvider><Tooltip><TooltipTrigger asChild><span tabIndex={estado.podeEncerrar ? -1 : 0} className="inline-flex max-w-full"><Button type="button" variant={estado.podeEncerrar ? 'default' : 'outline'} disabled={!estado.podeEncerrar || busy} onClick={onClick} className="h-auto min-h-9 whitespace-normal">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{busy ? 'Encerrando…' : estado.podeEncerrar ? 'Encerrar incidente' : `Encerrar incidente (${estado.motivos_bloqueio.length} pendências)`}</Button></span></TooltipTrigger>{!estado.podeEncerrar && <TooltipContent className="max-w-sm">{estado.motivos_bloqueio.join('; ')}</TooltipContent>}</Tooltip></TooltipProvider>;
}