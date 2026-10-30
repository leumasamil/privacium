import { toast } from 'sonner';

export const DEMO_ACTION_MESSAGE = 'Esta ação está disponível apenas na versão completa. Entre com sua conta para operar.';
export function avisarAcaoDemo(event?: { preventDefault: () => void }) {
  event?.preventDefault();
  toast.info(DEMO_ACTION_MESSAGE);
}