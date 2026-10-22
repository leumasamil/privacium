import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";
import { Lock, CheckCircle2, LayoutDashboard, KanbanSquare, ScrollText, Building2, RotateCcw, LogOut, Users } from "lucide-react";
import { BLOCKS, ROLE_LABEL, type Role } from "@/lib/priva/data";
import { usePriva, isUnlocked } from "@/lib/priva/store";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const ROLE_ACCESS: Record<Role, string[]> = {
  admin: ["/painel", "/auditoria", "/kanban", "/membros"],
  dpo: ["/painel", "/bloco", "/kanban", "/auditoria", "/enterprise"],
  csuite: ["/painel", "/enterprise", "/kanban"],
};
export function canAccess(role: Role, path: string) {
  return ROLE_ACCESS[role].some((p) => path.startsWith(p));
}

export function AppShell({ children }: { children: ReactNode }) {
  const { role, roles, setRole, set, enterprise, signatures, reset, ready, email } = usePriva();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); };

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
  const allowed = canAccess(role, pathname);

  const item = (to: string, label: ReactNode, icon: ReactNode, extra?: ReactNode, locked = false) => {
    if (!canAccess(role, to)) return null;
    const active = pathname.startsWith(to);
    return (
      <Link
        to={to as "/"}
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
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="border-b border-sidebar-border px-5 py-5">
          <p className="text-lg font-semibold tracking-tight text-sidebar-accent-foreground">PRIVA <span className="text-sidebar-primary">2EC</span></p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Governança de Privacidade</p>
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
        <nav className="flex-1 space-y-1 overflow-auto px-3 py-4">
          {item("/painel", "Esteira BLLOCO", <LayoutDashboard className="h-4 w-4" />)}
          {canAccess(role, "/bloco") && <p className="px-3 pb-1 pt-4 font-mono text-[10px] uppercase tracking-widest">Ciclo PDCA</p>}
          {BLOCKS.map((b) => {
            const unlocked = isUnlocked(signatures, b.n);
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
          {item("/kanban", "Kanban 5W2H", <KanbanSquare className="h-4 w-4" />)}
          {item("/auditoria", "Trilha de Auditoria", <ScrollText className="h-4 w-4" />)}
          {item("/membros", "Membros e cargos", <Users className="h-4 w-4" />)}
          {item("/enterprise", "Enterprise", <Building2 className="h-4 w-4" />, enterprise ? null : <Lock className="h-3 w-3" />)}
        </nav>
        <div className="space-y-3 border-t border-sidebar-border px-5 py-4 text-xs">
          <label className="flex items-center justify-between gap-2">
            <span>Gatilho Crítico de Migração<br /><span className="text-[10px] opacity-70">&gt;10 mil titulares/mês ou S.A.</span></span>
            <Switch
              checked={enterprise}
              onCheckedChange={(v) => set({ enterprise: v }, { op: "UPDATE", target: "tenant", detail: `Trilho ${v ? "Enterprise" : "Core"}` })}
            />
          </label>
          <p className="truncate opacity-70">{email}</p>
          <div className="flex justify-between">
            {roles.includes("admin") && <button onClick={reset} className="flex items-center gap-1 opacity-70 hover:opacity-100"><RotateCcw className="h-3 w-3" /> Reiniciar esteira</button>}
            <button onClick={signOut} className="flex items-center gap-1 opacity-70 hover:opacity-100"><LogOut className="h-3 w-3" /> Sair</button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-10 py-8">
        {allowed ? children : (
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
