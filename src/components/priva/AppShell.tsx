import { PrivaciumLogo } from "@/components/priva/Logo";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Lock, CheckCircle2, LayoutDashboard, KanbanSquare, ScrollText, Building2, RotateCcw, LogOut, Users, Presentation, X, BookOpen, BookA, Menu, ListChecks, ShieldCheck } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BLOCKS, ROLE_LABEL, isValidCNPJ, maskCNPJ, type Role } from "@/lib/priva/data";
import { usePriva, isUnlocked } from "@/lib/priva/store";
import { Button } from '@/components/ui/button';
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { FollowUpBanner, FollowUpBell } from "@/components/priva/FollowUp";
import { ProximoPasso } from "@/components/priva/ProximoPasso";
import { AvisoModoDemo } from "@/components/priva/AvisoModoDemo";
import { avisarAcaoDemo } from '@/lib/priva/demoAction';
import { useEnquadramento } from '@/lib/priva/useEnquadramento';
import { rotuloPorte } from '@/lib/priva/enquadramento';
import { Tag } from './ui';

const ROLE_ACCESS: Record<Role, string[]> = {
  ADMIN_SISTEMA: ["/painel", "/auditoria", "/kanban", "/pendencias", "/membros", "/manual", "/glossario", "/qualidade-normativa", "/solicitacoes-titular"],
  DPO_OPERACIONAL: ["/painel", "/bloco", "/kanban", "/pendencias", "/auditoria", "/enterprise", "/manual", "/membros", "/glossario", "/qualidade-normativa", "/solicitacoes-titular"],
  C_SUITE: ["/painel", "/enterprise", "/kanban", "/pendencias", "/auditoria", "/manual", "/membros", "/glossario", "/qualidade-normativa"],
};
const SENSITIVE = [
  { path: "/bloco-2", target: "inventario_dados_pessoais" },
  { path: "/auditoria", target: "titulares" },
  { path: "/bloco-5", target: "ripd" },
];
export function canAccess(role: Role, path: string) {
  return ROLE_ACCESS[role].some((p) => path.startsWith(p));
}

