import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Lock, RefreshCw } from "lucide-react";
import { BLOCKS, computeGM, riskZone } from "@/lib/priva/data";
import { useQuestions, useRespostas } from "@/lib/priva/questions";
import { usePriva, isUnlocked } from "@/lib/priva/store";
import { PageHeader, Panel, Tag } from "@/components/priva/ui";
import { cn } from "@/lib/utils";
import { AdminDashboard, CSuiteDashboard } from "@/components/priva/RoleDashboards";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Esteira BLLOCO — PRIVA 2EC" },
      { name: "description", content: "Linha de montagem da conformidade: 5 blocos sequenciais sob o Ciclo PRIVA." },
      { property: "og:title", content: "Esteira BLLOCO — PRIVA 2EC" },
      { property: "og:description", content: "Linha de montagem da conformidade: 5 blocos sequenciais sob o Ciclo PRIVA." },
    ],
  }),
  component: Painel,
});

function Painel() {
  const { role } = usePriva();
  if (role === "ADMIN_SISTEMA") return <AdminDashboard />;
  if (role === "C_SUITE") return <CSuiteDashboard />;
  return <Index />;
}

function Index() {
  const { signatures, cnpj, enterprise, audit, kanban } = usePriva();
  const answers = useRespostas(cnpj);
  const questions = useQuestions();
  const { gm, score, bankMax } = computeGM(answers, questions);
  const zone = riskZone(gm);
  const done = BLOCKS.filter((b) => signatures[`PI-0${b.n}`]).length;

  return (
    <div>
      <PageHeader eyebrow={`Trilho ${enterprise ? "Enterprise" : "Core"} · Método BLLOCO`} title="Onboarding Industrial · Esteira de Conformidade">
        Cada bloco produz um Produto Interno (PI). O próximo bloco só é liberado após a chancela digital do anterior. Ao fim do bloco A, o ciclo retroalimenta o bloco P.
      </PageHeader>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Stat label="Grau de Maturidade" value={`${gm.toFixed(1)}%`} sub={<Tag tone={zone.tone}>{zone.label}</Tag>} />
        <Stat label="Score" value={`${score} / ${bankMax}`} sub="pontos ponderados" />
        <Stat label="PIs chancelados" value={`${done} / 5`} sub={enterprise ? "+ PI-06 Enterprise" : "Trilho Core"} />
        <Stat label="Eventos auditados" value={String(audit.length)} sub={`${kanban.filter((k) => k.column !== "done").length} ações 5W2H abertas`} />
      </div>

      <Panel title="Linha de montagem">
        <div className="relative">
          <div className="absolute left-0 right-0 top-[38px] h-1 bg-[repeating-linear-gradient(90deg,var(--border)_0_12px,transparent_12px_20px)]" />
          <ol className="relative grid gap-4 md:grid-cols-5">
            {BLOCKS.map((b) => {
              const unlocked = isUnlocked(signatures, b.n);
              const ok = !!signatures[`PI-0${b.n}`];
              return (
                <li key={b.n} className="flex flex-col">
                  <div className={cn(
                    "mx-auto flex h-20 w-20 items-center justify-center rounded-md border-2 text-3xl font-semibold",
                    ok ? "border-success bg-success text-success-foreground" : unlocked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground",
                  )}>{b.letter}</div>
                  <div className="mt-4 flex-1 rounded-sm border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Bloco {b.n} · {b.pdca}</span>
                      {ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : !unlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-primary">{b.title}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{b.pi}</p>
                    {unlocked && (
                      <Link to={`/bloco-${b.n}` as "/bloco-1"} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        {ok ? "Revisar" : "Abrir bloco"} <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" /> Plan → Do → Check → Act → novo diagnóstico: a privacidade é um ciclo contínuo.
        </p>
      </Panel>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-primary">{value}</p>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
