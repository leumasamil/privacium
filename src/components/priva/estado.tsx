import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Circle, Loader2, Lock, OctagonAlert } from "lucide-react";
import type { Estado } from "@/lib/priva/pendencias";
import { cn } from "@/lib/utils";

/** Estado → token semântico + ícone + rótulo. Estado nunca é comunicado só por cor. */
export const ESTADO: Record<Estado, { rotulo: string; texto: string; badge: string; borda: string; icone: (c?: string) => ReactNode }> = {
  ok: { rotulo: "Concluído", texto: "text-concluido", badge: "bg-concluido-bg text-concluido border-concluido-border", borda: "border-l-concluido-border", icone: (c) => <CheckCircle2 className={cn("h-5 w-5 text-concluido", c)} aria-hidden /> },
  andamento: { rotulo: "Em andamento", texto: "text-pendencia", badge: "bg-pendencia-bg text-pendencia border-pendencia-border", borda: "border-l-pendencia-border", icone: (c) => <Loader2 className={cn("h-5 w-5 text-pendencia", c)} aria-hidden /> },
  pendente: { rotulo: "Pendente", texto: "text-pendencia", badge: "bg-pendencia-bg text-pendencia border-pendencia-border", borda: "border-l-pendencia-border", icone: (c) => <Circle className={cn("h-5 w-5 text-pendencia", c)} aria-hidden /> },
  atencao: { rotulo: "Atenção ao prazo", texto: "text-atencao", badge: "bg-atencao-bg text-atencao border-atencao-border", borda: "border-l-atencao-border", icone: (c) => <AlertTriangle className={cn("h-5 w-5 text-atencao", c)} aria-hidden /> },
  critico: { rotulo: "Crítico", texto: "text-critico", badge: "bg-critico-bg text-critico border-critico-border", borda: "border-l-critico-border", icone: (c) => <OctagonAlert className={cn("h-5 w-5 text-critico", c)} aria-hidden /> },
  bloqueado: { rotulo: "Aguardando item anterior", texto: "text-bloqueado", badge: "bg-bloqueado-bg text-bloqueado border-bloqueado-border", borda: "border-l-bloqueado-border", icone: (c) => <Lock className={cn("h-5 w-5 text-bloqueado", c)} aria-hidden /> },
};

export function EstadoBadge({ estado }: { estado: Estado }) {
  const e = ESTADO[estado];
  return <span className={cn("inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", e.badge)}>{e.rotulo}</span>;
}
