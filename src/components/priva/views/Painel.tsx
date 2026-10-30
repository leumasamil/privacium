import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Lock, RefreshCw } from "lucide-react";
import { BLOCKS, computeGM } from "@/lib/priva/data";
import { CardAcoes, CardEventos, CardGM, CardPIs, CardScore } from "@/components/priva/Indicadores";
import { Sigla } from "@/components/priva/Sigla";
import { useQuestions, useRespostas } from "@/lib/priva/questions";
import { usePriva, isUnlocked } from "@/lib/priva/store";
import { PageHeader, Panel } from "@/components/priva/ui";
import { cn } from "@/lib/utils";
import { AdminDashboard, CSuiteDashboard } from "@/components/priva/RoleDashboards";



export function Painel() {
  const { role, demo } = usePriva();
  if (role === "ADMIN_SISTEMA" && !demo) return <AdminDashboard />;
  if (role === "C_SUITE") return <CSuiteDashboard />;
  return <Index />;
}

function Index() {
  const { signatures, cnpj, enterprise, audit, kanban } = usePriva();
  const answers = useRespostas(cnpj);
  const questions = useQuestions();
  const { gm, score, bankMax } = computeGM(answers, questions);

  return (
    <div>
      <PageHeader eyebrow={`Trilho ${enterprise ? "Enterprise" : "Core (registrador central de eventos)"} · Método BLLOCO`} title="Onboarding Industrial · Esteira de Conformidade">
        Cada bloco produz um <Sigla id="pi">PI · Procedimento Interno</Sigla> chancelado. O próximo bloco só é liberado após a chancela digital do anterior. Ao fim do bloco A, o ciclo retroalimenta o bloco P.
      </PageHeader>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CardGM gm={gm} />
        <CardScore score={score} max={bankMax} />
        <CardPIs signatures={signatures} enterprise={enterprise} />
        <CardEventos total={audit.length} />
        <CardAcoes abertas={kanban.filter((k) => k.column !== "done").length} />
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
          <RefreshCw className="h-3 w-3" /> Preparar → Registrar → Implementar → Vigiar → Auditar → novo diagnóstico: a privacidade é um ciclo contínuo.
        </p>
      </Panel>
    </div>
  );
}
