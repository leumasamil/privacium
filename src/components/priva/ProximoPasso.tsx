import { Link, useLocation } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Hourglass, Lock, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePriva, isUnlocked } from "@/lib/priva/store";
import { montarChecklist, pendenciasKanban } from "@/lib/priva/pendencias";
import { blocoCorrente, calcularProximoPasso, type Passo } from "@/lib/priva/proximoPasso";
import { cn } from "@/lib/utils";
import { useDadosBloco } from "./TelaBloqueio";

const TOM: Record<Passo["tipo"], { caixa: string; icone: React.ReactNode; rotulo: string }> = {
  acao: { caixa: "border-andamento-border bg-andamento-bg", icone: <Navigation className="h-4 w-4 text-andamento" aria-hidden />, rotulo: "Próximo passo" },
  travado: { caixa: "border-pendencia-border bg-pendencia-bg", icone: <Lock className="h-4 w-4 text-pendencia" aria-hidden />, rotulo: "Próximo passo · bloco anterior" },
  aguardando: { caixa: "border-bloqueado-border bg-bloqueado-bg", icone: <Hourglass className="h-4 w-4 text-bloqueado" aria-hidden />, rotulo: "Aguardando outro perfil" },
  concluido: { caixa: "border-concluido-border bg-concluido-bg", icone: <CheckCircle2 className="h-4 w-4 text-concluido" aria-hidden />, rotulo: "Etapa concluída" },
};

/** Faixa única de condução, exibida no topo de todas as telas autenticadas. */
export function ProximoPasso() {
  const { pathname } = useLocation();
  const { cnpj, signatures, roles, kanban, log } = usePriva();
  const m = pathname.match(/^\/bloco-(\d)/);
  const blocoTela = m ? Number(m[1]) : Math.min(blocoCorrente(signatures), 5);
  const blocoBase = isUnlocked(signatures, blocoTela) ? blocoTela : blocoTela - 1;
  const { data } = useDadosBloco(blocoBase, cnpj);
  if (!cnpj || pathname.startsWith("/manual")) return null;

  let itens = data ? montarChecklist(data, signatures) : [];
  if (pathname.startsWith("/kanban")) {
    const k = pendenciasKanban(kanban).filter((p) => p.estado !== "ok");
    if (k.length) itens = k;
  }
  if (!data && !itens.length) return null;
  const passo = calcularProximoPasso({ blocoTela, blocoBase, itens, roles });
  const t = TOM[passo.tipo];
  const naMesmaTela = pathname === passo.link.to;

  const ir = (e: React.MouseEvent) => {
    if (naMesmaTela && passo.link.hash) {
      e.preventDefault();
      const el = document.getElementById(passo.link.hash);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => (el?.querySelector<HTMLElement>("input:not([disabled]):placeholder-shown, textarea:not([disabled]):placeholder-shown, button:not([disabled])"))?.focus(), 400);
    }
  };

  return (
    <section aria-live="polite" className={cn("mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-l-4 p-4 transition-colors", t.caixa)}>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t.icone} {t.rotulo}</p>
        <p className="mt-1 text-sm font-medium text-primary">{passo.frase}</p>
        {passo.pendentes > 1 && (
          <Link to={`/bloco-${passo.bloco}` as "/bloco-1"} className="text-xs text-muted-foreground underline underline-offset-2">Ver todos os pendentes ({passo.pendentes})</Link>
        )}
      </div>
      {passo.tipo === "aguardando" ? (
        <Button variant="outline" onClick={() => { log("INSERT", "solicitacao_assinatura", `Solicitada ação de ${passo.pendencia?.responsavel}: ${passo.pendencia?.titulo}`); toast.success("Solicitação registrada na trilha de auditoria."); }}>{passo.botao}</Button>
      ) : (
        <Button asChild><Link to={passo.link.to as "/painel"} hash={passo.link.hash} onClick={ir}>{passo.botao} <ArrowRight className="h-4 w-4" /></Link></Button>
      )}
    </section>
  );
}