export function AppShell({ children }: { children: ReactNode }) {
  const enquadramento = useEnquadramento();
  const { role, roles, setRole, set, enterprise, signatures, reset, ready, email, cnpj, empresas, selectEmpresa, createEmpresa, log, demo, publicDemo, setDemo } = usePriva();
  const [demoAsk, setDemoAsk] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const podeDemo = roles.includes("ADMIN_SISTEMA") || roles.includes("DPO_OPERACIONAL");
  const navigate = useNavigate();
  const { pathname, searchStr } = useLocation();
  const [novo, setNovo] = useState({ cnpj: "", razao: "", err: "" });
  const lastRead = useRef("");
  const [suspensa, setSuspensa] = useState(false);
  useEffect(() => {
    if (demo) { setSuspensa(false); return; }
    if (!cnpj || roles.includes("ADMIN_SISTEMA")) { setSuspensa(false); return; }
    void supabase.rpc("empresa_ativa", { _cnpj: cnpj }).then(({ data }) => setSuspensa(data === false));
  }, [cnpj, roles, demo]);
  // Rastreabilidade forense: abertura de telas com dados pessoais registra leitura
  useEffect(() => {
    if (!ready || !cnpj || !roles.length) return;
    const sensitive = SENSITIVE.find((p) => pathname.startsWith(p.path));
    const key = `${cnpj}|${pathname}|${role}`;
    if (sensitive && lastRead.current !== key && (demo || canAccess(role, pathname))) {
      lastRead.current = key;
      log("SELECT", sensitive.target, `Leitura da tela ${pathname}`);
    }
  }, [ready, cnpj, pathname, role, roles.length, log]);
  const submitEmpresa = async () => {
    if (!isValidCNPJ(novo.cnpj)) return setNovo((n) => ({ ...n, err: "CNPJ inválido." }));
    if (!novo.razao.trim()) return setNovo((n) => ({ ...n, err: "Informe a razão social." }));
    const err = await createEmpresa(novo.cnpj, novo.razao);
    setNovo(err ? { ...novo, err } : { cnpj: "", razao: "", err: "" });
  };
  const empresaForm = (
    <div className="space-y-2">
      <input value={novo.cnpj} onChange={(e) => setNovo({ ...novo, cnpj: e.target.value, err: "" })} placeholder="CNPJ (14 dígitos)" className="w-full rounded-sm border bg-background px-2 py-1.5 text-sm text-foreground" />
      <input value={novo.razao} onChange={(e) => setNovo({ ...novo, razao: e.target.value, err: "" })} placeholder="Razão social" className="w-full rounded-sm border bg-background px-2 py-1.5 text-sm text-foreground" />
      {novo.err && <p className="text-xs text-destructive">{novo.err}</p>}
      <button onClick={submitEmpresa} className="w-full rounded-sm bg-primary px-2 py-1.5 text-sm text-primary-foreground">Cadastrar CNPJ</button>
    </div>
  );
  const signOut = async () => { if (!publicDemo) await supabase.auth.signOut(); navigate({ to: "/auth" }); };

  if (!ready) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  if (!roles.length) return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="max-w-md rounded-md border bg-card p-10 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold text-primary">Aguardando liberação</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sua conta ({email}) foi criada. Um administrador precisa atribuir seu cargo (DPO, C-Suite ou Administrador) antes do acesso.</p>
        <button onClick={signOut} className="mt-6 text-sm text-primary hover:underline">Sair</button>
      </div>
    </div>
  );
  if (!cnpj) return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-md rounded-md border bg-card p-10">
        <Building2 className="h-8 w-8 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold text-primary">Cadastre a primeira empresa</h1>
        <p className="mt-2 mb-4 text-sm text-muted-foreground">O progresso do Método BLLOCO é amarrado a cada CNPJ.</p>
        {role === "C_SUITE" ? <p className="text-sm text-muted-foreground">Peça ao DPO ou administrador para cadastrar.</p> : empresaForm}
        <button onClick={signOut} className="mt-6 text-sm text-primary hover:underline">Sair</button>
      </div>
    </div>
  );
  const allowed = (demo || canAccess(role, pathname));

  const item = (to: string, label: ReactNode, icon: ReactNode, extra?: ReactNode, locked = false) => {
    if (demo && ['/membros', '/enterprise', '/solicitacoes-titular'].includes(to)) return null;
    if (!(demo || canAccess(role, to))) return null;
    const active = publicDemo ? (searchStr.includes(`aba=${to.slice(1)}`)) : pathname.startsWith(to);
    return (
      <Link
        to={publicDemo ? '/demo' : to as "/"}
        search={publicDemo ? { aba: to.slice(1) } : {}}
        className={cn(
          "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
          active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60",
          locked && "opacity-50",
        )}
      >
        {icon}
        <span className="flex-1 leading-tight">{label}</span>
        {extra}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="flex items-center justify-between border-b p-4 md:hidden"><PrivaciumLogo size="sm" /><Button variant="outline" size="icon" aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuAberto} onClick={() => setMenuAberto(v => !v)}>{menuAberto ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</Button></div>
      <aside className={cn("top-0 h-auto w-full shrink-0 flex-col bg-sidebar text-sidebar-foreground md:sticky md:flex md:h-screen md:w-72", menuAberto ? 'flex' : 'hidden')}>
        <div className="border-b border-sidebar-border px-5 py-5">
          <PrivaciumLogo size="sm" className="text-sidebar-accent-foreground" />
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em]">Governança de Privacidade</p>
        </div>
        <div className="border-b border-sidebar-border px-5 py-4">
          <label className="font-mono text-[10px] uppercase tracking-widest">Painel (RBAC)</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="mt-1 w-full rounded-sm border border-sidebar-border bg-sidebar-accent px-2 py-1.5 text-sm text-sidebar-accent-foreground"
          >
            {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </div>
        <div className="border-b border-sidebar-border px-5 py-4">
          <label className="font-mono text-[10px] uppercase tracking-widest">Empresa (CNPJ)</label>
          <select
            value={cnpj}
            onChange={(e) => selectEmpresa(e.target.value)}
            className="mt-1 w-full rounded-sm border border-sidebar-border bg-sidebar-accent px-2 py-1.5 text-sm text-sidebar-accent-foreground"
          >
            {empresas.map((e) => <option key={e.cnpj} value={e.cnpj}>{maskCNPJ(e.cnpj)} · {e.razao_social}</option>)}
          </select>
          {role !== "C_SUITE" && !demo && (
            <details className="mt-2 text-xs"><summary className="cursor-pointer opacity-70">+ Nova empresa</summary><div className="mt-2">{empresaForm}</div></details>
          )}
        </div>
        {podeDemo && (
          <div className="border-b border-sidebar-border px-5 py-3">
            <button onClick={() => (demo ? publicDemo ? void navigate({ to: '/auth' }) : setDemo(false) : setDemoAsk(true))}
              className={cn("flex w-full items-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium", demo ? "border-warning bg-warning text-warning-foreground" : "border-sidebar-primary text-sidebar-accent-foreground hover:bg-sidebar-accent")}>
              <Presentation className="h-4 w-4" /> {demo ? "Encerrar Demonstração" : "Modo Demonstração Comercial"}
            </button>
          </div>
        )}
        <nav className="flex-1 space-y-1 overflow-auto px-3 py-4">
          {item("/painel", "Esteira BLLOCO", <LayoutDashboard className="h-4 w-4" />)}
          {(demo || canAccess(role, "/bloco")) && <p className="px-3 pb-1 pt-4 font-mono text-[10px] uppercase tracking-widest">Ciclo Privacium Semestral</p>}
          {BLOCKS.map((b) => {
            const unlocked = isUnlocked(signatures, b.n) && (b.n === 1 || demo || enquadramento.vigente);
            const done = !!signatures[`PI-0${b.n}`];
            return (
              <div key={b.n}>
                {item(
                  `/bloco-${b.n}`,
                  <><span className="font-mono text-sidebar-primary">{b.letter}</span> · {b.title}</>,
                  <span className="font-mono text-xs">{b.n}</span>,
                  done ? <CheckCircle2 className="h-4 w-4 text-sidebar-primary" /> : !unlocked ? <Lock className="h-3 w-3" /> : null,
                  !unlocked,
                )}
              </div>
            );
          })}
          <p className="px-3 pb-1 pt-4 font-mono text-[10px] uppercase tracking-widest">Transversal</p>
          {item("/pendencias", "Dashboard · Pendências", <ListChecks className="h-4 w-4" />)}
          {item("/kanban", "Kanban 5W2H · Plano de ação", <KanbanSquare className="h-4 w-4" />)}
          {item("/auditoria", "Trilha de Auditoria (Trilho Core)", <ScrollText className="h-4 w-4" />)}
          {item("/qualidade-normativa", "Qualidade normativa", <ShieldCheck className="h-4 w-4" />)}
          {item("/solicitacoes-titular", "Solicitações de titulares", <Users className="h-4 w-4" />)}
          {item("/manual", "Manual de Uso", <BookOpen className="h-4 w-4" />)}
          {item("/glossario", "Glossário", <BookA className="h-4 w-4" />)}
          {publicDemo && item('/encarregado', 'Encarregado (DPO)', <Users className="h-4 w-4" />)}
          {item("/membros", "Membros e cargos", <Users className="h-4 w-4" />)}
          {item("/enterprise", "Enterprise", <Building2 className="h-4 w-4" />, enterprise ? null : <Lock className="h-3 w-3" />)}
        </nav>
        <div className="space-y-3 border-t border-sidebar-border px-5 py-4 text-xs">
          <label className="flex items-center justify-between gap-2">
            <span>Gatilho Crítico de Migração<br /><span className="text-[10px] opacity-70">&gt;10 mil titulares/mês ou S.A.</span></span>
            <Switch
              checked={enterprise}
              onCheckedChange={(v) => demo ? avisarAcaoDemo() : set({ enterprise: v }, { op: "UPDATE", target: "tenant", detail: `Trilho ${v ? "Enterprise" : "Core"}` })}
            />
          </label>
          <p className="truncate opacity-70">{email}</p>
          <div className="flex justify-between">
            {roles.includes("ADMIN_SISTEMA") && <button onClick={reset} className="flex items-center gap-1 opacity-70 hover:opacity-100"><RotateCcw className="h-3 w-3" /> Reiniciar esteira</button>}
            <button onClick={signOut} className="flex items-center gap-1 opacity-70 hover:opacity-100"><LogOut className="h-3 w-3" /> Sair</button>
          </div>
        </div>
      </aside>
      <main className="relative min-w-0 flex-1 px-4 py-8 sm:px-10">
        <AvisoModoDemo />
        <div className="mb-5 flex flex-wrap items-center gap-3" data-testid="cabecalho-porte"><span className="text-xs font-semibold">Ciclo Privacium Semestral</span><Tag tone={enquadramento.porte ? 'primary' : 'warning'}>{enquadramento.porte ? rotuloPorte(enquadramento.porte) : 'Enquadramento pendente — assinatura do DPO'}</Tag></div>
        {(role === "DPO_OPERACIONAL" || role === "C_SUITE") && !demo && <FollowUpBanner />}
        {(role === "DPO_OPERACIONAL" || role === "C_SUITE") && <div className="mb-4 flex justify-end"><FollowUpBell /></div>}
        <AlertDialog open={demoAsk} onOpenChange={setDemoAsk}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><Presentation className="h-5 w-5" /> Modo Demonstração Comercial</AlertDialogTitle>
              <AlertDialogDescription>Deseja ativar o ambiente de simulação comercial? O sistema injetará dados fictícios realistas em todos os blocos para apresentação ao vivo a potenciais clientes, sem alterar os dados reais de produção.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setDemo(true); if (role !== "DPO_OPERACIONAL" && roles.includes("DPO_OPERACIONAL")) setRole("DPO_OPERACIONAL"); navigate({ to: "/painel" }); }}>Ativar demonstração</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {suspensa ? (
          <div className="rounded-md border border-destructive bg-card p-16 text-center">
            <Lock className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-4 font-semibold text-primary">Acesso suspenso</p>
            <p className="mt-1 text-sm text-muted-foreground">O contrato deste CNPJ está INATIVO. Entre em contato com a Privacium para reativar.</p>
          </div>
        ) : allowed ? <><ProximoPasso />{children}</> : (
          <div className="rounded-md border border-dashed bg-card p-16 text-center">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-4 font-semibold text-primary">Acesso negado pelo princípio do privilégio mínimo</p>
            <p className="mt-1 text-sm text-muted-foreground">O painel {ROLE_LABEL[role]} não tem necessidade de conhecer este conteúdo.</p>
          </div>
        )}
      </main>
    </div>
  );
}
