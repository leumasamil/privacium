import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DOMAINS, QUESTIONS, computeGM, riskZone } from "@/lib/priva/data";
import { usePriva } from "@/lib/priva/store";
import { PageHeader, Panel, PIOutput, Tag } from "@/components/priva/ui";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bloco-1")({
  head: () => ({
    meta: [
      { title: "Bloco 1 · Preparar a Privacidade — PRIVA 2EC" },
      { name: "description", content: "Diagnóstico de entrada com 166 perguntas e Nota Fiscal de Risco." },
      { property: "og:title", content: "Bloco 1 · Preparar a Privacidade — PRIVA 2EC" },
      { property: "og:description", content: "Diagnóstico de entrada com 166 perguntas e Nota Fiscal de Risco." },
    ],
  }),
  component: Bloco1,
});

function Bloco1() {
  const { answers, set } = usePriva();
  const [domain, setDomain] = useState(DOMAINS[0]);
  const { gm, score } = computeGM(answers);
  const zone = riskZone(gm);
  const answered = Object.keys(answers).length;
  const qs = QUESTIONS.filter((q) => q.domain === domain);

  const answer = (id: number, v: boolean) =>
    set({ answers: { ...answers, [id]: v } }, { op: "UPDATE", target: "diagnostico", detail: `Q${id}=${v ? "SIM" : "NÃO"}` });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Bloco 1 · (P) Plan" title="Preparar a Privacidade">
        Questionário mestre de 166 perguntas binárias. SIM soma o peso ponderado (1 a 10); NÃO computa zero. GM = (Score Alcançado / 1660) × 100.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel title={`Diagnóstico de entrada · ${answered}/166`}>
          <div className="mb-4 flex flex-wrap gap-2">
            {DOMAINS.map((d) => {
              const n = QUESTIONS.filter((q) => q.domain === d);
              const a = n.filter((q) => q.id in answers).length;
              return (
                <button key={d} onClick={() => setDomain(d)} className={cn("rounded-sm border px-3 py-1 text-xs", d === domain ? "border-primary bg-primary text-primary-foreground" : "bg-background")}>
                  {d} <span className="opacity-60">{a}/{n.length}</span>
                </button>
              );
            })}
          </div>
          <ul className="divide-y">
            {qs.map((q) => (
              <li key={q.id} className="flex items-center gap-4 py-2.5">
                <span className="w-10 font-mono text-xs text-muted-foreground">Q{q.id}</span>
                <span className="flex-1 text-sm">{q.text}</span>
                <span className="font-mono text-[10px] text-muted-foreground">peso {q.weight}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant={answers[q.id] === true ? "default" : "outline"} onClick={() => answer(q.id, true)}>SIM</Button>
                  <Button size="sm" variant={answers[q.id] === false ? "default" : "outline"} onClick={() => answer(q.id, false)}>NÃO</Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-6">
          <Panel title="Nota Fiscal de Risco">
            <p className="font-mono text-4xl font-semibold text-primary">{gm.toFixed(1)}%</p>
            <p className="font-mono text-xs text-muted-foreground">{score} / 1660 pontos</p>
            <div className="mt-4 flex h-3 overflow-hidden rounded-sm">
              <div className="w-[40%] bg-destructive" /><div className="w-[35%] bg-warning" /><div className="w-[25%] bg-success" />
            </div>
            <div className="relative h-3"><div className="absolute -top-1 h-5 w-0.5 bg-foreground" style={{ left: `${gm}%` }} /></div>
            <div className="mt-2"><Tag tone={zone.tone}>{zone.label}</Tag></div>
            <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
              <li>0–40% · Vulnerabilidade Crítica</li><li>41–75% · Conformidade Tática</li><li>76–100% · Blindagem Sistêmica</li>
            </ul>
            <Progress value={(answered / 166) * 100} className="mt-4" />
          </Panel>
          <Button variant="outline" className="w-full" onClick={() => {
            const all: Record<number, boolean> = {};
            QUESTIONS.forEach((q) => (all[q.id] = (q.id * 13) % 10 < 6));
            set({ answers: all }, { op: "INSERT", target: "diagnostico", detail: "Preenchimento de demonstração" });
          }}>Preencher demonstração</Button>
        </div>
      </div>

      <PIOutput pi="PI-01: Dossiê Legal de Alinhamento de Privacidade" ready={answered === 166} readyHint={`Responda todas as perguntas (${answered}/166).`}>
        <h3 className="font-semibold">1. Resultado do diagnóstico</h3>
        <p>Grau de Maturidade: <b>{gm.toFixed(1)}%</b> ({score}/1660) — {zone.label}.</p>
        <h3 className="mt-4 font-semibold">2. Aderência por domínio</h3>
        <ul className="list-disc pl-5">
          {DOMAINS.map((d) => {
            const s = QUESTIONS.filter((q) => q.domain === d);
            const ok = s.filter((q) => answers[q.id]).length;
            return <li key={d}>{d}: {ok}/{s.length} controles atendidos</li>;
          })}
        </ul>
        <h3 className="mt-4 font-semibold">3. Fundamentação</h3>
        <p>Lei 13.709/2018 (LGPD), ISO/IEC 27701:2019 e Resolução CD/ANPD nº 2/2022 (agentes de pequeno porte).</p>
      </PIOutput>
    </div>
  );
}
