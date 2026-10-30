import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import type { EstadoIncidente } from '@/lib/priva/estadoIncidente';

import { useDemo, usePriva } from '@/lib/priva/store';
import { avisarAcaoDemo } from '@/lib/priva/demoAction';
export function EncerrarIncidente({ estado, busy, onClick }: { estado: EstadoIncidente; busy: boolean; onClick: () => void }) {
  const demo = useDemo();
  const { demoEncerrarIncidente } = usePriva();
  const clicar = () => {
    if (!demo) return onClick();
    // Encerramento cenográfico: só libera após o envio simulado; em memória, sem gravação.
    if (estado.podeEncerrar) {
      void demoEncerrarIncidente().then(() => toast.success('Incidente encerrado nesta sessão de demonstração. Nada foi gravado no banco.'));
    } else avisarAcaoDemo();
  };
  return <TooltipProvider><Tooltip><TooltipTrigger asChild><span tabIndex={estado.podeEncerrar ? -1 : 0} className="inline-flex max-w-full"><Button type="button" variant={estado.podeEncerrar ? 'default' : 'outline'} disabled={!demo && (!estado.podeEncerrar || busy)} onClick={clicar} className="h-auto min-h-9 whitespace-normal">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{busy ? 'Encerrando…' : estado.podeEncerrar ? 'Encerrar incidente' : `Encerrar incidente (${estado.motivos_bloqueio.length} pendências)`}</Button></span></TooltipTrigger>{!estado.podeEncerrar && <TooltipContent className="max-w-sm">{estado.motivos_bloqueio.join('; ')}</TooltipContent>}</Tooltip></TooltipProvider>;
}
