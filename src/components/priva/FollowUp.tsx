import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Mail, AlertTriangle, Siren, PartyPopper } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cicloSemestral } from "@/lib/priva/ciclo";
import { cn } from "@/lib/utils";

const fmt = (d: Date) => d.toLocaleDateString("pt-BR");

function emails(c: ReturnType<typeof cicloSemestral>) {
  const base = [
    { para: "DPO", assunto: `Abertura do ${c.rotulo}: iniciar Delta de Riscos no Bloco 1`, quando: c.inicio },
    { para: "C-Suite", assunto: `Calendário de governança do ${c.rotulo}`, quando: c.inicio },
  ];
  if (c.diasRestantes <= 30) base.push(
    { para: "DPO", assunto: "Faltam 30 dias: revisar ROT e logs forenses", quando: new Date(c.fim.getTime() - 30 * 864e5) },
    { para: "C-Suite", assunto: "Faltam 30 dias: validar riscos do semestre", quando: new Date(c.fim.getTime() - 30 * 864e5) },
  );
  if (c.diasRestantes <= 7) base.push(
    { para: "DPO", assunto: `URGENTE: congelamento do Snapshot em ${fmt(c.congelamento)} e emissão do PI-05`, quando: new Date(c.fim.getTime() - 7 * 864e5) },
    { para: "C-Suite", assunto: "URGENTE: assinatura da Diretoria no PI-05", quando: new Date(c.fim.getTime() - 7 * 864e5) },
  );
  return base.reverse();
}

export function FollowUpBanner() {
  const c = cicloSemestral(new Date());
  const [welcome, setWelcome] = useState(false);
  useEffect(() => {
    const k = `priva-boasvindas-${c.inicio.toISOString().slice(0, 10)}`;
    if (c.fase === "dia1" && !localStorage.getItem(k)) { localStorage.setItem(k, "1"); setWelcome(true); }
  }, [c.fase, c.inicio]);

  return (
    <>
      {c.fase === "alerta30" && (
        <div className="-mx-10 -mt-8 mb-6 flex items-center gap-3 border-b border-warning bg-warning/20 px-10 py-3 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p><b>Faltam {c.diasRestantes} dias</b> para o fim do {c.rotulo}. Revise o ROT e os logs forenses até {fmt(c.congelamento)}.</p>
        </div>
      )}
      {c.fase === "urgente7" && (
        <div className="-mx-10 -mt-8 mb-6 flex items-center gap-3 border-b border-destructive bg-destructive px-10 py-3 text-sm text-destructive-foreground">
          <Siren className="h-5 w-5 shrink-0" />
          <p><b>Urgente · {c.diasRestantes} dias.</b> O Snapshot Imutável de Governança será congelado em <b>{fmt(c.congelamento)}</b>, com emissão do PI-05.</p>
        </div>
      )}
      <Dialog open={welcome} onOpenChange={setWelcome}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><PartyPopper className="h-5 w-5" /> Bem-vindo ao {c.rotulo}</DialogTitle>
            <DialogDescription>O semestre anterior foi arquivado com segurança e o histórico ficou preservado. Comece pela revisão do "Delta de Riscos" no Bloco 1: as respostas anteriores já vêm preenchidas, basta confirmar o que mudou.</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button asChild onClick={() => setWelcome(false)}><Link to="/bloco-1">Iniciar Delta de Riscos</Link></Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function FollowUpBell() {
  const c = cicloSemestral(new Date());
  const alerta = c.fase === "alerta30" || c.fase === "urgente7";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button aria-label="Notificações" className="relative rounded-sm border bg-card p-2 hover:bg-muted">
          <Bell className="h-4 w-4" />
          {alerta && <span className={cn("absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full", c.fase === "urgente7" ? "bg-destructive" : "bg-warning")} />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96">
        <p className="font-semibold text-primary">{c.rotulo}</p>
        <p className="text-xs text-muted-foreground">Faltam {c.diasRestantes} dias · congelamento em {fmt(c.congelamento)}</p>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">E-mails de follow-up de governança despachados (simulação)</p>
        <ul className="mt-2 space-y-2">
          {emails(c).map((e, i) => (
            <li key={i} className="flex gap-2 rounded-sm border p-2 text-xs">
              <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div><p className="font-medium">{e.assunto}</p><p className="text-muted-foreground">Para: caixa do {e.para} · {fmt(e.quando)}</p></div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
