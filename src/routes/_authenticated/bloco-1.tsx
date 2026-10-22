import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DEPARTMENTS, PERFECT_SCORE, computeGM, riskZone } from "@/lib/priva/data";
import { useQuestions } from "@/lib/priva/questions";
import { usePriva } from "@/lib/priva/store";
import { PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/bloco-1")({
  head: () => ({
    meta: [
      { title: "Bloco 1 · Preparar a Privacidade — PRIVA 2EC" },
      { name: "description", content: "Questionário mestre de 166 perguntas ponderadas por departamento." },
      { property: "og:title", content: "Bloco 1 · Preparar a Privacidade — PRIVA 2EC" },
      { property: "og:description", content: "Questionário mestre de 166 perguntas ponderadas por departamento." },
    ],
  }),
  component: Bloco1,
});

const ZONE_BG = { destructive: "bg-destructive", warning: "bg-warning", success: "bg-success" } as const;
const ZONE_TEXT = { destructive: "text-destructive", warning: "text-warning-foreground", success: "text-success" } as const;

function Gauge({ gm, tone }: { gm: number; tone: keyof typeof ZONE_BG }) {
  const angle = -90 + (Math.min(gm, 100) / 100) * 180;
  return (
    <svg viewBox="0 0 120 70" className="h-20 w-32">
      <path d="M10 60 A50 50 0 0 1 50.5 11" className="stroke-destructive" strokeWidth="10" fill="none" />
      <path d="M50.5 11 A50 50 0 0 1 93 25" className="stroke-warning" strokeWidth="10" fill="none" />
      <path d="M93 25 A50 50 0 0 1 110 60" className="stroke-success" strokeWidth="10" fill="none" />
      <g transform={`rotate(${angle} 60 60)`} className="transition-transform duration-500">
        <line x1="60" y1="60" x2="60" y2="18" className={cn("stroke-current", ZONE_TEXT[tone])} strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="60" cy="60" r="5" className="fill-primary" />
    </svg>
  );
}

function Bloco1() {
  const { answers, set } = usePriva();
  const questions = useQuestions();
  const [dept, setDept] = useState<string>(DEPARTMENTS[0]);
  const { gm, score, raw, bankMax } = computeGM(answers, questions);
  const zone = riskZone(gm);
  const answered = questions.filter((q) => q.id in answers).length;
  const qs = questions.filter((q) => q.department === dept);

  const answer = (id: number, v: boolean) =>
    set({ answers: { ...answers, [id]: v } }, { op: "UPDATE", target: "diagnostico", detail: `Q${id}=${v ? "SIM" : "NÃO"}` });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 1 · (P) Plan" title="Preparar a Privacidade">
        Questionário Mestre ponderado. SIM soma o peso da pergunta ao Score Alcançado (SA); NÃO soma zero.
      </PageHeader>

      {/* Card flutuante de resultado */}
      <div className="sticky top-0 z-10 -mx-2 rounded-md border bg-card/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-6">
          <Gauge gm={gm} tone={zone.tone} />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Grau de Maturidade</p>
            <p className={cn("font-mono text-3xl font-semibold", ZONE_TEXT[zone.tone])}>{gm.toFixed(1)}%</p>
            <Tag tone={zone.tone}>{zone.label}</Tag>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            <p>GM = (SA / {PERFECT_SCORE}) × 100</p>
            <p className="mt-1 text-foreground">GM = ({score} / {PERFECT_SCORE}) × 100 = {gm.toFixed(1)}%</p>
            <p className="mt-1">SA bruto {raw} de {bankMax} pts, reescalado para {PERFECT_SCORE}</p>
          </div>
          <div className="ml-auto min-w-48 flex-1">
            <div className="flex justify-between text-xs text-muted-foreground"><span>Progresso</span><span className="font-mono">{answered}/{questions.length}</span></div>
            <div className="mt-1 h-2 rounded-sm bg-muted"><div className={cn("h-2 rounded-sm transition-all", ZONE_BG[zone.tone])} style={{ width: `${questions.length ? (answered / questions.length) * 100 : 0}%` }} /></div>
            <Button variant="link" size="sm" className="h-auto px-0" onClick={() => {
              const all: Record<number, boolean> = {};
              questions.forEach((q) => (all[q.id] = (q.id * 13) % 10 < 6));
              set({ answers: all }, { op: "INSERT", target: "diagnostico", detail: "Preenchimento de demonstração" });
            }}>Preencher demonstração</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav className="space-y-1">
          {DEPARTMENTS.map((d) => {
            const list = questions.filter((q) => q.department === d);
            const a = list.filter((q) => q.id in answers).length;
            return (
              <button key={d} onClick={() => setDept(d)} className={cn(
                "flex w-full items-center justify-between rounded-sm border-l-4 px-3 py-2 text-left text-sm transition-colors",
                d === dept ? "border-primary bg-card font-semibold text-primary" : "border-transparent hover:bg-card",
              )}>
                {d}<span className="font-mono text-xs text-muted-foreground">{a}/{list.length}</span>
              </button>
            );
          })}
        </nav>

        <Panel title={`${dept} · ${qs.length} perguntas`}>
          {!questions.length && <p className="text-sm text-muted-foreground">Carregando banco de perguntas…</p>}
          <ul className="space-y-3">
            {qs.map((q) => (
              <li key={q.id} className="rounded-sm border bg-background p-4">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs text-muted-foreground">Q{q.id}</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{q.principle} · peso {q.weight}</p>
                    <p className="mt-1 text-sm">{q.text}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button size="lg" variant={answers[q.id] === true ? "default" : "outline"} onClick={() => answer(q.id, true)}>SIM {answers[q.id] === true && `+${q.weight}`}</Button>
                  <Button size="lg" variant={answers[q.id] === false ? "default" : "outline"} onClick={() => answer(q.id, false)}>NÃO</Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <PIOutput pi="PI-01: Dossiê Legal de Alinhamento de Privacidade" ready={questions.length > 0 && answered === questions.length} readyHint={`Responda todas as perguntas (${answered}/${questions.length}).`}>
        <h3 className="font-semibold">1. Resultado do diagnóstico</h3>
        <p>Grau de Maturidade: <b>{gm.toFixed(1)}%</b> ({score}/{PERFECT_SCORE}) — {zone.label}.</p>
        <h3 className="mt-4 font-semibold">2. Aderência por departamento</h3>
        <ul className="list-disc pl-5">
          {DEPARTMENTS.map((d) => {
            const s = questions.filter((q) => q.department === d);
            return <li key={d}>{d}: {s.filter((q) => answers[q.id]).length}/{s.length} controles atendidos</li>;
          })}
        </ul>
        <h3 className="mt-4 font-semibold">3. Fundamentação</h3>
        <p>Lei 13.709/2018 (LGPD), ISO/IEC 27701:2019 e Resolução CD/ANPD nº 2/2022.</p>
      </PIOutput>
    </div>
  );
}
