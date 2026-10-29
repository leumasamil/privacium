import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePriva } from '@/lib/priva/store';

export function AvisoModoDemo() {
  const { demo, setDemo } = usePriva();
  if (!demo) return null;

  return (
    <div role="status" className="sticky top-0 z-40 mb-6 flex flex-col items-start justify-between gap-3 border border-warning bg-warning px-4 py-3 text-sm text-warning-foreground sm:flex-row sm:items-center">
      <span className="flex min-w-0 w-full items-start gap-2 font-medium sm:flex-1">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Modo demonstração — as ações estão desativadas. Desative o modo demo no menu para operar.</span>
      </span>
      <Button variant="outline" className="h-auto max-w-full shrink-0 whitespace-normal" onClick={() => setDemo(false)}>
        <X className="h-4 w-4" aria-hidden="true" /> Sair do modo demonstração
      </Button>
    </div>
  );
}