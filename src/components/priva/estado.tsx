import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Circle, Clock, Lock, OctagonAlert } from "lucide-react";
import type { Estado } from "@/lib/priva/pendencias";
import { cn } from "@/lib/utils";

/** Estado → token semântico + ícone + rótulo. Estado nunca é comunicado só por cor. */
export const ESTADO: Record<Estado, { rotulo: string; texto: string; badge: string; borda: string; icone: (c?: string) => ReactNode }> = {
  ok: { rotulo: "Concluída", texto: "text-concluido", badge: "bg-concluido-bg text-concluido border-concluido-border", borda: "border-l-concluido-border", icone: (c) => <CheckCircle2 className={cn("h-5 w-5 text-concluido", c)} aria-hidden /> },
  andamento: { rotulo: "Em andamento", texto: "text-andamento", badge: "bg-andamento-bg text-andamento border-andamento-border", borda: "border-l-andamento-border", icone: (c) => <Clock className={cn("h-5 w-5 text-andamento", c)} aria-hidden /> },
  pendente: { rotulo: "Não iniciada", texto: "text-pendencia", badge: "bg-pendencia-bg text-pendencia border-pendencia-border", borda: "border-l-pendencia-border", icone: (c) => <Circle className={cn("h-5 w-5 text-pendencia", c)} aria-hidden /> },
  atencao: { rotulo: "Atenção ao prazo", texto: "text-atencao", badge: "bg-atencao-bg text-atencao border-atencao-border", borda: "border-l-atencao-border", icone: (c) => <AlertTriangle className={cn("h-5 w-5 text-atencao", c)} aria-hidden /> },
  critico: { rotulo: "Vencida / crítica", texto: "text-vencido", badge: "bg-vencido-bg text-vencido border-vencido-border", borda: "border-l-vencido-border", icone: (c) => <OctagonAlert className={cn("h-5 w-5 text-vencido", c)} aria-hidden /> },
  bloqueado: { rotulo: "Aguardando etapa anterior", texto: "text-bloqueado", badge: "bg-bloqueado-bg text-bloqueado border-bloqueado-border", borda: "border-l-bloqueado-border", icone: (c) => <Lock className={cn("h-5 w-5 text-bloqueado", c)} aria-hidden /> },
};

export function EstadoBadge({ estado }: { estado: Estado }) {
  const e = ESTADO[estado];
  return <span className={cn("inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", e.badge)}>{e.icone('h-3 w-3')}{e.rotulo}</span>;
}
